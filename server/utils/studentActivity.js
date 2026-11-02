/**
 * Student session + activity helpers.
 *
 * All writes are best-effort: a logging failure must never turn a working login,
 * lesson or quiz submission into a 500. Callers use the fire-and-forget
 * `recordActivity` for the timeline and `await` only where the session id is
 * needed to sign a token.
 */

const StudentActivity = require('../models/StudentActivity');
const StudentSession = require('../models/StudentSession');
const User = require('../models/User');

// The portal heartbeat runs every two minutes. A ten-minute window means one
// delayed/blocked ping (a background tab, a sleeping laptop) does not flip an
// open portal to "inactive", while a closed tab still drops off on its own.
const ACTIVE_WINDOW_MS = 10 * 60 * 1000;
const STALE_SESSION_MS = 12 * 60 * 60 * 1000;

const requestMeta = (req) => {
  const forwarded = String(req?.headers?.['x-forwarded-for'] || '')
    .split(',')[0]
    .trim();
  return {
    ip: forwarded || req?.ip || req?.socket?.remoteAddress || '',
    userAgent: String(req?.headers?.['user-agent'] || '').slice(0, 300),
  };
};

const isStudentUser = (user) => String(user?.role || '').toUpperCase() === 'STUDENT';

const recordActivity = async (studentId, payload, req) => {
  if (!studentId || !payload?.type || !payload?.title) return null;
  try {
    const meta = requestMeta(req);
    return await StudentActivity.create({
      student: studentId,
      type: payload.type,
      title: payload.title,
      detail: payload.detail || '',
      actorName: payload.actorName || '',
      actorRole: payload.actorRole || '',
      ip: meta.ip,
      userAgent: meta.userAgent,
      meta: payload.meta || {},
      at: new Date(),
    });
  } catch (error) {
    console.warn('Student activity could not be recorded:', error.message);
    return null;
  }
};

/** Close sessions that were left open by a browser that was never signed out. */
const expireStaleSessions = async (studentId) => {
  const cutoff = new Date(Date.now() - STALE_SESSION_MS);
  try {
    await StudentSession.updateMany(
      { student: studentId, status: 'Active', loginAt: { $lt: cutoff } },
      { status: 'Ended', logoutAt: new Date(), endedReason: 'expired' },
    );
  } catch (error) {
    console.warn('Could not expire stale student sessions:', error.message);
  }
};

/** Create the session row and stamp the login on the user + timeline. */
const startStudentSession = async (user, req, sessionId) => {
  if (!user || !isStudentUser(user) || !sessionId) return null;
  const meta = requestMeta(req);
  const now = new Date();

  await expireStaleSessions(user._id);

  try {
    const session = await StudentSession.create({
      student: user._id,
      sessionId,
      loginAt: now,
      lastSeenAt: now,
      status: 'Active',
      ip: meta.ip,
      userAgent: meta.userAgent,
    });

    await User.updateOne(
      { _id: user._id },
      { $set: { lastLoginAt: now, lastSeenAt: now, lastLoginIp: meta.ip } },
    ).catch(() => {});

    await recordActivity(
      user._id,
      {
        type: 'login',
        title: 'Signed in to the student portal',
        detail: meta.ip ? `IP ${meta.ip}` : '',
        ip: meta.ip,
        userAgent: meta.userAgent,
        meta: { sessionId },
      },
      req,
    );

    return session;
  } catch (error) {
    console.warn('Could not start student session:', error.message);
    return null;
  }
};

/** Heartbeat: keep this session (or the latest one) marked as recently seen. */
const touchStudentSession = async (studentId, sessionId) => {
  if (!studentId) return null;
  const now = new Date();
  try {
    const filter = sessionId
      ? { student: studentId, sessionId, status: 'Active' }
      : { student: studentId, status: 'Active' };
    const session = await StudentSession.findOneAndUpdate(
      filter,
      { $set: { lastSeenAt: now } },
      { new: true, sort: { loginAt: -1 } },
    ).lean();

    await User.updateOne({ _id: studentId }, { $set: { lastSeenAt: now } }).catch(() => {});
    return session;
  } catch (error) {
    console.warn('Could not update student session heartbeat:', error.message);
    return null;
  }
};

/**
 * Close one session. Returns the closed row (null when it was already ended).
 * `reason` is stored on the row so an admin can tell a real sign-out from a
 * password rotation forcing the student out.
 */
const endStudentSession = async (studentId, sessionId, reason = 'logout') => {
  if (!studentId) return null;
  try {
    const filter = sessionId
      ? { student: studentId, sessionId, status: 'Active' }
      : { student: studentId, status: 'Active' };
    const session = await StudentSession.findOneAndUpdate(
      filter,
      { $set: { status: 'Ended', logoutAt: new Date(), endedReason: reason } },
      { new: true, sort: { loginAt: -1 } },
    );

    if (session) {
      await User.updateOne({ _id: studentId }, { $set: { lastLogoutAt: session.logoutAt } }).catch(
        () => {},
      );
      if (reason === 'logout') {
        await recordActivity(
          studentId,
          {
            type: 'logout',
            title: 'Signed out',
            detail: session.loginAt
              ? `Session length ${Math.max(1, Math.round((session.logoutAt - session.loginAt) / 60000))} min`
              : '',
            meta: { sessionId: session.sessionId },
          },
          null,
        );
      }
    }
    return session;
  } catch (error) {
    console.warn('Could not end student session:', error.message);
    return null;
  }
};

/** Close every open session, e.g. after an admin sets a new password. */
const endAllStudentSessions = async (studentId, reason = 'password_reset') => {
  if (!studentId) return 0;
  try {
    const result = await StudentSession.updateMany(
      { student: studentId, status: 'Active' },
      { $set: { status: 'Ended', logoutAt: new Date(), endedReason: reason } },
    );
    if (result.modifiedCount) {
      await User.updateOne({ _id: studentId }, { $set: { lastLogoutAt: new Date() } }).catch(
        () => {},
      );
    }
    return result.modifiedCount || 0;
  } catch (error) {
    console.warn('Could not end student sessions:', error.message);
    return 0;
  }
};

/** A session is "active" only while its heartbeat is recent. */
const isSessionLive = (session, now = Date.now()) =>
  Boolean(
    session &&
      session.status === 'Active' &&
      session.lastSeenAt &&
      now - new Date(session.lastSeenAt).getTime() <= ACTIVE_WINDOW_MS,
  );

module.exports = {
  ACTIVE_WINDOW_MS,
  isStudentUser,
  recordActivity,
  startStudentSession,
  touchStudentSession,
  endStudentSession,
  endAllStudentSessions,
  isSessionLive,
  requestMeta,
};
