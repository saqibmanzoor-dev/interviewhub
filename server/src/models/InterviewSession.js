import mongoose from 'mongoose';

const interviewSessionSchema = new mongoose.Schema({
  interviewId: { type: mongoose.Schema.Types.ObjectId, ref: 'Interview', required: true, index: true },
  participantIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  startedAt: { type: Date, default: Date.now },
  endedAt: { type: Date, default: null },
  connectionEvents: [{
    eventType: { type: String }, // 'join', 'leave', 'reconnect'
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    timestamp: { type: Date, default: Date.now },
    metadata: { type: Object }
  }],
  sessionStatus: { type: String, enum: ['active', 'closed'], default: 'active' }
}, {
  timestamps: true
});

export default mongoose.model('InterviewSession', interviewSessionSchema);
