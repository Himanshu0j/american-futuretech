const SupportTicket = require('../models/SupportTicket');

// @desc    Student: Create support ticket
// @route   POST /api/support/tickets
// @access  Private (Student)
const createTicket = async (req, res) => {
  try {
    const { subject, category, priority, message } = req.body;
    if (!subject || !message) {
      return res.status(400).json({ success: false, message: 'Subject and message are required' });
    }

    const ticketNumber = 'TICK-' + Math.floor(100000 + Math.random() * 900000);

    let validCategory = category || 'Course Curriculum';
    if (validCategory.includes('Billing') || validCategory.includes('Tuition')) {
      validCategory = 'Billing & Invoices';
    }

    const ticket = await SupportTicket.create({
      student: req.user._id,
      studentName: req.user.name,
      studentEmail: req.user.email,
      ticketNumber,
      subject,
      category: validCategory,
      priority: priority || 'Medium',
      status: 'Open',
      messages: [{
        sender: req.user._id,
        senderName: req.user.name,
        senderRole: req.user.role,
        message,
        createdAt: new Date(),
      }],
    });

    return res.status(201).json({ success: true, ticket });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Student: Get my tickets
// @route   GET /api/support/my-tickets
// @access  Private (Student)
const getMyTickets = async (req, res) => {
  try {
    const tickets = await SupportTicket.find({ student: req.user._id }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, count: tickets.length, tickets });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add reply to ticket
// @route   POST /api/support/tickets/:id/reply
// @access  Private
const replyToTicket = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ success: false, message: 'Message content is required' });

    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

    // IDOR check: Student can only reply to their own tickets
    const userRole = (req.user.role || '').toUpperCase();
    const isAdmin = ['SUPERADMIN', 'ADMIN', 'COUNSELOR', 'INSTRUCTOR'].includes(userRole);
    if (!isAdmin && ticket.student?.toString() !== req.user._id?.toString()) {
      return res.status(403).json({ success: false, message: 'Forbidden: You cannot reply to another student\'s ticket.' });
    }

    ticket.messages.push({
      sender: req.user._id,
      senderName: req.user.name,
      senderRole: req.user.role,
      message,
      createdAt: new Date(),
    });

    if (req.user.role === 'SUPERADMIN' || req.user.role === 'ADMIN' || req.user.role === 'SuperAdmin') {
      ticket.status = 'In Progress';
    }

    await ticket.save();

    return res.status(200).json({ success: true, ticket });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin: Get all tickets
// @route   GET /api/support/admin/tickets
// @access  Private (Admin)
const getAllTicketsAdmin = async (req, res) => {
  try {
    const { status, category, search } = req.query;
    let query = {};
    if (status && status !== 'All') query.status = status;
    if (category && category !== 'All') query.category = category;
    if (search) {
      query.$or = [
        { ticketNumber: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        { studentName: { $regex: search, $options: 'i' } },
      ];
    }

    const tickets = await SupportTicket.find(query).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, count: tickets.length, tickets });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin: Update ticket status
// @route   PATCH /api/support/admin/tickets/:id/status
// @access  Private (Admin)
const updateTicketStatus = async (req, res) => {
  try {
    const { status, priority } = req.body;
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

    if (status) ticket.status = status;
    if (priority) ticket.priority = priority;

    await ticket.save();
    return res.status(200).json({ success: true, ticket });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createTicket,
  getMyTickets,
  replyToTicket,
  getAllTicketsAdmin,
  updateTicketStatus,
};
