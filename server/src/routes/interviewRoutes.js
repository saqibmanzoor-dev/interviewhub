import express from 'express';
import {
  createInterview,
  getInterviews,
  getInterviewById,
  updateInterview,
  joinInterview,
  syncRoomState,
  endInterview
} from '../controllers/interviewController.js';
import { protect, protectOptional, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, createInterview);
router.get('/', protect, getInterviews);
router.get('/:id', protectOptional, getInterviewById);
router.patch('/:id', protect, updateInterview);
router.post('/:id/join', protectOptional, joinInterview);
router.post('/:id/sync', protectOptional, syncRoomState);
router.post('/:id/end', protect, endInterview);

export default router;
