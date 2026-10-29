import {
  sendEmail,
  sendTemplateEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendBookingConfirmationEmail,
  sendBookingStatusUpdateEmail,
} from '../services/emailService.js';
import { senderEmail, senderName, clientUrl } from '../config/brevo.js';

// Send Test Transactional Email
export const sendTestEmail = async (req, res) => {
  try {
    const { to } = req.body;
    const recipient = to || req.user?.email || senderEmail;

    const result = await sendEmail({
      to: recipient,
      subject: '🎬 Welcome to iMovies — Brevo Integration Operational!',
      htmlContent: `
        <div style="background-color: #0f171e; color: #ffffff; padding: 30px; font-family: sans-serif; border-radius: 12px;">
          <h1 style="color: #00a8e1; margin-bottom: 8px;">iMovies Prime Cinema</h1>
          <p style="font-size: 15px; color: #9ab0c4;">Your Brevo transactional email engine is officially live and ready for production.</p>
          <div style="background: #1a242f; padding: 16px; border-radius: 8px; border: 1px solid #253241; margin: 20px 0;">
            <p style="margin: 0; font-size: 13px;"><strong>Sender:</strong> ${senderName} &lt;${senderEmail}&gt;</p>
            <p style="margin: 4px 0 0 0; font-size: 13px;"><strong>Recipient:</strong> ${recipient}</p>
            <p style="margin: 4px 0 0 0; font-size: 13px;"><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
          </div>
          <p style="font-size: 12px; color: #6b7f94;">Sent via @getbrevo/brevo official SDK.</p>
        </div>
      `,
      textContent: `Welcome to iMovies! Your Brevo transactional email integration is functioning properly.`,
    });

    return res.status(200).json({
      success: true,
      message: `Test email sent successfully to ${recipient}`,
      messageId: result.messageId,
    });
  } catch (err) {
    console.error('[Email Controller] sendTestEmail failed:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to dispatch transactional test email',
    });
  }
};

// Send Verification OTP & Link
export const triggerVerificationEmail = async (req, res) => {
  try {
    const { email, username, otp, token } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Target email is required' });
    }

    const testOtp = otp || Math.floor(100000 + Math.random() * 900000).toString();
    const testToken = token || `ver_${Date.now()}`;

    const result = await sendVerificationEmail(email, {
      username: username || 'Prime Member',
      verificationToken: testToken,
      otp: testOtp,
    });

    return res.status(200).json({
      success: true,
      message: `Verification email sent to ${email}`,
      otp: testOtp,
      messageId: result.messageId,
    });
  } catch (err) {
    console.error('[Email Controller] triggerVerificationEmail failed:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to dispatch verification email',
    });
  }
};

// Send Password Reset OTP & Link
export const triggerPasswordResetEmail = async (req, res) => {
  try {
    const { email, username, otp, token } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Target email is required' });
    }

    const testOtp = otp || Math.floor(100000 + Math.random() * 900000).toString();
    const testToken = token || `rst_${Date.now()}`;

    const result = await sendPasswordResetEmail(email, {
      username: username || 'Customer',
      resetToken: testToken,
      otp: testOtp,
    });

    return res.status(200).json({
      success: true,
      message: `Password reset email dispatched to ${email}`,
      otp: testOtp,
      messageId: result.messageId,
    });
  } catch (err) {
    console.error('[Email Controller] triggerPasswordResetEmail failed:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to dispatch password recovery email',
    });
  }
};

// Send Digital Ticket Confirmation Email
export const triggerBookingConfirmationEmail = async (req, res) => {
  try {
    const { email, bookingDetails } = req.body;
    const recipient = email || req.user?.email;

    if (!recipient) {
      return res.status(400).json({ success: false, message: 'Recipient email is required' });
    }

    const sampleBooking = bookingDetails || {
      bookingId: `PRIME-${Date.now().toString().slice(-6)}-TEST`,
      movieName: 'Interstellar (IMAX Re-Release)',
      theatreName: 'PVR IMAX Screen 1',
      location: 'Phoenix Palladium',
      showDate: new Date(),
      showTime: '07:30 PM',
      selectedSeats: ['B10', 'B11'],
      totalAmount: 520,
      paymentMethod: 'Razorpay',
    };

    const result = await sendBookingConfirmationEmail(recipient, sampleBooking);

    return res.status(200).json({
      success: true,
      message: `Booking confirmation pass dispatched to ${recipient}`,
      bookingId: sampleBooking.bookingId,
      messageId: result.messageId,
    });
  } catch (err) {
    console.error('[Email Controller] triggerBookingConfirmationEmail failed:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to dispatch digital ticket pass email',
    });
  }
};

// Send Status Update Email
export const triggerStatusUpdateEmail = async (req, res) => {
  try {
    const { email, bookingId, status, reason, movieName } = req.body;
    if (!email || !bookingId) {
      return res.status(400).json({ success: false, message: 'email and bookingId are required' });
    }

    const result = await sendBookingStatusUpdateEmail(email, {
      bookingId,
      movieName: movieName || 'Movie Booking',
      status: status || 'Confirmed',
      reason,
    });

    return res.status(200).json({
      success: true,
      message: `Status update sent to ${email}`,
      messageId: result.messageId,
    });
  } catch (err) {
    console.error('[Email Controller] triggerStatusUpdateEmail failed:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to dispatch status update email',
    });
  }
};

// Email Service Status / Health
export const getEmailServiceStatus = (req, res) => {
  return res.status(200).json({
    service: 'Brevo Transactional Email Engine',
    senderEmail,
    senderName,
    clientUrl,
    status: 'Ready',
  });
};
