const Batch = require('../models/Batch');
const { sendError } = require('../utils/apiError');

// @desc    Get all confirmed students across batches
// @route   GET /api/students
// @access  Private (Counselor, SuperAdmin)
const getAllStudents = async (req, res) => {
  try {
    const batches = await Batch.find().populate('course', 'title slug pricing');

    const studentList = [];
    batches.forEach((batch) => {
      batch.enrolledStudents.forEach((st) => {
        studentList.push({
          _id: st._id,
          studentName: st.studentName,
          email: st.email,
          phone: st.phone,
          courseTitle: batch.course ? batch.course.title : 'Program',
          batchCode: batch.batchCode,
          batchId: batch._id,
          feePaid: st.feePaid,
          totalFee: st.totalFee,
          paymentStatus: st.paymentStatus,
          invoiceId: st.invoiceId,
          enrolledAt: st.enrolledAt,
        });
      });
    });

    studentList.sort((a, b) => new Date(b.enrolledAt) - new Date(a.enrolledAt));

    return res.status(200).json({
      success: true,
      count: studentList.length,
      students: studentList,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc    Update student payment status
// @route   PATCH /api/students/:batchId/:studentId/payment
// @access  Private (SuperAdmin)
const updateStudentPayment = async (req, res) => {
  try {
    const { batchId, studentId } = req.params;
    const { paymentStatus, feePaid } = req.body;

    const batch = await Batch.findById(batchId);
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found',
      });
    }

    const student = batch.enrolledStudents.id(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found in batch',
      });
    }

    if (paymentStatus) student.paymentStatus = paymentStatus;
    if (feePaid !== undefined) student.feePaid = Number(feePaid);

    await batch.save();

    return res.status(200).json({
      success: true,
      message: 'Student payment status updated',
      student,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc    Get dynamic invoice data for printing/downloading
// @route   GET /api/students/:invoiceId/invoice
// @access  Private
const getStudentInvoice = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const batch = await Batch.findOne({ 'enrolledStudents.invoiceId': invoiceId }).populate('course');

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found',
      });
    }

    const student = batch.enrolledStudents.find((s) => s.invoiceId === invoiceId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student record not found for invoice',
      });
    }

    // IDOR protection: Verify requester is admin/counselor or the owning student
    const role = (req.user?.role || '').toUpperCase();
    const isAdmin = ['SUPERADMIN', 'ADMIN', 'COUNSELOR'].includes(role);
    if (!isAdmin && req.user?.email?.toLowerCase() !== student.email?.toLowerCase()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You are not authorized to view another student\'s invoice.',
      });
    }

    const invoiceData = {
      invoiceNumber: student.invoiceId,
      issueDate: student.enrolledAt,
      dueDate: student.enrolledAt,
      company: {
        name: 'American FutureTech Inc.',
        address: '500 Technology Square, Suite 400',
        city: 'Cambridge, MA 02139, USA',
        email: 'billing@americanfuturetech.com',
        website: 'https://americanfuturetech.com',
      },
      student: {
        name: student.studentName,
        email: student.email,
        phone: student.phone,
      },
      item: {
        description: `Enrollment in ${batch.course?.title || 'Certification Program'} (${batch.batchCode})`,
        duration: batch.course?.duration || '6 Months',
        amount: student.totalFee,
        paid: student.feePaid,
        balance: Math.max(0, student.totalFee - student.feePaid),
        status: student.paymentStatus,
      },
    };

    return res.status(200).json({
      success: true,
      invoice: invoiceData,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

module.exports = {
  getAllStudents,
  updateStudentPayment,
  getStudentInvoice,
};
