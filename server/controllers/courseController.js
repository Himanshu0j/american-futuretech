const crypto = require('crypto');
const Course = require('../models/Course');
const AuditLog = require('../models/AuditLog');
const Module = require('../models/Module');
const Lesson = require('../models/Lesson');
const Quiz = require('../models/Quiz');
const Enrollment = require('../models/Enrollment');
const { syncCourseCurriculum, normalizeCurriculumForEmbed } = require('../utils/curriculumSync');
const { sendError } = require('../utils/apiError');
const publicCache = require('../utils/publicCache');

// How long a public course list may be reused before MongoDB is asked again.
// The navbar fetches /api/courses on EVERY page of the site (73 kB live, ~1.3 s
// from Atlas), so a visitor used to pay a database round trip for the menu on
// top of the settings document. Admin writes drop the cache below, so a new or
// edited course is visible immediately.
const PUBLISHED_COURSES_TTL_MS = 30 * 1000;

// @desc    Get published courses for landing page
// @route   GET /api/courses
// @access  Public
const getPublishedCourses = async (req, res) => {
  try {
    const { body } = await publicCache.read(publicCache.CACHE_KEYS.publishedCourses, PUBLISHED_COURSES_TTL_MS, async () => {
      const courses = await Course.find({ isPublished: true }).sort({ createdAt: 1 });
      return { success: true, count: courses.length, courses };
    });

    // `no-cache` means "store it, but revalidate before reuse": the browser's
    // own copy then costs a bodiless 304 instead of another 73 kB download.
    res.set('Cache-Control', 'no-cache');
    res.set('ETag', `W/"${crypto.createHash('sha1').update(JSON.stringify(body)).digest('base64url')}"`);
    return res.status(200).json(body);
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc    Get all courses (CMS)
// @route   GET /api/courses/admin/all
// @access  Private
const getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find().sort({ createdAt: -1 });

    // The module count must come from the real curriculum collection, not the
    // embedded mirror — otherwise the CMS listed "0 Modules" for courses whose
    // modules the website was happily rendering.
    const counts = await Module.aggregate([
      { $group: { _id: '$course', total: { $sum: 1 } } },
    ]);
    const countByCourse = new Map(counts.map((c) => [String(c._id), c.total]));

    return res.status(200).json({
      success: true,
      count: courses.length,
      courses: courses.map((c) => ({
        ...c.toObject(),
        moduleCount: countByCourse.get(String(c._id)) || 0,
      })),
    });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc    Get single course by slug
// @route   GET /api/courses/:slug
// @access  Public
const getCourseBySlug = async (req, res) => {
  try {
    const course = await Course.findOne({ slug: req.params.slug });
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }
    return res.status(200).json({
      success: true,
      course,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc    Create course
// @route   POST /api/courses
// @access  Private (SuperAdmin, Counselor)
const createCourse = async (req, res) => {
  try {
    const { title, slug, category, badge, cardTheme, duration, pricing, highlights, curriculum, brochureUrl, isPublished, seatsUrgencyText, viewOptions, eligibility, tools, toolsTitle, toolsSubtitle, capstoneProjects, thumbnail, heroImage, advantageImages, credentialLogo, credentialTitle, credentialSubtitle, certificateImage } = req.body;

    // Without a title this used to throw on `title.toLowerCase()` and answer
    // 500; an incomplete form is the caller's mistake and must be a 400.
    if (!title || !String(title).trim()) {
      return res.status(400).json({ success: false, message: 'Course title is required.' });
    }

    const courseSlug = slug || String(title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const existing = await Course.findOne({ slug: courseSlug });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Course with this slug or title already exists',
      });
    }

    const course = await Course.create({
      title,
      slug: courseSlug,
      category,
      badge,
      cardTheme: cardTheme || 'cyan',
      duration,
      pricing,
      highlights,
      curriculum: normalizeCurriculumForEmbed(curriculum),
      brochureUrl,
      isPublished: isPublished !== undefined ? isPublished : true,
      seatsUrgencyText,
      // Per-course "Choose your learning experience" ticks + the eligibility block.
      // Without these the create call silently dropped them and the admin's
      // ticks appeared to "save" but never reached the course page.
      viewOptions,
      eligibility,
      // Per-course card image, hero image, advantage-card artwork + "Tools
      // Covered" block + capstone cards.
      thumbnail,
      heroImage,
      advantageImages,
      // Hero credential block (partner mark + wording + certificate artwork).
      credentialLogo,
      credentialTitle,
      credentialSubtitle,
      certificateImage,
      toolsTitle,
      toolsSubtitle,
      tools,
      capstoneProjects,
    });

    // Mirror the composer's modules into the real curriculum the site renders.
    let curriculumSummary = null;
    if (curriculum !== undefined) {
      curriculumSummary = await syncCourseCurriculum(course._id, curriculum);
    }

    await AuditLog.create({
      actor: req.user?._id,
      actorName: req.user?.name || 'Administrator',
      actorRole: req.user?.role || 'ADMIN',
      action: 'COURSE_CREATED',
      entity: 'Course',
      entityId: course._id.toString(),
      details: `Created course: ${course.title} (${course.slug})`,
    });

    publicCache.invalidate(publicCache.CACHE_KEYS.publishedCourses);

    return res.status(201).json({
      success: true,
      course,
      curriculumSummary,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc    Update course
// @route   PUT /api/courses/:id
// @access  Private (SuperAdmin)
const updateCourse = async (req, res) => {
  try {
    let course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    // The module composer edits `curriculum`; push it into the Module/Lesson
    // collections that the course page and the student LMS actually read.
    const { curriculum } = req.body || {};
    const coursePatch = { ...req.body };
    delete coursePatch.curriculum;

    course = await Course.findByIdAndUpdate(req.params.id, coursePatch, {
      new: true,
      runValidators: true,
    });

    let curriculumSummary = null;
    if (curriculum !== undefined) {
      curriculumSummary = await syncCourseCurriculum(course._id, curriculum);
      // Keep the embedded mirror in step for anything still reading it.
      course.curriculum = normalizeCurriculumForEmbed(curriculum);
      await course.save();
    }

    await AuditLog.create({
      actor: req.user?._id,
      actorName: req.user?.name || 'Administrator',
      actorRole: req.user?.role || 'ADMIN',
      action: 'COURSE_UPDATED',
      entity: 'Course',
      entityId: course._id.toString(),
      details: `Updated course: ${course.title}`,
    });

    publicCache.invalidate(publicCache.CACHE_KEYS.publishedCourses);

    return res.status(200).json({
      success: true,
      course,
      curriculumSummary,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc    Toggle badge / publish status
// @route   PATCH /api/courses/:id/badge
// @access  Private (SuperAdmin)
const toggleBadge = async (req, res) => {
  try {
    const { badge, isPublished } = req.body;
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    if (badge !== undefined) course.badge = badge;
    if (isPublished !== undefined) course.isPublished = isPublished;

    await course.save();
    publicCache.invalidate(publicCache.CACHE_KEYS.publishedCourses);

    return res.status(200).json({
      success: true,
      course,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc    Delete course
// @route   DELETE /api/courses/:id
// @access  Private (SuperAdmin)
const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    // A course with real students must never vanish underneath them. Hiding it
    // (isPublished = false) takes it off the public site and keeps every
    // enrollment, certificate and log intact — so that is what we suggest.
    const enrolled = await Enrollment.countDocuments({ course: course._id });
    if (enrolled > 0) {
      return res.status(400).json({
        success: false,
        message:
          `This course has ${enrolled} enrolled student(s) and cannot be deleted. ` +
          'Switch it to "Hidden from Site" instead — that takes it off the public website and keeps the enrollments.',
        enrolledStudents: enrolled,
      });
    }

    // Delete the curriculum too: modules, lessons and quizzes only exist for
    // this course and would otherwise be orphaned in the LMS.
    await Lesson.deleteMany({ course: course._id });
    await Quiz.deleteMany({ course: course._id });
    await Module.deleteMany({ course: course._id });
    await course.deleteOne();
    publicCache.invalidate(publicCache.CACHE_KEYS.publishedCourses);

    await AuditLog.create({
      actor: req.user?._id,
      actorName: req.user?.name || 'Administrator',
      actorRole: req.user?.role || 'ADMIN',
      action: 'COURSE_DELETED',
      entity: 'Course',
      entityId: req.params.id,
      details: `Deleted course: ${course.title} (${course.slug}) with its curriculum`,
    });

    return res.status(200).json({
      success: true,
      message: 'Course deleted successfully',
    });
  } catch (error) {
    return sendError(res, error);
  }
};

module.exports = {
  getPublishedCourses,
  getAllCourses,
  getCourseBySlug,
  createCourse,
  updateCourse,
  toggleBadge,
  deleteCourse,
};
