import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Film,
  Ticket,
  Play,
  Bookmark,
  Star,
  Clock,
  Calendar,
  Globe,
  MessageSquare,
  Send,
  User,
  Users,
  Award,
} from 'lucide-react';
import api from '../services/api';
import { fetchMovieDetails, getPosterUrl, getBackdropUrl } from '../services/tmdb';
import TrailerModal from '../components/TrailerModal';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const MovieDetailsPage = () => {
  const { movieId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [movie, setMovie] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trailerOpen, setTrailerOpen] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);

  // Review form states
  const [newRating, setNewRating] = useState(9);
  const [newReviewText, setNewReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch movie details via TMDB API (with fallback)
        const movieData = await fetchMovieDetails(movieId);
        setMovie(movieData);

        // Fetch user community reviews
        try {
          const reviewsRes = await api.get(`/review/${movieId}`);
          if (reviewsRes.data && reviewsRes.data.reviews) {
            setReviews(reviewsRes.data.reviews);
          }
        } catch {
          // If no local reviews, keep empty
        }
      } catch (err) {
        toast.error('Failed to load movie details');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [movieId]);

  const handleToggleWatchlist = async () => {
    try {
      const res = await api.post('/favorite/toggle', { movieId });
      if (res.data && res.data.success) {
        setIsFavorited(res.data.isFavorited);
        toast.info(res.data.message);
      }
    } catch {
      toast.error('Please sign in to save movies to your Watchlist');
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!newReviewText.trim()) {
      toast.warning('Please write your review feedback');
      return;
    }

    try {
      setSubmittingReview(true);
      const res = await api.post('/review', {
        movieId,
        rating: newRating,
        reviewText: newReviewText,
      });

      if (res.data && res.data.success) {
        toast.success('Review posted successfully!');
        setReviews([res.data.review, ...reviews]);
        setNewReviewText('');
      }
    } catch (err) {
      toast.error('Failed to post review. Please ensure you are signed in.');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading || !movie) {
    return (
      <div className="min-h-screen bg-[#0f171e] flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 border-4 border-[#00a8e1] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
          Fetching Movie Specifications from TMDB...
        </p>
      </div>
    );
  }

  const movieTitle = movie.title || movie.movieName || 'Untitled Movie';
  const movieOverview = movie.overview || movie.description;
  const ratingValue = Number(movie.rating ?? movie.vote_average ?? 8.0);
  const runtimeMin = movie.runtime || (movie.duration ? parseInt(movie.duration, 10) : 120);
  const formattedRuntime = `${Math.floor(runtimeMin / 60)}h ${runtimeMin % 60}m (${runtimeMin} min)`;
  const backdrop = movie.backdropUrl || getBackdropUrl(movie.backdrop_path);
  const poster = movie.posterUrl || getPosterUrl(movie.poster_path);

  return (
    <div className="min-h-screen bg-[#0f171e] text-white pb-20">
      {/* Full-width Cinematic Backdrop Banner */}
      <div className="relative w-full h-[450px] sm:h-[540px] overflow-hidden bg-black">
        <img
          src={backdrop}
          alt={movieTitle}
          className="w-full h-full object-cover object-center scale-105"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1600&auto=format&fit=crop&q=80';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f171e] via-[#0f171e]/75 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#0f171e] via-[#0f171e]/60 to-transparent"></div>
      </div>

      {/* Main Content Container */}
      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-56 sm:-mt-64">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          
          {/* Left Poster Column */}
          <div className="w-56 sm:w-64 flex-shrink-0 mx-auto md:mx-0">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border-2 border-[#2c3b4d] bg-[#1a242f]">
              <img
                src={poster}
                alt={movieTitle}
                className="w-full aspect-[2/3] object-cover"
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&auto=format&fit=crop&q=80';
                }}
              />
              <div className="absolute top-3 left-3 bg-black/85 px-2.5 py-1 rounded-md text-xs font-bold text-amber-400 border border-amber-400/40 shadow">
                ★ {ratingValue.toFixed(1)} TMDB
              </div>
            </div>

            {/* Quick Action CTAs */}
            <div className="mt-4 space-y-2">
              <button
                onClick={() => navigate(`/movieshows/${movie._id || movie.id}`)}
                className="w-full flex items-center justify-center gap-2 bg-[#00a8e1] hover:bg-[#0082b3] text-black font-extrabold text-sm py-3 rounded-xl transition transform hover:scale-102 shadow-prime-glow cursor-pointer"
              >
                <Ticket className="w-4 h-4 fill-black" />
                Select Shows & Theatres
              </button>

              {movie.trailerUrl && (
                <button
                  onClick={() => setTrailerOpen(true)}
                  className="w-full flex items-center justify-center gap-2 bg-[#1a242f] hover:bg-[#253241] text-white text-xs font-semibold py-2.5 rounded-xl border border-[#2c3b4d] transition cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-white" />
                  Watch Official Trailer
                </button>
              )}

              <button
                onClick={handleToggleWatchlist}
                className="w-full flex items-center justify-center gap-2 bg-[#151c24] hover:bg-[#1a242f] text-gray-300 hover:text-white text-xs font-semibold py-2 rounded-xl border border-[#2c3b4d] transition"
              >
                <Bookmark className={`w-3.5 h-3.5 ${isFavorited ? 'fill-[#00a8e1] text-[#00a8e1]' : ''}`} />
                {isFavorited ? 'Saved to Watchlist' : 'Add to Watchlist'}
              </button>
            </div>
          </div>

          {/* Right Details Column */}
          <div className="flex-1 space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold tracking-widest uppercase bg-[#00a8e1]/15 text-[#00a8e1] px-2.5 py-0.5 rounded border border-[#00a8e1]/30">
                  TMDB THEATRICAL FEATURE
                </span>
                <span className="text-xs text-gray-400">IMAX 4K Laser & Dolby Atmos</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
                {movieTitle}
              </h1>

              {/* Meta stats bar */}
              <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-gray-300 pt-1">
                <span className="flex items-center gap-1 text-amber-400 font-bold bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/30">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  {ratingValue.toFixed(1)} / 10 ({movie.vote_count ? `${movie.vote_count.toLocaleString()} votes` : 'Audience Rating'})
                </span>
                <span className="border border-gray-600 px-1.5 py-0.5 rounded text-[11px] font-bold">
                  {movie.certification || 'U/A 13+'}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  {formattedRuntime}
                </span>
                <span className="flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-[#00a8e1]" />
                  {movie.language || 'ENGLISH'}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  {new Date(movie.releaseDate || movie.release_date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
            </div>

            {/* Genres */}
            <div className="flex flex-wrap gap-2">
              {movie.genres?.map((g) => (
                <span
                  key={typeof g === 'string' ? g : g.name}
                  className="text-xs font-semibold bg-[#1a242f] text-gray-300 px-3 py-1 rounded-full border border-[#2c3b4d]"
                >
                  {typeof g === 'string' ? g : g.name}
                </span>
              ))}
            </div>

            {/* Synopsis */}
            <div className="space-y-2 bg-[#1a242f]/80 p-5 rounded-2xl border border-[#253241]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#00a8e1]">
                Storyline & Overview
              </h3>
              <p className="text-sm text-gray-300 leading-relaxed">
                {movieOverview}
              </p>
            </div>

            {/* Top Billing Cast Avatars from TMDB credits */}
            {movie.cast && movie.cast.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-[#00a8e1]" />
                  Top Billing Cast & Characters
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {movie.cast.slice(0, 8).map((actor, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2.5 bg-[#151c24] border border-[#2c3b4d] p-2.5 rounded-xl transition hover:border-[#00a8e1]/50"
                    >
                      {actor.profileUrl ? (
                        <img
                          src={actor.profileUrl}
                          alt={actor.name}
                          className="w-10 h-10 rounded-full object-cover border border-gray-600 flex-shrink-0"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[#253241] flex items-center justify-center text-[#00a8e1] font-bold text-xs flex-shrink-0">
                          {actor.name ? actor.name.charAt(0) : 'A'}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">{actor.name}</p>
                        <p className="text-[10px] text-gray-400 truncate">{actor.character || 'Cast'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* User Reviews & Ratings Section */}
        <div className="mt-16 pt-12 border-t border-[#253241]">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-black text-white flex items-center gap-2">
                <MessageSquare className="w-6 h-6 text-[#00a8e1]" />
                Audience Reviews & Verdicts
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                Verified community feedback for {movieTitle}
              </p>
            </div>
            <span className="text-xs text-gray-400">{reviews.length} reviews posted</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Write a review form */}
            <div className="bg-[#1a242f] p-6 rounded-2xl border border-[#2c3b4d] h-fit">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-1.5">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                Rate this Feature Film
              </h3>

              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Your Rating (1 to 10)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={newRating}
                      onChange={(e) => setNewRating(Number(e.target.value))}
                      className="w-full accent-[#00a8e1]"
                    />
                    <span className="text-sm font-bold text-amber-400 bg-black/40 px-2 py-0.5 rounded border border-amber-400/30">
                      ★ {newRating}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-gray-400 block mb-1">Your Review</label>
                  <textarea
                    rows="3"
                    value={newReviewText}
                    onChange={(e) => setNewReviewText(e.target.value)}
                    placeholder="Share your thoughts on the IMAX experience, cinematography, sound design..."
                    className="w-full bg-[#151c24] text-white text-xs p-3 rounded-lg border border-[#2c3b4d] focus:outline-none focus:border-[#00a8e1]"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={submittingReview}
                  className="w-full flex items-center justify-center gap-2 bg-[#00a8e1] hover:bg-[#0082b3] text-black font-bold text-xs py-2.5 rounded-lg transition"
                >
                  <Send className="w-3.5 h-3.5" />
                  Post Prime Review
                </button>
              </form>
            </div>

            {/* Reviews list */}
            <div className="lg:col-span-2 space-y-4">
              {reviews.length > 0 ? (
                reviews.map((rev) => (
                  <div
                    key={rev._id}
                    className="bg-[#1a242f] p-5 rounded-2xl border border-[#253241] space-y-2 transition hover:border-[#2c3b4d]"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#253241] flex items-center justify-center text-xs text-[#00a8e1] font-bold">
                          {rev.userName?.charAt(0) || 'U'}
                        </div>
                        <span className="text-xs font-bold text-white">{rev.userName}</span>
                      </div>
                      <span className="text-xs font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/30 flex items-center gap-1">
                        ★ {rev.rating} / 10
                      </span>
                    </div>

                    <p className="text-xs text-gray-300 leading-relaxed">
                      {rev.reviewText}
                    </p>

                    <p className="text-[10px] text-gray-500 pt-1">
                      {new Date(rev.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                ))
              ) : (
                <div className="bg-[#1a242f] p-8 rounded-2xl border border-[#253241] text-center text-gray-400 text-xs">
                  No community reviews posted yet. Be the first to share your verdict!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Trailer Modal */}
      <TrailerModal
        isOpen={trailerOpen}
        onClose={() => setTrailerOpen(false)}
        trailerUrl={movie.trailerUrl}
        movieName={movieTitle}
      />
    </div>
  );
};

export default MovieDetailsPage;
