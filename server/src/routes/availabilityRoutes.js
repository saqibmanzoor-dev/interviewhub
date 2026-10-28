import express from 'express';
import { 
  getMyAvailability, 
  updateMyAvailability, 
  getTimeOffList, 
  createTimeOff, 
  deleteTimeOff, 
  getPublicSlots 
} from '../controllers/availabilityController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public endpoint for slot calculation
router.get('/slots', getPublicSlots);

// Protected routes for availability and time off management
router.use(protect);
router.get('/me', getMyAvailability);
router.put('/me', updateMyAvailability);
router.get('/time-off', getTimeOffList);
router.post('/time-off', createTimeOff);
router.delete('/time-off/:id', deleteTimeOff);

export default router;
