const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  studentName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  courseTitle: {
    type: String,
    required: true,
  },
  batch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
  },
  lead: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead',
  },
  tier: {
    type: String,
    enum: ['deposit', 'full', 'personalized', 'installment'],
    default: 'deposit',
  },
  amount: {
    type: Number,
    required: true,
  },
  originalPrice: {
    type: Number,
  },
  discountAmount: {
    type: Number,
    default: 0,
  },
  couponCode: {
    type: String,
    default: '',
  },
  currency: {
    type: String,
    default: 'USD',
  },
  status: {
    type: String,
    // Payments are created as Pending and may only become Paid once Stripe
    // confirms the charge through a signature-verified webhook.
    enum: ['Paid', 'Pending', 'Failed', 'Expired', 'Refunded'],
    default: 'Pending',
  },
  transactionId: {
    type: String,
    required: true,
    unique: true,
  },
  invoiceNumber: {
    type: String,
    required: true,
    unique: true,
  },
  paymentMethod: {
    type: String,
    default: 'Card / Stripe Secure Checkout',
  },
  paymentDate: {
    type: Date,
    default: Date.now,
  },
  // ── Gateway / settlement tracking (kept for audit + idempotency) ──
  provider: {
    type: String,
    default: 'stripe',
  },
  checkoutSessionId: {
    type: String,
    default: '',
    index: true,
  },
  checkoutSessionUrl: {
    type: String,
    default: '',
  },
  stripePaymentIntentId: {
    type: String,
    default: '',
  },
  couponLabel: {
    type: String,
    default: '',
  },
  paidAt: {
    type: Date,
  },
  failureReason: {
    type: String,
    default: '',
  },
  // ── Refunds (currently the admin's live smoke test) ──
  // Kept on the payment itself so the money-out step is as auditable as the
  // money-in step, and so a retry can never refund the same charge twice.
  refundId: {
    type: String,
    default: '',
  },
  refundAmount: {
    type: Number,
  },
  refundedAt: {
    type: Date,
  },
  // A smoke test is a real, tiny charge an admin takes to prove the whole
  // pipeline, refunded immediately. It is never a sale: no student, enrollment
  // or email is created, and the ledger/revenue totals skip it.
  smokeTest: {
    type: Boolean,
    default: false,
    index: true,
  },
  // Stripe event ids already processed — guarantees a retried webhook can never
  // enroll the same student twice.
  webhookEventIds: {
    type: [String],
    default: [],
  },
}, {
  timestamps: true,
});

PaymentSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Payment', PaymentSchema);
