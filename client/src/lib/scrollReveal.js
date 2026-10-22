/**
 * Scroll reveal — the public site's one movement system.
 *
 * Client request: "website mein thoda scrolling animation rkho hr page mein,
 * aur website bhut jyada AI made lg rhi hai". The second half of that request is
 * why this file *removes* motion instead of adding another effect: before this,
 * decoration moved on its own (pulsing dots, floating panels, sweeping sheens)
 * while the page itself sat still. One quiet movement tied to the reader's own
 * scroll replaces all of it.
 *
 * Three rules keep it safe on this particular site:
 *
 *   1. NO DOM NODES ARE CREATED OR MOVED. Every unit only receives attributes,
 *      and the movement itself is a CSS class. The inline website editor
 *      (lib/siteOverrides.js) addresses text and images by a position-based
 *      `pathKey`, so a single extra wrapper div would shift those keys and
 *      silently unpublish every edit the client made. Attributes cannot move a
 *      key, which is why this module only ever writes attributes and classes.
 *
 *   2. NOTHING IS EVER HIDDEN UNLESS WE KNOW WE CAN SHOW IT AGAIN. The
 *      `opacity: 0` rule is gated behind `html[data-aft-reveal="on"]`, which is
 *      only set after the observer is running, and a watchdog reveals the whole
 *      page if an element that is on screen is still hidden — which is precisely
 *      the signature of an observer that stopped working.
 *
 *   3. ONE LEVEL PER SUBTREE. A section and the cards inside it never animate at
 *      the same time (two nested fades read as a laggy, ghostly page). Each block
 *      is turned into a flat list of sibling units first.
 *
 * Admin and the student LMS are excluded at the route level: they are working
 * tools, and a table that fades in while a person is reading it is a defect, not
 * polish.
 */

const ROOT_ATTR = 'data-aft-rv';
const INDEX_ATTR = 'data-aft-rv-i';
const ARMED_CLASS = 'aft-rv-armed';
const IN_CLASS = 'is-in';
const DONE_ATTR = 'data-aft-rv-done';
/** Longest possible run: six stagger steps (6 × 45 ms) + the 620 ms ease. */
const SETTLE_MS = 1100;
const HTML_FLAG = 'data-aft-reveal'; // → <html data-aft-reveal="on">
const HTML_FLAG_ON = 'on';
const AUDIENCE_ATTR = 'data-audience';

/** Blocks whose children are already a designed row. */
const MAX_UNITS_PER_BLOCK = 12;
/** Milliseconds between two units of the same block (see --aft-rv-i in CSS). */
const STAGGER_MS = 45;
/** A unit this far down the viewport counts as "the visitor has reached it". */
const ABOVE_FOLD_FACTOR = 0.85;

const SKIP_SELECTOR = [
  'script',
  'style',
  'noscript',
  'template',
  'svg',
  '[data-no-reveal]',
  '[data-site-editor-ui]',
  '.animate-infinite-marquee',
  '.animate-infinite-marquee-ltr',
  '.animate-infinite-marquee-slow',
  '.animate-infinite-marquee-slower',
  '.fixed',
  '[class*="absolute"]',
  '[class*="sticky"]',
].join(',');

let started = false;
/**
 * How many components currently want the effect.
 *
 * React can mount the new tree before the previous tree's cleanup runs (a
 * Suspense swap, or Fast Refresh after an edit). With a plain boolean, that late
 * cleanup switched the effect off for a page that was already running — the
 * site rendered with everything untagged and a half-revealed block stuck at the
 * bottom. Counting owners makes teardown wait for the last one.
 */
let owners = 0;
let observer = null;
let watchdog = null;
let scanFrame = null;
let scrollTimer = null;
let mutationObserver = null;
let currentPath = null;

export const prefersReducedMotion = () =>
  typeof window !== 'undefined'
  && typeof window.matchMedia === 'function'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** True for the two signed-in work areas, which never get page-level motion. */
