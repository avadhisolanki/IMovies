import Favorite from '../models/favoriteModel.js';
import Movie from '../models/movieModel.js';
import { isMongoConnected } from '../config/db.js';
import { memoryDB } from '../config/memoryStore.js';

export const getFavorites = async (req, res) => {
  try {
    const userEmail = req.user.email;

    if (isMongoConnected()) {
      const favs = await Favorite.find({ userEmail });
      const movieIds = favs.map(f => f.movieId);
      const movies = await Movie.find({ _id: { $in: movieIds } });
      return res.json({ success: true, count: movies.length, favorites: movies });
    } else {
      const favMovieIds = memoryDB.favorites.filter(f => f.userEmail === userEmail).map(f => f.movieId);
      const movies = memoryDB.movies.filter(m => favMovieIds.includes(m._id));
      return res.json({ success: true, count: movies.length, favorites: movies });
    }
  } catch (err) {
    console.error('Get Favorites Error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};

export const toggleFavorite = async (req, res) => {
  try {
    const { movieId } = req.body;
    const userEmail = req.user.email;

    if (!movieId) {
      return res.status(400).json({ success: false, message: 'Movie ID is required' });
    }

    if (isMongoConnected()) {
      const existing = await Favorite.findOne({ userEmail, movieId });
      if (existing) {
        await Favorite.deleteOne({ _id: existing._id });
        return res.json({ success: true, isFavorited: false, message: 'Removed from Prime Watchlist' });
      } else {
        await Favorite.create({ userEmail, movieId });
        return res.json({ success: true, isFavorited: true, message: 'Added to Prime Watchlist' });
      }
    } else {
      const idx = memoryDB.favorites.findIndex(f => f.userEmail === userEmail && f.movieId === movieId);
      if (idx !== -1) {
        memoryDB.favorites.splice(idx, 1);
        return res.json({ success: true, isFavorited: false, message: 'Removed from Prime Watchlist' });
      } else {
        memoryDB.favorites.push({
          _id: `fav_${Date.now()}`,
          userEmail,
          movieId,
          createdAt: new Date(),
        });
        return res.json({ success: true, isFavorited: true, message: 'Added to Prime Watchlist' });
      }
    }
  } catch (err) {
    console.error('Toggle Favorite Error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};
