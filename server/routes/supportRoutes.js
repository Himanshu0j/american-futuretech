const express = require('express');
const router = express.Router();
const {
  createTicket,
  getMyTickets,
  replyToTicket,
  getAllTicketsAdmin,
  updateTicketStatus,
} = require('../controllers/supportController');
const { protect, authorize } = require('../middleware/auth');

// Student routes
router.post('/tickets', protect, createTicket);
router.get('/my-tickets', protect, getMyTickets);
router.post('/tickets/:id/reply', protect, replyToTicket);

// Admin routes
router.get('/admin/tickets', protect, authorize('SUPERADMIN', 'ADMIN', 'COUNSELOR', 'SuperAdmin'), getAllTicketsAdmin);
router.patch('/admin/tickets/:id/status', protect, authorize('SUPERADMIN', 'ADMIN', 'COUNSELOR', 'SuperAdmin'), updateTicketStatus);

module.exports = router;
