import React from 'react';
import { Film, ShieldCheck, Zap, Sparkles } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-[#0b1016] border-t border-[#1a242f] text-gray-400 py-12 px-4 sm:px-6 lg:px-8 mt-20">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          
          {/* Brand info */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#00a8e1] flex items-center justify-center text-black font-black">
                <Film className="w-5 h-5" />
              </div>
              <span className="text-xl font-black text-white tracking-tight">
                iMovies <span className="text-xs text-[#00a8e1] font-bold">PRIME</span>
              </span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Premium theatrical ticket booking powered by Amazon Prime Cinema standards. Instant seat lock, IMAX 4K Laser, and zero cancellation convenience.
            </p>
            <div className="flex items-center gap-3 text-xs text-[#00a8e1]">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> 100% Safe Payments
              </span>
              <span className="flex items-center gap-1">
                <Zap className="w-3.5 h-3.5" /> Real-time Lock
              </span>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-white mb-3">Cinemas & Cities</h4>
            <ul className="space-y-2 text-xs">
              <li><span className="hover:text-white cursor-pointer transition">Mumbai IMAX Palladium</span></li>
              <li><span className="hover:text-white cursor-pointer transition">Delhi NCR Pacific VIP</span></li>
              <li><span className="hover:text-white cursor-pointer transition">Bengaluru Forum Laser</span></li>
              <li><span className="hover:text-white cursor-pointer transition">Hyderabad Megaplex</span></li>
            </ul>
          </div>

          {/* Experience */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-white mb-3">Prime Cinema Experience</h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-1.5"><Sparkles className="w-3 h-3 text-[#00a8e1]" /> Balcony Club Lounge</li>
              <li className="flex items-center gap-1.5"><Sparkles className="w-3 h-3 text-[#00a8e1]" /> 5-Minute TTL Seat Hold</li>
              <li className="flex items-center gap-1.5"><Sparkles className="w-3 h-3 text-[#00a8e1]" /> Dolby Atmos 7.1 Acoustic</li>
              <li className="flex items-center gap-1.5"><Sparkles className="w-3 h-3 text-[#00a8e1]" /> Digital QR Pass Access</li>
            </ul>
          </div>

          {/* Tech stack badge */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-white mb-3">Enterprise Stack</h4>
            <p className="text-xs text-gray-400 leading-relaxed mb-3">
              Built on React (Vite) + Tailwind CSS + Node.js Express + MongoDB (Mongoose ODM) with JWT & bcrypt.
            </p>
            <div className="inline-block bg-[#1a242f] border border-[#2c3b4d] rounded-md px-3 py-1.5 text-[11px] text-[#00a8e1] font-mono">
              Status: Production Ready • v1.0
            </div>
          </div>
        </div>

        <div className="border-t border-[#1a242f] pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-4">
          <p>© 2026 iMovies Entertainment Inc. All rights reserved.</p>
          <div className="flex gap-6">
            <span className="hover:text-gray-300 cursor-pointer">Privacy Notice</span>
            <span className="hover:text-gray-300 cursor-pointer">Conditions of Use</span>
            <span className="hover:text-gray-300 cursor-pointer">Prime Cinema Help</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
