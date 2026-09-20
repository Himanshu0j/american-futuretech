const express = require('express');
const router = express.Router();
const {
  getAllStudents,
  updateStudentPayment,
  getStudentInvoice,
} = require('../controllers/studentController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, authorize('SuperAdmin', 'Counselor', 'SUPERADMIN', 'ADMIN'), getAllStudents);
router.patch('/:batchId/:studentId/payment', protect, authorize('SuperAdmin', 'SUPERADMIN'), updateStudentPayment);
router.get('/:invoiceId/invoice', protect, getStudentInvoice);

module.exports = router;
