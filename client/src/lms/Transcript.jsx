import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  ScrollText,
  Printer,
  RefreshCw,
  GraduationCap,
  Award,
  AlertCircle,
  BookOpen,
  CheckCircle2,
} from 'lucide-react';

const fmtDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
};

const fmtPercent = (value) => (value === null || value === undefined ? '—' : `${value}%`);

const statusStyle = (status) => {
  if (status === 'Completed') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (status === 'Active') return 'bg-blue-50 text-blue-700 border-blue-200';
  if (status === 'Suspended') return 'bg-amber-50 text-amber-700 border-amber-200';
  if (status === 'Cancelled') return 'bg-slate-100 text-slate-600 border-slate-200';
  return 'bg-slate-50 text-slate-600 border-slate-200';
};

const gradeStyle = (letter) => {
  if (letter === 'A') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (letter === 'B') return 'bg-blue-50 text-blue-700 border-blue-200';
  if (letter === 'C') return 'bg-amber-50 text-amber-700 border-amber-200';
  if (letter === 'F') return 'bg-rose-50 text-rose-700 border-rose-200';
  return 'bg-slate-50 text-slate-600 border-slate-200';
};

export default function Transcript() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await axios.get('/api/lms/transcript');
        if (alive) setData(res.data);
      } catch (err) {
        if (alive) setError(err.response?.data?.message || err.message || 'Could not load your transcript.');
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    return () => {
      alive = false;
    };
  }, [reloadToken]);

  const summary = data?.summary || {};
  const records = data?.records || [];

  return (
    <div className="p-6 sm:p-8 max-w-5xl mx-auto w-full space-y-6 print:p-0 print:max-w-none">
      <div className="p-6 sm:p-8 rounded-3xl bg-[rgb(var(--tw-ink-900))] text-white print:bg-white print:text-slate-900 print:border print:border-slate-300 print:rounded-xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[11px] font-bold uppercase tracking-wider mb-3 print:bg-slate-100 print:border-slate-200 print:text-slate-600">
              <ScrollText className="w-3.5 h-3.5" /> Official academic record
            </div>
            <h1 className="text-2xl sm:text-3xl font-heading font-black text-white print:text-slate-900">
              Academic Transcript
            </h1>
            <p className="text-xs sm:text-sm text-slate-200 mt-2 max-w-2xl print:text-slate-600">
              A permanent record of every course you enrolled in, with the marks, attendance and certificates that
              were actually recorded by your instructors.
            </p>
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-[rgb(var(--tw-ink-900))] text-xs font-bold hover:bg-slate-100 print:hidden"
          >
            <Printer className="w-4 h-4" /> Print / save PDF
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 print:grid-cols-4">
          {[
            { label: 'Cumulative GPA', value: summary.gpa === null || summary.gpa === undefined ? '—' : summary.gpa.toFixed(2) },
            { label: 'Courses', value: summary.totalCourses ?? 0 },
            { label: 'Completed', value: summary.completedCourses ?? 0 },
            { label: 'Certificates', value: summary.certificates ?? 0 },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl bg-white/10 border border-white/15 px-4 py-3 print:bg-white print:border-slate-200"
            >
              <div className="text-[10px] uppercase tracking-wider text-blue-100/80 print:text-slate-500">{stat.label}</div>
              <div className="text-xl font-black text-white mt-0.5 print:text-slate-900">{stat.value}</div>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((row) => (
            <div key={row} className="h-36 rounded-2xl bg-white border border-slate-200 animate-pulse print:hidden" />
          ))}
        </div>
      ) : records.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
          <BookOpen className="w-8 h-8 mx-auto text-slate-300" />
          <div className="mt-3 text-sm font-bold text-slate-800">No course records yet</div>
          <p className="mt-1 text-xs text-slate-500">
            Your transcript becomes available as soon as admissions enrolls you in a course.
          </p>
        </div>
      ) : (
        <>
          <section className="rounded-2xl border border-slate-200 bg-white p-5 print:border-slate-300 print:p-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-slate-400">Student</div>
                <div className="mt-1 text-lg font-black text-[color:rgb(var(--tw-ink-900))]">
                  {data?.student?.name || 'Student'}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">{data?.student?.email || ''}</div>
                {data?.student?.enrollmentNumber && (
                  <div className="text-[11px] font-mono text-slate-500 mt-1">
                    ID: {data.student.enrollmentNumber}
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase tracking-wider text-slate-400">Generated</div>
                <div className="text-xs font-bold text-slate-700 mt-1">{fmtDate(data?.generatedAt)}</div>
                <div className="text-[10px] text-slate-400 mt-1">American FutureTech Institute</div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Graded courses', value: summary.gradedCourses ?? 0 },
                { label: 'Quizzes taken', value: summary.quizzesTaken ?? 0 },
                { label: 'Assignments graded', value: summary.assignmentsGraded ?? 0 },
                { label: 'Attendance', value: fmtPercent(summary.attendanceRate) },
              ].map((stat) => (
                <div key={stat.label} className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2">
                  <div className="text-[9px] uppercase tracking-wider text-slate-400">{stat.label}</div>
                  <div className="text-sm font-black text-slate-800 mt-0.5">{stat.value}</div>
                </div>
              ))}
            </div>
          </section>

          <div className="flex items-center justify-between gap-3 print:hidden">
            <h2 className="text-sm font-bold text-[color:rgb(var(--tw-ink-900))]">Course records</h2>
            <button
              type="button"
              onClick={() => setReloadToken((value) => value + 1)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:border-slate-300"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>

          <div className="space-y-4">
            {records.map((record) => (
              <article key={record._id} className="rounded-2xl border border-slate-200 bg-white overflow-hidden print:break-inside-avoid">
                <div className="p-5 border-b border-slate-100">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-black text-[color:rgb(var(--tw-ink-900))]">
                          {record.course?.title || 'Course'}
                        </h3>
                        <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${statusStyle(record.status)}`}>
                          {record.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        {record.batch?.name || record.batch?.batchCode || 'Course-level enrollment'}
                        {record.enrolledAt ? ` · Enrolled ${fmtDate(record.enrolledAt)}` : ''}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`px-3 py-2 rounded-xl border text-center ${gradeStyle(record.letterGrade)}`}>
                        <div className="text-[9px] uppercase tracking-wider opacity-70">Grade</div>
                        <div className="text-lg font-black leading-tight">{record.letterGrade}</div>
                      </div>
                      <div className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-center">
                        <div className="text-[9px] uppercase tracking-wider text-slate-400">Overall</div>
                        <div className="text-lg font-black leading-tight text-slate-800">
                          {record.overall === null ? '—' : `${record.overall}%`}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: 'Quiz average', value: fmtPercent(record.quizAverage) },
                      { label: 'Assignments', value: fmtPercent(record.assignmentAverage) },
                      { label: 'Attendance', value: record.attendance?.total ? fmtPercent(record.attendance.rate) : '—' },
                      { label: 'Completion', value: record.certificate ? 'Certified' : 'In progress' },
                    ].map((stat) => (
                      <div key={stat.label} className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2">
                        <div className="text-[9px] uppercase tracking-wider text-slate-400">{stat.label}</div>
                        <div className="text-xs font-bold text-slate-800 mt-0.5">{stat.value}</div>
                      </div>
                    ))}
                  </div>

                  {record.certificate && (
                    <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 flex items-start gap-2">
                      <Award className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                      <div className="text-[11px] text-emerald-800">
                        <span className="font-bold">Certificate {record.certificate.certificateId}</span> issued{' '}
                        {fmtDate(record.certificate.issueDate)} · {record.certificate.grade}
                      </div>
                    </div>
                  )}
                </div>

                <details className="group" open>
                  <summary className="px-5 py-2.5 text-[11px] font-bold text-slate-600 cursor-pointer hover:bg-slate-50 select-none">
                    Detailed marks
                    <span className="ml-1 text-slate-400 font-normal">
                      ({record.quizzes.length} quiz result(s), {record.assignments.length} assignment(s))
                    </span>
                  </summary>

                  <div className="px-5 pb-5 grid gap-4 md:grid-cols-2">
                    <div>
                      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-slate-400 mb-2">
                        <GraduationCap className="w-3.5 h-3.5" /> Quizzes
                      </div>
                      {record.quizzes.length === 0 ? (
                        <div className="text-[11px] text-slate-400">No quiz attempts.</div>
                      ) : (
                        <div className="space-y-1.5">
                          {record.quizzes.map((quiz) => (
                            <div key={quiz._id} className="rounded-lg border border-slate-100 px-3 py-2">
                              <div className="flex items-start justify-between gap-2">
                                <span className="text-[11px] font-semibold text-slate-700">{quiz.title}</span>
                                <span className="text-[10px] font-bold text-slate-500 shrink-0">
                                  {quiz.status === 'Pending review' ? 'Pending' : `${quiz.scorePercent}%`}
                                </span>
                              </div>
                              <div className="text-[9px] text-slate-400 mt-0.5">
                                {quiz.scoreMarks}/{quiz.totalMarks} marks · {fmtDate(quiz.submittedAt)} · {quiz.status}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-slate-400 mb-2">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Assignments
                      </div>
                      {record.assignments.length === 0 ? (
                        <div className="text-[11px] text-slate-400">No assignment submissions.</div>
                      ) : (
                        <div className="space-y-1.5">
                          {record.assignments.map((assignment) => (
                            <div key={assignment._id} className="rounded-lg border border-slate-100 px-3 py-2">
                              <div className="flex items-start justify-between gap-2">
                                <span className="text-[11px] font-semibold text-slate-700">{assignment.title}</span>
                                <span className="text-[10px] font-bold text-slate-500 shrink-0">
                                  {assignment.marks === null || assignment.marks === undefined
                                    ? 'Not graded'
                                    : `${assignment.marks}/${assignment.totalMarks}`}
                                </span>
                              </div>
                              <div className="text-[9px] text-slate-400 mt-0.5">
                                {assignment.status} · {fmtDate(assignment.submittedAt)}
                                {assignment.isLate ? ' · late' : ''}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </details>
              </article>
            ))}
          </div>

          <p className="text-[10px] text-slate-400 leading-relaxed">
            GPA is the unweighted average of course grade points on a 4.0 scale (A=4, B=3, C=2, D=1, F=0) and
            includes only courses with graded work. Courses without marks show “In progress”. This page is a
            student copy; contact the registrar for a sealed official transcript.
          </p>
        </>
      )}
    </div>
  );
}
