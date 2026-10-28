import mongoose from 'mongoose';

const timeIntervalSchema = new mongoose.Schema({
  start: { type: String, required: true }, // "09:00" format in 24hr
  end: { type: String, required: true }    // "17:00" format in 24hr
}, { _id: false });

const dateOverrideSchema = new mongoose.Schema({
  date: { type: String, required: true }, // "YYYY-MM-DD"
  isUnavailable: { type: Boolean, default: false },
  intervals: [timeIntervalSchema]
}, { _id: false });

const availabilityRuleSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  timezone: {
    type: String,
    required: true,
    default: 'UTC' // e.g. 'America/New_York', 'Europe/London', 'Asia/Kolkata'
  },
  weeklySchedule: {
    monday: {
      enabled: { type: Boolean, default: true },
      intervals: { type: [timeIntervalSchema], default: [{ start: '09:00', end: '17:00' }] }
    },
    tuesday: {
      enabled: { type: Boolean, default: true },
      intervals: { type: [timeIntervalSchema], default: [{ start: '09:00', end: '17:00' }] }
    },
    wednesday: {
      enabled: { type: Boolean, default: true },
      intervals: { type: [timeIntervalSchema], default: [{ start: '09:00', end: '17:00' }] }
    },
    thursday: {
      enabled: { type: Boolean, default: true },
      intervals: { type: [timeIntervalSchema], default: [{ start: '09:00', end: '17:00' }] }
    },
    friday: {
      enabled: { type: Boolean, default: true },
      intervals: { type: [timeIntervalSchema], default: [{ start: '09:00', end: '17:00' }] }
    },
    saturday: {
      enabled: { type: Boolean, default: false },
      intervals: { type: [timeIntervalSchema], default: [] }
    },
    sunday: {
      enabled: { type: Boolean, default: false },
      intervals: { type: [timeIntervalSchema], default: [] }
    }
  },
  dateOverrides: [dateOverrideSchema]
}, {
  timestamps: true
});

export default mongoose.model('AvailabilityRule', availabilityRuleSchema);
