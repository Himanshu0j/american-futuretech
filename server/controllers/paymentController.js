const Payment = require('../models/Payment');
const Course = require('../models/Course');
const Batch = require('../models/Batch');
const User = require('../models/User');
const Enrollment = require('../models/Enrollment');
const Progress = require('../models/Progress');
const AuditLog = require('../models/AuditLog');

// @desc    Process student checkout (Seat deposit or full tuition)
// @route   POST /api/payments/checkout
// @access  Public (or Authenticated)
const processCheckout = async (req, res) => {
  try {
    const {
      courseId,
      batchId,
      tier = 'deposit',
      fullName,
      email,
      phone,
      couponCode,
      paymentMethod = 'Credit Card (Stripe Verified)',
    } = req.body;

    if (!courseId || !fullName || !email) {
      return res.status(400).json({ success: false, message: 'Please provide course, full name, and email.' });
    }

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

    let amount = tier === 'deposit' ? 99 : (course.pricing?.discountedPrice || 1899);
    let originalPrice = amount;
    let discountAmount = 0;

    // Validate coupon codes
    if (couponCode) {
      const code = couponCode.toUpperCase().trim();
      if (code === 'FUTURETECH10' || code === 'WELCOME10') {
        discountAmount = Math.round(amount * 0.1);
        amount = amount - discountAmount;
      } else if (code === 'AI2026' || code === 'TECH50') {
        discountAmount = 50;
        amount = Math.max(49, amount - discountAmount);
      }
    }

    // 1. Find or create Student User account
    let student = await User.findOne({ email: email.toLowerCase() });
    let isNewStudent = false;

    if (!student) {
      isNewStudent = true;
      const enrollmentNo = 'AFT-' + Math.floor(100000 + Math.random() * 900000);
      student = await User.create({
        name: fullName,
        email: email.toLowerCase(),
        password: 'Password@123', // Default temporary pass
        phone: phone || '',
        role: 'STUDENT',
        isActive: true,
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(fullName)}`,
        studentDetails: {
          enrollmentNumber: enrollmentNo,
          assignedBatch: batchId || null,
        },
      });
    }

    // 2. Generate unique IDs
    const transactionId = 'TXN-' + Date.now() + '-' + Math.floor(1000 + Math.random() * 9000);
    const invoiceNumber = 'INV-' + new Date().getFullYear() + '-' + Math.floor(10000 + Math.random() * 90000);

    // 3. Create Payment record
    const payment = await Payment.create({
      student: student._id,
      studentName: student.name,
      email: student.email,
      phone: phone || student.phone || '',
      course: course._id,
      courseTitle: course.title,
      batch: batchId || null,
      tier,
      amount,
      originalPrice,
      discountAmount,
      couponCode: couponCode || '',
      currency: 'USD',
      status: 'Paid',
      transactionId,
      invoiceNumber,
      paymentMethod,
    });

    // 4. Create or update Enrollment
    let enrollment = await Enrollment.findOne({ student: student._id, course: course._id });
    if (!enrollment) {
      enrollment = await Enrollment.create({
        student: student._id,
        course: course._id,
        batch: batchId || null,
        payment: payment._id,
        status: 'Active',
      });
    }

    // 5. Initialize Progress
    await Progress.findOneAndUpdate(
      { student: student._id, course: course._id },
      { $setOnInsert: { completedLessons: [], progressPercent: 0 } },
      { upsert: true }
    );

    // 6. Update Batch seats if selected
    if (batchId) {
      await Batch.findByIdAndUpdate(batchId, {
        $push: {
          enrolledStudents: {
            studentName: student.name,
            email: student.email,
            phone: student.phone,
            feePaid: amount,
            totalFee: course.pricing?.discountedPrice || 1899,
            paymentStatus: tier === 'deposit' ? 'Partial' : 'Paid',
            invoiceId: invoiceNumber,
          },
        },
      });
    }

    // 7. Audit log
    await AuditLog.create({
      actor: student._id,
      actorName: student.name,
      actorRole: student.role,
      action: 'PAYMENT_AND_ENROLLMENT_COMPLETED',
      entity: 'Payment',
      entityId: payment._id.toString(),
      details: `Paid $${amount} for ${course.title} via ${tier} mode. Invoice #${invoiceNumber}`,
    });

    return res.status(200).json({
      success: true,
      message: tier === 'deposit'
        ? '🎉 $99 Seat Reservation Confirmed! Your cohort seat is guaranteed.'
        : '🎉 Full Tuition Enrollment Confirmed! Full access granted.',
      payment: {
        id: payment._id,
        transactionId,
        invoiceNumber,
        amount,
        tier,
        courseTitle: course.title,
        studentName: student.name,
        email: student.email,
        paymentDate: payment.createdAt,
      },
      isNewStudent,
      tempPassword: isNewStudent ? 'Password@123' : null,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all payments (Admin)
// @route   GET /api/payments
// @access  Private (Admin)
const getAllPayments = async (req, res) => {
  try {
    const { status, search } = req.query;
    let query = {};
    if (status && status !== 'All') query.status = status;
    if (search) {
      query.$or = [
        { studentName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { transactionId: { $regex: search, $options: 'i' } },
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { courseTitle: { $regex: search, $options: 'i' } },
      ];
    }

    const payments = await Payment.find(query).sort({ createdAt: -1 });
    const totalRevenue = payments.reduce((acc, curr) => curr.status === 'Paid' ? acc + curr.amount : acc, 0);

    return res.status(200).json({
      success: true,
      payments,
      totalRevenue,
      count: payments.length,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get logged-in student's payment receipts
// @route   GET /api/payments/my-payments
// @access  Private (Student)
const getMyPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ student: req.user._id }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, payments });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get printable invoice data
// @route   GET /api/payments/invoice/:invoiceNumber
// @access  Public / Private
const getInvoiceDetails = async (req, res) => {
  try {
    const payment = await Payment.findOne({ invoiceNumber: req.params.invoiceNumber })
      .populate('course')
      .populate('batch');

    if (!payment) return res.status(404).json({ success: false, message: 'Invoice not found' });

    return res.status(200).json({
      success: true,
      invoice: payment,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  processCheckout,
  getAllPayments,
  getMyPayments,
  getInvoiceDetails,
};
