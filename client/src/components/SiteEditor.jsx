import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Pencil, Image as ImageIcon, Save, RotateCcw, X, Search, Check, Loader2,
  AlertCircle, Undo2, Eye, Layers,
} from 'lucide-react';
import api from '../lib/api';
import ImageUploadInput from '../admin/components/ImageUploadInput';
import { PUBLIC_PAGES, editorUrlFor } from '../data/publicPages';
import {
  applyCurrent,
  clearStaged,
  collectImages,
  collectTextNodes,
  EDITOR_LIMITS,
  getState,
  hasOverrides,
  isEditorUi,
  loadRoute,
  merged,
  pathKey,
  pendingRoutes,
  stage as stageInStore,
  setSaved,
  stagedCount,
  stagedRejections,
  subscribe,
  unstage,
  unstageMany,
} from '../lib/siteOverrides';

/**
 * Inline website editor.
 *
 * Lets a signed-in admin change ANY text or image on the public site — down to a
 * single word — without touching code. It works on the rendered DOM instead of
 * requiring every string to be wired into the CMS, so coverage is complete:
 *
 *   1. every text node / <img> gets a stable key from its position in the DOM
 *   2. edits are stored per route in SiteSettings.textOverrides / imageOverrides
 *   3. SiteOverridesApplier renders them for every visitor, not just for the editor
 *
 * Open it with ?edit=1 on any public page (the admin sidebar links here).
 *
 * Staged changes are drafts, not throwaway memory: they are kept per page in the
 * browser so navigating away and back never loses them, and Publish always
 * answers with what went live — or exactly which entry it refused and why.
 */

/** Turn the server's `rejections` (or its older `rejected` strings) into reasons. */
const normalizeRejections = (data) => {
  if (Array.isArray(data?.rejections) && data.rejections.length) {
    return data.rejections.map((r) => ({
      kind: r.kind === 'image' ? 'image' : 'text',
      key: String(r.key ?? ''),
      reason: r.reason || 'the server rejected this entry',
    }));
  }
  return (data?.rejected || []).map((label) => {
    const [kind, ...rest] = String(label).split('.');
    return {
      kind: kind === 'image' ? 'image' : 'text',
      key: rest.join('.'),
      reason: 'the server rejected this entry',
    };
  });
};

const describeRejections = (rejections) => rejections
  .map((r) => `${r.kind === 'image' ? 'Image' : 'Text'} “${r.key.slice(0, 46)}” — ${r.reason}`)
  .join(' • ');

/** Build the Publish result message; never returns an empty outcome. */
const buildPublishStatus = (data, rejections, route) => {
  const saved = Number(data?.saved) || 0;
  if (rejections.length === 0) {
    return {
      type: 'success',
      message: `${saved} change(s) published live on ${route} — every visitor sees them now.`,
    };
  }
  if (saved === 0) {
    return {
      type: 'error',
      message: `Nothing was published — all ${rejections.length} staged change(s) were rejected: ${describeRejections(rejections)}`,
    };
  }
  return {
    type: 'warn',
    message: `${saved} change(s) published live on ${route}. ${rejections.length} stayed as a draft because the server refused them: ${describeRejections(rejections)}`,
  };
};

