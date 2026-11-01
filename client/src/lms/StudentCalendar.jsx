import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Video,
  ListChecks,
  ClipboardList,
  Briefcase,
  Clock,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';

const TYPE_META = {
  class: {
    label: 'Class',
    icon: Video,
    dot: 'bg-blue-500',
    chip: 'bg-blue-50 text-blue-700 border-blue-100',
    panel: 'bg-blue-50 text-blue-700',
  },
  quiz: {
    label: 'Quiz',
    icon: ListChecks,
    dot: 'bg-amber-500',
    chip: 'bg-amber-50 text-amber-700 border-amber-100',
    panel: 'bg-amber-50 text-amber-700',
  },
  assignment: {
    label: 'Assignment',
    icon: ClipboardList,
    dot: 'bg-violet-500',
    chip: 'bg-violet-50 text-violet-700 border-violet-100',
    panel: 'bg-violet-50 text-violet-700',
  },
  job: {
    label: 'Deadline',
    icon: Briefcase,
    dot: 'bg-emerald-500',
    chip: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    panel: 'bg-emerald-50 text-emerald-700',
  },
};

const FILTERS = [
  { id: 'all', label: 'Everything' },
  { id: 'class', label: 'Classes' },
  { id: 'quiz', label: 'Quizzes' },
  { id: 'assignment', label: 'Assignments' },
  { id: 'job', label: 'Deadlines' },
];

const pad = (value) => String(value).padStart(2, '0');
const dayKey = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const sameDay = (a, b) => a && b && dayKey(a) === dayKey(b);
const sameMonth = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
const monthLabel = (date) => date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
const timeLabel = (value) =>
  new Date(value).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
const dateLabel = (value) =>
  new Date(value).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });

