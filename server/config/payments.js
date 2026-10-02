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
 * Instalment / "pay later" methods (EMI) offered next to the card.
 *
 * Students sometimes want to pay in instalments instead of one lump sum, so
 * checkout offers Klarna and Afterpay. Both are Buy-Now-Pay-Later methods with a
 * delayed notification: Stripe confirms the authorisation, then settles the money
 * a little later, which is why `checkout.session.async_payment_succeeded` is part
 * of REQUIRED_WEBHOOK_EVENTS.
 *
 * The amount windows below mirror what the live account actually accepts —
 * verified against acct_1U3Iec8ivBoJNoGx (US, USD) on 2026-10-03:
 *   · capabilities `klarna_payments` and `afterpay_clearpay_payments` = active
 *   · a session listing both is accepted at $99, $499 and $2,499
 *   · at $4,499 Stripe silently drops Afterpay (its per-order ceiling sits
 *     between $2,499 and $4,499) and keeps Klarna
 *
 * That silent drop is worth understanding: listing a method Stripe will not honour
 * is not an error, it just quietly disappears from the payment page — the exact
 * shape of "the option is not there" bug reports. Filtering here keeps what we
 * advertise, what we send to Stripe and what the student sees telling one story.
 */
const INSTALLMENT_METHODS = [
  {
    id: 'klarna',
    label: 'Klarna',
    blurb: 'Pay in 4 interest-free instalments, or monthly financing',
    minAmount: 1,
    maxAmount: 10000,
  },
  {
    id: 'afterpay_clearpay',
    label: 'Afterpay',
    blurb: '4 interest-free payments, every two weeks',
    // Every tier this site sells starts at $99, which Stripe accepts for Afterpay;
    // the ceiling is the one measured above.
    minAmount: 1,
    maxAmount: 4000,
  },
];

/**
 * Which instalment methods can be offered for this order amount, in declaration
 * order so the offer is stable. Amount is in major units (dollars, not cents),
 * exactly as the quote carries it.
 */
const eligibleInstallmentMethods = (amount) => {
  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0) return [];
  return INSTALLMENT_METHODS.filter(
    (method) => value >= method.minAmount && value <= method.maxAmount,
  ).map((method) => ({ ...method }));
};

const installmentMethodIds = (amount) => eligibleInstallmentMethods(amount).map((method) => method.id);

/** Plain-language name for a method id, for receipts and the admin ledger. */
const installmentMethodLabel = (id) => {
  const found = INSTALLMENT_METHODS.find((method) => method.id === id);
  if (found) return found.label;
  if (id === 'card') return 'Card';
  return String(id || '').replace(/_/g, ' ');
};

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
  INSTALLMENT_METHODS,
  eligibleInstallmentMethods,
  installmentMethodIds,
  installmentMethodLabel,
  getCurrency,
  getPaymentStatus,
  getSecretKey,
  getWebhookSecret,
  setRuntimeSecrets,
  hasRuntimeSecret,
  hasRuntimeWebhookSecret,
  setRuntimeCurrency,
};
