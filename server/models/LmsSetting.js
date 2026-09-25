const mongoose = require('mongoose');

/**
 * Singleton document holding the defaults the LMS/Curriculum Builder falls back
 * on, plus the wording printed on issued certificates.
 *
 * Kept separate from SiteSettings so marketing content and LMS behaviour can be
 * edited by different staff without touching each other's form.
 */
const LmsSettingSchema = new mongoose.Schema({
  defaultLessonDuration: {
    type: String,
    default: '45m',
  },
  defaultModuleHours: {
    type: Number,
    default: 20,
  },
  defaultQuizTimeLimit: {
    type: Number,
    default: 15,
  },
  defaultQuizPassingScore: {
    type: Number,
    default: 70,
  },
  certificateGrade: {
    type: String,
    default: 'Honor Distinction',
  },
  certificateAccreditationBody: {
    type: String,
    default: 'American FutureTech Institute of Advanced Technologies (Wyoming, USA)',
  },
  allowLessonPreview: {
    type: Boolean,
    default: true,
  },
  showAnnouncementsInLms: {
    type: Boolean,
    default: true,
  },
  welcomeMessage: {
    type: String,
    default: 'Welcome back. Pick up where you left off.',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('LmsSetting', LmsSettingSchema);
