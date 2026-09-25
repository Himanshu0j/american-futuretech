/**
 * Admin certificate management.
 *
 * Certificates are normally issued automatically when a student finishes every
 * published lesson (see lmsController.completeLesson). This controller covers
 * the cases automation cannot: an offline/cohort completion that needs the
 * credential issued by hand, and withdrawing a credential that should no longer
 * verify.
 *
 * Revocation is recorded on the document rather than deleting it, so the public
 * registry can distinguish "never issued" (404) from "issued, then withdrawn".
 */

const mongoose = require('mongoose');
const User = require('../models/User');
const Course = require('../models/Course');
const Lesson = require('../models/Lesson');
const Enrollment = require('../models/Enrollment');
const Progress = require('../models/Progress');
const Certificate = require('../models/Certificate');
const LmsSetting = require('../models/LmsSetting');
const AuditLog = require('../models/AuditLog');
const { sendError } = require('../utils/apiError');

const toId = (value) => (mongoose.Types.ObjectId.isValid(value) ? value : null);

const logAudit = async (req, action, details, entityId) => {
  try {
    await AuditLog.create({
      actorName: req.user?.name || 'System',
      actorRole: req.user?.role || 'ADMIN',
      action,
      entity: 'Certificate',
      entityId: entityId ? String(entityId) : undefined,
      details,
    });
  } catch {
    /* auditing must never break the operation */
  }
};

