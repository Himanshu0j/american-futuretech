/**
 * Payment gateway configuration.
 *
 * The platform settles real card payments through Stripe Checkout. Every value
 * below is read from the environment so that no secret ever lives in source code.
 *
 * Required production env vars:
 *   STRIPE_SECRET_KEY      sk_live_... / sk_test_...
 *   STRIPE_WEBHOOK_SECRET  whsec_... (from the Stripe webhook endpoint settings)
 *
 * Optional:
 *   PAYMENT_CURRENCY       defaults to USD
 *   CLIENT_URL             used to build the success/cancel redirect URLs
 */

let stripeClient = null;

/**
 * Runtime secrets.
 *
 * Priority is deliberate: an environment variable always wins, and a secret
 * saved from the admin panel (encrypted at rest, decrypted once at boot) is the
 * fallback. Either way the plaintext only ever lives in server memory.
 */
let runtimeSecrets = { secretKey: '', webhookSecret: '' };

const getSecretKey = () => (process.env.STRIPE_SECRET_KEY || runtimeSecrets.secretKey || '').trim();
const getWebhookSecret = () => (process.env.STRIPE_WEBHOOK_SECRET || runtimeSecrets.webhookSecret || '').trim();

/** Called at boot and right after an admin saves the gateway settings. */
const setRuntimeSecrets = ({ secretKey, webhookSecret } = {}) => {
  const next = {
    secretKey: secretKey !== undefined ? String(secretKey || '').trim() : runtimeSecrets.secretKey,
    webhookSecret: webhookSecret !== undefined ? String(webhookSecret || '').trim() : runtimeSecrets.webhookSecret,
  };
  const changed = next.secretKey !== runtimeSecrets.secretKey || next.webhookSecret !== runtimeSecrets.webhookSecret;
  runtimeSecrets = next;
  // A rotated key must build a fresh SDK client.
  if (changed) stripeClient = null;
  return getPaymentStatus();
};

const hasRuntimeSecret = () => Boolean(runtimeSecrets.secretKey);

const isStripeConfigured = () => getSecretKey().startsWith('sk_');
const isWebhookConfigured = () => getWebhookSecret().startsWith('whsec_');
const isLiveMode = () => getSecretKey().startsWith('sk_live_');

/**
 * Lazy singleton — the SDK is only instantiated when a key exists so that the
 * rest of the API keeps working (manual enquiry mode) before go-live.
 */
const getStripe = () => {
  if (!isStripeConfigured()) return null;
  if (!stripeClient) {
    const Stripe = require('stripe');
    stripeClient = new Stripe(getSecretKey(), {
      maxNetworkRetries: 2,
      timeout: 20000,
      appInfo: { name: 'American FutureTech Platform', version: '1.0.0' },
    });
  }
  return stripeClient;
};

// Currency: env wins, then the admin's gateway setting, then USD.
let runtimeCurrency = '';
const setRuntimeCurrency = (currency) => {
  runtimeCurrency = String(currency || '').trim().toLowerCase();
};
const getCurrency = () => (process.env.PAYMENT_CURRENCY || runtimeCurrency || 'USD').toLowerCase();

/**
 * Status block surfaced by /api/health and the admin dashboard so nobody has to
 * guess whether real payments are switched on.
 */
const getPaymentStatus = () => {
  const configured = isStripeConfigured();
  return {
    provider: 'stripe',
    source: process.env.STRIPE_SECRET_KEY ? 'environment' : (hasRuntimeSecret() ? 'admin-panel' : 'none'),
    mode: configured ? (isLiveMode() ? 'live' : 'test') : 'manual',
    configured,
    webhookConfigured: isWebhookConfigured(),
    currency: getCurrency().toUpperCase(),
    ready: configured && isWebhookConfigured(),
    warning: !configured
      ? 'STRIPE_SECRET_KEY is not set: online card payments are disabled and checkout falls back to a manual admissions enquiry.'
      : (!isWebhookConfigured()
        ? 'STRIPE_WEBHOOK_SECRET is not set: payments can be initiated but never verified, so enrollments will NOT be auto-confirmed.'
        : null),
  };
};

module.exports = {
  getStripe,
  isStripeConfigured,
  isWebhookConfigured,
  isLiveMode,
  getCurrency,
  getPaymentStatus,
  getSecretKey,
  getWebhookSecret,
  setRuntimeSecrets,
  hasRuntimeSecret,
  setRuntimeCurrency,
};
