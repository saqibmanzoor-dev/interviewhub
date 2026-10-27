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
  challengeId: { type: mongoose.Schema.Types.ObjectId, ref: 'CodingChallenge', default: null },
  activeCode: { type: String, default: '' },
  activeLanguage: { type: String, default: 'javascript' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true
});

interviewSchema.index({ status: 1, scheduledStart: 1 });
interviewSchema.index({ candidateId: 1, scheduledStart: -1 });

export default mongoose.model('Interview', interviewSchema);
