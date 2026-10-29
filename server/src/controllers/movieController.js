import Movie from '../models/movieModel.js';
import { isMongoConnected } from '../config/db.js';
import { memoryDB } from '../config/memoryStore.js';

// Get All Movies (with search, genre, language filters)
export const getAllMovies = async (req, res) => {
  try {
    const { search, genre, language, featured } = req.query;

    if (isMongoConnected()) {
      const query = {};
      if (search) {
        query.$or = [
          { movieName: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { cast: { $regex: search, $options: 'i' } },
        ];
      }
      if (genre && genre !== 'All') {
        query.genres = { $in: [genre] };
      }
      if (language && language !== 'All') {
        query.language = { $regex: language, $options: 'i' };
      }
      if (featured === 'true') {
        query.featured = true;
      }

      const movies = await Movie.find(query).sort({ rating: -1, releaseDate: -1 });
      return res.json({ success: true, count: movies.length, movies });
    } else {
      let filtered = [...memoryDB.movies];

      if (search) {
        const s = search.toLowerCase();
        filtered = filtered.filter(
          m =>
            m.movieName.toLowerCase().includes(s) ||
            m.description.toLowerCase().includes(s) ||
            (m.cast && m.cast.some(c => c.toLowerCase().includes(s)))
        );
      }
      if (genre && genre !== 'All') {
        filtered = filtered.filter(m => m.genres && m.genres.includes(genre));
      }
      if (language && language !== 'All') {
        filtered = filtered.filter(m => m.language && m.language.toLowerCase().includes(language.toLowerCase()));
      }
      if (featured === 'true') {
        filtered = filtered.filter(m => m.featured);
      }

      return res.json({ success: true, count: filtered.length, movies: filtered });
    }
  } catch (err) {
    console.error('Get All Movies Error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};

// Get Movie by ID
export const getMovieById = async (req, res) => {
  try {
    const { id } = req.params;

    if (isMongoConnected()) {
      const movie = await Movie.findById(id);
      if (!movie) {
        return res.status(404).json({ success: false, message: 'Movie not found' });
      }
      return res.json({ success: true, movie });
    } else {
      const movie = memoryDB.movies.find(m => m._id === id || m.id === id);
      if (!movie) {
        return res.status(404).json({ success: false, message: 'Movie not found' });
      }
      return res.json({ success: true, movie });
    }
  } catch (err) {
    console.error('Get Movie By ID Error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};

// Create Movie (Admin)
export const createMovie = async (req, res) => {
  try {
    const { movieName, description, genres, releaseDate, language, duration, certification, posterUrl, backdropUrl, trailerUrl, cast, rating, featured } = req.body;

    if (!movieName || !description || !genres || !releaseDate || !language || !duration) {
      return res.status(400).json({ success: false, message: 'Required movie fields missing' });
    }

    const movieData = {
      movieName: movieName.trim(),
      description: description.trim(),
      genres: Array.isArray(genres) ? genres : genres.split(',').map(g => g.trim()),
      releaseDate: new Date(releaseDate),
      language: language.trim(),
      duration: duration.toString(),
      certification: certification || 'U/A',
      posterUrl: posterUrl || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&auto=format&fit=crop&q=80',
      backdropUrl: backdropUrl || 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=1600&auto=format&fit=crop&q=80',
      trailerUrl: trailerUrl || '',
      cast: Array.isArray(cast) ? cast : (cast ? cast.split(',').map(c => c.trim()) : []),
      rating: Number(rating) || 8.0,
      featured: Boolean(featured),
    };

    if (isMongoConnected()) {
      const movie = await Movie.create(movieData);
      return res.status(201).json({ success: true, message: 'Movie created successfully!', movie });
    } else {
      const movie = {
        _id: `movie_${Date.now()}`,
        ...movieData,
        createdAt: new Date(),
      };
      memoryDB.movies.unshift(movie);
      return res.status(201).json({ success: true, message: 'Movie created successfully!', movie });
    }
  } catch (err) {
    console.error('Create Movie Error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};

// Update Movie (Admin)
export const updateMovie = async (req, res) => {
  try {
    const { id } = req.params;

    if (isMongoConnected()) {
      const movie = await Movie.findByIdAndUpdate(id, req.body, { new: true });
      if (!movie) {
        return res.status(404).json({ success: false, message: 'Movie not found' });
      }
      return res.json({ success: true, message: 'Movie updated successfully!', movie });
    } else {
      const idx = memoryDB.movies.findIndex(m => m._id === id);
      if (idx === -1) {
        return res.status(404).json({ success: false, message: 'Movie not found' });
      }
      memoryDB.movies[idx] = { ...memoryDB.movies[idx], ...req.body, updatedAt: new Date() };
      return res.json({ success: true, message: 'Movie updated successfully!', movie: memoryDB.movies[idx] });
    }
  } catch (err) {
    console.error('Update Movie Error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};

// Delete Movie (Admin)
export const deleteMovie = async (req, res) => {
  try {
    const { id } = req.params;

    if (isMongoConnected()) {
      const movie = await Movie.findByIdAndDelete(id);
      if (!movie) {
        return res.status(404).json({ success: false, message: 'Movie not found' });
      }
      return res.json({ success: true, message: 'Movie deleted successfully' });
    } else {
      const idx = memoryDB.movies.findIndex(m => m._id === id);
      if (idx === -1) {
        return res.status(404).json({ success: false, message: 'Movie not found' });
      }
      memoryDB.movies.splice(idx, 1);
      return res.json({ success: true, message: 'Movie deleted successfully' });
    }
  } catch (err) {
    console.error('Delete Movie Error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};
