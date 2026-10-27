import express from 'express';
import { executeCode } from '../controllers/codeExecutionController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.post('/', executeCode);

export default router;
