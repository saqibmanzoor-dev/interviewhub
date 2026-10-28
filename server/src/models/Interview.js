import mongoose from 'mongoose';

const interviewSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  interviewerIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  organizationId: { type: String, default: 'default-org', index: true },
  scheduledStart: { type: Date, required: true, index: true },
  scheduledEnd: { type: Date, required: true },
  actualStart: { type: Date, default: null },
  actualEnd: { type: Date, default: null },
  status: {
    type: String,
    enum: ['scheduled', 'in-progress', 'completed', 'cancelled'],
    default: 'scheduled',
    index: true
  },
  meetingCode: { type: String, required: true, unique: true, index: true }, // e.g., 'abc-defg-hij'
  meetingTokenHash: { type: String, default: '' },
  eventTypeId: { type: mongoose.Schema.Types.ObjectId, ref: 'EventType', default: null },
  attendeeName: { type: String, default: '' },
  attendeeEmail: { type: String, default: '' },
  attendeeNotes: { type: String, default: '' },
  bookingAnswers: [{
    questionId: String,
    questionLabel: String,
    answer: String
  }],
  cancellationReason: { type: String, default: '' },
  rescheduleHistory: [{
    previousStart: Date,
    previousEnd: Date,
    rescheduledAt: { type: Date, default: Date.now },
    reason: String
  }],
  icsUID: { type: String, default: '' },
  remindersSent: [{
    offsetMinutes: Number,
    sentAt: { type: Date, default: Date.now }
  }],
  challengeId: { type: mongoose.Schema.Types.ObjectId, ref: 'CodingChallenge', default: null },
  activeCode: { type: String, default: '' },
  activeLanguage: { type: String, default: 'javascript' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true
});

interviewSchema.index({ status: 1, scheduledStart: 1 });
interviewSchema.index({ candidateId: 1, scheduledStart: -1 });
interviewSchema.index({ eventTypeId: 1 });

export default mongoose.model('Interview', interviewSchema);
