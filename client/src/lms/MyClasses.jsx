import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  Video,
  CalendarDays,
  Clock,
  ExternalLink,
  FileText,
  RefreshCw,
  Radio,
  PlayCircle,
  XCircle,
  User,
} from 'lucide-react';

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'live', label: 'Live now' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
];

const phaseMeta = {
  live: { label: 'Live now', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  upcoming: { label: 'Upcoming', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  scheduled: { label: 'Scheduled', className: 'bg-slate-50 text-slate-600 border-slate-200' },
  ended: { label: 'Completed', className: 'bg-slate-100 text-slate-600 border-slate-200' },
  cancelled: { label: 'Cancelled', className: 'bg-red-50 text-red-700 border-red-200' },
  draft: { label: 'Draft', className: 'bg-slate-50 text-slate-500 border-slate-200' },
};

const fmtDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? { day: '—', month: '—', full: '—' }
    : {
        day: date.toLocaleDateString(undefined, { day: '2-digit' }),
        month: date.toLocaleDateString(undefined, { month: 'short' }),
        full: date.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' }),
      };
};

const fmtTime = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
};

export default function MyClasses() {
  const [classes, setClasses] = useState([]);
  const [summary, setSummary] = useState({ total: 0, upcoming: 0, live: 0, completed: 0, cancelled: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('all');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get('/api/lms/classes');
      setClasses(res.data?.classes || []);
      setSummary(res.data?.summary || { total: 0, upcoming: 0, live: 0, completed: 0, cancelled: 0 });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Could not load your classes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const visible = useMemo(() => {
    if (tab === 'all') return classes;
    if (tab === 'completed') return classes.filter((item) => item.phase === 'ended');
    return classes.filter((item) => item.phase === tab);
  }, [classes, tab]);

  return (
    <div className="p-6 sm:p-8 max-w-6xl mx-auto w-full space-y-6">
      <div className="p-6 sm:p-8 rounded-3xl bg-[rgb(var(--tw-ink-900))] text-white">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[11px] font-bold uppercase tracking-wider mb-3">
          <Video className="w-3.5 h-3.5" /> My Classroom
        </div>
        <h1 className="text-2xl sm:text-3xl font-heading font-black text-white">My Classes</h1>
        <p className="text-xs sm:text-sm text-slate-200 mt-2 max-w-2xl">
          Every live session, recording and handout for your batch. Meeting links unlock shortly before
          class starts and are visible only to enrolled students.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          {[
            { label: 'Total', value: summary.total },
            { label: 'Upcoming', value: summary.upcoming },
            { label: 'Live now', value: summary.live },
            { label: 'Completed', value: summary.completed },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl bg-white/10 border border-white/15 px-4 py-3">
              <div className="text-[10px] uppercase tracking-wider text-blue-100/80">{item.label}</div>
              <div className="text-xl font-black text-white mt-0.5">{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {TABS.map((item) => (
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

      {error && (
        <div className="px-4 py-3 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((row) => (
            <div key={row} className="h-32 rounded-2xl bg-white border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="p-10 rounded-2xl bg-white border border-slate-200 text-center">
          <CalendarDays className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h2 className="text-base font-bold text-[color:rgb(var(--tw-ink-900))]">
            {classes.length === 0 ? 'No classes scheduled yet' : 'Nothing in this tab'}
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {classes.length === 0
              ? 'Your instructor has not scheduled a session for your batch yet. It will appear here as soon as it is published.'
              : 'Switch to another tab to see the rest of your classes.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((item) => {
            const date = fmtDate(item.startsAt);
            const meta = phaseMeta[item.phase] || phaseMeta.scheduled;
            return (
              <div
                key={item._id}
                className="rounded-2xl bg-white border border-slate-200 shadow-xs p-4 sm:p-5 flex flex-col sm:flex-row gap-4"
              >
                <div className="w-16 shrink-0 rounded-xl bg-[rgb(var(--tw-ink-900))] text-white text-center py-2">
                  <div className="text-[10px] uppercase tracking-wider text-blue-200">{date.month}</div>
                  <div className="text-xl font-black leading-tight">{date.day}</div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-sm font-bold text-[color:rgb(var(--tw-ink-900))]">{item.title}</h2>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold ${meta.className}`}>
                      {item.phase === 'live' && <Radio className="w-3 h-3" />}
                      {item.phase === 'cancelled' && <XCircle className="w-3 h-3" />}
                      {meta.label}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-500 mt-1">
                    {item.course?.title} · {item.batch?.name || item.batch?.batchCode}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-600 mt-2">
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="w-3.5 h-3.5" /> {date.full}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {fmtTime(item.startsAt)}–{fmtTime(item.endsAt)} {item.timezone}
                    </span>
                    {item.instructor && (
                      <span className="inline-flex items-center gap-1">
                        <User className="w-3.5 h-3.5" /> {item.instructor}
                      </span>
                    )}
                  </div>

                  {item.description && <p className="text-xs text-slate-500 mt-2">{item.description}</p>}

                  {item.materials?.length > 0 && (
                    <div className="mt-3">
                      <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1.5">Material</div>
                      <div className="flex flex-wrap gap-2">
                        {item.materials.map((material, index) => (
                          <a
                            key={`${material.url}-${index}`}
                            href={material.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-[10px] font-semibold text-slate-700 hover:border-slate-300"
                          >
                            <FileText className="w-3 h-3" /> {material.title}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="shrink-0 flex sm:flex-col items-stretch justify-center gap-2">
                  {item.canJoin && item.joinUrl ? (
                    <a
                      href={item.joinUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[rgb(var(--tw-blue-700))] hover:bg-[rgb(var(--tw-blue-800))] text-white text-xs font-bold"
                    >
                      <Radio className="w-3.5 h-3.5" /> Join class
                    </a>
                  ) : item.recordingUrl ? (
                    <a
                      href={item.recordingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[rgb(var(--tw-ink-900))] hover:bg-black text-white text-xs font-bold"
                    >
                      <PlayCircle className="w-3.5 h-3.5" /> Recording
                    </a>
                  ) : (
                    <span className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-400 text-[11px] font-semibold">
                      <Clock className="w-3.5 h-3.5" />
                      {item.phase === 'cancelled' ? 'Cancelled' : 'Link opens soon'}
                    </span>
                  )}

                  {item.meetingPlatform && item.meetingPlatform !== 'None' && (
                    <span className="text-center text-[10px] text-slate-400">{item.meetingPlatform}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
        <ExternalLink className="w-3 h-3" />
        Only classes for your enrolled batch are shown. Contact your advisor if a session is missing.
      </div>
    </div>
  );
}
