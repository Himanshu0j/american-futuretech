import React, { useCallback, useEffect, useState } from 'react';
import { UserPlus, Plus, Trash2, Search, RefreshCw } from 'lucide-react';
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
  ProgressBar,
  EmptyState,
  Loading,
  ErrorNote,
  Modal,
} from './ui';

const STATUSES = ['Active', 'Completed', 'Suspended', 'Cancelled'];

const statusTone = {
  Active: 'emerald',
  Completed: 'indigo',
  Suspended: 'amber',
  Cancelled: 'rose',
};

export default function EnrollmentsManager() {
  const [rows, setRows] = useState([]);
  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [students, setStudents] = useState([]);
  const [filters, setFilters] = useState({ courseId: '', status: '', search: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState({ studentId: '', courseId: '', batchId: '', status: 'Active' });

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (filters.courseId) params.courseId = filters.courseId;
      if (filters.status) params.status = filters.status;
      if (filters.search) params.search = filters.search;
      const res = await api.get('/admin/lms/enrollments', { params });
      setRows(res.data?.enrollments || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Could not load enrollments.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

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
        /* courses are only needed for the create form and the filter */
      }
      try {
        const res = await api.get('/batches');
        setBatches(res.data?.batches || []);
      } catch {
        /* optional */
      }
      try {
        const res = await api.get('/students/admin', { params: { limit: 200 } });
        setStudents(res.data?.students || []);
      } catch {
        /* optional */
      }
    })();
  }, []);

  const flash = (message) => {
    setStatus(message);
    window.setTimeout(() => setStatus(''), 3000);
  };

  const handleCreate = async () => {
    if (!draft.studentId || !draft.courseId) {
      setError('Pick both a student and a course.');
      return;
    }
    try {
      await api.post('/admin/lms/enrollments', draft);
      setCreating(false);
      setDraft({ studentId: '', courseId: '', batchId: '', status: 'Active' });
      await load();
      flash('Student enrolled.');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not enroll the student.');
    }
  };

  const changeStatus = async (row, nextStatus) => {
    try {
      await api.put(`/admin/lms/enrollments/${row._id}`, { status: nextStatus });
      await load();
      flash('Enrollment updated.');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update the enrollment.');
    }
  };

  const remove = async (row) => {
    if (!window.confirm(`Remove ${row.student?.name || 'this student'}'s access to "${row.course?.title}"?`)) return;
    try {
      await api.delete(`/admin/lms/enrollments/${row._id}`);
      await load();
      flash('Access removed.');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not remove access.');
    }
  };

  return (
    <div>
      <PageHeader
        icon={UserPlus}
        title="Enrollments & Access"
        subtitle="Give a student access to a program or cohort, pause it, or take it away."
        actions={
          <>
            <button type="button" className={btnGhost} onClick={load}>
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
            <button type="button" className={btnPrimary} onClick={() => setCreating(true)}>
              <Plus className="w-3.5 h-3.5" /> Enroll student
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

      <Card className="p-4 mb-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Course">
            <select
              className={inputClass}
              value={filters.courseId}
              onChange={(e) => setFilters((prev) => ({ ...prev, courseId: e.target.value }))}
            >
              <option value="">All courses</option>
              {courses.map((course) => (
                <option key={course._id} value={course._id}>
                  {course.title}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Status">
            <select
              className={inputClass}
              value={filters.status}
              onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
            >
              <option value="">All statuses</option>
              {STATUSES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Search">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                className={`${inputClass} pl-8`}
                value={filters.search}
                onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                placeholder="Student name or email"
              />
            </div>
          </Field>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {loading ? (
          <Loading />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={UserPlus}
            title="No enrollments found"
            message="Enroll a student to give them LMS access to a program."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-white/[0.03] text-[10px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Course</th>
                  <th className="py-3 px-4">Batch</th>
                  <th className="py-3 px-4">Progress</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {rows.map((row) => (
                  <tr key={row._id} className="hover:bg-white/[0.02]">
                    <td className="py-3 px-4">
                      <div className="text-xs font-semibold text-white">{row.student?.name || 'Unknown'}</div>
                      <div className="text-[10px] text-slate-400">{row.student?.email}</div>
                    </td>
                    <td className="py-3 px-4 text-[11px] text-slate-300">{row.course?.title || '—'}</td>
                    <td className="py-3 px-4 text-[11px] text-slate-400">{row.batch?.batchCode || '—'}</td>
                    <td className="py-3 px-4">
                      <ProgressBar percent={row.progressPercent || 0} />
                    </td>
                    <td className="py-3 px-4">
                      <Badge tone={statusTone[row.status] || 'slate'}>{row.status}</Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <select
                          aria-label={`Status for ${row.student?.name || 'student'}`}
                          className={`${inputClass} w-28`}
                          value={row.status}
                          onChange={(e) => changeStatus(row, e.target.value)}
                        >
                          {STATUSES.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          className={btnDanger}
                          onClick={() => remove(row)}
                          aria-label={`Remove access for ${row.student?.name || 'student'}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={creating}
        title="Enroll a student"
        subtitle="This immediately gives the student access to the course in the LMS."
        onClose={() => setCreating(false)}
        footer={
          <>
            <button type="button" className={btnGhost} onClick={() => setCreating(false)}>
              Cancel
            </button>
            <button type="button" className={btnPrimary} onClick={handleCreate}>
              Enroll
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Student" required>
            <select
              className={inputClass}
              value={draft.studentId}
              onChange={(e) => setDraft((prev) => ({ ...prev, studentId: e.target.value }))}
            >
              <option value="">Select a student…</option>
              {students.map((student) => (
                <option key={student._id} value={student._id}>
                  {student.name} — {student.email}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Course" required>
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
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Batch" hint="Optional — the live cohort this student joins.">
              <select
                className={inputClass}
                value={draft.batchId}
                onChange={(e) => setDraft((prev) => ({ ...prev, batchId: e.target.value }))}
              >
                <option value="">No batch</option>
                {batches.map((batch) => (
                  <option key={batch._id} value={batch._id}>
                    {batch.batchCode}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Status">
              <select
                className={inputClass}
                value={draft.status}
                onChange={(e) => setDraft((prev) => ({ ...prev, status: e.target.value }))}
              >
                {STATUSES.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </div>
      </Modal>
    </div>
  );
}
