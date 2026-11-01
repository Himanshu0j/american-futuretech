import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  FileText,
  CalendarDays,
  CheckCircle2,
  Clock,
  RefreshCw,
  Upload,
  X,
  AlertCircle,
  Paperclip,
  Pencil,
} from 'lucide-react';

const fmtDateTime = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleString(undefined, {
        day: 'numeric',
        month: 'short',
        hour: 'numeric',
        minute: '2-digit',
      });
};

export default function MyAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('pending');

  const [active, setActive] = useState(null);
  const [text, setText] = useState('');
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [flash, setFlash] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get('/api/lms/assignments');
      setAssignments(res.data?.assignments || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Could not load your assignments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const open = useMemo(() => assignments.filter((row) => !row.submission), [assignments]);
  const submitted = useMemo(() => assignments.filter((row) => row.submission), [assignments]);
  const visible = tab === 'pending' ? open : tab === 'submitted' ? submitted : assignments;

  const startSubmission = (assignment) => {
    setActive(assignment);
    setText(assignment.submission?.text || '');
    setFiles(assignment.submission?.files || []);
    setFlash('');
    setError('');
  };

  const submit = async () => {
    if (!active) return;
    if (!text.trim() && !files.length) {
      setError('Add your answer or at least one file link.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await axios.post(`/api/lms/assignments/${active._id}/submit`, { text, files });
      setFlash(res.data?.message || 'Assignment submitted.');
      setActive(null);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not submit the assignment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 sm:p-8 max-w-6xl mx-auto w-full space-y-6">
      <div className="p-6 sm:p-8 rounded-3xl bg-[rgb(var(--tw-ink-900))] text-white">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[11px] font-bold uppercase tracking-wider mb-3">
          <FileText className="w-3.5 h-3.5" /> Coursework
        </div>
        <h1 className="text-2xl sm:text-3xl font-heading font-black text-white">My Assignments</h1>
        <p className="text-xs sm:text-sm text-slate-200 mt-2 max-w-2xl">
          Briefs and deadlines for your batch. Submit your answer or a link to your work; marks appear once
          an instructor evaluates it.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          {[
            { label: 'Total', value: assignments.length },
            { label: 'Pending', value: open.length },
            { label: 'Submitted', value: submitted.length },
            {
              label: 'Graded',
              value: submitted.filter((row) => row.submission?.status === 'Evaluated').length,
            },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl bg-white/10 border border-white/15 px-4 py-3">
              <div className="text-[10px] uppercase tracking-wider text-blue-100/80">{item.label}</div>
              <div className="text-xl font-black text-white mt-0.5">{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      {flash && (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> {flash}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {[
          { id: 'pending', label: 'To do' },
          { id: 'submitted', label: 'Submitted' },
          { id: 'all', label: 'All' },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            aria-pressed={tab === item.id}
            className={`px-4 py-2 rounded-full text-xs font-bold border transition-colors ${
              tab === item.id
                ? 'bg-[rgb(var(--tw-ink-900))] text-white border-[rgb(var(--tw-ink-900))]'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
            }`}
          >
            {item.label}
          </button>
        ))}
        <button
          type="button"
          onClick={load}
          className="ml-auto inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:border-slate-300"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {error && <div className="px-4 py-3 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700">{error}</div>}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((row) => (
            <div key={row} className="h-32 rounded-2xl bg-white border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="p-10 rounded-2xl bg-white border border-slate-200 text-center">
          <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h2 className="text-base font-bold text-[color:rgb(var(--tw-ink-900))]">
            {assignments.length === 0 ? 'No assignments yet' : 'Nothing in this tab'}
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {assignments.length === 0
              ? 'Your instructor has not published coursework for your batch yet.'
              : 'Switch tabs to see the rest of your coursework.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((assignment) => (
            <div key={assignment._id} className="rounded-2xl bg-white border border-slate-200 shadow-xs p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-sm font-bold text-[color:rgb(var(--tw-ink-900))]">{assignment.title}</h2>
                    {assignment.submission ? (
                      <span
                        className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${
                          assignment.submission.status === 'Evaluated'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}
                      >
                        {assignment.submission.status === 'Evaluated' ? 'Graded' : 'Submitted'}
                      </span>
                    ) : assignment.isOverdue ? (
                      <span className="px-2 py-0.5 rounded-full border text-[10px] font-bold bg-red-50 text-red-700 border-red-200">
                        Overdue
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full border text-[10px] font-bold bg-amber-50 text-amber-700 border-amber-200">
                        To do
                      </span>
                    )}
                    {assignment.submission?.isLate && (
                      <span className="px-2 py-0.5 rounded-full border text-[10px] font-bold bg-slate-50 text-slate-600 border-slate-200">
                        Late
                      </span>
                    )}
                  </div>

                  <div className="text-[11px] text-slate-500 mt-1">
                    {assignment.course?.title} · {assignment.batch?.name || assignment.batch?.batchCode}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-600 mt-2">
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="w-3.5 h-3.5" /> Due {fmtDateTime(assignment.dueAt)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" /> {assignment.totalMarks} marks
                    </span>
                    {assignment.submission?.status === 'Evaluated' && (
                      <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                        <CheckCircle2 className="w-3.5 h-3.5" /> {assignment.submission.marks}/{assignment.totalMarks}
                      </span>
                    )}
                  </div>

                  {assignment.description && (
                    <p className="text-xs text-slate-500 mt-2 whitespace-pre-line">{assignment.description}</p>
                  )}

                  {assignment.attachments?.length ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {assignment.attachments.map((file, index) => (
                        <a
                          key={index}
                          href={file.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-50 border border-slate-200 text-[10px] font-semibold text-slate-700"
                        >
                          <Paperclip className="w-3 h-3" /> {file.title}
                        </a>
                      ))}
                    </div>
                  ) : null}

                  {assignment.submission?.feedback && (
                    <div className="mt-2 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2 text-[11px] text-emerald-800">
                      <span className="font-bold">Instructor feedback: </span>
                      {assignment.submission.feedback}
                    </div>
                  )}
                </div>

                <div className="shrink-0">
                  {assignment.submission?.status === 'Evaluated' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-[11px] font-semibold text-slate-500">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Graded
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => startSubmission(assignment)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[rgb(var(--tw-blue-700))] hover:bg-[rgb(var(--tw-blue-800))] text-white text-xs font-bold"
                    >
                      {assignment.submission ? <Pencil className="w-3.5 h-3.5" /> : <Upload className="w-3.5 h-3.5" />}
                      {assignment.submission ? 'Edit submission' : 'Submit work'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {active && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="max-w-2xl mx-auto my-8 rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-slate-200">
              <div>
                <h2 className="text-sm font-bold text-[color:rgb(var(--tw-ink-900))]">{active.title}</h2>
                <p className="text-[11px] text-slate-500">
                  {active.batch?.name || active.batch?.batchCode} · due {fmtDateTime(active.dueAt)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActive(null)}
                aria-label="Close submission"
                className="p-1.5 rounded-lg bg-slate-100 text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4">
              {active.instructions && (
                <div className="rounded-xl bg-blue-50 border border-blue-200 p-3 text-[11px] text-blue-900 whitespace-pre-line">
                  {active.instructions}
                </div>
              )}

              <label className="block">
                <span className="block text-[11px] font-bold text-slate-700 mb-1.5">Your answer</span>
                <textarea
                  rows={5}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Write your answer, or paste a link to your notebook / repository."
                />
              </label>

              <div className="rounded-xl border border-slate-200 p-3">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div>
                    <div className="text-[11px] font-bold text-slate-700">File links</div>
                    <div className="text-[10px] text-slate-500">Paste a link to a hosted file — no direct upload needed.</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFiles([...files, { title: '', url: '', fileType: 'LINK' }])}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-[10px] font-bold"
                  >
                    <Paperclip className="w-3 h-3" /> Add link
                  </button>
                </div>

                {files.length === 0 ? (
                  <div className="text-[10px] text-slate-400 py-1">No files attached.</div>
                ) : (
                  <div className="space-y-2">
                    {files.map((file, index) => (
                      <div key={index} className="grid grid-cols-[1fr_1.4fr_auto] gap-2">
                        <input
                          className="px-2 py-1.5 rounded-lg border border-slate-200 text-[11px]"
                          value={file.title}
                          onChange={(e) =>
                            setFiles(files.map((row, rowIndex) => (rowIndex === index ? { ...row, title: e.target.value } : row)))
                          }
                          placeholder="Title"
                          aria-label={`File ${index + 1} title`}
                        />
                        <input
                          className="px-2 py-1.5 rounded-lg border border-slate-200 text-[11px]"
                          value={file.url}
                          onChange={(e) =>
                            setFiles(files.map((row, rowIndex) => (rowIndex === index ? { ...row, url: e.target.value } : row)))
                          }
                          placeholder="https://…"
                          aria-label={`File ${index + 1} link`}
                        />
                        <button
                          type="button"
                          onClick={() => setFiles(files.filter((_, rowIndex) => rowIndex !== index))}
                          className="p-1.5 rounded-lg bg-slate-100 text-slate-600"
                          aria-label={`Remove file ${index + 1}`}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {active.dueAt && new Date(active.dueAt) < new Date() && !active.allowLateSubmission && (
                <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-[11px] text-amber-800 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" /> The deadline has passed; late submission is closed for this task.
                </div>
              )}
            </div>

            <div className="px-5 py-4 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setActive(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={submitting}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[rgb(var(--tw-blue-700))] hover:bg-[rgb(var(--tw-blue-800))] text-white text-xs font-bold disabled:opacity-50"
              >
                <Upload className="w-3.5 h-3.5" /> {submitting ? 'Submitting…' : 'Submit assignment'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
        <Clock className="w-3 h-3" /> Submissions are timestamped. Late work is flagged for the instructor.
      </div>
    </div>
  );
}
