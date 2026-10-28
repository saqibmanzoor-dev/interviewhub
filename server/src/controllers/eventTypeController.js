import EventType from '../models/EventType.js';
import User from '../models/User.js';

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
}

export async function getEventTypes(req, res, next) {
  try {
    const eventTypes = await EventType.find({ userId: req.user._id })
      .populate('challengeId', 'title difficulty category')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: eventTypes.length, data: eventTypes });
  } catch (err) {
    next(err);
  }
}

export async function createEventType(req, res, next) {
  try {
    const {
      title,
      slug,
      description,
      duration = 45,
      color,
      locationType,
      bookingQuestions = [],
      bufferBefore = 10,
      bufferAfter = 10,
      minimumNoticeHours = 4,
      maxBookingHorizonDays = 30,
      slotIntervalMinutes = 30,
      dailyLimit = 6,
      cancellationPolicy,
      challengeId
    } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: 'Event type title is required.' });
    }

    const baseSlug = slug ? slugify(slug) : slugify(title);
    let finalSlug = baseSlug;
    let counter = 1;

    while (await EventType.findOne({ userId: req.user._id, slug: finalSlug })) {
      finalSlug = `${baseSlug}-${counter++}`;
    }

    const eventType = await EventType.create({
      userId: req.user._id,
      title: title.trim(),
      slug: finalSlug,
      description: description || '',
      duration: Number(duration) || 45,
      color: color || '#3B82F6',
      locationType: locationType || 'interviewhub_video',
      bookingQuestions,
      bufferBefore: Number(bufferBefore) || 0,
      bufferAfter: Number(bufferAfter) || 0,
      minimumNoticeHours: Number(minimumNoticeHours) || 0,
      maxBookingHorizonDays: Number(maxBookingHorizonDays) || 30,
      slotIntervalMinutes: Number(slotIntervalMinutes) || 30,
      dailyLimit: Number(dailyLimit) || 6,
      cancellationPolicy: cancellationPolicy || 'Notice at least 2 hours in advance',
      challengeId: challengeId || null
    });

    res.status(201).json({ success: true, message: 'Event type created successfully.', data: eventType });
  } catch (err) {
    next(err);
  }
}

export async function updateEventType(req, res, next) {
  try {
    const { id } = req.params;
    const eventType = await EventType.findOne({ _id: id, userId: req.user._id });

    if (!eventType) {
      return res.status(404).json({ success: false, message: 'Event type not found or access denied.' });
    }

    const allowedUpdates = [
      'title', 'description', 'duration', 'color', 'locationType', 'isActive',
      'bookingQuestions', 'bufferBefore', 'bufferAfter', 'minimumNoticeHours',
      'maxBookingHorizonDays', 'slotIntervalMinutes', 'dailyLimit',
      'cancellationPolicy', 'challengeId'
    ];

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        eventType[field] = req.body[field];
      }
    });

    await eventType.save();
    res.json({ success: true, message: 'Event type updated successfully.', data: eventType });
  } catch (err) {
    next(err);
  }
}

export async function deleteEventType(req, res, next) {
  try {
    const { id } = req.params;
    const eventType = await EventType.findOneAndDelete({ _id: id, userId: req.user._id });

    if (!eventType) {
      return res.status(404).json({ success: false, message: 'Event type not found.' });
    }

    res.json({ success: true, message: 'Event type deleted successfully.' });
  } catch (err) {
    next(err);
  }
}

/**
 * Public lookup: fetch event type and interviewer details for booking page
 */
export async function getPublicEventType(req, res, next) {
  try {
    const { slug, username } = req.params;

    let query = { slug, isActive: true };

    if (username) {
      const user = await User.findOne({
        $or: [
          { bookingSlug: username.toLowerCase() },
          { email: username.toLowerCase() }
        ]
      });

      if (!user) {
        return res.status(404).json({ success: false, message: 'Interviewer profile not found.' });
      }
      query.userId = user._id;
    }

    const eventType = await EventType.findOne(query)
      .populate('userId', 'name email avatar title bio timezone bookingSlug')
      .populate('challengeId', 'title difficulty category');

    if (!eventType) {
      return res.status(404).json({ success: false, message: 'Interview booking page not found or is currently inactive.' });
    }

    res.json({ success: true, data: eventType });
  } catch (err) {
    next(err);
  }
}
