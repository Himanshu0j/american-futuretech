import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  ListChecks,
  Clock,
  RefreshCw,
  PlayCircle,
  CheckCircle2,
  XCircle,
  Trophy,
  CalendarDays,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';

const statusMeta = {
  Open: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Upcoming: 'bg-blue-50 text-blue-700 border-blue-200',
  Closed: 'bg-slate-100 text-slate-600 border-slate-200',
};

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

const emptyAnswer = () => ({ selectedOptionIndex: null, selectedOptionIndexes: [], textAnswer: '' });

export default function MyQuizzes() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('available');
  const [results, setResults] = useState([]);

  const [active, setActive] = useState(null);
  const [answers, setAnswers] = useState({});
  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [outcome, setOutcome] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [quizRes, resultRes] = await Promise.all([
        axios.get('/api/lms/quizzes'),
        axios.get('/api/lms/quiz-results').catch(() => ({ data: { results: [] } })),
      ]);
      setQuizzes(quizRes.data?.quizzes || []);
      setResults(resultRes.data?.results || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Could not load your quizzes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!active || timeLeft <= 0) return undefined;
    const timer = window.setInterval(() => setTimeLeft((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [active, timeLeft]);

  const available = useMemo(() => quizzes.filter((quiz) => quiz.status === 'Open'), [quizzes]);
  const visible = tab === 'available' ? available : tab === 'upcoming' ? quizzes.filter((quiz) => quiz.status === 'Upcoming') : quizzes;

  const startQuiz = async (quiz) => {
    setStarting(true);
    setError('');
    setOutcome(null);
    try {
      const res = await axios.get(`/api/lms/quizzes/${quiz._id}`);
      setActive(res.data.quiz);
      setAnswers({});
      setTimeLeft(Math.max(1, Number(res.data.quiz.timeLimitMinutes || 15)) * 60);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not open the quiz.');
    } finally {
      setStarting(false);
    }
  };

  const setAnswer = (questionId, patch) => {
    setAnswers((current) => ({ ...current, [questionId]: { ...(current[questionId] || emptyAnswer()), ...patch } }));
  };

  const submitQuiz = async () => {
    if (!active || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const payload = active.questions.map((question) => {
        const answer = answers[question._id] || emptyAnswer();
        return {
          questionId: question._id,
          selectedOptionIndex: answer.selectedOptionIndex,
          selectedOptionIndexes: answer.selectedOptionIndexes,
          textAnswer: answer.textAnswer,
        };
      });
      const res = await axios.post(`/api/lms/quizzes/${active._id}/submit`, {
        answers: payload,
        timeSpentSeconds: Math.max(0, Number(active.timeLimitMinutes || 15) * 60 - timeLeft),
      });
      setOutcome(res.data);
      setActive(null);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not submit the quiz.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 sm:p-8 max-w-6xl mx-auto w-full space-y-6">
      <div className="p-6 sm:p-8 rounded-3xl bg-[rgb(var(--tw-ink-900))] text-white">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[11px] font-bold uppercase tracking-wider mb-3">
          <ListChecks className="w-3.5 h-3.5" /> Assessments
        </div>
        <h1 className="text-2xl sm:text-3xl font-heading font-black text-white">My Quizzes</h1>
        <p className="text-xs sm:text-sm text-slate-200 mt-2 max-w-2xl">
          Quizzes assigned to your batch. Objective answers are graded instantly; written answers appear in
          your grades once an instructor reviews them.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          {[
            { label: 'Available', value: available.length },
            { label: 'Upcoming', value: quizzes.filter((quiz) => quiz.status === 'Upcoming').length },
            { label: 'Attempts', value: results.length },
            {
              label: 'Best score',
              value: results.length ? `${Math.max(...results.map((row) => row.scorePercent || 0))}%` : '—',
            },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl bg-white/10 border border-white/15 px-4 py-3">
              <div className="text-[10px] uppercase tracking-wider text-blue-100/80">{item.label}</div>
              <div className="text-xl font-black text-white mt-0.5">{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      {outcome && (
        <div
          className={`rounded-2xl border p-4 ${
            outcome.result?.passed ? 'bg-emerald-50 border-emerald-200' : 'bg-blue-50 border-blue-200'
          }`}
        >
          <div className="flex items-center gap-2 text-sm font-bold text-[color:rgb(var(--tw-ink-900))]">
            {outcome.result?.passed ? <Trophy className="w-4 h-4 text-emerald-600" /> : <CheckCircle2 className="w-4 h-4 text-blue-600" />}
            {outcome.message || 'Quiz submitted.'}
          </div>
          {outcome.result ? (
            <div className="text-xs text-slate-600 mt-1">
              {outcome.result.scoreMarks}/{outcome.result.totalMarks} marks · {outcome.result.scorePercent}% ·{' '}
              {outcome.result.correctAnswersCount}/{outcome.result.totalQuestions} correct ·{' '}
              {outcome.result.passed ? 'Passed' : 'Not passed'}
            </div>
          ) : (
            <div className="text-xs text-slate-600 mt-1">
              Your instructor will publish the marks after reviewing the written answers.
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {[
          { id: 'available', label: 'Available' },
          { id: 'upcoming', label: 'Upcoming' },
          { id: 'results', label: 'My results' },
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

      {tab === 'results' ? (
        results.length === 0 ? (
          <div className="p-10 rounded-2xl bg-white border border-slate-200 text-center">
            <Trophy className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h2 className="text-base font-bold text-[color:rgb(var(--tw-ink-900))]">No results yet</h2>
            <p className="text-xs text-slate-500 mt-1">Attempt a quiz and your marks will appear here.</p>
          </div>
        ) : (
          <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3 px-4">Quiz</th>
                  <th className="py-3 px-4">Batch</th>
                  <th className="py-3 px-4">Score</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {results.map((row) => (
                  <tr key={row._id}>
                    <td className="py-3 px-4 text-xs font-semibold text-[color:rgb(var(--tw-ink-900))]">{row.quiz?.title || 'Quiz'}</td>
                    <td className="py-3 px-4 text-[11px] text-slate-500">{row.batch?.name || row.batch?.batchCode || '—'}</td>
                    <td className="py-3 px-4 text-xs text-slate-700">
                      {row.status === 'Pending review' ? 'Awaiting review' : `${row.scoreMarks}/${row.totalMarks} (${row.scorePercent}%)`}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold border-slate-200 bg-slate-50 text-slate-600">
                        {row.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[11px] text-slate-500">{fmtDateTime(row.submittedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((row) => (
            <div key={row} className="h-28 rounded-2xl bg-white border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="p-10 rounded-2xl bg-white border border-slate-200 text-center">
          <ListChecks className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h2 className="text-base font-bold text-[color:rgb(var(--tw-ink-900))]">
            {tab === 'available' ? 'No quiz is open right now' : 'Nothing scheduled here'}
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Your instructor publishes quizzes for your batch. They appear here the moment they open.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((quiz) => (
            <div key={quiz._id} className="rounded-2xl bg-white border border-slate-200 shadow-xs p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-sm font-bold text-[color:rgb(var(--tw-ink-900))]">{quiz.title}</h2>
                    <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${statusMeta[quiz.status] || statusMeta.Closed}`}>
                      {quiz.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    {quiz.course?.title} · {quiz.batch?.name || quiz.batch?.batchCode || 'Course-wide'}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-600 mt-2">
                    <span className="inline-flex items-center gap-1">
                      <ListChecks className="w-3.5 h-3.5" /> {quiz.questionCount} questions · {quiz.totalMarks} marks
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {quiz.timeLimitMinutes} min
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="w-3.5 h-3.5" /> {quiz.endsAt ? `Closes ${fmtDateTime(quiz.endsAt)}` : 'No deadline'}
                    </span>
                  </div>
                  {quiz.attemptsUsed > 0 && (
                    <div className="text-[10px] text-slate-400 mt-1">
                      {quiz.attemptsUsed} of {quiz.attemptsAllowed} attempt(s) used
                    </div>
                  )}
                </div>

                <div className="shrink-0 flex flex-col items-end gap-1.5">
                  {quiz.status === 'Open' && quiz.attemptsLeft > 0 ? (
                    <button
                      type="button"
                      onClick={() => startQuiz(quiz)}
                      disabled={starting}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[rgb(var(--tw-blue-700))] hover:bg-[rgb(var(--tw-blue-800))] text-white text-xs font-bold disabled:opacity-50"
                    >
                      <PlayCircle className="w-3.5 h-3.5" /> {quiz.attemptsUsed ? 'Retake' : 'Start quiz'}
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-[11px] font-semibold text-slate-500">
                      {quiz.attemptsLeft === 0 ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                      {quiz.attemptsLeft === 0 ? 'Attempts used' : quiz.status}
                    </span>
                  )}
                  {quiz.latestAttempt && quiz.latestAttempt.status !== 'Pending review' && (
                    <span className="text-[10px] text-slate-500">
                      Last: {quiz.latestAttempt.scorePercent}% ({quiz.latestAttempt.scoreMarks}/{quiz.latestAttempt.totalMarks})
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quiz runner */}
      {active && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="max-w-3xl mx-auto my-6 rounded-2xl bg-white shadow-2xl">
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-slate-200">
              <div>
                <h2 className="text-sm font-bold text-[color:rgb(var(--tw-ink-900))]">{active.title}</h2>
                <p className="text-[11px] text-slate-500">
                  {active.questions.length} questions · {active.totalMarks} marks
                </p>
              </div>
              <div className={`px-3 py-1.5 rounded-xl text-xs font-black ${timeLeft < 60 ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'}`}>
                {String(Math.floor(timeLeft / 60)).padStart(2, '0')}:{String(timeLeft % 60).padStart(2, '0')}
              </div>
            </div>

            <div className="px-5 py-4 max-h-[60vh] overflow-y-auto space-y-5">
              {active.instructions && (
                <div className="rounded-xl bg-blue-50 border border-blue-200 p-3 text-[11px] text-blue-900">
                  {active.instructions}
                </div>
              )}

              {active.questions.map((question, index) => {
                const answer = answers[question._id] || emptyAnswer();
                return (
                  <div key={question._id}>
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-xs font-semibold text-[color:rgb(var(--tw-ink-900))]">
                        {index + 1}. {question.questionText}
                      </p>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap">{question.marks} mark(s)</span>
                    </div>

                    {question.type === 'MCQ' || question.type === 'TrueFalse' ? (
                      <div className="mt-2 space-y-1.5">
                        {question.options.map((option, optionIndex) => (
                          <label key={optionIndex} className="flex items-center gap-2 text-[11px] text-slate-700">
                            <input
                              type="radio"
                              name={`q-${question._id}`}
                              checked={Number(answer.selectedOptionIndex) === optionIndex}
                              onChange={() => setAnswer(question._id, { selectedOptionIndex: optionIndex })}
                            />
                            {option}
                          </label>
                        ))}
                      </div>
                    ) : null}

                    {question.type === 'MultipleSelect' ? (
                      <div className="mt-2 space-y-1.5">
                        {question.options.map((option, optionIndex) => {
                          const chosen = answer.selectedOptionIndexes || [];
                          return (
                            <label key={optionIndex} className="flex items-center gap-2 text-[11px] text-slate-700">
                              <input
                                type="checkbox"
                                checked={chosen.includes(optionIndex)}
                                onChange={() =>
                                  setAnswer(question._id, {
                                    selectedOptionIndexes: chosen.includes(optionIndex)
                                      ? chosen.filter((value) => value !== optionIndex)
                                      : [...chosen, optionIndex],
                                  })
                                }
                              />
                              {option}
                            </label>
                          );
                        })}
                      </div>
                    ) : null}

                    {question.type === 'ShortAnswer' || question.type === 'FillBlank' ? (
                      <input
                        className="mt-2 w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                        value={answer.textAnswer}
                        onChange={(e) => setAnswer(question._id, { textAnswer: e.target.value })}
                        placeholder="Your answer"
                      />
                    ) : null}

                    {question.type === 'LongAnswer' ? (
                      <textarea
                        rows={4}
                        className="mt-2 w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                        value={answer.textAnswer}
                        onChange={(e) => setAnswer(question._id, { textAnswer: e.target.value })}
                        placeholder="Write your answer"
                      />
                    ) : null}

                    {question.type === 'Matching' ? (
                      <div className="mt-2 space-y-1.5">
                        {question.pairs.map((pair) => {
                          let selected = [];
                          try {
                            selected = JSON.parse(answer.textAnswer || '[]');
                          } catch {
                            selected = [];
                          }
                          const current = selected.find((row) => row.left === pair.left)?.right || '';
                          return (
                            <div key={pair.left} className="grid grid-cols-2 gap-2 items-center">
                              <span className="text-[11px] text-slate-700">{pair.left}</span>
                              <select
                                className="px-2 py-1.5 rounded-lg border border-slate-200 text-[11px]"
                                value={current}
                                onChange={(e) => {
                                  const next = selected.filter((row) => row.left !== pair.left);
                                  next.push({ left: pair.left, right: e.target.value });
                                  setAnswer(question._id, { textAnswer: JSON.stringify(next) });
                                }}
                              >
                                <option value="">Select…</option>
                                {question.matchingChoices.map((choice, choiceIndex) => (
                                  <option key={`${choice}-${choiceIndex}`} value={choice}>{choice}</option>
                                ))}
                              </select>
                            </div>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>

            <div className="px-5 py-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setActive(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitQuiz}
                disabled={submitting}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[rgb(var(--tw-blue-700))] hover:bg-[rgb(var(--tw-blue-800))] text-white text-xs font-bold disabled:opacity-50"
              >
                <ChevronRight className="w-3.5 h-3.5" /> {submitting ? 'Submitting…' : 'Submit quiz'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
        <AlertCircle className="w-3 h-3" />
        Only quizzes assigned to your batch are listed. A quiz from another cohort can never be opened.
      </div>
    </div>
  );
}
