import mongoose from 'mongoose';

const eventTypeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    index: true
  },
  description: {
    type: String,
    default: ''
  },
  duration: {
    type: Number,
    required: true,
    default: 45 // minutes
  },
  color: {
    type: String,
    default: '#3B82F6' // primary blue
  },
  locationType: {
    type: String,
    enum: ['interviewhub_video', 'phone', 'custom'],
    default: 'interviewhub_video'
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  bookingQuestions: [{
    id: { type: String, required: true },
    label: { type: String, required: true },
    type: { type: String, enum: ['text', 'textarea', 'email', 'url', 'number', 'select'], default: 'text' },
    required: { type: Boolean, default: false },
    options: [String]
  }],
  bufferBefore: {
    type: Number,
    default: 10 // minutes buffer before event
  },
  bufferAfter: {
    type: Number,
    default: 10 // minutes buffer after event
  },
  minimumNoticeHours: {
    type: Number,
    default: 4 // hours notice before booking can occur
  },
  maxBookingHorizonDays: {
    type: Number,
    default: 30 // can only book within next 30 days
  },
  slotIntervalMinutes: {
    type: Number,
    default: 30 // slot intervals generated e.g. every 30 or 60 min
  },
  dailyLimit: {
    type: Number,
    default: 6 // maximum bookings per day
  },
  cancellationPolicy: {
    type: String,
    default: 'Notice at least 2 hours in advance'
  },
  challengeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CodingChallenge',
    default: null
  }
}, {
  timestamps: true
});

// Composite index to ensure an interviewer cannot have duplicate slugs
eventTypeSchema.index({ userId: 1, slug: 1 }, { unique: true });

export default mongoose.model('EventType', eventTypeSchema);
