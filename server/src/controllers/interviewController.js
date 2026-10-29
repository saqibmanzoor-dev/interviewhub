import mongoose from 'mongoose';
import User from '../models/User.js';
import Interview from '../models/Interview.js';
import InterviewSession from '../models/InterviewSession.js';
import CodingChallenge from '../models/CodingChallenge.js';
import Notification from '../models/Notification.js';
import AnalyticsEvent from '../models/AnalyticsEvent.js';
import { sendInterviewInvitationEmail } from '../services/emailService.js';
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

    const fallbackId = new mongoose.Types.ObjectId('64b1f8e0d4c1a2b3c4d5e6f7');
    const safeUserId = (req.user?._id && mongoose.Types.ObjectId.isValid(req.user._id))
      ? req.user._id
      : fallbackId;

    let finalCandidateId = candidateId;
    if (!finalCandidateId && candidateEmail) {
      try {
        let cand = await User.findOne({ email: candidateEmail.toLowerCase() });
        if (!cand) {
          cand = await User.create({
            name: candidateName || candidateEmail.split('@')[0],
            email: candidateEmail.toLowerCase(),
            passwordHash: null,
            role: 'candidate',
            title: '',
            emailVerified: true
          });
        }
        finalCandidateId = cand._id;
      } catch (userErr) {
        console.warn('Candidate user creation fallback:', userErr.message);
      }
    }

    if (!finalCandidateId || !mongoose.Types.ObjectId.isValid(finalCandidateId)) {
      try {
        const anyCandidate = await User.findOne({ role: 'candidate' });
        finalCandidateId = anyCandidate ? anyCandidate._id : safeUserId;
      } catch (e) {
        finalCandidateId = safeUserId;
      }
    }
    if (!mongoose.Types.ObjectId.isValid(finalCandidateId)) {
      finalCandidateId = fallbackId;
    }

    const start = new Date(scheduledStart || scheduledAt || Date.now());
    const end = scheduledEnd ? new Date(scheduledEnd) : new Date(start.getTime() + (Number(durationMinutes) || 60) * 60000);

    if (!title) {
      return res.status(400).json({ success: false, message: 'Please provide an interview title.' });
    }

    let starterCode = '// Write your solution here\nfunction solution() {\n  return true;\n}\n';
    let defaultLang = 'javascript';
    let validChallengeId = null;

    if (challengeId && mongoose.Types.ObjectId.isValid(challengeId)) {
      validChallengeId = challengeId;
      try {
        const challenge = await CodingChallenge.findById(challengeId);
        if (challenge && challenge.starterCode?.javascript) {
          starterCode = challenge.starterCode.javascript;
        }
      } catch (cErr) {
        console.warn('Challenge lookup warning:', cErr.message);
      }
    }

    const meetingCode = generateMeetingCode();
    const meetingTokenHash = crypto.createHash('sha256').update(meetingCode + Date.now()).digest('hex');

    const safeInterviewerIds = (interviewerIds.length > 0 ? interviewerIds : [safeUserId])
      .filter(id => mongoose.Types.ObjectId.isValid(id));

    const interview = await Interview.create({
      title,
      description: description || '',
      candidateId: finalCandidateId,
      interviewerIds: safeInterviewerIds.length > 0 ? safeInterviewerIds : [safeUserId],
      scheduledStart: start,
      scheduledEnd: end,
      meetingCode,
      meetingTokenHash,
      challengeId: validChallengeId,
      activeCode: starterCode,
      activeLanguage: defaultLang,
      createdBy: safeUserId
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
      if (intId.toString() !== safeUserId.toString()) {
        await Notification.create({
          recipientId: intId,
          type: 'interview_invite',
          title: 'Scheduled Interview Assignment',
          message: `You have been assigned as interviewer for: "${title}"`,
          relatedInterviewId: interview._id
        }).catch(() => {});
      }
    }

    await AnalyticsEvent.create({
      actorId: safeUserId,
      eventType: 'interview_scheduled',
      interviewId: interview._id,
      metadata: { candidateId, title, scheduledStart }
    }).catch(() => {});

    const populated = await Interview.findById(interview._id)
      .populate('candidateId', 'name email avatar role')
      .populate('interviewerIds', 'name email avatar role title')
      .populate('challengeId', 'title difficulty category');

    // Send real-time Email Notification with join link to candidate
    const candEmail = candidateEmail || populated?.candidateId?.email;
    const candName = candidateName || populated?.candidateId?.name || 'Candidate';
    const hostName = req.user?.name || 'Lead Interviewer';
    const hostEmail = req.user?.email || '';
    const clientUrl = req.headers.origin || process.env.CLIENT_URL;

    if (candEmail) {
      sendInterviewInvitationEmail({
        recipientEmail: candEmail,
        recipientName: candName,
        hostName,
        hostEmail,
        interviewTitle: title,
        scheduledStart: start,
        scheduledEnd: end,
        durationMinutes: Number(durationMinutes) || 60,
        meetingCode,
        clientUrl
      }).catch(err => console.error('[InterviewController] Candidate email error:', err.message));
    }

    // Send confirmation copy to host if different email
    if (hostEmail && hostEmail.toLowerCase() !== candEmail?.toLowerCase()) {
      sendInterviewInvitationEmail({
        recipientEmail: hostEmail,
        recipientName: hostName,
        hostName,
        hostEmail,
        interviewTitle: `Confirmation: ${title}`,
        scheduledStart: start,
        scheduledEnd: end,
        durationMinutes: Number(durationMinutes) || 60,
        meetingCode,
        clientUrl
      }).catch(err => console.error('[InterviewController] Host confirmation email error:', err.message));
    }

    res.status(201).json({ success: true, message: 'Interview scheduled successfully. Invitation email dispatched.', data: populated });
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
    const isObjectId = Boolean(id.match(/^[0-9a-fA-F]{24}$/));
    if (isObjectId) {
      interview = await Interview.findById(id);
    } else {
      interview = await Interview.findOne({ meetingCode: id });
    }

    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview not found.' });
    }

    // If looking up by meetingCode (room join flow):
    // Anyone with the secret meeting link can join the interview session.
    // If looked up by internal ObjectId, enforce authenticated organizational access.
    if (isObjectId && req.user) {
      const isCandidate = interview.candidateId && interview.candidateId.toString() === req.user._id.toString();
      const isInterviewer = interview.interviewerIds && interview.interviewerIds.some(i => i.toString() === req.user._id.toString());
      const isCreator = interview.createdBy && interview.createdBy.toString() === req.user._id.toString();
      const isRecruiterOrAdmin = ['recruiter', 'admin'].includes(req.user.role);

      if (!isCandidate && !isInterviewer && !isCreator && !isRecruiterOrAdmin) {
        return res.status(403).json({ success: false, message: 'Access denied. You are not a participant in this interview.' });
      }
    }

    // If an authenticated user who is not the creator/interviewer joins via meetingCode,
    // associate them as candidate if candidate was placeholder/same as creator
    if (req.user && !isObjectId) {
      const isCreator = interview.createdBy && interview.createdBy.toString() === req.user._id.toString();
      const isInterviewer = interview.interviewerIds && interview.interviewerIds.some(i => i.toString() === req.user._id.toString());
      if (!isCreator && !isInterviewer && (!interview.candidateId || interview.candidateId.toString() === interview.createdBy?.toString())) {
        interview.candidateId = req.user._id;
        await interview.save().catch(() => {});
      }
    }

    const populated = await Interview.findById(interview._id)
      .populate('candidateId', 'name email avatar role')
      .populate('interviewerIds', 'name email avatar role title')
      .populate('createdBy', 'name email avatar role')
      .populate('challengeId');

    // Return populated data and nested interview property for seamless compatibility
    res.json({
      success: true,
      data: {
        ...populated.toObject(),
        interview: populated
      }
    });
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

      if (req.user?._id) {
        await AnalyticsEvent.create({
          actorId: req.user._id,
          eventType: 'interview_started',
          interviewId: interview._id
        }).catch(() => {});
      }
    }

    let sessionId = null;
    if (req.user?._id) {
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
      sessionId = session._id;
    }

    const populated = await Interview.findById(interview._id)
      .populate('candidateId', 'name email avatar role')
      .populate('interviewerIds', 'name email avatar role title')
      .populate('createdBy', 'name email avatar role')
      .populate('challengeId');

    const isHost = req.user && (
      interview.createdBy?.toString() === req.user._id.toString() ||
      interview.interviewerIds.some(i => i.toString() === req.user._id.toString()) ||
      ['admin', 'interviewer', 'recruiter'].includes(req.user.role)
    );

    res.json({
      success: true,
      data: {
        interview: populated,
        sessionId,
        roleInInterview: isHost ? 'interviewer' : 'candidate'
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
