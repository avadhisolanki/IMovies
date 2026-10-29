import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  Film,
  Building2,
  Calendar,
  Ticket,
  TrendingUp,
  DollarSign,
  PlusCircle,
  RotateCcw,
  Users,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import api from '../services/api';
import { toast } from 'react-toastify';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalBookings: 0,
    totalTheatres: 0,
    totalMovies: 0,
    totalShows: 0,
  });
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [moviesRes, theatresRes, bookingsRes] = await Promise.all([
        api.get('/movie'),
        api.get('/theatre'),
        api.get('/bookings/all-bookings'),
      ]);

      const moviesCount = moviesRes.data?.movies?.length || 0;
      const theatresCount = theatresRes.data?.theatres?.length || 0;
      const bookings = bookingsRes.data?.bookings || [];

      const revenue = bookings
        .filter((b) => b.paymentStatus !== 'Cancelled')
        .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

      setStats({
        totalRevenue: revenue,
        totalBookings: bookings.length,
        totalTheatres: theatresCount,
        totalMovies: moviesCount,
        totalShows: 64,
      });

      setRecentBookings(bookings.slice(0, 8));
    } catch (err) {
      toast.error('Failed to load admin metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleResetCatalog = async () => {
    if (!window.confirm('Reset all catalog data (movies, theatres, shows) back to default seed?')) {
      return;
    }

    try {
      setSeeding(true);
      const res = await api.post('/seed');
      if (res.data && res.data.success) {
        toast.success(res.data.message);
        fetchDashboardData();
      }
    } catch (err) {
      toast.error('Catalog seed failed');
    } finally {
      setSeeding(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm(`Are you sure you want to cancel reservation ${bookingId}? Seats will be released immediately.`)) {
      return;
    }

    try {
      const res = await api.put(`/bookings/cancel/${bookingId}`);
      if (res.data && res.data.success) {
        toast.info('Reservation cancelled and seats returned to theatre map.');
        fetchDashboardData();
      }
    } catch {
      toast.error('Cancellation failed');
    }
  };

  return (
    <div className="min-h-screen bg-[#0f171e] text-white pb-20 pt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Admin Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#253241] pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-widest text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/30">
                ADMIN CONSOLE
              </span>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-2 mt-1">
              <Shield className="w-8 h-8 text-amber-400" />
              iMovies Control Center
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Enterprise management of movies, venue screens, showtimes, and live seat reservations.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleResetCatalog}
              disabled={seeding}
              className="flex items-center gap-1.5 bg-[#1a242f] hover:bg-[#253241] text-xs font-bold text-gray-300 hover:text-white px-3.5 py-2.5 rounded-lg border border-[#2c3b4d] transition"
            >
              <RotateCcw className={`w-3.5 h-3.5 text-[#00a8e1] ${seeding ? 'animate-spin' : ''}`} />
              Re-seed Catalog Data
            </button>

            <Link
              to="/addmovie"
              className="flex items-center gap-1.5 bg-[#00a8e1] hover:bg-[#0082b3] text-black font-extrabold text-xs px-4 py-2.5 rounded-lg transition shadow-prime-glow"
            >
              <PlusCircle className="w-4 h-4" />
              Add Movie
            </Link>
          </div>
        </div>

        {/* Quick Action Navigation Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Link
            to="/addmovie"
            className="bg-[#1a242f] hover:bg-[#253241] border border-[#2c3b4d] hover:border-[#00a8e1] p-4 rounded-xl transition flex items-center gap-3 group"
          >
            <div className="w-10 h-10 rounded-lg bg-[#00a8e1]/10 text-[#00a8e1] flex items-center justify-center group-hover:scale-110 transition">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Add Movie</p>
              <p className="text-[11px] text-gray-400">Expand catalog</p>
            </div>
          </Link>

          <Link
            to="/addtheatre"
            className="bg-[#1a242f] hover:bg-[#253241] border border-[#2c3b4d] hover:border-purple-400 p-4 rounded-xl transition flex items-center gap-3 group"
          >
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center group-hover:scale-110 transition">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Add Theatre</p>
              <p className="text-[11px] text-gray-400">Configure tiers</p>
            </div>
          </Link>

          <Link
            to="/addshow"
            className="bg-[#1a242f] hover:bg-[#253241] border border-[#2c3b4d] hover:border-emerald-400 p-4 rounded-xl transition flex items-center gap-3 group"
          >
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Schedule Show</p>
              <p className="text-[11px] text-gray-400">Assign time slots</p>
            </div>
          </Link>

          <Link
            to="/adminbookings"
            className="bg-[#1a242f] hover:bg-[#253241] border border-[#2c3b4d] hover:border-amber-400 p-4 rounded-xl transition flex items-center gap-3 group"
          >
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:scale-110 transition">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">All Bookings</p>
              <p className="text-[11px] text-gray-400">Moderate seats</p>
            </div>
          </Link>
        </div>

        {/* KPI Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-[#1a242f] p-6 rounded-2xl border border-[#2c3b4d] shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Gross Platform Revenue
              </span>
              <DollarSign className="w-5 h-5 text-emerald-400" />
            </div>
            <p className="text-3xl font-black text-white">₹{stats.totalRevenue.toLocaleString()}</p>
            <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-semibold">
              <TrendingUp className="w-3 h-3" /> Real-time active collections
            </p>
          </div>

          <div className="bg-[#1a242f] p-6 rounded-2xl border border-[#2c3b4d] shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Total Bookings
              </span>
              <Ticket className="w-5 h-5 text-[#00a8e1]" />
            </div>
            <p className="text-3xl font-black text-white">{stats.totalBookings}</p>
            <p className="text-[11px] text-gray-400 mt-1">Confirmed customer tickets</p>
          </div>

          <div className="bg-[#1a242f] p-6 rounded-2xl border border-[#2c3b4d] shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Movies Catalog
              </span>
              <Film className="w-5 h-5 text-purple-400" />
            </div>
            <p className="text-3xl font-black text-white">{stats.totalMovies}</p>
            <p className="text-[11px] text-gray-400 mt-1">Prime theatrical titles</p>
          </div>

          <div className="bg-[#1a242f] p-6 rounded-2xl border border-[#2c3b4d] shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Active Theatres
              </span>
              <Building2 className="w-5 h-5 text-amber-400" />
            </div>
            <p className="text-3xl font-black text-white">{stats.totalTheatres}</p>
            <p className="text-[11px] text-gray-400 mt-1">IMAX & Dolby Multiplexes</p>
          </div>
        </div>

        {/* Recent Reservations Table */}
        <div className="bg-[#1a242f] rounded-2xl border border-[#2c3b4d] shadow-xl overflow-hidden">
          <div className="p-6 border-b border-[#253241] flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <Ticket className="w-5 h-5 text-[#00a8e1]" />
                Recent Platform Reservations
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">Live transactions across all theatres</p>
            </div>
            <Link
              to="/adminbookings"
              className="text-xs font-bold text-[#00a8e1] hover:underline"
            >
              View All Reservations →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="bg-[#151c24] text-gray-400 uppercase text-[10px] tracking-wider border-b border-[#253241]">
                <tr>
                  <th className="py-3 px-4">Booking ID</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Movie</th>
                  <th className="py-3 px-4">Theatre</th>
                  <th className="py-3 px-4">Seats</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#253241]">
                {recentBookings.length > 0 ? (
                  recentBookings.map((b) => (
                    <tr key={b.bookingId} className="hover:bg-[#253241]/40 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-white">{b.bookingId}</td>
                      <td className="py-3.5 px-4 text-gray-400">{b.userEmail}</td>
                      <td className="py-3.5 px-4 font-semibold text-white">{b.movieName}</td>
                      <td className="py-3.5 px-4 text-gray-300">{b.theatreName}</td>
                      <td className="py-3.5 px-4 font-mono text-[#00a8e1] font-bold">
                        {b.selectedSeats?.join(', ')}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-white">₹{b.totalAmount}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            b.paymentStatus === 'Cancelled'
                              ? 'bg-red-950/60 text-red-400 border border-red-800/40'
                              : 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                          }`}
                        >
                          {b.paymentStatus}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {b.paymentStatus !== 'Cancelled' && (
                          <button
                            onClick={() => handleCancelBooking(b.bookingId)}
                            className="text-red-400 hover:text-red-300 font-semibold text-[11px] bg-red-950/40 hover:bg-red-900/60 px-2 py-1 rounded border border-red-800/40"
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="py-8 text-center text-gray-500">
                      No platform bookings recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;
