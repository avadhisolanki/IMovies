import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
  {
    bookingId: {
      type: String,
      required: [true, 'Booking ID is required'],
      unique: true,
    },
    userEmail: {
      type: String,
      required: [true, 'User email is required'],
      trim: true,
      lowercase: true,
    },
    showId: {
      type: String,
      required: [true, 'Show ID is required'],
    },
    movieId: {
      type: String,
      default: '',
    },
    movieName: {
      type: String,
      default: '',
    },
    theatreName: {
      type: String,
      default: '',
    },
    location: {
      type: String,
      default: '',
    },
    showDate: {
      type: Date,
      default: Date.now,
    },
    showTime: {
      type: String,
      default: '',
    },
    selectedSeats: {
      type: [String],
      required: [true, 'Selected seats are required'],
    },
    seatDetails: [
      {
        seatNumber: String,
        tier: String,
        price: Number,
      },
    ],
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
    },
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Completed', 'Cancelled'],
      default: 'Completed',
    },
    paymentMethod: {
      type: String,
      default: 'Razorpay',
    },
    razorpayOrderId: {
      type: String,
      default: '',
    },
    razorpayPaymentId: {
      type: String,
      default: '',
    },
    razorpaySignature: {
      type: String,
      default: '',
    },
    bookingDate: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const Booking = mongoose.models.Booking || mongoose.model('Booking', bookingSchema);
export default Booking;
