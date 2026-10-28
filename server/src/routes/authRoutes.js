import express from 'express';
import { 
  register, 
  requestRegisterOtp,
  verifyRegisterOtp,
  resendOtp,
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
router.post('/register-otp', requestRegisterOtp);
router.post('/verify-otp', verifyRegisterOtp);
router.post('/resend-otp', resendOtp);
router.post('/login', login);
router.post('/demo-login', demoLogin);
router.post('/logout', logout);
router.post('/refresh', refreshToken);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', protect, getMe);
router.get('/google', googleAuth);
router.post('/google', googleAuth);
router.get('/google/callback', googleCallback);

export default router;
