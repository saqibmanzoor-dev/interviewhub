import EventType from '../models/EventType.js';
import AvailabilityRule from '../models/AvailabilityRule.js';
import TimeOff from '../models/TimeOff.js';
import Interview from '../models/Interview.js';
import User from '../models/User.js';

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

/**
 * Helper to parse "HH:MM" into minutes from start of day
 */
function parseTimeToMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Calculate available slots for an interviewer and event type on a specific date (YYYY-MM-DD)
 */
export async function calculateAvailableSlots({
  interviewerId,
  eventTypeId,
  dateString, // "YYYY-MM-DD"
  requestedTimezone
}) {
  const eventType = await EventType.findById(eventTypeId);
  if (!eventType || !eventType.isActive) {
    throw new Error('Event type not found or is currently inactive.');
  }

  const interviewer = await User.findById(interviewerId);
  if (!interviewer) {
    throw new Error('Interviewer not found.');
  }

  // Determine timezone
  let rule = await AvailabilityRule.findOne({ userId: interviewerId });
  const interviewerTz = rule?.timezone || interviewer.timezone || 'UTC';

  const [year, month, day] = dateString.split('-').map(Number);
  // Target date at 00:00:00 UTC
  const targetDateStart = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
  const targetDateEnd = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
  const now = new Date();

  // 1. Check Horizon constraint
  const maxDays = eventType.maxBookingHorizonDays || 30;
  const horizonLimit = new Date(now.getTime() + maxDays * 24 * 60 * 60 * 1000);
  if (targetDateEnd < now || targetDateStart > horizonLimit) {
    return { date: dateString, timezone: interviewerTz, slots: [] };
  }

  // 2. Check Time Off
  const timeOffActive = await TimeOff.findOne({
    userId: interviewerId,
    startDate: { $lte: targetDateEnd },
    endDate: { $gte: targetDateStart }
  });
  if (timeOffActive) {
    return { date: dateString, timezone: interviewerTz, slots: [] };
  }

  // 3. Check Daily Limits
  const activeBookingsCount = await Interview.countDocuments({
    interviewerIds: interviewerId,
    status: { $in: ['scheduled', 'in-progress'] },
    scheduledStart: { $gte: targetDateStart, $lte: targetDateEnd }
  });
  if (eventType.dailyLimit && activeBookingsCount >= eventType.dailyLimit) {
    return { date: dateString, timezone: interviewerTz, slots: [] };
  }

  // 4. Determine allowed intervals for target date
  let intervals = [];
  const override = rule?.dateOverrides?.find(o => o.date === dateString);

  if (override) {
    if (override.isUnavailable) {
      return { date: dateString, timezone: interviewerTz, slots: [] };
    }
    intervals = override.intervals || [];
  } else if (rule && rule.weeklySchedule) {
    const dayOfWeek = targetDateStart.getUTCDay();
    const dayKey = WEEKDAYS[dayOfWeek];
    const daySchedule = rule.weeklySchedule[dayKey];
    if (daySchedule && daySchedule.enabled) {
      intervals = daySchedule.intervals || [];
    }
  } else {
    // Default fallback: Mon-Fri 09:00 - 17:00
    const dayOfWeek = targetDateStart.getUTCDay();
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      intervals = [{ start: '09:00', end: '17:00' }];
    }
  }

  if (intervals.length === 0) {
    return { date: dateString, timezone: interviewerTz, slots: [] };
  }

  // 5. Fetch existing confirmed bookings for conflict checking
  const existingInterviews = await Interview.find({
    interviewerIds: interviewerId,
    status: { $in: ['scheduled', 'in-progress'] },
    scheduledStart: { $lte: new Date(targetDateEnd.getTime() + 2 * 60 * 60 * 1000) },
    scheduledEnd: { $gte: new Date(targetDateStart.getTime() - 2 * 60 * 60 * 1000) }
  }).lean();

  const durationMs = (eventType.duration || 45) * 60 * 1000;
  const bufferBeforeMs = (eventType.bufferBefore || 10) * 60 * 1000;
  const bufferAfterMs = (eventType.bufferAfter || 10) * 60 * 1000;
  const slotIntervalMinutes = eventType.slotIntervalMinutes || 30;
  const minimumNoticeMs = (eventType.minimumNoticeHours || 4) * 60 * 60 * 1000;
  const earliestAllowedSlot = new Date(now.getTime() + minimumNoticeMs);

  const availableSlots = [];

  for (const interval of intervals) {
    const startMins = parseTimeToMinutes(interval.start);
    const endMins = parseTimeToMinutes(interval.end);

    for (let cur = startMins; cur + (eventType.duration || 45) <= endMins; cur += slotIntervalMinutes) {
      const slotStart = new Date(targetDateStart.getTime() + cur * 60 * 1000);
      const slotEnd = new Date(slotStart.getTime() + durationMs);

      // Must respect minimum notice
      if (slotStart < earliestAllowedSlot) {
        continue;
      }

      // Check conflict with buffers against all existing bookings
      let hasConflict = false;
      for (const booking of existingInterviews) {
        const bStart = new Date(booking.scheduledStart).getTime();
        const bEnd = new Date(booking.scheduledEnd).getTime();

        const protectedSlotStart = slotStart.getTime() - bufferBeforeMs;
        const protectedSlotEnd = slotEnd.getTime() + bufferAfterMs;

        // Overlap test
        if (bStart < protectedSlotEnd && bEnd > protectedSlotStart) {
          hasConflict = true;
          break;
        }
      }

      if (!hasConflict) {
        availableSlots.push({
          start: slotStart.toISOString(),
          end: slotEnd.toISOString(),
          timeLabel: `${String(Math.floor(cur / 60)).padStart(2, '0')}:${String(cur % 60).padStart(2, '0')}`,
          durationMinutes: eventType.duration || 45,
          available: true
        });
      }
    }
  }

  return {
    date: dateString,
    timezone: interviewerTz,
    slots: availableSlots
  };
}
