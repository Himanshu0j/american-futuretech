import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  Briefcase,
  Building2,
  MapPin,
  Clock,
  DollarSign,
  RefreshCw,
  ExternalLink,
  Search,
} from 'lucide-react';

const fmtDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
};

export default function MyJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get('/api/lms/jobs');
      setJobs(res.data?.jobs || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Could not load job openings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return jobs;
    return jobs.filter((job) =>
      `${job.title} ${job.company} ${job.location} ${(job.skills || []).join(' ')}`.toLowerCase().includes(query)
    );
  }, [jobs, search]);

  const targeted = jobs.filter((job) => job.targeted).length;

  return (
    <div className="p-6 sm:p-8 max-w-6xl mx-auto w-full space-y-6">
      <div className="p-6 sm:p-8 rounded-3xl bg-[rgb(var(--tw-ink-900))] text-white">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[11px] font-bold uppercase tracking-wider mb-3">
          <Briefcase className="w-3.5 h-3.5" /> Career Placement
        </div>
        <h1 className="text-2xl sm:text-3xl font-heading font-black text-white">Job Openings</h1>
        <p className="text-xs sm:text-sm text-slate-200 mt-2 max-w-2xl">
          Roles published for your batch and course, plus open positions from the career network.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6">
          {[
            { label: 'Open roles', value: jobs.length },
            { label: 'For your cohort', value: targeted },
            { label: 'Companies', value: new Set(jobs.map((job) => job.company).filter(Boolean)).size },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl bg-white/[0.06] border border-white/10 px-4 py-3">
              <div className="text-lg font-black text-white">{stat.value}</div>
              <div className="text-[10px] uppercase tracking-wider text-slate-300">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search role, company, location or skill"
            aria-label="Search job openings"
          />
        </div>
        <button
          type="button"
          onClick={load}
          className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 inline-flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">{error}</div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-xs text-slate-500">
          Loading job openings…
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
          <Briefcase className="w-8 h-8 mx-auto text-slate-300" />
          <div className="mt-3 text-sm font-bold text-slate-800">
            {search ? 'No role matches this search' : 'No roles published yet'}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {search ? 'Try another keyword.' : 'Your placement team publishes vetted roles here as they open.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {visible.map((job) => (
            <article key={job._id} className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-col">
              <div className="flex items-start gap-3">
                {job.companyLogo ? (
                  <img src={job.companyLogo} alt="" className="w-10 h-10 rounded-xl object-contain border border-slate-100" />
                ) : (
                  <span className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-slate-500" />
                  </span>
                )}
                <div className="min-w-0">
                  <h2 className="text-sm font-bold text-slate-900 leading-snug">{job.title}</h2>
                  <div className="text-[11px] text-slate-500">{job.company || 'Career Network Partner'}</div>
                </div>
                {job.targeted && (
                  <span className="ml-auto shrink-0 rounded-full bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                    Your batch
                  </span>
                )}
              </div>

              <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-slate-600">
                {job.location && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> {job.location}
                  </span>
                )}
                {job.employmentType && (
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> {job.employmentType}
                  </span>
                )}
                {job.salaryRange && (
                  <span className="inline-flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5" /> {job.salaryRange}
                  </span>
                )}
              </div>

              {job.description && (
                <p className="mt-3 text-[11px] text-slate-500 line-clamp-3">{job.description}</p>
              )}

              {(job.skills || []).length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {job.skills.slice(0, 6).map((skill) => (
                    <span key={skill} className="px-2 py-0.5 rounded-lg bg-slate-100 text-[10px] text-slate-600">
                      {skill}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-auto pt-4 flex items-center justify-between gap-2">
                <span className="text-[10px] text-slate-400">
                  {job.deadline ? `Apply by ${fmtDate(job.deadline)}` : 'Open until filled'}
                </span>
                <Link
                  to={`/jobs/${job._id}`}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[rgb(var(--tw-blue-700))] text-white text-[11px] font-bold hover:opacity-90"
                >
                  View & apply <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}

      <p className="text-[10px] text-slate-400">
        Only roles published to your course or batch are surfaced here; the same opening is visible on the public careers board.
      </p>
    </div>
  );
}
