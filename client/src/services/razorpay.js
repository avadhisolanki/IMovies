import api from './api';
import { toast } from 'react-toastify';

const RAZORPAY_SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js';

// Dynamic script loader for Razorpay Checkout SDK
export const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = RAZORPAY_SCRIPT_URL;
    script.async = true;
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      console.error('Failed to load Razorpay Checkout SDK script.');
      resolve(false);
    };

    document.body.appendChild(script);
  });
};

/**
 * Trigger complete production-grade Razorpay checkout payment flow
 * @param {Object} params
 * @param {number} params.amount - Amount in INR
 * @param {string} params.showId - Current show ID
 * @param {Array<string>} params.selectedSeats - Array of seat IDs (e.g. ['BA1', 'BA2'])
 * @param {Object} params.user - Current logged-in user object { username, email }
 * @param {Object} params.bookingDetails - Additional metadata { movieName, theatreName, showDate, showTime, seatDetails }
 * @param {Function} params.onSuccess - Callback on verified payment & booking creation
 * @param {Function} params.onFailure - Callback on payment dismiss or verification failure
 */
export const initiateRazorpayCheckout = async ({
  amount,
  showId,
  selectedSeats,
  user,
  bookingDetails,
  onSuccess,
  onFailure,
}) => {
  // 1. Ensure Razorpay script is loaded
  const isLoaded = await loadRazorpayScript();
  if (!isLoaded) {
    toast.error('Razorpay payment gateway is unreachable. Please check your internet connection.');
    if (onFailure) onFailure('SDK_LOAD_FAILED');
    return;
  }

  try {
    // 2. Request order_id from backend
    const orderRes = await api.post('/payment/create-order', {
      amount,
      showId,
      selectedSeats,
      userEmail: user?.email,
    });

    if (!orderRes.data || !orderRes.data.success) {
      throw new Error(orderRes.data?.message || 'Failed to initialize payment order');
    }

    const { order_id, amount: orderAmountPaise, currency, key_id } = orderRes.data;

    // 3. Configure Razorpay Checkout options
    const options = {
      key: key_id || (typeof import.meta !== 'undefined' && import.meta.env?.VITE_RAZORPAY_KEY_ID) || '',
      amount: orderAmountPaise,
      currency: currency || 'INR',
      name: 'iMovies Prime Cinema',
      description: `Theatrical Ticket Booking — ${bookingDetails?.movieName || 'Movie Seats'} (${selectedSeats.join(', ')})`,
      image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=128&auto=format&fit=crop&q=80',
      order_id: order_id,
      prefill: {
        name: user?.username || 'Prime Member',
        email: user?.email || 'user@imovies.com',
        contact: '9999999999',
      },
      notes: {
        showId: String(showId),
        seats: selectedSeats.join(', '),
      },
      theme: {
        color: '#E50914', // Official prompt theme highlight
      },
      modal: {
        backdropclose: false,
        escape: true,
        handleback: true,
        confirm_close: true,
        ondismiss: function () {
          toast.info('Payment window closed. Your seats remain locked under the 5-minute countdown hold.');
          if (onFailure) onFailure('PAYMENT_DISMISSED');
        },
      },
      // Payment Handler Callback on Successful Authorization
      handler: async function (response) {
        try {
          const verifyPayload = {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            amount,
            bookingDetails: {
              ...bookingDetails,
              showId,
              selectedSeats,
              userEmail: user?.email,
              totalAmount: amount,
            },
          };

          toast.loading('Verifying payment signature with Razorpay & confirming seats...', { toastId: 'verify-toast' });

          const verifyRes = await api.post('/payment/verify', verifyPayload);

          toast.dismiss('verify-toast');

          if (verifyRes.data && verifyRes.data.success) {
            toast.success('🎉 Payment Verified! Tickets booked successfully with Razorpay.');
            if (onSuccess) onSuccess(verifyRes.data.booking);
          } else {
            throw new Error(verifyRes.data?.message || 'Payment signature verification failed');
          }
        } catch (verifyErr) {
          toast.dismiss('verify-toast');
          const errMsg = verifyErr.response?.data?.message || verifyErr.message || 'Payment verification failed';
          toast.error(`Verification Error: ${errMsg}`);
          if (onFailure) onFailure('VERIFICATION_FAILED', errMsg);
        }
      },
    };

    // 4. Open Razorpay modal
    const razorpayInstance = new window.Razorpay(options);

    razorpayInstance.on('payment.failed', function (response) {
      console.error('Razorpay Payment Failed Event:', response.error);
      toast.error(`Payment Failed: ${response.error.description || 'Transaction declined'}`);
      if (onFailure) onFailure('PAYMENT_FAILED', response.error);
    });

    razorpayInstance.open();
  } catch (err) {
    console.error('Razorpay Checkout Init Error:', err);
    toast.error(err.response?.data?.message || err.message || 'Error launching payment window');
    if (onFailure) onFailure('ORDER_INIT_FAILED', err);
  }
};
