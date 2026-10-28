import AvailabilityRule from '../models/AvailabilityRule.js';
import TimeOff from '../models/TimeOff.js';
import User from '../models/User.js';
import EventType from '../models/EventType.js';
import { calculateAvailableSlots } from '../services/availabilityService.js';

export async function getMyAvailability(req, res, next) {
  try {
    let rule = await AvailabilityRule.findOne({ userId: req.user._id });
    if (!rule) {
      // Default rule creation if not already stored
      rule = await AvailabilityRule.create({
        userId: req.user._id,
        timezone: req.user.timezone || 'UTC',
        weeklySchedule: {
          monday: { enabled: true, intervals: [{ start: '09:00', end: '17:00' }] },
          tuesday: { enabled: true, intervals: [{ start: '09:00', end: '17:00' }] },
          wednesday: { enabled: true, intervals: [{ start: '09:00', end: '17:00' }] },
          thursday: { enabled: true, intervals: [{ start: '09:00', end: '17:00' }] },
          friday: { enabled: true, intervals: [{ start: '09:00', end: '17:00' }] },
          saturday: { enabled: false, intervals: [] },
          sunday: { enabled: false, intervals: [] }
        },
        dateOverrides: []
      });
    }

    res.json({ success: true, data: rule });
  } catch (err) {
    next(err);
  }
}

export async function updateMyAvailability(req, res, next) {
  try {
    const { timezone, weeklySchedule, dateOverrides } = req.body;

    let rule = await AvailabilityRule.findOne({ userId: req.user._id });
    if (!rule) {
      rule = new AvailabilityRule({ userId: req.user._id });
    }

    if (timezone) {
      rule.timezone = timezone;
      await User.findByIdAndUpdate(req.user._id, { timezone });
    }
    if (weeklySchedule) {
      rule.weeklySchedule = weeklySchedule;
    }
    if (dateOverrides !== undefined) {
      rule.dateOverrides = dateOverrides;
    }

    await rule.save();
    res.json({ success: true, message: 'Availability rules saved successfully.', data: rule });
  } catch (err) {
    next(err);
  }
}

export async function getTimeOffList(req, res, next) {
  try {
    const timeOff = await TimeOff.find({ userId: req.user._id }).sort({ startDate: 1 });
    res.json({ success: true, count: timeOff.length, data: timeOff });
  } catch (err) {
    next(err);
  }
}

export async function createTimeOff(req, res, next) {
  try {
    const { title, startDate, endDate, timezone } = req.body;
    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'Start date and end date are required.' });
    }

    const timeOff = await TimeOff.create({
      userId: req.user._id,
      title: title || 'Time Off',
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      timezone: timezone || req.user.timezone || 'UTC'
    });

    res.status(201).json({ success: true, message: 'Time off recorded successfully.', data: timeOff });
  } catch (err) {
    next(err);
  }
}

export async function deleteTimeOff(req, res, next) {
  try {
    const { id } = req.params;
    const timeOff = await TimeOff.findOneAndDelete({ _id: id, userId: req.user._id });
    if (!timeOff) {
      return res.status(404).json({ success: false, message: 'Time off record not found.' });
    }
    res.json({ success: true, message: 'Time off record removed.' });
  } catch (err) {
    next(err);
  }
}

/**
 * Public available slot calculation for date picker
 */
export async function getPublicSlots(req, res, next) {
  try {
    const { eventTypeId, date, timezone } = req.query;

    if (!eventTypeId || !date) {
      return res.status(400).json({ success: false, message: 'eventTypeId and date (YYYY-MM-DD) parameters are required.' });
    }

    const eventType = await EventType.findById(eventTypeId);
    if (!eventType) {
      return res.status(404).json({ success: false, message: 'Event type not found.' });
    }

    const result = await calculateAvailableSlots({
      interviewerId: eventType.userId,
      eventTypeId,
      dateString: date,
      requestedTimezone: timezone
    });

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}