/** A registry id that is not already taken. */
const generateCertificateId = async () => {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const candidate = `AFT-CERT-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    const clash = await Certificate.exists({ certificateId: candidate });
    if (!clash) return candidate;
  }
  // Fall back to a timestamp-based id rather than failing the request.
  return `AFT-CERT-${Date.now().toString(36).toUpperCase()}`;
};

// @desc    List issued certificates
// @route   GET /api/admin/certificates
// @access  Private (LMS_VIEW)
const listCertificates = async (req, res) => {
  try {
    const { search, courseId, status } = req.query;
    const query = {};
    if (toId(courseId)) query.course = courseId;
    if (status === 'revoked') query.revokedAt = { $ne: null };
    if (status === 'issued') query.revokedAt = null;
    if (status === 'sample') query.isSample = true;

    let rows = await Certificate.find(query)
      .populate('student', 'name email')
      .populate('course', 'title slug')
      .sort({ issueDate: -1 })
      .limit(500)
      .lean();

    if (search) {
      const needle = String(search).toLowerCase();
      rows = rows.filter(
        (row) =>
          (row.certificateId || '').toLowerCase().includes(needle) ||
          (row.studentName || '').toLowerCase().includes(needle) ||
          (row.student?.name || '').toLowerCase().includes(needle) ||
          (row.student?.email || '').toLowerCase().includes(needle) ||
          (row.courseTitle || '').toLowerCase().includes(needle)
      );
    }

    const certificates = rows.map((row) => ({
      id: row._id,
      certificateId: row.certificateId,
      studentId: row.student?._id,
      studentName: row.studentName || row.student?.name || 'Unknown',
      studentEmail: row.student?.email || '',
      courseId: row.course?._id,
      courseTitle: row.courseTitle || row.course?.title || 'Unknown course',
      grade: row.grade,
      issueDate: row.issueDate,
      verificationUrl: row.verificationUrl,
      isSample: Boolean(row.isSample),
      revoked: Boolean(row.revokedAt),
      revokedAt: row.revokedAt || null,
      revokedReason: row.revokedReason || '',
    }));

    return res.status(200).json({ success: true, count: certificates.length, certificates });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc    Students who finished a course but have no certificate yet
// @route   GET /api/admin/certificates/eligibility
// @access  Private (LMS_VIEW)
const listEligibility = async (req, res) => {
  try {
    const { courseId } = req.query;
    const query = { isCompleted: true };
    if (toId(courseId)) query.course = courseId;

    const rows = await Progress.find(query)
      .populate('student', 'name email isActive')
      .populate('course', 'title')
      .sort({ completionDate: -1 })
      .limit(500)
      .lean();

    const existing = await Certificate.find({ revokedAt: null }).select('student course').lean();
    const issuedKeys = new Set(existing.map((cert) => `${cert.student}-${cert.course}`));

    const eligible = rows
      .filter((row) => !issuedKeys.has(`${row.student?._id}-${row.course?._id}`))
      .map((row) => ({
        studentId: row.student?._id,
        studentName: row.student?.name || 'Unknown',
        studentEmail: row.student?.email || '',
        courseId: row.course?._id,
        courseTitle: row.course?.title || 'Unknown course',
        progressPercent: row.progressPercent || 0,
        completionDate: row.completionDate || null,
      }));

    return res.status(200).json({ success: true, count: eligible.length, eligible });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc    Issue a certificate by hand
// @route   POST /api/admin/certificates/issue
// @access  Private (LMS_CERTIFICATE_ISSUE)
const issueCertificate = async (req, res) => {
  try {
    const { studentId, courseId, grade } = req.body || {};
    if (!toId(studentId) || !toId(courseId)) {
      return res.status(400).json({ success: false, message: 'A valid studentId and courseId are required.' });
    }

    const [student, course] = await Promise.all([User.findById(studentId), Course.findById(courseId)]);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

    const settings = (await LmsSetting.findOne()) || {};

    const existing = await Certificate.findOne({ student: student._id, course: course._id });
    if (existing && !existing.revokedAt) {
      return res.status(200).json({ success: true, alreadyIssued: true, certificate: existing });
    }

    // A re-issue of an existing record keeps its registry id, so the audit trail
    // (and anything already printed with that id) stays traceable. Only a brand
    // new student/course pair gets a fresh id.
    const certificateId = existing ? existing.certificateId : await generateCertificateId();

    const payload = {
      certificateId,
      student: student._id,
      studentName: student.name,
      course: course._id,
      courseTitle: course.title,
      issueDate: new Date(),
      grade: grade || settings.certificateGrade || 'Honor Distinction',
      accreditationBody:
        settings.certificateAccreditationBody ||
        'American FutureTech Institute of Advanced Technologies (Wyoming, USA)',
      verificationUrl: `/certificate/${certificateId}`,
      isSample: false,
      revokedAt: null,
      revokedBy: '',
      revokedReason: '',
    };

    let certificate;
    if (existing) {
      certificate = await Certificate.findByIdAndUpdate(existing._id, payload, { new: true, runValidators: true });
    } else {
      certificate = await Certificate.create(payload);
    }

    const enrollment = await Enrollment.findOne({ student: student._id, course: course._id });
    if (enrollment) {
      enrollment.certificateIssued = true;
      enrollment.certificate = certificate._id;
      if (enrollment.status !== 'Cancelled') enrollment.status = 'Completed';
      enrollment.completedAt = enrollment.completedAt || new Date();
      await enrollment.save();
    }

    await logAudit(req, 'CERTIFICATE_ISSUED', `${student.name} — ${course.title} (${certificateId})`, certificate._id);
    return res.status(201).json({ success: true, certificate });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc    Revoke a certificate
// @route   POST /api/admin/certificates/:id/revoke
// @access  Private (LMS_CERTIFICATE_REVOKE)
const revokeCertificate = async (req, res) => {
  try {
    const reason = String(req.body?.reason || '').trim();
    const certificate = await Certificate.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          revokedAt: new Date(),
          revokedBy: req.user?.name || req.user?.email || 'Admin',
          revokedReason: reason,
        },
      },
      { new: true }
    );
    if (!certificate) return res.status(404).json({ success: false, message: 'Certificate not found' });

    await Enrollment.updateOne(
      { certificate: certificate._id },
      { $set: { certificateIssued: false } }
    );

    await logAudit(
      req,
      'CERTIFICATE_REVOKED',
      `${certificate.certificateId} revoked${reason ? ` — ${reason}` : ''}`,
      certificate._id
    );
    return res.status(200).json({ success: true, certificate });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc    Reinstate a previously revoked certificate
// @route   POST /api/admin/certificates/:id/reinstate
// @access  Private (LMS_CERTIFICATE_ISSUE)
const reinstateCertificate = async (req, res) => {
  try {
    const certificate = await Certificate.findByIdAndUpdate(
      req.params.id,
      { $set: { revokedAt: null, revokedBy: '', revokedReason: '' } },
      { new: true }
    );
    if (!certificate) return res.status(404).json({ success: false, message: 'Certificate not found' });

    await Enrollment.updateOne({ certificate: certificate._id }, { $set: { certificateIssued: true } });

    await logAudit(req, 'CERTIFICATE_REINSTATED', `${certificate.certificateId} reinstated`, certificate._id);
    return res.status(200).json({ success: true, certificate });
  } catch (error) {
    return sendError(res, error);
  }
};

module.exports = {
  listCertificates,
  listEligibility,
  issueCertificate,
  revokeCertificate,
  reinstateCertificate,
};
