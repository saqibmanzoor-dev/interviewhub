import InterviewEvaluation from '../models/InterviewEvaluation.js';
import Interview from '../models/Interview.js';
import Notification from '../models/Notification.js';
import AnalyticsEvent from '../models/AnalyticsEvent.js';

export async function createEvaluation(req, res, next) {
  try {
    const { interviewId } = req.params;
    const { ratings, recommendation, candidateFeedback, privateNotes } = req.body;

    const interview = await Interview.findById(interviewId);
    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview not found.' });
    }

    if (!['interviewer', 'recruiter', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Only interviewers, recruiters, or admins can submit evaluations.' });
    }

    // Upsert or create evaluation
    let evaluation = await InterviewEvaluation.findOne({ interviewId, evaluatorId: req.user._id });
    if (evaluation) {
      evaluation.ratings = ratings || evaluation.ratings;
      evaluation.recommendation = recommendation || evaluation.recommendation;
      evaluation.candidateFeedback = candidateFeedback !== undefined ? candidateFeedback : evaluation.candidateFeedback;
      evaluation.privateNotes = privateNotes !== undefined ? privateNotes : evaluation.privateNotes;
      evaluation.submittedAt = new Date();
      await evaluation.save();
    } else {
      evaluation = await InterviewEvaluation.create({
        interviewId,
        evaluatorId: req.user._id,
        candidateId: interview.candidateId,
        ratings,
        recommendation,
        candidateFeedback,
        privateNotes,
        submittedAt: new Date()
      });
    }

    // Notify candidate if feedback was provided
    if (candidateFeedback && candidateFeedback.trim() && interview && interview.candidateId) {
      await Notification.create({
        recipientId: interview.candidateId,
        type: 'feedback_submitted',
        title: 'Interview Feedback Available',
        message: `Feedback for your interview "${interview.title}" has been submitted.`,
        relatedInterviewId: interview._id
      }).catch(() => {});
    }

    try {
      if (AnalyticsEvent && req.user?._id) {
        AnalyticsEvent.create({
          actorId: req.user._id,
          eventType: 'evaluation_submitted',
          interviewId: interview?._id,
          metadata: { recommendation, overallScore: ratings?.overallScore }
        }).catch(() => {});
      }
    } catch (e) {}

    res.status(201).json({ success: true, message: 'Evaluation submitted successfully.', data: evaluation });
  } catch (err) {
    next(err);
  }
}

export async function getEvaluationsByInterview(req, res, next) {
  try {
    const { interviewId } = req.params;
    const interview = await Interview.findById(interviewId);
    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview not found.' });
    }

    const evaluations = await InterviewEvaluation.find({ interviewId })
      .populate('evaluatorId', 'name email avatar title role')
      .populate('candidateId', 'name email avatar role');

    const isCandidate = req.user.role === 'candidate';

    // Strictly redact privateNotes for candidates
    const sanitized = evaluations.map(ev => {
      const obj = ev.toObject();
      if (isCandidate) {
        delete obj.privateNotes;
      }
      return obj;
    });

    res.json({ success: true, count: sanitized.length, data: sanitized });
  } catch (err) {
    next(err);
  }
}

export async function getCandidateEvaluations(req, res, next) {
  try {
    const { candidateId } = req.params;
    const isSelf = req.user._id.toString() === candidateId;

    if (!isSelf && !['interviewer', 'recruiter', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const evaluations = await InterviewEvaluation.find({ candidateId })
      .populate('interviewId', 'title scheduledStart actualDuration status')
      .populate('evaluatorId', 'name avatar title');

    const sanitized = evaluations.map(ev => {
      const obj = ev.toObject();
      if (isSelf && req.user.role === 'candidate') {
        delete obj.privateNotes;
      }
      return obj;
    });

    res.json({ success: true, count: sanitized.length, data: sanitized });
  } catch (err) {
    next(err);
  }
}

export async function getAllEvaluations(req, res, next) {
  try {
    const isCandidate = req.user.role === 'candidate';
    const query = isCandidate ? { candidateId: req.user._id } : {};

    const evaluations = await InterviewEvaluation.find(query)
      .populate('interviewId', 'title scheduledStart actualDuration status meetingCode')
      .populate('evaluatorId', 'name email avatar title role')
      .populate('candidateId', 'name email avatar role')
      .sort({ createdAt: -1 });

    const sanitized = evaluations.map(ev => {
      const obj = ev.toObject();
      if (isCandidate) {
        delete obj.privateNotes;
      }
      return obj;
    });

    res.json({ success: true, count: sanitized.length, data: sanitized });
  } catch (err) {
    next(err);
  }
}
