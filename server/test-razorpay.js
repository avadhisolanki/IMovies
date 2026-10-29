import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 5000;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const JWT_SECRET = process.env.JWT_SECRET || 'imovies_super_secret_jwt_key_2026';
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || '';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';

const testUser = {
  id: 'usr_test_123',
  email: 'prime_tester@imovies.com',
  username: 'PrimeTester',
  role: 'user',
};

const authToken = jwt.sign(testUser, JWT_SECRET, { expiresIn: '1h' });

async function runPaymentSuite() {
  console.log('====================================================');
  console.log('🚀 Running iMovies Razorpay Payment Gateway Test Suite');
  console.log('====================================================');

  try {
    // 1. Check health
    console.log(`\n1. Checking Health Check at ${BASE_URL}/api/health...`);
    const healthRes = await fetch(`${BASE_URL}/api/health`);
    const healthData = await healthRes.json();
    console.log('✓ Health Response:', healthData);

    // 2. Fetch movies and shows to test against
    console.log('\n2. Fetching available movies and shows...');
    const moviesRes = await fetch(`${BASE_URL}/api/movie`);
    const moviesData = await moviesRes.json();
    if (!moviesData.movies || moviesData.movies.length === 0) {
      throw new Error('No movies available to test');
    }
    const targetMovie = moviesData.movies[0];
    const movieId = targetMovie._id || targetMovie.movieId;
    console.log(`✓ Using movie: ${targetMovie.movieName} (${movieId})`);

    const showsRes = await fetch(`${BASE_URL}/api/shows/movie/${movieId}`);
    const showsData = await showsRes.json();
    if (!showsData.shows || showsData.shows.length === 0) {
      throw new Error('No shows available for movie');
    }
    const targetShow = showsData.shows[0];
    const showId = targetShow.showId || targetShow._id;
    console.log(`✓ Using show: ${showId} (${targetShow.movieName} at ${targetShow.theatreName})`);

    // Pick two available seats
    const seatKeys = Object.keys(targetShow.tickets || {});
    const availableSeats = seatKeys.filter((k) => targetShow.tickets[k].status === 'available');
    if (availableSeats.length < 2) {
      throw new Error('Not enough available seats in target show to test');
    }
    const testSeats = [availableSeats[0], availableSeats[1]];
    console.log(`✓ Test seats selected: ${testSeats.join(', ')}`);

    // Lock the seats first via seat lock endpoint
    console.log('\n3. Locking seats for checkout test...');
    const lockRes = await fetch(`${BASE_URL}/api/bookings/lock-seats`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        showId,
        seats: testSeats,
      }),
    });
    const lockData = await lockRes.json();
    console.log(`✓ Lock response status: ${lockRes.status}`, lockData.message || '');

    // 4. Test POST /api/payment/create-order
    console.log('\n4. Testing POST /api/payment/create-order...');
    const createOrderRes = await fetch(`${BASE_URL}/api/payment/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        amount: 520, // INR
        showId,
        selectedSeats: testSeats,
        userEmail: testUser.email,
      }),
    });

    const orderData = await createOrderRes.json();
    console.log('Order creation response:', orderData);

    if (!orderData.success || !orderData.order_id) {
      throw new Error(`Failed to create Razorpay order: ${JSON.stringify(orderData)}`);
    }

    if (orderData.amount !== 52000) {
      throw new Error(`Expected amount in paise (52000), got ${orderData.amount}`);
    }

    if (orderData.key_id !== RAZORPAY_KEY_ID) {
      throw new Error(`Key mismatch: expected ${RAZORPAY_KEY_ID}, got ${orderData.key_id}`);
    }

    console.log(`✓ Razorpay Order Created Successfully: ${orderData.order_id} (Paise: ${orderData.amount})`);

    // 5. Test Invalid Signature rejection in POST /api/payment/verify
    console.log('\n5. Testing invalid signature rejection in POST /api/payment/verify...');
    const invalidVerifyRes = await fetch(`${BASE_URL}/api/payment/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        razorpay_order_id: orderData.order_id,
        razorpay_payment_id: 'pay_test_dummy_invalid',
        razorpay_signature: 'invalid_sha256_hash_tampered',
        amount: 520,
        bookingDetails: {
          showId,
          selectedSeats: testSeats,
          userEmail: testUser.email,
          movieName: targetShow.movieName,
          theatreName: targetShow.theatreName,
        },
      }),
    });

    const invalidVerifyData = await invalidVerifyRes.json();
    console.log(`✓ Invalid signature rejected with status ${invalidVerifyRes.status}:`, invalidVerifyData.message);
    if (invalidVerifyRes.status !== 400) {
      throw new Error(`Expected 400 Bad Request for tampered signature, got ${invalidVerifyRes.status}`);
    }

    // 6. Test Valid HMAC SHA256 Signature verification in POST /api/payment/verify
    console.log('\n6. Testing valid HMAC SHA256 signature verification in POST /api/payment/verify...');
    const fakePaymentId = `pay_${Date.now().toString().slice(-8)}_${Math.random().toString(36).substring(2, 6)}`;
    const hmacPayload = `${orderData.order_id}|${fakePaymentId}`;
    const validSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(hmacPayload)
      .digest('hex');

    console.log(`Generated authentic signature for payload "${hmacPayload}": ${validSignature.substring(0, 16)}...`);

    const validVerifyRes = await fetch(`${BASE_URL}/api/payment/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        razorpay_order_id: orderData.order_id,
        razorpay_payment_id: fakePaymentId,
        razorpay_signature: validSignature,
        amount: 520,
        bookingDetails: {
          showId,
          selectedSeats: testSeats,
          userEmail: testUser.email,
          movieName: targetShow.movieName,
          theatreName: targetShow.theatreName,
          location: targetShow.location,
          showDate: targetShow.showDate,
          showTime: targetShow.showTime,
          totalAmount: 520,
        },
      }),
    });

    const validVerifyData = await validVerifyRes.json();
    console.log(`✓ Verification response status ${validVerifyRes.status}:`, validVerifyData.message);

    if (!validVerifyData.success || !validVerifyData.booking) {
      throw new Error(`Payment verification failed: ${JSON.stringify(validVerifyData)}`);
    }

    console.log('✓ Booking created successfully:', {
      bookingId: validVerifyData.booking.bookingId,
      status: validVerifyData.booking.paymentStatus,
      method: validVerifyData.booking.paymentMethod,
      razorpayOrderId: validVerifyData.booking.razorpayOrderId,
      razorpayPaymentId: validVerifyData.booking.razorpayPaymentId,
      seats: validVerifyData.booking.selectedSeats,
    });

    // 7. Verify Show tickets state updated to 'booked'
    console.log('\n7. Verifying show ticket statuses updated to "booked"...');
    const updatedShowRes = await fetch(`${BASE_URL}/api/shows/${showId}`);
    const updatedShowData = await updatedShowRes.json();
    for (const seatId of testSeats) {
      const seat = updatedShowData.show.tickets[seatId];
      if (seat.status !== 'booked') {
        throw new Error(`Seat ${seatId} was expected to be "booked", but is "${seat.status}"`);
      }
      console.log(`✓ Seat ${seatId} status confirmed: "booked"`);
    }

    console.log('\n====================================================');
    console.log('🎉 ALL RAZORPAY PAYMENT TESTS PASSED WITH 100% SUCCESS!');
    console.log('====================================================');
  } catch (err) {
    console.error('❌ Payment Test Suite Error:', err);
    process.exit(1);
  }
}

runPaymentSuite();
