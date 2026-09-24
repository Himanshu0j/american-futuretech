const mongoose = require('mongoose');
const User = require('../models/User');
const Course = require('../models/Course');
const Batch = require('../models/Batch');
const Enrollment = require('../models/Enrollment');
const Progress = require('../models/Progress');
const Payment = require('../models/Payment');
const Certificate = require('../models/Certificate');
const AuditLog = require('../models/AuditLog');
const { generateSecurePassword, validatePassword } = require('../utils/passwords');

/**
 * Admin → Enrolled Students.
 *
 * Students are created here (never by public self-registration) and every
 * program, course, batch and LMS permission is an explicit assignment. Those
 * assignments are what the LMS access guard reads, so granting/removing access
 * here is the single switch that decides what a student can open.
 */

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const audit = (req, action, details, entityId) =>
  AuditLog.create({
    actor: req.user?._id,
    actorName: req.user?.name || 'Admin',
    actorRole: req.user?.role || 'ADMIN',
    action,
    entity: 'Student',
    entityId: String(entityId || ''),
    details,
  }).catch(() => {});

const toIdList = (value) => {
  if (!Array.isArray(value)) return null;
  return value
    .map((entry) => (typeof entry === 'object' && entry !== null ? entry._id || entry.id : entry))
    .filter((id) => mongoose.Types.ObjectId.isValid(String(id)))
    .map(String);
};

/** Assign (or re-assign) a student to a set of courses, keeping one Active enrollment each. */
const syncEnrollments = async (student, courseIds, batchId) => {
  const desired = courseIds || [];
  const existing = await Enrollment.find({ student: student._id });
  const existingByCourse = new Map(existing.map((e) => [String(e.course), e]));

  // Revoke access by cancelling enrollments for courses no longer assigned.
  for (const enrollment of existing) {
    if (!desired.includes(String(enrollment.course))) {
      enrollment.status = 'Cancelled';
      enrollment.batch = null;
      await enrollment.save();
    }
  }

  const assigned = [];
  for (const courseId of desired) {
    const current = existingByCourse.get(String(courseId));
    if (current) {
      current.status = 'Active';
      if (batchId !== undefined) current.batch = batchId || null;
      await current.save();
      assigned.push(current);
    } else {
      const created = await Enrollment.create({
        student: student._id,
        course: courseId,
        batch: batchId || null,
        status: 'Active',
      });
      assigned.push(created);
    }

    // Progress rows give the LMS a place to record completion.
    await Progress.findOneAndUpdate(
      { student: student._id, course: courseId },
      { $setOnInsert: { completedLessons: [], progressPercent: 0 } },
      { upsert: true },
    );
  }

  return assigned;
};

const buildStudentView = (user, { enrollments = [], progress = [] } = {}) => {
  const progressByCourse = new Map(progress.map((p) => [String(p.course), p]));
  const courses = enrollments
    .filter((e) => e.status === 'Active' && e.course)
    .map((e) => ({
      enrollmentId: e._id,
      courseId: e.course._id || e.course,
      title: e.course.title || '',
      slug: e.course.slug || '',
      duration: e.course.duration || '',
      status: e.status,
      batchId: e.batch?._id || e.batch || null,
      batchCode: e.batch?.batchCode || '',
      progressPercent: progressByCourse.get(String(e.course._id || e.course))?.progressPercent || 0,
    }));

  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone || '',
    role: user.role,
    isActive: user.isActive !== false,
    enrollmentNumber: user.studentDetails?.enrollmentNumber || '',
    targetCareer: user.studentDetails?.targetCareer || '',
    personalizedLearning: Boolean(user.studentDetails?.personalizedLearning),
    lmsAccess: user.studentDetails?.lmsAccess || null,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt || null,
    courses,
    courseIds: courses.map((c) => String(c.courseId)),
    batchId: user.studentDetails?.assignedBatch || null,
  };
};

