const express = require('express');
const router = express.Router();
const {
  createTicket,
  getMyTickets,
  replyToTicket,
  getAllTicketsAdmin,
  updateTicketStatus,
} = require('../controllers/supportController');
const { protect, authorizeScoped } = require('../middleware/auth');

// Support desk. The panel shows it to anyone with STUDENTS_VIEW, so reading the
// queue requires that permission — but changing a ticket's status is a WRITE and
// requires STUDENTS_EDIT, which is what keeps the read-only auditor read-only.
// COUNSELOR keeps its documented role scope on both.
const SUPPORT_STAFF = ['SUPERADMIN', 'ADMIN', 'COUNSELOR'];
const canViewSupport = authorizeScoped(SUPPORT_STAFF, ['STUDENTS_VIEW']);
const canEditSupport = authorizeScoped(SUPPORT_STAFF, ['STUDENTS_EDIT']);

// Student routes
router.post('/tickets', protect, createTicket);
router.get('/my-tickets', protect, getMyTickets);
router.post('/tickets/:id/reply', protect, replyToTicket);

// Admin routes
router.get('/admin/tickets', protect, canViewSupport, getAllTicketsAdmin);
router.patch('/admin/tickets/:id/status', protect, canEditSupport, updateTicketStatus);

module.exports = router;
