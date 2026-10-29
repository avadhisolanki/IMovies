import Show from '../models/showModel.js';
import Movie from '../models/movieModel.js';
import Theatre from '../models/theatreModel.js';
import { isMongoConnected } from '../config/db.js';
import { memoryDB } from '../config/memoryStore.js';
import { cleanExpiredLocksForShow } from '../utils/ttlCleaner.js';
import { generateSeatMap } from '../utils/seedData.js';

// Get shows for a movie (grouped by date/theatre)
export const getShowsByMovie = async (req, res) => {
  try {
    const { movieId } = req.params;
    const { date, movieName } = req.query;

    if (isMongoConnected()) {
      const query = { movieId };
      if (date) {
        const start = new Date(date);
        start.setHours(0, 0, 0, 0);
        const end = new Date(date);
        end.setHours(23, 59, 59, 999);
        query.showDate = { $gte: start, $lte: end };
      }

      let shows = await Show.find(query).sort({ showDate: 1, showTime: 1 });

      // If no shows exist for this TMDB / feature movie, dynamically auto-provision shows
      if (shows.length === 0) {
        const theatres = await Theatre.find({});
        if (theatres.length > 0) {
          const resolvedName = movieName || 'Theatrical Feature';
          const targetDate = date ? new Date(date) : new Date();
          const times = ['10:30 AM', '02:00 PM', '05:30 PM', '09:00 PM'];
          const newShows = [];

          theatres.forEach((theatre, tIdx) => {
            const selectedTimes = [times[tIdx % times.length], times[(tIdx + 2) % times.length]];
            selectedTimes.forEach((time) => {
              const showId = `show_${movieId}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
              newShows.push({
                adminEmail: 'admin@imovies.com',
                showId,
                movieId,
                movieName: resolvedName,
                theatreName: theatre.theatreName,
                location: theatre.location,
                showDate: targetDate,
                showTime: time,
                screenType: tIdx % 2 === 0 ? 'IMAX Laser 3D' : 'Dolby Atmos 4K',
                pricing: {
                  balcony: theatre.balconySeatPrice,
                  middle: theatre.middleSeatPrice,
                  lower: theatre.lowerSeatPrice,
                },
                tickets: generateSeatMap(theatre),
              });
            });
          });

          await Show.insertMany(newShows);
          shows = await Show.find(query).sort({ showDate: 1, showTime: 1 });
        }
      }

      // Clean expired locks
      for (const show of shows) {
        if (cleanExpiredLocksForShow(show)) {
          show.markModified('tickets');
          await show.save();
        }
      }

      return res.json({ success: true, count: shows.length, shows });
    } else {
      let filtered = memoryDB.shows.filter((s) => s.movieId === movieId);
      if (date) {
        const dateTarget = new Date(date).toISOString().split('T')[0];
        filtered = filtered.filter(
          (s) => new Date(s.showDate).toISOString().split('T')[0] === dateTarget
        );
      }

      // If no shows in memory store, auto-provision
      if (filtered.length === 0 && memoryDB.theatres.length > 0) {
        const times = ['10:30 AM', '02:00 PM', '05:30 PM', '09:00 PM'];
        const targetDate = date ? new Date(date) : new Date();
        const resolvedName = movieName || 'Theatrical Feature';

        memoryDB.theatres.forEach((theatre, tIdx) => {
          const selectedTimes = [times[tIdx % times.length], times[(tIdx + 2) % times.length]];
          selectedTimes.forEach((time) => {
            const sId = `show_${movieId}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
            const newShow = {
              _id: sId,
              adminEmail: 'admin@imovies.com',
              showId: sId,
              movieId,
              movieName: resolvedName,
              theatreName: theatre.theatreName,
              location: theatre.location,
              showDate: targetDate,
              showTime: time,
              screenType: tIdx % 2 === 0 ? 'IMAX Laser 3D' : 'Dolby Atmos 4K',
              pricing: {
                balcony: theatre.balconySeatPrice,
                middle: theatre.middleSeatPrice,
                lower: theatre.lowerSeatPrice,
              },
              tickets: generateSeatMap(theatre),
              createdAt: new Date(),
            };
            memoryDB.shows.push(newShow);
            filtered.push(newShow);
          });
        });
      }

      filtered.forEach((s) => cleanExpiredLocksForShow(s));
      return res.json({ success: true, count: filtered.length, shows: filtered });
    }
  } catch (err) {
    console.error('Get Shows By Movie Error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};

// Get Single Show Details (for the interactive seat slug page)
export const getShowById = async (req, res) => {
  try {
    const { showId } = req.params;

    if (isMongoConnected()) {
      let show = await Show.findOne({
        $or: [{ showId }, { _id: showId.match(/^[0-9a-fA-F]{24}$/) ? showId : null }],
      });
      if (!show) {
        return res.status(404).json({ success: false, message: 'Show not found' });
      }

      if (cleanExpiredLocksForShow(show)) {
        show.markModified('tickets');
        await show.save();
      }

      let movie = null;
      if (show.movieId && show.movieId.match(/^[0-9a-fA-F]{24}$/)) {
        movie = await Movie.findById(show.movieId);
      }
      if (!movie) {
        movie = {
          _id: show.movieId,
          id: show.movieId,
          movieName: show.movieName || 'Theatrical Feature',
          title: show.movieName || 'Theatrical Feature',
          duration: '150 min',
        };
      }

      return res.json({
        success: true,
        show,
        movie,
      });
    } else {
      const show = memoryDB.shows.find((s) => s.showId === showId || s._id === showId);
      if (!show) {
        return res.status(404).json({ success: false, message: 'Show not found' });
      }

      cleanExpiredLocksForShow(show);
      let movie = memoryDB.movies.find((m) => m._id === show.movieId);
      if (!movie) {
        movie = {
          _id: show.movieId,
          id: show.movieId,
          movieName: show.movieName || 'Theatrical Feature',
          title: show.movieName || 'Theatrical Feature',
          duration: '150 min',
        };
      }

      return res.json({
        success: true,
        show,
        movie,
      });
    }
  } catch (err) {
    console.error('Get Show By ID Error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};

// Create Show (Admin)
export const createShow = async (req, res) => {
  try {
    const { movieId, theatreName, showDate, showTime, screenType } = req.body;
    const adminEmail = req.user?.email || 'admin@imovies.com';

    if (!movieId || !theatreName || !showDate || !showTime) {
      return res.status(400).json({ success: false, message: 'All show fields are required' });
    }

    let movieObj = null;
    let theatreObj = null;

    if (isMongoConnected()) {
      movieObj = await Movie.findById(movieId);
      theatreObj = await Theatre.findOne({ theatreName });
    } else {
      movieObj = memoryDB.movies.find(m => m._id === movieId);
      theatreObj = memoryDB.theatres.find(t => t.theatreName === theatreName);
    }

    if (!theatreObj) {
      theatreObj = {
        theatreName,
        location: 'City Centre Screen 1',
        balconySeatPrice: 350,
        middleSeatPrice: 250,
        lowerSeatPrice: 150,
        balconySeats: { rows: 2, cols: 10, prefix: 'B' },
        middleSeats: { rows: 3, cols: 10, prefix: 'M' },
        lowerSeats: { rows: 2, cols: 10, prefix: 'L' },
      };
    }

    const showId = `show_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const tickets = generateSeatMap(theatreObj);

    const showData = {
      adminEmail,
      showId,
      movieId,
      movieName: movieObj ? movieObj.movieName : 'Movie',
      theatreName: theatreObj.theatreName,
      location: theatreObj.location,
      showDate: new Date(showDate),
      showTime,
      screenType: screenType || 'IMAX Laser 3D',
      pricing: {
        balcony: theatreObj.balconySeatPrice,
        middle: theatreObj.middleSeatPrice,
        lower: theatreObj.lowerSeatPrice,
      },
      tickets,
    };

    if (isMongoConnected()) {
      const newShow = await Show.create(showData);
      return res.status(201).json({ success: true, message: 'Show scheduled successfully!', show: newShow });
    } else {
      const newShow = {
        _id: showId,
        ...showData,
        createdAt: new Date(),
      };
      memoryDB.shows.push(newShow);
      return res.status(201).json({ success: true, message: 'Show scheduled successfully!', show: newShow });
    }
  } catch (err) {
    console.error('Create Show Error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};

// Delete Show (Admin)
export const deleteShow = async (req, res) => {
  try {
    const { id } = req.params;

    if (isMongoConnected()) {
      await Show.findOneAndDelete({ $or: [{ showId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }] });
      return res.json({ success: true, message: 'Show cancelled and deleted successfully' });
    } else {
      const idx = memoryDB.shows.findIndex(s => s.showId === id || s._id === id);
      if (idx !== -1) {
        memoryDB.shows.splice(idx, 1);
      }
      return res.json({ success: true, message: 'Show cancelled and deleted successfully' });
    }
  } catch (err) {
    console.error('Delete Show Error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};
