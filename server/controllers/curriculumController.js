const Module = require('../models/Module');
const Lesson = require('../models/Lesson');
const Quiz = require('../models/Quiz');
const Course = require('../models/Course');
const { sendError } = require('../utils/apiError');

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

    // Group lessons and quizzes under their modules
    const structuredModules = modules.map(mod => {
      const modLessons = lessons.filter(l => l.module.toString() === mod._id.toString());
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
    const newLesson = await Lesson.create(req.body);
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
    const updated = await Lesson.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ success: false, message: 'Lesson not found' });
    return res.status(200).json({ success: true, lesson: updated });
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
  createModule,
  updateModule,
  deleteModule,
  createLesson,
  updateLesson,
  deleteLesson,
  createOrUpdateQuiz,
};
