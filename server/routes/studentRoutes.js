const express = require('express');
const router = express.Router();
const {
  getAllStudents,
  updateStudentPayment,
  getStudentInvoice,
} = require('../controllers/studentController');
const {
  listStudents,
  getStudentDetail,
  createStudent,
  updateStudent,
  revokeAccess,
  resetStudentAccess,
  getAssignmentOptions,
} = require('../controllers/studentAdminController');
const { protect, authorize, checkPermission } = require('../middleware/auth');

// ── Admin management (declare before /:id style routes so they never clash) ──
router.get(
  '/admin',
  protect,
  checkPermission('STUDENTS_VIEW', 'ADMIN_MANAGEMENT_VIEW'),
  listStudents,
);
router.get(
  '/admin/options',
  protect,
  checkPermission('STUDENTS_VIEW', 'ADMIN_MANAGEMENT_VIEW'),
  getAssignmentOptions,
);
router.post(
  '/admin',
  protect,
  checkPermission('STUDENTS_EDIT', 'ADMIN_MANAGEMENT_EDIT'),
  createStudent,
);
router.get(
  '/admin/:id',
  protect,
  checkPermission('STUDENTS_VIEW', 'ADMIN_MANAGEMENT_VIEW'),
  getStudentDetail,
);
router.put(
  '/admin/:id',
  protect,
  checkPermission('STUDENTS_EDIT', 'ADMIN_MANAGEMENT_EDIT'),
  updateStudent,
);
router.post(
  '/admin/:id/reset-access',
  protect,
  checkPermission('STUDENTS_EDIT', 'ADMIN_MANAGEMENT_EDIT'),
  resetStudentAccess,
);
router.delete(
  '/admin/:id/access',
  protect,
  checkPermission('STUDENTS_EDIT', 'ADMIN_MANAGEMENT_EDIT'),
  revokeAccess,
);

// ── Legacy batch-scoped endpoints (unchanged contract) ──
router.get('/', protect, authorize('SuperAdmin', 'Counselor', 'SUPERADMIN', 'ADMIN'), getAllStudents);
router.patch('/:batchId/:studentId/payment', protect, authorize('SuperAdmin', 'SUPERADMIN'), updateStudentPayment);
router.get('/:invoiceId/invoice', protect, getStudentInvoice);

module.exports = router;
