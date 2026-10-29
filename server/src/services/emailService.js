import {
  brevoClient,
  brevoApiKey,
  brevoApiKeySecondary,
  senderEmail,
  senderName,
  clientUrl,
  validateBrevoConfig,
} from '../config/brevo.js';

/**
 * Base method to send a transactional email via Brevo
 * Implements SDK call with automated REST fallback and secondary key retry.
 */
export const sendEmail = async ({
  to,
  subject,
  htmlContent,
  textContent,
  replyTo,
  tags = ['imovies'],
}) => {
  validateBrevoConfig();

  const recipients = Array.isArray(to)
    ? to.map((item) => (typeof item === 'string' ? { email: item } : item))
    : [{ email: typeof to === 'string' ? to : to.email, name: to.name || undefined }];

  const sender = { email: senderEmail, name: senderName };

  const payload = {
    sender,
    to: recipients,
    subject,
    htmlContent,
    textContent: textContent || subject,
    tags,
  };

  if (replyTo) {
    payload.replyTo = typeof replyTo === 'string' ? { email: replyTo } : replyTo;
  }

  // 1. Try sending via SDK
  try {
    if (brevoClient?.transactionalEmails?.sendTransacEmail) {
      const response = await brevoClient.transactionalEmails.sendTransacEmail(payload);
      const messageId = response?.messageId || response?.messageIds?.[0] || 'sent-sdk';
      console.log(`[Brevo Email] Sent successfully to ${recipients[0].email} (Msg ID: ${messageId})`);
      return { success: true, messageId };
    }
  } catch (sdkError) {
    console.warn('[Brevo SDK Warning] SDK call failed, attempting direct REST fallback:', sdkError.message);
  }

  // 2. Direct REST Fallback (handles both primary and secondary keys)
  const apiKeys = [brevoApiKey, brevoApiKeySecondary].filter(Boolean);
  let lastError = null;

  for (const key of apiKeys) {
    try {
      const restResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': key,
        },
        body: JSON.stringify(payload),
      });

      const data = await restResponse.json();

      if (restResponse.ok && (data.messageId || data.messageIds)) {
        const messageId = data.messageId || data.messageIds?.[0];
        console.log(`[Brevo Email REST] Sent successfully to ${recipients[0].email} (Msg ID: ${messageId})`);
        return { success: true, messageId };
      }

      // Check for rate limit or specific Brevo error code
      if (restResponse.status === 429) {
        console.error('[Brevo Rate Limit] HTTP 429 Rate limit exceeded.');
      } else {
        console.warn(`[Brevo Key Attempt] Key failed with status ${restResponse.status}:`, data.message || data);
      }
      lastError = new Error(data.message || `Brevo API HTTP ${restResponse.status}`);
    } catch (networkErr) {
      console.error('[Brevo Network Error]:', networkErr.message);
      lastError = networkErr;
    }
  }

  throw lastError || new Error('Failed to send transactional email via Brevo');
};

/**
 * Base method to send an email using a predefined Brevo template ID
 */
export const sendTemplateEmail = async ({ to, templateId, params = {} }) => {
  const recipients = Array.isArray(to)
    ? to.map((item) => (typeof item === 'string' ? { email: item } : item))
    : [{ email: typeof to === 'string' ? to : to.email }];

  const payload = {
    templateId: Number(templateId),
    to: recipients,
    params,
  };

  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': brevoApiKey,
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Template send failed');
    return { success: true, messageId: data.messageId };
  } catch (err) {
    console.error('[Brevo Template Error]:', err.message);
    throw err;
  }
};

/* ==========================================================================
   HIGH-LEVEL FEATURE WRAPPER FUNCTIONS (Amazon Prime Video Dark Aesthetic)
   ========================================================================== */

/**
 * 1. Account Activation / Email Verification with 6-Digit OTP & 1-Click Link
 */
