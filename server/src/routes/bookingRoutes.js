import express from 'express';
import { 
  createPublicBooking, 
  getBookingByCode, 
  rescheduleBooking, 
  cancelBooking 
} from '../controllers/bookingController.js';

const router = express.Router();

// Public booking actions
router.post('/public', createPublicBooking);
router.get('/:code', getBookingByCode);
router.post('/:code/reschedule', rescheduleBooking);
router.post('/:code/cancel', cancelBooking);

export default router;
