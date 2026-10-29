import mongoose from 'mongoose';

const roomStateSchema = new mongoose.Schema({
  meetingCode: { type: String, required: true, unique: true, index: true },
  activeCode: { type: String, default: '' },
  activeLanguage: { type: String, default: 'javascript' },
  participants: [{
    sessionId: { type: String, required: true },
    peerId: { type: String, default: '' },
    name: { type: String, default: 'Participant' },
    role: { type: String, default: 'candidate' },
    avatar: { type: String, default: '' },
    mic: { type: Boolean, default: true },
    video: { type: Boolean, default: true },
    lastSeen: { type: Date, default: Date.now }
  }],
  messages: [{
    id: { type: String, required: true },
    sender: { type: String, required: true },
    role: { type: String, default: 'candidate' },
    text: { type: String, required: true },
    timestamp: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now }
  }],
  signals: [{
    fromSessionId: { type: String },
    toSessionId: { type: String },
    data: { type: Object },
    createdAt: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

export default mongoose.model('RoomState', roomStateSchema);
