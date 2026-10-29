import bcrypt from 'bcryptjs';
import User from '../models/userModel.js';
import Admin from '../models/adminModel.js';
import Movie from '../models/movieModel.js';
import Theatre from '../models/theatreModel.js';
import Show from '../models/showModel.js';
import Review from '../models/reviewModel.js';
import { seedMovies, seedTheatres, generateSeatMap } from './seedData.js';

export const autoSeedMongoDB = async () => {
  try {
    const movieCount = await Movie.countDocuments();
    if (movieCount > 0) {
      console.log(`[iMovies DB] MongoDB already contains ${movieCount} movies. Ready!`);
      return;
    }

    console.log('[iMovies DB] Empty database detected. Seeding initial Prime Blockbusters into MongoDB...');

    // 1. Seed Demo Admin & User
    const adminPass = await bcrypt.hash('admin123', 10);
    const userPass = await bcrypt.hash('user123', 10);

    await Admin.create({
      username: 'primeadmin',
      email: 'admin@imovies.com',
      password: adminPass,
      role: 'admin',
    });

    await User.create({
      username: 'primeviewer',
      email: 'user@imovies.com',
      password: userPass,
      role: 'user',
    });

    // 2. Seed Theatres
    const createdTheatres = await Theatre.insertMany(seedTheatres);

    // 3. Seed Movies
    const createdMovies = await Movie.insertMany(seedMovies);

    // 4. Seed Shows
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

        selectedTimes.forEach((time) => {
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

    // 5. Seed Reviews
    await Review.create({
      movieId: createdMovies[0]._id.toString(),
      userEmail: 'user@imovies.com',
      userName: 'Christopher Fan',
      rating: 10,
      reviewText: 'Hans Zimmer score and the visuals in IMAX are unmatched. Truly breathtaking cinema!',
    });

    console.log(`[iMovies DB] Successfully seeded MongoDB with ${createdMovies.length} movies, ${createdTheatres.length} theatres, and ${showsToInsert.length} shows!`);
  } catch (err) {
    console.error('[iMovies DB Seed Error]', err);
  }
};
