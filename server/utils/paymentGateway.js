const {
  getStripe,
  isStripeConfigured,
  isWebhookConfigured,
  getCurrency,
  getWebhookSecret,
  eligibleInstallmentMethods,
  installmentMethodIds,
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
 * The exact `payment_method_types` list for an order: card, plus the instalment
 * methods whose amount window covers this price.
 *
 * Card is universal and the wallets (Apple Pay, Google Pay, Link) surface inside
 * it. The instalment methods (Klarna, Afterpay) are added per order, because each
 * one only applies inside its own window — see INSTALLMENT_METHODS.
 *
 * A deliberately explicit list, not `automatic_payment_methods`: that one lets the
 * Stripe dashboard decide silently, so a method switched on there would appear on
 * the site with no code change and no test — and one switched off would vanish the
 * same way. Listing the ids keeps the offer reviewable per order.
 */
const paymentMethodTypesFor = (amount) => ['card', ...installmentMethodIds(amount)];

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

  const installmentMethods = eligibleInstallmentMethods(quote.amount);
  const paymentMethodTypes = paymentMethodTypesFor(quote.amount);
  // Both derive from the same window check, so what the API advertises and what
  // Stripe is asked to offer can never drift apart.
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: paymentMethodTypes,
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
    // Pin the page to the store currency. Stripe's adaptive pricing otherwise
    // localises the amount to the buyer's currency (an Indian visitor sees the
    // price converted to ₹ with a conversion-fee line), and because Klarna and
    // Afterpay do not support every local currency Stripe silently drops them —
    // the page ends up card-only even though the session asked for all three.
    // Verified live: with this off, a $99 session shows Card + Afterpay + Klarna.
    adaptive_pricing: { enabled: false },
  });

  return { session, successUrl, cancelUrl, installmentMethods, paymentMethodTypes };
};

/**
 * The method the student actually paid with.
 *
 * `session.payment_method_types` is the list we OFFERED, so it reads
 * "card, klarna, afterpay_clearpay" on every order and is useless as a receipt
 * label. Stripe records the one that was really used on the payment intent, and
 * on the payment method attached to it — that is what the admin ledger should
 * show, and what tells apart a card sale from an instalment plan.
 *
 * Best-effort by design: the caller has already settled the order, so a failure
 * here only costs a nicer label, never an enrollment.
 */
const resolveSettledMethod = async (session) => {
  const intentRef = session?.payment_intent;
  const intentId = typeof intentRef === 'string' ? intentRef : intentRef?.id;
  if (!intentId) return '';

  try {
    const stripe = getStripe();
    if (!stripe) return '';
    const intent = await stripe.paymentIntents.retrieve(intentId, { expand: ['payment_method'] });
    const paymentMethod = intent?.payment_method;
    if (paymentMethod && typeof paymentMethod === 'object' && paymentMethod.type) {
      return paymentMethod.type;
    }
    return intent?.payment_method_types?.[0] || '';
  } catch (error) {
    return '';
  }
};

const retrieveCheckoutSession = async (sessionId) => {
  const stripe = getStripe();
  if (!stripe) throw new Error('Stripe is not configured');
  return stripe.checkout.sessions.retrieve(sessionId);
};

/**
 * The admin's "live smoke test": one real, tiny charge used to prove that
 * Checkout, the signed webhook and the refund path all work on the live account.
 *
 * It is deliberately its own function rather than a mode of the course checkout:
 * the line item says it is a test, the metadata carries `smokeTest`, and the
 * redirect returns to the admin panel instead of a student's success screen.
 * Checkout itself is unchanged — the admin types their own card on Stripe's
 * hosted page, so no card data ever reaches this server.
 */
const createSmokeTestSession = async ({ payment, amountMinor, currency, clientUrl, adminName }) => {
  const stripe = getStripe();
  if (!stripe) throw new Error('Stripe is not configured');

  const adminReturnUrl = `${stripTrailingSlash(clientUrl)}/admin/settings?tab=payments&smokeTest=${payment._id}`;

  return stripe.checkout.sessions.create({
    mode: 'payment',
    // Card only, on purpose: the smoke test is a $1 charge refunded seconds later,
    // run by the admin with their own card. An instalment plan (Klarna/Afterpay)
    // cannot be sized to $1 and a real BNPL agreement is not something to open and
    // refund on a test. Installment availability is instead reported read-only in
    // the admin panel, so it can be checked without charging anyone.
    payment_method_types: ['card'],
    customer_email: payment.email,
    client_reference_id: String(payment._id),
    metadata: {
      paymentId: String(payment._id),
      smokeTest: 'true',
      testedBy: String(adminName || 'Admin').slice(0, 120),
    },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency,
          unit_amount: amountMinor,
          product_data: {
            name: 'Live payment smoke test — refunded immediately',
            description:
              'One-off end-to-end check: Stripe Checkout → signed webhook settlement → automatic refund. This is not a course purchase.',
          },
        },
      },
    ],
    success_url: `${adminReturnUrl}&status=success`,
    cancel_url: `${adminReturnUrl}&status=cancelled`,
    expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // 30 minutes
    allow_promotion_codes: false,
  });
};

/**
 * Put a settled charge back on the card.
 *
 * Money must never move twice, so the caller passes an idempotency key derived
 * from the payment: retrying with the same key returns the same refund object
 * instead of refunding again.
 */
const refundPaymentIntent = async ({ paymentIntentId, amountMinor, idempotencyKey, metadata }) => {
  const stripe = getStripe();
  if (!stripe) throw new Error('Stripe is not configured');
  if (!paymentIntentId) throw new Error('No Stripe payment intent to refund');

  const params = { payment_intent: paymentIntentId, metadata };
  if (amountMinor != null) params.amount = Math.round(amountMinor);
  const options = idempotencyKey ? { idempotencyKey } : undefined;
  return stripe.refunds.create(params, options);
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
  paymentMethodTypesFor,
  createCheckoutSession,
  createSmokeTestSession,
  retrieveCheckoutSession,
  resolveSettledMethod,
  refundPaymentIntent,
  expandPaymentIntent,
  verifyWebhookSignature,
  isStripeConfigured,
  isWebhookConfigured,
  getPaymentStatus,
};
