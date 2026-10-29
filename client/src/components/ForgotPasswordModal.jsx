import React, { useState } from 'react';
import { Mail, Lock, KeyRound, CheckCircle2, ArrowRight, X, RotateCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const ForgotPasswordModal = ({ isOpen, onClose, initialEmail = '' }) => {
  const { forgotPassword, resetPassword } = useAuth();

  const [step, setStep] = useState(1); // 1: Request OTP, 2: Enter OTP + New Password
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.warning('Please enter your email address');
      return;
    }

    try {
      setLoading(true);
      const res = await forgotPassword(email);
      if (res.success) {
        toast.success(res.message || 'Password reset OTP dispatched to your email.');
        setStep(2);
      } else {
        toast.error(res.message || 'Failed to request reset OTP');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to dispatch password recovery email');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!otp || otp.trim().length !== 6) {
      toast.warning('Please enter the 6-digit OTP code');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      toast.warning('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.warning('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      const res = await resetPassword(email, otp.trim(), null, newPassword);
      if (res.success) {
        toast.success(res.message || '🎉 Password reset successfully! You can now log in.');
        onClose();
      } else {
        toast.error(res.message || 'Failed to reset password');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-[#1a242f] border border-[#2c3b4d] rounded-2xl shadow-2xl p-6 sm:p-8 overflow-hidden">
        {/* Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-500 via-[#00a8e1] to-red-500"></div>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg hover:bg-[#253241] transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon & Title */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 shadow-lg">
            <KeyRound className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-black text-white tracking-tight">
            {step === 1 ? 'Recover Password' : 'Set New Password'}
          </h3>
          <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
            {step === 1
              ? 'Enter your registered email to receive a 6-digit recovery OTP and reset link.'
              : `Enter the 6-digit OTP code sent to ${email} and set your new password.`}
          </p>
        </div>

        {/* Step 1: Request OTP */}
        {step === 1 ? (
          <form onSubmit={handleRequestOTP} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                Registered Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-[#151c24] text-white text-sm pl-10 pr-4 py-3 rounded-xl border border-[#2c3b4d] focus:outline-none focus:border-[#00a8e1]"
                />
                <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5 pointer-events-none" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[#00a8e1] hover:bg-[#0082b3] text-black font-black text-sm py-3.5 rounded-xl transition transform hover:scale-[1.01] shadow-prime-glow disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Send Recovery OTP Code</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          /* Step 2: Verify OTP & Enter New Password */
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                6-Digit Recovery OTP
              </label>
              <div className="relative">
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 123456"
                  className="w-full bg-[#151c24] text-white text-center text-lg font-mono font-bold tracking-widest py-2.5 rounded-xl border border-[#2c3b4d] focus:outline-none focus:border-[#00a8e1]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                New Password (min 6 characters)
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#151c24] text-white text-sm pl-10 pr-4 py-2.5 rounded-xl border border-[#2c3b4d] focus:outline-none focus:border-[#00a8e1]"
                />
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#151c24] text-white text-sm pl-10 pr-4 py-2.5 rounded-xl border border-[#2c3b4d] focus:outline-none focus:border-[#00a8e1]"
                />
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3 pointer-events-none" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[#00a8e1] hover:bg-[#0082b3] text-black font-black text-sm py-3.5 rounded-xl transition transform hover:scale-[1.01] shadow-prime-glow disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Update & Reset Password</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full text-center text-xs text-gray-400 hover:text-white pt-2"
            >
              ← Back to change email or resend code
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordModal;
