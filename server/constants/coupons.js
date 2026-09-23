/**
 * Promotional vouchers.
 *
 * The discount is ALWAYS computed on the server from this table — the client
 * only displays the number it gets back from POST /api/payments/quote, so a
 * tampered request can never change the amount that is actually charged.
 */

const COUPONS = {
  FUTURETECH10: { type: 'percent', value: 10, label: 'FutureTech 10% Off' },
  WELCOME10: { type: 'percent', value: 10, label: 'Welcome 10% Off' },
  AI2026: { type: 'fixed', value: 50, label: 'AI 2026 — $50 Off' },
  TECH50: { type: 'fixed', value: 50, label: 'Tech Cohort — $50 Off' },
};

// A discounted charge may never fall below this floor (card minimums + margin).
const MIN_CHARGE_USD = 10;

const normalizeCode = (code) => String(code || '').toUpperCase().trim();

const getCoupon = (code) => COUPONS[normalizeCode(code)] || null;

const listCouponCodes = () => Object.keys(COUPONS);

module.exports = {
  COUPONS,
  MIN_CHARGE_USD,
  normalizeCode,
  getCoupon,
  listCouponCodes,
};
