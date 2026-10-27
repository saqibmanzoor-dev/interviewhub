import express from 'express';
import {
  createEvaluation,
  getEvaluationsByInterview,
  getCandidateEvaluations,
  getAllEvaluations
} from '../controllers/evaluationController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getAllEvaluations);
router.post('/', authorizeRoles('interviewer', 'recruiter', 'admin'), (req, res, next) => {
  req.params.interviewId = req.body.interviewId;
  return createEvaluation(req, res, next);
});
router.post('/interviews/:interviewId', authorizeRoles('interviewer', 'recruiter', 'admin'), createEvaluation);
router.get('/interviews/:interviewId', getEvaluationsByInterview);
router.get('/candidates/:candidateId', getCandidateEvaluations);

export default router;
