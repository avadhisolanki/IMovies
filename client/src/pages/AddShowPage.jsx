import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Trash2, ArrowLeft, Film, Building2, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-toastify';

const AddShowPage = () => {
  const [movies, setMovies] = useState([]);
  const [theatres, setTheatres] = useState([]);
  const [selectedMovieId, setSelectedMovieId] = useState('');
  const [selectedTheatreName, setSelectedTheatreName] = useState('');
  const [showDate, setShowDate] = useState(new Date().toISOString().split('T')[0]);
  const [showTime, setShowTime] = useState('05:30 PM');
  const [screenType, setScreenType] = useState('IMAX Laser 3D');

  const [scheduledShows, setScheduledShows] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [moviesRes, theatresRes] = await Promise.all([
          api.get('/movie'),
          api.get('/theatre'),
        ]);

        if (moviesRes.data?.movies) {
          setMovies(moviesRes.data.movies);
          if (moviesRes.data.movies.length > 0) {
            setSelectedMovieId(moviesRes.data.movies[0]._id);
          }
        }
        if (theatresRes.data?.theatres) {
          setTheatres(theatresRes.data.theatres);
          if (theatresRes.data.theatres.length > 0) {
            setSelectedTheatreName(theatresRes.data.theatres[0].theatreName);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMovieId || !selectedTheatreName || !showDate || !showTime) {
      toast.warning('Please select all required show properties');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post('/shows', {
        movieId: selectedMovieId,
        theatreName: selectedTheatreName,
        showDate,
        showTime,
        screenType,
      });

      if (res.data && res.data.success) {
        toast.success('Show scheduled with full seat map layout!');
        setScheduledShows([res.data.show, ...scheduledShows]);
      }
    } catch (err) {
      toast.error('Failed to schedule show');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f171e] text-white pb-20 pt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        <div className="flex items-center gap-4 border-b border-[#253241] pb-6">
          <Link
            to="/admin"
            className="p-2 rounded-lg bg-[#1a242f] hover:bg-[#253241] text-gray-300 hover:text-white transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
              PROGRAMMING & SCHEDULING
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white">Schedule Showtimes</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 bg-[#1a242f] rounded-2xl border border-[#2c3b4d] p-6 shadow-xl">
            <h2 className="text-base font-bold text-white mb-6 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-400" />
              Showtime Parameters
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-300 block mb-1">
                    Select Feature Movie *
                  </label>
                  <select
                    value={selectedMovieId}
                    onChange={(e) => setSelectedMovieId(e.target.value)}
                    className="w-full bg-[#151c24] text-white text-xs p-3 rounded-lg border border-[#2c3b4d] focus:outline-none focus:border-[#00a8e1]"
                  >
                    {movies.map((m) => (
                      <option key={m._id} value={m._id}>
                        {m.movieName} ({m.language})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-300 block mb-1">
                    Select Theatre Venue *
                  </label>
                  <select
                    value={selectedTheatreName}
                    onChange={(e) => setSelectedTheatreName(e.target.value)}
                    className="w-full bg-[#151c24] text-white text-xs p-3 rounded-lg border border-[#2c3b4d] focus:outline-none focus:border-[#00a8e1]"
                  >
                    {theatres.map((th) => (
                      <option key={th._id} value={th.theatreName}>
                        {th.theatreName} ({th.location})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-300 block mb-1">
                    Show Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={showDate}
                    onChange={(e) => setShowDate(e.target.value)}
                    className="w-full bg-[#151c24] text-white text-xs p-3 rounded-lg border border-[#2c3b4d] focus:outline-none focus:border-[#00a8e1]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-300 block mb-1">
                    Showtime Slot *
                  </label>
                  <select
                    value={showTime}
                    onChange={(e) => setShowTime(e.target.value)}
                    className="w-full bg-[#151c24] text-white text-xs p-3 rounded-lg border border-[#2c3b4d] focus:outline-none focus:border-[#00a8e1]"
                  >
                    <option value="10:30 AM">10:30 AM (Morning)</option>
                    <option value="01:45 PM">01:45 PM (Matinee)</option>
                    <option value="05:30 PM">05:30 PM (Evening Prime)</option>
                    <option value="09:00 PM">09:00 PM (Night Prime)</option>
                    <option value="11:30 PM">11:30 PM (Late Night)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-300 block mb-1">
                    Auditorium Screen Type
                  </label>
                  <select
                    value={screenType}
                    onChange={(e) => setScreenType(e.target.value)}
                    className="w-full bg-[#151c24] text-white text-xs p-3 rounded-lg border border-[#2c3b4d] focus:outline-none focus:border-[#00a8e1]"
                  >
                    <option value="IMAX Laser 3D">IMAX Laser 3D</option>
                    <option value="4K Dolby Atmos">4K Dolby Atmos</option>
                    <option value="70mm IMAX Special">70mm IMAX Special</option>
                    <option value="VIP Recliner Suite">VIP Recliner Suite</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-black font-extrabold text-sm py-3 rounded-xl transition shadow-lg mt-4"
              >
                <Plus className="w-4 h-4" />
                Schedule Showtime & Initialize Map
              </button>
            </form>
          </div>

          <div className="bg-[#1a242f] rounded-2xl border border-[#2c3b4d] p-6 shadow-xl h-fit">
            <h2 className="text-base font-bold text-white mb-2">Automated Real-Time Map</h2>
            <p className="text-xs text-gray-400 leading-relaxed mb-4">
              Each scheduled show instantly receives a tier-based seat map with Balcony Club, Middle Prime, and Lower Saver configurations with 5-minute TTL locks ready.
            </p>

            <div className="p-4 bg-[#151c24] rounded-xl border border-[#253241] space-y-2 text-xs">
              <div className="flex items-center justify-between text-sky-400">
                <span>Balcony Seats:</span>
                <span className="font-bold">20 seats (Rows A, B)</span>
              </div>
              <div className="flex items-center justify-between text-purple-400">
                <span>Middle Seats:</span>
                <span className="font-bold">30 seats (Rows A, B, C)</span>
              </div>
              <div className="flex items-center justify-between text-emerald-400">
                <span>Lower Seats:</span>
                <span className="font-bold">20 seats (Rows A, B)</span>
              </div>
              <div className="border-t border-[#253241] pt-2 flex items-center justify-between font-bold text-white">
                <span>Total Capacity:</span>
                <span>70 seats / screen</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default AddShowPage;
