import mongoose from 'mongoose';

const testCaseSchema = new mongoose.Schema({
  input: { type: String, required: true },
  expectedOutput: { type: String, required: true },
  explanation: { type: String, default: '' },
  isHidden: { type: Boolean, default: false }
}, { _id: false });

const codingChallengeSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
  category: { type: String, default: 'Algorithms' },
  supportedLanguages: [{ type: String, default: ['javascript', 'python', 'typescript', 'java', 'cpp'] }],
  starterCode: {
    javascript: { type: String, default: '' },
    python: { type: String, default: '' },
    typescript: { type: String, default: '' },
    java: { type: String, default: '' },
    cpp: { type: String, default: '' }
  },
  testCases: [testCaseSchema],
  hints: [{ type: String }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

export default mongoose.model('CodingChallenge', codingChallengeSchema);
