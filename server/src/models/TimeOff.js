import mongoose from 'mongoose';

const timeOffSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    default: 'Vacation / Time Off'
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  timezone: {
    type: String,
    default: 'UTC'
  }
}, {
  timestamps: true
});

timeOffSchema.index({ userId: 1, startDate: 1, endDate: 1 });

export default mongoose.model('TimeOff', timeOffSchema);
