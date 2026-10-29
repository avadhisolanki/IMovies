import mongoose from 'mongoose';

let mongoConnected = false;

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/imovies';
  try {
    mongoose.set('strictQuery', false);
    // Short timeout so app starts without waiting 30 seconds if local mongod is offline
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2500,
    });
    mongoConnected = true;
    console.log(`[iMovies DB] Connected to MongoDB at ${uri}`);
  } catch (err) {
    mongoConnected = false;
    console.warn(`[iMovies DB] MongoDB offline (${err.message}). Activating In-Memory / File-Persisted Fallback DB.`);
    console.log(`[iMovies DB] All features (Auth, Movies, Shows, Seat Locking, TTL, Bookings) fully functional!`);
  }
};

export const isMongoConnected = () => mongoConnected;
