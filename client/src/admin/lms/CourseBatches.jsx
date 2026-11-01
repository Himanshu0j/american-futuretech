import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ChevronRight,
  CalendarDays,
  Plus,
  Users,
  BookOpen,
  Copy,
  Archive,
  Trash2,
  RefreshCw,
  ArrowLeft,
} from 'lucide-react';
import api from '../../lib/api';
import {
  PageHeader,
  Card,
  Field,
  inputClass,
  btnPrimary,
  btnGhost,
  btnDanger,
  Badge,
  EmptyState,
  Loading,
  ErrorNote,
  Modal,
} from './ui';
import BatchForm, { emptyBatch } from './BatchForm';

const statusTone = {
  Upcoming: 'indigo',
  'In Progress': 'emerald',
  Completed: 'slate',
  Closed: 'rose',
  Archived: 'slate',
};

const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
};

export default function CourseBatches() {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [flash, setFlash] = useState('');
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState(emptyBatch(courseId));
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/admin/lms/portal/courses/${courseId}`);
      setCourse(res.data?.course || null);
      setBatches(res.data?.batches || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Could not load this course.');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    load();
  }, [load]);

  const notify = (message) => {
    setFlash(message);
    window.setTimeout(() => setFlash(''), 3500);
  };

  const createBatch = async () => {
    if (!draft.batchCode.trim()) {
      setError('Batch code is required.');
      return;
    }
    if (!draft.startDate) {
      setError('Start date is required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await api.post('/admin/lms/batches', { ...draft, courseId });
      setCreating(false);
      setDraft(emptyBatch(courseId));
      await load();
      notify('Batch created.');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create the batch.');
    } finally {
      setSaving(false);
    }
  };

  const duplicate = async (batch) => {
    try {
      await api.post(`/admin/lms/batches/${batch._id}/duplicate`);
      await load();
      notify('Batch configuration duplicated as a draft.');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not duplicate the batch.');
    }
  };

  const archive = async (batch) => {
    if (!window.confirm(`Archive ${batch.batchCode}? Students keep their history; the batch leaves the active list.`)) return;
    try {
      await api.post(`/admin/lms/batches/${batch._id}/archive`);
      await load();
      notify('Batch archived.');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not archive the batch.');
    }
  };

  const remove = async (batch) => {
    if (!window.confirm(`Delete ${batch.batchCode} permanently? This is only allowed when it has no students or classes.`)) return;
    try {
      await api.delete(`/admin/lms/batches/${batch._id}`);
      await load();
      notify('Batch deleted.');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete the batch.');
    }
  };

  return (
    <div>
      <nav className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-3" aria-label="Breadcrumb">
        <Link to="/admin/lms/portal" className="hover:text-white inline-flex items-center gap-1">
          <ArrowLeft className="w-3 h-3" /> LMS Portal
        </Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-slate-200 font-semibold">{course?.title || 'Course'}</span>
      </nav>

      <PageHeader
        icon={CalendarDays}
        title={course?.title || 'Course batches'}
        subtitle="Create a cohort, set its schedule and open its batch workspace."
        actions={
          <>
            <button type="button" className={btnGhost} onClick={load}>
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
            <Link to={`/admin/lms/curriculum?course=${courseId}`} className={btnGhost}>
              <BookOpen className="w-3.5 h-3.5" /> Curriculum
            </Link>
            <button type="button" className={btnPrimary} onClick={() => setCreating(true)}>
              <Plus className="w-3.5 h-3.5" /> Create batch
            </button>
          </>
        }
      />

      <ErrorNote>{error}</ErrorNote>
      {flash && (
        <div className="mb-4 px-3 py-2 rounded-xl bg-blue-500/10 border border-blue-400/20 text-[11px] text-blue-200">
          {flash}
        </div>
      )}

      {loading ? (
        <Card>
          <Loading />
        </Card>
      ) : batches.length === 0 ? (
        <Card>
          <EmptyState
            icon={CalendarDays}
            title="No batches yet"
            message="A batch is the cohort a student is enrolled in. Classes, rosters and meeting links all hang off it."
            action={
              <button type="button" className={btnPrimary} onClick={() => setCreating(true)}>
                <Plus className="w-3.5 h-3.5" /> Create the first batch
              </button>
            }
          />
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {batches.map((batch) => {
            const seats = batch.maxCapacity || 0;
            const used = batch.activeStudents || 0;
            const percent = seats ? Math.min(100, Math.round((used / seats) * 100)) : 0;
            return (
              <Card key={batch._id} className="p-4 flex flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-sm font-bold text-white truncate">{batch.name || batch.batchCode}</h2>
                      <Badge tone={statusTone[batch.status] || 'slate'}>{batch.status}</Badge>
                      {batch.visibility === 'Draft' && <Badge tone="amber">Draft</Badge>}
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 mt-0.5">{batch.batchCode}</div>
                  </div>
                  <div className="text-right text-[10px] text-slate-400 shrink-0">
                    <div>{formatDate(batch.startDate)}</div>
                    {batch.endDate && <div>to {formatDate(batch.endDate)}</div>}
                  </div>
                </div>

                <div className="mt-3 text-[11px] text-slate-300">{batch.timing || 'Schedule not set'}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {batch.instructor || 'Instructor not assigned'} · {batch.timezone || 'Timezone not set'}
                </div>

                <div className="mt-3">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                    <span className="inline-flex items-center gap-1">
                      <Users className="w-3 h-3" /> {used} / {seats || '∞'} enrolled
                    </span>
                    <span>
                      {batch.classCount || 0} {batch.classCount === 1 ? 'class' : 'classes'} ·{' '}
                      {batch.upcomingClasses || 0} upcoming
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
                    <div className="h-full bg-blue-500" style={{ width: `${percent}%` }} />
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between gap-2">
                  <Link
                    to={`/admin/lms/portal/${courseId}/batches/${batch._id}`}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-300 hover:text-blue-200"
                  >
                    Open batch <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                  <div className="flex items-center gap-1.5">
                    <button type="button" className={btnGhost} onClick={() => duplicate(batch)} title="Duplicate configuration">
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" className={btnGhost} onClick={() => archive(batch)} title="Archive batch">
                      <Archive className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" className={btnDanger} onClick={() => remove(batch)} title="Delete empty batch">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        open={creating}
        title="Create a batch"
        subtitle={course?.title ? `New cohort inside ${course.title}` : 'New cohort'}
        onClose={() => setCreating(false)}
        wide
        footer={
          <>
            <button type="button" className={btnGhost} onClick={() => setCreating(false)} disabled={saving}>
              Cancel
            </button>
            <button type="button" className={btnPrimary} onClick={createBatch} disabled={saving}>
              {saving ? 'Creating…' : 'Create batch'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Course">
            <input className={inputClass} value={course?.title || ''} readOnly aria-readonly="true" />
          </Field>
          <BatchForm value={draft} onChange={setDraft} />
        </div>
      </Modal>
    </div>
  );
}
