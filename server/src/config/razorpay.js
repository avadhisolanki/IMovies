import Razorpay from 'razorpay';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export const razorpayKeyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder';
export const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder';

export let razorpay;
try {
  razorpay = new Razorpay({
    key_id: razorpayKeyId,
    key_secret: razorpayKeySecret,
  });
} catch (err) {
  console.warn('[Razorpay Config Warning]:', err.message);
}

export default razorpay;
