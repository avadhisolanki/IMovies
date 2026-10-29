import crypto from 'crypto';
import { razorpay, razorpayKeyId, razorpayKeySecret } from '../config/razorpay.js';
import Show from '../models/showModel.js';
import Booking from '../models/bookingModel.js';
import { isMongoConnected } from '../config/db.js';
import { memoryDB } from '../config/memoryStore.js';
import { cleanExpiredLocksForShow } from '../utils/ttlCleaner.js';
import { sendBookingConfirmationEmail } from '../services/emailService.js';

// Helper to locate show in either Mongo or MemoryDB
const findShow = async (showId) => {
  if (isMongoConnected()) {
    return await Show.findOne({
      $or: [{ showId }, { _id: showId.match(/^[0-9a-fA-F]{24}$/) ? showId : null }],
    });
  } else {
    return memoryDB.shows.find((s) => s.showId === showId || s._id === showId);
  }
};

// 1. Create Razorpay Order: POST /api/payment/create-order
export const createOrder = async (req, res) => {
  try {
    const { amount, showId, selectedSeats } = req.body;
    const userEmail = req.user?.email || req.body.userEmail;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid payment amount' });
    }
    if (!showId || !selectedSeats || !Array.isArray(selectedSeats) || selectedSeats.length === 0) {
      return res.status(400).json({ success: false, message: 'showId and selectedSeats are required' });
    }

    const show = await findShow(showId);
    if (!show) {
      return res.status(404).json({ success: false, message: 'Show not found' });
    }

    // Clean expired locks
    cleanExpiredLocksForShow(show);

    // Validate that seats are not already booked or locked by another user
    const now = Date.now();
    for (const seatId of selectedSeats) {
      const seat = show.tickets?.[seatId];
      if (!seat) {
        return res.status(400).json({ success: false, message: `Invalid seat: ${seatId}` });
      }
      if (seat.status === 'booked') {
        return res.status(409).json({ success: false, message: `Seat ${seatId} is already booked` });
      }
      if (seat.status === 'locked' && seat.lockedBy !== userEmail) {
        const lockUntil = new Date(seat.lockedUntil).getTime();
        if (lockUntil > now) {
          return res.status(409).json({ success: false, message: `Seat ${seatId} is locked by another customer` });
        }
      }
    }

    // Convert amount to paise (1 INR = 100 paise)
    const amountInPaise = Math.round(Number(amount) * 100);

    const receipt = `rcpt_${Date.now().toString().slice(-6)}_${Math.random().toString(36).substring(2, 6)}`;
    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt,
      notes: {
        showId: String(showId),
        selectedSeats: selectedSeats.join(','),
        userEmail: String(userEmail),
      },
    };

    const order = await razorpay.orders.create(options);

    return res.status(200).json({
      success: true,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: razorpayKeyId,
    });
  } catch (err) {
    console.error('Razorpay Create Order Error:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to initialize Razorpay order',
    });
  }
};

// 2. Verify Razorpay Payment: POST /api/payment/verify
export const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      bookingDetails,
    } = req.body;
    const userEmail = req.user?.email || bookingDetails?.userEmail;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing required Razorpay payment verification parameters',
      });
    }

    // HMAC SHA256 Signature verification
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', razorpayKeySecret)
      .update(body.toString())
      .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    const showId = bookingDetails?.showId;
    const selectedSeats = bookingDetails?.selectedSeats || [];
    const show = showId ? await findShow(showId) : null;

    if (!isAuthentic) {
      console.warn('[Razorpay] Signature mismatch detected. Verification failed.');

      // On failure: unlock seats back to available
      if (show && show.tickets) {
        selectedSeats.forEach((seatId) => {
          if (show.tickets[seatId] && show.tickets[seatId].status === 'locked') {
            show.tickets[seatId].status = 'available';
            show.tickets[seatId].lockedBy = null;
            show.tickets[seatId].lockedUntil = null;
          }
        });

        if (isMongoConnected()) {
          show.markModified('tickets');
          await show.save();
        }
      }

      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature. Verification failed.',
      });
    }

    // On Successful Match:
    // 1. Update show seat map from 'locked' to 'booked'
    const seatDetails = [];
    if (show && show.tickets) {
      for (const seatId of selectedSeats) {
        const seat = show.tickets[seatId];
        if (seat) {
          seat.status = 'booked';
          seat.lockedBy = null;
          seat.lockedUntil = null;
          seatDetails.push({
            seatNumber: seatId,
            tier: seat.tier || 'Standard',
            price: seat.price || 0,
          });
        }
      }

      if (isMongoConnected()) {
        show.markModified('tickets');
        await show.save();
      }
    }

    // 2. Generate Booking Record
    const bookingId = `PRIME-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const totalAmount = bookingDetails?.totalAmount ?? req.body.amount ?? 0;

    const bookingData = {
      bookingId,
      userEmail,
      showId: show?.showId || show?._id || showId,
      movieId: show?.movieId || bookingDetails?.movieId || '',
      movieName: show?.movieName || bookingDetails?.movieName || 'Theatrical Feature',
      theatreName: show?.theatreName || bookingDetails?.theatreName || 'Multiplex',
      location: show?.location || bookingDetails?.location || '',
      showDate: show?.showDate || bookingDetails?.showDate || new Date(),
      showTime: show?.showTime || bookingDetails?.showTime || '',
      selectedSeats,
      seatDetails: seatDetails.length > 0 ? seatDetails : (bookingDetails?.seatDetails || []),
      totalAmount,
      paymentStatus: 'Completed',
      paymentMethod: 'Razorpay',
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      bookingDate: new Date(),
    };

    let savedBooking;
    if (isMongoConnected()) {
      savedBooking = await Booking.create(bookingData);
    } else {
      savedBooking = {
        _id: `book_${Date.now()}`,
        ...bookingData,
        createdAt: new Date(),
      };
      memoryDB.bookings.unshift(savedBooking);
    }

    console.log(`[Razorpay Success] Booking ${bookingId} verified for ${userEmail}. Payment ID: ${razorpay_payment_id}`);

    // Dispatch Digital Pass via Brevo Transactional Email (async non-blocking)
    sendBookingConfirmationEmail(userEmail, savedBooking).catch((mailErr) => {
      console.error('[Payment Confirmation Email Warning]:', mailErr.message);
    });

    return res.status(200).json({
      success: true,
      message: 'Payment verified and booking confirmed successfully!',
      booking: savedBooking,
    });
  } catch (err) {
    console.error('Razorpay Verify Payment Error:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Payment verification processing error',
    });
  }
};
