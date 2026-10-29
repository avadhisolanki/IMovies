import express from 'express';
import Movie from '../models/movieModel.js';
import Theatre from '../models/theatreModel.js';
import Show from '../models/showModel.js';
import { isMongoConnected } from '../config/db.js';
import { memoryDB } from '../config/memoryStore.js';
import { seedMovies, seedTheatres, generateSeatMap } from '../utils/seedData.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    if (isMongoConnected()) {
      await Movie.deleteMany({});
      await Theatre.deleteMany({});
      await Show.deleteMany({});

      const createdTheatres = await Theatre.insertMany(seedTheatres);
      const createdMovies = await Movie.insertMany(seedMovies);

      // Create shows for MongoDB
      const times = ['10:30 AM', '02:00 PM', '05:30 PM', '09:00 PM'];
      const showsToInsert = [];
      let counter = 1;

      for (let dayOffset = 0; dayOffset < 4; dayOffset++) {
        const showDate = new Date();
        showDate.setDate(showDate.getDate() + dayOffset);
        const dateStr = showDate.toISOString().split('T')[0];

        createdMovies.forEach((movie, mIdx) => {
          const theatre = createdTheatres[mIdx % createdTheatres.length];
          const selectedTimes = [times[mIdx % times.length], times[(mIdx + 2) % times.length]];

          selectedTimes.forEach(time => {
            showsToInsert.push({
              adminEmail: 'admin@imovies.com',
              showId: `show_${counter++}`,
              movieId: movie._id.toString(),
              movieName: movie.movieName,
              theatreName: theatre.theatreName,
              location: theatre.location,
              showDate: new Date(dateStr),
              showTime: time,
              screenType: mIdx % 2 === 0 ? 'IMAX Laser 3D' : 'Dolby Atmos 4K',
              pricing: {
                balcony: theatre.balconySeatPrice,
                middle: theatre.middleSeatPrice,
                lower: theatre.lowerSeatPrice,
              },
              tickets: generateSeatMap(theatre),
            });
          });
        });
      }

      await Show.insertMany(showsToInsert);

      return res.json({
        success: true,
        message: `Catalog seeded into MongoDB: ${createdMovies.length} movies, ${createdTheatres.length} theatres, ${showsToInsert.length} shows.`,
      });
    } else {
      memoryDB.initialized = false;
      memoryDB.movies = [];
      memoryDB.theatres = [];
      memoryDB.shows = [];
      await memoryDB.init();

      return res.json({
        success: true,
        message: `Catalog seeded into In-Memory store: ${memoryDB.movies.length} movies, ${memoryDB.theatres.length} theatres, ${memoryDB.shows.length} shows.`,
      });
    }
  } catch (err) {
    console.error('Seed Error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Seed failed' });
  }
});

export default router;
