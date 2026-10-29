import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Film, Lock, Mail, Shield, User, ArrowRight, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ForgotPasswordModal from '../components/ForgotPasswordModal';
import OtpVerificationModal from '../components/OtpVerificationModal';
import { toast } from 'react-toastify';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user'); // 'user' or 'admin'
  const [submitting, setSubmitting] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.warning('Please enter your email and password');
      return;
    }

    try {
      setSubmitting(true);
      const res = await login(email, password, role);
      if (res.success) {
        toast.success(`Welcome back, ${res.user.username}!`);
        navigate(res.user.role === 'admin' ? '/admin' : '/home');
      } else {
        if (res.isUnverified) {
          toast.info(res.message || 'Account not verified. A 6-digit OTP code has been dispatched to your email.');
          setShowOtpModal(true);
          return;
        }
        toast.error(res.message || 'Login failed');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFillDemo = (type) => {
    if (type === 'user') {
      setEmail('user@imovies.com');
      setPassword('user123');
      setRole('user');
    } else {
      setEmail('admin@imovies.com');
      setPassword('admin123');
      setRole('admin');
    }
    toast.info(`Filled demo ${type} credentials`);
  };

  return (
    <div className="min-h-screen bg-[#0f171e] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Prime Header Logo */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <Link to="/landing" className="inline-flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#00a8e1] to-[#00d0ff] flex items-center justify-center text-black font-black shadow-prime-glow">
            <Film className="w-6 h-6" />
          </div>
          <span className="text-2xl font-black text-white tracking-tight">
            iMovies <span className="text-xs text-[#00a8e1] font-bold">PRIME</span>
          </span>
        </Link>
        <h2 className="mt-4 text-2xl font-extrabold text-white">Sign in to your account</h2>
        <p className="mt-1 text-xs text-gray-400">
          Book seats with real-time TTL hold and exclusive Prime benefits
        </p>
      </div>

      {/* Card Form */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-[#1a242f] py-8 px-6 sm:px-10 shadow-2xl rounded-2xl border border-[#2c3b4d]">
          {/* Role Switcher Tabs */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-[#151c24] rounded-xl mb-6 border border-[#253241]">
            <button
              type="button"
              onClick={() => setRole('user')}
              className={`flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition ${
                role === 'user'
                  ? 'bg-[#00a8e1] text-black shadow-prime-glow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              Movie Viewer
            </button>
            <button
              type="button"
              onClick={() => setRole('admin')}
              className={`flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition ${
                role === 'admin'
                  ? 'bg-amber-400 text-black shadow-prime-gold'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              Cinema Admin
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-[#151c24] text-white text-sm pl-10 pr-4 py-2.5 rounded-lg border border-[#2c3b4d] focus:outline-none focus:border-[#00a8e1] focus:ring-1 focus:ring-[#00a8e1]"
                />
                <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3 pointer-events-none" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-xs text-[#00a8e1] hover:underline font-semibold cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#151c24] text-white text-sm pl-10 pr-4 py-2.5 rounded-lg border border-[#2c3b4d] focus:outline-none focus:border-[#00a8e1] focus:ring-1 focus:ring-[#00a8e1]"
                />
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3 pointer-events-none" />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className={`w-full flex items-center justify-center gap-2 font-black text-sm py-3 rounded-lg transition transform hover:scale-[1.02] shadow-prime-glow cursor-pointer ${
                role === 'admin'
                  ? 'bg-amber-400 hover:bg-amber-500 text-black'
                  : 'bg-[#00a8e1] hover:bg-[#0082b3] text-black'
              } disabled:opacity-50`}
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Sign In as {role === 'admin' ? 'Administrator' : 'Prime Member'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick 1-Click Demo Login Credentials */}
          <div className="mt-6 pt-6 border-t border-[#253241]">
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 text-center mb-3">
              One-Click Demo Credentials
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleFillDemo('user')}
                className="bg-[#151c24] hover:bg-[#253241] border border-[#2c3b4d] hover:border-[#00a8e1] text-xs font-semibold text-gray-300 hover:text-white py-2 px-3 rounded-lg transition text-center"
              >
                🎬 Fill Demo User
              </button>
              <button
                type="button"
                onClick={() => handleFillDemo('admin')}
                className="bg-[#151c24] hover:bg-[#253241] border border-[#2c3b4d] hover:border-amber-400 text-xs font-semibold text-gray-300 hover:text-amber-300 py-2 px-3 rounded-lg transition text-center"
              >
                👑 Fill Demo Admin
              </button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-400">
              New to iMovies?{' '}
              <Link to="/register" className="text-[#00a8e1] hover:underline font-bold">
                Create your Prime account
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Forgot Password Recovery Modal */}
      <ForgotPasswordModal
        isOpen={showForgotModal}
        onClose={() => setShowForgotModal(false)}
        initialEmail={email}
      />

      {/* In-Place OTP Verification Modal (Triggers when unverified user attempts sign-in) */}
      <OtpVerificationModal
        isOpen={showOtpModal}
        onClose={() => setShowOtpModal(false)}
        email={email}
        onVerificationSuccess={(user) => {
          setShowOtpModal(false);
          navigate('/home');
        }}
      />
    </div>
  );
};

export default LoginPage;
