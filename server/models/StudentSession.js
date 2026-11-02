const mongoose = require('mongoose');

/**
 * One row per student login.
 *
 * The LMS needs to answer "kab login kiya, kab logout kiya, abhi active hai ya
 * nahi" for every student. A JWT alone cannot: it is stateless and a logout is
 * only a client-side delete. This collection is the server-side record.
 *
 * `lastSeenAt` is refreshed by the portal heartbeat, so a browser that is closed
 * without pressing Sign Out eventually stops counting as active. The admin view
 * treats a session as live only while the heartbeat is recent.
 */
const StudentSessionSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // Carried in the JWT as `sid`, so logout can close exactly this session.
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    loginAt: { type: Date, default: Date.now, index: true },
    lastSeenAt: { type: Date, default: Date.now },
    logoutAt: { type: Date },
    status: {
      type: String,
      enum: ['Active', 'Ended'],
      default: 'Active',
      index: true,
    },
    endedReason: {
      type: String,
      enum: ['', 'logout', 'password_reset', 'deactivated', 'expired', 'new_login'],
      default: '',
    },
    ip: { type: String, default: '' },
    userAgent: { type: String, default: '' },
  },
  { timestamps: true },
);

StudentSessionSchema.index({ student: 1, loginAt: -1 });
StudentSessionSchema.index({ student: 1, status: 1 });

module.exports = mongoose.model('StudentSession', StudentSessionSchema);
