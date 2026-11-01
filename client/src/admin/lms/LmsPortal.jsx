import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  Search,
  RefreshCw,
  ArrowRight,
  Users,
  CalendarDays,
  BookOpen,
  ListChecks,
  Plus,
  Pencil,
  Power,
} from 'lucide-react';
import api from '../../lib/api';
import { PageHeader, Card, StatCard, Badge, Loading, ErrorNote, EmptyState, btnGhost, btnPrimary, inputClass } from './ui';

const initials = (title = '') =>
  title
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();

// Course.instructor is a subdocument ({ name, role, avatar, bio }), so it can
// never be rendered directly.
const instructorName = (value) =>
  typeof value === 'string' ? value.trim() : String(value?.name || '').trim();

const FILTERS = [
  { id: 'all', label: 'All courses' },
  { id: 'published', label: 'Published' },
  { id: 'draft', label: 'Draft' },
];

export default function LmsPortal() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [flash, setFlash] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [toggling, setToggling] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin/lms/portal');
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Could not load the LMS portal.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const notify = (message) => {
    setFlash(message);
    window.setTimeout(() => setFlash(''), 3500);
  };

  const toggleVisibility = async (course) => {
    setToggling(course._id);
    setError('');
    try {
      const res = await api.patch(`/admin/lms/portal/courses/${course._id}/visibility`, {
        isPublished: !course.isPublished,
      });
      setData((current) => ({
        ...current,
        courses: current.courses.map((row) =>
          row._id === course._id ? { ...row, isPublished: res.data.course.isPublished } : row
        ),
      }));
      notify(`${course.title} ${res.data.course.isPublished ? 'published' : 'moved to draft'}.`);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not change the course status.');
    } finally {
      setToggling('');
    }
  };

  const totals = data?.totals || {};
  const courses = useMemo(() => {
    const list = data?.courses || [];
    const query = search.trim().toLowerCase();
    return list.filter((course) => {
      const matchesQuery = query
        ? `${course.title} ${course.category} ${instructorName(course.instructor)}`.toLowerCase().includes(query)
        : true;
      const matchesFilter =
        filter === 'all' ? true : filter === 'published' ? course.isPublished : !course.isPublished;
      return matchesQuery && matchesFilter;
    });
  }, [data, search, filter]);

  return (
    <div>
      <PageHeader
        icon={GraduationCap}
        title="LMS Portal"
        subtitle="Every course, its batches and their classrooms. Open a course to manage the cohorts inside it — students only ever see the batch they are enrolled in."
        actions={
          <>
            <Link to="/admin/lms/curriculum" className={btnGhost}>
              <BookOpen className="w-3.5 h-3.5" /> Curriculum
            </Link>
            <Link to="/admin/courses" className={btnPrimary}>
              <Plus className="w-3.5 h-3.5" /> Create course
            </Link>
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
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Courses" value={totals.courses ?? 0} hint="Certification tracks" icon={BookOpen} />
            <StatCard label="Live batches" value={totals.batches ?? 0} hint="Archived batches excluded" icon={CalendarDays} tone="indigo" />
            <StatCard label="Students" value={totals.students ?? 0} hint="Every enrollment on record" icon={Users} tone="emerald" />
            <StatCard
              label="Classes"
              value={totals.classes ?? 0}
              hint={`${totals.upcomingClasses ?? 0} upcoming`}
              icon={ListChecks}
              tone="amber"
            />
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[220px] max-w-md">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                className={`${inputClass} pl-8`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search courses, category or instructor"
                aria-label="Search courses"
              />
            </div>
            <div className="flex gap-1.5" role="group" aria-label="Filter courses by status">
              {FILTERS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setFilter(item.id)}
                  aria-pressed={filter === item.id}
                  className={`px-3 py-2 rounded-xl text-[11px] font-bold transition-colors ${
                    filter === item.id
                      ? 'bg-[rgb(var(--tw-blue-700))] text-white'
                      : 'bg-white/[0.06] text-slate-300 hover:bg-white/[0.1]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <button type="button" className={btnGhost} onClick={load}>
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>

          {courses.length === 0 ? (
            <Card className="mt-4">
              <EmptyState
                icon={GraduationCap}
                title={search || filter !== 'all' ? 'No course matches this view' : 'No courses yet'}
                message={
                  search || filter !== 'all'
                    ? 'Try another search or switch the status filter.'
                    : 'Create a course in the Courses CMS first, then come back to add its batches.'
                }
                action={
                  <Link to="/admin/courses" className={btnPrimary}>
                    <Plus className="w-3.5 h-3.5" /> Create a course
                  </Link>
                }
              />
            </Card>
          ) : (
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {courses.map((course) => (
                <div
                  key={course._id}
                  className="group rounded-2xl bg-[rgb(var(--tw-ink-900))] border border-white/[0.08] hover:border-blue-400/40 transition-colors overflow-hidden flex flex-col"
                >
                  <Link to={`/admin/lms/portal/${course._id}`} className="relative h-32 block bg-gradient-to-br from-[rgb(var(--tw-blue-800))] to-[rgb(var(--tw-ink-900))] overflow-hidden">
                    {course.thumbnail ? (
                      <img
                        src={course.thumbnail}
                        alt=""
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                        loading="lazy"
                      />
                    ) : (
                      <span className="absolute inset-0 flex items-center justify-center text-2xl font-black text-white/70 font-heading">
                        {initials(course.title)}
                      </span>
                    )}
                    <div className="absolute top-3 left-3 flex gap-1.5">
                      <Badge tone={course.isPublished ? 'emerald' : 'slate'}>
                        {course.isPublished ? 'Published' : 'Draft'}
                      </Badge>
                    </div>
                  </Link>

                  <div className="p-4 flex-1 flex flex-col">
                    <div className="text-[10px] uppercase tracking-wider text-blue-300 font-bold">
                      {course.category || 'Program'}
                    </div>
                    <Link to={`/admin/lms/portal/${course._id}`}>
                      <h2 className="text-sm font-bold text-white mt-1 leading-snug hover:text-blue-200 transition-colors">
                        {course.title}
                      </h2>
                    </Link>
                    {course.description && (
                      <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">{course.description}</p>
                    )}
                    <div className="text-[10px] text-slate-400 mt-1">
                      {instructorName(course.instructor) || 'Instructor not set'} · {course.duration || 'Flexible'}
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                      <div className="rounded-lg bg-white/[0.04] py-1.5">
                        <div className="text-sm font-bold text-white">{course.batches - course.archivedBatches}</div>
                        <div className="text-[9px] uppercase tracking-wider text-slate-400">Batches</div>
                      </div>
                      <div className="rounded-lg bg-white/[0.04] py-1.5">
                        <div className="text-sm font-bold text-white">{course.activeStudents}</div>
                        <div className="text-[9px] uppercase tracking-wider text-slate-400">Students</div>
                      </div>
                      <div className="rounded-lg bg-white/[0.04] py-1.5">
                        <div className="text-sm font-bold text-white">{course.classes}</div>
                        <div className="text-[9px] uppercase tracking-wider text-slate-400">Classes</div>
                      </div>
                    </div>

                    <div className="mt-3 text-[10px] text-slate-400">
                      {course.upcomingClasses} upcoming class{course.upcomingClasses === 1 ? '' : 'es'} · {course.quizzes}{' '}
                      {course.quizzes === 1 ? 'quiz' : 'quizzes'}
                    </div>

                    <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center justify-between gap-2">
                      <Link
                        to={`/admin/lms/portal/${course._id}`}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-300 hover:text-blue-200"
                      >
                        Open batches
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                      <div className="flex items-center gap-1.5">
                        <Link to="/admin/courses" className={btnGhost} title="Edit course details">
                          <Pencil className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          type="button"
                          className={btnGhost}
                          onClick={() => toggleVisibility(course)}
                          disabled={toggling === course._id}
                          title={course.isPublished ? 'Move to draft' : 'Publish course'}
                          aria-label={course.isPublished ? `Unpublish ${course.title}` : `Publish ${course.title}`}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
