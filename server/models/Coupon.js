const mongoose = require('mongoose');

/**
 * Admin-managed promotional coupons.
 *
 * The discount is ALWAYS recalculated on the server from this collection — the
 * browser may only send the code, never an amount. Every rule an admin can set
 * (expiry, usage limit, per-student limit, minimum order, program restriction)
 * is enforced in utils/couponEngine.js before a single cent comes off.
 */
const CouponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Coupon code is required'],
    unique: true,
    uppercase: true,
    trim: true,
  },
  description: {
    type: String,
    default: '',
    trim: true,
  },
  discountType: {
    type: String,
    enum: ['flat', 'percent'],
    default: 'percent',
  },
  discountValue: {
    type: Number,
    required: [true, 'Discount value is required'],
    min: [0, 'Discount cannot be negative'],
    validate: {
      validator(value) {
        if (this.discountType === 'percent') return Number(value) <= 100;
        return true;
      },
      message: 'A percentage discount cannot be more than 100%.',
    },
  },
  // Minimum order value before the coupon may be used (0 = no minimum).
  minAmount: {
    type: Number,
    default: 0,
    min: 0,
  },
  // Only used for percentage coupons: hard cap on the discount (0 = uncapped).
  maxDiscount: {
    type: Number,
    default: 0,
    min: 0,
  },
  startsAt: {
    type: Date,
    default: null,
  },
  expiresAt: {
    type: Date,
    default: null,
  },
  // 0 = unlimited total redemptions
  usageLimit: {
    type: Number,
    default: 0,
    min: 0,
  },
  // 0 = no per-student cap
  perStudentLimit: {
    type: Number,
    default: 1,
    min: 0,
  },
  // Empty array = applies to every checkout tier / program.
  applicableTiers: [{
    type: String,
    enum: ['deposit', 'full', 'personalized'],
  }],
  applicableCourses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
  }],
  active: {
    type: Boolean,
    default: true,
  },
  usedCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  lastUsedAt: {
    type: Date,
    default: null,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
}, {
  timestamps: true,
});

CouponSchema.index({ active: 1, createdAt: -1 });

module.exports = mongoose.model('Coupon', CouponSchema);
