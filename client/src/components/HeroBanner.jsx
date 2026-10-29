import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ticket, Play, Bookmark, Star, ChevronLeft, ChevronRight, Info } from 'lucide-react';
import TrailerModal from './TrailerModal';
import api from '../services/api';
import { getBackdropUrl } from '../services/tmdb';
import { toast } from 'react-toastify';

const HeroBanner = ({ movies = [] }) => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [trailerOpen, setTrailerOpen] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);

  // Filter or take featured movies
  const featuredList =
    movies.filter((m) => m.featured).length > 0
      ? movies.filter((m) => m.featured)
      : movies.slice(0, 6);

  const currentMovie = featuredList[currentIndex] || movies[0];

  // Auto-slide every 7 seconds
  useEffect(() => {
    if (featuredList.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featuredList.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [featuredList.length]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % featuredList.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + featuredList.length) % featuredList.length);
  };

  const handleWatchlist = async () => {
    if (!currentMovie) return;
    const mId = currentMovie._id || currentMovie.id;
    try {
      const res = await api.post('/favorite/toggle', { movieId: mId });
      if (res.data && res.data.success) {
        setIsFavorited(res.data.isFavorited);
        toast.info(res.data.message);
      }
    } catch {
      toast.error('Sign in to save to your Prime Watchlist');
    }
  };

  if (!currentMovie) return null;

  const movieId = currentMovie._id || currentMovie.id;
  const movieTitle = currentMovie.title || currentMovie.movieName || 'Featured Film';
  const movieOverview = currentMovie.overview || currentMovie.description || '';
  const backdrop = currentMovie.backdropUrl || getBackdropUrl(currentMovie.backdrop_path);
  const ratingVal = Number(currentMovie.rating ?? currentMovie.vote_average ?? 8.5);
  const durationVal = currentMovie.duration || (currentMovie.runtime ? `${currentMovie.runtime} min` : '150 min');

  return (
    <div className="relative w-full h-[480px] sm:h-[540px] lg:h-[620px] overflow-hidden bg-[#0f171e]">
      {/* Background Backdrop Image */}
      <div className="absolute inset-0">
        <img
          src={backdrop}
          alt={movieTitle}
          className="w-full h-full object-cover object-center transition-all duration-1000 ease-in-out scale-100 hover:scale-105"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1600&auto=format&fit=crop&q=80';
          }}
        />

        {/* Amazon Prime Cinematic Multi-Directional Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0f171e] via-[#0f171e]/85 to-transparent w-full md:w-3/4 z-10"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f171e] via-[#0f171e]/40 to-transparent z-10"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#0f171e]/60 via-transparent to-transparent z-10"></div>
      </div>

      {/* Banner Content Container */}
      <div className="relative z-20 max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
        <div className="max-w-2xl space-y-4">
          
          {/* Prime Video Badge Row */}
          <div className="flex items-center gap-2.5">
            <span className="bg-[#00a8e1] text-black text-xs font-black px-2.5 py-0.5 rounded tracking-wider uppercase shadow-prime-glow">
              PRIME CINEMA
            </span>
            <span className="text-xs text-gray-300 font-semibold tracking-wide">
              EXCLUSIVE THEATRICAL RELEASE
            </span>
          </div>

          {/* Movie Title */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-none drop-shadow-md">
            {movieTitle}
          </h1>

          {/* Meta Information Bar */}
          <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-gray-300 font-medium">
            <span className="flex items-center gap-1 text-amber-400 font-bold bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/30">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              {ratingVal.toFixed(1)} TMDB
            </span>
            <span>•</span>
            <span className="border border-gray-600 px-1.5 py-0.5 rounded text-[11px] font-bold text-gray-300">
              {currentMovie.certification || 'U/A'}
            </span>
            <span>•</span>
            <span>{durationVal}</span>
            <span>•</span>
            <span className="text-[#00a8e1] font-semibold">{currentMovie.language || 'English'}</span>
          </div>

          {/* Genres Tags */}
          <div className="flex flex-wrap gap-1.5">
            {currentMovie.genres?.map((g) => (
              <span
                key={typeof g === 'string' ? g : g.name}
                className="text-xs bg-[#1a242f]/80 text-gray-300 px-2.5 py-0.5 rounded-full border border-gray-700/60"
              >
                {typeof g === 'string' ? g : g.name}
              </span>
            ))}
          </div>

          {/* Synopsis */}
          <p className="text-xs sm:text-sm text-gray-300 leading-relaxed line-clamp-3 md:line-clamp-4 max-w-xl">
            {movieOverview}
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => navigate(`/movieshows/${movieId}`)}
              className="flex items-center gap-2 bg-[#00a8e1] hover:bg-[#0082b3] text-black font-extrabold text-sm sm:text-base px-6 py-3 rounded-md transition transform hover:scale-105 shadow-prime-glow cursor-pointer"
            >
              <Ticket className="w-5 h-5 fill-black" />
              Book Theatrical Tickets
            </button>

            {currentMovie.trailerUrl && (
              <button
                onClick={() => setTrailerOpen(true)}
                className="flex items-center gap-2 bg-[#1a242f]/90 hover:bg-[#253241] text-white text-sm sm:text-base font-semibold px-5 py-3 rounded-md border border-gray-600 hover:border-gray-400 transition cursor-pointer backdrop-blur-sm"
              >
                <Play className="w-4 h-4 fill-white text-white" />
                Watch Trailer
              </button>
            )}

            <button
              onClick={handleWatchlist}
              className="p-3 bg-[#1a242f]/90 hover:bg-[#253241] text-gray-300 hover:text-white rounded-md border border-gray-600 transition cursor-pointer"
              title="Add to Prime Watchlist"
            >
              <Bookmark className={`w-5 h-5 ${isFavorited ? 'fill-[#00a8e1] text-[#00a8e1]' : ''}`} />
            </button>

            <button
              onClick={() => navigate(`/moviedetails/${movieId}`)}
              className="p-3 bg-[#1a242f]/90 hover:bg-[#253241] text-gray-300 hover:text-white rounded-md border border-gray-600 transition cursor-pointer"
              title="More Details & Reviews"
            >
              <Info className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Slide Navigation Controls */}
      {featuredList.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-black/40 hover:bg-black/80 text-white/70 hover:text-white transition backdrop-blur-sm"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-black/40 hover:bg-black/80 text-white/70 hover:text-white transition backdrop-blur-sm"
            aria-label="Next slide"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Dots Indicator */}
          <div className="absolute bottom-4 right-8 z-30 flex items-center gap-1.5">
            {featuredList.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  currentIndex === idx ? 'w-6 bg-[#00a8e1]' : 'w-2 bg-gray-500 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>
        </>
      )}

      {/* Trailer Modal */}
      <TrailerModal
        isOpen={trailerOpen}
        onClose={() => setTrailerOpen(false)}
        trailerUrl={currentMovie.trailerUrl}
        movieName={movieTitle}
      />
    </div>
  );
};

export default HeroBanner;
