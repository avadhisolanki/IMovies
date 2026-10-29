import mongoose from 'mongoose';

const theatreSchema = new mongoose.Schema(
  {
    theatreName: {
      type: String,
      required: [true, 'Theatre name is required'],
      trim: true,
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
    },
    balconySeatPrice: {
      type: Number,
      required: [true, 'Balcony seat price is required'],
      min: 0,
    },
    middleSeatPrice: {
      type: Number,
      required: [true, 'Middle seat price is required'],
      min: 0,
    },
    lowerSeatPrice: {
      type: Number,
      required: [true, 'Lower seat price is required'],
      min: 0,
    },
    balconySeats: {
      type: Object,
      required: [true, 'Balcony seats layout is required'],
      default: { rows: 2, cols: 10, prefix: 'B' },
    },
    middleSeats: {
      type: Object,
      required: [true, 'Middle seats layout is required'],
      default: { rows: 3, cols: 10, prefix: 'M' },
    },
    lowerSeats: {
      type: Object,
      required: [true, 'Lower seats layout is required'],
      default: { rows: 2, cols: 10, prefix: 'L' },
    },
    amenities: {
      type: [String],
      default: ['4K Dolby Atmos', 'Recliner Chairs', 'Food & Beverages'],
    },
  },
  { timestamps: true }
);

const Theatre = mongoose.models.Theatre || mongoose.model('Theatre', theatreSchema);
export default Theatre;
