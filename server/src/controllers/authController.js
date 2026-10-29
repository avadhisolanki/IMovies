import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import User from '../models/userModel.js';
import Admin from '../models/adminModel.js';
import { generateToken } from '../middleware/authMiddleware.js';
import { isMongoConnected } from '../config/db.js';
import { memoryDB } from '../config/memoryStore.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../services/emailService.js';

// Helper to generate a 6-digit numerical OTP
const generateNumericOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// 1. Register User (Requires Email OTP Verification before account activation)
export const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }
    if (username.length < 3 || username.length > 20) {
      return res.status(400).json({ success: false, message: 'Username must be between 3 and 20 characters' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const normalizedEmail = email.toLowerCase().trim();

    const otp = generateNumericOTP();
    const verificationToken = crypto.randomBytes(24).toString('hex');
    const otpExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 Minutes TTL

    if (isMongoConnected()) {
      const existingUser = await User.findOne({ $or: [{ email: normalizedEmail }, { username }] });
      if (existingUser) {
        if (existingUser.isVerified) {
          return res.status(400).json({ success: false, message: 'An active verified account with this email or username already exists' });
        } else {
          // Unverified user retrying registration: update credentials & reissue OTP
          existingUser.username = username;
          existingUser.password = hashedPassword;
          existingUser.verificationOTP = otp;
          existingUser.verificationToken = verificationToken;
          existingUser.otpExpires = otpExpires;
          await existingUser.save();

          // Send verification email via Brevo in background
          sendVerificationEmail(normalizedEmail, { username, verificationToken, otp }).catch((err) =>
            console.error('[Registration Email Background Error]:', err.message)
          );

          return res.status(200).json({
            success: true,
            requiresVerification: true,
            email: normalizedEmail,
            message: 'A fresh 6-digit verification code has been sent to your email to activate your account.',
          });
        }
      }

      const newUser = await User.create({
        username,
        email: normalizedEmail,
        password: hashedPassword,
        role: 'user',
        isVerified: false,
        verificationOTP: otp,
        verificationToken,
        otpExpires,
      });

      // Send verification email via Brevo in background
      sendVerificationEmail(normalizedEmail, { username, verificationToken, otp }).catch((err) =>
        console.error('[Registration Email Background Error]:', err.message)
      );

      return res.status(201).json({
        success: true,
        requiresVerification: true,
        email: normalizedEmail,
        message: 'Account registered! Please enter the 6-digit OTP sent to your email to activate your account.',
      });
    } else {
      const existingIndex = memoryDB.users.findIndex((u) => u.email === normalizedEmail || u.username === username);
      if (existingIndex !== -1) {
        const existing = memoryDB.users[existingIndex];
        if (existing.isVerified) {
          return res.status(400).json({ success: false, message: 'An active verified account with this email or username already exists' });
        } else {
          existing.username = username;
          existing.password = hashedPassword;
          existing.verificationOTP = otp;
          existing.verificationToken = verificationToken;
          existing.otpExpires = otpExpires;

          sendVerificationEmail(normalizedEmail, { username, verificationToken, otp }).catch((err) =>
            console.error('[Registration Email Background Error]:', err.message)
          );

          return res.status(200).json({
            success: true,
            requiresVerification: true,
            email: normalizedEmail,
            message: 'A fresh 6-digit verification code has been sent to your email to activate your account.',
          });
        }
      }

      const newUser = {
        _id: `user_${Date.now()}`,
        username,
        email: normalizedEmail,
        password: hashedPassword,
        role: 'user',
        isVerified: false,
        verificationOTP: otp,
        verificationToken,
        otpExpires,
        createdAt: new Date(),
      };
      memoryDB.users.push(newUser);

      sendVerificationEmail(normalizedEmail, { username, verificationToken, otp }).catch((err) =>
        console.error('[Registration Email Background Error]:', err.message)
      );

      return res.status(201).json({
        success: true,
        requiresVerification: true,
        email: normalizedEmail,
        message: 'Account registered! Please enter the 6-digit OTP sent to your email to activate your account.',
      });
    }
  } catch (err) {
    console.error('Register User Error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};

// 2. Verify Email via 6-Digit OTP or 1-Click Token
export const verifyEmailOTP = async (req, res) => {
  try {
    const { email, otp, token } = req.body;
    if (!email || (!otp && !token)) {
      return res.status(400).json({ success: false, message: 'Email and verification code/token are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    let user = null;

    if (isMongoConnected()) {
      user = await User.findOne({ email: normalizedEmail });
    } else {
      user = memoryDB.users.find((u) => u.email === normalizedEmail);
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'Account not found with this email' });
    }

    if (user.isVerified) {
      const authToken = generateToken({ id: user._id, email: user.email, username: user.username, role: 'user' });
      return res.status(200).json({
        success: true,
        message: 'Account is already verified. Logging you in...',
        token: authToken,
        user: { id: user._id, username: user.username, email: user.email, role: 'user' },
      });
    }

    // Check expiration
    if (user.otpExpires && new Date(user.otpExpires) < new Date()) {
      return res.status(400).json({
        success: false,
        expired: true,
        message: 'Verification code has expired. Please request a new code.',
      });
    }

    // Match OTP or Token
    const isOtpMatch = otp && String(user.verificationOTP).trim() === String(otp).trim();
    const isTokenMatch = token && user.verificationToken === token;

    if (!isOtpMatch && !isTokenMatch) {
      return res.status(400).json({ success: false, message: 'Invalid verification code. Please check your email and try again.' });
    }

    // Mark verified
    user.isVerified = true;
    user.verificationOTP = null;
    user.verificationToken = null;
    user.otpExpires = null;

    if (isMongoConnected()) {
      await user.save();
    }

    const authToken = generateToken({ id: user._id, email: user.email, username: user.username, role: 'user' });

    console.log(`[User Verified] ${user.email} successfully activated via OTP/Token.`);

    return res.status(200).json({
      success: true,
      message: '🎉 Account verified successfully! Welcome to iMovies.',
      token: authToken,
      user: { id: user._id, username: user.username, email: user.email, role: 'user' },
    });
  } catch (err) {
    console.error('Verify Email Error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};

// 3. Resend Email Verification OTP
export const resendVerificationOTP = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    let user = null;

    if (isMongoConnected()) {
      user = await User.findOne({ email: normalizedEmail });
    } else {
      user = memoryDB.users.find((u) => u.email === normalizedEmail);
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'No account registered with this email' });
    }

    if (user.isVerified) {
      return res.status(200).json({
        success: true,
        alreadyVerified: true,
        message: 'Account is already verified. You can log in directly.',
      });
    }

    const otp = generateNumericOTP();
    const verificationToken = crypto.randomBytes(24).toString('hex');
    const otpExpires = new Date(Date.now() + 15 * 60 * 1000);

    user.verificationOTP = otp;
    user.verificationToken = verificationToken;
    user.otpExpires = otpExpires;

    if (isMongoConnected()) {
      await user.save();
    }

    await sendVerificationEmail(normalizedEmail, { username: user.username, verificationToken, otp });

    return res.status(200).json({
      success: true,
      message: 'A fresh 6-digit verification code has been dispatched to your email.',
    });
  } catch (err) {
    console.error('Resend OTP Error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};

// 4. Request Password Reset (Sends 6-Digit OTP & 1-Click Link)
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    let user = null;

    if (isMongoConnected()) {
      user = await User.findOne({ email: normalizedEmail });
    } else {
      user = memoryDB.users.find((u) => u.email === normalizedEmail);
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'No registered user found with this email' });
    }

    const otp = generateNumericOTP();
    const resetToken = crypto.randomBytes(24).toString('hex');
    const resetExpires = new Date(Date.now() + 15 * 60 * 1000);

    user.resetPasswordOTP = otp;
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetExpires;

    if (isMongoConnected()) {
      await user.save();
    }

    await sendPasswordResetEmail(normalizedEmail, { username: user.username, resetToken, otp });

    return res.status(200).json({
      success: true,
      message: 'Password recovery OTP and reset link have been sent to your email address.',
    });
  } catch (err) {
    console.error('Forgot Password Error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};

// 5. Reset Password with OTP or Token
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, token, newPassword } = req.body;
    if (!email || (!otp && !token) || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email, recovery code/token, and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    let user = null;

    if (isMongoConnected()) {
      user = await User.findOne({ email: normalizedEmail });
    } else {
      user = memoryDB.users.find((u) => u.email === normalizedEmail);
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'Account not found with this email' });
    }

    // Check expiration
    if (user.resetPasswordExpires && new Date(user.resetPasswordExpires) < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Reset code has expired. Please request a new password recovery code.',
      });
    }

    // Validate OTP or Token
    const isOtpMatch = otp && String(user.resetPasswordOTP).trim() === String(otp).trim();
    const isTokenMatch = token && user.resetPasswordToken === token;

    if (!isOtpMatch && !isTokenMatch) {
      return res.status(400).json({ success: false, message: 'Invalid reset code or token. Please try again.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetPasswordOTP = null;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;

    if (isMongoConnected()) {
      await user.save();
    }

    return res.status(200).json({
      success: true,
      message: '🎉 Password reset successfully! You can now log in with your new password.',
    });
  } catch (err) {
    console.error('Reset Password Error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};

// 6. Register Admin
export const registerAdmin = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const normalizedEmail = email.toLowerCase().trim();

    if (isMongoConnected()) {
      const existingAdmin = await Admin.findOne({ $or: [{ email: normalizedEmail }, { username }] });
      if (existingAdmin) {
        return res.status(400).json({ success: false, message: 'Admin with this email or username already exists' });
      }

      const newAdmin = await Admin.create({
        username,
        email: normalizedEmail,
        password: hashedPassword,
        role: 'admin',
      });

      const token = generateToken({ id: newAdmin._id, email: newAdmin.email, username: newAdmin.username, role: 'admin' });
      return res.status(201).json({
        success: true,
        message: 'Admin account registered successfully!',
        token,
        user: { id: newAdmin._id, username: newAdmin.username, email: newAdmin.email, role: 'admin' },
      });
    } else {
      const existingAdmin = memoryDB.admins.find((a) => a.email === normalizedEmail || a.username === username);
      if (existingAdmin) {
        return res.status(400).json({ success: false, message: 'Admin with this email or username already exists' });
      }

      const newAdmin = {
        _id: `admin_${Date.now()}`,
        username,
        email: normalizedEmail,
        password: hashedPassword,
        role: 'admin',
        createdAt: new Date(),
      };
      memoryDB.admins.push(newAdmin);

      const token = generateToken({ id: newAdmin._id, email: newAdmin.email, username: newAdmin.username, role: 'admin' });
      return res.status(201).json({
        success: true,
        message: 'Admin registered successfully!',
        token,
        user: { id: newAdmin._id, username: newAdmin.username, email: newAdmin.email, role: 'admin' },
      });
    }
  } catch (err) {
    console.error('Register Admin Error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};

// 7. Login (Enforces User Email Verification)
export const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    let account = null;
    let resolvedRole = role || 'user';

    if (isMongoConnected()) {
      if (resolvedRole === 'admin') {
        account = await Admin.findOne({ email: normalizedEmail });
      } else {
        account = await User.findOne({ email: normalizedEmail });
        if (!account) {
          const adminCheck = await Admin.findOne({ email: normalizedEmail });
          if (adminCheck) {
            account = adminCheck;
            resolvedRole = 'admin';
          }
        }
      }
    } else {
      if (resolvedRole === 'admin') {
        account = memoryDB.admins.find((a) => a.email === normalizedEmail);
      } else {
        account = memoryDB.users.find((u) => u.email === normalizedEmail);
        if (!account) {
          const adminCheck = memoryDB.admins.find((a) => a.email === normalizedEmail);
          if (adminCheck) {
            account = adminCheck;
            resolvedRole = 'admin';
          }
        }
      }
    }

    if (!account) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. Account not found.' });
    }

    const isMatch = await bcrypt.compare(password, account.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. Password incorrect.' });
    }

    // ENFORCE EMAIL VERIFICATION FOR USERS
    if (resolvedRole === 'user' && account.isVerified === false) {
      // Re-issue a fresh OTP so user can verify immediately
      const otp = generateNumericOTP();
      const verificationToken = crypto.randomBytes(24).toString('hex');
      const otpExpires = new Date(Date.now() + 15 * 60 * 1000);

      account.verificationOTP = otp;
      account.verificationToken = verificationToken;
      account.otpExpires = otpExpires;
      if (isMongoConnected()) {
        await account.save();
      }

      sendVerificationEmail(account.email, { username: account.username, verificationToken, otp }).catch((err) =>
        console.error('[Login Verification Email Error]:', err.message)
      );

      return res.status(403).json({
        success: false,
        isUnverified: true,
        email: account.email,
        message: 'Your account is not verified yet. We have just dispatched a fresh 6-digit OTP to your email.',
      });
    }

    const token = generateToken({
      id: account._id,
      email: account.email,
      username: account.username,
      role: resolvedRole,
    });

    return res.json({
      success: true,
      message: `Welcome back, ${account.username}!`,
      token,
      user: {
        id: account._id,
        username: account.username,
        email: account.email,
        role: resolvedRole,
      },
    });
  } catch (err) {
    console.error('Login Error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};

// Current Session Info
export const getMe = async (req, res) => {
  return res.json({
    success: true,
    user: req.user,
  });
};
