import express from 'express';
import { 
  register, 
  login, 
  demoLogin, 
  getMe, 
  googleAuth, 
  googleCallback,
  logout,
  forgotPassword,
  resetPassword,
  refreshToken
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/demo-login', demoLogin);
router.post('/logout', logout);
router.post('/refresh', refreshToken);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', protect, getMe);
router.get('/google', googleAuth);
router.get('/google/callback', googleCallback);

export default router;
