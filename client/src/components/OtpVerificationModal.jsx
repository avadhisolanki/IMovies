import React, { useState, useEffect, useRef } from 'react';
import { Mail, ShieldCheck, CheckCircle2, ArrowRight, RotateCw, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const OtpVerificationModal = ({ isOpen, onClose, email, onVerificationSuccess }) => {
  const { verifyOTP, resendOTP } = useAuth();
  const navigate = useNavigate();

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const inputRefs = useRef([]);

  useEffect(() => {
    let timer;
    if (isOpen && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isOpen, countdown]);

  useEffect(() => {
    if (isOpen && inputRefs.current[0]) {
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 150);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (index, value) => {
    // Only accept numeric inputs
    if (value && !/^\d+$/.test(value)) return;

    const newOtp = [...otp];
    // Handle paste of full 6-digit code
    if (value.length > 1) {
      const pastedDigits = value.slice(0, 6).split('');
      for (let i = 0; i < 6; i++) {
        newOtp[i] = pastedDigits[i] || '';
      }
      setOtp(newOtp);
      const nextFocus = Math.min(pastedDigits.length, 5);
      inputRefs.current[nextFocus]?.focus();
      return;
    }

    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-advance to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    const fullOtp = otp.join('').trim();

    if (fullOtp.length !== 6) {
      toast.warning('Please enter all 6 digits of the verification code');
      return;
    }

    try {
      setSubmitting(true);
      const res = await verifyOTP(email, fullOtp);
      if (res.success) {
        toast.success(res.message || '🎉 Email verified successfully! Welcome to iMovies.');
        if (onVerificationSuccess) {
          onVerificationSuccess(res.user);
        } else {
          if (onClose) onClose();
          navigate('/home');
        }
      } else {
        toast.error(res.message || 'Verification failed');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification failed. Please check the code.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    try {
      setResending(true);
      const res = await resendOTP(email);
      if (res.success) {
        toast.success('A new 6-digit OTP code has been dispatched to your email.');
        setCountdown(60);
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      } else {
        toast.error(res.message || 'Failed to resend OTP');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend code');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-[#1a242f] border border-[#2c3b4d] rounded-2xl shadow-2xl p-6 sm:p-8 overflow-hidden">
        {/* Prime Accent Top Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#00a8e1] via-[#00d0ff] to-[#00a8e1]"></div>

        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg hover:bg-[#253241] transition"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Icon & Title */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-[#00a8e1]/10 border border-[#00a8e1]/30 flex items-center justify-center text-[#00a8e1] shadow-prime-glow">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-black text-white tracking-tight">
            Authenticate Your Email
          </h3>
          <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
            We sent a secure 6-digit one-time password (OTP) and activation link to:
          </p>
          <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 bg-[#151c24] border border-[#253241] rounded-full text-xs font-mono font-bold text-[#00a8e1]">
            <Mail className="w-3.5 h-3.5" />
            <span>{email}</span>
          </div>
        </div>

        {/* 6-Digit OTP Inputs */}
        <form onSubmit={handleVerify} className="space-y-6">
          <div className="flex justify-center gap-2 sm:gap-2.5">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-mono font-black rounded-xl border bg-[#0f171e] text-white transition-all focus:outline-none ${
                  digit
                    ? 'border-[#00a8e1] ring-2 ring-[#00a8e1]/30 bg-[#151c24]'
                    : 'border-[#2c3b4d] focus:border-[#00a8e1]'
                }`}
              />
            ))}
          </div>

          {/* Verification CTA */}
          <button
            type="submit"
            disabled={submitting || otp.join('').length !== 6}
            className="w-full flex items-center justify-center gap-2 bg-[#00a8e1] hover:bg-[#0082b3] text-black font-black text-sm py-3.5 rounded-xl transition transform hover:scale-[1.01] shadow-prime-glow disabled:opacity-40 disabled:hover:scale-100 cursor-pointer"
          >
            {submitting ? (
              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Verify & Activate Account</span>
              </>
            )}
          </button>
        </form>

        {/* Resend OTP Section */}
        <div className="mt-6 pt-4 border-t border-[#253241] flex flex-col sm:flex-row items-center justify-between text-xs text-gray-400 gap-2">
          <span>Didn't receive the code?</span>
          <button
            type="button"
            onClick={handleResend}
            disabled={countdown > 0 || resending}
            className={`flex items-center gap-1.5 font-bold transition ${
              countdown > 0
                ? 'text-gray-500 cursor-not-allowed'
                : 'text-[#00a8e1] hover:underline cursor-pointer'
            }`}
          >
            <RotateCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
            {countdown > 0 ? `Resend code in ${countdown}s` : 'Resend Code Now'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OtpVerificationModal;
