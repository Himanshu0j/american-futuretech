import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Medal,
  RefreshCw,
  Sparkles,
  Target,
  Brain,
  ClipboardCheck,
  CalendarCheck,
  GraduationCap,
  Briefcase,
  Lock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

const ICON_MAP = {
  Sparkles,
  Target,
  Brain,
  ClipboardCheck,
  CalendarCheck,
  GraduationCap,
  Briefcase,
};

const TIER_STYLE = {
  bronze: {
    card: 'from-orange-50 to-white border-orange-200',
    badge: 'bg-orange-100 text-orange-700 border-orange-200',
    bar: 'bg-orange-500',
    label: 'Bronze',
  },
  silver: {
    card: 'from-slate-50 to-white border-slate-200',
    badge: 'bg-slate-100 text-slate-700 border-slate-200',
    bar: 'bg-slate-500',
    label: 'Silver',
  },
  gold: {
    card: 'from-yellow-50 to-white border-yellow-200',
    badge: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    bar: 'bg-yellow-500',
    label: 'Gold',
  },
  platinum: {
    card: 'from-blue-50 to-white border-blue-200',
    badge: 'bg-blue-100 text-blue-700 border-blue-200',
    bar: 'bg-blue-500',
    label: 'Platinum',
  },
};

const fmtDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
};

export default function Badges() {
  const [data, setData] = useState({ badges: [], summary: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await axios.get('/api/lms/badges');
        if (alive) {
          setData({
            badges: res.data?.badges || [],
            summary: res.data?.summary || {},
          });
        }
      } catch (err) {
        if (alive) setError(err.response?.data?.message || err.message || 'Could not load your badges.');
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    return () => {
      alive = false;
    };
  }, [reloadToken]);

  const badges = data.badges || [];
  const earned = badges.filter((badge) => badge.earned);
  const locked = badges.filter((badge) => !badge.earned);
  const nextBadge = locked.find((badge) => badge.key === data.summary?.nextBadge) || locked[0];

  return (
    <div className="p-6 sm:p-8 max-w-6xl mx-auto w-full space-y-6">
      <div className="p-6 sm:p-8 rounded-3xl bg-[rgb(var(--tw-ink-900))] text-white">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[11px] font-bold uppercase tracking-wider mb-3">
          <Medal className="w-3.5 h-3.5" /> Achievements
        </div>
        <h1 className="text-2xl sm:text-3xl font-heading font-black text-white">Badges</h1>
        <p className="text-xs sm:text-sm text-slate-200 mt-2 max-w-2xl">
          Earned from real work in your enrolled batches: quiz results, graded assignments, attendance and career
          activity. Awards keep their original date even when your averages move later.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          {[
            { label: 'Earned', value: earned.length },
            { label: 'Total', value: badges.length },
            { label: 'Locked', value: locked.length },
            { label: 'Completion', value: `${badges.length ? Math.round((earned.length / badges.length) * 100) : 0}%` },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl bg-white/10 border border-white/15 px-4 py-3">
              <div className="text-[10px] uppercase tracking-wider text-blue-100/80">{stat.label}</div>
              <div className="text-xl font-black text-white mt-0.5">{stat.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-[11px] text-slate-500">
          {nextBadge
            ? `Closest next badge: ${nextBadge.title} · ${nextBadge.progress.label}`
            : 'Every badge has been earned. Outstanding work.'}
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

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((row) => (
            <div key={row} className="h-48 rounded-2xl bg-white border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : badges.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
          <Medal className="w-8 h-8 mx-auto text-slate-300" />
          <div className="mt-3 text-sm font-bold text-slate-800">No badges configured</div>
          <p className="mt-1 text-xs text-slate-500">Your achievements will appear here once activity is recorded.</p>
        </div>
      ) : (
        <>
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-bold text-[color:rgb(var(--tw-ink-900))]">Earned</h2>
              <span className="text-[10px] text-slate-400">{earned.length} award(s)</span>
            </div>

            {earned.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
                <Sparkles className="w-7 h-7 mx-auto text-slate-300" />
                <div className="mt-2 text-xs font-bold text-slate-700">Your first badge is close</div>
                <p className="mt-1 text-[11px] text-slate-500">
                  Submit a quiz, turn in an assignment or attend a marked class to start earning.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {earned.map((badge) => {
                  const Icon = ICON_MAP[badge.icon] || Medal;
                  const tier = TIER_STYLE[badge.tier] || TIER_STYLE.bronze;
                  return (
                    <article
                      key={badge.key}
                      className={`rounded-2xl border bg-gradient-to-b p-5 ${tier.card} relative overflow-hidden`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className={`w-11 h-11 rounded-xl border flex items-center justify-center ${tier.badge}`}>
                          <Icon className="w-5 h-5" />
                        </span>
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" /> Earned
                        </span>
                      </div>
                      <h3 className="mt-3 text-sm font-black text-slate-900">{badge.title}</h3>
                      <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">{badge.description}</p>
                      <div className="mt-4 flex items-center justify-between gap-2">
                        <span className={`px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase tracking-wider ${tier.badge}`}>
                          {tier.label}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {badge.awardedAt ? fmtDate(badge.awardedAt) : 'Awarded'}
                        </span>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-bold text-[color:rgb(var(--tw-ink-900))]">In progress</h2>
              <span className="text-[10px] text-slate-400">{locked.length} badge(s) to unlock</span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {locked.map((badge) => {
                const Icon = ICON_MAP[badge.icon] || Medal;
                const tier = TIER_STYLE[badge.tier] || TIER_STYLE.bronze;
                return (
                  <article key={badge.key} className="rounded-2xl border border-slate-200 bg-white p-5">
                    <div className="flex items-start justify-between gap-3">
                      <span className="w-11 h-11 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-400">
                        <Icon className="w-5 h-5" />
                      </span>
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full">
                        <Lock className="w-3 h-3" /> Locked
                      </span>
                    </div>
                    <h3 className="mt-3 text-sm font-black text-slate-800">{badge.title}</h3>
                    <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">{badge.description}</p>

                    <div className="mt-4">
                      <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1.5">
                        <span className="truncate pr-2">{badge.progress.label}</span>
                        <span className="font-bold shrink-0">{badge.progress.percent}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${tier.bar}`}
                          style={{ width: `${Math.max(0, Math.min(100, badge.progress.percent))}%` }}
                        />
                      </div>
                      <div className="mt-2 text-[9px] text-slate-400">
                        {badge.progress.current} / {badge.progress.target}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <p className="text-[10px] text-slate-400 leading-relaxed">
            Badges are calculated from your active batch records only. An award is stored with its original date, so it
            remains on your profile as a historical achievement.
          </p>
        </>
      )}
    </div>
  );
}
