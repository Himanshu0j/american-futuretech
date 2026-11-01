import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Trophy, RefreshCw, Medal, Users, AlertCircle, Star, TrendingUp } from 'lucide-react';

const fmtPercent = (value) => (value === null || value === undefined ? '—' : `${value}%`);

const rankTone = (rank) => {
  if (rank === 1) return 'bg-yellow-50 text-yellow-700 border-yellow-200';
  if (rank === 2) return 'bg-slate-100 text-slate-700 border-slate-200';
  if (rank === 3) return 'bg-orange-50 text-orange-700 border-orange-200';
  return 'bg-white text-slate-500 border-slate-200';
};

export default function Leaderboard() {
  const [data, setData] = useState({ batches: [] });
  const [activeBatchId, setActiveBatchId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await axios.get('/api/lms/leaderboard');
        if (!alive) return;
        const batches = res.data?.batches || [];
        setData({ batches });
        setActiveBatchId((current) => {
          if (current && batches.some((row) => row.batch._id === current)) return current;
          return batches[0]?.batch?._id || '';
        });
      } catch (err) {
        if (alive) setError(err.response?.data?.message || err.message || 'Could not load the leaderboard.');
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    return () => {
      alive = false;
    };
  }, [reloadToken]);

  const board = useMemo(
    () => data.batches.find((row) => row.batch._id === activeBatchId) || data.batches[0] || null,
    [data.batches, activeBatchId]
  );

  const entries = board?.entries || [];
  const podium = entries.slice(0, 3);
  const me = board?.myEntry;

  return (
    <div className="p-6 sm:p-8 max-w-6xl mx-auto w-full space-y-6">
      <div className="p-6 sm:p-8 rounded-3xl bg-[rgb(var(--tw-ink-900))] text-white">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[11px] font-bold uppercase tracking-wider mb-3">
          <Trophy className="w-3.5 h-3.5" /> Cohort ranking
        </div>
        <h1 className="text-2xl sm:text-3xl font-heading font-black text-white">Leaderboard</h1>
        <p className="text-xs sm:text-sm text-slate-200 mt-2 max-w-2xl">
          Ranked inside your own batch only. Scores combine your best quiz results, graded assignments and attendance —
          never another cohort's data.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          {[
            { label: 'Your rank', value: me?.rank ? `#${me.rank}` : '—' },
            { label: 'Participants', value: board?.participantCount ?? 0 },
            { label: 'Your score', value: me ? `${me.score}%` : '—' },
            { label: 'Badges', value: me?.badges ?? 0 },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl bg-white/10 border border-white/15 px-4 py-3">
              <div className="text-[10px] uppercase tracking-wider text-blue-100/80">{stat.label}</div>
              <div className="text-xl font-black text-white mt-0.5">{stat.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        {data.batches.length > 1 ? (
          <div className="flex flex-wrap gap-2">
            {data.batches.map((row) => (
              <button
                key={row.batch._id}
                type="button"
                onClick={() => setActiveBatchId(row.batch._id)}
                aria-pressed={row.batch._id === activeBatchId}
                className={`px-3.5 py-2 rounded-full text-[11px] font-bold border transition-colors ${
                  row.batch._id === activeBatchId
                    ? 'bg-[rgb(var(--tw-ink-900))] text-white border-[rgb(var(--tw-ink-900))]'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
              >
                {row.batch.name || row.batch.batchCode}
              </button>
            ))}
          </div>
        ) : (
          <div className="text-[11px] text-slate-500">
            {board ? `${board.batch.name || board.batch.batchCode} · ${board.batch.timing || ''}` : ''}
          </div>
        )}

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

      {loading ? (
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            {[1, 2, 3].map((row) => (
              <div key={row} className="h-36 rounded-2xl bg-white border border-slate-200 animate-pulse" />
            ))}
          </div>
          <div className="h-64 rounded-2xl bg-white border border-slate-200 animate-pulse" />
        </div>
      ) : !board || entries.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
          <Users className="w-8 h-8 mx-auto text-slate-300" />
          <div className="mt-3 text-sm font-bold text-slate-800">The board is empty</div>
          <p className="mt-1 text-xs text-slate-500">
            Rankings appear once you and your batchmates start submitting quizzes and assignments.
          </p>
        </div>
      ) : (
        <>
          {podium.length >= 3 && (
            <div className="grid gap-3 sm:grid-cols-3 items-end">
              {[podium[1], podium[0], podium[2]].map((entry) => (
                <div
                  key={entry.studentId}
                  className={`rounded-2xl border p-4 text-center ${
                    entry.rank === 1
                      ? 'bg-gradient-to-b from-yellow-50 to-white border-yellow-200 sm:pb-7'
                      : 'bg-white border-slate-200'
                  } ${entry.isMe ? 'ring-2 ring-[rgb(var(--tw-blue-700))]' : ''}`}
                >
                  <div
                    className={`mx-auto w-11 h-11 rounded-full flex items-center justify-center text-sm font-black border ${rankTone(
                      entry.rank
                    )}`}
                  >
                    {entry.rank === 1 ? <Trophy className="w-5 h-5" /> : entry.rank}
                  </div>
                  <div className="mt-2 text-xs font-bold text-slate-900 truncate">
                    {entry.name}
                    {entry.isMe ? <span className="ml-1 text-[9px] text-blue-600">(you)</span> : null}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">{entry.enrollmentNumber || 'Student'}</div>
                  <div className="mt-2 text-lg font-black text-[color:rgb(var(--tw-ink-900))]">{entry.score}%</div>
                  <div className="text-[9px] uppercase tracking-wider text-slate-400">Composite score</div>
                </div>
              ))}
            </div>
          )}

          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Medal className="w-4 h-4 text-[rgb(var(--tw-blue-700))]" />
                <h2 className="text-sm font-bold text-[color:rgb(var(--tw-ink-900))]">Full ranking</h2>
              </div>
              <span className="text-[10px] text-slate-400">{board.participantCount} student(s) · {board.batch.course}</span>
            </div>

            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[9px] uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="py-2.5 px-4">Rank</th>
                    <th className="py-2.5 px-4">Student</th>
                    <th className="py-2.5 px-4">Score</th>
                    <th className="py-2.5 px-4">Quizzes</th>
                    <th className="py-2.5 px-4">Assignments</th>
                    <th className="py-2.5 px-4">Attendance</th>
                    <th className="py-2.5 px-4">Badges</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {entries.map((entry) => (
                    <tr key={entry.studentId} className={entry.isMe ? 'bg-blue-50/50' : ''}>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center justify-center w-7 h-7 rounded-full border text-[10px] font-black ${rankTone(
                            entry.rank
                          )}`}
                        >
                          {entry.rank}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-xs font-bold text-slate-800">
                          {entry.name}
                          {entry.isMe ? <span className="ml-1.5 text-[9px] font-bold text-blue-600">(you)</span> : null}
                        </div>
                        <div className="text-[9px] text-slate-400 font-mono">{entry.enrollmentNumber || ''}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-xs font-black text-slate-800">{entry.score}%</div>
                        <div className="mt-1 h-1.5 w-20 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[rgb(var(--tw-blue-700))]"
                            style={{ width: `${Math.max(0, Math.min(100, entry.score))}%` }}
                          />
                        </div>
                      </td>
                      <td className="py-3 px-4 text-[11px] text-slate-600">
                        {fmtPercent(entry.quizAverage)}
                        <span className="block text-[9px] text-slate-400">{entry.quizzesCounted} quiz(es)</span>
                      </td>
                      <td className="py-3 px-4 text-[11px] text-slate-600">
                        {fmtPercent(entry.assignmentAverage)}
                        <span className="block text-[9px] text-slate-400">{entry.assignmentsGraded} graded</span>
                      </td>
                      <td className="py-3 px-4 text-[11px] text-slate-600">
                        {fmtPercent(entry.attendanceRate)}
                        <span className="block text-[9px] text-slate-400">{entry.classesMarked} class(es)</span>
                      </td>
                      <td className="py-3 px-4 text-[11px] text-slate-600">{entry.badges}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="sm:hidden divide-y divide-slate-100">
              {entries.map((entry) => (
                <div key={entry.studentId} className={`p-4 ${entry.isMe ? 'bg-blue-50/50' : ''}`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`inline-flex items-center justify-center w-7 h-7 rounded-full border text-[10px] font-black shrink-0 ${rankTone(
                          entry.rank
                        )}`}
                      >
                        {entry.rank}
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-800 truncate">
                          {entry.name}
                          {entry.isMe ? <span className="ml-1 text-[9px] text-blue-600">(you)</span> : null}
                        </div>
                        <div className="text-[9px] text-slate-400 font-mono">{entry.enrollmentNumber || ''}</div>
                      </div>
                    </div>
                    <div className="text-sm font-black text-[color:rgb(var(--tw-ink-900))]">{entry.score}%</div>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                    {[
                      { label: 'Quiz', value: fmtPercent(entry.quizAverage) },
                      { label: 'Assignments', value: fmtPercent(entry.assignmentAverage) },
                      { label: 'Attendance', value: fmtPercent(entry.attendanceRate) },
                    ].map((stat) => (
                      <div key={stat.label} className="rounded-lg bg-slate-50 px-2 py-1.5">
                        <div className="text-[9px] uppercase tracking-wider text-slate-400">{stat.label}</div>
                        <div className="text-[10px] font-bold text-slate-700">{stat.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {me && (
            <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <div className="text-[11px] text-blue-900">
                  You are <span className="font-bold">#{me.rank}</span> of {board.participantCount} in{' '}
                  <span className="font-bold">{board.batch.name || board.batch.batchCode}</span>.
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-blue-700">
                <Star className="w-3.5 h-3.5" /> {me.badges} badge(s) earned
              </div>
            </div>
          )}

          <p className="text-[10px] text-slate-400 leading-relaxed">
            {board.scoring}. Only students with an active enrollment in this batch are ranked. Scores recalculate from
            the same records your instructors see.
          </p>
        </>
      )}
    </div>
  );
}