export const sendVerificationEmail = async (email, { username, verificationToken, otp }) => {
  const verificationLink = `${clientUrl}/verify-email?token=${verificationToken}&email=${encodeURIComponent(email)}`;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Verify your iMovies Account</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0f171e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ffffff;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0f171e; padding: 30px 10px;">
    <tr>
      <td align="center">
        <table width="600" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #1a242f; border: 1px solid #253241; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
          <!-- Header -->
          <tr>
            <td style="background-color: #111a24; padding: 24px; text-align: center; border-bottom: 2px solid #00a8e1;">
              <span style="font-size: 26px; font-weight: 900; letter-spacing: 1px; color: #ffffff;">i<span style="color: #00a8e1;">Movies</span></span>
              <span style="display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #79b8f3; margin-top: 4px;">Prime Cinema Experience</span>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 32px 28px;">
              <h2 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 800; color: #ffffff;">Verify Your Email Address</h2>
              <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #9ab0c4;">
                Hello <strong style="color: #ffffff;">${username || 'Movie Lover'}</strong>, welcome to iMovies! To activate your account and access cinema tickets, trailers, and Prime privileges, please enter the one-time verification code below.
              </p>

              <!-- OTP Box -->
              <div style="background-color: #0f171e; border: 2px dashed #00a8e1; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
                <span style="display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #00a8e1; font-weight: 700; margin-bottom: 8px;">Your One-Time Password (OTP)</span>
                <span style="font-size: 36px; font-weight: 900; letter-spacing: 10px; color: #ffffff; font-family: monospace;">${otp}</span>
                <span style="display: block; font-size: 12px; color: #8197a4; margin-top: 8px;">Valid for 15 minutes. Do not share this code with anyone.</span>
              </div>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 28px 0 20px 0;">
                <p style="font-size: 13px; color: #9ab0c4; margin-bottom: 12px;">Or simply verify with 1-click:</p>
                <a href="${verificationLink}" target="_blank" style="display: inline-block; background-color: #00a8e1; color: #000000; font-weight: 800; font-size: 14px; padding: 14px 32px; border-radius: 8px; text-decoration: none; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 4px 15px rgba(0, 168, 225, 0.4);">
                  Verify My Account Now
                </a>
              </div>

              <p style="margin: 24px 0 0 0; font-size: 12px; color: #6b7f94; border-top: 1px solid #253241; pt-4; padding-top: 16px;">
                If you did not request this registration, you can safely ignore this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #111a24; padding: 16px; text-align: center; font-size: 11px; color: #5a6d80;">
              &copy; 2026 iMovies Entertainment Inc. All rights reserved. • Powered by Brevo Transac API
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return await sendEmail({
    to: email,
    subject: `🎬 ${otp} is your iMovies Account Verification Code`,
    htmlContent,
    textContent: `Hello ${username}, your iMovies verification code is ${otp}. It expires in 15 minutes. Alternatively, verify here: ${verificationLink}`,
    tags: ['verification', 'auth'],
  });
};

/**
 * 2. Secure Password Recovery Email with Reset Link and OTP
 */
