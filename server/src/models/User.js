import mongoose from 'mongoose';

const authProviderSchema = new mongoose.Schema({
  provider: { type: String, required: true }, // 'google', 'local', etc.
  providerUserId: { type: String, required: true }
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, default: null },
  avatar: { type: String, default: '' },
  role: {
    type: String,
    enum: ['candidate', 'interviewer', 'recruiter', 'admin'],
    default: 'candidate'
  },
  title: { type: String, default: '' }, // e.g. Senior Software Engineer
  bio: { type: String, default: '' },
  timezone: { type: String, default: 'UTC' },
  bookingSlug: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
  organizationId: { type: String, default: 'default-org', index: true },
  emailVerified: { type: Boolean, default: false },
  notificationPreferences: {
    emailReminders: { type: Boolean, default: true },
    emailInvitations: { type: Boolean, default: true }
  },
  authProviders: [authProviderSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

userSchema.index({ email: 1, organizationId: 1 });
userSchema.index({ 'authProviders.provider': 1, 'authProviders.providerUserId': 1 });

export default mongoose.model('User', userSchema);
