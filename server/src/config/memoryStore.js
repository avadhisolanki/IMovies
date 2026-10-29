import bcrypt from 'bcryptjs';
import { seedMovies, seedTheatres, generateSeatMap } from '../utils/seedData.js';

// In-Memory store keeping data alive for the runtime session
class MemoryDB {
  constructor() {
    this.users = [];
    this.admins = [];
    this.movies = [];
    this.theatres = [];
    this.shows = [];
    this.bookings = [];
    this.favorites = [];
    this.reviews = [];
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;

    // Default admin
    const adminHashed = await bcrypt.hash('admin123', 10);
    this.admins.push({
      _id: 'admin_1',
      username: 'primeadmin',
      email: 'admin@imovies.com',
      password: adminHashed,
      role: 'admin',
      createdAt: new Date(),
    });

    // Default user
    const userHashed = await bcrypt.hash('user123', 10);
    this.users.push({
      _id: 'user_1',
      username: 'primeviewer',
      email: 'user@imovies.com',
      password: userHashed,
      role: 'user',
      createdAt: new Date(),
    });

    // Seed Theatres
    seedTheatres.forEach((th, idx) => {
      this.theatres.push({
        _id: `theatre_${idx + 1}`,
        ...th,
        createdAt: new Date(),
      });
    });

    // Seed Movies
    seedMovies.forEach((mov, idx) => {
      this.movies.push({
        _id: `movie_${idx + 1}`,
        ...mov,
        createdAt: new Date(),
      });
    });

    // Seed Shows (create shows for the next 4 days across theatres for seeded movies)
    const times = ['10:30 AM', '02:00 PM', '05:30 PM', '09:00 PM'];
    let showCounter = 1;

    for (let dayOffset = 0; dayOffset < 4; dayOffset++) {
      const showDate = new Date();
      showDate.setDate(showDate.getDate() + dayOffset);
      const dateStr = showDate.toISOString().split('T')[0];

      // Schedule top movies in theatres
      this.movies.forEach((movie, mIdx) => {
        const theatre = this.theatres[mIdx % this.theatres.length];
        // 2 showtimes per movie per day
        const selectedTimes = [times[mIdx % times.length], times[(mIdx + 2) % times.length]];
        
        selectedTimes.forEach((time) => {
          const sId = `show_${showCounter++}`;
          this.shows.push({
            _id: sId,
            adminEmail: 'admin@imovies.com',
            showId: sId,
            movieId: movie._id,
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
            createdAt: new Date(),
          });
        });
      });
    }

    // Seed sample reviews
    this.reviews.push({
      _id: 'rev_1',
      movieId: 'movie_1',
      userEmail: 'user@imovies.com',
      userName: 'Christopher Fan',
      rating: 10,
      reviewText: 'Hans Zimmer score and the visuals in IMAX are unmatched. Truly breathtaking cinema!',
      createdAt: new Date(Date.now() - 3600000 * 24),
    });

    this.reviews.push({
      _id: 'rev_2',
      movieId: 'movie_2',
      userEmail: 'cinephile@imovies.com',
      userName: 'Arrakis Traveler',
      rating: 9,
      reviewText: 'Denis Villeneuve has crafted a timeless masterpiece. The sound design shakes the entire theatre!',
      createdAt: new Date(Date.now() - 3600000 * 12),
    });

    this.initialized = true;
    console.log(`[iMovies Fallback Store] Initialized with ${this.movies.length} movies, ${this.theatres.length} theatres, and ${this.shows.length} shows!`);
  }
}

export const memoryDB = new MemoryDB();
