const Coupon = require('../models/Coupon');
const Payment = require('../models/Payment');

/**
 * Coupon rules engine.
 *
 * `evaluateCoupon` is pure so every rule can be unit-tested without a database.
 * `resolveCoupon` is the async wrapper used by checkout: it loads the coupon and
 * counts how many times this buyer already used it.
 */

const MIN_CHARGE_USD = 10;

const normalizeCode = (code) => String(code || '').toUpperCase().trim();

const toMoney = (value) => Math.round(Number(value) * 100) / 100;

const formatDate = (value) =>
  new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const describeCoupon = (coupon) => {
  if (!coupon) return '';
  if (coupon.discountType === 'percent') return `${coupon.discountValue}% off`;
  return `$${Number(coupon.discountValue).toLocaleString()} off`;
};

/**
 * Discount for one coupon on one amount. Never lets the payable amount fall
 * below MIN_CHARGE_USD (card processor minimums) and never returns a negative.
 */
const computeDiscount = (amount, coupon) => {
  const base = toMoney(amount);
  if (!coupon || base <= 0) return 0;

  const raw =
    coupon.discountType === 'percent'
      ? base * (Number(coupon.discountValue) / 100)
      : Number(coupon.discountValue);

  const capped = Number(coupon.maxDiscount) > 0 ? Math.min(raw, Number(coupon.maxDiscount)) : raw;
  const floor = Math.max(base - MIN_CHARGE_USD, 0);

  return toMoney(Math.max(Math.min(capped, floor), 0));
};

/**
 * Validate one coupon against a checkout context.
 * Returns { ok, code, message, discountAmount, label } — never throws.
 */
const evaluateCoupon = (coupon, { amount, tier, courseId, studentUsage = 0, now = new Date() } = {}) => {
  if (!coupon) {
    return { ok: false, code: 'NOT_FOUND', message: 'That coupon code is not valid.' };
  }

  if (!coupon.active) {
    return { ok: false, code: 'INACTIVE', message: 'This coupon is no longer active.' };
  }

  const nowTime = now.getTime();
  if (coupon.startsAt && nowTime < new Date(coupon.startsAt).getTime()) {
    return {
      ok: false,
      code: 'NOT_STARTED',
      message: `This coupon becomes available on ${formatDate(coupon.startsAt)}.`,
    };
  }

  if (coupon.expiresAt && nowTime > new Date(coupon.expiresAt).getTime()) {
    return {
      ok: false,
      code: 'EXPIRED',
      message: `This coupon expired on ${formatDate(coupon.expiresAt)}.`,
    };
  }

  if (Number(coupon.usageLimit) > 0 && Number(coupon.usedCount) >= Number(coupon.usageLimit)) {
    return { ok: false, code: 'USAGE_LIMIT', message: 'This coupon has reached its usage limit.' };
  }

  if (Number(coupon.perStudentLimit) > 0 && Number(studentUsage) >= Number(coupon.perStudentLimit)) {
    return {
      ok: false,
      code: 'PER_STUDENT_LIMIT',
      message: 'You have already used this coupon the maximum number of times.',
    };
  }

  if (
    Array.isArray(coupon.applicableTiers) &&
    coupon.applicableTiers.length > 0 &&
    tier &&
    !coupon.applicableTiers.includes(tier)
  ) {
    return {
      ok: false,
      code: 'TIER_NOT_ELIGIBLE',
      message: 'This coupon does not apply to the option you selected.',
    };
  }

  if (
    Array.isArray(coupon.applicableCourses) &&
    coupon.applicableCourses.length > 0 &&
    courseId &&
    !coupon.applicableCourses.some((id) => String(id) === String(courseId))
  ) {
    return {
      ok: false,
      code: 'COURSE_NOT_ELIGIBLE',
      message: 'This coupon does not apply to the program you selected.',
    };
  }

  if (Number(coupon.minAmount) > 0 && Number(amount) < Number(coupon.minAmount)) {
    return {
      ok: false,
      code: 'MIN_AMOUNT',
      message: `This coupon needs a minimum order of $${Number(coupon.minAmount).toLocaleString()}.`,
    };
  }

  const discountAmount = computeDiscount(amount, coupon);
  if (discountAmount <= 0) {
    return {
      ok: false,
      code: 'NO_DISCOUNT',
      message: 'This coupon would not reduce the amount payable on this order.',
    };
  }

  return {
    ok: true,
    code: 'VALID',
    message: 'Coupon applied.',
    discountAmount,
    label: `${coupon.code} — ${describeCoupon(coupon)}`,
  };
};

/** How many times this buyer already redeemed the code (Paid or in-flight). */
const countStudentUsage = async (code, { studentId, email } = {}) => {
  const normalized = normalizeCode(code);
  if (!normalized) return 0;
  const query = { couponCode: normalized, status: { $in: ['Paid', 'Pending'] } };
  const or = [];
  if (studentId) or.push({ student: studentId });
  if (email) or.push({ email: String(email).toLowerCase().trim() });
  if (!or.length) return 0;
  return Payment.countDocuments({ ...query, $or: or });
};

/**
 * Load a coupon and evaluate it for this checkout.
 * Returns null when no code was supplied, otherwise { coupon, evaluation }.
 */
const resolveCoupon = async (code, { amount, tier, courseId, studentId, email } = {}) => {
  const normalized = normalizeCode(code);
  if (!normalized) return null;

  const coupon = await Coupon.findOne({ code: normalized }).lean();
  const studentUsage = coupon ? await countStudentUsage(normalized, { studentId, email }) : 0;

  return {
    coupon,
    studentUsage,
    evaluation: evaluateCoupon(coupon, { amount, tier, courseId, studentUsage }),
  };
};

/** Called only once a payment is confirmed settled. */
const redeemCoupon = async (code) => {
  const normalized = normalizeCode(code);
  if (!normalized) return null;
  return Coupon.findOneAndUpdate(
    { code: normalized },
    { $inc: { usedCount: 1 }, $set: { lastUsedAt: new Date() } },
    { new: true },
  );
};

module.exports = {
  MIN_CHARGE_USD,
  normalizeCode,
  describeCoupon,
  computeDiscount,
  evaluateCoupon,
  countStudentUsage,
  resolveCoupon,
  redeemCoupon,
};
