import express from 'express';
import { getUsers, getUserById, updateMe } from '../controllers/userController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.get('/me', (req, res) => res.json({ success: true, data: req.user }));
router.patch('/me', updateMe);
router.get('/', getUsers);
router.get('/:id', getUserById);

export default router;
