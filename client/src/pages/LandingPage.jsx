import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Film, Ticket, Shield, Sparkles, Star, ChevronRight, Zap, Play } from 'lucide-react';
import api from '../services/api';
import MovieCard from '../components/MovieCard';
import TrailerModal from '../components/TrailerModal';

const LandingPage = () => {
  const navigate = useNavigate();
  const [movies, setMovies] = useState([]);
  const [trailerOpen, setTrailerOpen] = useState(false);
  const [featuredMovie, setFeaturedMovie] = useState(null);

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const res = await api.get('/movie');
        if (res.data && res.data.movies) {
          setMovies(res.data.movies);
          setFeaturedMovie(res.data.movies[0]);
        }
      } catch (err) {
        console.error('Failed to load landing movies:', err);
      }
    };
    fetchMovies();
  }, []);

  return (
    <div className="min-h-screen bg-[#0f171e] text-white">
      {/* Prime Hero Banner Section */}
      <div className="relative min-h-[600px] lg:min-h-[700px] flex items-center overflow-hidden">
        {/* Backdrop visual */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1600&auto=format&fit=crop&q=80"
            alt="Cinema Hero"
            className="w-full h-full object-cover object-center opacity-40 scale-105 transition-transform duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f171e] via-[#0f171e]/75 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-[#0f171e] via-[#0f171e]/85 to-transparent"></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-2xl space-y-6">
            <div className="inline-flex items-center gap-2 bg-[#00a8e1]/15 border border-[#00a8e1]/40 px-3.5 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-[#00a8e1] animate-ping"></span>
              <span className="text-xs font-bold uppercase tracking-wider text-[#00a8e1]">
                Prime Video Cinema Experience
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight text-white">
              The Grandeur of Cinema, Reserved in Seconds.
            </h1>

            <p className="text-base sm:text-lg text-gray-300 leading-relaxed">
              Experience blockbusters on massive IMAX 4K Laser screens with Dolby Atmos sound. Real-time seat locking with 5-minute checkout protection and seamless digital boarding passes.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                to="/register"
                className="flex items-center gap-2 bg-[#00a8e1] hover:bg-[#0082b3] text-black font-extrabold text-base px-8 py-3.5 rounded-lg transition transform hover:scale-105 shadow-prime-glow cursor-pointer"
              >
                <Ticket className="w-5 h-5 fill-black" />
                Join Prime Cinema Free
              </Link>

              <Link
                to="/login"
                className="flex items-center gap-2 bg-[#1a242f] hover:bg-[#253241] text-white text-base font-bold px-6 py-3.5 rounded-lg border border-[#2c3b4d] hover:border-gray-400 transition"
              >
                Sign In to Account
              </Link>

              {featuredMovie && (
                <button
                  onClick={() => setTrailerOpen(true)}
                  className="flex items-center gap-2 text-sm text-gray-300 hover:text-white px-4 py-2 transition"
                >
                  <Play className="w-4 h-4 text-[#00a8e1] fill-[#00a8e1]" />
                  Watch Featured Trailer
                </button>
              )}
            </div>

            {/* Micro badges */}
            <div className="flex flex-wrap items-center gap-6 pt-4 text-xs text-gray-400">
              <div className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-[#00a8e1]" />
                <span>5-Minute Real-Time Seat Lock</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Tier-Based Club Seating</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>Instant Ticket QR Pass</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Blockbuster Showcase Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-baseline justify-between mb-6">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">Now Showing in Theatres</h2>
            <p className="text-xs text-gray-400 mt-1">Book early to reserve prime balcony club seating</p>
          </div>
          <Link
            to="/register"
            className="text-xs text-[#00a8e1] hover:underline font-bold flex items-center gap-1"
          >
            Explore All <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-6">
          {movies.slice(0, 8).map((movie) => (
            <MovieCard key={movie._id} movie={movie} />
          ))}
        </div>
      </div>

      {/* Prime Cinema Perks Grid */}
      <div className="bg-[#151c24] py-16 border-y border-[#253241]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-black text-white tracking-tight">The Prime Advantage</h2>
            <p className="text-sm text-gray-400 mt-2">
              Engineered for cinephiles who demand the finest visual fidelity and zero-friction booking.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-[#1a242f] p-6 rounded-2xl border border-[#253241] hover:border-[#00a8e1]/50 transition">
              <div className="w-12 h-12 rounded-xl bg-[#00a8e1]/10 text-[#00a8e1] flex items-center justify-center mb-4">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Real-Time Seat Locking</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Never lose your seat while entering card details. Our TTL engine reserves your seats exclusively for 5 minutes across all connected devices.
              </p>
            </div>

            <div className="bg-[#1a242f] p-6 rounded-2xl border border-[#253241] hover:border-[#00a8e1]/50 transition">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-4">
                <Film className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">IMAX 4K Laser & Dolby Atmos</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Partnered with top tier cinema screens featuring dual 4K laser projectors, 12-channel immersive sound, and motorized plush recliners.
              </p>
            </div>

            <div className="bg-[#1a242f] p-6 rounded-2xl border border-[#253241] hover:border-[#00a8e1]/50 transition">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Digital Pass & Hassle-free Entry</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Get an instant QR-coded cinema boarding pass. Scan straight at the auditorium entry gate without waiting in physical box-office lines.
              </p>
            </div>
          </div>
        </div>
      </div>

      {featuredMovie && (
        <TrailerModal
          isOpen={trailerOpen}
          onClose={() => setTrailerOpen(false)}
          trailerUrl={featuredMovie.trailerUrl}
          movieName={featuredMovie.movieName}
        />
      )}
    </div>
  );
};

export default LandingPage;
