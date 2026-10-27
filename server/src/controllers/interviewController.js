import User from '../models/User.js';
import Interview from '../models/Interview.js';
import InterviewSession from '../models/InterviewSession.js';
import CodingChallenge from '../models/CodingChallenge.js';
import Notification from '../models/Notification.js';
import AnalyticsEvent from '../models/AnalyticsEvent.js';
import crypto from 'crypto';

function generateMeetingCode() {
  const p1 = Math.random().toString(36).substring(2, 5);
  const p2 = Math.random().toString(36).substring(2, 6);
  const p3 = Math.random().toString(36).substring(2, 5);
  return `${p1}-${p2}-${p3}`;
}

export async function createInterview(req, res, next) {
  try {
    const { title, description, candidateId, interviewerIds = [], scheduledStart, scheduledEnd, challengeId, candidateEmail, candidateName, scheduledAt, durationMinutes = 60 } = req.body;

    let finalCandidateId = candidateId;
    if (!finalCandidateId && candidateEmail) {
      let cand = await User.findOne({ email: candidateEmail.toLowerCase() });
      if (!cand) {
        cand = await User.create({
          name: candidateName || candidateEmail.split('@')[0],
          email: candidateEmail.toLowerCase(),
          passwordHash: '$2a$10$wT0lV3zD.d1234567890OepJ9eP950yT/Q39e3g8n8uQ78/S.',
          role: 'candidate',
          title: 'Software Engineer Candidate',
          emailVerified: true
        });
      }
      finalCandidateId = cand._id;
    }

    if (!finalCandidateId) {
      const anyCandidate = await User.findOne({ role: 'candidate' });
      finalCandidateId = anyCandidate ? anyCandidate._id : req.user._id;
    }

    const start = new Date(scheduledStart || scheduledAt || Date.now());
    const end = scheduledEnd ? new Date(scheduledEnd) : new Date(start.getTime() + (Number(durationMinutes) || 60) * 60000);

    if (!title) {
      return res.status(400).json({ success: false, message: 'Please provide an interview title.' });
    }

    let starterCode = '// Write your solution here\nfunction solution() {\n  return true;\n}\n';
    let defaultLang = 'javascript';

    if (challengeId) {
      const challenge = await CodingChallenge.findById(challengeId);
      if (challenge && challenge.starterCode?.javascript) {
        starterCode = challenge.starterCode.javascript;
      }
    }

    const meetingCode = generateMeetingCode();
    const meetingTokenHash = crypto.createHash('sha256').update(meetingCode + Date.now()).digest('hex');

    const interview = await Interview.create({
      title,
      description,
      candidateId: finalCandidateId,
      interviewerIds: interviewerIds.length > 0 ? interviewerIds : [req.user._id],
      scheduledStart: start,
      scheduledEnd: end,
      meetingCode,
      meetingTokenHash,
      challengeId: challengeId || null,
      activeCode: starterCode,
      activeLanguage: defaultLang,
      createdBy: req.user._id
    });

    // Send notifications
    await Notification.create({
      recipientId: finalCandidateId,
      type: 'interview_invite',
      title: 'Interview Invitation',
      message: `You have been invited to an interview: "${title}" scheduled for ${start.toLocaleString()}`,
      relatedInterviewId: interview._id
    });

    for (const intId of interview.interviewerIds) {
      if (intId.toString() !== req.user._id.toString()) {
        await Notification.create({
          recipientId: intId,
          type: 'interview_invite',
          title: 'Scheduled Interview Assignment',
          message: `You have been assigned as interviewer for: "${title}"`,
          relatedInterviewId: interview._id
        });
      }
    }

    await AnalyticsEvent.create({
      actorId: req.user._id,
      eventType: 'interview_scheduled',
      interviewId: interview._id,
      metadata: { candidateId, title, scheduledStart }
    });

    const populated = await Interview.findById(interview._id)
      .populate('candidateId', 'name email avatar role')
      .populate('interviewerIds', 'name email avatar role title')
      .populate('challengeId', 'title difficulty category');

    res.status(201).json({ success: true, message: 'Interview scheduled successfully.', data: populated });
  } catch (err) {
    next(err);
  }
}

export async function getInterviews(req, res, next) {
  try {
    const { status, role } = req.query;
    const query = {};

    if (status) {
      query.status = status;
    }

    // Role-based visibility
    if (req.user.role === 'candidate') {
      query.candidateId = req.user._id;
    } else if (req.user.role === 'interviewer') {
      // Show interviews where user is interviewer or created by user
      query.$or = [
        { interviewerIds: req.user._id },
        { createdBy: req.user._id }
      ];
    }
    // Recruiters and Admins see all org interviews

    const interviews = await Interview.find(query)
      .populate('candidateId', 'name email avatar role')
      .populate('interviewerIds', 'name email avatar role title')
      .populate('challengeId', 'title difficulty category')
      .sort({ scheduledStart: 1 });

    res.json({ success: true, count: interviews.length, data: interviews });
  } catch (err) {
    next(err);
  }
}

