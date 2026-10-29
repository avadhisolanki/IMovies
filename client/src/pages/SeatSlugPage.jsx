import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Clock,
  ShieldCheck,
  AlertTriangle,
  Film,
  Ticket,
  CreditCard,
  CheckCircle,
  X,
  Sparkles,
  Lock,
  Smartphone,
  Zap,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { initiateRazorpayCheckout } from '../services/razorpay';
import { toast } from 'react-toastify';

const SeatSlugPage = () => {
  const { showId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [show, setShow] = useState(null);
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);

  // Seat selection states
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [lockedSeats, setLockedSeats] = useState([]);
  const [isLocked, setIsLocked] = useState(false);
  const [ttlSeconds, setTtlSeconds] = useState(300); // 5 minutes (300s)

  // Payment modal state
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Razorpay (Cards, UPI, NetBanking)');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const timerRef = useRef(null);

  // Fetch show details
  const fetchShow = async () => {
    try {
      const res = await api.get(`/shows/${showId}`);
      if (res.data && res.data.show) {
        setShow(res.data.show);
        setMovie(res.data.movie);

        // Check if any seats are already locked by current user
        if (res.data.show.tickets && user) {
          const userLocked = [];
          Object.keys(res.data.show.tickets).forEach((sId) => {
            const seat = res.data.show.tickets[sId];
            if (seat.status === 'locked' && seat.lockedBy === user.email) {
              userLocked.push(sId);
            }
          });

          if (userLocked.length > 0 && !isLocked) {
            setSelectedSeats(userLocked);
            setLockedSeats(userLocked);
            setIsLocked(true);
          }
        }
      }
    } catch (err) {
      toast.error('Failed to load show details');
      navigate('/home');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShow();
    // Refresh seat states every 15 seconds to reflect other users' locks
    const pollInterval = setInterval(fetchShow, 15000);
    return () => clearInterval(pollInterval);
  }, [showId, user?.email]);

  // Countdown TTL timer effect
  useEffect(() => {
    if (isLocked) {
      timerRef.current = setInterval(() => {
        setTtlSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleLockExpiration();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isLocked]);

  // Handle lock expiration
  const handleLockExpiration = async () => {
    toast.warn('Lock expired! Your temporary seat hold has ended.');
    try {
      await api.post('/bookings/unlock-seats', { showId, seats: selectedSeats });
    } catch {}
    setIsLocked(false);
    setSelectedSeats([]);
    setLockedSeats([]);
    setTtlSeconds(300);
    fetchShow();
  };

  // Toggle seat selection
  const handleSeatClick = (seatId) => {
    if (!show?.tickets || !show.tickets[seatId]) return;
    const seat = show.tickets[seatId];

    // Cannot click booked seats
    if (seat.status === 'booked') {
      toast.info(`Seat ${seatId} is already booked.`);
      return;
    }

    // Cannot click locked seats by someone else
    if (seat.status === 'locked' && seat.lockedBy !== user?.email) {
      toast.info(`Seat ${seatId} is temporarily locked by another customer.`);
      return;
    }

    // If currently locked by user, prevent deselecting without unlocking
    if (isLocked) {
      toast.info('Seats are locked for checkout. Click "Release Seats" to change your selection.');
      return;
    }

    if (selectedSeats.includes(seatId)) {
      setSelectedSeats(selectedSeats.filter((s) => s !== seatId));
    } else {
      if (selectedSeats.length >= 8) {
        toast.warning('Maximum 8 seats allowed per booking transaction.');
        return;
      }
      setSelectedSeats([...selectedSeats, seatId]);
    }
  };

  // Lock seats via API
  const handleLockSeats = async () => {
    if (selectedSeats.length === 0) {
      toast.warning('Please select at least one seat first.');
      return;
    }

    try {
      const res = await api.post('/bookings/lock-seats', {
        showId,
        seats: selectedSeats,
      });

      if (res.data && res.data.success) {
        setIsLocked(true);
        setLockedSeats(selectedSeats);
        setTtlSeconds(res.data.ttlSeconds || 300);
        toast.success(res.data.message || 'Seats locked for 5 minutes!');
        fetchShow();
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Could not lock selected seats';
      toast.error(msg);
      fetchShow();
    }
  };

  // Release/Unlock seats via API
  const handleReleaseSeats = async () => {
    try {
      await api.post('/bookings/unlock-seats', {
        showId,
        seats: selectedSeats,
      });
      setIsLocked(false);
      setSelectedSeats([]);
      setLockedSeats([]);
      setTtlSeconds(300);
      toast.info('Seats released.');
      fetchShow();
    } catch (err) {
      toast.error('Failed to release seats');
    }
  };

  // Confirm booking via Razorpay or fallback payment
  const handleConfirmPayment = async () => {
    try {
      setIsProcessingPayment(true);

      if (paymentMethod.startsWith('Razorpay')) {
        await initiateRazorpayCheckout({
          amount: grandTotal,
          showId,
          selectedSeats,
          user,
          bookingDetails: {
            movieName: movie?.movieName || movie?.title || show.movieName,
            theatreName: show.theatreName,
            location: show.location,
            showDate: show.showDate,
            showTime: show.showTime,
            seatDetails: selectedSeats.map((sId) => ({
              seatNumber: sId,
              tier: show.tickets?.[sId]?.tier || 'Standard',
              price: show.tickets?.[sId]?.price || 0,
            })),
          },
          onSuccess: (booking) => {
            setCheckoutModalOpen(false);
            setIsProcessingPayment(false);
            navigate('/bookings');
          },
          onFailure: (reason, details) => {
            setIsProcessingPayment(false);
          },
        });
        return;
      }

      // 1-Click fallback confirmation
      const res = await api.post('/bookings/confirm-booking', {
        showId,
        selectedSeats,
        paymentMethod,
      });

      if (res.data && res.data.success) {
        toast.success('🎉 Booking confirmed! Digital pass generated.');
        setCheckoutModalOpen(false);
        navigate('/bookings');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking payment failed');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Format MM:SS
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Calculation of totals
  const subtotal = selectedSeats.reduce((acc, sId) => {
    const seat = show?.tickets?.[sId];
    return acc + (seat?.price || 0);
  }, 0);

  const convenienceFee = selectedSeats.length > 0 ? 30 : 0;
  const primeDiscount = selectedSeats.length > 0 ? 50 : 0;
  const grandTotal = Math.max(0, subtotal + convenienceFee - primeDiscount);

  // Group tickets into tiers for rendering
  const getTierSeats = (tierName) => {
    if (!show?.tickets) return [];
    return Object.values(show.tickets).filter((s) => s.tier === tierName);
  };

  if (loading || !show) {
    return (
      <div className="min-h-screen bg-[#0f171e] flex items-center justify-center text-white">
        <div className="w-12 h-12 border-4 border-[#00a8e1] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f171e] text-white pb-28 pt-4">
      {/* Top Breadcrumb & Showtime Info Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <div className="bg-[#1a242f] border border-[#253241] rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#00a8e1] font-bold uppercase tracking-wider mb-1">
              <span>PRIME THEATRE SEAT SELECTION</span>
              <span>•</span>
              <span>{show.screenType || 'IMAX Laser 3D'}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {movie?.movieName || show.movieName}
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              {show.theatreName} — {show.location} •{' '}
              {new Date(show.showDate).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}{' '}
              at <span className="text-white font-semibold">{show.showTime}</span>
            </p>
          </div>

          {/* Real-time TTL Lock Banner */}
          {isLocked ? (
            <div className="flex items-center gap-3 bg-[#151c24] border border-amber-500/50 px-4 py-2.5 rounded-lg shadow-inner">
              <div className="flex items-center gap-2">
                <Clock className={`w-5 h-5 ${ttlSeconds < 60 ? 'text-red-400 animate-bounce' : 'text-amber-400'}`} />
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                    SEAT LOCK EXPIRES IN
                  </p>
                  <p className={`text-lg font-black font-mono leading-none ${ttlSeconds < 60 ? 'text-red-400' : 'text-amber-400'}`}>
                    {formatTime(ttlSeconds)}
                  </p>
                </div>
              </div>
              <button
                onClick={handleReleaseSeats}
                className="text-xs bg-[#253241] hover:bg-[#2c3b4d] text-gray-300 px-3 py-1.5 rounded transition"
              >
                Release Seats
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-gray-400 bg-[#151c24] px-4 py-2.5 rounded-lg border border-[#253241]">
              <ShieldCheck className="w-4 h-4 text-[#00a8e1]" />
              <span>Select seats and click "Lock Seats" to hold for 5 minutes</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Seat Map Layout Container */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        
        {/* Cinema Curved Screen Visual */}
        <div className="my-10 text-center">
          <div className="cinema-screen-curve max-w-2xl mx-auto mb-3"></div>
          <p className="text-[11px] font-bold tracking-widest uppercase text-gray-400 flex items-center justify-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00a8e1]"></span>
            ALL EYES THIS WAY: ULTRA-WIDE CINEMA SCREEN
            <span className="w-1.5 h-1.5 rounded-full bg-[#00a8e1]"></span>
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-6 mb-10 py-3 px-6 bg-[#1a242f]/60 border border-[#253241] rounded-xl text-xs">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded border border-gray-600 bg-[#1a242f]"></div>
            <span className="text-gray-300">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-[#00a8e1] shadow-prime-glow flex items-center justify-center text-black font-bold text-[10px]">
              ✓
            </div>
            <span className="text-white font-semibold">Selected</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-amber-500/30 border border-amber-500 flex items-center justify-center">
              <Lock className="w-3 h-3 text-amber-400" />
            </div>
            <span className="text-amber-400">Locked (TTL)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-red-950/60 border border-red-700/60 opacity-60"></div>
            <span className="text-red-400">Booked</span>
          </div>
        </div>

        {/* TIER 1: BALCONY CLUB (PREMIUM) */}
        <div className="mb-8 bg-[#1a242f] border border-[#253241] p-6 rounded-2xl shadow-xl">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#253241]">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sky-400" />
              <h3 className="text-sm font-black uppercase tracking-wider text-sky-400">
                Balcony Club Lounge
              </h3>
            </div>
            <span className="text-xs font-bold text-gray-300">
              ₹{show.pricing?.balcony || 350} / ticket
            </span>
          </div>

          <div className="flex flex-col items-center gap-2.5 overflow-x-auto py-2">
            {['A', 'B'].map((rowLetter) => (
              <div key={rowLetter} className="flex items-center gap-2">
                <span className="w-6 text-xs font-mono font-bold text-gray-500 text-center">
                  {rowLetter}
                </span>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((col) => {
                    const seatId = `B${rowLetter}${col}`;
                    const seat = show.tickets?.[seatId] || { status: 'available', price: show.pricing?.balcony };
                    const isSelected = selectedSeats.includes(seatId);
                    const isLockedByMe = seat.status === 'locked' && seat.lockedBy === user?.email;
                    const isLockedByOther = seat.status === 'locked' && seat.lockedBy !== user?.email;
                    const isBooked = seat.status === 'booked';

                    return (
                      <button
                        key={seatId}
                        onClick={() => handleSeatClick(seatId)}
                        disabled={isBooked || isLockedByOther}
                        title={`Balcony ${rowLetter}${col} - ₹${seat.price}`}
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-t-lg text-[10px] sm:text-xs font-mono font-bold transition-all transform flex items-center justify-center ${
                          isBooked
                            ? 'bg-red-950/60 border border-red-800 text-red-500/50 cursor-not-allowed opacity-40'
                            : isLockedByOther
                            ? 'bg-amber-950/60 border border-amber-600 text-amber-400 cursor-not-allowed'
                            : isSelected || isLockedByMe
                            ? 'bg-[#00a8e1] text-black font-extrabold scale-110 shadow-prime-glow ring-2 ring-white'
                            : 'bg-[#151c24] border border-sky-500/40 text-sky-300 hover:bg-sky-500/20 hover:scale-105'
                        }`}
                      >
                        {isLockedByOther ? <Lock className="w-3 h-3 text-amber-400" /> : col}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* TIER 2: MIDDLE PRIME EXECUTIVE */}
        <div className="mb-8 bg-[#1a242f] border border-[#253241] p-6 rounded-2xl shadow-xl">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#253241]">
            <div className="flex items-center gap-2">
              <Film className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-black uppercase tracking-wider text-purple-400">
                Prime Executive Tier
              </h3>
            </div>
            <span className="text-xs font-bold text-gray-300">
              ₹{show.pricing?.middle || 250} / ticket
            </span>
          </div>

          <div className="flex flex-col items-center gap-2.5 overflow-x-auto py-2">
            {['A', 'B', 'C'].map((rowLetter) => (
              <div key={rowLetter} className="flex items-center gap-2">
                <span className="w-6 text-xs font-mono font-bold text-gray-500 text-center">
                  {rowLetter}
                </span>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((col) => {
                    const seatId = `M${rowLetter}${col}`;
                    const seat = show.tickets?.[seatId] || { status: 'available', price: show.pricing?.middle };
                    const isSelected = selectedSeats.includes(seatId);
                    const isLockedByMe = seat.status === 'locked' && seat.lockedBy === user?.email;
                    const isLockedByOther = seat.status === 'locked' && seat.lockedBy !== user?.email;
                    const isBooked = seat.status === 'booked';

                    return (
                      <button
                        key={seatId}
                        onClick={() => handleSeatClick(seatId)}
                        disabled={isBooked || isLockedByOther}
                        title={`Middle ${rowLetter}${col} - ₹${seat.price}`}
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-t-lg text-[10px] sm:text-xs font-mono font-bold transition-all transform flex items-center justify-center ${
                          isBooked
                            ? 'bg-red-950/60 border border-red-800 text-red-500/50 cursor-not-allowed opacity-40'
                            : isLockedByOther
                            ? 'bg-amber-950/60 border border-amber-600 text-amber-400 cursor-not-allowed'
                            : isSelected || isLockedByMe
                            ? 'bg-[#00a8e1] text-black font-extrabold scale-110 shadow-prime-glow ring-2 ring-white'
                            : 'bg-[#151c24] border border-purple-500/40 text-purple-300 hover:bg-purple-500/20 hover:scale-105'
                        }`}
                      >
                        {isLockedByOther ? <Lock className="w-3 h-3 text-amber-400" /> : col}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* TIER 3: LOWER STANDARD SAVER */}
        <div className="mb-8 bg-[#1a242f] border border-[#253241] p-6 rounded-2xl shadow-xl">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#253241]">
            <div className="flex items-center gap-2">
              <Ticket className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-black uppercase tracking-wider text-emerald-400">
                Lower Standard Tier
              </h3>
            </div>
            <span className="text-xs font-bold text-gray-300">
              ₹{show.pricing?.lower || 150} / ticket
            </span>
          </div>

          <div className="flex flex-col items-center gap-2.5 overflow-x-auto py-2">
            {['A', 'B'].map((rowLetter) => (
              <div key={rowLetter} className="flex items-center gap-2">
                <span className="w-6 text-xs font-mono font-bold text-gray-500 text-center">
                  {rowLetter}
                </span>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((col) => {
                    const seatId = `L${rowLetter}${col}`;
                    const seat = show.tickets?.[seatId] || { status: 'available', price: show.pricing?.lower };
                    const isSelected = selectedSeats.includes(seatId);
                    const isLockedByMe = seat.status === 'locked' && seat.lockedBy === user?.email;
                    const isLockedByOther = seat.status === 'locked' && seat.lockedBy !== user?.email;
                    const isBooked = seat.status === 'booked';

                    return (
                      <button
                        key={seatId}
                        onClick={() => handleSeatClick(seatId)}
                        disabled={isBooked || isLockedByOther}
                        title={`Lower ${rowLetter}${col} - ₹${seat.price}`}
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-t-lg text-[10px] sm:text-xs font-mono font-bold transition-all transform flex items-center justify-center ${
                          isBooked
                            ? 'bg-red-950/60 border border-red-800 text-red-500/50 cursor-not-allowed opacity-40'
                            : isLockedByOther
                            ? 'bg-amber-950/60 border border-amber-600 text-amber-400 cursor-not-allowed'
                            : isSelected || isLockedByMe
                            ? 'bg-[#00a8e1] text-black font-extrabold scale-110 shadow-prime-glow ring-2 ring-white'
                            : 'bg-[#151c24] border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/20 hover:scale-105'
                        }`}
                      >
                        {isLockedByOther ? <Lock className="w-3 h-3 text-amber-400" /> : col}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Floating Bottom Checkout Action Dock */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#0f171e]/95 backdrop-blur-md border-t border-[#253241] py-4 px-4 sm:px-6 lg:px-8 shadow-2xl">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Selected Summary */}
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="hidden sm:block">
              <p className="text-xs text-gray-400">Selected Seats</p>
              <div className="flex flex-wrap gap-1 mt-0.5 max-w-xs">
                {selectedSeats.length > 0 ? (
                  selectedSeats.map((s) => (
                    <span
                      key={s}
                      className="bg-[#1a242f] border border-[#00a8e1]/50 text-[#00a8e1] text-xs font-mono font-bold px-2 py-0.5 rounded"
                    >
                      {s}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-gray-500 italic">None selected yet</span>
                )}
              </div>
            </div>

            <div className="sm:border-l sm:border-[#253241] sm:pl-4">
              <span className="text-[10px] text-gray-400 uppercase font-semibold">Total Amount</span>
              <p className="text-2xl font-black text-white flex items-baseline gap-1">
                ₹{grandTotal}
                {primeDiscount > 0 && (
                  <span className="text-xs text-emerald-400 font-semibold line-through">
                    ₹{subtotal + convenienceFee}
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Action Button: Lock or Proceed */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {!isLocked ? (
              <button
                onClick={handleLockSeats}
                disabled={selectedSeats.length === 0}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#00a8e1] hover:bg-[#0082b3] disabled:opacity-40 disabled:cursor-not-allowed text-black font-extrabold text-sm px-6 py-3 rounded-lg transition transform hover:scale-102 shadow-prime-glow"
              >
                <Lock className="w-4 h-4 fill-black" />
                Proceed to Lock Seats ({selectedSeats.length})
              </button>
            ) : (
              <button
                onClick={() => setCheckoutModalOpen(true)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-[#00a8e1] to-[#00d0ff] hover:from-[#0082b3] hover:to-[#00a8e1] text-black font-black text-sm px-8 py-3 rounded-lg transition transform hover:scale-105 shadow-prime-glow animate-pulse"
              >
                <CreditCard className="w-4 h-4" />
                Checkout & Pay (₹{grandTotal})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Checkout & Simulated Payment Modal */}
      {checkoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-lg bg-[#1a242f] rounded-2xl overflow-hidden border border-[#2c3b4d] shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 bg-[#151c24] border-b border-[#253241]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#00a8e1] flex items-center justify-center text-black font-black">
                  <Ticket className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Prime Cinema Checkout</h3>
                  <p className="text-xs text-gray-400">{movie?.movieName} • {show.theatreName}</p>
                </div>
              </div>
              <button
                onClick={() => setCheckoutModalOpen(false)}
                className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-[#253241]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Price breakdown */}
            <div className="p-6 space-y-4">
              <div className="bg-[#151c24] p-4 rounded-xl border border-[#253241] space-y-2 text-xs">
                <div className="flex justify-between text-gray-300">
                  <span>Tickets ({selectedSeats.length} seats: {selectedSeats.join(', ')})</span>
                  <span className="font-semibold text-white">₹{subtotal}</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Convenience & Booking Fee</span>
                  <span className="font-semibold text-white">₹{convenienceFee}</span>
                </div>
                <div className="flex justify-between text-emerald-400 font-semibold">
                  <span>Prime Member Instant Discount</span>
                  <span>-₹{primeDiscount}</span>
                </div>
                <div className="border-t border-[#253241] pt-2 flex justify-between text-sm font-black text-white">
                  <span>Grand Total</span>
                  <span className="text-[#00a8e1] text-base">₹{grandTotal}</span>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-2">
                  Select Payment Gateway / Method
                </label>
                <div className="space-y-2.5">
                  {/* Razorpay Gateway Option */}
                  <div
                    onClick={() => setPaymentMethod('Razorpay (Cards, UPI, NetBanking)')}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      paymentMethod.startsWith('Razorpay')
                        ? 'bg-[#1e293b] border-[#00a8e1] shadow-prime-glow ring-1 ring-[#00a8e1]'
                        : 'bg-[#151c24] border-[#253241] text-gray-300 hover:bg-[#1a242f]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-[#00a8e1]" />
                        <span className="text-xs font-bold text-white">Razorpay Secure Checkout</span>
                        <span className="bg-[#E50914] text-white text-[9px] font-black uppercase px-1.5 py-0.5 rounded">
                          Official
                        </span>
                      </div>
                      {paymentMethod.startsWith('Razorpay') && (
                        <CheckCircle className="w-4 h-4 text-[#00a8e1]" />
                      )}
                    </div>
                    <p className="text-[11px] text-gray-400 mb-2">
                      Instant checkout with UPI QR, Google Pay, PhonePe, Cards, NetBanking & Wallets.
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="text-[10px] bg-[#0f171e] border border-[#253241] text-gray-300 px-2 py-0.5 rounded font-medium">
                        UPI / QR (GPay, PhonePe, Paytm, BHIM)
                      </span>
                      <span className="text-[10px] bg-[#0f171e] border border-[#253241] text-gray-300 px-2 py-0.5 rounded font-medium">
                        Cards (Visa, MC, RuPay)
                      </span>
                      <span className="text-[10px] bg-[#0f171e] border border-[#253241] text-gray-300 px-2 py-0.5 rounded font-medium">
                        NetBanking & Wallets
                      </span>
                    </div>
                  </div>

                  {/* Prime 1-Click Option */}
                  <div
                    onClick={() => setPaymentMethod('Prime Cinema Pay (Instant 1-Click)')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                      paymentMethod === 'Prime Cinema Pay (Instant 1-Click)'
                        ? 'bg-[#1e293b] border-[#00a8e1] shadow-prime-glow'
                        : 'bg-[#151c24] border-[#253241] text-gray-300 hover:bg-[#1a242f]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-400" />
                      <div>
                        <span className="text-xs font-semibold text-white block">
                          Prime Cinema 1-Click Pay
                        </span>
                        <span className="text-[10px] text-gray-400">
                          Instant pass generation using Prime Wallet / Saved Credit
                        </span>
                      </div>
                    </div>
                    {paymentMethod === 'Prime Cinema Pay (Instant 1-Click)' && (
                      <CheckCircle className="w-4 h-4 text-[#00a8e1]" />
                    )}
                  </div>
                </div>
              </div>

              {/* Payment CTA */}
              <button
                onClick={handleConfirmPayment}
                disabled={isProcessingPayment}
                className="w-full flex items-center justify-center gap-2 bg-[#00a8e1] hover:bg-[#0082b3] text-black font-extrabold text-sm py-3.5 rounded-xl transition transform hover:scale-[1.02] shadow-prime-glow disabled:opacity-50"
              >
                {isProcessingPayment ? (
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    {paymentMethod.startsWith('Razorpay')
                      ? `Proceed to Razorpay Checkout (₹${grandTotal})`
                      : `Authorize & Confirm Tickets (₹${grandTotal})`}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SeatSlugPage;