export const isStaffRoute = (pathname = '') =>
  pathname.startsWith('/admin') || pathname.startsWith('/student');

/** The inline editor turns the effect off so every block is clickable at once. */
const editorIsOn = () =>
  typeof document !== 'undefined' && document.body?.dataset?.siteEditorActive === 'true';

const classOf = (el) => (typeof el.className === 'string' ? el.className : '');

const isContainer = (el) => /\bcontainer\b/.test(classOf(el)) || /\bmax-w-/.test(classOf(el));

const isGrid = (el) =>
  /(^|\s)grid(\s|$)/.test(classOf(el)) || classOf(el).includes('grid-cols-');

/** Decorative, already-animated and positioned nodes never become units. */
const isEligible = (el) => {
  if (!(el instanceof HTMLElement)) return false;
  if (el.matches(SKIP_SELECTOR)) return false;
  if (el.hasAttribute(ROOT_ATTR)) return true;
  const style = window.getComputedStyle(el);
  if (style.position === 'fixed' || style.position === 'sticky') return false;
  if (style.display === 'none' || style.visibility === 'hidden') return false;
  return el.getBoundingClientRect().height >= 4;
};

/**
 * Turn one block into a flat list of siblings.
 *
 * A `<section>` usually holds a single `.container`; we step into it so the
 * heading, the copy and the card row can arrive one after another instead of the
 * whole band fading as one slab. A grid is expanded into its cards for the same
 * reason — and only then, never both.
 */
const unitsFor = (block) => {
  let content = block;
  const children = Array.from(block.children).filter((el) => el instanceof HTMLElement);
  const eligible = children.filter(isEligible);
  if (eligible.length === 1 && isContainer(eligible[0])) content = eligible[0];

  let units = Array.from(content.children).filter(isEligible);
  units = units.flatMap((unit) => {
    if (!isGrid(unit)) return [unit];
    const cards = Array.from(unit.children).filter(isEligible);
    if (cards.length < 2 || cards.length > 12) return [unit];
    return cards;
  });

  // Long-form pages (legal policies) are a run of paragraphs: animating each one
  // is fidgety, so the whole block arrives as a single unit.
  if (units.length > MAX_UNITS_PER_BLOCK) return [content];

  return units;
};

const tagUnit = (el, index) => {
  const step = Math.min(index, 6);
  if (!el.hasAttribute(ROOT_ATTR)) el.setAttribute(ROOT_ATTR, '');
  el.setAttribute(INDEX_ATTR, String(step));
  el.style.setProperty('--aft-rv-i', String(step));
  el.style.willChange = 'opacity, transform';
  // The class — not the attribute — carries the transition, so it can be taken
  // off again and the element's own hover transitions (Tailwind's
  // `transition-all`) get their properties back untouched.
  el.classList.add(ARMED_CLASS);
  observer.observe(el);
};

/**
 * The movement is over: drop every rule this module added, remembering the unit
 * with one inert attribute so the verification script can prove it settled.
 */
const settle = (el) => {
  // A teardown (route change, editor opened) may have untagged the unit while
  // its timer was pending; nothing to finish in that case.
  if (!el.hasAttribute(ROOT_ATTR)) return;
  el.classList.remove(ARMED_CLASS, IN_CLASS);
  el.style.willChange = '';
  el.removeAttribute(INDEX_ATTR);
  el.style.removeProperty('--aft-rv-i');
  el.setAttribute(DONE_ATTR, '');
};

const revealNow = (el) => {
  el.classList.add(IN_CLASS);
  window.setTimeout(() => settle(el), SETTLE_MS);
};

const revealAll = () => {
  document.querySelectorAll(`.${ARMED_CLASS}`).forEach(revealNow);
};

