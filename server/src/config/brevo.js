import dotenv from 'dotenv';
import * as brevoModule from '@getbrevo/brevo';

dotenv.config();

// Extract SDK exports safely across ESM/CJS interop
const BrevoClient = brevoModule.BrevoClient || brevoModule.default?.BrevoClient || brevoModule.Brevo;

export const brevoApiKey = process.env.BREVO_API_KEY || '';
export const brevoApiKeySecondary = process.env.BREVO_API_KEY_SECONDARY || '';

export const senderEmail = process.env.SENDER_EMAIL || 'en24cs3010865@medicaps.ac.in';
export const senderName = process.env.SENDER_NAME || 'iMovies Prime Cinema';
export const clientUrl = process.env.CLIENT_URL || 'http://localhost:5000';

// Configuration validator
export const validateBrevoConfig = () => {
  const missing = [];
  if (!brevoApiKey) missing.push('BREVO_API_KEY');
  if (!senderEmail) missing.push('SENDER_EMAIL');

  if (missing.length > 0) {
    console.warn(`[Brevo Warning] Missing required environment variables: ${missing.join(', ')}`);
    return false;
  }
  return true;
};

// Initialize Primary Brevo SDK Client
export let brevoClient = null;
if (BrevoClient) {
  try {
    brevoClient = new BrevoClient({
      apiKey: brevoApiKey,
    });
    console.log('[Brevo Config] BrevoClient initialized with sender:', senderEmail);
  } catch (err) {
    console.error('[Brevo Config] Error initializing BrevoClient:', err.message);
  }
} else {
  console.warn('[Brevo Config] BrevoClient class not found on SDK.');
}

export default {
  brevoClient,
  brevoApiKey,
  brevoApiKeySecondary,
  senderEmail,
  senderName,
  clientUrl,
  validateBrevoConfig,
};
