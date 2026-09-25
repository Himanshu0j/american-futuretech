const mongoose = require('mongoose');

/**
 * A notice an admin publishes to the student LMS.
 *
 * `audience` decides who sees it on their dashboard:
 *   - 'All Students' → every enrolled student
 *   - 'Course'       → students enrolled in `course`
 *   - 'Batch'        → students assigned to `batch`
 */
const AnnouncementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Announcement title is required'],
    trim: true,
  },
  body: {
    type: String,
    default: '',
  },
  audience: {
    type: String,
    enum: ['All Students', 'Course', 'Batch'],
    default: 'All Students',
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
  },
  batch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
  },
  pinned: {
    type: Boolean,
    default: false,
  },
  isPublished: {
    type: Boolean,
    default: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  createdByName: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Announcement', AnnouncementSchema);
