import http from 'http';

const BASE_URL = 'http://localhost:5000/api';

const request = (path, method = 'GET', body = null, token = null) => {
  return new Promise((resolve, reject) => {
    const url = new URL(`${BASE_URL}${path}`);
    const options = {
      hostname: url.hostname,
      port: url.port,
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

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
};

async function runTestSuite() {
  console.log('--- Starting iMovies End-to-End API Test Suite ---');
  let failures = 0;

  // 1. Health check
  try {
    const res = await request('/health');
    console.log(`[PASS] Health Check: Status ${res.status}, Engine: ${res.body.database}`);
  } catch (err) {
    console.error(`[FAIL] Health Check:`, err.message);
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
      console.log(`[PASS] User Login: Successfully logged in as ${res.body.user.username}`);
    } else {
      throw new Error(res.body.message);
    }
  } catch (err) {
    console.error(`[FAIL] User Login:`, err.message);
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
      console.log(`[PASS] Admin Login: Successfully logged in as ${res.body.user.username} (role: ${res.body.user.role})`);
    } else {
      throw new Error(res.body.message);
    }
  } catch (err) {
    console.error(`[FAIL] Admin Login:`, err.message);
    failures++;
  }

  // 4. Movies Listing & Details
  let targetMovieId = '';
  try {
    const res = await request('/movie');
    if (res.status === 200 && res.body.movies.length > 0) {
      targetMovieId = res.body.movies[0]._id;
      console.log(`[PASS] Movies List: Found ${res.body.movies.length} movies. Target: "${res.body.movies[0].movieName}"`);
    } else {
      throw new Error('No movies found');
    }
  } catch (err) {
    console.error(`[FAIL] Movies List:`, err.message);
    failures++;
  }

  // 5. Shows Listing for Movie
  let targetShowId = '';
  try {
    const res = await request(`/shows/movie/${targetMovieId}`);
    if (res.status === 200 && res.body.shows.length > 0) {
      targetShowId = res.body.shows[0].showId || res.body.shows[0]._id;
      console.log(`[PASS] Shows by Movie: Found ${res.body.shows.length} scheduled showtimes. Target show: ${targetShowId}`);
    } else {
      throw new Error('No shows found for target movie');
    }
  } catch (err) {
    console.error(`[FAIL] Shows by Movie:`, err.message);
    failures++;
  }

  // 6. Interactive Show Details & Seat Map
  try {
    const res = await request(`/shows/${targetShowId}`);
    if (res.status === 200 && res.body.show?.tickets) {
      const totalSeats = Object.keys(res.body.show.tickets).length;
      console.log(`[PASS] Seat Map Layout: Show loaded with ${totalSeats} total tier-based seats.`);
    } else {
      throw new Error('Invalid show or tickets map');
    }
  } catch (err) {
    console.error(`[FAIL] Show Seat Map:`, err.message);
    failures++;
  }

  // 7. Real-Time Seat Locking with 5-minute TTL
  const testSeats = ['BA1', 'BA2'];
  try {
    const res = await request('/bookings/lock-seats', 'POST', { showId: targetShowId, seats: testSeats }, userToken);
    if (res.status === 200 && res.body.success) {
      console.log(`[PASS] Seat Locking: Seats [${testSeats.join(', ')}] locked for ${res.body.ttlSeconds}s TTL. Expiry: ${res.body.lockedUntil}`);
    } else {
      throw new Error(res.body.message);
    }
  } catch (err) {
    console.error(`[FAIL] Seat Locking:`, err.message);
    failures++;
  }

  // 8. Conflict Detection (Another user trying to lock same seats)
  try {
    // Admin trying to lock the same seats that user currently holds
    const res = await request('/bookings/lock-seats', 'POST', { showId: targetShowId, seats: testSeats }, adminToken);
    if (res.status === 409) {
      console.log(`[PASS] Lock Conflict Prevention: Correctly prevented conflicting lock (409 Conflict: ${res.body.message})`);
    } else {
      throw new Error(`Expected 409 conflict, got ${res.status}`);
    }
  } catch (err) {
    console.error(`[FAIL] Lock Conflict Prevention:`, err.message);
    failures++;
  }

  // 9. Confirm Booking (Converts locked seats to booked and generates Digital Pass)
  let confirmedBookingId = '';
  try {
    const res = await request('/bookings/confirm-booking', 'POST', {
      showId: targetShowId,
      selectedSeats: testSeats,
      paymentMethod: 'Prime Cinema Pay',
    }, userToken);

    if (res.status === 201 && res.body.booking) {
      confirmedBookingId = res.body.booking.bookingId;
      console.log(`[PASS] Booking Confirmation: Digital Ticket Pass created with ID: ${confirmedBookingId}, Amount: ₹${res.body.booking.totalAmount}`);
    } else {
      throw new Error(res.body.message);
    }
  } catch (err) {
    console.error(`[FAIL] Booking Confirmation:`, err.message);
    failures++;
  }

  // 10. Verify User Bookings List
  try {
    const res = await request('/bookings/my-bookings', 'GET', null, userToken);
    const hasBooking = res.body.bookings?.some((b) => b.bookingId === confirmedBookingId);
    if (res.status === 200 && hasBooking) {
      console.log(`[PASS] User Bookings History: Verified ${confirmedBookingId} in user's reservation history.`);
    } else {
      throw new Error('Confirmed booking not found in history');
    }
  } catch (err) {
    console.error(`[FAIL] User Bookings History:`, err.message);
    failures++;
  }

  // 11. Watchlist Toggle
  try {
    const res = await request('/favorite/toggle', 'POST', { movieId: targetMovieId }, userToken);
    if (res.status === 200) {
      console.log(`[PASS] Watchlist Toggle: ${res.body.message} (isFavorited: ${res.body.isFavorited})`);
    } else {
      throw new Error(res.body.message);
    }
  } catch (err) {
    console.error(`[FAIL] Watchlist Toggle:`, err.message);
    failures++;
  }

  // 12. Reviews & Feedback
  try {
    const res = await request('/review', 'POST', {
      movieId: targetMovieId,
      rating: 10,
      reviewText: 'Incredible IMAX audio and visual immersion! Seat locking was super smooth.',
    }, userToken);
    if (res.status === 201) {
      console.log(`[PASS] Review Submission: Successfully posted audience review for movie.`);
    } else {
      throw new Error(res.body.message);
    }
  } catch (err) {
    console.error(`[FAIL] Review Submission:`, err.message);
    failures++;
  }

  console.log('----------------------------------------------------');
  if (failures === 0) {
    console.log('🏆 ALL 12 TEST SUITES PASSED FLAWLESSLY! 🏆');
  } else {
    console.log(`❌ ${failures} test suite(s) encountered issues.`);
  }
}

// Allow slight delay if starting together
setTimeout(runTestSuite, 1500);
