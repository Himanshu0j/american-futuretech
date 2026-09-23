const {
  getStripe,
  isStripeConfigured,
  isWebhookConfigured,
  getCurrency,
  getWebhookSecret,
} = require('../config/payments');
const { getPaymentStatus } = require('../config/payments');

/**
 * Stripe Checkout gateway wrapper.
 *
 * The API never sees a card number: we create a hosted Stripe Checkout Session,
 * the customer pays on Stripe's PCI-compliant page, and the enrollment is only
 * ever confirmed from a signature-verified webhook.
 */

const ALLOWED_FALLBACK_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:4173',
  'https://american-futuretech.vercel.app',
  'https://americanfuturetech.com',
  'https://www.americanfuturetech.com',
];

const stripTrailingSlash = (url) => String(url || '').replace(/\/+$/, '');

/**
 * Whitelisted origin for the success/cancel redirect, so a forged `Origin`
 * header cannot turn the checkout into an open redirect.
 */
const resolveClientUrl = (req) => {
  const candidates = [req?.headers?.origin, process.env.CLIENT_URL, ...ALLOWED_FALLBACK_ORIGINS]
    .map((value) => stripTrailingSlash(value))
    .filter(Boolean);

  const allowed = ALLOWED_FALLBACK_ORIGINS.map(stripTrailingSlash);
  const configured = stripTrailingSlash(process.env.CLIENT_URL);
  if (configured) allowed.push(configured);

  const match = candidates.find((candidate) => allowed.includes(candidate));
  return match || 'http://localhost:5173';
};

/**
 * Create a hosted Stripe Checkout Session for a single order.
 * `payment` must already exist in the DB (status: Pending) — its id is threaded
 * through metadata so the webhook can settle the exact record.
 */
const createCheckoutSession = async ({ payment, course, quote, customer, clientUrl }) => {
  const stripe = getStripe();
  if (!stripe) throw new Error('Stripe is not configured');

  const currency = getCurrency();
  const successUrl = `${clientUrl}/checkout?status=success&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${clientUrl}/checkout?status=cancelled&courseId=${course._id}`;

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    // Card is universal; wallets (Apple/Google Pay) surface automatically inside it.
    payment_method_types: ['card'],
    customer_email: customer.email,
    client_reference_id: String(payment._id),
    metadata: {
      paymentId: String(payment._id),
      courseId: String(course._id),
      courseSlug: course.slug || '',
      courseTitle: course.title,
      tier: quote.tier,
      couponCode: quote.couponCode || '',
      studentName: customer.fullName,
      studentPhone: customer.phone || '',
    },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency,
          unit_amount: Math.round(quote.amount * 100), // Stripe expects cents
          product_data: {
            name: `${course.title} — ${quote.label}`,
            description:
              quote.tier === 'deposit'
                ? 'Reserves your seat in the upcoming live cohort. Balance is settled before sessions begin.'
                : 'Complete tuition for the program, including labs, capstone mentorship and placement support.',
          },
        },
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // 30 minutes
    allow_promotion_codes: false,
  });

  return { session, successUrl, cancelUrl };
};

const retrieveCheckoutSession = async (sessionId) => {
  const stripe = getStripe();
  if (!stripe) throw new Error('Stripe is not configured');
  return stripe.checkout.sessions.retrieve(sessionId);
};

const expandPaymentIntent = async (paymentIntentId) => {
  const stripe = getStripe();
  if (!stripe || !paymentIntentId) return null;
  try {
    return await stripe.paymentIntents.retrieve(paymentIntentId);
  } catch (error) {
    return null;
  }
};

/**
 * Signature verification. Throws when the payload did not come from Stripe —
 * this is the only thing that makes a request trustworthy enough to grant a
 * paid enrollment, so it is deliberately strict.
 */
const verifyWebhookSignature = (rawBody, signatureHeader) => {
  const stripe = getStripe();
  if (!stripe) throw new Error('Stripe is not configured');
  if (!isWebhookConfigured()) throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
  if (!rawBody) throw new Error('Raw request body is unavailable');

  return stripe.webhooks.constructEvent(rawBody, signatureHeader, getWebhookSecret());
};

module.exports = {
  ALLOWED_FALLBACK_ORIGINS,
  resolveClientUrl,
  createCheckoutSession,
  retrieveCheckoutSession,
  expandPaymentIntent,
  verifyWebhookSignature,
  isStripeConfigured,
  isWebhookConfigured,
  getPaymentStatus,
};
