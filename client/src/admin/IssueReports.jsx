import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import {
  AlertTriangle,
  Bug,
  Camera,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardCopy,
  ClipboardList,
  Download,
  Eye,
  Images,
  Link2,
  Loader2,
  Pencil,
  RefreshCw,
  Save,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { absoluteAssetUrl } from '../lib/mediaUrl';

/**
 * Client Issue Reports.
 *
 * The client reports problems the way they always have: a screenshot and a
 * sentence. This board keeps the two together — paste a screenshot straight
 * from the clipboard (or drag it in), type the note, save — and then hands the
 * pair back out as one copyable block:
 *
 *   "Copy brief"      → the note plus every screenshot URL, ready to paste
 *   "Copy screenshot" → the image itself, on the clipboard, ready to paste
 *
 * Both buttons exist because a chat paste cannot carry a picture inside text:
 * the brief names the images (absolute URLs, so they open anywhere) and the
 * screenshot button puts the actual bytes on the clipboard so the picture can
 * be pasted next to it. The exact text that will be copied is always shown
 * before the click, so nothing has to be trusted blind.
 *
 * The lists below mirror the enums in server/models/IssueReport.js; the API
 * coerces anything unrecognised to a safe default rather than rejecting, so a
 * stale bundle degrades instead of failing the save.
 */

const STATUSES = ['Open', 'In Progress', 'Fixed', 'Verified'];
const SEVERITIES = ['Low', 'Medium', 'High', 'Urgent'];
const CATEGORIES = [
  'Content / Text',
  'Layout / Design',
  'Image / Media',
  'Bug / Not Working',
  'Pricing / Payments',
  'Course / Curriculum',
  'Other',
];

// Suggestions for the "where did you see it" field. Free text is still allowed —
// the client often reports something on a course page that does not exist yet.
const COMMON_PAGES = [
  '/',
  '/courses',
  '/courses/<course-name>',
  '/jobs',
  '/career-support',
  '/success-stories',
  '/about',
  '/blog',
  '/faq',
  '/contact',
  '/checkout',
  '/student/login',
];

const STATUS_STYLES = {
  Open: 'bg-red-500/10 text-red-300 border-red-500/25',
  'In Progress': 'bg-blue-500/10 text-blue-300 border-blue-500/25',
  Fixed: 'bg-blue-500/10 text-blue-300 border-blue-500/25',
  Verified: 'bg-blue-500/10 text-blue-300 border-blue-500/25',
};

const SEVERITY_STYLES = {
  Low: 'bg-slate-800 text-slate-300 border-slate-700',
  Medium: 'bg-blue-500/10 text-blue-200 border-blue-500/20',
  High: 'bg-red-500/10 text-red-300 border-red-500/25',
  Urgent: 'bg-red-500/10 text-red-300 border-red-500/30',
};

const authHeaders = () => {
  const token = localStorage.getItem('aft_admin_token') || localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const emptyDraft = () => ({
  title: '',
  page: '',
  category: 'Other',
  severity: 'Medium',
  description: '',
  images: [],
});

/** The text a "Copy brief" click puts on the clipboard. */
const buildBrief = (issue) => {
  const when = new Date(issue.reportedAt || issue.createdAt);
  const lines = [
    `ISSUE: ${issue.title}`,
    `Category: ${issue.category} | Severity: ${issue.severity} | Status: ${issue.status}`,
  ];
  if (issue.page) lines.push(`Page: ${issue.page}`);
  if (!Number.isNaN(when.getTime())) {
    lines.push(
      `Reported: ${when.toLocaleString()}${issue.reportedBy?.name ? ` by ${issue.reportedBy.name}` : ''}`,
    );
  }

  lines.push('', 'WHAT THE CLIENT SAID', issue.description?.trim() || '(no note added)');

  if (issue.images?.length) {
    lines.push('', `SCREENSHOTS (${issue.images.length})`);
    issue.images.forEach((image, index) => {
      // Absolute URL: the reader is outside this origin, where `/uploads/x.png`
      // resolves to their own site (or nothing at all).
      lines.push(`${index + 1}. ${image.caption ? `${image.caption} — ` : ''}${absoluteAssetUrl(image.url)}`);
    });
  }

  if (issue.resolution?.trim()) lines.push('', 'RESOLUTION / NOTES', issue.resolution.trim());

  return lines.join('\n');
};

const copyText = async (value) => {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    /* fall through to the legacy path */
  }
  try {
    const el = document.createElement('textarea');
    el.value = value;
    el.setAttribute('readonly', '');
    el.style.position = 'fixed';
    el.style.top = '-1000px';
    el.style.opacity = '0';
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(el);
    return ok;
  } catch {
    return false;
  }
};

/**
 * Re-encodes any stored image as PNG through a canvas.
 *
 * `navigator.clipboard.write` only accepts `image/png` for pictures, while the
 * upload pipeline happily stores JPEG/WEBP/SVG/GIF — a pasted screenshot is
 * usually PNG already, but a dragged file often is not, and the raw blob would
 * be silently refused.
 */
const toPngBlob = async (url) => {
  const image = await new Promise((resolve, reject) => {
    const img = new Image();
    // Uploads are served with the API's CORS headers, so the canvas stays
    // untainted and toBlob() is allowed to read it back.
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not load the image'));
    img.src = absoluteAssetUrl(url);
  });

  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth || 1200;
  canvas.height = image.naturalHeight || 800;
  const context = canvas.getContext('2d');
  // A transparent PNG is common for cropped screenshots; white matches how the
  // image reads on the site and avoids a black square appearing in the paste.
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Could not encode the screenshot'))),
      'image/png',
    );
  });
};

