import mongoose from 'mongoose';

const favoriteSchema = new mongoose.Schema(
  {
    userEmail: {
      type: String,
      required: [true, 'User email is required'],
      lowercase: true,
      trim: true,
    },
    movieId: {
      type: String,
      required: [true, 'Movie ID is required'],
    },
  },
  { timestamps: true }
);

// Compound index to prevent duplicate favorites per user
favoriteSchema.index({ userEmail: 1, movieId: 1 }, { unique: true });

const Favorite = mongoose.models.Favorite || mongoose.model('Favorite', favoriteSchema);
export default Favorite;
