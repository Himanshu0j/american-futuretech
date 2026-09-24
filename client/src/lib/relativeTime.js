/**
 * Relative time formatting for content timestamps (job postings, blog posts…).
 *
 * Always derives from a real stored timestamp — never a hardcoded string — so
 * "Posted 2 hours ago" stays truthful as the listing ages:
 *
 *   just now → 15 minutes ago → 2 hours ago → yesterday → 3 days ago → Sep 12, 2026
 */

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export const toDate = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return isNaN(date.getTime()) ? null : date;
};

export const formatRelativeTime = (value, now = new Date()) => {
  const date = toDate(value);
  if (!date) return '';

  const diff = now.getTime() - date.getTime();

  // A little clock skew (or an exact match) reads as "just now", never "in 3 seconds".
  if (diff < MINUTE) return 'Just now';

  if (diff < HOUR) {
    const minutes = Math.floor(diff / MINUTE);
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  }

  if (diff < DAY) {
    const hours = Math.floor(diff / HOUR);
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  }

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const calendarDays = Math.round((startOfToday - startOfDate) / DAY);

  if (calendarDays <= 1) return 'Yesterday';
  if (calendarDays <= 6) return `${calendarDays} days ago`;
  if (calendarDays <= 13) return 'Last week';
  if (calendarDays <= 27) return `${Math.floor(calendarDays / 7)} weeks ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// Only the relative phrases get lower-cased into the label. Running the whole
// string through toLowerCase() also flattened absolute dates, so a two-month-old
// posting read "Posted sep 12, 2026".
const RELATIVE_PHRASE = /ago|yesterday|just now|last week/i;

/** "Posted 2 hours ago" — the label used on job cards. */
export const formatPostedLabel = (value, now = new Date()) => {
  const text = formatRelativeTime(value, now);
  if (!text) return '';
  return `Posted ${RELATIVE_PHRASE.test(text) ? text.toLowerCase() : text}`;
};

export default formatRelativeTime;
