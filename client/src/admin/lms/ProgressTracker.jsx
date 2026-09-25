import React, { useCallback, useEffect, useState } from 'react';
import { TrendingUp, RotateCcw, CheckCircle2, RefreshCw, Award } from 'lucide-react';
import api from '../../lib/api';
import {
  PageHeader,
  Card,
  Field,
  inputClass,
  btnPrimary,
  btnGhost,
  Badge,
  ProgressBar,
  EmptyState,
  Loading,
  ErrorNote,
} from './ui';

const formatDate = (value) => {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return '—';
  }
};

export default function ProgressTracker() {
  const [rows, setRows] = useState([]);
  const [courses, setCourses] = useState([]);
  const [courseId, setCourseId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [busyId, setBusyId] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = courseId ? { courseId } : {};
      const res = await api.get('/admin/lms/progress', { params });
      setRows(res.data?.progress || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Could not load progress.');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

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
        /* the filter is optional */
      }
    })();
  }, []);

  const flash = (message) => {
    setStatus(message);
    window.setTimeout(() => setStatus(''), 3000);
  };

  const reset = async (row) => {
    if (!window.confirm(`Reset ${row.studentName}'s progress in "${row.courseTitle}"? Completed lessons are cleared.`)) return;
    setBusyId(row.id);
    try {
      await api.post('/admin/lms/progress/reset', { studentId: row.studentId, courseId: row.courseId });
      await load();
      flash('Progress reset.');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not reset progress.');
    } finally {
      setBusyId('');
    }
  };

  const markComplete = async (row) => {
    if (!window.confirm(`Mark every lesson complete for ${row.studentName} in "${row.courseTitle}"?`)) return;
    setBusyId(row.id);
    try {
      await api.post('/admin/lms/progress/complete', { studentId: row.studentId, courseId: row.courseId });
      await load();
      flash('Course marked complete — the student is now certificate eligible.');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not mark the course complete.');
    } finally {
      setBusyId('');
    }
  };

  const completed = rows.filter((row) => row.isCompleted).length;
  const average = rows.length
    ? Math.round(rows.reduce((sum, row) => sum + (row.progressPercent || 0), 0) / rows.length)
    : 0;

  return (
    <div>
      <PageHeader
        icon={TrendingUp}
        title="Progress & Completion"
        subtitle="See how far each student has got, correct a mistake, or mark an offline cohort complete."
        actions={
          <>
            <select
              aria-label="Filter by course"
              className={`${inputClass} w-64`}
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
            >
              <option value="">All courses</option>
              {courses.map((course) => (
                <option key={course._id} value={course._id}>
                  {course.title}
                </option>
              ))}
            </select>
            <button type="button" className={btnGhost} onClick={load}>
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
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

      <div className="flex flex-wrap items-center gap-3 mb-4 text-[11px] text-slate-400">
        <Badge tone="slate">{rows.length} tracked students</Badge>
        <Badge tone="emerald">{completed} completed</Badge>
        <Badge tone="indigo">average {average}%</Badge>
      </div>

      <Card className="overflow-hidden">
        {loading ? (
          <Loading />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={TrendingUp}
            title="No progress recorded yet"
            message="Progress appears here as soon as enrolled students open a lesson."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-white/[0.03] text-[10px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Course</th>
                  <th className="py-3 px-4">Lessons</th>
                  <th className="py-3 px-4">Progress</th>
                  <th className="py-3 px-4">Last activity</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {rows.map((row) => (
                  <tr key={row.id} className="hover:bg-white/[0.02]">
                    <td className="py-3 px-4">
                      <div className="text-xs font-semibold text-white flex items-center gap-2">
                        {row.studentName}
                        {row.isCompleted && <Award className="w-3.5 h-3.5 text-emerald-300" />}
                      </div>
                      <div className="text-[10px] text-slate-400">{row.studentEmail}</div>
                    </td>
                    <td className="py-3 px-4 text-[11px] text-slate-300">{row.courseTitle}</td>
                    <td className="py-3 px-4 text-[11px] text-slate-400">
                      {row.completedLessons} / {row.totalLessons || '—'}
                    </td>
                    <td className="py-3 px-4">
                      <ProgressBar percent={row.progressPercent || 0} />
                    </td>
                    <td className="py-3 px-4 text-[11px] text-slate-400">
                      {formatDate(row.lastActivity)}
                      {row.isCompleted && (
                        <span className="block text-[10px] text-emerald-300">
                          completed {formatDate(row.completionDate)}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          className={btnGhost}
                          onClick={() => markComplete(row)}
                          disabled={busyId === row.id || row.isCompleted}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Complete
                        </button>
                        <button
                          type="button"
                          className={btnPrimary}
                          onClick={() => reset(row)}
                          disabled={busyId === row.id}
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> Reset
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
    </div>
  );
}