/** Show the page and stand down: the effect failed its own safety check. */
const disableEffect = () => {
  document.querySelectorAll(`.${ARMED_CLASS}`).forEach((el) => {
    el.classList.remove(ARMED_CLASS, IN_CLASS);
    el.style.willChange = '';
  });
  document.documentElement.removeAttribute(HTML_FLAG);
};

const untagAll = () => {
  document.querySelectorAll(`[${ROOT_ATTR}]`).forEach((el) => {
    el.classList.remove(ARMED_CLASS, IN_CLASS);
    el.removeAttribute(ROOT_ATTR);
    el.removeAttribute(INDEX_ATTR);
    el.removeAttribute(DONE_ATTR);
    el.style.removeProperty('--aft-rv-i');
    el.style.willChange = '';
  });
};

/**
 * Safety check.
 *
 * A tagged unit sitting inside the viewport but still hidden means the observer
 * is not reporting, so the page is shown in full and the effect stands down. A
 * page whose hidden units are all below the fold is simply a page the visitor
 * has not scrolled yet — that is the feature working, not a failure.
 */
const safetyCheck = () => {
  watchdog = null;
  if (!started) return;
  const fold = window.innerHeight * ABOVE_FOLD_FACTOR;
  const hidden = Array.from(document.querySelectorAll(`.${ARMED_CLASS}:not(.${IN_CLASS})`));
  if (!hidden.length) return;

  // Anything already scrolled past must be shown right away. An anchor jump or
  // a long programmatic scroll can skip a unit entirely; leaving it at opacity 0
  // behind the reader is the one failure this module refuses to allow.
  const passed = hidden.filter((el) => el.getBoundingClientRect().bottom < 0);

  // A unit inside the reading area that is still hidden is one the observer
  // cannot see — a collapsed panel, a clipped carousel slide, a zero-height
  // overflow container. Reveal those directly instead of punishing the whole
  // page: the rest of the animation is still doing its job.
  const stuck = hidden.filter((el) => {
    const rect = el.getBoundingClientRect();
    return rect.top < fold - 4 && rect.bottom > 0;
  });

  passed.forEach(revealNow);

  // If almost everything is stuck the observer itself is not reporting, and a
  // per-unit rescue on every scroll would just be the effect running backwards.
  if (stuck.length > 6) {
    disableEffect();
    return;
  }
  stuck.forEach(revealNow);
};

const clearWatchdog = () => {
  if (watchdog) window.clearTimeout(watchdog);
  watchdog = null;
};

const armWatchdog = () => {
  clearWatchdog();
  watchdog = window.setTimeout(safetyCheck, 900);
};

/**
 * Tag the current page and start watching.
 *
 * Elements already on screen at this moment are deliberately left alone: they
 * are what the visitor is reading as the page opens. Some of them (the home
 * hero) already have their own entrance, and fading an already-visible block is
 * exactly the "AI template" flicker the client complained about.
 */
export const scan = () => {
  if (typeof document === 'undefined' || !observer) return { tagged: 0, skipped: true };

  if (editorIsOn() || prefersReducedMotion() || isStaffRoute(window.location.pathname)) {
    untagAll();
    document.documentElement.removeAttribute(HTML_FLAG);
    return { tagged: 0, skipped: true };
  }

  const mains = Array.from(document.querySelectorAll('main'));
  if (!mains.length) return { tagged: 0, skipped: true };

  const fold = window.innerHeight * ABOVE_FOLD_FACTOR;
  let tagged = 0;

  mains.forEach((main) => {
    Array.from(main.children).forEach((block) => {
      if (!isEligible(block)) return;
      if (block.hasAttribute(ROOT_ATTR) || block.querySelector(`[${ROOT_ATTR}]`)) return;
      if (block.getBoundingClientRect().top < fold) return;

      unitsFor(block).forEach((unit, index) => {
        if (unit.querySelector(`[${ROOT_ATTR}]`)) return;
        // A short block that is already peeking in must not blink out.
        if (unit.getBoundingClientRect().top < fold) return;
        tagUnit(unit, index);
        tagged += 1;
      });
    });
  });

  if (tagged > 0) document.documentElement.setAttribute(HTML_FLAG, HTML_FLAG_ON);

  return { tagged, skipped: false };
};

