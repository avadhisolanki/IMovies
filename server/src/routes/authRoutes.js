import express from 'express';
import {
  registerUser,
  registerAdmin,
  login,
  getMe,
  verifyEmailOTP,
  resendVerificationOTP,
  forgotPassword,
  resetPassword,
} from '../controllers/authController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/admin/register', registerAdmin);
router.post('/login', login);
router.get('/me', verifyToken, getMe);

// Email Verification & Password Recovery routes
router.post('/verify-otp', verifyEmailOTP);
router.post('/resend-otp', resendVerificationOTP);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;