export async function getInterviewById(req, res, next) {
  try {
    const { id } = req.params;
    let interview;

    // Support lookup by MongoDB _id or meetingCode (e.g. abc-defg-hij)
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      interview = await Interview.findById(id);
    } else {
      interview = await Interview.findOne({ meetingCode: id });
    }

    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview not found.' });
    }

    // Check authorization: participant, recruiter, or admin
    const isCandidate = interview.candidateId.toString() === req.user._id.toString();
    const isInterviewer = interview.interviewerIds.some(i => i.toString() === req.user._id.toString());
    const isRecruiterOrAdmin = ['recruiter', 'admin'].includes(req.user.role);

    if (!isCandidate && !isInterviewer && !isRecruiterOrAdmin) {
      return res.status(403).json({ success: false, message: 'Access denied. You are not a participant in this interview.' });
    }

    const populated = await Interview.findById(interview._id)
      .populate('candidateId', 'name email avatar role')
      .populate('interviewerIds', 'name email avatar role title')
      .populate('challengeId');

    res.json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
}

export async function updateInterview(req, res, next) {
  try {
    const { id } = req.params;
    const { title, description, scheduledStart, scheduledEnd, status, challengeId, activeCode, activeLanguage } = req.body;

    const interview = await Interview.findById(id);
    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview not found.' });
    }

    if (title) interview.title = title;
    if (description !== undefined) interview.description = description;
    if (scheduledStart) interview.scheduledStart = new Date(scheduledStart);
    if (scheduledEnd) interview.scheduledEnd = new Date(scheduledEnd);
    if (status) interview.status = status;
    if (challengeId !== undefined) interview.challengeId = challengeId;
    if (activeCode !== undefined) interview.activeCode = activeCode;
    if (activeLanguage) interview.activeLanguage = activeLanguage;

    await interview.save();

    res.json({ success: true, message: 'Interview updated.', data: interview });
  } catch (err) {
    next(err);
  }
}

export async function joinInterview(req, res, next) {
  try {
    const { id } = req.params;
    const interview = await Interview.findOne({ $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { meetingCode: id }] });
    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview room not found.' });
    }

    if (interview.status === 'scheduled') {
      interview.status = 'in-progress';
      interview.actualStart = new Date();
      await interview.save();

      await AnalyticsEvent.create({
        actorId: req.user._id,
        eventType: 'interview_started',
        interviewId: interview._id
      });
    }

    let session = await InterviewSession.findOne({ interviewId: interview._id, sessionStatus: 'active' });
    if (!session) {
      session = await InterviewSession.create({
        interviewId: interview._id,
        participantIds: [req.user._id],
        startedAt: new Date()
      });
    } else if (!session.participantIds.includes(req.user._id)) {
      session.participantIds.push(req.user._id);
      await session.save();
    }

    const populated = await Interview.findById(interview._id)
      .populate('candidateId', 'name email avatar role')
      .populate('interviewerIds', 'name email avatar role title')
      .populate('challengeId');

    res.json({
      success: true,
      data: {
        interview: populated,
        sessionId: session._id,
        roleInInterview: interview.candidateId.toString() === req.user._id.toString() ? 'candidate' : 'interviewer'
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function endInterview(req, res, next) {
  try {
    const { id } = req.params;
    const interview = await Interview.findById(id);
    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview not found.' });
    }

    interview.status = 'completed';
    interview.actualEnd = new Date();
    await interview.save();

    await InterviewSession.updateMany(
      { interviewId: interview._id, sessionStatus: 'active' },
      { sessionStatus: 'closed', endedAt: new Date() }
    );

    const durationMinutes = Math.round((interview.actualEnd - (interview.actualStart || interview.scheduledStart)) / (1000 * 60));

    await AnalyticsEvent.create({
      actorId: req.user._id,
      eventType: 'interview_completed',
      interviewId: interview._id,
      metadata: { durationMinutes }
    });

    // Notify interviewers to submit evaluation
    for (const intId of interview.interviewerIds) {
      await Notification.create({
        recipientId: intId,
        type: 'evaluation_needed',
        title: 'Submit Interview Evaluation',
        message: `Please complete your candidate evaluation for "${interview.title}".`,
        relatedInterviewId: interview._id
      });
    }

    res.json({ success: true, message: 'Interview marked as completed.', data: interview });
  } catch (err) {
    next(err);
  }
}
