import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Film, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import OtpVerificationModal from '../components/OtpVerificationModal';
import { toast } from 'react-toastify';

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { verifyOTP } = useAuth();

  const token = searchParams.get('token');
  const email = searchParams.get('email') || '';

  const [verifying, setVerifying] = useState(!!token);
  const [success, setSuccess] = useState(false);
  const [modalOpen, setModalOpen] = useState(!token);

  useEffect(() => {
    const handleDirectToken = async () => {
      if (token && email) {
        try {
          const res = await verifyOTP(email, null, token);
          if (res.success) {
            setSuccess(true);
            toast.success('🎉 1-Click Verification complete! Welcome to iMovies.');
            setTimeout(() => navigate('/home'), 1500);
          } else {
            setModalOpen(true);
            toast.error(res.message || 'Token expired or invalid. Please enter your 6-digit OTP.');
          }
        } catch (err) {
          setModalOpen(true);
          toast.error(err.response?.data?.message || 'Verification link failed. Please enter OTP manually.');
        } finally {
          setVerifying(false);
        }
      }
    };

    handleDirectToken();
  }, [token, email]);

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

        <div className="bg-[#1a242f] border border-[#2c3b4d] rounded-2xl shadow-2xl p-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#00a8e1]/10 border border-[#00a8e1]/30 flex items-center justify-center text-[#00a8e1] shadow-prime-glow">
            <ShieldCheck className="w-10 h-10" />
          </div>

          <h2 className="text-2xl font-black text-white mb-2">Account Activation</h2>

          {verifying ? (
            <div className="py-6">
              <div className="w-8 h-8 border-3 border-[#00a8e1] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-xs text-gray-400">Verifying secure activation token...</p>
            </div>
          ) : success ? (
            <div className="py-4 space-y-3">
              <p className="text-sm font-semibold text-emerald-400 flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Account Verified & Activated!
              </p>
              <p className="text-xs text-gray-400">Redirecting to your Prime Cinema home...</p>
            </div>
          ) : (
            <div className="py-4 space-y-4">
              <p className="text-xs text-gray-300">
                Please enter the 6-digit verification code sent to your registered email to continue.
              </p>
              <button
                onClick={() => setModalOpen(true)}
                className="w-full flex items-center justify-center gap-2 bg-[#00a8e1] hover:bg-[#0082b3] text-black font-black text-xs py-3 rounded-xl transition shadow-prime-glow cursor-pointer"
              >
                <span>Enter 6-Digit OTP</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      <OtpVerificationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        email={email}
        onVerificationSuccess={() => navigate('/home')}
      />
    </div>
  );
};

export default VerifyEmailPage;
