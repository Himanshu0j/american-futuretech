import { useEffect, useState } from 'react';
import axios from 'axios';
import { sortCoursesByOrder } from './courseOrder';

/**
 * One loader for the published course catalogue — the homepage cards, the
 * /courses catalogue and the header menu all read it.
 *
 * Why this exists: each of those three used to call `/api/courses` on its own,
 * and the homepage answered a failed request by rendering the hardcoded
 * `defaultCoursesFallback` array. On a phone with a flaky connection (or behind
 * a carrier proxy that answers HTML) that request fails, so the visitor saw
 * months-old titles, artwork and faculty lines that exist nowhere in the
 * database — exactly "dusre mobile pe purana data" while the admin's laptop
 * looked correct.
 *
 * The catalogue now comes from three places, best first, and NEVER from
 * invented demo content:
 *
 *   1. `#aft-courses-bootstrap` — the list the server embedded in the HTML it
 *      just handed us. It is the freshest possible source for the first paint
 *      and is read before React renders (server.js builds it from the same
 *      loader `/api/courses` uses).
 *   2. `localStorage`, timestamped and short-lived — the last reply that really
 *      came from the API, so a second visit paints correctly before the network
 *      answers. Past the TTL it is ignored rather than trusted.
 *   3. `/api/courses`, fetched with a cache-busting query and two retries,
 *      because the failures we actually see in production are transient.
 *
 * When all three come up empty the caller renders nothing (or a retry notice)
 * instead of a plausible-looking lie.
 */

const INJECTED_ID = 'aft-courses-bootstrap';
const CACHE_KEY = 'aft_public_courses_v2';

// Same window as the settings warm-start: long enough to remove the first-paint
// flash, short enough that a returning visitor can never sit on month-old data.
const CACHE_TTL_MS = 30 * 60 * 1000;

// Two components on one page share a single request for this long.
const MEMO_TTL_MS = 60 * 1000;

const ATTEMPTS = 3;

let memo = null; // { at, courses }
let inflight = null;
const listeners = new Set();

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * An array is a real answer even when it is empty — "nothing is published" is a
 * state the admin can create, and it must not be confused with "the request
 * failed". Only a non-array is unusable.
 */
const normalize = (value) => (Array.isArray(value) ? (value.length ? sortCoursesByOrder(value) : []) : null);

/** The catalogue the server embedded in this document, or null. */
const readInjectedCourses = () => {
  if (typeof document === 'undefined' || typeof document.getElementById !== 'function') return null;
  const tag = document.getElementById(INJECTED_ID);
  if (!tag) return null;
  try {
    const parsed = JSON.parse(tag.textContent || '');
    return normalize(parsed?.courses);
  } catch (error) {
    /* a truncated data block is simply ignored */
    return null;
  }
};

/** The last reply that came from the API, while it is still recent enough. */
const readCachedCourses = () => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const at = Number(parsed?.at) || 0;
    if (!at || Date.now() - at > CACHE_TTL_MS) return null;
    // An empty stored list is no warm start at all; fall through to the API.
    return normalize(parsed?.courses) || null;
  } catch (error) {
    return null;
  }
};

const writeCachedCourses = (courses) => {
  if (typeof window === 'undefined' || !courses?.length) return;
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), courses }));
  } catch (error) {
    /* storage full or blocked — the site still works without a warm start */
  }
};

/** What the first render should use: server snapshot, then the browser copy. */
export const getInitialCourses = () => readInjectedCourses() || readCachedCourses() || [];

const notify = (courses) => {
  listeners.forEach((listener) => {
    try {
      listener(courses);
    } catch (error) {
      /* one broken subscriber must not stop the others */
    }
  });
};

const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

/** A reply is only usable when it is the API's own shape, not an HTML page. */
const isCourseReply = (data) => Boolean(data && typeof data === 'object' && data.success && Array.isArray(data.courses));

/**
 * Ask the API for the catalogue. Returns the list, or null when every attempt
 * failed — callers keep whatever they already had on screen.
 */
export const loadPublicCourses = async ({ force = false } = {}) => {
  if (!force && memo && Date.now() - memo.at < MEMO_TTL_MS) return memo.courses;
  if (inflight) return inflight;

  inflight = (async () => {
    for (let attempt = 1; attempt <= ATTEMPTS; attempt += 1) {
      try {
        const res = await axios.get('/api/courses', {
          // A unique URL cannot be answered from an edge/CDN copy of an older
          // reply; the API itself is `no-cache`, this is the belt to that.
          params: { t: Date.now() },
          // The host's bot-protection page answers HTML for one request in a
          // burst — that is a failure, not an empty catalogue.
          headers: { Accept: 'application/json' },
          timeout: 15000,
        });
        if (isCourseReply(res.data)) {
          const courses = normalize(res.data.courses) || [];
          memo = { at: Date.now(), courses };
          writeCachedCourses(courses);
          notify(courses);
          return courses;
        }
        console.warn('Course list reply was not the API JSON — retrying.');
      } catch (error) {
        if (attempt === ATTEMPTS) console.warn('Could not load the course list:', error.message);
      }
      if (attempt < ATTEMPTS) await sleep(400 * attempt);
    }
    return null;
  })().finally(() => {
    inflight = null;
  });

  return inflight;
};

/**
 * The published catalogue for a component.
 *
 * `courses` starts from the HTML snapshot or the browser copy, so the first
 * frame is already right; `failed` means "no data from any source", which the
 * caller should show as a retry notice rather than substituting demo content.
 */
export function usePublicCourses() {
  const [courses, setCourses] = useState(getInitialCourses);
  const [loading, setLoading] = useState(() => courses.length === 0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;

    const unsubscribe = subscribe((next) => {
      if (!active) return;
      setCourses(next);
      setFailed(false);
      setLoading(false);
    });

    const run = async () => {
      const next = await loadPublicCourses();
      if (!active) return;
      if (next) {
        setCourses(next);
        setFailed(false);
      } else {
        // An older copy (snapshot / cache) may still be on screen; only report
        // failure when there is nothing real to show at all.
        setFailed(getInitialCourses().length === 0);
      }
      setLoading(false);
    };

    run();

    // A tab restored hours later is showing the build and data it loaded then.
    const onVisible = () => {
      if (document.visibilityState === 'visible') run();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      active = false;
      unsubscribe();
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  return { courses, loading, failed, refresh: () => loadPublicCourses({ force: true }) };
}
