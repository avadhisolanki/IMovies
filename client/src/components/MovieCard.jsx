import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark, Star, Ticket, Play } from 'lucide-react';
import api from '../services/api';
import { getPosterUrl } from '../services/tmdb';
import { toast } from 'react-toastify';

const MovieCard = ({ movie, isFavorited = false, onToggleFavorite }) => {
  const navigate = useNavigate();
  const [favorite, setFavorite] = useState(isFavorited);
  const [loadingFav, setLoadingFav] = useState(false);

  if (!movie) return null;

  const movieId = movie._id || movie.id;
  const movieTitle = movie.title || movie.movieName || 'Untitled Feature';
  const poster = movie.posterUrl || getPosterUrl(movie.poster_path);
  const ratingValue = Number(movie.rating ?? movie.vote_average ?? 8.0);
  const durationText = movie.duration || (movie.runtime ? `${movie.runtime} min` : '120 min');
  const languageText = (movie.language || movie.original_language || 'EN').toUpperCase();

  const handleFavoriteClick = async (e) => {
    e.stopPropagation();
    try {
      setLoadingFav(true);
      const res = await api.post('/favorite/toggle', { movieId });
      if (res.data && res.data.success) {
        setFavorite(res.data.isFavorited);
        toast.info(res.data.message);
        if (onToggleFavorite) onToggleFavorite(movieId, res.data.isFavorited);
      }
    } catch (err) {
      toast.error('Sign in to save movies to your Prime Watchlist');
    } finally {
      setLoadingFav(false);
    }
  };

  return (
    <div
      onClick={() => navigate(`/moviedetails/${movieId}`)}
      className="group relative flex-none w-48 sm:w-56 md:w-60 bg-[#1a242f] rounded-lg overflow-hidden cursor-pointer transition-all duration-300 ease-out transform hover:-translate-y-2 hover:scale-[1.04] hover:shadow-2xl hover:shadow-[#00a8e1]/20 border border-[#253241] hover:border-[#00a8e1]/60"
    >
      {/* Poster image container with aspect ratio */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-[#151c24]">
        <img
          src={poster}
          alt={movieTitle}
          className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          loading="lazy"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&auto=format&fit=crop&q=80';
          }}
        />

        {/* Gradient shadow overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a242f] via-transparent to-black/30 opacity-60 group-hover:opacity-40 transition-opacity"></div>

        {/* Rating Badge Top Left */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1 bg-black/75 backdrop-blur-md px-2 py-0.5 rounded text-xs font-bold text-amber-400 border border-amber-400/30 shadow">
          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
          <span>{ratingValue ? ratingValue.toFixed(1) : '8.0'}</span>
        </div>

        {/* Watchlist Bookmark Button Top Right */}
        <button
          onClick={handleFavoriteClick}
          disabled={loadingFav}
          title={favorite ? 'Remove from Watchlist' : 'Add to Watchlist'}
          className={`absolute top-2.5 right-2.5 p-1.5 rounded-full backdrop-blur-md transition-all shadow ${
            favorite
              ? 'bg-[#00a8e1] text-black font-bold scale-110'
              : 'bg-black/60 text-white/80 hover:bg-white hover:text-black'
          }`}
        >
          <Bookmark className={`w-3.5 h-3.5 ${favorite ? 'fill-black' : ''}`} />
        </button>

        {/* Certification Tag */}
        {movie.certification && (
          <div className="absolute bottom-2.5 right-2.5 bg-black/80 px-1.5 py-0.5 rounded text-[10px] font-bold text-gray-300 border border-gray-600">
            {movie.certification}
          </div>
        )}

        {/* Hover Quick Action Overlay */}
        <div className="absolute inset-0 bg-black/65 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-3 gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/movieshows/${movieId}`);
            }}
            className="w-full flex items-center justify-center gap-2 bg-[#00a8e1] hover:bg-[#0082b3] text-black font-bold text-xs py-2 px-3 rounded-md transition transform hover:scale-105 shadow-prime-glow"
          >
            <Ticket className="w-4 h-4" />
            Book Tickets
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/moviedetails/${movieId}`);
            }}
            className="w-full flex items-center justify-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs py-1.5 px-3 rounded-md transition"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            View Details
          </button>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-3">
        <h3 className="text-sm font-bold text-white truncate group-hover:text-[#00a8e1] transition-colors">
          {movieTitle}
        </h3>
        
        <p className="text-xs text-gray-400 truncate mt-0.5">
          {movie.genres?.slice(0, 2).join(' • ') || 'Cinema Feature'}
        </p>

        <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#253241] text-[11px] text-gray-400">
          <span className="font-semibold text-gray-300">{languageText}</span>
          <span>{durationText}</span>
        </div>
      </div>
    </div>
  );
};

export default MovieCard;
