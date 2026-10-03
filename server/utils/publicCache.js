/**
 * A tiny in-process cache for public read endpoints.
 *
 * Why this exists: the public site fetches `/api/settings` (148 kB) and
 * `/api/courses` (73 kB) on EVERY page view, and each fetch is a fresh MongoDB
 * round trip to Atlas — measured at 1.3–1.9 s per request on the live domain.
 * Visitors experienced that as "website bhut slow hai".
 *
 * The data changes only when an admin saves, so caching the serialized reply for
 * a short window removes the round trip for every visitor after the first —
 * without ever showing stale content for longer than the window, because every
 * write path calls `invalidate()` and the next request then pays the query
 * again. Nothing here is a source of truth: a cache miss simply falls through to
 * the database.
 *
 * Deliberately process-local and unbounded in key count (there are only a
 * handful of keys). A multi-instance deployment just means each instance warms
 * its own copy — no coordination, no invalidation protocol, and a stale entry
 * can never outlive `ttlMs`.
 */

const entries = new Map();

/**
 * Return the cached value for `key`, loading it with `loader` when missing or
 * expired. Only a successful (non-null) value is cached: a failed load must not
 * be remembered, or one bad request would poison the window for everyone.
 *
 * @param {string} key
 * @param {number} ttlMs how long a loaded value stays fresh
 * @param {() => Promise<any>} loader
 */
const read = async (key, ttlMs, loader) => {
  const hit = entries.get(key);
  const now = Date.now();
  if (hit && hit.body !== null && hit.body !== undefined && now - hit.at < ttlMs) {
    return { body: hit.body, cached: true, ageMs: now - hit.at };
  }

  const body = await loader();
  if (body !== null && body !== undefined) {
    entries.set(key, { at: Date.now(), body });
  }
  return { body, cached: false, ageMs: 0 };
};

/** Drop one key (or every key when called with no argument). */
const invalidate = (key) => {
  if (key === undefined) entries.clear();
  else entries.delete(key);
};

/** Test/diagnostic view of what is currently warm. */
const stats = () =>
  Array.from(entries.entries()).map(([key, value]) => ({
    key,
    ageMs: Date.now() - value.at,
  }));

const CACHE_KEYS = {
  publicSettings: 'settings:public',
  publishedCourses: 'courses:published',
};

module.exports = { read, invalidate, stats, CACHE_KEYS };