import React, { useState, useEffect } from 'react';
import { Ticket, Search, Filter, ArrowLeft, XCircle, CheckCircle, MapPin, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import DigitalTicket from '../components/DigitalTicket';
import { toast } from 'react-toastify';

const AdminBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedTicket, setSelectedTicket] = useState(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/bookings/all-bookings');
      if (res.data && res.data.bookings) {
        setBookings(res.data.bookings);
      }
    } catch (err) {
      toast.error('Failed to load reservations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancel = async (bookingId) => {
    if (!window.confirm(`Cancel reservation ${bookingId} and release seats?`)) return;

    try {
      const res = await api.put(`/bookings/cancel/${bookingId}`);
      if (res.data && res.data.success) {
        toast.info('Reservation cancelled and seats released');
        fetchBookings();
        if (selectedTicket?.bookingId === bookingId) {
          setSelectedTicket(null);
        }
      }
    } catch {
      toast.error('Cancellation failed');
    }
  };

  // Filter logic
  const filteredBookings = bookings.filter((b) => {
    const matchesSearch =
      b.bookingId?.toLowerCase().includes(search.toLowerCase()) ||
      b.userEmail?.toLowerCase().includes(search.toLowerCase()) ||
      b.movieName?.toLowerCase().includes(search.toLowerCase()) ||
      b.theatreName?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === 'All' || b.paymentStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-[#0f171e] text-white pb-20 pt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Header */}
        <div className="flex items-center gap-4 border-b border-[#253241] pb-6">
          <Link
            to="/admin"
            className="p-2 rounded-lg bg-[#1a242f] hover:bg-[#253241] text-gray-300 hover:text-white transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
              AUDIT & MODERATION
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white">All Platform Reservations</h1>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-[#1a242f] p-4 rounded-2xl border border-[#2c3b4d] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:max-w-md">
            <input
              type="text"
              placeholder="Search by customer email, booking ID, movie..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#151c24] text-white text-xs pl-9 pr-4 py-2.5 rounded-lg border border-[#2c3b4d] focus:outline-none focus:border-[#00a8e1]"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Status:
            </span>
            {['All', 'Completed', 'Cancelled'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`text-xs px-3 py-1.5 rounded-lg font-bold transition ${
                  statusFilter === st
                    ? 'bg-[#00a8e1] text-black shadow-prime-glow'
                    : 'bg-[#151c24] text-gray-400 hover:text-white border border-[#253241]'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-[#1a242f] rounded-2xl border border-[#2c3b4d] shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="bg-[#151c24] text-gray-400 uppercase text-[10px] tracking-wider border-b border-[#253241]">
                <tr>
                  <th className="py-3 px-4">Booking Ref</th>
                  <th className="py-3 px-4">Customer Email</th>
                  <th className="py-3 px-4">Movie Title</th>
                  <th className="py-3 px-4">Venue & Slot</th>
                  <th className="py-3 px-4">Seats</th>
                  <th className="py-3 px-4">Total</th>
                  <th className="py-3 px-4">Payment Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#253241]">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="py-12 text-center text-gray-400">
                      Loading platform reservations...
                    </td>
                  </tr>
                ) : filteredBookings.length > 0 ? (
                  filteredBookings.map((b) => (
                    <tr key={b.bookingId} className="hover:bg-[#253241]/40 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-white">{b.bookingId}</td>
                      <td className="py-3.5 px-4 text-gray-300">{b.userEmail}</td>
                      <td className="py-3.5 px-4 font-semibold text-white">{b.movieName}</td>
                      <td className="py-3.5 px-4 text-gray-400">
                        {b.theatreName} • {b.showTime}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-[#00a8e1]">
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
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <button
                          onClick={() => setSelectedTicket(b)}
                          className="text-[#00a8e1] hover:underline font-semibold text-xs"
                          title="View Digital Ticket"
                        >
                          View Pass
                        </button>

                        {b.paymentStatus !== 'Cancelled' && (
                          <button
                            onClick={() => handleCancel(b.bookingId)}
                            className="text-red-400 hover:text-red-300 font-semibold text-xs bg-red-950/40 px-2 py-1 rounded border border-red-800/40"
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
                      No matching reservations found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Ticket Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="relative max-w-md w-full">
            <button
              onClick={() => setSelectedTicket(null)}
              className="absolute -top-10 right-0 text-gray-400 hover:text-white text-xs font-bold bg-[#1a242f] px-3 py-1 rounded-full border border-gray-600 print:hidden"
            >
              Close ✕
            </button>
            <DigitalTicket
              booking={selectedTicket}
              onCancel={handleCancel}
              showCancel={selectedTicket.paymentStatus !== 'Cancelled'}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBookingsPage;
