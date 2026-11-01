import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Bell,
  RefreshCw,
  CheckCheck,
  Video,
  ListChecks,
  ClipboardList,
  BarChart3,
  Briefcase,
  Award,
  Megaphone,
  GraduationCap,
  Inbox,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';

const TYPE_META = {
  Announcement: { icon: Megaphone, tone: 'bg-amber-50 text-amber-700 border-amber-100' },
  Class: { icon: Video, tone: 'bg-blue-50 text-blue-700 border-blue-100' },
  Quiz: { icon: ListChecks, tone: 'bg-violet-50 text-violet-700 border-violet-100' },
  Assignment: { icon: ClipboardList, tone: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
  Grade: { icon: BarChart3, tone: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  Job: { icon: Briefcase, tone: 'bg-cyan-50 text-cyan-700 border-cyan-100' },
  Certificate: { icon: Award, tone: 'bg-yellow-50 text-yellow-700 border-yellow-100' },
  Enrollment: { icon: GraduationCap, tone: 'bg-slate-100 text-slate-700 border-slate-200' },
};

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread' },
  { id: 'Announcement', label: 'Notices' },
  { id: 'Class', label: 'Classes' },
  { id: 'Quiz', label: 'Quizzes' },
  { id: 'Assignment', label: 'Assignments' },
  { id: 'Grade', label: 'Grades' },
  { id: 'Job', label: 'Jobs' },
  { id: 'Certificate', label: 'Certificates' },
];

const relativeTime = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const diff = Date.now() - date.getTime();
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
};

const broadcastCount = (count) => {
  window.dispatchEvent(new CustomEvent('lms:notification-count', { detail: count }));
};

export default function Notifications() {
  const navigate = useNavigate();
  const [data, setData] = useState({ notifications: [], unreadCount: 0, summary: {} });
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');
  const [markingAll, setMarkingAll] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await axios.get('/api/lms/notifications');
        if (!alive) return;
        const payload = {
          notifications: res.data?.notifications || [],
          unreadCount: res.data?.unreadCount || 0,
          summary: res.data?.summary || {},
        };
        setData(payload);
        broadcastCount(payload.unreadCount);
      } catch (err) {
        if (alive) setError(err.response?.data?.message || err.message || 'Could not load your notifications.');
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    return () => {
      alive = false;
    };
  }, [reloadToken]);

  const visible = useMemo(() => {
    if (filter === 'all') return data.notifications;
    if (filter === 'unread') return data.notifications.filter((row) => !row.read);
    return data.notifications.filter((row) => row.type === filter);
  }, [data.notifications, filter]);

  const unread = data.unreadCount || 0;

  const markRead = async (notification) => {
    if (!notification || notification.read) return;
    setBusyId(notification._id);
    try {
      const res = await axios.patch(`/api/lms/notifications/${notification._id}/read`);
      const nextUnread = res.data?.unreadCount ?? Math.max(0, unread - 1);
      setData((current) => ({
        ...current,
        unreadCount: nextUnread,
        notifications: current.notifications.map((row) =>
          row._id === notification._id ? { ...row, read: true, readAt: new Date().toISOString() } : row
        ),
      }));
      broadcastCount(nextUnread);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not mark this notification as read.');
    } finally {
      setBusyId('');
    }
  };

  const openNotification = async (notification) => {
    await markRead(notification);
    if (notification?.link) navigate(notification.link);
  };

  const markAllRead = async () => {
    setMarkingAll(true);
    setError('');
    try {
      await axios.patch('/api/lms/notifications/read-all');
      setData((current) => ({
        ...current,
        unreadCount: 0,
        notifications: current.notifications.map((row) => ({
          ...row,
          read: true,
          readAt: row.readAt || new Date().toISOString(),
        })),
      }));
      broadcastCount(0);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not mark all notifications as read.');
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <div className="p-6 sm:p-8 max-w-5xl mx-auto w-full space-y-6">
      <div className="p-6 sm:p-8 rounded-3xl bg-[rgb(var(--tw-ink-900))] text-white">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[11px] font-bold uppercase tracking-wider mb-3">
          <Bell className="w-3.5 h-3.5" /> Student inbox
        </div>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-heading font-black text-white">Notifications</h1>
            <p className="text-xs sm:text-sm text-slate-200 mt-2 max-w-2xl">
              Real updates from your batches: published classes, new quizzes and assignments, grades, career roles and
              certificates. Read state is saved to your account.
            </p>
          </div>
          <div className="rounded-2xl bg-white/10 border border-white/15 px-4 py-3 min-w-[110px] text-center">
            <div className="text-2xl font-black text-white">{unread}</div>
            <div className="text-[10px] uppercase tracking-wider text-blue-100/80">Unread</div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          {[
            { label: 'Total', value: data.summary?.total || data.notifications.length },
            { label: 'Unread', value: unread },
            { label: 'Classes', value: (data.summary?.Class || 0) + (data.summary?.Quiz || 0) },
            { label: 'Grades', value: (data.summary?.Grade || 0) + (data.summary?.Certificate || 0) },
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
              {item.id === 'unread' && unread > 0 ? (
                <span className="ml-1.5 inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-[rgb(var(--tw-gold-500))] text-[9px] text-[rgb(var(--tw-ink-900))]">
                  {unread}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setReloadToken((value) => value + 1)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-600 hover:border-slate-300"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button
            type="button"
            onClick={markAllRead}
            disabled={unread === 0 || markingAll}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-600 hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <CheckCheck className="w-3.5 h-3.5" /> {markingAll ? 'Marking…' : 'Mark all read'}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((row) => (
            <div key={row} className="h-24 rounded-2xl bg-white border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
          <Inbox className="w-8 h-8 mx-auto text-slate-300" />
          <div className="mt-3 text-sm font-bold text-slate-800">
            {filter === 'unread' ? 'You are all caught up' : 'Nothing here yet'}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {filter === 'unread'
              ? 'Every notification in your inbox has been read.'
              : 'Updates from your enrolled batches will appear here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((notification) => {
            const meta = TYPE_META[notification.type] || TYPE_META.Announcement;
            const Icon = meta.icon;
            return (
              <article
                key={notification._id}
                className={`rounded-2xl border bg-white p-4 sm:p-5 transition-colors ${
                  notification.read ? 'border-slate-200' : 'border-blue-200 bg-blue-50/30'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${meta.tone}`}>
                    <Icon className="w-5 h-5" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <h2 className="text-sm font-bold text-[color:rgb(var(--tw-ink-900))] leading-snug">
                          {notification.title}
                        </h2>
                        {!notification.read && <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" aria-label="Unread" />}
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0">{relativeTime(notification.eventAt)}</span>
                    </div>

                    {notification.body && (
                      <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">{notification.body}</p>
                    )}

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase tracking-wider ${meta.tone}`}>
                        {notification.type}
                      </span>
                      <button
                        type="button"
                        onClick={() => openNotification(notification)}
                        disabled={busyId === notification._id}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-[rgb(var(--tw-blue-700))] hover:underline disabled:opacity-50"
                      >
                        Open <ArrowRight className="w-3 h-3" />
                      </button>
                      {!notification.read && (
                        <button
                          type="button"
                          onClick={() => markRead(notification)}
                          disabled={busyId === notification._id}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-700 disabled:opacity-50"
                        >
                          <CheckCheck className="w-3 h-3" /> Mark read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
