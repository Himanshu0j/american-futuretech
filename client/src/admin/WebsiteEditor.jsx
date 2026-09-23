import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import {
  PencilLine, ExternalLink, RotateCcw, Search, Layers, MousePointerClick,
  Image as ImageIcon, Type, CheckCircle2, AlertCircle, Loader2, BookOpen, Info,
} from 'lucide-react';
import { PUBLIC_PAGES, editorUrlFor, labelForRoute } from '../data/publicPages';

/**
 * One screen that answers "kahan kya badla hai?".
 *
 * Text and images are edited straight on the live page (open any page with
 * ?edit=1). This page is the control room: it lists every page that currently
 * has saved changes, how many, and lets you reopen or reset each one.
 */
export default function WebsiteEditor() {
  const [summary, setSummary] = useState({ pages: [], totals: { pages: 0, text: 0, images: 0 } });
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [search, setSearch] = useState('');
  const [notice, setNotice] = useState(null);

  const token = typeof window !== 'undefined'
    ? (localStorage.getItem('token') || localStorage.getItem('aft_admin_token'))
    : null;
  const headers = useMemo(() => (token ? { Authorization: `Bearer ${token}` } : {}), [token]);

  const load = async () => {
    setLoading(true);
    try {
      const [summaryRes, coursesRes] = await Promise.all([
        axios.get('/api/settings/site-editor/summary', { headers }),
        axios.get('/api/courses').catch(() => ({ data: {} })),
      ]);
      if (summaryRes.data?.success) {
        setSummary({ pages: summaryRes.data.pages || [], totals: summaryRes.data.totals || { pages: 0, text: 0, images: 0 } });
      }
      const courseList = coursesRes.data?.courses || coursesRes.data?.data || [];
      setCourses(Array.isArray(courseList) ? courseList : []);
    } catch (err) {
      setNotice({ type: 'error', message: err.response?.data?.message || 'Could not load the edit summary.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const byRoute = useMemo(() => {
    const map = {};
    summary.pages.forEach((page) => { map[page.route] = page; });
    return map;
  }, [summary.pages]);

  const coursePages = courses
    .filter((c) => c?.slug)
    .map((c) => ({ path: `/courses/${c.slug}`, label: c.title || c.slug, group: 'Course pages' }));

  const allPages = [...PUBLIC_PAGES, ...coursePages];

  const filtered = allPages.filter((page) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return page.path.toLowerCase().includes(q) || page.label.toLowerCase().includes(q);
  });

  const groups = filtered.reduce((acc, page) => {
    const key = page.group || 'Pages';
    acc[key] = acc[key] || [];
    acc[key].push(page);
    return acc;
  }, {});

  const resetPage = async (route) => {
    if (!window.confirm(`Reset every text and image change on ${route}? The page will show its original content again.`)) return;
    setBusy(route);
    setNotice(null);
    try {
      const res = await axios.delete(`/api/settings/site-editor?route=${encodeURIComponent(route)}`, { headers });
      if (res.data?.success) {
        setNotice({
          type: 'success',
          message: `${route} reset — ${res.data.removedText || 0} text and ${res.data.removedImages || 0} image change(s) removed.`,
        });
        await load();
      }
    } catch (err) {
      setNotice({ type: 'error', message: err.response?.data?.message || 'Reset failed.' });
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl bg-[#0B1220] border border-white/[0.08] p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-[11px] font-mono text-indigo-400 uppercase tracking-wider">
              <Layers className="w-3.5 h-3.5" /> Content control
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white font-heading mt-2">Website Editor</h1>
            <p className="text-xs text-slate-400 leading-relaxed mt-2">
              Change <strong className="text-slate-200">any text or image</strong> on the live website — down to a single word.
              Pick a page below, click <span className="text-slate-200">Edit on site</span>, then click any outlined text or picture
              on the page and publish. Visitors see your change immediately.
            </p>
          </div>
          <a
            href={editorUrlFor('/')}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 whitespace-nowrap"
          >
            <PencilLine className="w-3.5 h-3.5" /> Start editing the home page
          </a>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-5 max-w-lg">
          {[
            { label: 'Pages edited', value: summary.totals.pages, icon: Layers },
            { label: 'Text changes', value: summary.totals.text, icon: Type },
            { label: 'Image changes', value: summary.totals.images, icon: ImageIcon },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl bg-[#070C17] border border-white/[0.08] p-3">
              <stat.icon className="w-3.5 h-3.5 text-indigo-400 mb-2" />
              <div className="text-lg font-black text-white font-heading">{stat.value}</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="mt-5 flex items-start gap-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 p-3 text-[11px] text-indigo-200 leading-relaxed">
          <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span>
            Wording that comes from a course, job, blog or FAQ record is edited on its own page
            (Curriculum &amp; Courses CMS, Partner Job Board, Content &amp; FAQs CMS). This editor handles
            everything else — headings, buttons, labels, footer text and every image.
          </span>
        </div>
      </div>

      {notice && (
        <div
          className={`rounded-2xl border p-4 text-xs flex items-start gap-2 ${
            notice.type === 'error'
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-200'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
          }`}
        >
          {notice.type === 'error' ? <AlertCircle className="w-4 h-4 mt-0.5" /> : <CheckCircle2 className="w-4 h-4 mt-0.5" />}
          <span>{notice.message}</span>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search a page — e.g. courses, blog, privacy…"
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0B1220] border border-white/[0.08] text-white text-xs focus:outline-none focus:border-indigo-500"
        />
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-xs text-slate-400 px-1">
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading pages…
        </div>
      )}

      {!loading && Object.entries(groups).map(([groupName, pages]) => (
        <div key={groupName} className="rounded-2xl bg-[#0B1220] border border-white/[0.08] overflow-hidden">
          <div className="px-5 py-3 border-b border-white/[0.08] flex items-center gap-2">
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">{groupName}</span>
            <span className="text-[10px] text-slate-500">({pages.length})</span>
          </div>

          <div className="divide-y divide-white/[0.05]">
            {pages.map((page) => {
              const stats = byRoute[page.path];
              const edited = stats && stats.total > 0;
              return (
                <div key={page.path} className="px-5 py-3.5 flex flex-wrap items-center gap-3 hover:bg-white/[0.02]">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-white truncate">{page.label}</div>
                    <div className="text-[10px] font-mono text-slate-500 truncate">{page.path}</div>
                    {edited && stats.samples?.length > 0 && (
                      <div className="text-[10px] text-slate-400 truncate mt-1">
                        e.g. “{String(stats.samples[0].original).slice(0, 40)}” → “{String(stats.samples[0].value).slice(0, 40)}”
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {edited ? (
                      <>
                        <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-emerald-300">
                          {stats.textCount} text · {stats.imageCount} image
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {stats.updatedAt ? new Date(stats.updatedAt).toLocaleDateString() : ''}
                        </span>
                      </>
                    ) : (
                      <span className="text-[10px] px-2 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-slate-400">
                        No edits yet
                      </span>
                    )}

                    <a
                      href={editorUrlFor(page.path)}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold flex items-center gap-1.5"
                    >
                      <MousePointerClick className="w-3 h-3" /> Edit on site
                    </a>

                    {edited && (
                      <button
                        type="button"
                        onClick={() => resetPage(page.path)}
                        disabled={busy === page.path}
                        className="px-2.5 py-1.5 rounded-lg border border-rose-500/30 text-rose-300 hover:bg-rose-500/10 text-[11px] disabled:opacity-40 flex items-center gap-1.5"
                        title="Remove every change on this page"
                      >
                        {busy === page.path ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
                        Reset
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {!loading && filtered.length === 0 && (
        <div className="rounded-2xl bg-[#0B1220] border border-white/[0.08] p-8 text-center text-xs text-slate-400">
          No page matches “{search}”.
        </div>
      )}

      <p className="text-[11px] text-slate-500 leading-relaxed">
        Tip: the editor also opens from the public page itself — add <span className="font-mono text-slate-400">?edit=1</span> to any
        address, or use <Link to="/admin/guide" className="text-indigo-400 underline">How to Use Admin</Link> for the full walkthrough.
        Everything you publish is stored permanently in the database and shown to every visitor.
      </p>
    </div>
  );
}
