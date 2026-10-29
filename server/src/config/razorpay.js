import Razorpay from 'razorpay';
import dotenv from 'dotenv';
dotenv.config();

export const razorpayKeyId = process.env.RAZORPAY_KEY_ID || '';
export const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || '';

export const razorpay = new Razorpay({
  key_id: razorpayKeyId,
  key_secret: razorpayKeySecret,
});
