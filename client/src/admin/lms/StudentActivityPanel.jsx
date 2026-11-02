import React, { useEffect, useState } from 'react';
import {
  Activity,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Clock,
  GraduationCap,
  KeyRound,
  LogIn,
  LogOut,
  MonitorPlay,
  RefreshCw,
  UserCog,
} from 'lucide-react';
import api from '../../lib/api';
import StudentAvatar from '../../lms/StudentAvatar';
import { Badge, Loading, ErrorNote, Modal, btnGhost, btnPrimary } from './ui';

const dateTime = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const timeOnly = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
};

const duration = (minutes) => {
  const value = Number(minutes) || 0;
  if (value < 1) return '< 1 min';
  const hours = Math.floor(value / 60);
  const rest = value % 60;
  return hours ? `${hours}h ${rest ? `${rest}m` : ''}`.trim() : `${value} min`;
};

const ACTIVITY_ICON = {
  login: LogIn,
  logout: LogOut,
  lesson_opened: BookOpen,
  lesson_completed: CheckCircle2,
  class_opened: MonitorPlay,
  quiz_submitted: ClipboardList,
  assignment_submitted: ClipboardList,
  enrolled: GraduationCap,
  password_set: KeyRound,
  status_changed: UserCog,
  access_changed: UserCog,
  transferred: GraduationCap,
};

/**
 * Admin view of one student's full access history: profile, batch, every
 * login/logout with duration, and the timeline of what they did in the portal.
 */
