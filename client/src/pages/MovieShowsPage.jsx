import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Film, Calendar, MapPin, Sparkles, Clock, ChevronRight, Info } from 'lucide-react';
import api from '../services/api';
import { fetchMovieDetails, getPosterUrl } from '../services/tmdb';
import { toast } from 'react-toastify';

const MovieShowsPage = () => {
  const { movieId } = useParams();
  const navigate = useNavigate();

  const [movie, setMovie] = useState(null);
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);

  // Generate 4 consecutive days
  const dateTabs = Array.from({ length: 4 }).map((_, idx) => {
    const d = new Date();
    d.setDate(d.getDate() + idx);
    return {
      index: idx,
      fullDate: d,
      dateString: d.toISOString().split('T')[0],
      dayName: idx === 0 ? 'Today' : idx === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short' }),
      formattedDate: d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
    };
  });

  const selectedDate = dateTabs[selectedDateIndex];

  useEffect(() => {
    const fetchMovieAndShows = async () => {
      try {
        setLoading(true);
        const movieData = await fetchMovieDetails(movieId);
        setMovie(movieData);

        const movieTitle = movieData?.title || movieData?.movieName || 'Theatrical Feature';
        const showsRes = await api.get(
          `/shows/movie/${movieId}?date=${selectedDate.dateString}&movieName=${encodeURIComponent(movieTitle)}`
        );

        if (showsRes.data && showsRes.data.shows) {
          setShows(showsRes.data.shows);
        }
      } catch (err) {
        toast.error('Failed to load showtimes');
      } finally {
        setLoading(false);
      }
    };

    fetchMovieAndShows();
  }, [movieId, selectedDateIndex]);

  // Group shows by Theatre
  const groupedTheatres = shows.reduce((acc, show) => {
    const name = show.theatreName;
    if (!acc[name]) {
      acc[name] = {
        theatreName: name,
        location: show.location,
        pricing: show.pricing,
        shows: [],
      };
    }
    acc[name].shows.push(show);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-[#0f171e] text-white pb-20">
      {/* Top Banner with Movie Info */}
      <div className="bg-[#151c24] border-b border-[#253241] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <img
              src={movie?.posterUrl || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&auto=format&fit=crop&q=80'}
              alt={movie?.movieName}
              className="w-24 sm:w-28 aspect-[2/3] object-cover rounded-xl shadow-lg border border-[#2c3b4d]"
            />
            <div className="text-center sm:text-left space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#00a8e1] bg-[#00a8e1]/10 px-2 py-0.5 rounded border border-[#00a8e1]/30">
                PRIME THEATRICAL BOOKING
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {movie?.movieName || 'Loading Movie...'}
              </h1>
              <p className="text-xs text-gray-400">
                {movie?.genres?.join(' • ')} | {movie?.language} | {movie?.duration} | {movie?.certification || 'U/A'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Date Selector Tabs */}
      <div className="sticky top-16 z-30 bg-[#0f171e]/95 backdrop-blur-md border-b border-[#253241] py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mr-2 hidden sm:inline">
              Select Date:
            </span>
            {dateTabs.map((tab) => (
              <button
                key={tab.index}
                onClick={() => setSelectedDateIndex(tab.index)}
                className={`flex flex-col items-center px-4 py-2 rounded-xl transition text-center min-w-[80px] ${
                  selectedDateIndex === tab.index
                    ? 'bg-[#00a8e1] text-black shadow-prime-glow font-bold'
                    : 'bg-[#1a242f] text-gray-300 hover:text-white hover:bg-[#253241] border border-[#2c3b4d]'
                }`}
              >
                <span className="text-[11px] font-semibold uppercase">{tab.dayName}</span>
                <span className="text-sm font-black">{tab.formattedDate}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Theatres & Showtimes List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-white">
            <div className="w-10 h-10 border-4 border-[#00a8e1] border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-xs text-gray-400 uppercase tracking-wider">Locating Prime Screens...</p>
          </div>
        ) : Object.keys(groupedTheatres).length > 0 ? (
          Object.values(groupedTheatres).map((theatre) => (
            <div
              key={theatre.theatreName}
              className="bg-[#1a242f] rounded-2xl border border-[#2c3b4d] p-6 shadow-xl space-y-4 hover:border-[#00a8e1]/40 transition"
            >
              {/* Theatre Info Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#253241] pb-4">
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <Film className="w-4 h-4 text-[#00a8e1]" />
                    {theatre.theatreName}
                  </h3>
                  <p className="text-xs text-gray-400 flex items-center gap-1.5 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                    {theatre.location}
                  </p>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <span className="bg-[#151c24] text-gray-300 px-3 py-1 rounded-md border border-[#253241]">
                    Tickets from <strong className="text-[#00a8e1]">₹{theatre.pricing?.lower || 150}</strong>
                  </span>
                  <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                    <Sparkles className="w-3 h-3" /> M-Ticket Enabled
                  </span>
                </div>
              </div>

              {/* Showtimes Pill Row */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                {theatre.shows.map((showItem) => (
                  <button
                    key={showItem._id || showItem.showId}
                    onClick={() => navigate(`/seatslug/${showItem.showId || showItem._id}`)}
                    className="group/pill relative flex flex-col items-center justify-center bg-[#151c24] hover:bg-[#00a8e1] text-gray-200 hover:text-black border border-[#2c3b4d] hover:border-[#00a8e1] px-5 py-2.5 rounded-xl transition duration-200 shadow-sm"
                  >
                    <span className="text-sm font-extrabold group-hover/pill:text-black">
                      {showItem.showTime}
                    </span>
                    <span className="text-[10px] text-gray-400 group-hover/pill:text-black/80 font-medium">
                      {showItem.screenType || '4K Laser'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="bg-[#1a242f] rounded-2xl border border-[#253241] p-12 text-center text-gray-400">
            <Clock className="w-12 h-12 text-gray-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white">No showtimes found for this date</h3>
            <p className="text-xs text-gray-400 mt-1">Please pick another date from the tabs above.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MovieShowsPage;
