import api from './api';

/**
 * Shared engine behind the inline website editor.
 *
 * Two things use this module:
 *   • SiteOverridesApplier — always mounted, applies saved edits for EVERY visitor
 *   • SiteEditor           — the admin-only editing UI (?edit=1)
 *
 * Edits are keyed by a node's position in the DOM, and the original string is
 * stored next to the replacement. If a layout change moves a key, the entry
 * simply no longer resolves and the coded default shows — a stale edit can never
 * break a page.
 */

const SKIP_TAGS = new Set([
  'SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'CODE', 'PRE', 'SVG', 'PATH', 'IFRAME',
]);

export const isEditorUi = (node) => {
  let el = node.nodeType === 3 ? node.parentElement : node;
  while (el) {
    if (el.dataset && el.dataset.siteEditorUi !== undefined) return true;
    el = el.parentElement;
  }
  return false;
};

/** Stable-ish key derived from the element's position in the tree. */
export const pathKey = (node) => {
  const el = node.nodeType === 3 ? node.parentElement : node;
  if (!el || !el.parentElement) return '';
  const parts = [];
  let cur = el;
  while (cur && cur !== document.body && cur.parentElement) {
    const siblings = Array.from(cur.parentElement.children).filter((c) => c.tagName === cur.tagName);
    parts.unshift(`${cur.tagName.toLowerCase()}${siblings.indexOf(cur)}`);
    cur = cur.parentElement;
  }
  let key = parts.join('>');
  if (node.nodeType === 3) {
    const textSiblings = Array.from(node.parentNode.childNodes).filter((n) => n.nodeType === 3);
    key += `#t${textSiblings.indexOf(node)}`;
  }
  return key;
};

export const collectTextNodes = () => {
  if (typeof document === 'undefined') return [];
  const out = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node) {
    const parent = node.parentElement;
    if (
      parent &&
      !SKIP_TAGS.has(parent.tagName) &&
      !isEditorUi(node) &&
      node.nodeValue &&
      node.nodeValue.trim().length > 1
    ) {
      out.push(node);
    }
    node = walker.nextNode();
  }
  return out;
};

export const collectImages = () => {
  if (typeof document === 'undefined') return [];
  const out = [];
  document.querySelectorAll('img').forEach((img) => {
    if (isEditorUi(img)) return;
    if (img.dataset.noEdit === 'true') return;
    out.push(img);
  });
  return out;
};

/*
 * Every override we write onto the DOM is remembered here so it can be undone.
 * Without this a deleted override stayed on screen until a hard reload, because
 * writing the value and forgetting it means nothing knows the original anymore.
 */
const applied = new Map(); // key -> { kind: 'text' | 'image', node, original }

const revertEntry = (key) => {
  const record = applied.get(key);
  if (!record) return;
  applied.delete(key);
  try {
    if (record.kind === 'text') {
      if (record.node && typeof record.node.nodeValue === 'string') {
        record.node.nodeValue = record.original;
      }
    } else if (record.node && record.node.setAttribute && record.original) {
      record.node.setAttribute('src', record.original);
    }
  } catch (err) {
    /* the node was replaced by React — nothing to restore */
  }
};

/** Put every edited text/image back to the coded default. */
export const revertAll = () => {
  Array.from(applied.keys()).forEach(revertEntry);
};

/** True while at least one edit is currently written onto the DOM. */
export const hasAppliedOverrides = () => applied.size > 0;

/**
 * Write the given overrides onto the live DOM.
 * Safe to call repeatedly: an entry is skipped when the node is already showing
 * the new value or when the node no longer holds the text it replaced.
 * Entries that dropped out of the set are restored to their original value, so a
 * "Reset" from the admin panel reaches visitors who already had the old edit.
 */
