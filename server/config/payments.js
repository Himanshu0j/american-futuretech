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
const hasRuntimeWebhookSecret = () => Boolean(runtimeSecrets.webhookSecret);

const isStripeConfigured = () => getSecretKey().startsWith('sk_');
const isWebhookConfigured = () => getWebhookSecret().startsWith('whsec_');
const isLiveMode = () => getSecretKey().startsWith('sk_live_');

/**
 * Keep the saved environment label in sync with the key that was actually
 * pasted, instead of refusing the save.
 *
 * A live key saved while the panel said "test" used to be a 400 error, which is
 * exactly the wall a non-technical client hits: they paste the key they copied
 * from the Stripe dashboard and the form refuses it without fixing anything.
 * Aligning the label is the safe direction in both cases — an `sk_live_` key can
 * only ever be live, and an `sk_test_` key can only ever be test — so the couple
 * can no longer disagree. Returns the aligned mode plus a plain-language notice.
 */
const alignModeWithSecret = ({ mode, secretKey }) => {
  const key = String(secretKey || '').trim();
  const current = mode === 'live' ? 'live' : 'test';
  if (key.startsWith('sk_live_') && current !== 'live') {
    return {
      mode: 'live',
      changed: true,
      notice: 'A live key (sk_live_…) was saved, so the gateway was switched to LIVE mode automatically.',
    };
  }
  if (key.startsWith('sk_test_') && current === 'live') {
    return {
      mode: 'test',
      changed: true,
      notice: 'A test key (sk_test_…) was saved, so the gateway was switched to TEST mode automatically. No real card can be charged.',
    };
  }
  return { mode: current, changed: false, notice: null };
};

/** The events the platform must receive to settle an order. Shared by the API, the
 *  admin panel (copy-paste checklist) and the setup verification, so the three can
 *  never drift apart. */
const REQUIRED_WEBHOOK_EVENTS = [
  'checkout.session.completed',
  'checkout.session.async_payment_succeeded',
  'checkout.session.async_payment_failed',
  'checkout.session.expired',
  'payment_intent.payment_failed',
];

const WEBHOOK_PATH = '/api/payments/webhook';

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
  alignModeWithSecret,
  REQUIRED_WEBHOOK_EVENTS,
  WEBHOOK_PATH,
  getCurrency,
  getPaymentStatus,
  getSecretKey,
  getWebhookSecret,
  setRuntimeSecrets,
  hasRuntimeSecret,
  hasRuntimeWebhookSecret,
  setRuntimeCurrency,
};