export const sendPasswordResetEmail = async (email, { username, resetToken, otp }) => {
  const resetLink = `${clientUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Reset your iMovies Password</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0f171e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ffffff;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0f171e; padding: 30px 10px;">
    <tr>
      <td align="center">
        <table width="600" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #1a242f; border: 1px solid #253241; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
          <!-- Header -->
          <tr>
            <td style="background-color: #111a24; padding: 24px; text-align: center; border-bottom: 2px solid #e50914;">
              <span style="font-size: 26px; font-weight: 900; letter-spacing: 1px; color: #ffffff;">i<span style="color: #00a8e1;">Movies</span></span>
              <span style="display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #e50914; margin-top: 4px;">Security & Password Recovery</span>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 32px 28px;">
              <h2 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 800; color: #ffffff;">Reset Your Account Password</h2>
              <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #9ab0c4;">
                Hi <strong style="color: #ffffff;">${username || 'Customer'}</strong>, we received a request to reset your password for your iMovies account. Use the OTP code or click the button below to choose a new password.
              </p>

              <!-- OTP Code Display -->
              <div style="background-color: #0f171e; border: 2px dashed #e50914; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
                <span style="display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #e50914; font-weight: 700; margin-bottom: 8px;">Password Reset OTP</span>
                <span style="font-size: 36px; font-weight: 900; letter-spacing: 10px; color: #ffffff; font-family: monospace;">${otp}</span>
                <span style="display: block; font-size: 12px; color: #8197a4; margin-top: 8px;">Valid for 15 minutes.</span>
              </div>

              <!-- Action Link -->
              <div style="text-align: center; margin: 28px 0 20px 0;">
                <a href="${resetLink}" target="_blank" style="display: inline-block; background-color: #00a8e1; color: #000000; font-weight: 800; font-size: 14px; padding: 14px 32px; border-radius: 8px; text-decoration: none; text-transform: uppercase; letter-spacing: 0.5px;">
                  Reset Password Now
                </a>
              </div>

              <p style="margin: 24px 0 0 0; font-size: 12px; color: #6b7f94; border-top: 1px solid #253241; padding-top: 16px;">
                If you didn't ask to reset your password, please ignore this email or reach out to support if you suspect unauthorized activity.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #111a24; padding: 16px; text-align: center; font-size: 11px; color: #5a6d80;">
              &copy; 2026 iMovies Entertainment Inc. • All security communications are strictly confidential
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return await sendEmail({
    to: email,
    subject: `🔒 ${otp} is your iMovies Password Reset Code`,
    htmlContent,
    textContent: `Hello ${username}, use code ${otp} to reset your iMovies password. Reset link: ${resetLink}`,
    tags: ['password-reset', 'auth'],
  });
};

/**
 * 3. Booking Confirmation Email with Complete Digital Ticket Details
 */
export const sendBookingConfirmationEmail = async (email, booking) => {
  const seatsList = (booking.selectedSeats || []).join(', ');
  const showDateFormatted = new Date(booking.showDate).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Your iMovies Digital Cinema Pass</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0f171e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ffffff;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0f171e; padding: 30px 10px;">
    <tr>
      <td align="center">
        <!-- Pass Card -->
        <table width="600" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #1a242f; border: 1px solid #253241; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
          <!-- Header -->
          <tr>
            <td style="background-color: #111a24; padding: 20px 24px; border-bottom: 2px solid #00a8e1;">
              <table width="100%">
                <tr>
                  <td>
                    <span style="font-size: 24px; font-weight: 900; color: #ffffff;">i<span style="color: #00a8e1;">Movies</span></span>
                    <span style="display: block; font-size: 10px; text-transform: uppercase; letter-spacing: 2px; color: #79b8f3;">Official Admission Pass</span>
                  </td>
                  <td align="right">
                    <span style="background-color: #059669; color: #ffffff; font-size: 10px; font-weight: 800; padding: 4px 10px; border-radius: 12px; text-transform: uppercase; letter-spacing: 1px;">
                      Confirmed ✓
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Ticket Body -->
          <tr>
            <td style="padding: 28px;">
              <!-- Movie Banner / Title -->
              <div style="margin-bottom: 20px;">
                <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #00a8e1; font-weight: 700;">Featured Presentation</span>
                <h1 style="margin: 4px 0 8px 0; font-size: 24px; font-weight: 900; color: #ffffff;">${booking.movieName || 'Cinema Feature'}</h1>
                <p style="margin: 0; font-size: 13px; color: #9ab0c4;">
                  📍 ${booking.theatreName || 'Multiplex Cinema'} • ${booking.location || 'Auditorium Screen'}
                </p>
              </div>

              <!-- Ticket Info Grid -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #151c24; border: 1px solid #253241; border-radius: 12px; margin-bottom: 24px; overflow: hidden;">
                <tr>
                  <td width="33%" style="padding: 16px; border-right: 1px solid #253241;">
                    <span style="display: block; font-size: 10px; text-transform: uppercase; color: #6b7f94; font-weight: 700;">Show Date</span>
                    <span style="display: block; font-size: 13px; font-weight: 800; color: #ffffff; margin-top: 4px;">${showDateFormatted}</span>
                  </td>
                  <td width="33%" style="padding: 16px; border-right: 1px solid #253241;">
                    <span style="display: block; font-size: 10px; text-transform: uppercase; color: #6b7f94; font-weight: 700;">Show Time</span>
                    <span style="display: block; font-size: 13px; font-weight: 800; color: #00a8e1; margin-top: 4px;">${booking.showTime || 'Standard'}</span>
                  </td>
                  <td width="33%" style="padding: 16px;">
                    <span style="display: block; font-size: 10px; text-transform: uppercase; color: #6b7f94; font-weight: 700;">Seats (${booking.selectedSeats?.length || 0})</span>
                    <span style="display: block; font-size: 13px; font-weight: 800; color: #ffffff; margin-top: 4px;">${seatsList}</span>
                  </td>
                </tr>
                <tr style="border-top: 1px solid #253241;">
                  <td style="padding: 16px; border-right: 1px solid #253241;">
                    <span style="display: block; font-size: 10px; text-transform: uppercase; color: #6b7f94; font-weight: 700;">Booking ID</span>
                    <span style="display: block; font-size: 11px; font-weight: 800; font-family: monospace; color: #ffffff; margin-top: 4px;">${booking.bookingId}</span>
                  </td>
                  <td style="padding: 16px; border-right: 1px solid #253241;">
                    <span style="display: block; font-size: 10px; text-transform: uppercase; color: #6b7f94; font-weight: 700;">Payment Gateway</span>
                    <span style="display: block; font-size: 12px; font-weight: 800; color: #ffffff; margin-top: 4px;">${booking.paymentMethod || 'Razorpay'}</span>
                  </td>
                  <td style="padding: 16px;">
                    <span style="display: block; font-size: 10px; text-transform: uppercase; color: #6b7f94; font-weight: 700;">Total Paid</span>
                    <span style="display: block; font-size: 15px; font-weight: 900; color: #00a8e1; margin-top: 4px;">₹${booking.totalAmount}</span>
                  </td>
                </tr>
              </table>

              <!-- Digital Pass Cutout Barcode Aesthetic -->
              <div style="background-color: #0f171e; border: 1px dashed #253241; border-radius: 8px; padding: 16px; text-align: center;">
                <div style="display: inline-block; font-family: monospace; font-size: 18px; letter-spacing: 5px; color: #6b7f94; font-weight: 700;">
                  ||||| | |||| ||| |||||| | || ||||| ||||
                </div>
                <span style="display: block; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #8197a4; margin-top: 6px;">
                  Present this digital pass or booking ID ${booking.bookingId} at cinema entry gate
                </span>
              </div>

              <!-- Action Link -->
              <div style="text-align: center; margin-top: 24px;">
                <a href="${clientUrl}/bookings" target="_blank" style="display: inline-block; background-color: #00a8e1; color: #000000; font-weight: 800; font-size: 13px; padding: 12px 28px; border-radius: 8px; text-decoration: none; text-transform: uppercase;">
                  View & Print My Tickets
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #111a24; padding: 16px; text-align: center; font-size: 11px; color: #5a6d80;">
              Cinema gate opens 20 minutes before showtime. Enjoy your film experience at iMovies!
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return await sendEmail({
    to: email,
    subject: `🎟️ Ticket Confirmed: ${booking.movieName} (${booking.bookingId})`,
    htmlContent,
    textContent: `Your tickets for ${booking.movieName} are confirmed! Booking ID: ${booking.bookingId}. Seats: ${seatsList}. Total: ₹${booking.totalAmount}. View: ${clientUrl}/bookings`,
    tags: ['booking-confirmation', 'tickets'],
  });
};

/**
 * 4. Booking Status Update Email (Confirmed, Rescheduled, Cancelled, Refunded)
 */
export const sendBookingStatusUpdateEmail = async (email, { bookingId, movieName, status, reason }) => {
  const isCancelled = status?.toLowerCase() === 'cancelled';

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>iMovies Booking Update</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0f171e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ffffff;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0f171e; padding: 30px 10px;">
    <tr>
      <td align="center">
        <table width="600" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #1a242f; border: 1px solid #253241; border-radius: 16px; overflow: hidden;">
          <tr>
            <td style="background-color: #111a24; padding: 20px 24px; border-bottom: 2px solid ${isCancelled ? '#ef4444' : '#00a8e1'}; text-align: center;">
              <span style="font-size: 24px; font-weight: 900; color: #ffffff;">i<span style="color: #00a8e1;">Movies</span></span>
              <span style="display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #9ab0c4; margin-top: 4px;">Reservation Update Notice</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 28px;">
              <h2 style="margin: 0 0 12px 0; font-size: 18px; color: #ffffff;">Booking Status: <span style="color: ${isCancelled ? '#ef4444' : '#10b981'};">${status}</span></h2>
              <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #9ab0c4;">
                This is an official update regarding your reservation <strong style="color: #ffffff; font-family: monospace;">${bookingId}</strong> ${movieName ? `for <em>${movieName}</em>` : ''}.
              </p>
              ${reason ? `<div style="background-color: #0f171e; border: 1px solid #253241; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px; font-size: 13px; color: #cbd5e1;">Reason / Notes: ${reason}</div>` : ''}
              <div style="text-align: center; margin-top: 24px;">
                <a href="${clientUrl}/bookings" target="_blank" style="display: inline-block; background-color: #00a8e1; color: #000000; font-weight: 800; font-size: 13px; padding: 12px 28px; border-radius: 8px; text-decoration: none; text-transform: uppercase;">
                  Check My Bookings
                </a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color: #111a24; padding: 16px; text-align: center; font-size: 11px; color: #5a6d80;">
              &copy; 2026 iMovies Customer Care Team
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return await sendEmail({
    to: email,
    subject: `📢 Booking Update: ${bookingId} is ${status}`,
    htmlContent,
    textContent: `Your booking ${bookingId} status is now ${status}. Details: ${clientUrl}/bookings`,
    tags: ['booking-update'],
  });
};

export default {
  sendEmail,
  sendTemplateEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendBookingConfirmationEmail,
  sendBookingStatusUpdateEmail,
};
