const mongoose = require('mongoose');

const ResourceAttachmentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  url: { type: String, required: true },
  fileType: { type: String, default: 'PDF' },
  fileSize: { type: String, default: '1.2 MB' },
}, { _id: false });

const LessonSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  module: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Module',
    required: true,
  },
  title: {
    type: String,
    required: [true, 'Lesson title is required'],
    trim: true,
  },
  lessonNumber: {
    type: Number,
    default: 1,
  },
  description: {
    type: String,
    default: '',
  },
  contentType: {
    type: String,
    enum: ['video', 'text', 'pdf', 'interactive'],
    default: 'video',
  },
  videoUrl: {
    type: String,
    default: '',
  },
  videoDuration: {
    type: String,
    default: '45m',
  },
  textContent: {
    type: String,
    default: '',
  },
  pdfUrl: {
    type: String,
    default: '',
  },
  resources: [ResourceAttachmentSchema],
  isPreview: {
    type: Boolean,
    default: false,
  },
  order: {
    type: Number,
    default: 1,
  },
  isPublished: {
    type: Boolean,
    default: true,
  },
  /**
   * Who wrote this lesson.
   *
   * 'seed'  → the demo curriculum `npm run seed` generates (placeholder lesson
   *           names such as "Working with Lists, Dictionaries, Tuples & Files",
   *           no video the client recorded, boilerplate body text).
   * 'admin' → authored/edited in the Curriculum Builder.
   *
   * The public syllabus only prints 'admin' lessons: to a prospective student
   * the seeded names read as the real syllabus while nothing behind them is
   * real course material. Nothing is deleted — the lesson stays in the builder
   * and the student player, and the first admin save promotes it to 'admin'.
   *
   * Deliberately NO default: a document without this field was written before
   * the field existed, and a default of 'admin' would silently mark every one
   * of those legacy seeder rows as authored content. Missing is read as
   * "unknown", which is what lets utils/demoLessons.js fall back to recognising
   * the seeder's own boilerplate body.
   */
  source: {
    type: String,
    enum: ['seed', 'admin'],
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Lesson', LessonSchema);
