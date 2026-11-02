import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  ExternalLink,
  FileText,
  MonitorPlay,
  Play,
  PlayCircle,
  Radio,
  RefreshCw,
  ShieldCheck,
  User,
  Video,
  XCircle,
} from 'lucide-react';
import { resolveVideoSource } from '../lib/videoEmbed';

const LIVE_CHIP = 'bg-red-500/15 text-red-200 border-red-400/40';
const RECORDING_CHIP = 'bg-white/10 text-blue-100 border-white/25';

const fmtDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? { day: '—', month: '—', full: '—' }
    : {
        day: date.toLocaleDateString(undefined, { day: '2-digit' }),
        month: date.toLocaleDateString(undefined, { month: 'short' }),
        full: date.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' }),
        short: date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
      };
};

const fmtTime = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
};

/** "6h 12m" / "3m" — enough precision to tell a student whether to wait. */
const countdown = (target, now) => {
  const diff = new Date(target).getTime() - now;
  if (!Number.isFinite(diff) || diff <= 0) return '';
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  return `${Math.max(1, minutes)}m`;
};

/**
 * A YouTube embed shows YouTube's own poster, logo and "Watch on YouTube"
 * button before playback, which made the classroom look like an embedded
 * YouTube page. For recordings we paint our own poster with a normal play
 * button and only mount the iframe (with autoplay) after the student presses it.
 */
function StagePlayer({ item, media, clickToPlay = false }) {
  const [started, setStarted] = useState(!clickToPlay);

  useEffect(() => {
    setStarted(!clickToPlay);
  }, [clickToPlay, media?.src]);

  if (media?.kind === 'iframe') {
    if (clickToPlay && !started) {
      return (
        <button
          type="button"
          onClick={() => setStarted(true)}
          className="group absolute inset-0 flex flex-col items-center justify-center gap-4 overflow-hidden text-center"
          aria-label={`Play ${item.title}`}
        >
          {item.thumbnail ? (
            <img src={item.thumbnail} alt="" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <span
              className="absolute inset-0"
              style={{
                background:
                  'radial-gradient(circle at 50% 35%, rgba(37,99,235,0.45) 0%, rgba(15,23,42,0.96) 58%, #020617 100%)',
              }}
            />
          )}
          <span className="absolute inset-0 bg-slate-950/40" />
          <span className="relative grid h-16 w-16 place-items-center rounded-full bg-white text-[rgb(var(--tw-ink-900))] shadow-2xl transition-transform group-hover:scale-105 sm:h-20 sm:w-20">
            <Play className="h-8 w-8 fill-current sm:h-10 sm:w-10" />
          </span>
          <span className="relative px-6">
            <span className="block text-sm font-black text-white sm:text-base">{item.title}</span>
            <span className="mt-1 block text-[11px] font-semibold text-blue-100/80">Play class recording</span>
          </span>
        </button>
      );
    }

    const src =
      clickToPlay && started
        ? `${media.src}${media.src.includes('?') ? '&' : '?'}autoplay=1`
        : media.src;

    return (
      <iframe
        key={src}
        src={src}
        title={`${item.title} — ${media.provider} player`}
        className="absolute inset-0 h-full w-full border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen; camera; microphone; display-capture"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
      />
    );
  }

  if (media?.kind === 'video') {
    return (
      <video
        key={media.src}
        src={media.src}
        poster={item.thumbnail || undefined}
        controls
        playsInline
        preload="metadata"
        className="absolute inset-0 h-full w-full bg-black object-contain"
      >
        Your browser cannot play this recording. Ask your advisor for a copy.
      </video>
    );
  }

  return null;
}

