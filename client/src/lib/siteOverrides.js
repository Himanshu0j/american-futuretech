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

  collectTextNodes().forEach((node) => {
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
    if (hasOriginal && trimmed !== entry.original) return;   // layout drifted — leave defaults
    node.nodeValue = current.replace(trimmed, entry.value);
    applied.set(key, { kind: 'text', node, original: hasOriginal ? entry.original : trimmed });
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
    const candidates = collectTextNodes().filter((node) => !touchedNodes.has(node));
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

  collectImages().forEach((img) => {
    const key = pathKey(img);
    const entry = key ? images[key] : null;
    if (!entry || typeof entry.value !== 'string') return;

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
    if ((!entry.original || matchesOriginal) && original) {
      img.setAttribute('src', entry.value);
      applied.set(key, { kind: 'image', node: img, original });
    }
  });

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
---------------------------------------------------------------------------*/
const state = {
  route: null,
  saved: { text: {}, images: {} },
  staged: { text: {}, images: {} },
  loading: false,
  loaded: false,
  error: null,
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
 * Load this route's last known overrides into the store WITHOUT the network, so
 * the caller can apply them before the browser paints. Returns true when there
 * was something cached.
 */
export const hydrateRoute = (route) => {
  const cached = route ? readCachedRoute(route) : null;
  state.route = route || null;
  state.staged = { text: {}, images: {} };
  if (cached) {
    state.saved = { text: cached.text, images: cached.images };
    state.loaded = true;
    state.loading = false;
    state.error = null;
    return true;
  }
  return false;
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
  if (state.route === route) return;
  state.route = route;
  state.staged = { text: {}, images: {} };
  state.loaded = false;
  emit();
};

export const setSaved = (route, text = {}, images = {}) => {
  state.route = route;
  state.saved = { text: text || {}, images: images || {} };
  state.staged = { text: {}, images: {} };
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
  try {
    const res = await api.get(`/settings/site-editor?route=${encodeURIComponent(route)}`);
    if (res.data?.success) {
      setSaved(route, res.data.text, res.data.images);
      return { text: res.data.text || {}, images: res.data.images || {} };
    }
  } catch (err) {
    state.loading = false;
    state.error = err.response?.data?.message || err.message;
    emit();
  }
  return { text: {}, images: {} };
};

export const stage = (kind, key, entry) => {
  if (!key) return;
  const bucket = kind === 'image' ? 'images' : 'text';
  state.staged = { ...state.staged, [bucket]: { ...state.staged[bucket], [key]: entry } };
  emit();
};

export const unstage = (kind, key) => {
  const bucket = kind === 'image' ? 'images' : 'text';
  if (!state.staged[bucket][key]) return;
  const next = { ...state.staged[bucket] };
  delete next[key];
  state.staged = { ...state.staged, [bucket]: next };
  emit();
};

export const clearStaged = () => {
  state.staged = { text: {}, images: {} };
  emit();
};

export const stagedCount = () =>
  Object.keys(state.staged.text).length + Object.keys(state.staged.images).length;