const openAssetInTab = (url) => {
  window.open(absoluteAssetUrl(url), '_blank', 'noopener,noreferrer');
};

const extractImageFiles = (dataTransfer) => {
  const files = [];
  if (!dataTransfer) return files;
  if (dataTransfer.files?.length) {
    Array.from(dataTransfer.files).forEach((file) => {
      if (file.type.startsWith('image/')) files.push(file);
    });
  }
  if (!files.length && dataTransfer.items?.length) {
    Array.from(dataTransfer.items).forEach((item) => {
      if (item.kind !== 'file') return;
      const file = item.getAsFile();
      if (file && file.type.startsWith('image/')) files.push(file);
    });
  }
  return files;
};

export default function IssueReports() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [draft, setDraft] = useState(emptyDraft());
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [toast, setToast] = useState(null);
  const [busyImage, setBusyImage] = useState('');
  const [openTextId, setOpenTextId] = useState(null);
  const [resolutionDraft, setResolutionDraft] = useState({});

  const composerRef = useRef(null);
  const fileInputRef = useRef(null);
  const toastTimer = useRef(null);

  const notify = (message, tone = 'success') => {
    setToast({ message, tone });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), tone === 'error' ? 6000 : 3000);
  };

  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  const fetchIssues = async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const res = await axios.get('/api/issues', { headers: authHeaders() });
      if (res.data?.success) setIssues(res.data.issues || []);
    } catch (error) {
      console.error('Failed to load issue reports:', error);
      if (!silent) notify(error.response?.data?.message || 'Could not load issue reports.', 'error');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => { fetchIssues(); }, []);

  // Counts are derived from the loaded board rather than taken from the server
  // aggregate: a status change updates one card, and a chip that still read
  // "Open (1)" next to a card marked Fixed would look like the save failed. The
  // API returns the 500 most recent reports, so past that the chips describe
  // the loaded window — the whole board for any realistic number of reports.
  const byStatus = useMemo(
    () => STATUSES.reduce(
      (acc, status) => ({ ...acc, [status]: issues.filter((issue) => issue.status === status).length }),
      {},
    ),
    [issues],
  );

  const openIssues = issues.length;

  const filteredIssues = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return issues.filter((issue) => {
      const matchesStatus = statusFilter === 'ALL' || issue.status === statusFilter;
      if (!matchesStatus) return false;
      if (!term) return true;
      return [issue.title, issue.description, issue.page, issue.category]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(term));
    });
  }, [issues, statusFilter, searchTerm]);

  /* ─────────────────────────── screenshots ─────────────────────────── */

  const uploadOne = async (file, placeholderId) => {
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await axios.post('/api/upload', formData, { headers: authHeaders() });
      if (!res.data?.success || !res.data?.url) throw new Error(res.data?.message || 'Upload failed');
      setDraft((prev) => ({
        ...prev,
        images: prev.images.map((image) =>
          image.id === placeholderId
            ? { ...image, url: res.data.url, filename: res.data.filename || '', uploading: false }
            : image,
        ),
      }));
      if (res.data.persisted === false) {
        notify('Screenshot saved for this session only — durable storage is unavailable.', 'error');
      }
    } catch (error) {
      setDraft((prev) => ({ ...prev, images: prev.images.filter((image) => image.id !== placeholderId) }));
      notify(error.response?.data?.message || error.message || 'Screenshot upload failed.', 'error');
    } finally {
      setUploading((count) => Math.max(0, count - 1));
    }
  };

  const addFiles = (files) => {
    if (!files?.length) return;
    files.forEach((file) => {
      if (file.size > 10 * 1024 * 1024) {
        notify(`"${file.name}" is larger than 10MB.`, 'error');
        return;
      }
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setDraft((prev) => ({
        ...prev,
        images: [
          ...prev.images,
          { id, url: '', filename: file.name, caption: '', uploading: true, preview: URL.createObjectURL(file) },
        ],
      }));
      setUploading((count) => count + 1);
      uploadOne(file, id);
    });
  };

  const removeImage = (id) => {
    setDraft((prev) => {
      const target = prev.images.find((image) => image.id === id);
      if (target?.preview) URL.revokeObjectURL(target.preview);
      return { ...prev, images: prev.images.filter((image) => image.id !== id) };
    });
  };

  const setCaption = (id, caption) => {
    setDraft((prev) => ({
      ...prev,
      images: prev.images.map((image) => (image.id === id ? { ...image, caption } : image)),
    }));
  };

  // Paste anywhere in the composer: Win+Shift+S → Ctrl+V is how the client
  // already captures a problem, so the board accepts exactly that.
  const handlePaste = (event) => {
    const files = extractImageFiles(event.clipboardData);
    if (!files.length) return;
    event.preventDefault();
    addFiles(files);
    notify(`${files.length} screenshot${files.length === 1 ? '' : 's'} pasted.`);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragging(false);
    const files = extractImageFiles(event.dataTransfer);
    if (!files.length) return;
    addFiles(files);
  };

  /* ─────────────────────────── save / edit ─────────────────────────── */

  const resetDraft = () => {
    setDraft((prev) => {
      prev.images.forEach((image) => { if (image.preview) URL.revokeObjectURL(image.preview); });
      return emptyDraft();
    });
    setEditingId(null);
  };

  const startEdit = (issue) => {
    setEditingId(issue._id);
    setDraft({
      title: issue.title || '',
      page: issue.page || '',
      category: CATEGORIES.includes(issue.category) ? issue.category : 'Other',
      severity: SEVERITIES.includes(issue.severity) ? issue.severity : 'Medium',
      description: issue.description || '',
      images: (issue.images || []).map((image, index) => ({
        id: `saved-${index}-${image.url}`,
        url: image.url,
        filename: image.filename || '',
        caption: image.caption || '',
        uploading: false,
      })),
    });
    composerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const saveDraft = async (event) => {
    event.preventDefault();
    if (!draft.title.trim()) {
      notify('Give the issue a short title first.', 'error');
      return;
    }
    if (uploading > 0) {
      notify('Still uploading a screenshot — one moment.', 'error');
      return;
    }

    const payload = {
      title: draft.title.trim(),
      page: draft.page.trim(),
      category: draft.category,
      severity: draft.severity,
      description: draft.description,
      images: draft.images
        .filter((image) => image.url)
        .map((image) => ({ url: image.url, filename: image.filename, caption: image.caption })),
    };

    setSaving(true);
    try {
      if (editingId) {
        await axios.put(`/api/issues/${editingId}`, payload, { headers: authHeaders() });
        notify('Issue report updated.');
      } else {
        await axios.post('/api/issues', payload, { headers: authHeaders() });
        notify(
          payload.images.length
            ? `Saved with ${payload.images.length} screenshot${payload.images.length === 1 ? '' : 's'}.`
            : 'Saved.',
        );
      }
      resetDraft();
      fetchIssues({ silent: true });
    } catch (error) {
      notify(error.response?.data?.message || 'Could not save the issue report.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const patchIssue = async (id, body, successMessage) => {
    try {
      const res = await axios.put(`/api/issues/${id}`, body, { headers: authHeaders() });
      if (res.data?.success) {
        setIssues((prev) => prev.map((issue) => (issue._id === id ? res.data.issue : issue)));
        if (successMessage) notify(successMessage);
      }
    } catch (error) {
      notify(error.response?.data?.message || 'Could not update the issue report.', 'error');
    }
  };

  const deleteIssue = async (issue) => {
    // eslint-disable-next-line no-alert
    if (!window.confirm(`Delete "${issue.title}"? The screenshots stay uploaded, the note is removed.`)) return;
    try {
      await axios.delete(`/api/issues/${issue._id}`, { headers: authHeaders() });
      setIssues((prev) => prev.filter((row) => row._id !== issue._id));
      fetchIssues({ silent: true });
      notify('Issue report deleted.');
    } catch (error) {
      notify(error.response?.data?.message || 'Could not delete the issue report.', 'error');
    }
  };

  /* ─────────────────────────── copying out ─────────────────────────── */

  const copyBrief = async (issue) => {
    const ok = await copyText(buildBrief(issue));
    notify(ok ? 'Brief copied — paste it to whoever fixes it.' : 'Copy failed — select the text and copy manually.', ok ? 'success' : 'error');
  };

  const copyScreenshot = async (image) => {
    setBusyImage(image.url);
    try {
      if (typeof ClipboardItem === 'undefined' || !navigator.clipboard?.write) {
        throw new Error('This browser cannot put an image on the clipboard.');
      }
      const blob = await toPngBlob(image.url);
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      notify('Screenshot copied — paste it next to the brief.');
    } catch (error) {
      console.error('Screenshot copy failed:', error);
      openAssetInTab(image.url);
      notify('Could not copy automatically — opened in a new tab, right-click the image to copy it.', 'error');
    } finally {
      setBusyImage('');
    }
  };

  const copyAllFiltered = async () => {
    if (!filteredIssues.length) {
      notify('Nothing to copy yet.', 'error');
      return;
    }
    const bundle = filteredIssues.map(buildBrief).join(`\n\n${'─'.repeat(60)}\n\n`);
    const ok = await copyText(bundle);
    notify(
      ok
        ? `${filteredIssues.length} issue report${filteredIssues.length === 1 ? '' : 's'} copied.`
        : 'Copy failed — select the text and copy manually.',
      ok ? 'success' : 'error',
    );
  };

  /** Saves one report's brief as a .txt file — the fallback when a paste target
   *  refuses the clipboard (a locked-down browser, a web form with no paste box). */
  const downloadBrief = (issue) => {
    const blob = new Blob([buildBrief(issue)], { type: 'text/plain;charset=utf-8' });
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = `issue-${String(issue._id).slice(-6)}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(href);
  };

  /* ─────────────────────────────── view ─────────────────────────────── */

  return (
    <div className="space-y-6 relative">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono uppercase tracking-widest mb-2">
            <ClipboardList className="w-3.5 h-3.5" />
            Client Feedback Board
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white font-heading">
            Issue Reports — screenshot + note, ready to copy
          </h1>
          <p className="text-slate-400 text-sm mt-1 max-w-3xl">
            Paste a screenshot (Ctrl+V), drag one in, or upload it. Write the note underneath, then press
            <span className="text-slate-200 font-semibold"> Copy brief</span> and
            <span className="text-slate-200 font-semibold"> Copy screenshot</span> — both land in the clipboard exactly
            as you recorded them, so nothing has to be retyped or re-explained.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => fetchIssues()}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={copyAllFiltered}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-600 text-white text-xs font-bold transition-colors"
          >
            <ClipboardCopy className="w-3.5 h-3.5" />
            Copy all shown ({filteredIssues.length})
          </button>
        </div>
      </div>

      {/* Composer */}
      <form
        ref={composerRef}
        onSubmit={saveDraft}
        onPaste={handlePaste}
        onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`rounded-2xl border bg-slate-900/60 backdrop-blur-xl p-5 space-y-4 transition-colors ${
          dragging ? 'border-blue-400 ring-2 ring-blue-500/30' : 'border-slate-800'
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-white font-heading flex items-center gap-2">
            <Camera className="w-4 h-4 text-blue-400" />
            {editingId ? 'Edit this issue report' : 'New issue report'}
          </h2>
          {editingId && (
            <button
              type="button"
              onClick={resetDraft}
              className="text-[11px] font-mono text-slate-400 hover:text-white inline-flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Cancel edit
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="md:col-span-2">
            <label htmlFor="issue-title" className="block text-[11px] font-mono uppercase text-slate-400 font-bold mb-1.5">
              What is wrong (short title) *
            </label>
            <input
              id="issue-title"
              type="text"
              value={draft.title}
              onChange={(event) => setDraft({ ...draft, title: event.target.value })}
              placeholder="e.g. The $499 reservation button shows the wrong price"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-blue-500 placeholder:text-slate-500"
            />
          </div>

          <div>
            <label htmlFor="issue-page" className="block text-[11px] font-mono uppercase text-slate-400 font-bold mb-1.5">
              Page / screen
            </label>
            <input
              id="issue-page"
              type="text"
              list="issue-page-options"
              value={draft.page}
              onChange={(event) => setDraft({ ...draft, page: event.target.value })}
              placeholder="/courses/devops-and-cloud-with-ai"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm font-mono focus:outline-none focus:border-blue-500 placeholder:text-slate-500"
            />
            <datalist id="issue-page-options">
              {COMMON_PAGES.map((page) => <option key={page} value={page} />)}
            </datalist>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="issue-category" className="block text-[11px] font-mono uppercase text-slate-400 font-bold mb-1.5">
                Type
              </label>
              <select
                id="issue-category"
                value={draft.category}
                onChange={(event) => setDraft({ ...draft, category: event.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500"
              >
                {CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="issue-severity" className="block text-[11px] font-mono uppercase text-slate-400 font-bold mb-1.5">
                Severity
              </label>
              <select
                id="issue-severity"
                value={draft.severity}
                onChange={(event) => setDraft({ ...draft, severity: event.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500"
              >
                {SEVERITIES.map((severity) => <option key={severity} value={severity}>{severity}</option>)}
              </select>
            </div>
          </div>

          <div className="md:col-span-2">
            <label htmlFor="issue-note" className="block text-[11px] font-mono uppercase text-slate-400 font-bold mb-1.5">
              The note (your words — copied out exactly as written)
            </label>
            <textarea
              id="issue-note"
              rows={5}
              value={draft.description}
              onChange={(event) => setDraft({ ...draft, description: event.target.value })}
              placeholder="Explain what you see and what you expected instead. Hinglish is fine."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm leading-relaxed focus:outline-none focus:border-blue-500 placeholder:text-slate-500 resize-y"
            />
          </div>
        </div>

        {/* Screenshots */}
        <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950/50 p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-[11px] font-mono uppercase text-slate-400 font-bold flex items-center gap-1.5">
              <Images className="w-3.5 h-3.5 text-blue-400" />
              Screenshots ({draft.images.length})
              {uploading > 0 && (
                <span className="text-blue-400 flex items-center gap-1 normal-case">
                  <Loader2 className="w-3 h-3 animate-spin" /> uploading {uploading}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp,image/gif,image/svg+xml"
                multiple
                className="hidden"
                onChange={(event) => {
                  addFiles(Array.from(event.target.files || []));
                  event.target.value = '';
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono"
              >
                <Images className="w-3.5 h-3.5" /> Choose file
              </button>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 font-mono">
            Tip: press <span className="text-slate-300">Win + Shift + S</span> then paste here with
            <span className="text-slate-300"> Ctrl + V</span>, or drag a saved image into this box.
          </p>

          {draft.images.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {draft.images.map((image) => (
                <div key={image.id} className="rounded-xl border border-slate-800 bg-slate-900/70 p-2 space-y-2">
                  <div className="relative h-32 rounded-lg bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center">
                    {image.uploading ? (
                      <span className="text-[11px] font-mono text-blue-400 flex items-center gap-1.5">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> uploading…
                      </span>
                    ) : (
                      <img
                        src={image.url || image.preview}
                        alt={image.caption || image.filename || 'Screenshot'}
                        className="w-full h-full object-contain"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(image.id)}
                      aria-label="Remove screenshot"
                      className="absolute top-1.5 right-1.5 p-1 rounded-lg bg-black/70 text-red-300 hover:text-red-200"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={image.caption}
                    onChange={(event) => setCaption(image.id, event.target.value)}
                    aria-label="Screenshot caption"
                    placeholder="Caption (optional)"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-[11px] focus:outline-none focus:border-blue-500 placeholder:text-slate-500"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="text-[11px] text-slate-400 font-mono">
            {openIssues} on the board · {byStatus.Open || 0} still open
          </span>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-600 disabled:opacity-50 text-white text-xs font-bold transition-colors"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {editingId ? 'Save changes' : 'Save issue report'}
          </button>
        </div>
      </form>

      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex gap-1 overflow-x-auto">
          {['ALL', ...STATUSES].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-mono whitespace-nowrap border transition-colors ${
                statusFilter === status
                  ? 'bg-blue-600 text-white border-blue-400 font-bold'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              {status === 'ALL' ? `ALL (${openIssues})` : `${status} (${byStatus[status] || 0})`}
            </button>
          ))}
        </div>
        <div className="relative flex-1 md:max-w-sm">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            aria-label="Search issue reports"
            placeholder="Search title, note or page…"
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500 placeholder:text-slate-500"
          />
        </div>
      </div>

      {/* Board */}
      {loading ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-10 text-center text-xs font-mono text-slate-400">
          Loading issue reports…
        </div>
      ) : filteredIssues.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-10 text-center space-y-2">
          <Bug className="w-6 h-6 text-blue-400 mx-auto" />
          <p className="text-sm text-slate-300 font-semibold">
            {issues.length ? 'No reports match this filter.' : 'No issue reports yet.'}
          </p>
          <p className="text-xs text-slate-400">
            Paste a screenshot above and write what is wrong — it will show up here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredIssues.map((issue) => {
            const brief = buildBrief(issue);
            const resolutionValue = resolutionDraft[issue._id] ?? issue.resolution ?? '';
            return (
              <div key={issue._id} className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl overflow-hidden">
                {/* Card header */}
                <div className="p-4 sm:p-5 border-b border-slate-800/80 flex flex-col lg:flex-row lg:items-start justify-between gap-3">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${STATUS_STYLES[issue.status] || STATUS_STYLES.Open}`}>
                        {issue.status}
                      </span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${SEVERITY_STYLES[issue.severity] || SEVERITY_STYLES.Medium}`}>
                        {issue.severity}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-slate-800 bg-slate-950 text-slate-400">
                        {issue.category}
                      </span>
                      {issue.images?.length > 0 && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-slate-800 bg-slate-950 text-blue-300 inline-flex items-center gap-1">
                          <Images className="w-3 h-3" /> {issue.images.length}
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-white break-words">{issue.title}</h3>
                    <div className="text-[11px] font-mono text-slate-400 flex flex-wrap items-center gap-x-3 gap-y-1">
                      {issue.page && <span className="text-slate-400">Page: {issue.page}</span>}
                      <span>
                        {new Date(issue.reportedAt || issue.createdAt).toLocaleString()}
                        {issue.reportedBy?.name ? ` · ${issue.reportedBy.name}` : ''}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <select
                      value={issue.status}
                      onChange={(event) => patchIssue(issue._id, { status: event.target.value })}
                      aria-label={`Status of ${issue.title}`}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-[11px] font-mono text-white focus:outline-none focus:border-blue-500"
                    >
                      {STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                    </select>
                    <button
                      type="button"
                      onClick={() => copyBrief(issue)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-600 text-white text-[11px] font-bold"
                      title="Copy the note plus every screenshot URL"
                    >
                      <ClipboardCopy className="w-3.5 h-3.5" /> Copy brief
                    </button>
                    {issue.images?.[0] && (
                      <button
                        type="button"
                        onClick={() => copyScreenshot(issue.images[0])}
                        disabled={busyImage === issue.images[0].url}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-60 text-slate-200 text-[11px] font-bold"
                        title="Put the first screenshot on the clipboard"
                      >
                        {busyImage === issue.images[0].url
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : <Camera className="w-3.5 h-3.5" />}
                        Copy screenshot
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => startEdit(issue)}
                      aria-label={`Edit ${issue.title}`}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteIssue(issue)}
                      aria-label={`Delete ${issue.title}`}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-500/20 text-red-300"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Card body */}
                <div className="p-4 sm:p-5 space-y-4">
                  {issue.description?.trim() ? (
                    <p className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">{issue.description}</p>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No note was written for this report.</p>
                  )}

                  {issue.images?.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                      {issue.images.map((image, index) => (
                        <div key={`${issue._id}-${index}`} className="rounded-xl border border-slate-800 bg-slate-950/60 p-2 space-y-2">
                          <a
                            href={absoluteAssetUrl(image.url)}
                            target="_blank"
                            rel="noreferrer"
                            className="block h-36 rounded-lg border border-slate-800 bg-slate-950 overflow-hidden flex items-center justify-center"
                          >
                            <img
                              src={absoluteAssetUrl(image.url)}
                              alt={image.caption || `Screenshot ${index + 1}`}
                              className="w-full h-full object-contain"
                            />
                          </a>
                          {image.caption && <p className="text-[11px] text-slate-400">{image.caption}</p>}
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => copyScreenshot(image)}
                              disabled={busyImage === image.url}
                              className="flex-1 inline-flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-60 text-slate-200 text-[10px] font-mono font-bold"
                            >
                              {busyImage === image.url
                                ? <Loader2 className="w-3 h-3 animate-spin" />
                                : <Camera className="w-3 h-3" />}
                              Copy image
                            </button>
                            <button
                              type="button"
                              onClick={() => openAssetInTab(image.url)}
                              aria-label={`Open screenshot ${index + 1} in a new tab`}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                            >
                              <Link2 className="w-3 h-3" />
                            </button>
                            <a
                              href={absoluteAssetUrl(image.url)}
                              download
                              aria-label={`Download screenshot ${index + 1}`}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                            >
                              <Download className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Resolution note */}
                  <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3 space-y-2">
                    <label
                      htmlFor={`resolution-${issue._id}`}
                      className="block text-[10px] font-mono uppercase text-slate-400 font-bold"
                    >
                      What was done about it (optional)
                    </label>
                    <textarea
                      id={`resolution-${issue._id}`}
                      rows={2}
                      value={resolutionValue}
                      onChange={(event) => setResolutionDraft({ ...resolutionDraft, [issue._id]: event.target.value })}
                      placeholder="e.g. Changed the button back to $499 on the course page."
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-blue-500 placeholder:text-slate-500 resize-y"
                    />
                    {resolutionValue !== (issue.resolution || '') && (
                      <button
                        type="button"
                        onClick={() => patchIssue(issue._id, { resolution: resolutionValue }, 'Note saved.')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 border border-blue-500/30 text-[10px] font-mono font-bold"
                      >
                        <Save className="w-3 h-3" /> Save note
                      </button>
                    )}
                  </div>

                  {/* Exact-copy preview */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setOpenTextId(openTextId === issue._id ? null : issue._id)}
                      className="inline-flex items-center gap-1.5 text-[11px] font-mono text-slate-400 hover:text-white"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      {openTextId === issue._id ? 'Hide' : 'Show'} exactly what gets copied
                      {openTextId === issue._id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadBrief(issue)}
                      className="inline-flex items-center gap-1.5 text-[11px] font-mono text-slate-400 hover:text-white"
                    >
                      <Download className="w-3 h-3" /> Download brief (.txt)
                    </button>
                  </div>

                  {openTextId === issue._id && (
                    <pre className="max-h-72 overflow-auto rounded-xl border border-slate-800 bg-slate-950 p-3 text-[11px] leading-relaxed text-slate-300 whitespace-pre-wrap break-words">
                      {brief}
                    </pre>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          role="status"
          className={`fixed bottom-6 right-6 z-50 max-w-sm px-4 py-3 rounded-xl border text-xs font-semibold shadow-2xl flex items-start gap-2 ${
            toast.tone === 'error'
              ? 'bg-red-950/90 border-red-500/40 text-red-100'
              : 'bg-blue-950/90 border-blue-500/40 text-blue-100'
          }`}
        >
          {toast.tone === 'error'
            ? <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            : <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