// @desc    Admin: paginated student directory with search + filters
// @route   GET /api/students/admin
// @access  Private (STUDENTS_VIEW)
const listStudents = async (req, res) => {
  try {
    const { search, status, courseId, batchId, personalized, page, limit } = req.query;

    const query = { role: { $in: ['STUDENT', 'Student'] } };

    if (status === 'active') query.isActive = true;
    if (status === 'inactive') query.isActive = false;
    if (personalized === 'true') query['studentDetails.personalizedLearning'] = true;
    if (batchId && mongoose.Types.ObjectId.isValid(String(batchId))) {
      query['studentDetails.assignedBatch'] = String(batchId);
    }

    const term = String(search || '').trim();
    if (term) {
      const rx = { $regex: escapeRegex(term), $options: 'i' };
      query.$or = [{ name: rx }, { email: rx }, { 'studentDetails.enrollmentNumber': rx }, { phone: rx }];
    }

    if (courseId && mongoose.Types.ObjectId.isValid(String(courseId))) {
      const enrolledIds = await Enrollment.find({
        course: String(courseId),
        status: 'Active',
      }).distinct('student');
      query._id = { $in: enrolledIds };
    }

    const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 0, 0), 100);
    const parsedPage = Math.max(parseInt(page, 10) || 1, 1);

    const total = await User.countDocuments(query);
    let listQuery = User.find(query).select('-password').sort({ createdAt: -1 });
    if (parsedLimit > 0) listQuery = listQuery.skip((parsedPage - 1) * parsedLimit).limit(parsedLimit);
    const users = await listQuery.lean();

    const userIds = users.map((u) => u._id);
    const [enrollments, progress] = await Promise.all([
      Enrollment.find({ student: { $in: userIds } })
        .populate('course', 'title slug duration')
        .populate('batch', 'batchCode')
        .lean(),
      Progress.find({ student: { $in: userIds } }).select('student course progressPercent').lean(),
    ]);

    const students = users.map((user) =>
      buildStudentView(
        user,
        {
          enrollments: enrollments.filter((e) => String(e.student) === String(user._id)),
          progress: progress.filter((p) => String(p.student) === String(user._id)),
        },
      ),
    );

    return res.status(200).json({
      success: true,
      count: students.length,
      students,
      pagination: {
        page: parsedPage,
        pageSize: parsedLimit || total,
        total,
        totalPages: parsedLimit ? Math.max(Math.ceil(total / parsedLimit), 1) : 1,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin: full student profile (assignments, payments, progress, certificates)
// @route   GET /api/students/admin/:id
// @access  Private (STUDENTS_VIEW)
const getStudentDetail = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password').lean();
    if (!user || !String(user.role || '').toUpperCase().includes('STUDENT')) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const [enrollments, progress, payments, certificates, batch] = await Promise.all([
      Enrollment.find({ student: user._id })
        .populate('course', 'title slug duration pricing')
        .populate('batch', 'batchCode startDate timing')
        .lean(),
      Progress.find({ student: user._id }).lean(),
      Payment.find({ $or: [{ student: user._id }, { email: user.email }] }).sort({ createdAt: -1 }).lean(),
      Certificate.find({ student: user._id }).lean(),
      user.studentDetails?.assignedBatch
        ? Batch.findById(user.studentDetails.assignedBatch).lean()
        : Promise.resolve(null),
    ]);

    return res.status(200).json({
      success: true,
      student: buildStudentView(user, { enrollments, progress }),
      detail: {
        enrollments,
        progress,
        payments,
        certificates,
        batch,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin: create a student with program/course/batch/LMS assignments
// @route   POST /api/students/admin
// @access  Private (STUDENTS_EDIT)
const createStudent = async (req, res) => {
  try {
    const {
      name, email, phone, password, targetCareer,
      courseIds, batchId, personalizedLearning, lmsAccess, isActive, sendInvite,
    } = req.body || {};

    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Student name and email are required.' });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    // A hand-typed password must clear the same policy the old signup form
    // enforced. Without this, the admin path was a way to seed a student
    // account with something as guessable as "admin123".
    if (password) {
      const policy = validatePassword(String(password), { email: normalizedEmail, name });
      if (!policy.valid) {
        return res.status(400).json({ success: false, message: policy.errors[0], errors: policy.errors });
      }
    }

    // A generated password is shown to the admin ONCE and only the hash is
    // stored — the plaintext never touches the database.
    const generated = !password;
    const plainPassword = password || generateSecurePassword();

    const assignedCourseIds = toIdList(courseIds) || [];

    const student = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      password: plainPassword,
      phone: phone || '',
      role: 'STUDENT',
      isActive: isActive !== false,
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`,
      studentDetails: {
        enrollmentNumber: `AFT-${Math.floor(100000 + Math.random() * 900000)}`,
        assignedBatch: batchId || null,
        targetCareer: targetCareer || '',
        personalizedLearning: Boolean(personalizedLearning),
        lmsAccess: {
          classroom: lmsAccess?.classroom !== false,
          recordings: lmsAccess?.recordings !== false,
          assignments: lmsAccess?.assignments !== false,
          certificates: lmsAccess?.certificates !== false,
          support: lmsAccess?.support !== false,
          careerResources: lmsAccess?.careerResources !== false,
          ...(lmsAccess || {}),
        },
      },
    });

    await syncEnrollments(student, assignedCourseIds, batchId || null);

    if (batchId && mongoose.Types.ObjectId.isValid(String(batchId))) {
      const batch = await Batch.findById(batchId);
      if (batch) {
        const already = (batch.enrolledStudents || []).some(
          (row) => String(row.email || '').toLowerCase() === normalizedEmail,
        );
        if (!already) {
          batch.enrolledStudents.push({
            studentName: student.name,
            email: student.email,
            phone: student.phone,
            feePaid: 0,
            totalFee: 0,
            paymentStatus: 'Pending',
          });
          await batch.save();
        }
      }
    }

    await audit(
      req,
      'STUDENT_CREATED',
      `Created student ${student.name} (${student.email}) with ${assignedCourseIds.length} course assignment(s)`,
      student._id,
    );

    // Read the assignments back so the response proves what was really stored.
    const savedEnrollments = await Enrollment.find({ student: student._id })
      .populate('course', 'title slug duration')
      .populate('batch', 'batchCode')
      .lean();

    return res.status(201).json({
      success: true,
      student: buildStudentView(student.toObject ? student.toObject() : student, { enrollments: savedEnrollments }),
      // Returned once so the admin can hand credentials over securely.
      credentials: generated
        ? { email: student.email, temporaryPassword: plainPassword, inviteEmailRequested: Boolean(sendInvite) }
        : null,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Admin: update a student's profile, assignments and LMS access
// @route   PUT /api/students/admin/:id
// @access  Private (STUDENTS_EDIT)
const updateStudent = async (req, res) => {
  try {
    const student = await User.findById(req.params.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const {
      name, email, phone, targetCareer, courseIds, batchId,
      personalizedLearning, lmsAccess, isActive,
    } = req.body || {};

    if (name !== undefined) student.name = String(name).trim();
    if (email !== undefined) {
      const normalizedEmail = String(email).toLowerCase().trim();
      if (normalizedEmail !== student.email) {
        const clash = await User.findOne({ email: normalizedEmail, _id: { $ne: student._id } });
        if (clash) return res.status(409).json({ success: false, message: 'That email is already in use.' });
        student.email = normalizedEmail;
      }
    }
    if (phone !== undefined) student.phone = phone;
    if (isActive !== undefined) student.isActive = isActive !== false;

    student.studentDetails = student.studentDetails || {};
    if (targetCareer !== undefined) student.studentDetails.targetCareer = targetCareer;
    if (batchId !== undefined) student.studentDetails.assignedBatch = batchId || null;
    if (personalizedLearning !== undefined) {
      student.studentDetails.personalizedLearning = Boolean(personalizedLearning);
    }
    if (lmsAccess !== undefined) {
      student.studentDetails.lmsAccess = { ...(student.studentDetails.lmsAccess || {}), ...lmsAccess };
    }

    await student.save();

    const courseList = toIdList(courseIds);
    if (courseList) {
      await syncEnrollments(student, courseList, batchId !== undefined ? batchId : student.studentDetails.assignedBatch);
    }

    await audit(req, 'STUDENT_UPDATED', `Updated student ${student.email}`, student._id);

    const enrollments = await Enrollment.find({ student: student._id })
      .populate('course', 'title slug duration')
      .populate('batch', 'batchCode')
      .lean();

    return res.status(200).json({
      success: true,
      student: buildStudentView(student.toObject(), { enrollments }),
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Admin: revoke every course assignment (student keeps the account)
// @route   DELETE /api/students/admin/:id/access
// @access  Private (STUDENTS_EDIT)
const revokeAccess = async (req, res) => {
  try {
    const student = await User.findById(req.params.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    await syncEnrollments(student, [], null);
    await audit(req, 'STUDENT_ACCESS_REVOKED', `Revoked all course access for ${student.email}`, student._id);

    return res.status(200).json({ success: true, message: 'All course access revoked for this student.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin: issue new credentials (rotates the password, returns it once)
// @route   POST /api/students/admin/:id/reset-access
// @access  Private (STUDENTS_EDIT)
const resetStudentAccess = async (req, res) => {
  try {
    const student = await User.findById(req.params.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const temporaryPassword = generateSecurePassword();
    student.password = temporaryPassword;
    student.failedLoginAttempts = 0;
    student.lockUntil = null;
    await student.save();

    // Rotating the password invalidates every existing session automatically
    // (tokens issued before passwordChangedAt are rejected).
    await audit(req, 'STUDENT_CREDENTIALS_RESET', `Issued new credentials for ${student.email}`, student._id);

    return res.status(200).json({
      success: true,
      credentials: { email: student.email, temporaryPassword },
      message: 'New credentials generated. Share them securely — they are shown only once.',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin: batches + courses for the assignment wizard
// @route   GET /api/students/admin/options
// @access  Private (STUDENTS_VIEW)
const getAssignmentOptions = async (req, res) => {
  try {
    const [courses, batches] = await Promise.all([
      Course.find().select('title slug category duration viewOptions').sort({ title: 1 }).lean(),
      Batch.find().populate('course', 'title').sort({ startDate: -1 }).lean(),
    ]);

    return res.status(200).json({
      success: true,
      courses,
      batches: batches.map((batch) => ({
        _id: batch._id,
        batchCode: batch.batchCode,
        courseTitle: batch.course?.title || '',
        startDate: batch.startDate,
        timing: batch.timing,
        status: batch.status,
        enrolled: (batch.enrolledStudents || []).length,
        maxCapacity: batch.maxCapacity,
      })),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  listStudents,
  getStudentDetail,
  createStudent,
  updateStudent,
  revokeAccess,
  resetStudentAccess,
  getAssignmentOptions,
};
