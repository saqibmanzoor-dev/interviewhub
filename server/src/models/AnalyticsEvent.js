import mongoose from 'mongoose';

const analyticsEventSchema = new mongoose.Schema({
  organizationId: { type: String, default: 'default-org', index: true },
  actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  eventType: {
    type: String,
    enum: [
      'user_registered',
      'user_logged_in',
      'interview_scheduled',
      'interview_started',
      'interview_completed',
      'interview_cancelled',
      'evaluation_submitted',
      'code_executed'
    ],
    required: true,
    index: true
  },
  interviewId: { type: mongoose.Schema.Types.ObjectId, ref: 'Interview', default: null },
  occurredAt: { type: Date, default: Date.now, index: true },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
}, {
  timestamps: true
});

analyticsEventSchema.index({ occurredAt: -1, eventType: 1 });

export default mongoose.model('AnalyticsEvent', analyticsEventSchema);
