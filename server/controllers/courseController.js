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

// The sequence the client asked for ("kon pehle, kon niche") — one admin-owned
// number per course, edited in Admin → Courses. Every list of programs sorts by
// it: the homepage Fellowship section, the /courses catalogue and the header's
// CAREER PROGRAMS mega-menu, so the three can never drift apart. `createdAt` is
// the tie-break for the courses nobody has reordered yet (they all default to
// displayOrder 1, which is exactly what the old insertion order produced).
const COURSE_ORDER = { displayOrder: 1, createdAt: 1 };

/**
 * The published catalogue, exactly as `GET /api/courses` answers it.
 *
 * Used for two things: the JSON reply, and the first-paint snapshot the server
 * embeds in the HTML (see server.js). The snapshot matters because a device with
 * a cold or flaky network used to fail the `/api/courses` request and silently
 * render the client's hardcoded demo programmes — old titles, old artwork, old
 * faculty lines — which is what "dusre mobile pe purana data" looked like. Both
 * halves read this one loader, so they can never disagree.
 */
const loadPublishedCourses = () =>
  publicCache.read(publicCache.CACHE_KEYS.publishedCourses, PUBLISHED_COURSES_TTL_MS, async () => {
    const courses = await Course.find({ isPublished: true }).sort(COURSE_ORDER);
    return { success: true, count: courses.length, courses };
  });

// @desc    The catalogue snapshot embedded in the served HTML (first paint)
// @access  Internal (server-rendered document)
const getBootstrapCourses = async () => {
  const { body } = await loadPublishedCourses();
  return body || null;
};

// @desc    Get published courses for landing page
// @route   GET /api/courses
// @access  Public
const getPublishedCourses = async (req, res) => {
  try {
    const { body } = await loadPublishedCourses();

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
    const courses = await Course.find().sort(COURSE_ORDER);

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
    const { title, slug, category, badge, cardTheme, duration, pricing, highlights, curriculum, brochureUrl, isPublished, seatsUrgencyText, viewOptions, eligibility, tools, toolsTitle, toolsSubtitle, capstoneProjects, thumbnail, menuLogo, heroImage, advantageImages, credentialLogo, credentialTitle, credentialSubtitle, certificateImage, careerRoles, careerRolesHeading, careerRolesSubtitle } = req.body;

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
      // Logo for the header's CAREER PROGRAMS mega-menu (falls back to the card
      // image and then to a title monogram when it is empty).
      menuLogo,
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
      // The "What Can You Become?" block. Kept in step with the update path:
      // declaring it here means a course created with roles does not silently
      // lose them on the first save.
      careerRoles,
      careerRolesHeading,
      careerRolesSubtitle,
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

// @desc    Save the admin's program sequence (Admin → Courses → Move up / Move down)
// @route   PATCH /api/courses/reorder
// @access  Private (COURSES_EDIT)
//
// The body is the full list of course ids in the order they should be shown.
// A whole list rather than "move this one to position 3" keeps the sequence
// consistent: two admins reordering at once can never interleave into a
// half-applied order, and a course that is missing from the list keeps its
// relative place after the ones that were sent instead of being dropped to 0.
const reorderCourses = async (req, res) => {
  try {
    const requested = Array.isArray(req.body?.order) ? req.body.order.map(String).filter(Boolean) : [];
    if (requested.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Send the course ids in the order you want them displayed.',
      });
    }
    if (new Set(requested).size !== requested.length) {
      return res.status(400).json({
        success: false,
        message: 'The same course appears twice in that order — reload the page and try again.',
      });
    }

    const existing = await Course.find().select('_id displayOrder').lean();
    const known = new Set(existing.map((c) => String(c._id)));
    const unknown = requested.filter((id) => !known.has(id));
    if (unknown.length) {
      return res.status(400).json({
        success: false,
        message: 'That list contains a course that no longer exists — reload the page and try again.',
      });
    }

    const leftovers = existing
      .filter((c) => !requested.includes(String(c._id)))
      .sort((a, b) => (Number(a.displayOrder) || 0) - (Number(b.displayOrder) || 0))
      .map((c) => String(c._id));
    const finalOrder = [...requested, ...leftovers];

    await Course.bulkWrite(
      finalOrder.map((id, index) => ({
        updateOne: { filter: { _id: id }, update: { $set: { displayOrder: index + 1 } } },
      })),
    );

    // The public feed is cached for 30 s; without this the admin saves a new
    // order and the site keeps serving the old one for half a minute.
    publicCache.invalidate(publicCache.CACHE_KEYS.publishedCourses);

    await AuditLog.create({
      actor: req.user?._id,
      actorName: req.user?.name || 'Administrator',
      actorRole: req.user?.role || 'ADMIN',
      action: 'COURSES_REORDERED',
      entity: 'Course',
      details: `Program order saved: ${finalOrder.length} course(s)`,
    });

    const courses = await Course.find().sort(COURSE_ORDER);

    return res.status(200).json({
      success: true,
      message: 'Program order saved — the homepage, the catalogue and the header menu all follow it.',
      count: courses.length,
      courses,
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
  getBootstrapCourses,
  getAllCourses,
  reorderCourses,
  getCourseBySlug,
  createCourse,
  updateCourse,
  toggleBadge,
  deleteCourse,
};
