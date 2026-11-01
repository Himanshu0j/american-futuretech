import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { GraduationCap, RefreshCw, Trophy, FileText, ListChecks, AlertCircle } from 'lucide-react';

const fmtDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
};

export default function Grades() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get('/api/lms/grades');
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Could not load your grades.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const summary = data?.summary || {};

  return (
    <div className="p-6 sm:p-8 max-w-6xl mx-auto w-full space-y-6">
      <div className="p-6 sm:p-8 rounded-3xl bg-[rgb(var(--tw-ink-900))] text-white">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[11px] font-bold uppercase tracking-wider mb-3">
          <GraduationCap className="w-3.5 h-3.5" /> Academic record
        </div>
        <h1 className="text-2xl sm:text-3xl font-heading font-black text-white">Grades & Progress</h1>
        <p className="text-xs sm:text-sm text-slate-200 mt-2 max-w-2xl">
          Every graded quiz and assignment for your enrolled batches. Marks are written by your instructors,
          never by the browser.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          {[
            { label: 'Overall', value: `${summary.overall ?? 0}%` },
            { label: 'Quiz average', value: `${summary.quizAverage ?? 0}%` },
            { label: 'Assignment average', value: `${summary.assignmentAverage ?? 0}%` },
            { label: 'Pending review', value: summary.pendingReviews ?? 0 },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl bg-white/10 border border-white/15 px-4 py-3">
              <div className="text-[10px] uppercase tracking-wider text-blue-100/80">{item.label}</div>
              <div className="text-xl font-black text-white mt-0.5">{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="text-xs text-slate-500">
          {summary.quizzesTaken ?? 0} quiz attempt(s) · {summary.assignmentsEvaluated ?? 0} graded assignment(s)
        </div>
        <button
          type="button"
          onClick={load}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:border-slate-300"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {error && <div className="px-4 py-3 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700">{error}</div>}

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((row) => (
            <div key={row} className="h-40 rounded-2xl bg-white border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-200">
              <ListChecks className="w-4 h-4 text-[rgb(var(--tw-blue-700))]" />
              <h2 className="text-sm font-bold text-[color:rgb(var(--tw-ink-900))]">Quiz results</h2>
            </div>
            {(data?.quizzes || []).length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">No quiz attempts yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="py-3 px-4">Quiz</th>
                      <th className="py-3 px-4">Batch</th>
                      <th className="py-3 px-4">Marks</th>
                      <th className="py-3 px-4">Percent</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Submitted</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(data?.quizzes || []).map((row) => (
                      <tr key={row._id}>
                        <td className="py-3 px-4 text-xs font-semibold text-[color:rgb(var(--tw-ink-900))]">{row.title}</td>
                        <td className="py-3 px-4 text-[11px] text-slate-500">{row.batch || '—'}</td>
                        <td className="py-3 px-4 text-xs text-slate-700">
                          {row.status === 'Pending review' ? '—' : `${row.scoreMarks}/${row.totalMarks}`}
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-700">
                          {row.status === 'Pending review' ? '—' : `${row.scorePercent}%`}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${
                              row.status === 'Pending review'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : row.passed
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-red-50 text-red-700 border-red-200'
                            }`}
                          >
                            {row.status === 'Pending review' ? 'Awaiting review' : row.passed ? 'Passed' : 'Not passed'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[11px] text-slate-500">{fmtDate(row.submittedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-200">
              <FileText className="w-4 h-4 text-[rgb(var(--tw-blue-700))]" />
              <h2 className="text-sm font-bold text-[color:rgb(var(--tw-ink-900))]">Assignment marks</h2>
            </div>
            {(data?.assignments || []).length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">No assignment submissions yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="py-3 px-4">Assignment</th>
                      <th className="py-3 px-4">Batch</th>
                      <th className="py-3 px-4">Marks</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Submitted</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(data?.assignments || []).map((row) => (
                      <tr key={row._id}>
                        <td className="py-3 px-4 text-xs font-semibold text-[color:rgb(var(--tw-ink-900))]">{row.title}</td>
                        <td className="py-3 px-4 text-[11px] text-slate-500">{row.batch || '—'}</td>
                        <td className="py-3 px-4 text-xs text-slate-700">
                          {row.marks === null || row.marks === undefined ? '—' : `${row.marks}/${row.totalMarks}`}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${
                              row.status === 'Evaluated'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-blue-50 text-blue-700 border-blue-200'
                            }`}
                          >
                            {row.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[11px] text-slate-500">{fmtDate(row.submittedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <AlertCircle className="w-3 h-3" />
            Grades cover only your enrolled batches. A pending review means an instructor must grade the written answers.
          </div>

          <div className="rounded-2xl bg-white border border-slate-200 p-4 flex items-center gap-3">
            <Trophy className="w-8 h-8 text-slate-300" />
            <div className="text-[11px] text-slate-500">
              Overall {summary.overall ?? 0}% across {summary.quizzesTaken ?? 0} quiz attempt(s) and{' '}
              {summary.assignmentsEvaluated ?? 0} graded assignment(s).
            </div>
          </div>
        </>
      )}
    </div>
  );
}
