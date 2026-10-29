import Booking from '../models/bookingModel.js';
import Show from '../models/showModel.js';
import Movie from '../models/movieModel.js';
import { isMongoConnected } from '../config/db.js';
import { memoryDB } from '../config/memoryStore.js';
import { cleanExpiredLocksForShow } from '../utils/ttlCleaner.js';
import { sendBookingConfirmationEmail, sendBookingStatusUpdateEmail } from '../services/emailService.js';

const LOCK_DURATION_MS = 5 * 60 * 1000; // 5 Minutes TTL Lock

// Helper to find a show in either MongoDB or memoryDB
const findShow = async (showId) => {
  if (isMongoConnected()) {
    return await Show.findOne({ $or: [{ showId }, { _id: showId.match(/^[0-9a-fA-F]{24}$/) ? showId : null }] });
  } else {
    return memoryDB.shows.find(s => s.showId === showId || s._id === showId);
  }
};

// 1. Lock Seats with TTL
export const lockSeats = async (req, res) => {
  try {
    const { showId } = req.body;
    const seats = req.body.seats || req.body.selectedSeats;
    const userEmail = req.user.email;

    if (!showId || !seats || !Array.isArray(seats) || seats.length === 0) {
      return res.status(400).json({ success: false, message: 'Show ID and at least one seat are required' });
    }

    const show = await findShow(showId);
    if (!show) {
      return res.status(404).json({ success: false, message: 'Show not found' });
    }

    // Clean expired locks first
    cleanExpiredLocksForShow(show);

    const now = Date.now();
    const lockExpiry = new Date(now + LOCK_DURATION_MS);
    const conflictingSeats = [];

    // Verify availability
    for (const seatId of seats) {
      const seat = show.tickets[seatId];
      if (!seat) {
        return res.status(400).json({ success: false, message: `Seat ${seatId} does not exist in this theatre layout` });
      }

      if (seat.status === 'booked') {
        conflictingSeats.push({ seatId, reason: 'Already booked' });
      } else if (seat.status === 'locked' && seat.lockedBy !== userEmail) {
        // If locked by someone else and lock hasn't expired
        const lockUntil = new Date(seat.lockedUntil).getTime();
        if (lockUntil > now) {
          conflictingSeats.push({ seatId, reason: 'Locked by another customer' });
        }
      }
    }

    if (conflictingSeats.length > 0) {
      return res.status(409).json({
        success: false,
        message: `Seats unavailable: ${conflictingSeats.map(c => `${c.seatId} (${c.reason})`).join(', ')}`,
        conflicts: conflictingSeats,
      });
    }

    // Apply the lock
    for (const seatId of seats) {
      show.tickets[seatId].status = 'locked';
      show.tickets[seatId].lockedBy = userEmail;
      show.tickets[seatId].lockedUntil = lockExpiry;
    }

    if (isMongoConnected()) {
      show.markModified('tickets');
      await show.save();
    }

    return res.json({
      success: true,
      message: `${seats.length} seat(s) locked successfully for 5 minutes!`,
      lockedSeats: seats,
      lockedUntil: lockExpiry,
      ttlSeconds: Math.floor(LOCK_DURATION_MS / 1000),
    });
  } catch (err) {
    console.error('Lock Seats Error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};

// 2. Unlock / Release Seats
export const unlockSeats = async (req, res) => {
  try {
    const { showId, seats } = req.body;
    const userEmail = req.user.email;

    if (!showId || !seats || !Array.isArray(seats)) {
      return res.status(400).json({ success: false, message: 'Show ID and seats are required' });
    }

    const show = await findShow(showId);
    if (!show) {
      return res.status(404).json({ success: false, message: 'Show not found' });
    }

    seats.forEach((seatId) => {
      const seat = show.tickets[seatId];
      if (seat && seat.status === 'locked' && (seat.lockedBy === userEmail || req.user.role === 'admin')) {
        seat.status = 'available';
        seat.lockedBy = null;
        seat.lockedUntil = null;
      }
    });

    if (isMongoConnected()) {
      show.markModified('tickets');
      await show.save();
    }

    return res.json({
      success: true,
      message: 'Seats unlocked successfully',
      unlockedSeats: seats,
    });
  } catch (err) {
    console.error('Unlock Seats Error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};

// 3. Confirm Booking
export const confirmBooking = async (req, res) => {
  try {
    const { showId, selectedSeats, paymentMethod } = req.body;
    const userEmail = req.user.email;

    if (!showId || !selectedSeats || !Array.isArray(selectedSeats) || selectedSeats.length === 0) {
      return res.status(400).json({ success: false, message: 'Show ID and at least one selected seat are required' });
    }

    const show = await findShow(showId);
    if (!show) {
      return res.status(404).json({ success: false, message: 'Show not found' });
    }

    cleanExpiredLocksForShow(show);

    const seatDetails = [];
    let calculatedTotal = 0;

    for (const seatId of selectedSeats) {
      const seat = show.tickets[seatId];
      if (!seat) {
        return res.status(400).json({ success: false, message: `Invalid seat: ${seatId}` });
      }

      if (seat.status === 'booked') {
        return res.status(409).json({ success: false, message: `Seat ${seatId} was already booked.` });
      }

      // Check if locked by another user
      if (seat.status === 'locked' && seat.lockedBy !== userEmail) {
        return res.status(409).json({ success: false, message: `Seat ${seatId} is locked by someone else.` });
      }

      calculatedTotal += seat.price;
      seatDetails.push({
        seatNumber: seatId,
        tier: seat.tier,
        price: seat.price,
      });
    }

    // Mark seats as BOOKED permanently
    for (const seatId of selectedSeats) {
      show.tickets[seatId].status = 'booked';
      show.tickets[seatId].lockedBy = null;
      show.tickets[seatId].lockedUntil = null;
    }

    if (isMongoConnected()) {
      show.markModified('tickets');
      await show.save();
    }

    // Unique Booking ID formatted like Amazon Prime Cinema pass
    const bookingId = `PRIME-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const bookingData = {
      bookingId,
      userEmail,
      showId: show.showId || show._id,
      movieId: show.movieId,
      movieName: show.movieName,
      theatreName: show.theatreName,
      location: show.location,
      showDate: show.showDate,
      showTime: show.showTime,
      selectedSeats,
      seatDetails,
      totalAmount: calculatedTotal,
      paymentStatus: 'Completed',
      paymentMethod: paymentMethod || 'Prime Cinema Pay',
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

    // Dispatch ticket pass to user's email asynchronously
    sendBookingConfirmationEmail(userEmail, savedBooking).catch((err) => {
      console.error('[Confirm Booking Email Error]:', err.message);
    });

    return res.status(201).json({
      success: true,
      message: 'Tickets booked successfully! Enjoy the Prime Cinema experience.',
      booking: savedBooking,
    });
  } catch (err) {
    console.error('Confirm Booking Error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};

// 4. Get User Bookings
export const getUserBookings = async (req, res) => {
  try {
    const userEmail = req.user.email;

    if (isMongoConnected()) {
      const bookings = await Booking.find({ userEmail }).sort({ bookingDate: -1 });
      return res.json({ success: true, count: bookings.length, bookings });
    } else {
      const bookings = memoryDB.bookings
        .filter(b => b.userEmail === userEmail)
        .sort((a, b) => new Date(b.bookingDate) - new Date(a.bookingDate));
      return res.json({ success: true, count: bookings.length, bookings });
    }
  } catch (err) {
    console.error('Get User Bookings Error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};

// 5. Get All Bookings (Admin)
export const getAllBookings = async (req, res) => {
  try {
    if (isMongoConnected()) {
      const bookings = await Booking.find({}).sort({ bookingDate: -1 });
      return res.json({ success: true, count: bookings.length, bookings });
    } else {
      return res.json({ success: true, count: memoryDB.bookings.length, bookings: memoryDB.bookings });
    }
  } catch (err) {
    console.error('Get All Bookings Error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};

// 6. Cancel Booking (User or Admin)
export const cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userEmail = req.user.email;
    const isAdmin = req.user.role === 'admin';

    let booking;
    if (isMongoConnected()) {
      booking = await Booking.findOne({ bookingId });
    } else {
      booking = memoryDB.bookings.find(b => b.bookingId === bookingId);
    }

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.userEmail !== userEmail && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Unauthorized to cancel this booking' });
    }

    booking.paymentStatus = 'Cancelled';

    // Release seats back to available
    const show = await findShow(booking.showId);
    if (show && show.tickets) {
      booking.selectedSeats.forEach(seatId => {
        if (show.tickets[seatId]) {
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

    if (isMongoConnected()) {
      await booking.save();
    }

    // Dispatch status update email notification
    sendBookingStatusUpdateEmail(booking.userEmail, {
      bookingId: booking.bookingId,
      movieName: booking.movieName,
      status: 'Cancelled',
      reason: isAdmin ? 'Cancelled by Cinema Administrator' : 'Cancelled upon ticket holder request',
    }).catch((err) => {
      console.error('[Cancel Booking Email Warning]:', err.message);
    });

    return res.json({
      success: true,
      message: 'Booking cancelled and seats have been released back to the floor.',
      booking,
    });
  } catch (err) {
    console.error('Cancel Booking Error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};
