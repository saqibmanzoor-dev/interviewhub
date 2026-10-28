import express from 'express';
import { 
  getEventTypes, 
  createEventType, 
  updateEventType, 
  deleteEventType, 
  getPublicEventType 
} from '../controllers/eventTypeController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes for booking pages
router.get('/public/:slug', getPublicEventType);
router.get('/public/:username/:slug', getPublicEventType);

// Protected routes for interviewers
router.use(protect);
router.get('/', getEventTypes);
router.post('/', createEventType);
router.put('/:id', updateEventType);
router.delete('/:id', deleteEventType);

export default router;
