import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, Film, ChevronRight } from 'lucide-react';
import api from '../services/api';
import MovieCard from '../components/MovieCard';
import { toast } from 'react-toastify';

const WatchlistPage = () => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const res = await api.get('/favorite');
      if (res.data && res.data.favorites) {
        setFavorites(res.data.favorites);
      }
    } catch (err) {
      toast.error('Failed to load watchlist');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  const handleToggleFavorite = (movieId, isFav) => {
    if (!isFav) {
      setFavorites(favorites.filter(m => m._id !== movieId));
    }
  };

  return (
    <div className="min-h-screen bg-[#0f171e] text-white pb-20 pt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex items-center justify-between border-b border-[#253241] pb-6 mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-[#00a8e1]">
              SAVED CINEMA ITEMS
            </span>
            <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-2">
              <Bookmark className="w-8 h-8 text-[#00a8e1] fill-[#00a8e1]" />
              My Prime Watchlist
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              Your saved cinematic blockbusters ready for instant showtime booking.
            </p>
          </div>
          <span className="text-xs text-gray-400 font-semibold">{favorites.length} saved</span>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-4 border-[#00a8e1] border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-xs text-gray-400 uppercase tracking-wider">Accessing Prime Watchlist...</p>
          </div>
        ) : favorites.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {favorites.map((movie) => (
              <MovieCard
                key={movie._id}
                movie={movie}
                isFavorited={true}
                onToggleFavorite={handleToggleFavorite}
              />
            ))}
          </div>
        ) : (
          <div className="bg-[#1a242f] rounded-2xl border border-[#2c3b4d] p-12 text-center max-w-lg mx-auto">
            <Bookmark className="w-14 h-14 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-1">Your Watchlist is Empty</h3>
            <p className="text-xs text-gray-400 mb-6">
              Bookmark upcoming blockbusters from the homepage to keep track of their showtimes and reserve tickets early.
            </p>
            <Link
              to="/home"
              className="inline-flex items-center gap-2 bg-[#00a8e1] hover:bg-[#0082b3] text-black font-extrabold text-xs px-6 py-3 rounded-lg shadow-prime-glow"
            >
              Discover Movies <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default WatchlistPage;
