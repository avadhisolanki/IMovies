import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { KeyRound, Lock, Film, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { resetPassword } = useAuth();

  const token = searchParams.get('token');
  const email = searchParams.get('email') || '';

  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!newPassword || newPassword.length < 6) {
      toast.warning('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.warning('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      const res = await resetPassword(email, otp ? otp.trim() : null, token, newPassword);
      if (res.success) {
        toast.success(res.message || '🎉 Password reset successfully! Redirecting to login...');
        setTimeout(() => navigate('/login'), 1500);
      } else {
        toast.error(res.message || 'Password reset failed');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password reset failed. Token or OTP might be invalid/expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f171e] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full mx-auto text-center">
        <Link to="/landing" className="inline-flex items-center gap-2 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#00a8e1] to-[#00d0ff] flex items-center justify-center text-black font-black shadow-prime-glow">
            <Film className="w-6 h-6" />
          </div>
          <span className="text-2xl font-black text-white tracking-tight">
            iMovies <span className="text-xs text-[#00a8e1] font-bold">PRIME</span>
          </span>
        </Link>

        <div className="bg-[#1a242f] border border-[#2c3b4d] rounded-2xl shadow-2xl p-8 text-left">
          <div className="text-center mb-6">
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 shadow-lg">
              <KeyRound className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-white">Reset Your Password</h2>
            <p className="text-xs text-gray-400 mt-1">
              Choose a secure password for account <span className="text-[#00a8e1]">{email}</span>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!token && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                  6-Digit Recovery OTP
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="w-full bg-[#151c24] text-white text-center text-lg font-mono font-bold tracking-widest py-2.5 rounded-xl border border-[#2c3b4d] focus:outline-none focus:border-[#00a8e1]"
                />
              </div>
            )}

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
                  <span>Update Password</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/login" className="text-xs text-gray-400 hover:text-white">
              ← Return to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
