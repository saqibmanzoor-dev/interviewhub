import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema({
  interviewId: { type: mongoose.Schema.Types.ObjectId, ref: 'Interview', required: true, index: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  senderName: { type: String, required: true },
  senderRole: { type: String, default: 'candidate' },
  message: { type: String, required: true, maxlength: 2000 },
  createdAt: { type: Date, default: Date.now, index: true }
});

export default mongoose.model('ChatMessage', chatMessageSchema);