const scheduleScan = () => {
  if (scanFrame) window.cancelAnimationFrame(scanFrame);
  scanFrame = window.requestAnimationFrame(() => {
    scanFrame = null;
    scan();
  });
};

const onScroll = () => {
  if (!started) return;
  if (scrollTimer) window.clearTimeout(scrollTimer);
  scrollTimer = window.setTimeout(armWatchdog, 500);
};

/** Start once. A second call is a no-op and returns the same teardown. */
export const startScrollReveal = () => {
  if (typeof window === 'undefined' || typeof document === 'undefined') return () => {};
  owners += 1;
  if (started) return stopScrollReveal;
  started = true;

  if (!('IntersectionObserver' in window)) {
    document.documentElement.removeAttribute(HTML_FLAG);
    return stopScrollReveal;
  }

  observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      revealNow(entry.target);
      observer.unobserve(entry.target);
    });
  }, { root: null, rootMargin: '0px 0px -10% 0px', threshold: 0.01 });

  // Content arrives after the first paint (lazy routes, API-fed cards), so the
  // page is re-read whenever React swaps a subtree. `childList` only: this
  // observer must never react to the attributes it writes itself.
  mutationObserver = new MutationObserver(scheduleScan);
  mutationObserver.observe(document.getElementById('root') || document.body, {
    childList: true,
    subtree: true,
  });

  window.addEventListener('scroll', onScroll, { passive: true });
  scheduleScan();
  armWatchdog();

  return stopScrollReveal;
};

export const stopScrollReveal = () => {
  owners = Math.max(0, owners - 1);
  if (owners > 0) return;
  started = false;
  clearWatchdog();
  if (scanFrame) window.cancelAnimationFrame(scanFrame);
  if (scrollTimer) window.clearTimeout(scrollTimer);
  scanFrame = null;
  scrollTimer = null;
  if (observer) observer.disconnect();
  if (mutationObserver) mutationObserver.disconnect();
  observer = null;
  mutationObserver = null;
  if (typeof window !== 'undefined') window.removeEventListener('scroll', onScroll);
  if (typeof document !== 'undefined') {
    untagAll();
    document.documentElement.removeAttribute(HTML_FLAG);
  }
};

/**
 * Called on every route change: a new page starts with nothing revealed, so the
 * flags of the previous page are dropped and the scan is scheduled again.
 */
export const syncScrollReveal = (pathname) => {
  currentPath = pathname;
  document.documentElement.setAttribute(AUDIENCE_ATTR, isStaffRoute(pathname) ? 'staff' : 'public');
  if (!started) return;

  untagAll();
  clearWatchdog();
  document.documentElement.removeAttribute(HTML_FLAG);

  if (editorIsOn() || prefersReducedMotion() || isStaffRoute(pathname)) return;

  scheduleScan();
  armWatchdog();
};

export const revealState = () => ({
  path: currentPath,
  started,
  armed: typeof document !== 'undefined'
    ? document.querySelectorAll(`.${ARMED_CLASS}`).length
    : 0,
  hidden: typeof document !== 'undefined'
    ? document.querySelectorAll(`.${ARMED_CLASS}:not(.${IN_CLASS})`).length
    : 0,
  settled: typeof document !== 'undefined'
    ? document.querySelectorAll(`[${DONE_ATTR}]`).length
    : 0,
});

export const REVEAL_CONSTANTS = {
  ROOT_ATTR,
  INDEX_ATTR,
  ARMED_CLASS,
  IN_CLASS,
  DONE_ATTR,
  HTML_FLAG,
  AUDIENCE_ATTR,
  STAGGER_MS,
  SETTLE_MS,
};
