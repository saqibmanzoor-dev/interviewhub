import Interview from '../models/Interview.js';
import User from '../models/User.js';
import { sendReminderEmail } from '../services/emailService.js';

let intervalTimer = null;

export async function processReminders() {
  try {
    const now = new Date();
    // Look for scheduled interviews in the next 24 hours
    const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const upcomingInterviews = await Interview.find({
      status: 'scheduled',
      scheduledStart: { $gte: now, $lte: next24h }
    }).populate('interviewerIds', 'name email');

    for (const interview of upcomingInterviews) {
      const diffMs = new Date(interview.scheduledStart).getTime() - now.getTime();
      const diffMinutes = Math.round(diffMs / 60000);

      // Check configured reminder milestones: 15 mins and 60 mins
      const milestones = [15, 60];

      for (const milestone of milestones) {
        // Trigger if within a window of [milestone - 2, milestone + 2]
        if (Math.abs(diffMinutes - milestone) <= 2) {
          const alreadySent = interview.remindersSent?.some(r => r.offsetMinutes === milestone);
          if (!alreadySent) {
            const host = interview.interviewerIds?.[0];
            const candidateEmail = interview.attendeeEmail;
            const candidateName = interview.attendeeName || 'Candidate';

            if (candidateEmail) {
              await sendReminderEmail({
                recipientEmail: candidateEmail,
                recipientName: candidateName,
                hostName: host?.name || 'Interviewer',
                eventTitle: interview.title,
                scheduledStart: interview.scheduledStart,
                meetingCode: interview.meetingCode,
                offsetMinutes: milestone
              });
            }

            interview.remindersSent = interview.remindersSent || [];
            interview.remindersSent.push({
              offsetMinutes: milestone,
              sentAt: new Date()
            });

            await interview.save();
            console.log(`[ReminderWorker] Dispatched ${milestone}-min reminder for interview ${interview.meetingCode} to ${candidateEmail}`);
          }
        }
      }
    }
  } catch (err) {
    console.error('[ReminderWorker] Error processing scheduled reminders:', err.message);
  }
}

export function startReminderWorker(intervalMs = 60000) {
  if (intervalTimer) return;
  console.log('[ReminderWorker] Starting durable interview reminder worker...');
  intervalTimer = setInterval(processReminders, intervalMs);
}

export function stopReminderWorker() {
  if (intervalTimer) {
    clearInterval(intervalTimer);
    intervalTimer = null;
    console.log('[ReminderWorker] Reminder worker stopped.');
  }
}
