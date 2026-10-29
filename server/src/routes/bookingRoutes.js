import express from 'express';
import {
  lockSeats,
  unlockSeats,
  confirmBooking,
  getUserBookings,
  getAllBookings,
  cancelBooking,
} from '../controllers/bookingController.js';
import { verifyToken, verifyAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/lock-seats', verifyToken, lockSeats);
router.post('/unlock-seats', verifyToken, unlockSeats);
router.post('/confirm-booking', verifyToken, confirmBooking);
router.get('/', verifyToken, getUserBookings);
router.get('/my-bookings', verifyToken, getUserBookings);
router.get('/all-bookings', verifyAdmin, getAllBookings);
router.put('/cancel/:bookingId', verifyToken, cancelBooking);

export default router;