export default function StudentCalendar() {
  const today = useMemo(() => new Date(), []);
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState(() => new Date(today.getFullYear(), today.getMonth(), today.getDate()));
  const [events, setEvents] = useState([]);
  const [summary, setSummary] = useState({ total: 0, class: 0, quiz: 0, assignment: 0, job: 0 });
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadToken, setReloadToken] = useState(0);

  const range = useMemo(() => {
    const gridStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    gridStart.setDate(gridStart.getDate() - gridStart.getDay());
    const gridEnd = new Date(gridStart);
    gridEnd.setDate(gridStart.getDate() + 41);
    gridEnd.setHours(23, 59, 59, 999);
    return { gridStart, gridEnd };
  }, [cursor]);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await axios.get('/api/lms/calendar', {
          params: { from: range.gridStart.toISOString(), to: range.gridEnd.toISOString() },
        });
        if (!alive) return;
        setEvents(res.data?.events || []);
        setSummary(res.data?.summary || { total: 0, class: 0, quiz: 0, assignment: 0, job: 0 });
      } catch (err) {
        if (!alive) return;
        setError(err.response?.data?.message || err.message || 'Could not load your calendar.');
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    return () => {
      alive = false;
    };
  }, [range.gridStart.getTime(), range.gridEnd.getTime(), reloadToken]);

  const days = useMemo(() => {
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(range.gridStart);
      date.setDate(range.gridStart.getDate() + index);
      return date;
    });
  }, [range.gridStart.getTime()]);

  const visibleEvents = useMemo(
    () => (filter === 'all' ? events : events.filter((event) => event.type === filter)),
    [events, filter]
  );

  const eventsByDay = useMemo(() => {
    const map = new Map();
    visibleEvents.forEach((event) => {
      const key = dayKey(new Date(event.start));
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(event);
    });
    return map;
  }, [visibleEvents]);

  const selectedEvents = eventsByDay.get(dayKey(selected)) || [];

  const goMonth = (offset) => {
    const next = new Date(cursor.getFullYear(), cursor.getMonth() + offset, 1);
    setCursor(next);
    setSelected((current) => (sameMonth(current, next) ? current : new Date(next.getFullYear(), next.getMonth(), 1)));
  };

  const goToday = () => {
    setCursor(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelected(new Date(today.getFullYear(), today.getMonth(), today.getDate()));
  };

  const monthlyCount = events.filter((event) => sameMonth(new Date(event.start), cursor)).length;

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto w-full space-y-6">
      <div className="p-6 sm:p-8 rounded-3xl bg-[rgb(var(--tw-ink-900))] text-white">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[11px] font-bold uppercase tracking-wider mb-3">
          <CalendarDays className="w-3.5 h-3.5" /> Academic Calendar
        </div>
        <h1 className="text-2xl sm:text-3xl font-heading font-black text-white">Your schedule</h1>
        <p className="text-xs sm:text-sm text-slate-200 mt-2 max-w-2xl">
          Classes, quiz windows, assignment deadlines and career application dates for your enrolled batches.
          Nothing from another cohort appears here.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          {[
            { label: 'In this month', value: monthlyCount },
            { label: 'Classes', value: summary.class || 0 },
            { label: 'Assessments', value: (summary.quiz || 0) + (summary.assignment || 0) },
            { label: 'Deadlines', value: summary.job || 0 },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl bg-white/10 border border-white/15 px-4 py-3">
              <div className="text-[10px] uppercase tracking-wider text-blue-100/80">{stat.label}</div>
              <div className="text-xl font-black text-white mt-0.5">{stat.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              aria-pressed={filter === item.id}
              className={`px-3.5 py-2 rounded-full text-[11px] font-bold border transition-colors ${
                filter === item.id
                  ? 'bg-[rgb(var(--tw-ink-900))] text-white border-[rgb(var(--tw-ink-900))]'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setReloadToken((value) => value + 1)}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-600 hover:border-slate-300"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-200">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => goMonth(-1)}
                aria-label="Previous month"
                className="p-2 rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <h2 className="text-sm font-bold text-[color:rgb(var(--tw-ink-900))] min-w-[150px] text-center">
                {monthLabel(cursor)}
              </h2>
              <button
                type="button"
                onClick={() => goMonth(1)}
                aria-label="Next month"
                className="p-2 rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <button
              type="button"
              onClick={goToday}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-[11px] font-bold text-slate-600 hover:bg-slate-50"
            >
              Today
            </button>
          </div>

          <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="py-2 text-center text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {days.map((day) => {
              const dayEvents = eventsByDay.get(dayKey(day)) || [];
              const inMonth = sameMonth(day, cursor);
              const isToday = sameDay(day, today);
              const isSelected = sameDay(day, selected);
              return (
                <button
                  key={dayKey(day)}
                  type="button"
                  onClick={() => {
                    setSelected(day);
                    if (!inMonth) setCursor(new Date(day.getFullYear(), day.getMonth(), 1));
                  }}
                  aria-label={`${dateLabel(day)}, ${dayEvents.length} event(s)`}
                  aria-pressed={isSelected}
                  className={`min-h-[74px] sm:min-h-[96px] p-1.5 border-b border-r border-slate-100 text-left align-top transition-colors ${
                    inMonth ? 'bg-white hover:bg-slate-50' : 'bg-slate-50/70 text-slate-400'
                  } ${isSelected ? 'ring-2 ring-inset ring-[rgb(var(--tw-blue-700))] bg-blue-50/50' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-bold ${
                        isToday
                          ? 'bg-[rgb(var(--tw-blue-700))] text-white'
                          : inMonth
                            ? 'text-slate-700'
                            : 'text-slate-400'
                      }`}
                    >
                      {day.getDate()}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="text-[9px] font-bold text-slate-400">{dayEvents.length}</span>
                    )}
                  </div>

                  <div className="mt-1 hidden sm:block space-y-0.5">
                    {dayEvents.slice(0, 2).map((event) => {
                      const meta = TYPE_META[event.type] || TYPE_META.class;
                      return (
                        <div
                          key={event.id}
                          className={`px-1.5 py-0.5 rounded border text-[9px] font-semibold truncate ${meta.chip}`}
                        >
                          {event.title}
                        </div>
                      );
                    })}
                    {dayEvents.length > 2 && (
                      <div className="text-[9px] text-slate-400 font-semibold">+{dayEvents.length - 2} more</div>
                    )}
                  </div>

                  <div className="sm:hidden mt-1 flex flex-wrap gap-0.5">
                    {dayEvents.slice(0, 3).map((event) => {
                      const meta = TYPE_META[event.type] || TYPE_META.class;
                      return <span key={event.id} className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />;
                    })}
                  </div>
                </button>
              );
            })}
          </div>

          {loading && (
            <div className="px-4 py-2 text-[10px] text-slate-400 border-t border-slate-100">Refreshing this month…</div>
          )}
        </section>

        <aside className="rounded-2xl border border-slate-200 bg-white p-5 h-fit">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Selected day</div>
          <h2 className="mt-1 text-base font-bold text-[color:rgb(var(--tw-ink-900))]">{dateLabel(selected)}</h2>
          <div className="mt-1 text-[11px] text-slate-500">
            {selectedEvents.length === 0
              ? 'No scheduled activity.'
              : `${selectedEvents.length} item(s) in your batches.`}
          </div>

          <div className="mt-4 space-y-3">
            {selectedEvents.map((event) => {
              const meta = TYPE_META[event.type] || TYPE_META.class;
              const Icon = meta.icon;
              return (
                <article key={event.id} className="rounded-xl border border-slate-200 p-3">
                  <div className="flex items-start gap-2.5">
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${meta.panel}`}>
                      <Icon className="w-4 h-4" />
                    </span>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 leading-snug">{event.title}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{event.subtitle || meta.label}</div>
                    </div>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {timeLabel(event.start)}
                      {event.end && event.end !== event.start ? ` – ${timeLabel(event.end)}` : ''}
                    </span>
                    {event.meta?.meetingPlatform && <span>{event.meta.meetingPlatform}</span>}
                    {event.meta?.totalMarks ? <span>{event.meta.totalMarks} marks</span> : null}
                    {event.meta?.submitted ? <span className="text-emerald-600 font-semibold">Submitted</span> : null}
                    {event.meta?.status ? <span>{event.meta.status}</span> : null}
                  </div>

                  {event.link && (
                    <Link
                      to={event.link}
                      className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-[rgb(var(--tw-blue-700))] hover:underline"
                    >
                      Open <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                </article>
              );
            })}
          </div>

          {!loading && events.length === 0 && !error && (
            <div className="mt-4 rounded-xl border border-dashed border-slate-200 p-4 text-center">
              <CalendarDays className="w-6 h-6 mx-auto text-slate-300" />
              <p className="mt-2 text-[11px] text-slate-500">
                No events in this view. Admin-created classes, quizzes and assignments appear automatically.
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
