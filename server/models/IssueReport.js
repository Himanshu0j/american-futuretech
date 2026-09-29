const mongoose = require('mongoose');

/**
 * A change request the client raises from inside the admin panel: one or more
 * screenshots plus the note that explains them.
 *
 * That is deliberately the same shape as the briefs that used to arrive over
 * WhatsApp — a picture and a sentence. Keeping the pair together in the database
 * means the panel can hand the identical bundle back out as a single copyable
 * block (see `client/src/admin/IssueReports.jsx`), so nothing is lost in the
 * hand-off and no issue has to be re-described from memory.
 *
 * Multiple images are supported on purpose: "the header is wrong on desktop AND
 * on mobile" is one issue with two screenshots, not two issues.
 */

const IssueImageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true, trim: true },
    // Kept so a copy can name the file and so the asset can be traced back to
    // the upload it came from.
    filename: { type: String, default: '', trim: true },
    // Optional one-liner ("this is the old price") shown under the thumbnail.
    caption: { type: String, default: '', trim: true },
  },
  { _id: false }
);

const IssueReportSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Give the issue a short title'],
      trim: true,
      maxlength: [160, 'Keep the title under 160 characters'],
    },
    // The client's own words. Never reformatted — this is what gets copied out.
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: [8000, 'Keep the note under 8000 characters'],
    },
    images: {
      type: [IssueImageSchema],
      default: [],
    },
    // Where on the site it was seen: a route ("/courses") or a full URL.
    page: { type: String, default: '', trim: true },
    category: {
      type: String,
      enum: [
        'Content / Text',
        'Layout / Design',
        'Image / Media',
        'Bug / Not Working',
        'Pricing / Payments',
        'Course / Curriculum',
        'Other',
      ],
      default: 'Other',
    },
    severity: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Urgent'],
      default: 'Medium',
    },
    status: {
      type: String,
      enum: ['Open', 'In Progress', 'Fixed', 'Verified'],
      default: 'Open',
    },
    // What was actually done about it — filled in when the fix ships, so the
    // list doubles as a change log the client can re-read later.
    resolution: { type: String, default: '', trim: true, maxlength: [4000, 'Keep the note under 4000 characters'] },
    reportedBy: {
      name: { type: String, default: '' },
      email: { type: String, default: '' },
      id: { type: String, default: '' },
    },
    // When the issue was actually spotted (falls back to createdAt). Lets the
    // client back-date a note they are entering late.
    reportedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// The board is read by status and newest-first; one compound index covers both.
IssueReportSchema.index({ status: 1, createdAt: -1 });

IssueReportSchema.pre('save', function stampReportedAt(next) {
  if (!this.reportedAt) this.reportedAt = this.createdAt || new Date();
  next();
});

module.exports = mongoose.model('IssueReport', IssueReportSchema);
