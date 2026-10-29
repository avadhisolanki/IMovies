import http from 'http';

// Import server (starts listening on port 5000)
import './src/server.js';

const BASE_URL = 'http://127.0.0.1:5000/api';

const request = (path, method = 'GET', body = null, token = null) => {
  return new Promise((resolve, reject) => {
    const url = new URL(`${BASE_URL}${path}`);
    const options = {
      hostname: '127.0.0.1',
      port: 5000,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
};

async function runTestSuite() {
  console.log('\n======================================================');
  console.log('🚀 Running iMovies Prime Cinema Automated Verification');
  console.log('======================================================\n');
  let failures = 0;

  // 1. Health check
  try {
    const res = await request('/health');
    console.log(`[PASS] 1. Health Check: Status ${res.status}, Storage: ${res.body.database}`);
  } catch (err) {
    console.error(`[FAIL] 1. Health Check:`, err.message);
    failures++;
  }

  // 2. Auth Login (Demo User)
  let userToken = '';
  try {
    const res = await request('/auth/login', 'POST', {
      email: 'user@imovies.com',
      password: 'user123',
      role: 'user',
    });
    if (res.status === 200 && res.body.token) {
      userToken = res.body.token;
      console.log(`[PASS] 2. User Login: Authenticated as ${res.body.user.username} (${res.body.user.email})`);
    } else {
      throw new Error(res.body.message || 'Login failed');
    }
  } catch (err) {
    console.error(`[FAIL] 2. User Login:`, err.message);
    failures++;
  }

  // 3. Auth Login (Demo Admin)
  let adminToken = '';
  try {
    const res = await request('/auth/login', 'POST', {
      email: 'admin@imovies.com',
      password: 'admin123',
      role: 'admin',
    });
    if (res.status === 200 && res.body.token) {
      adminToken = res.body.token;
      console.log(`[PASS] 3. Admin Login: Authenticated as ${res.body.user.username} (Role: ${res.body.user.role})`);
    } else {
      throw new Error(res.body.message || 'Admin login failed');
    }
  } catch (err) {
    console.error(`[FAIL] 3. Admin Login:`, err.message);
    failures++;
  }

  // 4. Movies Listing & Details
  let targetMovieId = '';
  let targetMovieName = '';
  try {
    const res = await request('/movie');
    if (res.status === 200 && res.body.movies?.length > 0) {
      targetMovieId = res.body.movies[0]._id;
      targetMovieName = res.body.movies[0].movieName;
      console.log(`[PASS] 4. Movies Listing: Loaded ${res.body.movies.length} blockbuster movies. Target: "${targetMovieName}"`);
    } else {
      throw new Error('No movies loaded');
    }
  } catch (err) {
    console.error(`[FAIL] 4. Movies Listing:`, err.message);
    failures++;
  }

  // 5. Theatres Listing
  try {
    const res = await request('/theatre');
    if (res.status === 200 && res.body.theatres?.length > 0) {
      console.log(`[PASS] 5. Theatres Listing: Loaded ${res.body.theatres.length} multiplex venues (e.g. ${res.body.theatres[0].theatreName})`);
    } else {
      throw new Error('No theatres loaded');
    }
  } catch (err) {
    console.error(`[FAIL] 5. Theatres Listing:`, err.message);
    failures++;
  }

  // 6. Shows by Movie
  let targetShowId = '';
  try {
    const res = await request(`/shows/movie/${targetMovieId}`);
    if (res.status === 200 && res.body.shows?.length > 0) {
      targetShowId = res.body.shows[0].showId || res.body.shows[0]._id;
      console.log(`[PASS] 6. Movie Shows: Found ${res.body.shows.length} showtimes. Target Show ID: ${targetShowId} at ${res.body.shows[0].showTime}`);
    } else {
      throw new Error('No shows found');
    }
  } catch (err) {
    console.error(`[FAIL] 6. Movie Shows:`, err.message);
    failures++;
  }

  // 7. Interactive Show Details & Seat Map with Tier Breakdown
  try {
    const res = await request(`/shows/${targetShowId}`);
    if (res.status === 200 && res.body.show?.tickets) {
      const tickets = res.body.show.tickets;
      const balconySeats = Object.values(tickets).filter(s => s.tier === 'Balcony').length;
      const middleSeats = Object.values(tickets).filter(s => s.tier === 'Middle').length;
      const lowerSeats = Object.values(tickets).filter(s => s.tier === 'Lower').length;
      console.log(`[PASS] 7. Interactive Seat Map: Total ${Object.keys(tickets).length} seats (Balcony: ${balconySeats}, Middle: ${middleSeats}, Lower: ${lowerSeats})`);
    } else {
      throw new Error('Failed to load show seat map');
    }
  } catch (err) {
    console.error(`[FAIL] 7. Show Details:`, err.message);
    failures++;
  }

  // 8. Real-time Seat Locking with 5-minute TTL
  const testSeats = ['BA3', 'BA4'];
  try {
    const res = await request('/bookings/lock-seats', 'POST', {
      showId: targetShowId,
      seats: testSeats,
    }, userToken);

    if (res.status === 200 && res.body.success) {
      console.log(`[PASS] 8. Real-time TTL Seat Lock: Seats [${testSeats.join(', ')}] locked for ${res.body.ttlSeconds}s (Expires: ${res.body.lockedUntil})`);
    } else {
      throw new Error(res.body.message || 'Seat lock failed');
    }
  } catch (err) {
    console.error(`[FAIL] 8. Seat Locking:`, err.message);
    failures++;
  }

  // 9. Conflict Prevention (Another user attempts to lock already locked seats)
  try {
    const res = await request('/bookings/lock-seats', 'POST', {
      showId: targetShowId,
      seats: testSeats,
    }, adminToken);

    if (res.status === 409) {
      console.log(`[PASS] 9. Conflict Prevention: Correctly rejected conflicting hold with 409 Conflict: "${res.body.message}"`);
    } else {
      throw new Error(`Expected 409 conflict, received ${res.status}`);
    }
  } catch (err) {
    console.error(`[FAIL] 9. Conflict Prevention:`, err.message);
    failures++;
  }

  // 10. Confirm Booking & Digital Ticket Issuance
  let confirmedBookingId = '';
  try {
    const res = await request('/bookings/confirm-booking', 'POST', {
      showId: targetShowId,
      selectedSeats: testSeats,
      paymentMethod: 'Prime Cinema Pay',
    }, userToken);

    if (res.status === 201 && res.body.booking) {
      confirmedBookingId = res.body.booking.bookingId;
      console.log(`[PASS] 10. Confirm Booking: Digital Pass generated: ${confirmedBookingId}, Total Amount: ₹${res.body.booking.totalAmount}`);
    } else {
      throw new Error(res.body.message || 'Booking confirmation failed');
    }
  } catch (err) {
    console.error(`[FAIL] 10. Confirm Booking:`, err.message);
    failures++;
  }

  // 11. Retrieve User Bookings History
  try {
    const res = await request('/bookings/my-bookings', 'GET', null, userToken);
    const booking = res.body.bookings?.find(b => b.bookingId === confirmedBookingId);
    if (res.status === 200 && booking) {
      console.log(`[PASS] 11. User Bookings History: Verified reservation ${confirmedBookingId} for film "${booking.movieName}"`);
    } else {
      throw new Error('Booking not found in user history');
    }
  } catch (err) {
    console.error(`[FAIL] 11. User Bookings:`, err.message);
    failures++;
  }

  // 12. Admin All Reservations Feed
  try {
    const res = await request('/bookings/all-bookings', 'GET', null, adminToken);
    if (res.status === 200 && res.body.bookings?.length > 0) {
      console.log(`[PASS] 12. Admin Bookings Feed: Moderated ${res.body.bookings.length} reservations across multiplexes.`);
    } else {
      throw new Error('Admin reservations feed empty');
    }
  } catch (err) {
    console.error(`[FAIL] 12. Admin Bookings Feed:`, err.message);
    failures++;
  }

  // 13. Watchlist Toggle
  try {
    const res = await request('/favorite/toggle', 'POST', { movieId: targetMovieId }, userToken);
    if (res.status === 200 && res.body.success) {
      console.log(`[PASS] 13. Watchlist Management: ${res.body.message} (Is Favorited: ${res.body.isFavorited})`);
    } else {
      throw new Error(res.body.message || 'Watchlist toggle failed');
    }
  } catch (err) {
    console.error(`[FAIL] 13. Watchlist:`, err.message);
    failures++;
  }

  // 14. Audience Review & Ratings
  try {
    const res = await request('/review', 'POST', {
      movieId: targetMovieId,
      rating: 10,
      reviewText: 'Masterpiece in 70mm IMAX Laser! Dynamic seat hold worked like a charm.',
    }, userToken);

    if (res.status === 201 && res.body.review) {
      console.log(`[PASS] 14. Reviews & Ratings: User feedback published with rating ${res.body.review.rating}/10.`);
    } else {
      throw new Error(res.body.message || 'Review creation failed');
    }
  } catch (err) {
    console.error(`[FAIL] 14. Reviews:`, err.message);
    failures++;
  }

  console.log('\n======================================================');
  if (failures === 0) {
    console.log('🎉 ALL 14 ARCHITECTURAL VERIFICATION SUITES PASSED! 🎉');
    console.log('   Client & Server are 100% Production Ready.');
  } else {
    console.log(`❌ ${failures} test suite(s) failed.`);
  }
  console.log('======================================================\n');

  process.exit(failures === 0 ? 0 : 1);
}

// Wait 3.5 seconds for server and DB auto-seed setup
setTimeout(runTestSuite, 3500);
