import mongoose from 'mongoose';

const showSchema = new mongoose.Schema(
  {
    adminEmail: {
      type: String,
      required: [true, 'Admin email is required'],
    },
    showId: {
      type: String,
      required: [true, 'Show ID is required'],
      unique: true,
    },
    movieId: {
      type: String,
      required: [true, 'Movie ID is required'],
    },
    movieName: {
      type: String,
      default: '',
    },
    theatreName: {
      type: String,
      required: [true, 'Theatre name is required'],
    },
    location: {
      type: String,
      default: '',
    },
    showDate: {
      type: Date,
      required: [true, 'Show date is required'],
    },
    showTime: {
      type: String,
      required: [true, 'Show time is required'],
    },
    screenType: {
      type: String,
      default: 'IMAX Laser 3D',
    },
    pricing: {
      balcony: { type: Number, default: 350 },
      middle: { type: Number, default: 250 },
      lower: { type: Number, default: 150 },
    },
    tickets: {
      type: Object,
      required: [true, 'Tickets map is required'],
      default: {},
    },
  },
  { timestamps: true }
);

const Show = mongoose.models.Show || mongoose.model('Show', showSchema);
export default Show;
