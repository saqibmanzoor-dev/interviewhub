import crypto from 'crypto';
import EventType from '../models/EventType.js';
import User from '../models/User.js';
import Interview from '../models/Interview.js';
import CodingChallenge from '../models/CodingChallenge.js';
import Notification from '../models/Notification.js';
import AnalyticsEvent from '../models/AnalyticsEvent.js';
import AuditLog from '../models/AuditLog.js';
import { 
  sendBookingConfirmationEmail, 
  sendRescheduleEmail, 
  sendCancellationEmail 
} from '../services/emailService.js';

function generateMeetingCode() {
  const p1 = Math.random().toString(36).substring(2, 5);
  const p2 = Math.random().toString(36).substring(2, 6);
  const p3 = Math.random().toString(36).substring(2, 5);
  return `${p1}-${p2}-${p3}`;
}

export async function createPublicBooking(req, res, next) {
  try {
    const { 
      eventTypeId, 
      slotStart, 
      candidateName, 
      candidateEmail, 
      attendeeNotes, 
      bookingAnswers = [] 
    } = req.body;

    if (!eventTypeId || !slotStart || !candidateEmail || !candidateName) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide eventTypeId, slotStart, candidateName, and candidateEmail.' 
      });
    }

    const eventType = await EventType.findById(eventTypeId).populate('userId');
    if (!eventType || !eventType.isActive) {
      return res.status(404).json({ success: false, message: 'This event type is no longer active.' });
    }

    const host = eventType.userId;
    const start = new Date(slotStart);
    const end = new Date(start.getTime() + (eventType.duration || 45) * 60000);

    // Double-booking check: verify interviewer has no overlapping confirmed booking
    const bufferBeforeMs = (eventType.bufferBefore || 0) * 60000;
    const bufferAfterMs = (eventType.bufferAfter || 0) * 60000;
    const protectedStart = new Date(start.getTime() - bufferBeforeMs);
    const protectedEnd = new Date(end.getTime() + bufferAfterMs);

    const conflictingBooking = await Interview.findOne({
      interviewerIds: host._id,
      status: { $in: ['scheduled', 'in-progress'] },
      scheduledStart: { $lt: protectedEnd },
      scheduledEnd: { $gt: protectedStart }
    });

    if (conflictingBooking) {
      return res.status(409).json({ 
        success: false, 
        message: 'This time slot was claimed just now or is no longer available. Please select another slot.' 
      });
    }

    // Find or provision candidate account
    let candidate = await User.findOne({ email: candidateEmail.toLowerCase().trim() });
    if (!candidate) {
      candidate = await User.create({
        name: candidateName.trim(),
        email: candidateEmail.toLowerCase().trim(),
        passwordHash: null,
        role: 'candidate',
        emailVerified: true
      });
    }

    const meetingCode = generateMeetingCode();
    const meetingTokenHash = crypto.createHash('sha256').update(meetingCode + Date.now()).digest('hex');
    const icsUID = `ih-${meetingCode}-${Date.now()}@interviewhub.io`;

    // Code starter from attached challenge or default
    let starterCode = '// Welcome to your InterviewHub Technical Interview\nfunction solution() {\n  return true;\n}\n';
    let defaultLang = 'javascript';
    if (eventType.challengeId) {
      const challenge = await CodingChallenge.findById(eventType.challengeId);
      if (challenge && challenge.starterCode?.javascript) {
        starterCode = challenge.starterCode.javascript;
      }
    }

    const interview = await Interview.create({
      title: eventType.title,
      description: eventType.description || '',
      candidateId: candidate._id,
      interviewerIds: [host._id],
      eventTypeId: eventType._id,
      attendeeName: candidateName.trim(),
      attendeeEmail: candidateEmail.toLowerCase().trim(),
      attendeeNotes: attendeeNotes || '',
      bookingAnswers,
      scheduledStart: start,
      scheduledEnd: end,
      meetingCode,
      meetingTokenHash,
      icsUID,
      challengeId: eventType.challengeId || null,
      activeCode: starterCode,
      activeLanguage: defaultLang,
      createdBy: host._id
    });

    // In-app Notifications
    await Notification.create({
      recipientId: host._id,
      type: 'interview_invite',
      title: 'New Booking Received',
      message: `${candidateName} has booked "${eventType.title}" for ${start.toLocaleString()}`,
      relatedInterviewId: interview._id
    });

    // Analytics & Audit
    await AnalyticsEvent.create({
      actorId: candidate._id,
      eventType: 'interview_scheduled',
      interviewId: interview._id,
      metadata: { eventTypeId: eventType._id, candidateEmail }
    });

    await AuditLog.create({
      actorId: candidate._id,
      action: 'booking.created',
      resourceType: 'Interview',
      resourceId: interview._id.toString(),
      details: { meetingCode, start, end, hostEmail: host.email }
    });

    // Dispatch confirmation email with .ics attachment
    const clientUrl = req.headers.origin || process.env.CLIENT_URL;
    try {
      await sendBookingConfirmationEmail({
        recipientEmail: candidateEmail,
        recipientName: candidateName,
        hostName: host.name,
        hostEmail: host.email,
        eventTitle: eventType.title,
        scheduledStart: start,
        scheduledEnd: end,
        durationMinutes: eventType.duration || 45,
        meetingCode,
        clientUrl,
        answers: bookingAnswers
      });
    } catch (err) {
      console.error('[BookingController] Email error:', err.message);
    }

    // Also notify host
    if (host.email && host.email.toLowerCase() !== candidateEmail.toLowerCase()) {
      try {
        await sendBookingConfirmationEmail({
          recipientEmail: host.email,
          recipientName: host.name,
          hostName: host.name,
          hostEmail: host.email,
          eventTitle: `New Booking: ${eventType.title} with ${candidateName}`,
          scheduledStart: start,
          scheduledEnd: end,
          durationMinutes: eventType.duration || 45,
          meetingCode,
          clientUrl,
          answers: bookingAnswers
        });
      } catch (err) {
        console.error('[BookingController] Host notify error:', err.message);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Interview successfully scheduled! Confirmation and calendar invite sent to your email.',
      data: {
        bookingId: interview._id,
        meetingCode,
        title: eventType.title,
        scheduledStart: start,
        scheduledEnd: end,
        durationMinutes: eventType.duration || 45,
        hostName: host.name,
        candidateName,
        candidateEmail
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function getBookingByCode(req, res, next) {
  try {
    const { code } = req.params;
    const interview = await Interview.findOne({ meetingCode: code })
      .populate('interviewerIds', 'name email avatar title bio timezone')
      .populate('candidateId', 'name email avatar')
      .populate('eventTypeId')
      .populate('challengeId', 'title difficulty category');

    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview booking not found.' });
    }

    res.json({ success: true, data: interview });
  } catch (err) {
    next(err);
  }
}

export async function rescheduleBooking(req, res, next) {
  try {
    const { code } = req.params;
    const { newSlotStart, reason } = req.body;

    if (!newSlotStart) {
      return res.status(400).json({ success: false, message: 'New slot start time is required.' });
    }

    const interview = await Interview.findOne({ meetingCode: code })
      .populate('interviewerIds')
      .populate('eventTypeId');

    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview booking not found.' });
    }

    if (interview.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Cannot reschedule a cancelled interview. Please book a new slot.' });
    }

    const host = interview.interviewerIds[0];
    const durationMs = (interview.eventTypeId?.duration || 45) * 60000;
    const start = new Date(newSlotStart);
    const end = new Date(start.getTime() + durationMs);

    // Overlap conflict check for host (excluding this interview)
    const conflict = await Interview.findOne({
      _id: { $ne: interview._id },
      interviewerIds: host._id,
      status: { $in: ['scheduled', 'in-progress'] },
      scheduledStart: { $lt: end },
      scheduledEnd: { $gt: start }
    });

    if (conflict) {
      return res.status(409).json({ success: false, message: 'The requested new slot conflicts with an existing appointment. Please choose another.' });
    }

    // Save previous times in reschedule history
    interview.rescheduleHistory.push({
      previousStart: interview.scheduledStart,
      previousEnd: interview.scheduledEnd,
      rescheduledAt: new Date(),
      reason: reason || ''
    });

    interview.scheduledStart = start;
    interview.scheduledEnd = end;
    interview.status = 'scheduled';
    await interview.save();

    const clientUrl = req.headers.origin || process.env.CLIENT_URL;

    // Send update email to candidate
    sendRescheduleEmail({
      recipientEmail: interview.attendeeEmail || interview.candidateId?.email,
      recipientName: interview.attendeeName || 'Candidate',
      hostName: host.name,
      eventTitle: interview.title,
      newStart: start,
      newEnd: end,
      meetingCode: interview.meetingCode,
      clientUrl
    }).catch(err => console.error('[Reschedule] Email error:', err.message));

    // Send update email to host
    if (host.email) {
      sendRescheduleEmail({
        recipientEmail: host.email,
        recipientName: host.name,
        hostName: host.name,
        eventTitle: `Rescheduled: ${interview.title}`,
        newStart: start,
        newEnd: end,
        meetingCode: interview.meetingCode,
        clientUrl
      }).catch(err => console.error('[Reschedule] Host email error:', err.message));
    }

    await AuditLog.create({
      action: 'booking.rescheduled',
      resourceType: 'Interview',
      resourceId: interview._id.toString(),
      details: { meetingCode: code, newStart: start, reason }
    });

    res.json({ success: true, message: 'Interview successfully rescheduled.', data: interview });
  } catch (err) {
    next(err);
  }
}

export async function cancelBooking(req, res, next) {
  try {
    const { code } = req.params;
    const { reason = '' } = req.body;

    const interview = await Interview.findOne({ meetingCode: code }).populate('interviewerIds');
    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview booking not found.' });
    }

    interview.status = 'cancelled';
    interview.cancellationReason = reason;
    await interview.save();

    const host = interview.interviewerIds[0];

    sendCancellationEmail({
      recipientEmail: interview.attendeeEmail,
      recipientName: interview.attendeeName,
      hostName: host?.name || 'Interviewer',
      eventTitle: interview.title,
      scheduledStart: interview.scheduledStart,
      reason
    }).catch(err => console.error('[Cancel] Email error:', err.message));

    if (host?.email) {
      sendCancellationEmail({
        recipientEmail: host.email,
        recipientName: host.name,
        hostName: host.name,
        eventTitle: `Cancelled: ${interview.title}`,
        scheduledStart: interview.scheduledStart,
        reason
      }).catch(err => console.error('[Cancel] Host email error:', err.message));
    }

    await AuditLog.create({
      action: 'booking.cancelled',
      resourceType: 'Interview',
      resourceId: interview._id.toString(),
      details: { meetingCode: code, reason }
    });

    res.json({ success: true, message: 'Interview has been cancelled and slot released.', data: interview });
  } catch (err) {
    next(err);
  }
}
