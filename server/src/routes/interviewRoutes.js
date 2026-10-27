import express from 'express';
import {
  createInterview,
  getInterviews,
  getInterviewById,
  updateInterview,
  joinInterview,
  endInterview
} from '../controllers/interviewController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/', authorizeRoles('interviewer', 'recruiter', 'admin'), createInterview);
router.get('/', getInterviews);
router.get('/:id', getInterviewById);
router.patch('/:id', authorizeRoles('interviewer', 'recruiter', 'admin'), updateInterview);
router.post('/:id/join', joinInterview);
router.post('/:id/end', authorizeRoles('interviewer', 'recruiter', 'admin'), endInterview);

export default router;
