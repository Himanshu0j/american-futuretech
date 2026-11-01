/**
 * Student-facing classroom API.
 *
 * The only source of truth for "which classes may I see" is the student's
 * active Enrollment. The controller never trusts a batch id from the client:
 * batches are derived from the enrollments first, and every single-class read
 * re-runs the same batch guard.
 *
 * Private data is stripped here, not in the browser:
 *   - a live meeting URL is only serialised while the join window is open;
 *   - a recording is only serialised once the class has ended;
 *   - draft classes never leave the server.
 */

const ClassSession = require('../models/ClassSession');
const Enrollment = require('../models/Enrollment');
const { checkBatchAccess, isEnrollmentCurrent, denyBatchResponse } = require('../utils/access');
const { getClassWindow } = require('../utils/classWindow');
const { sendError } = require('../utils/apiError');

/** The exact fields a student may receive, already gated by the window. */
const presentClass = (session, now) => {
  const window = getClassWindow(session, now);
  return {
    _id: session._id,
    title: session.title,
    description: session.description,
    sessionNumber: session.sessionNumber,
    instructor: session.instructor,
    assistantInstructor: session.assistantInstructor,
    classDate: session.classDate,
    startTime: session.startTime,
    endTime: session.endTime,
    timezone: session.timezone,
    startsAt: session.startsAt,
    endsAt: session.endsAt,
    deliveryMode: session.deliveryMode,
    meetingPlatform: session.meetingPlatform,
    status: session.status,
    thumbnail: session.thumbnail,
    attendanceRequired: session.attendanceRequired,
    // Derived, never stored: lets the UI print "Live now" without guessing.
    phase: window.phase,
    canJoin: window.canJoin,
    hasRecording: Boolean(session.recordingUrl) && window.canViewRecording,
    joinUrl: window.canJoin ? session.meetingUrl : '',
    recordingUrl: window.canViewRecording ? session.recordingUrl : '',
    materials: window.isVisible ? (session.materials || []) : [],
  };
};

// @desc   Classes for every batch the signed-in student is enrolled in
// @route  GET /api/lms/classes
const getMyClasses = async (req, res) => {
  try {
    const now = new Date();
    const enrollments = await Enrollment.find({ student: req.user._id, status: 'Active' })
      .populate('course', 'title slug thumbnail')
      .populate('batch', 'name batchCode timing instructor timezone')
      .lean();

    const usable = enrollments.filter((row) => row.batch && isEnrollmentCurrent(row, now));
    const batchIds = usable.map((row) => row.batch._id);
    if (!batchIds.length) {
      return res.status(200).json({
        success: true,
        classes: [],
        summary: { total: 0, upcoming: 0, live: 0, completed: 0, cancelled: 0 },
      });
    }

    const sessions = await ClassSession.find({
      batch: { $in: batchIds },
      status: { $in: ['Scheduled', 'Published', 'Completed', 'Cancelled'] },
      $or: [{ visibleFrom: null }, { visibleFrom: { $lte: now } }],
    })
      .sort({ startsAt: 1 })
      .lean();

    const enrollmentByBatch = new Map(usable.map((row) => [String(row.batch._id), row]));

    const classes = sessions.map((session) => {
      const enrollment = enrollmentByBatch.get(String(session.batch));
      return {
        ...presentClass(session, now),
        course: enrollment?.course
          ? {
              _id: enrollment.course._id,
              title: enrollment.course.title,
              slug: enrollment.course.slug,
              thumbnail: enrollment.course.thumbnail,
            }
          : null,
        batch: enrollment?.batch
          ? {
              _id: enrollment.batch._id,
              name: enrollment.batch.name,
              batchCode: enrollment.batch.batchCode,
              timing: enrollment.batch.timing,
            }
          : null,
      };
    });

    const summary = classes.reduce(
      (acc, item) => {
        acc.total += 1;
        if (item.phase === 'cancelled') acc.cancelled += 1;
        else if (item.phase === 'live') acc.live += 1;
        else if (item.phase === 'ended') acc.completed += 1;
        else acc.upcoming += 1;
        return acc;
      },
      { total: 0, upcoming: 0, live: 0, completed: 0, cancelled: 0 }
    );

    return res.status(200).json({ success: true, classes, summary });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc   One class, including materials/recording when allowed
// @route  GET /api/lms/classes/:id
const getClassDetails = async (req, res) => {
  try {
    const session = await ClassSession.findById(req.params.id).lean();
    if (!session) {
      return res.status(404).json({ success: false, message: 'Class not found.' });
    }

    // A draft class is invisible even to its own batch.
    if (session.status === 'Draft') {
      return res.status(404).json({ success: false, message: 'Class not found.' });
    }

    const access = await checkBatchAccess(req.user, session.batch);
    if (!access.allowed) return denyBatchResponse(res, access.reason);

    const now = new Date();
    const presented = presentClass(session, now);
    if (!presented.materials.length && !presented.canJoin && !presented.recordingUrl) {
      // Still a valid read: the class exists for this student, it simply has
      // nothing shared yet. Returning it is what lets the UI show "materials
      // will appear here" instead of a false 404.
    }

    // The classroom header names the course and batch, so send the same compact
    // shapes the list endpoint sends. Names come from the student's own
    // enrollment — a class id alone still cannot leak another batch's labels.
    const enrollment = await Enrollment.findOne({ student: req.user._id, batch: session.batch })
      .populate('course', 'title slug thumbnail')
      .populate('batch', 'name batchCode timing')
      .lean();

    return res.status(200).json({
      success: true,
      class: {
        ...presented,
        course: enrollment?.course
          ? {
              _id: enrollment.course._id,
              title: enrollment.course.title,
              slug: enrollment.course.slug,
              thumbnail: enrollment.course.thumbnail,
            }
          : null,
        batch: enrollment?.batch
          ? {
              _id: enrollment.batch._id,
              name: enrollment.batch.name,
              batchCode: enrollment.batch.batchCode,
              timing: enrollment.batch.timing,
            }
          : null,
      },
    });
  } catch (error) {
    return sendError(res, error);
  }
};

module.exports = { getMyClasses, getClassDetails };
