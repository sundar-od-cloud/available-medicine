import { Router } from 'express';
import {
  register,
  login,
  sendOTPHandler,
  verifyOTPHandler,
  refreshTokenHandler,
  logout,
  logoutAll,
  getProfile,
  updateProfile,
  changePassword,
} from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { authLimiter, otpLimiter } from '../middleware/rateLimiter';

const router = Router();

// Public routes
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/otp/send', otpLimiter, sendOTPHandler);
router.post('/otp/verify', otpLimiter, verifyOTPHandler);
router.post('/refresh', refreshTokenHandler);

// Protected routes
router.post('/logout', authenticate, logout);
router.post('/logout-all', authenticate, logoutAll);
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.post('/change-password', authenticate, changePassword);

export default router;
