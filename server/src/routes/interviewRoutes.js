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

router.post('/', createInterview);
router.get('/', getInterviews);
router.get('/:id', getInterviewById);
router.patch('/:id', updateInterview);
router.post('/:id/join', joinInterview);
router.post('/:id/end', endInterview);

export default router;
