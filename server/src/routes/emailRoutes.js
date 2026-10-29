import express from 'express';
import {
  sendTestEmail,
  triggerVerificationEmail,
  triggerPasswordResetEmail,
  triggerBookingConfirmationEmail,
  triggerStatusUpdateEmail,
  getEmailServiceStatus,
} from '../controllers/emailController.js';

const router = express.Router();

router.get('/status', getEmailServiceStatus);
router.post('/send-test', sendTestEmail);
router.post('/send-verification', triggerVerificationEmail);
router.post('/send-reset', triggerPasswordResetEmail);
router.post('/send-confirmation', triggerBookingConfirmationEmail);
router.post('/send-status-update', triggerStatusUpdateEmail);

export default router;
