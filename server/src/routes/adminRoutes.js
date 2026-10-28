import express from 'express';
import { 
  getAdminOverview, 
  getAdminUsers, 
  updateAdminUserRole, 
  getAuditLogs 
} from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(authorize('admin', 'recruiter'));

router.get('/overview', getAdminOverview);
router.get('/users', getAdminUsers);
router.patch('/users/:id/role', updateAdminUserRole);
router.get('/audit-logs', getAuditLogs);

export default router;
