const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();

const {
  quoteOrder,
  createCheckoutSession,
  handleStripeWebhook,
  getCheckoutStatus,
  getAllPayments,
  getMyPayments,
  getInvoiceDetails,
} = require('../controllers/paymentController');
const { protect, authorizeScoped } = require('../middleware/auth');

// Checkout endpoints are public, so they get their own abuse guards.
const quoteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many price checks from this IP. Please try again shortly.' },
});

const checkoutLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many checkout attempts from this IP. Please try again in 15 minutes or contact admissions.',
  },
});

// ── Public ───────────────────────────────────────────────────────────────────
router.post('/quote', quoteLimiter, quoteOrder);
router.post('/checkout', checkoutLimiter, createCheckoutSession);

// Stripe calls this directly. The body is signature-verified, never trusted blindly.
router.post('/webhook', handleStripeWebhook);

// Success-screen polling (session id scoped, no PII beyond the buyer's own order).
router.get('/checkout-status/:sessionId', getCheckoutStatus);

// ── Private ──────────────────────────────────────────────────────────────────
// Invoices carry personal data, so they now require the owner or staff login.
router.get('/invoice/:invoiceNumber', protect, getInvoiceDetails);

// Student receipts
router.get('/my-payments', protect, getMyPayments);

// Admin payments management — the panel gates the "Tuition & Billing Ledger"
// module with SETTINGS_VIEW, so the API requires the same permission. A role
// alone is no longer enough: a courses-only admin used to read every invoice.
router.get('/', protect, authorizeScoped(['SUPERADMIN', 'ADMIN'], ['SETTINGS_VIEW']), getAllPayments);

module.exports = router;
