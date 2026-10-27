import mongoose from 'mongoose';

const interviewEvaluationSchema = new mongoose.Schema({
  interviewId: { type: mongoose.Schema.Types.ObjectId, ref: 'Interview', required: true, index: true },
  evaluatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  ratings: {
    problemSolving: { type: Number, min: 1, max: 5, default: 3 },
    dataStructures: { type: Number, min: 1, max: 5, default: 3 },
    codeQuality: { type: Number, min: 1, max: 5, default: 3 },
    communication: { type: Number, min: 1, max: 5, default: 3 },
    systemDesign: { type: Number, min: 1, max: 5, default: 3 },
    overallScore: { type: Number, min: 1, max: 10, default: 7 }
  },
  recommendation: {
    type: String,
    enum: ['Strong Hire', 'Hire', 'Leaning Hire', 'Leaning No Hire', 'No Hire'],
    required: true,
    default: 'Hire'
  },
  candidateFeedback: { type: String, default: '' }, // Feedback visible to candidate if permitted
  privateNotes: { type: String, default: '' },      // Strictly private: visible only to interviewers, recruiters, admins
  submittedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

export default mongoose.model('InterviewEvaluation', interviewEvaluationSchema);
