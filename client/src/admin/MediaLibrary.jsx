import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCopy,
  Download,
  ExternalLink,
  HardDrive,
  ImageOff,
  Images,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { absoluteAssetUrl } from '../lib/mediaUrl';

/**
 * Media Library.
 *
 * Every image ever uploaded through the admin panel, in one place, with a
 * delete that actually removes the file.
 *
 * Two things make this harder than "list the folder":
 *
 *   1. Uploads live in two stores — the container's disk (fast, but wiped on
 *      every redeploy) and MongoDB (durable). Listing only the disk made files
 *      the site was still serving look deleted, so the list is the union of
 *      both and each row says which copies it has.
 *   2. Deleting a file the live site is still pointing at breaks an image for
 *      visitors, silently. So the API refuses with 409 and the list of
 *      references, and this page shows that list before offering "Delete
 *      anyway" — the confirm dialog names the exact screens that will break.
 */

const authHeaders = () => {
  const token = localStorage.getItem('aft_admin_token') || localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const formatBytes = (bytes) => {
  const value = Number(bytes || 0);
  if (!value) return '—';
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(2)} MB`;
};

const formatDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString();
};

export default function MediaLibrary() {
  const { user } = useAuth();
  // Mirror the API's guard: delete needs MEDIA_DELETE, and a SuperAdmin passes
  // everything. The button is hidden for an account that would only get a 403,
  // instead of offering a control that cannot work.
  const role = (user?.role || '').toUpperCase();
  const canDelete = role === 'SUPERADMIN' || (user?.permissions || []).includes('MEDIA_DELETE');

  const [files, setFiles] = useState([]);
  const [summary, setSummary] = useState({ total: 0, inUse: 0, unused: 0, durableOnly: 0, diskOnly: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchMedia();
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), toast.tone === 'error' ? 7000 : 3200);
    return () => clearTimeout(timer);
  }, [toast]);

  const notify = (message, tone = 'success') => setToast({ message, tone });

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/upload/media', { headers: authHeaders() });
      if (res.data?.success) {
        setFiles(res.data.files || []);
        setSummary(res.data.summary || {});
      }
    } catch (error) {
      console.error('Failed to load media library:', error);
      notify(error.response?.data?.message || 'Could not load the media library.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const visibleFiles = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return files.filter((file) => {
      if (filter === 'IN_USE' && file.usedBy.length === 0) return false;
      if (filter === 'UNUSED' && file.usedBy.length > 0) return false;
      if (filter === 'DURABLE_ONLY' && !(file.persisted && !file.onDisk)) return false;
      if (!term) return true;
      return file.filename.toLowerCase().includes(term)
        || file.usedBy.some((label) => label.toLowerCase().includes(term));
    });
  }, [files, filter, searchTerm]);

  const copyUrl = async (file) => {
    const url = absoluteAssetUrl(file.url);
    try {
      await navigator.clipboard.writeText(url);
      notify('Image URL copied.');
    } catch (error) {
      notify(`Copy failed — the URL is ${url}`, 'error');
    }
  };

  const confirmDelete = async (file, force) => {
    setDeleting(true);
    try {
      const res = await axios.delete(
        `/api/upload/media/${encodeURIComponent(file.filename)}${force ? '?force=1' : ''}`,
        { headers: authHeaders() },
      );
      notify(res.data?.message || 'File deleted.');
      setPendingDelete(null);
      fetchMedia();
    } catch (error) {
      const data = error.response?.data;
      if (error.response?.status === 409 && data?.usedBy) {
        // The API refused because the file is still referenced — reopen the
        // dialog in its "here is what will break" state.
        setPendingDelete({ ...file, usedBy: data.usedBy, requiresForce: true });
        notify(data.message || 'This file is still in use.', 'error');
      } else {
        notify(data?.message || 'Could not delete the file.', 'error');
        setPendingDelete(null);
      }
    } finally {
      setDeleting(false);
    }
  };

  const filters = [
    ['ALL', `All (${summary.total || 0})`],
    ['IN_USE', `In use (${summary.inUse || 0})`],
    ['UNUSED', `Unused (${summary.unused || 0})`],
    ['DURABLE_ONLY', `Disk copy gone (${summary.durableOnly || 0})`],
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-mono uppercase tracking-widest mb-2">
            <Images className="w-3.5 h-3.5" />
            Assets & Storage
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white font-heading">Media Library</h1>
          <p className="text-slate-400 text-sm mt-1 max-w-3xl">
            Every image uploaded through the admin panel. Deleting a file removes it from storage
            <span className="text-slate-200 font-semibold"> and</span> from the durable copy, so a
            file that only exists because of a past redeploy can finally be cleaned up. Files the
            site still uses are refused until you confirm.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchMedia}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono transition-colors self-start lg:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Storage summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { key: 'total', label: 'Files', value: summary.total || 0, tone: 'text-white' },
          { key: 'inUse', label: 'In use on the site', value: summary.inUse || 0, tone: 'text-emerald-300' },
          { key: 'unused', label: 'Unused', value: summary.unused || 0, tone: 'text-amber-300' },
          { key: 'durableOnly', label: 'Durable only (disk wiped)', value: summary.durableOnly || 0, tone: 'text-indigo-300' },
        ].map((card) => (
          <div key={card.key} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
            <div className={`text-2xl font-black font-heading ${card.tone}`}>{card.value}</div>
            <div className="text-[11px] font-mono uppercase text-slate-400 mt-1">{card.label}</div>
          </div>
        ))}
      </div>

      {(summary.diskOnly || 0) > 0 && (
        <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-3 text-[11px] font-mono text-amber-200 flex items-start gap-2">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>
            {summary.diskOnly} file(s) exist on disk only — they were never written to durable
            storage, so they disappear on the next deploy. Copy the URL into the page again to
            get a durable version.
          </span>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex gap-1 overflow-x-auto">
          {filters.map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-mono whitespace-nowrap border transition-colors ${
                filter === key
                  ? 'bg-indigo-500 text-slate-950 border-indigo-400 font-bold'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 md:max-w-sm">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            aria-label="Search media"
            placeholder="Search file name or where it is used…"
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500 placeholder:text-slate-500"
          />
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-10 text-center text-xs font-mono text-slate-400">
          Loading media library…
        </div>
      ) : visibleFiles.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-10 text-center space-y-2">
          <ImageOff className="w-6 h-6 text-indigo-400 mx-auto" />
          <p className="text-sm text-slate-300 font-semibold">
            {files.length ? 'No files match this filter.' : 'No images have been uploaded yet.'}
          </p>
          <p className="text-xs text-slate-400">
            Upload one from any CMS screen — it will appear here straight away.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {visibleFiles.map((file) => (
            <div key={file.filename} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3 space-y-3">
              <a
                href={absoluteAssetUrl(file.url)}
                target="_blank"
                rel="noreferrer"
                className="block h-40 rounded-xl border border-slate-800 bg-slate-950 overflow-hidden"
              >
                <img
                  src={absoluteAssetUrl(file.url)}
                  alt={file.filename}
                  className="w-full h-full object-contain"
                />
              </a>

              <div className="space-y-1.5">
                <p className="text-[11px] font-mono text-slate-200 break-all" title={file.filename}>
                  {file.filename}
                </p>
                <div className="text-[10px] font-mono text-slate-400 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span>{formatBytes(file.size)}</span>
                  <span>{formatDate(file.createdAt)}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-1">
                {file.persisted ? (
                  <span
                    title="Stored in MongoDB — this copy survives a redeploy."
                    className="text-[10px] font-mono px-1.5 py-0.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 text-emerald-300 inline-flex items-center gap-1"
                  >
                    <ShieldCheck className="w-2.5 h-2.5" /> durable
                  </span>
                ) : (
                  <span
                    title="Only on the server disk — it will disappear on the next deploy."
                    className="text-[10px] font-mono px-1.5 py-0.5 rounded-full border border-amber-500/25 bg-amber-500/10 text-amber-300 inline-flex items-center gap-1"
                  >
                    <AlertTriangle className="w-2.5 h-2.5" /> disk only
                  </span>
                )}
                {file.onDisk && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full border border-slate-700 bg-slate-950 text-slate-400 inline-flex items-center gap-1">
                    <HardDrive className="w-2.5 h-2.5" /> on disk
                  </span>
                )}
                {file.usedBy.length > 0 ? (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full border border-indigo-500/25 bg-indigo-500/10 text-indigo-300">
                    in use ×{file.usedBy.length}
                  </span>
                ) : (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full border border-slate-700 bg-slate-950 text-slate-400">
                    unused
                  </span>
                )}
              </div>

              {file.usedBy.length > 0 && (
                <ul className="space-y-0.5">
                  {file.usedBy.slice(0, 3).map((label) => (
                    <li key={label} className="text-[10px] text-slate-400 truncate" title={label}>
                      • {label}
                    </li>
                  ))}
                  {file.usedBy.length > 3 && (
                    <li className="text-[10px] text-slate-400">+ {file.usedBy.length - 3} more</li>
                  )}
                </ul>
              )}

              <div className="flex items-center gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => copyUrl(file)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-mono font-bold"
                  title="Copy the full https URL (pastes into any image field)"
                >
                  <ClipboardCopy className="w-3 h-3" /> Copy URL
                </button>
                <a
                  href={absoluteAssetUrl(file.url)}
                  download
                  aria-label={`Download ${file.filename}`}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  <Download className="w-3 h-3" />
                </a>
                <a
                  href={absoluteAssetUrl(file.url)}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Open ${file.filename} in a new tab`}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  <ExternalLink className="w-3 h-3" />
                </a>
                <button
                  type="button"
                  onClick={() => setPendingDelete({ ...file, requiresForce: false })}
                  disabled={!canDelete}
                  aria-label={`Delete ${file.filename}`}
                  title={canDelete ? 'Delete this file' : 'Your account needs MEDIA_DELETE to delete a file.'}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-rose-300 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirmation */}
      {pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Delete ${pendingDelete.filename}`}
            className="w-full max-w-lg rounded-2xl border border-slate-800 bg-[#0B1220] p-5 space-y-4 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-sm font-bold text-white font-heading flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-rose-400" />
                Delete this file?
              </h2>
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                aria-label="Close"
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 flex items-center gap-3">
              <img
                src={absoluteAssetUrl(pendingDelete.url)}
                alt={pendingDelete.filename}
                className="w-16 h-16 rounded-lg object-contain bg-slate-900 border border-slate-800"
              />
              <div className="min-w-0">
                <p className="text-[11px] font-mono text-slate-200 break-all">{pendingDelete.filename}</p>
                <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                  {formatBytes(pendingDelete.size)}
                  {pendingDelete.persisted ? ' · durable copy' : ' · disk only'}
                </p>
              </div>
            </div>

            {pendingDelete.usedBy.length > 0 ? (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-3 space-y-2">
                <p className="text-[11px] font-bold text-rose-200 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  This image is still used in {pendingDelete.usedBy.length} place
                  {pendingDelete.usedBy.length === 1 ? '' : 's'}:
                </p>
                <ul className="space-y-1">
                  {pendingDelete.usedBy.map((label) => (
                    <li key={label} className="text-[11px] text-rose-100">• {label}</li>
                  ))}
                </ul>
                <p className="text-[11px] text-rose-200">
                  Deleting it will leave a broken image on the live site wherever it is used.
                </p>
              </div>
            ) : (
              <p className="text-[11px] text-slate-400">
                Nothing on the site points at this file, so deleting it is safe. Both the disk copy
                and the durable copy are removed.
              </p>
            )}

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => confirmDelete(pendingDelete, pendingDelete.usedBy.length > 0)}
                disabled={deleting}
                // rose-500 with white text is only ~3.6:1 — rose-700 keeps the
                // destructive colour and clears the contrast threshold.
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-700 hover:bg-rose-600 disabled:opacity-50 text-white text-xs font-bold"
              >
                {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                {pendingDelete.usedBy.length > 0 ? 'Delete anyway' : 'Delete file'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          role="status"
          className={`fixed bottom-6 right-6 z-50 max-w-sm px-4 py-3 rounded-xl border text-xs font-semibold shadow-2xl flex items-start gap-2 ${
            toast.tone === 'error'
              ? 'bg-rose-950/90 border-rose-500/40 text-rose-100'
              : 'bg-emerald-950/90 border-emerald-500/40 text-emerald-100'
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
