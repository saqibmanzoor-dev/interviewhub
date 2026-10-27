import express from 'express';
import {
  getOverview,
  getInterviewTrends,
  getInterviewerWorkload,
  getActivityStream
} from '../controllers/analyticsController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.get('/overview', getOverview);
router.get('/interviews', getInterviewTrends);
router.get('/interviewers', authorizeRoles('recruiter', 'admin', 'interviewer'), getInterviewerWorkload);
router.get('/activity', getActivityStream);

export default router;