export default function SiteEditor() {
  const [active, setActive] = useState(false);
  const [tick, setTick] = useState(0);
  const [discovered, setDiscovered] = useState({ texts: [], images: [] });
  const [status, setStatus] = useState(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [openEditor, setOpenEditor] = useState(null); // { kind, key, original, value }
  const [panelOpen, setPanelOpen] = useState(true);

  const originalsRef = useRef(new Map());
  const routeRef = useRef('/');

  const token = typeof window !== 'undefined'
    ? (localStorage.getItem('token') || localStorage.getItem('aft_admin_token'))
    : null;

  const route = getState().route || '/';
  const pendingCount = stagedCount();
  const savedCount = useMemo(
    () => Object.keys(getState().saved.text).length + Object.keys(getState().saved.images).length,
    [tick],
  );

  // ── Re-render whenever the shared store changes ───────────────────────────
  useEffect(() => {
    const unsubscribe = subscribe(() => setTick((t) => t + 1));
    return () => unsubscribe();
  }, []);

  // ── Activate only for a signed-in admin with ?edit=1 on a public page ─────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const wantsEdit = params.get('edit') === '1';
    const isAppArea = window.location.pathname.startsWith('/admin') || window.location.pathname.startsWith('/student');
    setActive(Boolean(wantsEdit && token && !isAppArea));
  }, [token]);

  const snapshot = useCallback(() => {
    const current = merged();
    const texts = [];
    collectTextNodes().forEach((node) => {
      const value = (node.nodeValue || '').trim();
      if (value.length < 2 || value.length > 600) return;
      const key = pathKey(node);
      if (!key) return;
      const entry = current.text[key];
      /*
       * The "original" must be the wording on screen RIGHT NOW.
       *
       * Caching the very first snapshot forever poisoned this: the page paints
       * its coded default, /api/settings then swaps in the CMS headline, and the
       * editor kept insisting the coded default was the original — so a
       * published edit was compared against text that no longer existed on the
       * page and never appeared for a visitor.
       */
      const original = entry?.original || value;
      originalsRef.current.set(`t:${key}`, original);
      texts.push({
        key,
        original,
        current: entry ? entry.value : value,
        overridden: Boolean(entry),
        staged: Boolean(getState().staged.text[key]),
        element: node.parentElement,
      });
    });

    const images = [];
    collectImages().forEach((img) => {
      const key = pathKey(img);
      if (!key) return;
      const entry = current.images[key];
      const src = img.getAttribute('src') || '';
      // Same rule as text: never let a stale first snapshot win over the DOM.
      const original = entry?.original || src;
      originalsRef.current.set(`i:${key}`, original);
      images.push({
        key,
        original,
        current: entry ? entry.value : src,
        overridden: Boolean(entry),
        staged: Boolean(getState().staged.images[key]),
        element: img,
      });
    });

    setDiscovered({ texts, images });
  }, []);

  // Highlight editable nodes while editing.
  const decorate = useCallback(() => {
    const marks = [
      ...collectTextNodes().map((n) => n.parentElement),
      ...collectImages(),
    ].filter(Boolean);

    const seen = new Set();
    marks.forEach((el) => {
      if (seen.has(el) || isEditorUi(el)) return;
      seen.add(el);
      el.dataset.siteEditorTarget = 'true';
      el.classList.add('se-editable');
    });
  }, []);

  // Re-apply overrides + refresh the outline whenever the SPA renders again.
  useEffect(() => {
    if (!active) return;
    let timer = null;
    const observer = new MutationObserver(() => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        if (hasOverrides()) applyCurrent();
        decorate();
      }, 120);
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });

    const onRouteChange = () => {
      const nextRoute = window.location.pathname || '/';
      if (nextRoute !== routeRef.current) {
        routeRef.current = nextRoute;
        setStatus(null);
        snapshot();
      }
    };
    const interval = setInterval(onRouteChange, 700);

    const t = setTimeout(() => { if (hasOverrides()) applyCurrent(); decorate(); snapshot(); }, 400);
    return () => {
      observer.disconnect();
      clearInterval(interval);
      clearTimeout(t);
      if (timer) clearTimeout(timer);
    };
  }, [active, applyCurrent, decorate, snapshot]);

  // Refresh the outline when the store changes so badges stay accurate.
  useEffect(() => {
    if (!active) return;
    const id = setTimeout(snapshot, 150);
    return () => clearTimeout(id);
  }, [active, tick, snapshot]);

  // Arriving on a page that still holds a draft says so, instead of silently
  // showing the staged text with no explanation of where it came from.
  const arrivalRef = useRef({ path: null, announced: false });
  useEffect(() => {
    if (!active) return;
    const count = stagedCount();
    if (count === 0) {
      arrivalRef.current = { path: route, announced: false };
      return;
    }
    if (arrivalRef.current.path === route && arrivalRef.current.announced) return;
    arrivalRef.current = { path: route, announced: true };
    setStatus({
      type: 'info',
      message: `Restored ${count} unsaved draft change(s) on ${route}. They are staged only — press Publish to make them live.`,
    });
  }, [active, route, tick]);

  // Click-to-edit on any highlighted text / image.
  useEffect(() => {
    if (!active) return;
    const onClick = (event) => {
      const target = event.target.closest('[data-site-editor-target="true"]');
      if (!target || isEditorUi(target)) return;
      if (target.tagName === 'A' || target.closest('a')) event.preventDefault();

      if (target.tagName === 'IMG') {
        const key = pathKey(target);
        const entry = merged().images[key];
        setOpenEditor({
          kind: 'image',
          key,
          original: entry?.original || target.dataset.siteEditorOriginalSrc
            || originalsRef.current.get(`i:${key}`) || target.getAttribute('src') || '',
          value: entry?.value || target.getAttribute('src') || '',
        });
        return;
      }

      const textNode = Array.from(target.childNodes).find((n) => n.nodeType === 3 && n.nodeValue.trim().length > 1);
      const key = textNode ? pathKey(textNode) : null;
      if (!key) return;
      const entry = merged().text[key];
      setOpenEditor({
        kind: 'text',
        key,
        // What the admin is looking at is the truth, not a cached first snapshot.
        original: entry?.original || (textNode ? textNode.nodeValue.trim() : '')
          || originalsRef.current.get(`t:${key}`) || '',
        value: entry?.value || (textNode ? textNode.nodeValue.trim() : ''),
      });
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [active]);

  const stageDraft = (kind, key, value, original) => {
    stageInStore(kind, key, { original, value });
    applyCurrent();
    snapshot();
  };

  const publish = async () => {
    if (saving) return;
    const state = getState();
    const stagedText = { ...state.staged.text };
    const stagedImages = { ...state.staged.images };
    const stagedKeys = [
      ...Object.keys(stagedText).map((key) => ({ kind: 'text', key })),
      ...Object.keys(stagedImages).map((key) => ({ kind: 'image', key })),
    ];

    // Publish must always answer. A disabled button used to hide a lost draft
    // behind a dead click, so it now reports the (empty) outcome instead.
    if (stagedKeys.length === 0) {
      setStatus({
        type: 'info',
        message: `Nothing is staged on ${route} yet — click a text or an image on the page, change it, then press Publish.`,
      });
      return;
    }

    setSaving(true);
    setStatus(null);
    try {
      const res = await api.put('/settings/site-editor', {
        route: state.route,
        text: stagedText,
        images: stagedImages,
      });

      if (!res.data?.success) {
        setStatus({
          type: 'error',
          message: res.data?.message || 'The server did not save your changes — nothing was published.',
        });
        return;
      }

      const rejections = normalizeRejections(res.data);
      const refused = new Set(rejections.map((r) => `${r.kind}:${r.key}`));

      // This is what every visitor sees now.
      setSaved(state.route, res.data.text || {}, res.data.images || {});
      // Accepted drafts are live, so only the refused ones stay staged — the
      // admin can see them, fix them, and publish again.
      unstageMany(stagedKeys.filter((entry) => !refused.has(`${entry.kind}:${entry.key}`)));
      applyCurrent();
      snapshot();
      setStatus(buildPublishStatus(res.data, rejections, state.route));
    } catch (err) {
      setStatus({
        type: 'error',
        message: `${err.response?.data?.message || 'Could not reach the server, so nothing was published.'} Your draft is still here — press Publish again.`,
      });
    } finally {
      setSaving(false);
    }
  };

  const discard = () => {
    const count = stagedCount();
    clearStaged();
    applyCurrent();
    snapshot();
    setStatus({
      type: 'success',
      message: `${count} draft change(s) discarded on ${route}. Nothing was published.`,
    });
  };

  const resetPage = async () => {
    if (!window.confirm(`Remove every published change AND any draft on ${route}, and restore the original content?`)) return;
    setSaving(true);
    try {
      clearStaged();
      await api.delete(`/settings/site-editor?route=${encodeURIComponent(route)}`);
      await loadRoute(route);
      originalsRef.current = new Map();
      applyCurrent();
      snapshot();
      setStatus({ type: 'success', message: `${route} restored to the original content — drafts cleared too.` });
    } catch (err) {
      setStatus({ type: 'error', message: err.response?.data?.message || 'Reset failed.' });
    } finally {
      setSaving(false);
    }
  };

  const revertOne = (kind, key) => {
    unstage(kind, key);
    // Remove the saved override too (server-side) so the page shows the default.
    const state = getState();
    const bucket = kind === 'image' ? 'images' : 'text';
    if (state.saved[bucket][key]) {
      api.put('/settings/site-editor', {
        route: state.route,
        [kind === 'image' ? 'removeImages' : 'removeText']: [key],
      }).then((res) => {
        if (res.data?.success) {
          setSaved(state.route, res.data.text || {}, res.data.images || {});
          applyCurrent();
          snapshot();
        }
      }).catch(() => {});
    }
    snapshot();
  };

  const jumpTo = (item) => {
    if (item.element) {
      item.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      item.element.classList.add('se-flash');
      setTimeout(() => item.element.classList.remove('se-flash'), 1200);
    }
  };

  if (!active) return null;

  // Entries the server would refuse, spotted before Publish rather than reported
  // afterwards as an anonymous count.
  const preflight = stagedRejections();
  const otherDraftPages = pendingRoutes().filter((r) => r !== route);

  const filteredTexts = discovered.texts.filter((t) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return t.current.toLowerCase().includes(q) || t.original.toLowerCase().includes(q);
  });

  return (
    <>
      {/* Highlight styles for editable regions */}
      <style>{`
        .se-editable { outline: 1px dashed rgba(99,102,241,0.55); outline-offset: 2px; cursor: text; transition: outline-color .15s ease; }
        .se-editable:hover { outline: 2px solid rgba(99,102,241,0.95); background: rgba(99,102,241,0.08); }
        img.se-editable { cursor: crosshair; }
        .se-flash { outline: 3px solid #E5C275 !important; }
      `}</style>

      <div
        data-site-editor-ui="true"
        className="fixed bottom-4 right-4 z-[9999] flex flex-col items-end gap-2 font-sans"
      >
        {openEditor && (
          <div className="w-[min(92vw,420px)] rounded-2xl border border-indigo-500/30 bg-[#0B1220] p-4 shadow-2xl">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                {openEditor.kind === 'text' ? <Pencil className="w-3.5 h-3.5 text-indigo-400" /> : <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />}
                {openEditor.kind === 'text' ? 'Edit text' : 'Replace image'}
              </div>
              <button type="button" onClick={() => setOpenEditor(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {openEditor.kind === 'text' ? (
              <textarea
                autoFocus
                rows={3}
                value={openEditor.value}
                onChange={(e) => setOpenEditor((prev) => ({ ...prev, value: e.target.value }))}
                className="w-full p-2.5 rounded-xl bg-[#070C17] border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500"
              />
            ) : (
              <ImageUploadInput
                label="Replace image"
                value={openEditor.value}
                onChange={(url) => setOpenEditor((prev) => ({ ...prev, value: url }))}
                placeholder="Paste an image URL or upload a file from your computer…"
                previewSize="w-12 h-12"
              />
            )}

            <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
              Original: <span className="text-slate-300">{String(openEditor.original).slice(0, 90)}</span>
            </p>

            <div className="flex items-center gap-2 mt-3">
              <button
                type="button"
                onClick={() => {
                  if (!openEditor.value.trim()) return;
                  stageDraft(openEditor.kind, openEditor.key, openEditor.value, openEditor.original);
                  setOpenEditor(null);
                }}
                className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" /> Stage change
              </button>
              <button
                type="button"
                onClick={() => { revertOne(openEditor.kind, openEditor.key); setOpenEditor(null); }}
                className="py-2 px-3 rounded-xl border border-white/10 text-slate-300 hover:text-white text-xs"
                title="Restore the original wording for this element"
              >
                Revert
              </button>
            </div>
          </div>
        )}

        {panelOpen && (
          <div className="w-[min(92vw,420px)] max-h-[70vh] rounded-2xl border border-white/10 bg-[#0B1220]/98 backdrop-blur-xl shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                <span className="text-sm font-bold text-white">Website Editor</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-slate-400">{route}</span>
                <button type="button" onClick={() => setPanelOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="px-4 py-3 border-b border-white/10 space-y-2">
              <label className="block">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Editing page</span>
                <select
                  value={PUBLIC_PAGES.some((p) => p.path === route) ? route : ''}
                  onChange={(e) => { if (e.target.value) window.location.href = editorUrlFor(e.target.value); }}
                  className="mt-1 w-full px-2.5 py-2 rounded-xl bg-[#070C17] border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500"
                >
                  {!PUBLIC_PAGES.some((p) => p.path === route) && (
                    <option value="">{route || 'This page'}</option>
                  )}
                  {PUBLIC_PAGES.map((page) => (
                    <option key={page.path} value={page.path}>{page.label}</option>
                  ))}
                </select>
              </label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-500" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={`Search ${discovered.texts.length} texts on this page…`}
                  className="w-full pl-8 pr-3 py-2 rounded-xl bg-[#070C17] border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex items-center gap-2 text-[10px] text-slate-400">
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/25 text-indigo-300">
                  {discovered.texts.length} texts
                </span>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/25 text-indigo-300">
                  {discovered.images.length} images
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-emerald-300">
                  {savedCount} live · {pendingCount} draft
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-white/5">
              {filteredTexts.length === 0 && (
                <div className="p-4 text-xs text-slate-400">No matching text on this page.</div>
              )}
              {filteredTexts.map((item) => (
                <div key={item.key} className="p-3 hover:bg-white/[0.03]">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <button
                      type="button"
                      onClick={() => jumpTo(item)}
                      className="text-[10px] font-mono text-indigo-300 hover:text-indigo-200 truncate flex items-center gap-1"
                      title="Scroll to this text on the page"
                    >
                      <Eye className="w-3 h-3" /> {item.key.slice(0, 34)}
                    </button>
                    {item.key.length > EDITOR_LIMITS.keyLength ? (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 shrink-0" title={`This element's key is ${item.key.length} characters; the editor can only store ${EDITOR_LIMITS.keyLength}, so this one cannot be saved.`}>
                        TOO LONG TO SAVE
                      </span>
                    ) : (item.overridden || item.staged) && (
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${item.staged ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                        {item.staged ? 'DRAFT' : 'LIVE'}
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={item.current}
                    onClick={() => jumpTo(item)}
                    onChange={(e) => stageInStore('text', item.key, { original: item.original, value: e.target.value })}
                    onBlur={snapshot}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-[#070C17] border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
              ))}

              {discovered.images.length > 0 && (
                <div className="p-3 bg-white/[0.02]">
                  <div className="text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <ImageIcon className="w-3 h-3 text-indigo-400" /> Images on this page
                  </div>
                  <div className="space-y-2">
                    {discovered.images.map((item) => (
                      <div key={item.key} className="flex items-center gap-2">
                        <img src={item.current} alt="" className="w-8 h-8 rounded object-cover border border-white/10 shrink-0" />
                        <input
                          type="text"
                          value={item.current}
                          onChange={(e) => stageInStore('image', item.key, { original: item.original, value: e.target.value })}
                          onBlur={snapshot}
                          className="flex-1 px-2 py-1.5 rounded-lg bg-[#070C17] border border-white/10 text-white text-[10px] font-mono focus:outline-none focus:border-indigo-500"
                        />
                        <button
                          type="button"
                          onClick={() => revertOne('image', item.key)}
                          className="text-slate-400 hover:text-white shrink-0"
                          title="Restore the original image"
                        >
                          <Undo2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {pendingCount > 0 && preflight.length > 0 && (
              <div className="px-4 py-2.5 text-[11px] flex items-start gap-2 border-t border-white/10 bg-rose-500/10 text-rose-200">
                <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>
                  {preflight.length} staged change(s) cannot be stored and will be refused on Publish:{' '}
                  {describeRejections(preflight)}
                </span>
              </div>
            )}

            {status && (
              <div
                className={`px-4 py-2.5 text-[11px] flex items-start gap-2 border-t border-white/10 ${
                  status.type === 'error' ? 'bg-rose-500/10 text-rose-200'
                    : status.type === 'warn' ? 'bg-amber-500/10 text-amber-200'
                      : status.type === 'info' ? 'bg-indigo-500/10 text-indigo-200'
                        : 'bg-emerald-500/10 text-emerald-200'
                }`}
              >
                {status.type === 'success' ? <Check className="w-3.5 h-3.5 mt-0.5 shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />}
                <span>{status.message}</span>
              </div>
            )}

            <div className="p-3 border-t border-white/10 flex items-center gap-2">
              <button
                type="button"
                onClick={publish}
                disabled={saving}
                title="Publish every staged change on this page"
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-bold flex items-center justify-center gap-1.5"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Publish {pendingCount > 0 ? `(${pendingCount})` : ''}
              </button>
              <button
                type="button"
                onClick={discard}
                disabled={pendingCount === 0}
                className="py-2.5 px-3 rounded-xl border border-white/10 text-slate-300 hover:text-white disabled:opacity-40 text-xs"
              >
                Discard
              </button>
              <button
                type="button"
                onClick={resetPage}
                className="py-2.5 px-3 rounded-xl border border-rose-500/30 text-rose-300 hover:bg-rose-500/10 text-xs flex items-center gap-1.5"
                title="Restore this page to its original content"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset
              </button>
            </div>

            <p className="px-4 pb-3 text-[10px] text-slate-500 leading-relaxed">
              Click any outlined text or image on the page to edit it. Changes are staged as a draft first and
              kept per page — you can leave this page and come back without losing them. Press Publish and every
              visitor sees them.
              {otherDraftPages.length > 0 && (
                <span className="block mt-1 text-amber-400/80">
                  Unpublished drafts are also waiting on: {otherDraftPages.join(', ')}
                </span>
              )}
            </p>
          </div>
        )}

        {!panelOpen && (
          <button
            type="button"
            onClick={() => { setPanelOpen(true); snapshot(); decorate(); }}
            className="px-4 py-3 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-2xl flex items-center gap-2"
          >
            <Pencil className="w-3.5 h-3.5" /> Edit website text & images
          </button>
        )}
      </div>
    </>
  );
}
