import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Megaphone, Plus, Trash2, Pencil, Pin, LifeBuoy, RefreshCw, Eye, EyeOff } from 'lucide-react';
import api from '../../lib/api';
import {
  PageHeader,
  Card,
  Field,
  inputClass,
  btnPrimary,
  btnGhost,
  btnDanger,
  btnIcon,
  Badge,
  EmptyState,
  Loading,
  ErrorNote,
  Modal,
} from './ui';

const emptyDraft = () => ({
  title: '',
  body: '',
  audience: 'All Students',
  courseId: '',
  batchId: '',
  pinned: false,
  isPublished: true,
});

const formatDate = (value) => {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return '—';
  }
};

export default function LmsCommunications() {
  const [announcements, setAnnouncements] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [editor, setEditor] = useState({ open: false, row: null });
  const [draft, setDraft] = useState(emptyDraft());

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin/lms/announcements');
      setAnnouncements(res.data?.announcements || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Could not load announcements.');
    }
    try {
      const res = await api.get('/support/admin/tickets');
      const list = res.data?.tickets || res.data?.data || [];
      setTickets(list.slice(0, 8));
    } catch {
      /* support desk is optional context on this page */
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    (async () => {
      try {
        let list = [];
        try {
          const res = await api.get('/courses/admin/all');
          list = res.data?.courses || [];
        } catch {
          const res = await api.get('/courses');
          list = res.data?.courses || [];
        }
        setCourses(list);
      } catch {
        /* optional */
      }
      try {
        const res = await api.get('/batches');
        setBatches(res.data?.batches || []);
      } catch {
        /* optional */
      }
    })();
  }, []);

  const flash = (message) => {
    setStatus(message);
    window.setTimeout(() => setStatus(''), 3000);
  };

  const openCreate = () => {
    setDraft(emptyDraft());
    setEditor({ open: true, row: null });
  };

  const openEdit = (row) => {
    setDraft({
      title: row.title || '',
      body: row.body || '',
      audience: row.audience || 'All Students',
      courseId: row.course?._id || '',
      batchId: row.batch?._id || '',
      pinned: Boolean(row.pinned),
      isPublished: row.isPublished !== false,
    });
    setEditor({ open: true, row });
  };

  const save = async () => {
    if (!draft.title.trim()) {
      setError('An announcement title is required.');
      return;
    }
    try {
      if (editor.row) await api.put(`/admin/lms/announcements/${editor.row._id}`, draft);
      else await api.post('/admin/lms/announcements', draft);
      setEditor({ open: false, row: null });
      await load();
      flash('Announcement saved.');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save the announcement.');
    }
  };

  const remove = async (row) => {
    if (!window.confirm(`Delete the announcement "${row.title}"?`)) return;
    try {
      await api.delete(`/admin/lms/announcements/${row._id}`);
      await load();
      flash('Announcement deleted.');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete the announcement.');
    }
  };

  const togglePublish = async (row) => {
    try {
      await api.put(`/admin/lms/announcements/${row._id}`, { isPublished: row.isPublished === false });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update the announcement.');
    }
  };

  const openTickets = tickets.filter((t) => ['Open', 'In Progress'].includes(t.status)).length;

  return (
    <div>
      <PageHeader
        icon={Megaphone}
        title="Communications"
        subtitle="Publish notices to enrolled students, and keep an eye on the support desk."
        actions={
          <>
            <button type="button" className={btnGhost} onClick={load}>
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
            <button type="button" className={btnPrimary} onClick={openCreate}>
              <Plus className="w-3.5 h-3.5" /> New announcement
            </button>
          </>
        }
      />

      <ErrorNote>{error}</ErrorNote>
      {status && (
        <div className="mb-4 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-400/20 text-[11px] text-emerald-200">
          {status}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/[0.06] text-xs font-bold text-white">Announcements</div>
          {loading ? (
            <Loading />
          ) : announcements.length === 0 ? (
            <EmptyState
              icon={Megaphone}
              title="No announcements yet"
              message="Publish a notice and it appears on every enrolled student's dashboard."
            />
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {announcements.map((row) => (
                <div key={row._id} className="px-4 py-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-white">{row.title}</span>
                      {row.pinned && (
                        <Badge tone="amber">
                          <Pin className="w-2.5 h-2.5 mr-1" /> pinned
                        </Badge>
                      )}
                      <Badge tone={row.isPublished ? 'emerald' : 'slate'}>
                        {row.isPublished ? 'published' : 'draft'}
                      </Badge>
                      <Badge tone="slate">
                        {row.audience}
                        {row.course?.title ? ` · ${row.course.title}` : ''}
                        {row.batch?.batchCode ? ` · ${row.batch.batchCode}` : ''}
                      </Badge>
                    </div>
                    {row.body && <p className="text-[11px] text-slate-400 mt-1 whitespace-pre-wrap">{row.body}</p>}
                    <div className="text-[10px] text-slate-400 mt-1">
                      {row.createdByName ? `${row.createdByName} · ` : ''}
                      {formatDate(row.createdAt)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      className={btnIcon}
                      onClick={() => togglePublish(row)}
                      aria-label={`${row.isPublished ? 'Unpublish' : 'Publish'} ${row.title}`}
                    >
                      {row.isPublished ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>
                    <button type="button" className={btnIcon} onClick={() => openEdit(row)} aria-label={`Edit ${row.title}`}>
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      className={`${btnIcon} text-rose-300`}
                      onClick={() => remove(row)}
                      aria-label={`Delete ${row.title}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <div className="space-y-4">
          <Card className="p-4">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <LifeBuoy className="w-4 h-4 text-indigo-300" /> Support desk
              </div>
              <Badge tone={openTickets ? 'amber' : 'emerald'}>{openTickets} open</Badge>
            </div>
            {tickets.length === 0 ? (
              <p className="text-[11px] text-slate-400">No tickets to review.</p>
            ) : (
              <div className="space-y-2">
                {tickets.map((ticket) => (
                  <div key={ticket._id} className="rounded-xl bg-white/[0.03] px-3 py-2">
                    <div className="text-[11px] font-semibold text-white truncate">{ticket.subject}</div>
                    <div className="text-[10px] text-slate-400">
                      {ticket.studentName} · {ticket.status}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Link to="/admin/support" className={`${btnGhost} mt-3 w-full`}>
              Open the full support desk
            </Link>
          </Card>

          <Card className="p-4">
            <div className="text-xs font-bold text-white mb-2">Who sees what</div>
            <ul className="space-y-1.5 text-[11px] text-slate-400 list-disc pl-4">
              <li><span className="text-slate-200">All Students</span> — every enrolled student.</li>
              <li><span className="text-slate-200">Course</span> — only students enrolled in the chosen program.</li>
              <li><span className="text-slate-200">Batch</span> — only the chosen live cohort.</li>
            </ul>
            <p className="text-[10px] text-slate-400 mt-2">
              Students can be switched off from announcements entirely in LMS Settings.
            </p>
          </Card>
        </div>
      </div>

      <Modal
        open={editor.open}
        title={editor.row ? 'Edit announcement' : 'New announcement'}
        subtitle="Appears on the student dashboard while it is published."
        onClose={() => setEditor({ open: false, row: null })}
        footer={
          <>
            <button type="button" className={btnGhost} onClick={() => setEditor({ open: false, row: null })}>
              Cancel
            </button>
            <button type="button" className={btnPrimary} onClick={save}>
              Save announcement
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Title" required>
            <input
              className={inputClass}
              value={draft.title}
              onChange={(e) => setDraft((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="e.g. New cohort starts Monday"
            />
          </Field>
          <Field label="Message">
            <textarea
              className={inputClass}
              rows={4}
              value={draft.body}
              onChange={(e) => setDraft((prev) => ({ ...prev, body: e.target.value }))}
              placeholder="Write the notice…"
            />
          </Field>
          <Field label="Audience">
            <select
              className={inputClass}
              value={draft.audience}
              onChange={(e) => setDraft((prev) => ({ ...prev, audience: e.target.value }))}
            >
              <option value="All Students">All Students</option>
              <option value="Course">Course</option>
              <option value="Batch">Batch</option>
            </select>
          </Field>

          {draft.audience === 'Course' && (
            <Field label="Course">
              <select
                className={inputClass}
                value={draft.courseId}
                onChange={(e) => setDraft((prev) => ({ ...prev, courseId: e.target.value }))}
              >
                <option value="">Select a course…</option>
                {courses.map((course) => (
                  <option key={course._id} value={course._id}>
                    {course.title}
                  </option>
                ))}
              </select>
            </Field>
          )}

          {draft.audience === 'Batch' && (
            <Field label="Batch">
              <select
                className={inputClass}
                value={draft.batchId}
                onChange={(e) => setDraft((prev) => ({ ...prev, batchId: e.target.value }))}
              >
                <option value="">Select a batch…</option>
                {batches.map((batch) => (
                  <option key={batch._id} value={batch._id}>
                    {batch.batchCode}
                  </option>
                ))}
              </select>
            </Field>
          )}

          <div className="flex flex-wrap items-center gap-5">
            <label className="flex items-center gap-2 text-[11px] text-slate-300">
              <input
                type="checkbox"
                checked={draft.pinned}
                onChange={(e) => setDraft((prev) => ({ ...prev, pinned: e.target.checked }))}
                className="rounded border-white/20 bg-[#111A2E]"
              />
              Pin to the top
            </label>
            <label className="flex items-center gap-2 text-[11px] text-slate-300">
              <input
                type="checkbox"
                checked={draft.isPublished}
                onChange={(e) => setDraft((prev) => ({ ...prev, isPublished: e.target.checked }))}
                className="rounded border-white/20 bg-[#111A2E]"
              />
              Publish now
            </label>
          </div>
        </div>
      </Modal>
    </div>
  );
}
