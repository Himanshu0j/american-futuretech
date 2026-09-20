const express = require('express');
const router = express.Router();
const {
  processCheckout,
  getAllPayments,
  getMyPayments,
  getInvoiceDetails,
} = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/auth');

// Public or student checkout
router.post('/checkout', processCheckout);

// Printable invoice
router.get('/invoice/:invoiceNumber', getInvoiceDetails);

// Student payments
router.get('/my-payments', protect, getMyPayments);

// Admin payments management
router.get('/', protect, authorize('SUPERADMIN', 'ADMIN', 'SuperAdmin'), getAllPayments);

module.exports = router;
