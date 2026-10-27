import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: {
    type: String,
    enum: ['interview_invite', 'interview_reminder', 'interview_cancelled', 'feedback_submitted', 'evaluation_needed'],
    required: true
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  relatedInterviewId: { type: mongoose.Schema.Types.ObjectId, ref: 'Interview', default: null },
  readAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

export default mongoose.model('Notification', notificationSchema);
