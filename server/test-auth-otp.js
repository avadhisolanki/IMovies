import mongoose from 'mongoose';
import User from './src/models/userModel.js';
import dotenv from 'dotenv';
dotenv.config();

const BASE_URL = 'http://127.0.0.1:5000';

async function testFullAuthLifecycle() {
  console.log('\n====================================================');
  console.log('🧪 Testing Full Email OTP Verification & Login Loop');
  console.log('====================================================');

  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/imovies');

  const random = Math.floor(1000 + Math.random() * 9000);
  const testEmail = `verified_user_${random}@medicaps.ac.in`;
  const testPassword = 'Password@123';

  // 1. Register User
  console.log(`\n1. Registering user: ${testEmail}...`);
  const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: `VerUser${random}`,
      email: testEmail,
      password: testPassword,
    }),
  });
  const regData = await regRes.json();
  console.log('✓ Register response:', regData.message);

  // 2. Fetch OTP from MongoDB
  const dbUser = await User.findOne({ email: testEmail });
  if (!dbUser || !dbUser.verificationOTP) {
    throw new Error('User or OTP not found in DB');
  }
  console.log(`✓ Generated OTP in DB: ${dbUser.verificationOTP}`);

  // 3. Submit wrong OTP (expect 400 rejection)
  console.log('\n2. Testing incorrect OTP rejection...');
  const badOtpRes = await fetch(`${BASE_URL}/api/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, otp: '000000' }),
  });
  const badOtpData = await badOtpRes.json();
  console.log(`✓ Incorrect OTP rejected (${badOtpRes.status}):`, badOtpData.message);
  if (badOtpRes.status !== 400) throw new Error('Expected 400 rejection');

  // 4. Submit correct OTP
  console.log('\n3. Testing valid OTP verification...');
  const goodOtpRes = await fetch(`${BASE_URL}/api/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, otp: dbUser.verificationOTP }),
  });
  const goodOtpData = await goodOtpRes.json();
  console.log(`✓ Verification response (${goodOtpRes.status}):`, goodOtpData.message);
  if (!goodOtpData.success || !goodOtpData.token) {
    throw new Error('Verification failed to return token');
  }

  // 5. User should now log in successfully!
  console.log('\n4. Verifying that activated user can log in normally...');
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password: testPassword }),
  });
  const loginData = await loginRes.json();
  console.log(`✓ Login success (${loginRes.status}):`, loginData.message);
  if (!loginData.success || !loginData.token) {
    throw new Error('Verified user login failed');
  }

  // 6. Test Forgot Password & Reset
  console.log('\n5. Testing Forgot Password with OTP...');
  await fetch(`${BASE_URL}/api/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail }),
  });

  const updatedDbUser = await User.findOne({ email: testEmail });
  console.log(`✓ Reset OTP generated: ${updatedDbUser.resetPasswordOTP}`);

  const resetRes = await fetch(`${BASE_URL}/api/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      otp: updatedDbUser.resetPasswordOTP,
      newPassword: 'NewPassword@456',
    }),
  });
  const resetData = await resetRes.json();
  console.log(`✓ Password reset result (${resetRes.status}):`, resetData.message);
  if (!resetData.success) throw new Error('Password reset failed');

  // 7. Login with new password
  console.log('\n6. Logging in with new password...');
  const newLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password: 'NewPassword@456' }),
  });
  const newLoginData = await newLoginRes.json();
  console.log(`✓ New password login (${newLoginRes.status}):`, newLoginData.message);
  if (!newLoginData.success) throw new Error('Login with new password failed');

  console.log('\n====================================================');
  console.log('🎉 FULL AUTHENTICATION & OTP LIFECYCLE 100% VERIFIED!');
  console.log('====================================================');

  await mongoose.disconnect();
  process.exit(0);
}

testFullAuthLifecycle().catch((err) => {
  console.error('Lifecycle test error:', err);
  process.exit(1);
});