export const applyOverridesToDom = (text = {}, images = {}) => {
  if (typeof document === 'undefined') return;

  const textKeys = new Set(Object.keys(text || {}));
  const imageKeys = new Set(Object.keys(images || {}));
  const touchedNodes = new Set(); // text nodes this pass has already handled
  const resolvedKeys = new Set(); // override keys whose saved position still exists
  const touchedImgs = new Set(); // <img> elements this pass has already handled
  const resolvedImageKeys = new Set();

  const allTextNodes = collectTextNodes();

  allTextNodes.forEach((node) => {
    const key = pathKey(node);
    const entry = key ? text[key] : null;
    if (!entry || typeof entry.value !== 'string') return;

    resolvedKeys.add(key);
    touchedNodes.add(node);

    const current = node.nodeValue;
    const trimmed = current.trim();
    const hasOriginal = typeof entry.original === 'string' && entry.original.length > 0;

    if (trimmed === entry.value) {                           // already applied
      if (!applied.has(key)) {
        applied.set(key, { kind: 'text', node, original: hasOriginal ? entry.original : trimmed });
      }
      return;
    }

    if (hasOriginal && trimmed !== entry.original) {
      /*
       * The wording at this position is not the wording this edit replaced.
       *
       * This used to be the end of the story: the coded default stayed on screen
       * and a perfectly good published edit was skipped in silence — which the
       * admin experiences as "my change never appears". The mismatch is usually
       * not a layout change at all, but wording that arrives later from the CMS:
       * a heading paints its coded default, then /api/settings swaps in the
       * admin's saved headline, and the edit is compared against the wrong text.
       *
       * So the skip now only stands when the wording this edit replaced really is
       * somewhere else on the page (the orphan rescue below relocates it there).
       * Otherwise the edit is applied by position: the admin's intent for this
       * element is explicit, and a page-level Reset undoes anything that lands
       * wrong.
       */
      const rescuedElsewhere = allTextNodes.some((other) => (
        other !== node && !touchedNodes.has(other) && other.nodeValue
        && other.nodeValue.trim() === entry.original
      ));
      if (rescuedElsewhere) return;
    }

    node.nodeValue = current.replace(trimmed, entry.value);
    // `trimmed` (what was actually on screen) is the honest value to restore on
    // a revert, whether or not it matched the stored original.
    applied.set(key, { kind: 'text', node, original: trimmed });
  });

  /*
   * Position-independent rescue.
   *
   * An edit is keyed by where its text sat in the DOM, so adding or reordering
   * anything earlier on the page — an ordinary code change — shifts the key and
   * the saved edit quietly stopped applying: the site went back to the coded
   * wording while the edit was still stored in the database, which looks exactly
   * like "the admin's changes vanished after an update". These orphans are
   * re-matched by their own stored original wording, so a saved edit only needs
   * the text to still exist somewhere on the route, not to sit at the same index.
   */
  const orphans = Array.from(textKeys).filter((key) => {
    const entry = text[key];
    return (
      !resolvedKeys.has(key) &&
      entry &&
      typeof entry.value === 'string' &&
      typeof entry.original === 'string' &&
      entry.original.trim().length > 1
    );
  });

  if (orphans.length) {
    const candidates = allTextNodes.filter((node) => !touchedNodes.has(node));
    orphans.forEach((key) => {
      const entry = text[key];
      const wanted = entry.original.trim();
      const node = candidates.find((n) => !touchedNodes.has(n) && n.nodeValue.trim() === wanted);
      if (!node) return;

      touchedNodes.add(node);
      const current = node.nodeValue;
      const trimmed = current.trim();
      if (trimmed !== entry.value) node.nodeValue = current.replace(trimmed, entry.value);
      applied.set(key, { kind: 'text', node, original: entry.original });
    });
  }

  const allImages = collectImages();

  allImages.forEach((img) => {
    const key = pathKey(img);
    const entry = key ? images[key] : null;
    if (!entry || typeof entry.value !== 'string') return;

    resolvedImageKeys.add(key);
    touchedImgs.add(img);

    if (!img.dataset.siteEditorOriginalSrc) {
      img.dataset.siteEditorOriginalSrc = img.getAttribute('src') || '';
    }
    const original = img.dataset.siteEditorOriginalSrc;
    if (img.getAttribute('src') === entry.value) {
      if (!applied.has(key)) applied.set(key, { kind: 'image', node: img, original });
      return;
    }

    const currentSrc = img.getAttribute('src') || '';
    const matchesOriginal = currentSrc === original || currentSrc.endsWith(original.replace(/^\.?\//, ''));
    // Same reasoning as the text pass: only skip when the image this edit
    // replaced genuinely lives somewhere else on the page.
    if (entry.original && !matchesOriginal) {
      const rescuedElsewhere = allImages.some((other) => {
        if (other === img || touchedImgs.has(other)) return false;
        const src = other.getAttribute('src') || '';
        return src === entry.original || src.endsWith(entry.original.replace(/^\.?\//, ''));
      });
      if (rescuedElsewhere) return;
    }
    if (original) {
      img.setAttribute('src', entry.value);
      applied.set(key, { kind: 'image', node: img, original });
    }
  });

  /* Same rescue for images: an entry whose saved position is gone is re-matched
     by the image it was originally applied to, so swapping an image survives a
     layout change the same way an edited sentence does. */
  const orphanImages = Array.from(imageKeys).filter((key) => {
    const entry = images[key];
    return (
      !resolvedImageKeys.has(key) &&
      entry &&
      typeof entry.value === 'string' &&
      typeof entry.original === 'string' &&
      entry.original.length > 0
    );
  });

  if (orphanImages.length) {
    const candidates = allImages.filter((img) => !touchedImgs.has(img));
    orphanImages.forEach((key) => {
      const entry = images[key];
      const wanted = entry.original;
      const node = candidates.find((img) => {
        if (touchedImgs.has(img)) return false;
        const src = img.getAttribute('src') || '';
        return src === wanted || src.endsWith(wanted.replace(/^\.?\//, ''));
      });
      if (!node) return;

      touchedImgs.add(node);
      if (!node.dataset.siteEditorOriginalSrc) {
        node.dataset.siteEditorOriginalSrc = node.getAttribute('src') || '';
      }
      node.setAttribute('src', entry.value);
      applied.set(key, { kind: 'image', node, original: node.dataset.siteEditorOriginalSrc });
    });
  }

  // Anything the admin deleted/reset goes back to the coded default.
  Array.from(applied.keys()).forEach((key) => {
    const record = applied.get(key);
    const stillActive = record.kind === 'text' ? textKeys.has(key) : imageKeys.has(key);
    if (!stillActive) revertEntry(key);
  });
};

/* ── Tiny store ─────────────────────────────────────────────────────────────
   `saved`  = what the server holds (live for every visitor)
   `staged` = unsaved draft changes made in the editor (preview only)

   Drafts are held PER ROUTE and mirrored into sessionStorage. They used to live
   only in memory, so the applier's background refetch (loadRoute → setSaved) or
   a plain navigation wiped them: an admin staged a change, clicked another page,
   came back and found "0 draft" with a dead Publish button. A draft now survives
   navigation and refetches — until the admin Publishes or Discards it.
---------------------------------------------------------------------------*/
const state = {
  route: null,
  saved: { text: {}, images: {} },
  staged: { text: {}, images: {} },
  loading: false,
  loaded: false,
  error: null,
};

const DRAFT_KEY = 'aft_site_editor_drafts_v1';
const MAX_DRAFT_ROUTES = 40;

/** route -> { text, images, at } for every page holding an unpublished draft. */
const stagedByRoute = new Map();
let persistTimer = null;

const readDraftStore = () => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.sessionStorage.getItem(DRAFT_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (err) {
    return {};
  }
};

const writeDraftStore = () => {
  if (typeof window === 'undefined') return;
  try {
    const all = {};
    stagedByRoute.forEach((bucket, route) => {
      const text = bucket.text || {};
      const images = bucket.images || {};
      if (Object.keys(text).length === 0 && Object.keys(images).length === 0) return;
      all[route] = { text, images, at: bucket.at || Date.now() };
    });

    const routes = Object.keys(all);
    if (routes.length > MAX_DRAFT_ROUTES) {
      routes
        .sort((a, b) => (all[a].at || 0) - (all[b].at || 0))
        .slice(0, routes.length - MAX_DRAFT_ROUTES)
        .forEach((old) => { delete all[old]; stagedByRoute.delete(old); });
    }

    if (Object.keys(all).length === 0) window.sessionStorage.removeItem(DRAFT_KEY);
    else window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify(all));
  } catch (err) {
    /* private mode or quota — drafts still work in memory for this page view */
  }
};

/* Staging on every keystroke would hit storage dozens of times a second; a draft
   only has to be durable, not instant. */
const schedulePersist = () => {
  if (typeof window === 'undefined') return;
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => { persistTimer = null; writeDraftStore(); }, 250);
};

/** The drafts this route already holds in memory (or in the browser session). */
const heldDrafts = (route) => {
  if (!route) return { text: {}, images: {} };
  const held = stagedByRoute.get(route);
  if (held) return { text: held.text || {}, images: held.images || {} };

  const entry = readDraftStore()[route];
  if (!entry) return { text: {}, images: {} };
  const bucket = {
    text: entry.text && typeof entry.text === 'object' ? entry.text : {},
    images: entry.images && typeof entry.images === 'object' ? entry.images : {},
    at: entry.at || Date.now(),
  };
  if (Object.keys(bucket.text).length === 0 && Object.keys(bucket.images).length === 0) {
    return { text: {}, images: {} };
  }
  stagedByRoute.set(route, bucket);
  return { text: bucket.text, images: bucket.images };
};

/** Mirror what is staged for the current route back into the map + storage. */
const syncStaged = () => {
  const route = state.route;
  if (!route) return;
  const isEmpty = Object.keys(state.staged.text).length === 0
    && Object.keys(state.staged.images).length === 0;
  if (isEmpty) {
    stagedByRoute.delete(route);
  } else {
    const held = stagedByRoute.get(route);
    stagedByRoute.set(route, {
      text: state.staged.text,
      images: state.staged.images,
      at: held?.at || Date.now(),
    });
  }
  schedulePersist();
};

/* ── Local warm start ───────────────────────────────────────────────────────
   The server round-trip can only start after React mounts, so a refresh used to
   paint the CODED text first and swap in the admin's edited text a moment later
   ("pehle build wali screen, phir current wali"). The last known overrides for
   each route are kept locally and applied synchronously, before the first paint.
---------------------------------------------------------------------------*/
const CACHE_KEY = 'aft_site_overrides_v1';
const MAX_CACHED_ROUTES = 40;

const readCache = () => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (err) {
    return {};
  }
};

const writeCache = (route, text, images) => {
  if (typeof window === 'undefined' || !route) return;
  try {
    const all = readCache();
    const isEmpty = !text || Object.keys(text).length === 0;
    const isEmptyImages = !images || Object.keys(images).length === 0;

    if (isEmpty && isEmptyImages) {
      delete all[route];
    } else {
      all[route] = { text: text || {}, images: images || {}, at: Date.now() };
    }

    const routes = Object.keys(all);
    if (routes.length > MAX_CACHED_ROUTES) {
      routes
        .sort((a, b) => (all[a]?.at || 0) - (all[b]?.at || 0))
        .slice(0, routes.length - MAX_CACHED_ROUTES)
        .forEach((old) => delete all[old]);
    }

    window.localStorage.setItem(CACHE_KEY, JSON.stringify(all));
  } catch (err) {
    /* storage blocked or full — the site still works, just without the warm start */
  }
};

const readCachedRoute = (route) => {
  const entry = readCache()[route];
  if (!entry || typeof entry !== 'object') return null;
  const text = entry.text && typeof entry.text === 'object' ? entry.text : {};
  const images = entry.images && typeof entry.images === 'object' ? entry.images : {};
  if (Object.keys(text).length === 0 && Object.keys(images).length === 0) return null;
  return { text, images };
};

/**
 * Warm start for one route WITHOUT the network, so the caller can apply the last
 * known overrides before the browser paints. Returns true when there was
 * something to put on the page: a cached live override, or a restored draft.
 *
 * A route's own unpublished draft is reloaded here as well — coming back to a
 * page must never cost the admin work they have not published yet.
 */
export const hydrateRoute = (route) => {
  const cached = route ? readCachedRoute(route) : null;
  state.route = route || null;
  state.staged = heldDrafts(state.route);

  const draftCount = Object.keys(state.staged.text).length + Object.keys(state.staged.images).length;

  if (cached) {
    state.saved = { text: cached.text, images: cached.images };
    state.loaded = true;
    state.loading = false;
    state.error = null;
    return true;
  }
  return draftCount > 0;
};

const listeners = new Set();

export const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const emit = () => listeners.forEach((listener) => {
  try { listener(); } catch (err) { console.error('site overrides listener failed', err); }
});

export const getState = () => state;

export const merged = () => ({
  text: { ...state.saved.text, ...state.staged.text },
  images: { ...state.saved.images, ...state.staged.images },
});

export const hasOverrides = () => {
  const { text, images } = merged();
  return Object.keys(text).length > 0 || Object.keys(images).length > 0;
};

export const applyCurrent = () => {
  const { text, images } = merged();
  applyOverridesToDom(text, images);
};

export const setRoute = (route) => {
  const next = route || null;
  if (state.route === next) return;
  state.route = next;
  // Switching pages is not a discard: bring back whatever this page was holding.
  state.staged = heldDrafts(next);
  state.loaded = false;
  emit();
};

export const setSaved = (route, text = {}, images = {}) => {
  if (!route) return;
  /*
   * Deliberately leaves state.staged alone. This runs after every background
   * refetch, and resetting staged here was precisely why an unpublished edit
   * vanished while the admin was still working on it.
   */
  state.saved = { text: text || {}, images: images || {} };
  state.loading = false;
  state.loaded = true;
  state.error = null;
  writeCache(route, state.saved.text, state.saved.images);
  emit();
};

export const loadRoute = async (route) => {
  setRoute(route);
  state.loading = true;
  state.error = null;
  emit();
  try {
    const res = await api.get(`/settings/site-editor?route=${encodeURIComponent(route)}`);
    if (res.data?.success) {
      const text = res.data.text || {};
      const images = res.data.images || {};
      if (state.route === route) {
        setSaved(route, text, images);
      } else {
        // A slow response for a page the admin has already left: refresh that
        // page's warm start without dragging the editor back to it.
        writeCache(route, text, images);
      }
      return { text, images };
    }
  } catch (err) {
    if (state.route === route) {
      state.loading = false;
      state.error = err.response?.data?.message || err.message;
      emit();
    }
  }
  return { text: {}, images: {} };
};

export const stage = (kind, key, entry) => {
  if (!key) return;
  const bucket = kind === 'image' ? 'images' : 'text';
  state.staged = { ...state.staged, [bucket]: { ...state.staged[bucket], [key]: entry } };
  syncStaged();
  emit();
};

export const unstage = (kind, key) => {
  const bucket = kind === 'image' ? 'images' : 'text';
  if (!state.staged[bucket][key]) return;
  const next = { ...state.staged[bucket] };
  delete next[key];
  state.staged = { ...state.staged, [bucket]: next };
  syncStaged();
  emit();
};

/** Drop several staged entries at once — used to clear everything the server accepted. */
export const unstageMany = (entries = []) => {
  if (!entries.length) return;
  const text = { ...state.staged.text };
  const images = { ...state.staged.images };
  entries.forEach(({ kind, key }) => {
    if (kind === 'image') delete images[key];
    else delete text[key];
  });
  state.staged = { text, images };
  syncStaged();
  emit();
};

export const clearStaged = () => {
  state.staged = { text: {}, images: {} };
  syncStaged();
  emit();
};

export const stagedCount = () =>
  Object.keys(state.staged.text).length + Object.keys(state.staged.images).length;

/** Every page that still holds an unpublished draft (including other pages). */
export const pendingRoutes = () => {
  const stored = readDraftStore();
  const routes = new Set([...Object.keys(stored), ...stagedByRoute.keys()]);
  return Array.from(routes).filter((route) => {
    const bucket = stagedByRoute.get(route) || stored[route];
    if (!bucket) return false;
    return Object.keys(bucket.text || {}).length > 0 || Object.keys(bucket.images || {}).length > 0;
  });
};

/* ── Pre-flight validation ──────────────────────────────────────────────────
   The server refuses an entry whose key is longer than 90 characters or whose
   text passes 600, and used to report only "N were rejected". The same rules are
   checked here so the editor can name the offending element and say why BEFORE
   Publish — and so Publish can explain itself if one still slips through.
---------------------------------------------------------------------------*/
export const EDITOR_LIMITS = {
  keyLength: 90,
  textLength: 600,
  imageUrlLength: 1000,
};

const KEY_PATTERN = /^[A-Za-z0-9_\-:#>.]+$/;

const isStorableImageUrl = (value) => {
  const url = String(value || '').trim();
  if (!url || url.length > EDITOR_LIMITS.imageUrlLength) return false;
  return /^(https?:\/\/|\/)[^\s"'<>]+$/i.test(url);
};

/** Why this entry cannot be stored — null when it is fine. */
export const explainRejection = (kind, key, entry) => {
  const keyStr = String(key ?? '');
  if (!keyStr) return 'this element could not be given a stable key — reload the page and try again';
  if (keyStr.length > EDITOR_LIMITS.keyLength) {
    return `its key is ${keyStr.length} characters long and the editor can only store ${EDITOR_LIMITS.keyLength}`;
  }
  if (!KEY_PATTERN.test(keyStr)) return 'its key contains characters the editor cannot store';

  const value = typeof entry === 'string' ? entry : entry?.value;
  if (typeof value !== 'string') return 'no value was captured for it';

  const trimmed = value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
  if (kind === 'image') {
    if (!isStorableImageUrl(trimmed)) {
      return `the image URL must start with https:// (or /) and stay under ${EDITOR_LIMITS.imageUrlLength} characters`;
    }
  } else if (trimmed.length > EDITOR_LIMITS.textLength) {
    return `the text is ${trimmed.length} characters long and the limit is ${EDITOR_LIMITS.textLength}`;
  }
  return null;
};

/** Every staged entry on this page the server would refuse, with the reason. */
export const stagedRejections = () => {
  const out = [];
  const inspect = (kind, bucket) => {
    Object.entries(bucket || {}).forEach(([key, entry]) => {
      const reason = explainRejection(kind, key, entry);
      if (reason) out.push({ kind, key, reason });
    });
  };
  inspect('text', state.staged.text);
  inspect('image', state.staged.images);
  return out;
};
