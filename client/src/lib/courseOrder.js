/**
 * The order programs are shown in — one rule, used everywhere.
 *
 * The client asked to control which program comes first from the admin panel
 * ("pehle Data Science, fir Cyber, Personalized last"). That sequence lives on
 * each course as `displayOrder`, is written by Admin → Courses → Move up/down
 * (PATCH /api/courses/reorder), and is read by the server for /api/courses.
 *
 * The homepage Fellowship section, the /courses catalogue and the header's
 * CAREER PROGRAMS mega-menu all render from that one API, but each of them also
 * sorts what it got — the catalogue sorts a filtered copy, and the navbar keeps
 * its own state — so the comparator lives here instead of being re-derived in
 * three places. Course order then matches on every page, whatever the visitor
 * filtered or sorted by.
 */

/**
 * A course's position in the admin's sequence.
 *
 * Courses created before this feature existed carry `displayOrder: 1` (the
 * schema default), which is why ties fall back to creation order below — that
 * is exactly the insertion order the site used before, so nothing jumps around
 * until an admin actually reorders something.
 */
const orderValue = (course) => {
  const value = Number(course?.displayOrder);
  return Number.isFinite(value) && value > 0 ? value : 1;
};

const createdValue = (course) => {
  const createdAt = Date.parse(course?.createdAt || '');
  return Number.isFinite(createdAt) ? createdAt : 0;
};

/** Sort comparator: admin sequence first, then the order courses were created. */
export function compareCoursesByOrder(a, b) {
  const bySequence = orderValue(a) - orderValue(b);
  if (bySequence !== 0) return bySequence;
  return createdValue(a) - createdValue(b);
}

/** The same ordering as a new array (never mutates the caller's list). */
export function sortCoursesByOrder(courses) {
  return [...(Array.isArray(courses) ? courses : [])].sort(compareCoursesByOrder);
}

export default sortCoursesByOrder;
