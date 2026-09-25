import React, { useCallback, useEffect, useState } from 'react';
import { ListChecks, Plus, Pencil, Trash2, RefreshCw } from 'lucide-react';
import api from '../../lib/api';
import QuizEditor from './QuizEditor';
import {
  PageHeader,
  Card,
  Field,
  inputClass,
  btnPrimary,
  btnGhost,
  btnIcon,
  Badge,
  EmptyState,
  Loading,
  ErrorNote,
} from './ui';

const formatDateTime = (value) => {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return '—';
  }
};

export default function AssessmentsManager() {
  const [courses, setCourses] = useState([]);
  const [courseId, setCourseId] = useState('');
  const [modules, setModules] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [passRate, setPassRate] = useState(0);
  const [defaults, setDefaults] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [editor, setEditor] = useState({ open: false, quiz: null, moduleId: '' });

  const loadCurriculum = useCallback(async (id) => {
    if (!id) {
      setModules([]);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/curriculum/admin/courses/${id}`);
      setModules(res.data?.modules || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Could not load the course curriculum.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAttempts = useCallback(async (id) => {
    try {
      const res = await api.get('/admin/lms/quiz-attempts', { params: id ? { courseId: id } : {} });
      setAttempts(res.data?.attempts || []);
      setPassRate(res.data?.passRatePercent || 0);
    } catch {
      /* attempts are context, not the primary task */
    }
  }, []);

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
        if (list.length) setCourseId((prev) => prev || list[0]._id);
      } catch (err) {
        setError(err.response?.data?.message || 'Could not load courses.');
      }
      try {
        const res = await api.get('/admin/lms/settings');
        if (res.data?.success) setDefaults(res.data.settings || {});
      } catch {
        /* optional */
      }
    })();
  }, []);

  useEffect(() => {
    loadCurriculum(courseId);
    loadAttempts(courseId);
  }, [courseId, loadCurriculum, loadAttempts]);

  const flash = (message) => {
    setStatus(message);
    window.setTimeout(() => setStatus(''), 3000);
  };

  const remove = async (quiz) => {
    if (!window.confirm(`Delete the quiz "${quiz.title}"? Student attempts stay in the audit trail.`)) return;
    try {
      await api.delete(`/curriculum/quizzes/${quiz._id}`);
      await loadCurriculum(courseId);
      flash('Quiz deleted.');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete the quiz.');
    }
  };

  const quizzes = modules
    .filter((mod) => mod.quiz)
    .map((mod) => ({ ...mod.quiz, moduleTitle: mod.title, moduleId: mod._id }));

  const modulesWithoutQuiz = modules.filter((mod) => !mod.quiz);

  return (
    <div>
      <PageHeader
        icon={ListChecks}
        title="Assessments & Quizzes"
        subtitle="Build the knowledge check that closes each module and review how students scored."
        actions={
          <>
            <select
              aria-label="Select course"
              className={`${inputClass} w-64`}
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
            >
              <option value="">Select a course…</option>
              {courses.map((course) => (
                <option key={course._id} value={course._id}>
                  {course.title}
                </option>
              ))}
            </select>
            <button
              type="button"
              className={btnGhost}
              onClick={() => {
                loadCurriculum(courseId);
                loadAttempts(courseId);
              }}
            >
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
        <Badge tone="indigo">{quizzes.length} quizzes</Badge>
        <Badge tone="slate">{attempts.length} attempts</Badge>
        <Badge tone="emerald">{passRate}% pass rate</Badge>
      </div>

      <Card className="overflow-hidden mb-6">
        <div className="px-4 py-3 border-b border-white/[0.06] text-xs font-bold text-white">Course quizzes</div>
        {loading ? (
          <Loading />
        ) : quizzes.length === 0 ? (
          <EmptyState
            icon={ListChecks}
            title="No quizzes in this course"
            message="Add a quiz to a module — the student sees a Test button inside that module."
          />
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {quizzes.map((quiz) => (
              <div key={quiz._id} className="px-4 py-3 flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-white">{quiz.title}</div>
                  <div className="text-[10px] text-slate-400">{quiz.moduleTitle}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <Badge tone="slate">{quiz.questions?.length || 0} questions</Badge>
                    <Badge tone="slate">pass {quiz.passingScorePercent ?? 70}%</Badge>
                    <Badge tone="slate">{quiz.timeLimitMinutes ?? 15} min</Badge>
                    <Badge tone={quiz.isPublished === false ? 'amber' : 'emerald'}>
                      {quiz.isPublished === false ? 'draft' : 'live'}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className={btnGhost}
                    onClick={() => setEditor({ open: true, quiz, moduleId: quiz.moduleId })}
                  >
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    type="button"
                    className={`${btnIcon} text-rose-300`}
                    onClick={() => remove(quiz)}
                    aria-label={`Delete ${quiz.title}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {modulesWithoutQuiz.length > 0 && (
          <div className="px-4 py-3 border-t border-white/[0.06] flex flex-wrap items-center gap-2">
            <span className="text-[10px] text-slate-400">Modules without a quiz:</span>
            {modulesWithoutQuiz.map((mod) => (
              <button
                key={mod._id}
                type="button"
                className={btnGhost}
                onClick={() => setEditor({ open: true, quiz: null, moduleId: mod._id })}
              >
                <Plus className="w-3.5 h-3.5" /> {mod.title}
              </button>
            ))}
          </div>
        )}
      </Card>

      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b border-white/[0.06] text-xs font-bold text-white">Recent attempts</div>
        {attempts.length === 0 ? (
          <EmptyState
            icon={ListChecks}
            title="No attempts recorded"
            message="Student scores appear here after the first quiz submission."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-white/[0.03] text-[10px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Quiz</th>
                  <th className="py-3 px-4">Score</th>
                  <th className="py-3 px-4">Result</th>
                  <th className="py-3 px-4">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {attempts.map((row) => (
                  <tr key={row.id} className="hover:bg-white/[0.02]">
                    <td className="py-3 px-4">
                      <div className="text-xs font-semibold text-white">{row.studentName}</div>
                      <div className="text-[10px] text-slate-400">{row.studentEmail}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-[11px] text-slate-300">{row.quizTitle}</div>
                      <div className="text-[10px] text-slate-400">{row.courseTitle}</div>
                    </td>
                    <td className="py-3 px-4 text-[11px] text-slate-300">
                      {row.correctAnswersCount}/{row.totalQuestions} · {row.scorePercent}%
                    </td>
                    <td className="py-3 px-4">
                      <Badge tone={row.passed ? 'emerald' : 'rose'}>{row.passed ? 'Passed' : 'Failed'}</Badge>
                    </td>
                    <td className="py-3 px-4 text-[11px] text-slate-400">{formatDateTime(row.submittedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <QuizEditor
        open={editor.open}
        quiz={editor.quiz}
        moduleId={editor.moduleId}
        courseId={courseId}
        defaults={defaults}
        onClose={() => setEditor({ open: false, quiz: null, moduleId: '' })}
        onSaved={() => {
          loadCurriculum(courseId);
          flash('Quiz saved.');
        }}
      />
    </div>
  );
}
