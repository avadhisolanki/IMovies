import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Film, Lock, Mail, User, Shield, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import OtpVerificationModal from '../components/OtpVerificationModal';
import { toast } from 'react-toastify';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [submitting, setSubmitting] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!username || !email || !password) {
      toast.warning('Please fill in all fields');
      return;
    }
    if (username.length < 3 || username.length > 20) {
      toast.warning('Username must be between 3 and 20 characters');
      return;
    }
    if (password.length < 6) {
      toast.warning('Password must be at least 6 characters');
      return;
    }

    try {
      setSubmitting(true);
      const res = await register(username, email, password, role);
      if (res.success) {
        if (res.requiresVerification) {
          toast.info(res.message || 'Verification OTP sent to your email.');
          setShowOtpModal(true);
          return;
        }
        toast.success(`Account created! Welcome to iMovies, ${res.user.username}`);
        navigate(res.user.role === 'admin' ? '/admin' : '/home');
      } else {
        toast.error(res.message || 'Registration failed');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f171e] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <Link to="/landing" className="inline-flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#00a8e1] to-[#00d0ff] flex items-center justify-center text-black font-black shadow-prime-glow">
            <Film className="w-6 h-6" />
          </div>
          <span className="text-2xl font-black text-white tracking-tight">
            iMovies <span className="text-xs text-[#00a8e1] font-bold">PRIME</span>
          </span>
        </Link>
        <h2 className="mt-4 text-2xl font-extrabold text-white">Create your Prime Account</h2>
        <p className="mt-1 text-xs text-gray-400">
          Unlock instant seat holds, member pricing, and 4K cinema passes
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-[#1a242f] py-8 px-6 sm:px-10 shadow-2xl rounded-2xl border border-[#2c3b4d]">
          {/* Role selector */}
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
                Username (3-20 characters)
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="johndoe"
                  className="w-full bg-[#151c24] text-white text-sm pl-10 pr-4 py-2.5 rounded-lg border border-[#2c3b4d] focus:outline-none focus:border-[#00a8e1] focus:ring-1 focus:ring-[#00a8e1]"
                />
                <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-3 pointer-events-none" />
              </div>
            </div>

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
              <p className="mt-1 text-[11px] text-gray-400">
                A 6-digit verification code will be sent to this email address.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                Password (min 6 characters)
              </label>
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
                  <span>Create {role === 'admin' ? 'Admin' : 'Prime'} Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-400">
              Already have an account?{' '}
              <Link to="/login" className="text-[#00a8e1] hover:underline font-bold">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* 6-Digit Email OTP Authentication Window */}
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

export default RegisterPage;
