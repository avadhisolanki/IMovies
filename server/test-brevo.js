import dotenv from 'dotenv';
dotenv.config();

const PORT = process.env.PORT || 5000;
const BASE_URL = `http://127.0.0.1:${PORT}`;

async function runBrevoTestSuite() {
  console.log('====================================================');
  console.log('🚀 Running Brevo Transactional Email Integration Test');
  console.log('====================================================');

  try {
    // 1. Health check & status
    console.log('\n1. Checking Brevo status endpoint...');
    const statusRes = await fetch(`${BASE_URL}/api/email/status`);
    const statusData = await statusRes.json();
    console.log('✓ Brevo Status:', statusData);

    // 2. Test transactional email dispatch
    console.log('\n2. Testing POST /api/email/send-test to sender address...');
    const testEmailRes = await fetch(`${BASE_URL}/api/email/send-test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: statusData.senderEmail || 'en24cs3010865@medicaps.ac.in' }),
    });
    const testEmailData = await testEmailRes.json();
    console.log(`✓ Send Test Result:`, testEmailData);
    if (!testEmailData.success) {
      throw new Error(`Test email failed: ${testEmailData.message}`);
    }

    // 3. User Registration with Mandatory Email Verification
    const randomUserNum = Math.floor(1000 + Math.random() * 9000);
    const testEmail = `testuser_${randomUserNum}@medicaps.ac.in`;
    const testUsername = `PrimeUser${randomUserNum}`;
    const testPassword = 'Password@123';

    console.log(`\n3. Testing User Registration flow for ${testEmail}...`);
    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: testUsername,
        email: testEmail,
        password: testPassword,
      }),
    });
    const regData = await regRes.json();
    console.log(`✓ Registration Response:`, regData);
    if (!regData.success || !regData.requiresVerification) {
      throw new Error(`Registration failed to require email verification: ${JSON.stringify(regData)}`);
    }

    // 4. Try logging in before verification (MUST BE REJECTED!)
    console.log('\n4. Verifying that unverified user CANNOT log in...');
    const preVerifyLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
      }),
    });
    const preVerifyLoginData = await preVerifyLoginRes.json();
    console.log(`✓ Unverified login rejected with status ${preVerifyLoginRes.status}:`, preVerifyLoginData.message);
    if (preVerifyLoginRes.status !== 403 || !preVerifyLoginData.isUnverified) {
      throw new Error(`Expected 403 unverified rejection, got ${preVerifyLoginRes.status}`);
    }

    // 5. Test Password Recovery Email
    console.log('\n5. Testing Forgot Password flow...');
    const forgotRes = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail }),
    });
    const forgotData = await forgotRes.json();
    console.log('✓ Forgot Password Response:', forgotData);
    if (!forgotData.success) {
      throw new Error(`Forgot password failed: ${forgotData.message}`);
    }

    // 6. Test Digital Ticket Confirmation Email Dispatch
    console.log('\n6. Testing Digital Cinema Ticket Email Pass dispatch...');
    const ticketRes = await fetch(`${BASE_URL}/api/email/send-confirmation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: statusData.senderEmail || 'en24cs3010865@medicaps.ac.in',
        bookingDetails: {
          bookingId: `PRIME-${Date.now().toString().slice(-6)}-VIP`,
          movieName: 'Oppenheimer (70mm IMAX)',
          theatreName: 'Miraj IMAX Forum',
          location: 'Audi 1, Premium Floor',
          showDate: new Date(),
          showTime: '08:00 PM',
          selectedSeats: ['B1', 'B2'],
          totalAmount: 640,
          paymentMethod: 'Razorpay',
        },
      }),
    });
    const ticketData = await ticketRes.json();
    console.log('✓ Digital Ticket Confirmation Result:', ticketData);
    if (!ticketData.success) {
      throw new Error(`Ticket confirmation email failed: ${ticketData.message}`);
    }

    console.log('\n====================================================');
    console.log('🎉 ALL BREVO TRANSACTIONAL EMAIL TESTS PASSED 100%!');
    console.log('====================================================');
  } catch (err) {
    console.error('❌ Brevo Test Suite Error:', err);
    process.exit(1);
  }
}

runBrevoTestSuite();
