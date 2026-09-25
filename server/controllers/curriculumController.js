const Module = require('../models/Module');
const Lesson = require('../models/Lesson');
const Quiz = require('../models/Quiz');
const Course = require('../models/Course');
const { sendError } = require('../utils/apiError');
const { normalizeVideoUrl } = require('../utils/videoUrl');
const LmsSetting = require('../models/LmsSetting');

const httpError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

/** Resolve a course by ObjectId or slug (the two shapes the admin screens send). */
const resolveCourse = async (courseId) => {
  if (String(courseId || '').match(/^[0-9a-fA-F]{24}$/)) {
    return Course.findById(courseId);
  }
  return Course.findOne({ slug: String(courseId || '') });
};

/**
 * Clean a lesson body before it reaches Mongo.
 *
 * - A video link is stored in the embed form the player needs (YouTube/Vimeo
 *   share links are rewritten), and a non-https scheme is refused instead of
 *   being saved as a frame the browser will silently block.
 * - Resource rows missing a title or URL are dropped rather than failing the
 *   whole save on schema validation.
 */
const sanitizeLessonPayload = (body = {}) => {
  const payload = { ...body };

  if (typeof payload.videoUrl === 'string' && payload.videoUrl.trim()) {
    const normalized = normalizeVideoUrl(payload.videoUrl);
    if (!normalized.valid) throw httpError(400, normalized.warning || 'Invalid video URL');
    payload.videoUrl = normalized.url;
  }

  if (typeof payload.pdfUrl === 'string' && payload.pdfUrl.trim() && !/^https?:\/\//i.test(payload.pdfUrl.trim())) {
    throw httpError(400, 'PDF links must start with http:// or https://');
  }

  if (Array.isArray(payload.resources)) {
    payload.resources = payload.resources
      .filter((res) => res && String(res.title || '').trim() && String(res.url || '').trim())
      // The student player renders each resource as a clickable link, so a
      // `javascript:` or `data:` URL here is stored XSS rather than a dead link.
      .filter((res) => /^https?:\/\//i.test(String(res.url).trim()))
      .map((res) => ({
        title: String(res.title).trim(),
        url: String(res.url).trim(),
        fileType: String(res.fileType || 'PDF').trim(),
        fileSize: String(res.fileSize || '').trim(),
      }));
  }

  return payload;
};

// @desc    Get full curriculum (modules + lessons + quizzes) for a course
// @route   GET /api/curriculum/courses/:courseId
// @access  Public
const getCourseCurriculum = async (req, res) => {
  try {
    const { courseId } = req.params;

    // Check if courseId is an ObjectId or slug
    let course;
    if (courseId.match(/^[0-9a-fA-F]{24}$/)) {
      course = await Course.findById(courseId);
    } else {
      course = await Course.findOne({ slug: courseId });
    }

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const modules = await Module.find({ course: course._id, isPublished: true }).sort({ order: 1, moduleNumber: 1 });
    const moduleIds = modules.map(m => m._id);

    const lessons = await Lesson.find({ course: course._id, isPublished: true }).sort({ order: 1, lessonNumber: 1 });
    const quizzes = await Quiz.find({ course: course._id, isPublished: true });

    // LMS Settings → "Allow free-preview lessons". When it is off, the public
    // curriculum must not advertise any lesson as a free preview, so the flag is
    // masked here rather than being left for the UI to honour.
    const lmsSettings = await LmsSetting.findOne();
    const previewsAllowed = lmsSettings ? lmsSettings.allowLessonPreview !== false : true;
    const publicLessons = previewsAllowed
      ? lessons
      : lessons.map((lesson) => ({ ...lesson.toObject(), isPreview: false }));

    // Group lessons and quizzes under their modules
    const structuredModules = modules.map(mod => {
      const modLessons = publicLessons.filter(l => l.module.toString() === mod._id.toString());
      const modQuiz = quizzes.find(q => q.module && q.module.toString() === mod._id.toString());
      return {
        ...mod.toObject(),
        lessons: modLessons,
        quiz: modQuiz || null,
      };
    });

    return res.status(200).json({
      success: true,
      course: {
        id: course._id,
        title: course.title,
        slug: course.slug,
        duration: course.duration,
      },
      modules: structuredModules,
      totalLessons: lessons.length,
      totalQuizzes: quizzes.length,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc    Create new module
// @route   POST /api/curriculum/modules
// @access  Private (Admin)
const createModule = async (req, res) => {
  try {
    const { course, moduleNumber, title, description, durationHours, order } = req.body;
    const newModule = await Module.create({
      course,
      moduleNumber,
      title,
      description,
      durationHours: durationHours || 20,
      order: order || moduleNumber || 1,
    });
    return res.status(201).json({ success: true, module: newModule });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc    Update module
// @route   PUT /api/curriculum/modules/:id
// @access  Private (Admin)
const updateModule = async (req, res) => {
  try {
    const updated = await Module.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ success: false, message: 'Module not found' });
    return res.status(200).json({ success: true, module: updated });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc    Delete module and its lessons
// @route   DELETE /api/curriculum/modules/:id
// @access  Private (Admin)
const deleteModule = async (req, res) => {
  try {
    const mod = await Module.findById(req.params.id);
    if (!mod) return res.status(404).json({ success: false, message: 'Module not found' });
    await Lesson.deleteMany({ module: mod._id });
    await Quiz.deleteMany({ module: mod._id });
    await mod.deleteOne();
    return res.status(200).json({ success: true, message: 'Module and associated lessons deleted' });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc    Create new lesson
// @route   POST /api/curriculum/lessons
// @access  Private (Admin)
const createLesson = async (req, res) => {
  try {
    const newLesson = await Lesson.create(sanitizeLessonPayload(req.body));
    return res.status(201).json({ success: true, lesson: newLesson });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc    Update lesson
// @route   PUT /api/curriculum/lessons/:id
// @access  Private (Admin)
const updateLesson = async (req, res) => {
  try {
    const updated = await Lesson.findByIdAndUpdate(req.params.id, sanitizeLessonPayload(req.body), {
      new: true,
      runValidators: true,
    });
    if (!updated) return res.status(404).json({ success: false, message: 'Lesson not found' });
    return res.status(200).json({ success: true, lesson: updated });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc    Duplicate a lesson (content + video + resources) at the end of its module
// @route   POST /api/curriculum/lessons/:id/duplicate
// @access  Private (Admin)
const duplicateLesson = async (req, res) => {
  try {
    const source = await Lesson.findById(req.params.id);
    if (!source) return res.status(404).json({ success: false, message: 'Lesson not found' });

    const clone = source.toObject();
    delete clone._id;
    delete clone.createdAt;
    delete clone.updatedAt;
    delete clone.__v;

    const last = await Lesson.findOne({ module: source.module }).sort({ order: -1 });
    const nextOrder = (last?.order || 0) + 1;

    clone.title = `${source.title} (copy)`;
    clone.order = nextOrder;
    clone.lessonNumber = nextOrder;

    const created = await Lesson.create(clone);
    return res.status(201).json({ success: true, lesson: created });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc    Full curriculum for the admin builder — includes unpublished drafts
// @route   GET /api/curriculum/admin/courses/:courseId
// @access  Private (Admin)
const getAdminCourseCurriculum = async (req, res) => {
  try {
    const course = await resolveCourse(req.params.courseId);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

    const [modules, lessons, quizzes] = await Promise.all([
      Module.find({ course: course._id }).sort({ order: 1, moduleNumber: 1 }),
      Lesson.find({ course: course._id }).sort({ order: 1, lessonNumber: 1 }),
      Quiz.find({ course: course._id }),
    ]);

    const structuredModules = modules.map((mod) => ({
      ...mod.toObject(),
      lessons: lessons.filter((lesson) => String(lesson.module) === String(mod._id)),
      quiz: quizzes.find((quiz) => quiz.module && String(quiz.module) === String(mod._id)) || null,
    }));

    return res.status(200).json({
      success: true,
      course: {
        id: course._id,
        title: course.title,
        slug: course.slug,
        duration: course.duration,
        isPublished: course.isPublished,
      },
      modules: structuredModules,
      counts: {
        modules: modules.length,
        lessons: lessons.length,
        quizzes: quizzes.length,
        draftLessons: lessons.filter((lesson) => !lesson.isPublished).length,
        draftModules: modules.filter((mod) => !mod.isPublished).length,
      },
    });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc    Persist a drag-and-drop reorder of modules and/or lessons
// @route   PUT /api/curriculum/courses/:courseId/reorder
// @access  Private (Admin)
const reorderCurriculum = async (req, res) => {
  try {
    const course = await resolveCourse(req.params.courseId);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

    const { modules = [], lessons = [] } = req.body || {};
    const moduleIds = (Array.isArray(modules) ? modules : [])
      .map((entry) => entry?.id || entry?._id)
      .filter(Boolean);
    const lessonIds = (Array.isArray(lessons) ? lessons : [])
      .map((entry) => entry?.id || entry?._id)
      .filter(Boolean);

    // Scoped to this course, so a crafted id from another course is a no-op.
    await Promise.all(
      moduleIds.map((id, index) =>
        Module.updateOne({ _id: id, course: course._id }, { $set: { order: index + 1, moduleNumber: index + 1 } })
      )
    );
    await Promise.all(
      lessonIds.map((id, index) =>
        Lesson.updateOne({ _id: id, course: course._id }, { $set: { order: index + 1, lessonNumber: index + 1 } })
      )
    );

    return res.status(200).json({
      success: true,
      message: 'New order saved',
      modules: moduleIds.length,
      lessons: lessonIds.length,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc    Delete a module quiz
// @route   DELETE /api/curriculum/quizzes/:id
// @access  Private (Admin)
const deleteQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findByIdAndDelete(req.params.id);
    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });
    return res.status(200).json({ success: true, message: 'Quiz deleted' });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc    Delete lesson
// @route   DELETE /api/curriculum/lessons/:id
// @access  Private (Admin)
const deleteLesson = async (req, res) => {
  try {
    const lesson = await Lesson.findByIdAndDelete(req.params.id);
    if (!lesson) return res.status(404).json({ success: false, message: 'Lesson not found' });
    return res.status(200).json({ success: true, message: 'Lesson deleted' });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc    Create/Update quiz
// @route   POST /api/curriculum/quizzes
// @access  Private (Admin)
const createOrUpdateQuiz = async (req, res) => {
  try {
    const { id, course, module, title, description, timeLimitMinutes, passingScorePercent, questions } = req.body;
    let quiz;
    if (id) {
      quiz = await Quiz.findByIdAndUpdate(id, req.body, { new: true });
    } else {
      quiz = await Quiz.create({
        course,
        module,
        title,
        description,
        timeLimitMinutes: timeLimitMinutes || 15,
        passingScorePercent: passingScorePercent || 70,
        questions: questions || [],
      });
    }
    return res.status(200).json({ success: true, quiz });
  } catch (error) {
    return sendError(res, error);
  }
};

module.exports = {
  getCourseCurriculum,
  getAdminCourseCurriculum,
  reorderCurriculum,
  createModule,
  updateModule,
  deleteModule,
  createLesson,
  updateLesson,
  duplicateLesson,
  deleteLesson,
  createOrUpdateQuiz,
  deleteQuiz,
};