export default function ClassroomRoom() {
  const { classId } = useParams();
  const [item, setItem] = useState(null);
  const [batchClasses, setBatchClasses] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [now, setNow] = useState(() => Date.now());

  const load = useCallback(
    async ({ quiet = false } = {}) => {
      if (!quiet) setLoading(true);
      try {
        const [detail, list, library] = await Promise.all([
          axios.get(`/api/lms/classes/${classId}`),
          axios.get('/api/lms/classes').catch(() => ({ data: {} })),
          // Notes/resources published in LMS → Batch Workspace → Resources.
          // They belong to the batch, so the classroom must surface them next
          // to the recording instead of leaving them stranded in the API.
          axios.get('/api/lms/resources').catch(() => ({ data: {} })),
        ]);
        setItem(detail.data?.class || null);
        setBatchClasses(list.data?.classes || []);
        setResources(library.data?.resources || []);
        setError('');
      } catch (err) {
        if (quiet) return;
        const status = err.response?.status;
        setError(
          status === 403
            ? 'This class belongs to a batch you are not enrolled in.'
            : err.response?.data?.message || 'This class could not be loaded.'
        );
        setItem(null);
      } finally {
        if (!quiet) setLoading(false);
      }
    },
    [classId]
  );

  useEffect(() => {
    load();
    window.scrollTo(0, 0);
  }, [load]);

  // The clock drives the countdown and re-checks the window, so a student who
  // leaves the room open sees "live" the moment the instructor opens the room.
  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    if (!item || ['ended', 'cancelled'].includes(item.phase)) return undefined;
    const refresh = setInterval(() => load({ quiet: true }), 60000);
    return () => clearInterval(refresh);
  }, [item?.phase, load]);

  const stage = useMemo(() => {
    if (!item) return { mode: 'none' };

    if (item.canJoin && item.joinUrl) {
      const live = resolveVideoSource(item.joinUrl);
      return {
        mode: 'live',
        provider: live.provider,
        media: ['iframe', 'video'].includes(live.kind) ? live : null,
        joinUrl: item.joinUrl,
      };
    }

    if (item.recordingUrl) {
      const recording = resolveVideoSource(item.recordingUrl);
      return {
        mode: 'recording',
        provider: recording.provider,
        media: ['iframe', 'video'].includes(recording.kind) ? recording : null,
        joinUrl: recording.kind === 'external' ? recording.src : '',
      };
    }

    return { mode: 'pending' };
  }, [item]);

  const siblings = useMemo(() => {
    if (!item?.batch?._id) return { next: [], recent: [] };
    const sameBatch = batchClasses.filter(
      (row) => String(row.batch?._id) === String(item.batch._id) && String(row._id) !== String(item._id)
    );
    const next = sameBatch
      .filter((row) => ['live', 'upcoming', 'scheduled'].includes(row.phase))
      .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt))
      .slice(0, 3);
    const recent = sameBatch
      .filter((row) => row.phase === 'ended' && row.hasRecording)
      .sort((a, b) => new Date(b.startsAt) - new Date(a.startsAt))
      .slice(0, 3);
    return { next, recent };
  }, [batchClasses, item]);

  const classNotes = useMemo(() => {
    if (!item) return [];
    const materials = (item.materials || []).map((row) => ({
      title: row.title,
      url: row.url,
      meta: [row.fileType, row.fileSize].filter(Boolean).join(' · '),
      source: 'Class material',
    }));
    const batchNotes = resources
      .filter((row) => String(row.batch?._id || '') === String(item.batch?._id || ''))
      .map((row) => ({
        title: row.title,
        url: row.url,
        meta: [row.category, row.fileType].filter(Boolean).join(' · '),
        source: 'Batch notes',
      }));
    return [...materials, ...batchNotes];
  }, [item, resources]);

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-5">
        <div className="h-10 w-64 rounded-xl bg-white border border-slate-200 animate-pulse" />
        <div className="aspect-video w-full rounded-3xl bg-slate-900/90 animate-pulse" />
        <div className="h-28 rounded-2xl bg-white border border-slate-200 animate-pulse" />
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="p-6 sm:p-10 max-w-2xl mx-auto w-full">
        <div className="rounded-2xl bg-white border border-slate-200 p-8 text-center shadow-xs">
          <ShieldCheck className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h1 className="text-base font-bold text-[color:rgb(var(--tw-ink-900))]">Classroom unavailable</h1>
          <p className="text-xs text-slate-500 mt-1.5">{error || 'This class could not be loaded.'}</p>
          <Link
            to="/student/classes"
            className="mt-5 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[rgb(var(--tw-ink-900))] text-white text-xs font-bold"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to My Classes
          </Link>
        </div>
      </div>
    );
  }

  const date = fmtDate(item.startsAt);
  const isLive = stage.mode === 'live';
  const startsIn = countdown(item.startsAt, now);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-5">
      {/* Breadcrumb — the batch is always visible, so a student never wonders
          which cohort this room belongs to. */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-500">
        <Link
          to="/student/classes"
          className="inline-flex items-center gap-1 font-bold text-slate-600 hover:text-[color:rgb(var(--tw-blue-700))]"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> My Classes
        </Link>
        <span className="text-slate-300">/</span>
        <span className="font-semibold text-slate-600">{item.course?.title || 'Course'}</span>
        <span className="text-slate-300">/</span>
        <span className="truncate">{item.batch?.name || item.batch?.batchCode || 'Batch'}</span>
      </div>

      {/* ── The classroom stage ─────────────────────────────────────────── */}
      <section className="overflow-hidden rounded-3xl border border-slate-800 bg-[rgb(var(--tw-ink-900))] shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${
                isLive ? LIVE_CHIP : RECORDING_CHIP
              }`}
            >
              {isLive ? <Radio className="w-3 h-3 animate-pulse" /> : <PlayCircle className="w-3 h-3" />}
              {isLive ? 'Live class' : stage.mode === 'recording' ? 'Class recording' : 'Classroom'}
            </span>
            {stage.provider && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-100/70">
                <MonitorPlay className="w-3 h-3" />
                {stage.media
                  ? 'plays here in the portal'
                  : stage.mode === 'live'
                    ? 'meeting opens in its own window'
                    : `hosted on ${stage.provider}`}
              </span>
            )}
          </div>
          <div className="text-[10px] font-semibold text-blue-100/70">
            {date.full} · {fmtTime(item.startsAt)}–{fmtTime(item.endsAt)} {item.timezone}
          </div>
        </div>

        <div className="relative aspect-video w-full bg-black">
          {stage.media ? (
            <StagePlayer
              item={item}
              media={stage.media}
              clickToPlay={stage.mode === 'recording' && stage.provider === 'YouTube'}
            />
          ) : stage.mode === 'live' ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
              <span className="relative flex h-16 w-16 items-center justify-center">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500/30" />
                <span className="relative inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-500/20 ring-2 ring-red-400/60">
                  <Radio className="h-6 w-6 text-red-300" />
                </span>
              </span>
              <div>
                <h2 className="font-heading text-lg font-black text-white sm:text-xl">Your live room is open</h2>
                <p className="mx-auto mt-1 max-w-md text-xs text-blue-100/80">
                  {stage.provider || 'The meeting'} opens in its own window — the recording of this class will play
                  right here in the portal once the instructor publishes it.
                </p>
              </div>
              <a
                href={stage.joinUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-2.5 text-xs font-bold text-[rgb(var(--tw-ink-900))] hover:bg-blue-50"
              >
                <Video className="h-4 w-4" /> Enter live room
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          ) : stage.mode === 'recording' ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
              <PlayCircle className="h-12 w-12 text-slate-500" />
              <p className="max-w-sm text-xs text-blue-100/80">
                The recording is hosted on {stage.provider || 'an external site'} and cannot be played inside the
                portal. Open it in a new window to watch this class.
              </p>
              <a
                href={stage.joinUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-xs font-bold text-[rgb(var(--tw-ink-900))]"
              >
                <PlayCircle className="h-4 w-4" /> Open recording <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          ) : item.phase === 'cancelled' ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
              <XCircle className="h-12 w-12 text-red-300/80" />
              <h2 className="font-heading text-lg font-black text-white">This class was cancelled</h2>
              <p className="max-w-sm text-xs text-blue-100/80">
                Your instructor will reschedule it. The new session appears in My Classes.
              </p>
            </div>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-white/10 ring-1 ring-white/20">
                <MonitorPlay className="h-7 w-7 text-blue-100" />
              </div>
              <h2 className="font-heading text-lg font-black text-white sm:text-xl">
                {startsIn ? `Class starts in ${startsIn}` : item.phase === 'ended' ? 'Class finished' : 'Waiting for the instructor'}
              </h2>
              <p className="max-w-md text-xs text-blue-100/80">
                {item.phase === 'ended'
                  ? 'The recording has not been published yet. It will appear here automatically once your instructor uploads it.'
                  : 'This room opens 15 minutes before the class. The live session and the recording play here — you will not be sent to YouTube.'}
              </p>
            </div>
          )}

          {isLive && stage.media && (
            <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-red-600/90 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" /> Live
            </span>
          )}
        </div>

        <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="min-w-0">
            <h1 className="font-heading text-lg font-black leading-snug text-white sm:text-xl">{item.title}</h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-blue-100/75">
              {item.instructor && (
                <span className="inline-flex items-center gap-1">
                  <User className="h-3.5 w-3.5" /> {item.instructor}
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5" /> {date.short}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> {fmtTime(item.startsAt)}–{fmtTime(item.endsAt)}
              </span>
              <span className="inline-flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5" /> {item.batch?.name || item.batch?.batchCode}
              </span>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {classNotes.length > 0 && (
              <a
                href="#materials"
                className="inline-flex items-center gap-1.5 rounded-full border border-white/25 px-3.5 py-2 text-[11px] font-bold text-white hover:bg-white/10"
              >
                <FileText className="h-3.5 w-3.5" /> {classNotes.length} notes
              </a>
            )}
            <button
              type="button"
              onClick={() => load({ quiet: true })}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/25 px-3.5 py-2 text-[11px] font-bold text-white hover:bg-white/10"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-8">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <span>Session {item.sessionNumber}</span>
              <span>·</span>
              <span>{item.deliveryMode}</span>
              {item.meetingPlatform && item.meetingPlatform !== 'None' && (
                <>
                  <span>·</span>
                  <span>{item.meetingPlatform}</span>
                </>
              )}
            </div>
            <h2 className="mt-2 font-heading text-base font-black text-[color:rgb(var(--tw-ink-900))]">
              About this class
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
              {item.description || 'Your instructor has not added a description for this session yet.'}
            </p>
            <p className="mt-3 text-[11px] text-slate-400">
              Plays inside your student portal. Seat and batch checks run on the server on every open.
            </p>
          </div>

          {classNotes.length > 0 && (
            <div id="materials" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <h2 className="font-heading text-base font-black text-[color:rgb(var(--tw-ink-900))]">
                Class notes & resources
              </h2>
              <p className="mt-1 text-[11px] text-slate-500">
                Notes your instructor uploaded for this class and your batch. They open beside the recording.
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {classNotes.map((note, index) => (
                  <a
                    key={`${note.url}-${index}`}
                    href={note.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-700 hover:border-slate-300"
                  >
                    <FileText className="h-4 w-4 shrink-0 text-[color:rgb(var(--tw-blue-700))]" />
                    <span className="min-w-0">
                      <span className="block truncate">{note.title}</span>
                      <span className="block truncate text-[10px] font-normal text-slate-400">
                        {note.meta || note.source}
                      </span>
                    </span>
                    <ExternalLink className="ml-auto h-3 w-3 shrink-0 text-slate-400" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        <aside className="space-y-4 lg:col-span-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <h2 className="font-heading text-sm font-black text-[color:rgb(var(--tw-ink-900))]">
              Up next in {item.batch?.name || item.batch?.batchCode}
            </h2>
            {siblings.next.length === 0 ? (
              <p className="mt-2 text-[11px] text-slate-500">No further classes scheduled for this batch yet.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {siblings.next.map((row) => (
                  <li key={row._id}>
                    <Link
                      to={`/student/classes/${row._id}`}
                      className="block rounded-xl border border-slate-200 px-3 py-2.5 hover:border-[rgb(var(--tw-blue-700)/40%)] hover:bg-blue-50/40"
                    >
                      <div className="text-xs font-bold text-[color:rgb(var(--tw-ink-900))]">{row.title}</div>
                      <div className="mt-0.5 text-[10px] text-slate-500">
                        {fmtDate(row.startsAt).short} · {fmtTime(row.startsAt)}–{fmtTime(row.endsAt)}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {siblings.recent.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <h2 className="font-heading text-sm font-black text-[color:rgb(var(--tw-ink-900))]">Recent recordings</h2>
              <ul className="mt-3 space-y-2">
                {siblings.recent.map((row) => (
                  <li key={row._id}>
                    <Link
                      to={`/student/classes/${row._id}`}
                      className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 hover:border-slate-300"
                    >
                      <PlayCircle className="h-4 w-4 shrink-0 text-[color:rgb(var(--tw-blue-700))]" />
                      <span className="min-w-0">
                        <span className="block truncate text-xs font-bold text-[color:rgb(var(--tw-ink-900))]">
                          {row.title}
                        </span>
                        <span className="block text-[10px] text-slate-500">{fmtDate(row.startsAt).short}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
