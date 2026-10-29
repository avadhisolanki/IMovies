import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Ticket, Calendar, Clock, MapPin, Printer, AlertCircle, ChevronRight, XCircle } from 'lucide-react';
import api from '../services/api';
import DigitalTicket from '../components/DigitalTicket';
import { toast } from 'react-toastify';

const BookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/bookings/my-bookings');
      if (res.data && res.data.bookings) {
        setBookings(res.data.bookings);
      }
    } catch (err) {
      toast.error('Failed to load your booking history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking? Reserved seats will be released.')) {
      return;
    }

    try {
      const res = await api.put(`/bookings/cancel/${bookingId}`);
      if (res.data && res.data.success) {
        toast.info('Booking cancelled and seats returned to inventory.');
        fetchBookings();
        if (selectedTicket?.bookingId === bookingId) {
          setSelectedTicket(null);
        }
      }
    } catch (err) {
      toast.error('Failed to cancel booking');
    }
  };

  return (
    <div className="min-h-screen bg-[#0f171e] text-white pb-20 pt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#253241] pb-6 mb-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-widest text-[#00a8e1]">
                PRIME MEMBER PASSES
              </span>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-2">
              <Ticket className="w-8 h-8 text-[#00a8e1]" />
              My Theatrical Bookings
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              Access digital tickets, scan QR codes at cinema turnstiles, or print passes.
            </p>
          </div>
          <span className="text-xs text-gray-400 font-semibold">
            {bookings.length} reservations
          </span>
        </div>

        {/* Content */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-4 border-[#00a8e1] border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-xs text-gray-400 uppercase tracking-wider">Retrieving Digital Passes...</p>
          </div>
        ) : bookings.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {bookings.map((booking) => {
              const isCancelled = booking.paymentStatus === 'Cancelled';

              return (
                <div
                  key={booking.bookingId}
                  className={`bg-[#1a242f] rounded-2xl border transition p-6 flex flex-col justify-between shadow-xl ${
                    isCancelled
                      ? 'border-red-900/40 opacity-75'
                      : 'border-[#2c3b4d] hover:border-[#00a8e1]/60'
                  }`}
                >
                  <div className="space-y-4">
                    {/* Top Status */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-[#00a8e1] bg-[#00a8e1]/10 px-2.5 py-1 rounded border border-[#00a8e1]/30">
                        {booking.bookingId}
                      </span>
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded ${
                          isCancelled
                            ? 'bg-red-950/60 text-red-400 border border-red-800/40'
                            : 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                        }`}
                      >
                        {isCancelled ? 'CANCELLED' : 'CONFIRMED'}
                      </span>
                    </div>

                    {/* Movie info */}
                    <div>
                      <h3 className="text-xl font-black text-white">{booking.movieName}</h3>
                      <p className="text-xs text-gray-400 flex items-center gap-1.5 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-[#00a8e1]" />
                        {booking.theatreName} — {booking.location}
                      </p>
                    </div>

                    {/* Meta stats */}
                    <div className="grid grid-cols-2 gap-3 bg-[#151c24] p-3 rounded-xl border border-[#253241] text-xs">
                      <div>
                        <span className="text-[10px] text-gray-400 uppercase font-semibold block">Date & Time</span>
                        <span className="font-bold text-white">
                          {new Date(booking.showDate).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          })}{' '}
                          • {booking.showTime}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 uppercase font-semibold block">Reserved Seats</span>
                        <span className="font-mono font-bold text-[#00a8e1]">
                          {booking.selectedSeats?.join(', ')} ({booking.selectedSeats?.length})
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between border-t border-[#253241] pt-4 mt-4">
                    <span className="text-sm font-black text-white">
                      ₹{booking.totalAmount} Total
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedTicket(booking)}
                        className="flex items-center gap-1.5 bg-[#00a8e1] hover:bg-[#0082b3] text-black font-extrabold text-xs px-3.5 py-2 rounded-lg transition shadow-prime-glow cursor-pointer"
                      >
                        <Ticket className="w-3.5 h-3.5" />
                        View Pass
                      </button>

                      {!isCancelled && (
                        <button
                          onClick={() => handleCancelBooking(booking.bookingId)}
                          className="flex items-center gap-1 bg-red-950/40 hover:bg-red-900/60 text-red-400 text-xs px-2.5 py-2 rounded-lg transition border border-red-800/40"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-[#1a242f] rounded-2xl border border-[#2c3b4d] p-12 text-center max-w-lg mx-auto">
            <Ticket className="w-14 h-14 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-1">No Theatrical Tickets Yet</h3>
            <p className="text-xs text-gray-400 mb-6">
              Browse current blockbuster releases in IMAX, lock your favorite balcony club seats, and experience Prime Cinema.
            </p>
            <Link
              to="/home"
              className="inline-flex items-center gap-2 bg-[#00a8e1] hover:bg-[#0082b3] text-black font-extrabold text-xs px-6 py-3 rounded-lg shadow-prime-glow"
            >
              Browse Blockbusters Now <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>

      {/* Digital Ticket Modal */}
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
              onCancel={handleCancelBooking}
              showCancel={selectedTicket.paymentStatus !== 'Cancelled'}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingsPage;
