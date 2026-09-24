const { getCoupon, normalizeCode, MIN_CHARGE_USD } = require('../constants/coupons');
const { computeDiscount } = require('./couponEngine');

/**
 * Server-side order pricing.
 *
 * Everything the customer is charged is derived here — the browser never sends
 * an amount. All functions are pure so they can be unit-tested without a DB.
 */

const DEPOSIT_FALLBACK_USD = 99;
// Career Program (group batch) list price. Admins override it per course in
// Curriculum & Courses; this is only the last-resort fallback.
const FULL_FALLBACK_USD = 499;
const PERSONALIZED_FALLBACK_USD = 5499;

const ALLOWED_TIERS = ['deposit', 'full', 'personalized'];

const toMoney = (value) => Math.round(Number(value) * 100) / 100;

/**
 * Resolve what this order actually costs.
 * deposit      → seat reservation fee (admin editable in Settings)
 * full         → the course's discounted tuition
 * personalized → the separate Personalized 1-on-1 track fee (independent price)
 */
const resolveOrderAmount = ({ course, tier, settings }) => {
  const requestedTier = ALLOWED_TIERS.includes(tier) ? tier : 'deposit';
  const personalized = settings?.personalizedLearning || {};

  let amount;
  let originalPrice;
  let label;

  if (requestedTier === 'deposit') {
    amount = Number(settings?.depositPriceUSD) || DEPOSIT_FALLBACK_USD;
    originalPrice = amount;
    label = 'Cohort Seat Reservation Deposit';
  } else if (requestedTier === 'personalized') {
    amount = Number(personalized.price) || Number(personalized.fee) || PERSONALIZED_FALLBACK_USD;
    originalPrice =
      Number(personalized.originalPrice) || Number(personalized.originalFee) || amount;
    label = 'Personalized 1-on-1 Mentorship Track';
  } else {
    amount = Number(course?.pricing?.discountedPrice) || FULL_FALLBACK_USD;
    originalPrice = Number(course?.pricing?.basePrice) || amount;
    label = 'Full Program Tuition';
  }

  amount = toMoney(amount);
  originalPrice = toMoney(Math.max(originalPrice, amount));

  return {
    tier: requestedTier,
    amount,
    originalPrice,
    label,
    currency: 'USD',
  };
};

/**
 * Apply an admin-managed coupon that was already validated by utils/couponEngine.
 * `resolved` is what POST /api/payments/quote gets from the database, so an
 * expired/exhausted/deactivated coupon can never take money off the price.
 */
const applyResolvedCoupon = (amount, resolved) => {
  const base = toMoney(amount);
  const coupon = resolved?.coupon;
  const evaluation = resolved?.evaluation || { ok: false, code: 'NOT_FOUND', message: 'That coupon code is not valid.' };

  if (!evaluation.ok) {
    return {
      amount: base,
      discountAmount: 0,
      couponCode: normalizeCode(coupon?.code || ''),
      couponLabel: '',
      couponApplied: false,
      couponValid: false,
      couponError: evaluation.message,
      couponErrorCode: evaluation.code,
    };
  }

  const discountAmount = computeDiscount(base, coupon);
  return {
    amount: toMoney(base - discountAmount),
    discountAmount,
    couponCode: normalizeCode(coupon.code),
    couponLabel: evaluation.label || `${coupon.code} — ${coupon.discountValue}${coupon.discountType === 'percent' ? '%' : '$'} off`,
    couponApplied: true,
    couponValid: true,
    couponError: null,
    couponErrorCode: null,
  };
};

/**
 * Apply a voucher to an amount. Unknown/expired codes are ignored (never throw)
 * and the result can never drop below MIN_CHARGE_USD.
 *
 * Kept for the static fallback table; live checkout goes through
 * applyResolvedCoupon so the database stays the single source of truth.
 */
const applyCoupon = (amount, code) => {
  const base = toMoney(amount);
  const coupon = getCoupon(code);

  if (!coupon) {
    return {
      amount: base,
      discountAmount: 0,
      couponCode: '',
      couponLabel: '',
      couponApplied: false,
      couponValid: false,
    };
  }

  const rawDiscount =
    coupon.type === 'percent' ? Math.round(base * (coupon.value / 100)) : Number(coupon.value);

  const maxDiscount = Math.max(0, base - MIN_CHARGE_USD);
  const discountAmount = toMoney(Math.min(rawDiscount, maxDiscount));

  return {
    amount: toMoney(base - discountAmount),
    discountAmount,
    couponCode: normalizeCode(code),
    couponLabel: coupon.label,
    couponApplied: true,
    couponValid: true,
  };
};

/**
 * Full quote used by both the UI and the Stripe session, guaranteeing the price
 * the customer sees is exactly the price that is charged.
 */
const buildQuote = ({ course, tier, couponCode, settings, resolvedCoupon }) => {
  const base = resolveOrderAmount({ course, tier, settings });
  const discounted = resolvedCoupon
    ? applyResolvedCoupon(base.amount, resolvedCoupon)
    : applyCoupon(base.amount, couponCode);

  return {
    ...base,
    amount: discounted.amount,
    discountAmount: discounted.discountAmount,
    couponCode: discounted.couponCode,
    couponLabel: discounted.couponLabel,
    couponApplied: discounted.couponApplied,
    couponValid: discounted.couponValid,
    couponError: discounted.couponError || null,
    couponErrorCode: discounted.couponErrorCode || null,
  };
};

// Password generation/policy lives in utils/passwords.js so every entry point
// shares the same rules. Re-exported here for backwards compatibility.
const { generateSecurePassword } = require('./passwords');
const generateTempPassword = generateSecurePassword;

module.exports = {
  ALLOWED_TIERS,
  DEPOSIT_FALLBACK_USD,
  FULL_FALLBACK_USD,
  PERSONALIZED_FALLBACK_USD,
  resolveOrderAmount,
  applyCoupon,
  applyResolvedCoupon,
  buildQuote,
  generateTempPassword,
  toMoney,
};
