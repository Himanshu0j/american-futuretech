/**
 * When a class is visible, joinable and replayable.
 *
 * Kept in one place because both sides ask the same questions: the admin class
 * table shows a Join button, and the student portal must never receive a live
 * meeting link outside the class window. Hiding the button is not enough — the
 * API only serialises `meetingUrl` when `canJoin` is true.
 */

const JOIN_OPENS_BEFORE_MS = 15 * 60 * 1000; // 15 minutes early (tech check)
const JOIN_CLOSES_AFTER_MS = 30 * 60 * 1000; // 30 minutes after the end
const RECORDING_GRACE_MS = 15 * 60 * 1000;

const toDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getClassWindow = (session, now = new Date()) => {
  const startsAt = toDate(session?.startsAt) || toDate(session?.classDate);
  const endsAt = toDate(session?.endsAt) || (startsAt ? new Date(startsAt.getTime() + 60 * 60 * 1000) : null);
  const visibleFrom = toDate(session?.visibleFrom);
  const status = String(session?.status || 'Scheduled');

  const isCancelled = status === 'Cancelled';
  const isDraft = status === 'Draft';
  const isVisible =
    !isDraft &&
    !isCancelled &&
    (!visibleFrom || now >= visibleFrom) &&
    ['Scheduled', 'Published', 'Completed'].includes(status);

  const joinableStatus = status === 'Published';
  const canJoin = Boolean(
    joinableStatus &&
      startsAt &&
      endsAt &&
      now >= new Date(startsAt.getTime() - JOIN_OPENS_BEFORE_MS) &&
      now <= new Date(endsAt.getTime() + JOIN_CLOSES_AFTER_MS)
  );

  const hasEnded = Boolean(endsAt && now > new Date(endsAt.getTime() + RECORDING_GRACE_MS));
  const canViewRecording = Boolean(
    session?.recordingUrl &&
      !isCancelled &&
      !isDraft &&
      (status === 'Completed' || hasEnded)
  );

  return {
    startsAt,
    endsAt,
    isVisible,
    isCancelled,
    isDraft,
    canJoin,
    canViewRecording,
    // A single label the UI can print instead of re-deriving the rules.
    phase: isCancelled
      ? 'cancelled'
      : isDraft
        ? 'draft'
        : canJoin
          ? 'live'
          : hasEnded
            ? 'ended'
            : startsAt && now < startsAt
              ? 'upcoming'
              : 'scheduled',
  };
};

module.exports = { getClassWindow };
