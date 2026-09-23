const Course = require('../models/Course');
const AuditLog = require('../models/AuditLog');
const Module = require('../models/Module');
const { syncCourseCurriculum, normalizeCurriculumForEmbed } = require('../utils/curriculumSync');

// @desc    Get published courses for landing page
// @route   GET /api/courses
// @access  Public
const getPublishedCourses = async (req, res) => {
  try {
    const courses = await Course.find({ isPublished: true }).sort({ createdAt: 1 });
    return res.status(200).json({
      success: true,
      count: courses.length,
      courses,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
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
    return res.status(500).json({
      success: false,
      message: error.message,
    });
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
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Create course
// @route   POST /api/courses
// @access  Private (SuperAdmin, Counselor)
const createCourse = async (req, res) => {
  try {
    const { title, slug, category, badge, cardTheme, duration, pricing, highlights, curriculum, brochureUrl, isPublished, seatsUrgencyText, viewOptions, eligibility } = req.body;

    const courseSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

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

    return res.status(201).json({
      success: true,
      course,
      curriculumSummary,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
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

    return res.status(200).json({
      success: true,
      course,
      curriculumSummary,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
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

    return res.status(200).json({
      success: true,
      course,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
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

    await course.deleteOne();

    await AuditLog.create({
      actor: req.user?._id,
      actorName: req.user?.name || 'Administrator',
      actorRole: req.user?.role || 'ADMIN',
      action: 'COURSE_DELETED',
      entity: 'Course',
      entityId: req.params.id,
      details: `Deleted course: ${course.title} (${course.slug})`,
    });

    return res.status(200).json({
      success: true,
      message: 'Course deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
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
