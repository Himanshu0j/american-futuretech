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
}, {
  timestamps: true,
});

module.exports = mongoose.model('Lesson', LessonSchema);
