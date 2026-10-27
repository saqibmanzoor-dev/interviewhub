import express from 'express';
import {
  getChallenges,
  getChallengeById,
  createChallenge,
  updateChallenge,
  deleteChallenge
} from '../controllers/challengeController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getChallenges);
router.get('/:id', getChallengeById);
router.post('/', authorizeRoles('interviewer', 'recruiter', 'admin'), createChallenge);
router.patch('/:id', authorizeRoles('interviewer', 'recruiter', 'admin'), updateChallenge);
router.delete('/:id', authorizeRoles('admin', 'recruiter'), deleteChallenge);

export default router;
