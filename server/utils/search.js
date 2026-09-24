/**
 * Literal search helpers for free-text filters.
 *
 * Admin and public search boxes hand free text straight to MongoDB as a
 * `$regex`. Passing it through unescaped is two bugs in one:
 *
 *   • Correctness — a search for "a+b" or "C++" becomes a regex and silently
 *     matches the wrong rows (or nothing at all).
 *   • Availability — a value like `(a+)+$` against a few thousand documents
 *     pins the Node event loop and takes the whole API down for every user.
 *
 * Everything that filters on user-supplied text should build its condition
 * with `searchRegex()` instead of `{ $regex: value }`.
 */

// Characters that change the meaning of a regex.
const REGEX_SPECIALS = /[.*+?^${}()|[\]\\]/g;

// Long enough for any realistic query, short enough that even a pathological
// pattern cannot make MongoDB work hard.
const MAX_SEARCH_LENGTH = 100;

const escapeRegex = (value) => String(value ?? '').replace(REGEX_SPECIALS, '\\$&');

/**
 * A literal, case-insensitive `$regex` condition with the input bounded and
 * escaped. Non-string input (an object from a crafted request) degrades to its
 * string form instead of being interpreted as a query operator.
 */
const searchRegex = (value) => {
  const raw = typeof value === 'string' ? value : '';
  return { $regex: escapeRegex(raw.trim().slice(0, MAX_SEARCH_LENGTH)), $options: 'i' };
};

module.exports = { escapeRegex, searchRegex, MAX_SEARCH_LENGTH };
