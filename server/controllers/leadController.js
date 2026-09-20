const Lead = require('../models/Lead');
const Course = require('../models/Course');
const Batch = require('../models/Batch');
const { sendLeadConfirmationEmail, sendAdminLeadAlert } = require('../utils/emailService');

// @desc    Submit new lead / application
// @route   POST /api/leads/apply
// @access  Public
const createLead = async (req, res) => {
  try {
    const { fullName, email, phone, targetCourse, preferredBatch, marketingSource, notes } = req.body;

    if (!fullName || !email || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Full name, email, and phone number are required.',
      });
    }

    let courseObj = null;
    if (targetCourse) {
      courseObj = await Course.findById(targetCourse);
    }

    const newLead = await Lead.create({
      fullName,
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      targetCourse: targetCourse || undefined,
      preferredBatch: preferredBatch || 'Weekend Live (2 Hours)',
      marketingSource: marketingSource || 'Landing Page Direct Apply',
      notes: notes || '',
      status: 'New',
    });

    // Send emails asynchronously
    const courseTitle = courseObj ? courseObj.title : 'Selected Technology Track';
    sendLeadConfirmationEmail(newLead, courseTitle).catch(err => console.error('Confirmation email err:', err.message));
    sendAdminLeadAlert(newLead, courseTitle).catch(err => console.error('Admin alert email err:', err.message));

    return res.status(201).json({
      success: true,
      message: 'Application received successfully! Our admissions counselor will contact you soon.',
      leadId: newLead._id,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get all leads with filtering, search, pagination
// @route   GET /api/leads
// @access  Private (Counselor, SuperAdmin)
const getLeads = async (req, res) => {
  try {
    const { status, search, course, startDate, endDate, page = 1, limit = 50 } = req.query;

    const query = {};

    if (status && status !== 'All') {
      query.status = status;
    }

    if (course && course !== 'All') {
      query.targetCourse = course;
    }

    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { fullName: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
      ];
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
    }

    const skip = (Number(page) - 1) * Number(limit);

    const leads = await Lead.find(query)
      .populate('targetCourse', 'title slug badge duration pricing')
      .populate('assignedCounselor', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Lead.countDocuments(query);

    return res.status(200).json({
      success: true,
      count: leads.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      leads,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get single lead details
// @route   GET /api/leads/:id
// @access  Private
const getLeadById = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id)
      .populate('targetCourse')
      .populate('assignedCounselor', 'name email');

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found',
      });
    }

    return res.status(200).json({
      success: true,
      lead,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update lead status
// @route   PATCH /api/leads/:id/status
// @access  Private
const updateLeadStatus = async (req, res) => {
  try {
    const { status, assignedCounselor } = req.body;
    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found',
      });
    }

    if (status) lead.status = status;
    if (assignedCounselor) lead.assignedCounselor = assignedCounselor;

    await lead.save();

    return res.status(200).json({
      success: true,
      lead,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Add call log note
// @route   POST /api/leads/:id/call-logs
// @access  Private
const addCallLog = async (req, res) => {
  try {
    const { note, notes, callOutcome, outcome, followUpDate } = req.body;
    const resolvedNote = note || notes;
    const resolvedOutcome = callOutcome || outcome || 'Answered';

    if (!resolvedNote) {
      return res.status(400).json({
        success: false,
        message: 'Call log note is required',
      });
    }

    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found',
      });
    }

    const newLog = {
      caller: req.user ? req.user.name : 'Admissions Counselor',
      note: resolvedNote,
      callOutcome: resolvedOutcome,
      followUpDate: followUpDate ? new Date(followUpDate) : undefined,
      timestamp: new Date(),
    };

    lead.callLogs.unshift(newLog);
    if (lead.status === 'New') {
      lead.status = 'Contacted';
    }

    await lead.save();

    return res.status(201).json({
      success: true,
      callLogs: lead.callLogs,
      lead,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Convert lead to student in batch and create user account
// @route   POST /api/leads/:id/convert
// @access  Private (SuperAdmin, Counselor)
const convertToStudent = async (req, res) => {
  try {
    const { batchId, feePaid, totalFee, paymentStatus } = req.body;
    const lead = await Lead.findById(req.params.id).populate('targetCourse');
    const User = require('../models/User');
    const Enrollment = require('../models/Enrollment');
    const Progress = require('../models/Progress');
    const AuditLog = require('../models/AuditLog');

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found',
      });
    }

    let batch = null;
    if (batchId) {
      batch = await Batch.findById(batchId);
    } else {
      batch = await Batch.findOne({ course: lead.targetCourse?._id || lead.targetCourse }).sort({ startDate: 1 });
    }

    if (!batch) {
      // Auto-create active batch for the course
      const randomCode = 'AFT-COHORT-' + Math.floor(100 + Math.random() * 900);
      batch = await Batch.create({
        batchCode: randomCode,
        course: lead.targetCourse?._id || lead.targetCourse,
        startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        timing: 'Sat & Sun • 10:00 AM - 1:00 PM EST',
        maxCapacity: 25,
        enrolledStudents: [],
        status: 'Upcoming',
      });
    }

    const invoiceId = 'INV-' + Math.floor(100000 + Math.random() * 900000);
    const studentRecord = {
      studentName: lead.fullName,
      email: lead.email,
      phone: lead.phone,
      feePaid: Number(feePaid) || (lead.targetCourse?.pricing?.discountedPrice || 1899),
      totalFee: Number(totalFee) || (lead.targetCourse?.pricing?.discountedPrice || 1899),
      paymentStatus: paymentStatus || 'Paid',
      enrolledAt: new Date(),
      invoiceId,
    };

    batch.enrolledStudents.push(studentRecord);
    await batch.save();

    // Create or find student user account
    let studentUser = await User.findOne({ email: lead.email.toLowerCase() });
    if (!studentUser) {
      studentUser = await User.create({
        name: lead.fullName,
        email: lead.email.toLowerCase(),
        password: 'Password@123',
        phone: lead.phone,
        role: 'STUDENT',
        studentDetails: {
          enrollmentNumber: 'AFT-' + Math.floor(100000 + Math.random() * 900000),
          assignedBatch: batch._id,
          linkedLead: lead._id,
        },
      });
    }

    // Create enrollment
    if (lead.targetCourse) {
      await Enrollment.findOneAndUpdate(
        { student: studentUser._id, course: lead.targetCourse._id },
        {
          student: studentUser._id,
          course: lead.targetCourse._id,
          batch: batch._id,
          status: 'Active',
        },
        { upsert: true }
      );

      await Progress.findOneAndUpdate(
        { student: studentUser._id, course: lead.targetCourse._id },
        { $setOnInsert: { completedLessons: [], progressPercent: 0 } },
        { upsert: true }
      );
    }

    lead.status = 'Enrolled';
    lead.callLogs.unshift({
      caller: req.user ? req.user.name : 'System',
      note: `Converted to Student in cohort ${batch.batchCode}. Student Account: ${studentUser.email} (Temp Pass: Password@123). Invoice #${invoiceId}.`,
      callOutcome: 'Counseling Scheduled',
      timestamp: new Date(),
    });
    await lead.save();

    // Audit log
    await AuditLog.create({
      actor: req.user?._id,
      actorName: req.user ? req.user.name : 'Staff Counselor',
      actorRole: req.user ? req.user.role : 'COUNSELOR',
      action: 'LEAD_CONVERTED_TO_STUDENT',
      entity: 'Lead',
      entityId: lead._id.toString(),
      details: `Lead ${lead.fullName} converted to student in cohort ${batch.batchCode}`,
    });

    return res.status(200).json({
      success: true,
      message: `${lead.fullName} successfully converted to student! Student account and enrollment created.`,
      batchCode: batch.batchCode,
      student: studentRecord,
      accountEmail: studentUser.email,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Export leads as CSV
// @route   GET /api/leads/export/csv
// @access  Private
const exportLeadsCsv = async (req, res) => {
  try {
    const leads = await Lead.find().populate('targetCourse', 'title').sort({ createdAt: -1 });

    let csv = 'ID,Full Name,Email,Phone,Target Course,Preferred Batch,Status,Created At\n';

    leads.forEach((l) => {
      const courseTitle = l.targetCourse ? l.targetCourse.title.replace(/,/g, '') : 'General';
      const cleanName = l.fullName.replace(/,/g, '');
      csv += `${l._id},"${cleanName}","${l.email}","${l.phone}","${courseTitle}","${l.preferredBatch}","${l.status}","${l.createdAt.toISOString()}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="leads_export.csv"');
    return res.status(200).send(csv);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createLead,
  getLeads,
  getLeadById,
  updateLeadStatus,
  addCallLog,
  convertToStudent,
  exportLeadsCsv,
};
