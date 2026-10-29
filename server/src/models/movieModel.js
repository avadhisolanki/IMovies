import mongoose from 'mongoose';

const movieSchema = new mongoose.Schema(
  {
    movieName: {
      type: String,
      required: [true, 'Movie name is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Movie description is required'],
    },
    genres: {
      type: [String],
      required: [true, 'At least one genre is required'],
    },
    releaseDate: {
      type: Date,
      required: [true, 'Release date is required'],
    },
    language: {
      type: String,
      required: [true, 'Language is required'],
    },
    duration: {
      type: String,
      required: [true, 'Duration is required'],
    },
    certification: {
      type: String,
      default: 'UA',
    },
    posterUrl: {
      type: String,
      default: '',
    },
    backdropUrl: {
      type: String,
      default: '',
    },
    trailerUrl: {
      type: String,
      default: '',
    },
    cast: {
      type: [String],
      default: [],
    },
    rating: {
      type: Number,
      default: 8.5,
    },
    featured: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Movie = mongoose.models.Movie || mongoose.model('Movie', movieSchema);
export default Movie;