export default function StudentActivityPanel({ open, studentId, onClose, onSetPassword }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    if (!studentId) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/admin/lms/students/${studentId}/activity`);
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Could not load this student’s activity.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && studentId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, studentId]);

  if (!open) return null;

  const student = data?.student;
  const stats = data?.stats || {};
  const sessions = data?.sessions || [];
  const activities = data?.activities || [];

  return (
    <Modal
      open={open}
      wide
      title={student ? student.name : 'Student access details'}
      subtitle="Login history, live status and everything this student has done in the portal."
      onClose={onClose}
      footer={
        <>
          <button type="button" className={btnGhost} onClick={load} disabled={loading}>
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button type="button" className={btnPrimary} onClick={onClose}>
            Close
          </button>
        </>
      }
    >
      <ErrorNote>{error}</ErrorNote>
      {loading && !data ? (
        <Loading label="Loading access history…" />
      ) : !data ? (
        <p className="text-xs text-slate-400">No activity recorded yet.</p>
      ) : (
        <div className="space-y-5">
          <div className="flex flex-wrap items-start gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
            <StudentAvatar
              src={student.avatar}
              name={student.name}
              className="h-14 w-14"
              textClassName="text-base"
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-bold text-white">{student.name}</h3>
                <Badge tone={student.isActive ? 'emerald' : 'rose'}>
                  {student.isActive ? 'Account active' : 'Account suspended'}
                </Badge>
                <Badge tone={stats.activeNow ? 'emerald' : 'slate'}>
                  {stats.activeNow ? 'Online now' : 'Offline'}
                </Badge>
              </div>
              <p className="mt-1 text-[11px] text-slate-400">{student.email}</p>
              <p className="mt-0.5 text-[11px] text-slate-400">
                {student.phone || 'No phone'} · ID {student.enrollmentNumber || '—'} · Joined{' '}
                {dateTime(student.createdAt)}
              </p>
              <p className="mt-1 text-[11px] text-blue-200">
                Batch: {student.batch?.name || student.batch?.batchCode || 'Not assigned'}
                {student.batch?.timing ? ` · ${student.batch.timing}` : ''}
              </p>
            </div>
            {onSetPassword && (
              <button type="button" className={btnGhost} onClick={() => onSetPassword(student)}>
                <KeyRound className="h-3.5 w-3.5" /> Change password
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Last login', value: dateTime(stats.lastLoginAt), icon: LogIn },
              { label: 'Last logout', value: dateTime(stats.lastLogoutAt), icon: LogOut },
              { label: 'Last seen', value: stats.lastSeenAt ? timeOnly(stats.lastSeenAt) : '—', icon: Activity },
              { label: 'Total sign-ins', value: stats.totalLogins ?? 0, icon: KeyRound },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <Icon className="h-3 w-3" /> {item.label}
                  </div>
                  <div className="mt-1.5 text-[11px] font-semibold text-white">{item.value}</div>
                </div>
              );
            })}
          </div>

          <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3">
            <div className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <GraduationCap className="h-3 w-3" /> Course access
            </div>
            {data.courses.length === 0 ? (
              <p className="text-[11px] text-slate-500">No course enrollment on record.</p>
            ) : (
              <div className="space-y-1.5">
                {data.courses.map((row) => (
                  <div key={row._id} className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                    <span className="text-slate-200">
                      {row.course?.title || 'Course'}{' '}
                      <span className="text-slate-500">
                        · {row.batch?.name || row.batch?.batchCode || 'No batch'}
                      </span>
                    </span>
                    <span className="flex items-center gap-2 text-slate-400">
                      <Badge tone={row.status === 'Active' ? 'emerald' : 'slate'}>{row.status}</Badge>
                      {row.accessUntil ? `Until ${new Date(row.accessUntil).toLocaleDateString()}` : 'No expiry'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h4 className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-300">
              <Clock className="h-3.5 w-3.5 text-blue-300" /> Login / logout history
              <span className="ml-auto text-[10px] font-normal text-slate-500">
                {duration(stats.totalMinutes)} total on portal
              </span>
            </h4>
            {sessions.length === 0 ? (
              <p className="rounded-xl border border-white/[0.08] p-3 text-[11px] text-slate-500">
                This student has not signed in yet.
              </p>
            ) : (
              <div className="max-h-56 overflow-y-auto rounded-xl border border-white/[0.08]">
                <table className="w-full text-left">
                  <thead className="sticky top-0 bg-[rgb(var(--tw-ink-900))] text-[9px] uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="px-3 py-2">Login</th>
                      <th className="px-3 py-2">Logout</th>
                      <th className="px-3 py-2">Duration</th>
                      <th className="px-3 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {sessions.map((row) => (
                      <tr key={row._id}>
                        <td className="px-3 py-2 text-[10px] text-slate-300">{dateTime(row.loginAt)}</td>
                        <td className="px-3 py-2 text-[10px] text-slate-300">
                          {row.logoutAt ? dateTime(row.logoutAt) : '—'}
                        </td>
                        <td className="px-3 py-2 text-[10px] text-slate-400">{duration(row.durationMinutes)}</td>
                        <td className="px-3 py-2">
                          <Badge
                            tone={
                              row.status === 'Active'
                                ? 'emerald'
                                : row.status === 'Inactive'
                                  ? 'amber'
                                  : 'slate'
                            }
                          >
                            {row.status === 'Active'
                              ? 'Active'
                              : row.status === 'Inactive'
                                ? 'Inactive'
                                : row.endedReason || 'Ended'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div>
            <h4 className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-300">
              <Activity className="h-3.5 w-3.5 text-blue-300" /> Activity timeline
            </h4>
            {activities.length === 0 ? (
              <p className="rounded-xl border border-white/[0.08] p-3 text-[11px] text-slate-500">
                Nothing recorded yet.
              </p>
            ) : (
              <ol className="max-h-80 space-y-1 overflow-y-auto pr-1">
                {activities.map((row) => {
                  const Icon = ACTIVITY_ICON[row.type] || Activity;
                  return (
                    <li key={row._id} className="flex items-start gap-2.5 rounded-lg px-2 py-2 hover:bg-white/[0.03]">
                      <span className="mt-0.5 rounded-lg bg-blue-500/10 p-1.5 text-blue-300">
                        <Icon className="h-3 w-3" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] font-semibold text-slate-200">{row.title}</div>
                        {row.detail && <div className="text-[10px] text-slate-400">{row.detail}</div>}
                        {row.actorName && (
                          <div className="text-[10px] text-slate-500">By {row.actorName}</div>
                        )}
                      </div>
                      <time className="shrink-0 text-[10px] text-slate-500">{dateTime(row.at)}</time>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
