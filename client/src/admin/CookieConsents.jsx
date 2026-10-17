import React, { useEffect, useMemo, useState } from 'react';
import { Cookie, Download, RefreshCw, Search, ShieldCheck, SlidersHorizontal } from 'lucide-react';

/**
 * Cookie consent records — the admin view of the banner's answers.
 *
 * The client asked to keep the detail of who accepted the cookie notice. What is
 * kept is the decision itself (which categories, when, on which page, from which
 * browser, and a salted hash of the address) with no name or contact details, so
 * this screen is a compliance record rather than a lead list — that is why there
 * is nothing to edit here, only to read and export.
 */

const authHeaders = () => {
  const token = localStorage.getItem('aft_admin_token') || localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const CHOICE_LABELS = {
  all: 'Accepted all',
  essential: 'Essential only',
  custom: 'Custom choice',
};

const CHOICE_STYLES = {
  all: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
  essential: 'bg-slate-700/40 text-slate-300 border-slate-600',
  custom: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
};

const formatWhen = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/** "Chrome on Android" is more useful on this screen than the full UA string. */
const browserLabel = (ua = '') => {
  const value = String(ua);
  if (!value) return 'Unknown device';
  const browser = /Edg\//.test(value) ? 'Edge'
    : /OPR\/|Opera/.test(value) ? 'Opera'
      : /Chrome\//.test(value) ? 'Chrome'
        : /Safari\//.test(value) && !/Chrome/.test(value) ? 'Safari'
          : /Firefox\//.test(value) ? 'Firefox'
            : 'Browser';
  const device = /iPhone|iPad|iPod/.test(value) ? 'iOS'
    : /Android/.test(value) ? 'Android'
      : /Windows/.test(value) ? 'Windows'
        : /Mac OS X/.test(value) ? 'macOS'
          : /Linux/.test(value) ? 'Linux'
            : '';
  return device ? `${browser} · ${device}` : browser;
};

export default function CookieConsents() {
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [choiceFilter, setChoiceFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  const load = async (nextPage = page) => {
    setLoading(true);
    setError('');
    try {
      const query = new URLSearchParams({ page: String(nextPage), limit: '50' });
      if (choiceFilter) query.set('choice', choiceFilter);
      const [listRes, summaryRes] = await Promise.all([
        fetch(`/api/consent?${query.toString()}`, { headers: authHeaders() }),
        fetch('/api/consent/summary?days=30', { headers: authHeaders() }),
      ]);
      if (!listRes.ok) throw new Error(`Could not load consent records (HTTP ${listRes.status}).`);
      const list = await listRes.json();
      setRecords(list.records || []);
      setTotal(list.total || 0);
      setPages(list.pages || 1);
      setPage(list.page || nextPage);
      if (summaryRes.ok) setSummary(await summaryRes.json());
    } catch (err) {
      setError(err.message || 'Could not load consent records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [choiceFilter]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return records;
    return records.filter((row) =>
      [row.page, row.userAgent, browserLabel(row.userAgent), row.language, row.ipHash]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle)),
    );
  }, [records, search]);

  const downloadCsv = () => {
    const header = ['Recorded at', 'Choice', 'Analytics', 'Marketing', 'Page', 'Browser', 'Language', 'IP hash'];
    const lines = filtered.map((row) => [
      new Date(row.createdAt).toISOString(),
      row.choice,
      row.categories?.analytics ? 'yes' : 'no',
      row.categories?.marketing ? 'yes' : 'no',
      row.page,
      browserLabel(row.userAgent),
      row.language,
      row.ipHash,
    ]);
    const csv = [header, ...lines]
      .map((cells) => cells.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = `cookie-consent-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(href);
  };

  const tiles = [
    { label: 'Records kept', value: summary?.total ?? '—', hint: 'All time', Icon: Cookie },
    { label: 'Last 24 hours', value: summary?.last24h ?? '—', hint: 'New decisions', Icon: ShieldCheck },
    { label: 'Accepted all', value: summary?.byChoice?.all ?? '—', hint: 'Last 30 days', Icon: ShieldCheck },
    { label: 'Essential only', value: summary?.byChoice?.essential ?? '—', hint: 'Last 30 days', Icon: SlidersHorizontal },
  ];

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono uppercase tracking-widest mb-2">
            <Cookie className="w-3.5 h-3.5" />
            Privacy & Consent
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white font-heading">
            Cookie consent records
          </h1>
          <p className="text-slate-400 text-sm mt-1 max-w-3xl">
            Every answer given in the cookie banner, newest first. Each record keeps the choice, the page,
            the browser and a salted hash of the connection — no name, email or phone is stored here.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => load(page)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={downloadCsv}
            disabled={!filtered.length}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {tiles.map(({ label, value, hint, Icon }) => (
          <div key={label} className="rounded-2xl bg-[rgb(var(--tw-ink-900)/80%)] border border-white/[0.08] p-4">
            <div className="flex items-center gap-2 text-slate-400 text-[11px] font-mono uppercase tracking-wider">
              <Icon className="w-3.5 h-3.5" />
              {label}
            </div>
            <div className="mt-2 text-2xl font-black text-white font-heading">{value}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">{hint}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search page, browser or hash on this page…"
            aria-label="Search consent records"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900/70 border border-slate-700 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-hidden focus:border-blue-500/60"
          />
        </div>
        <select
          value={choiceFilter}
          onChange={(event) => setChoiceFilter(event.target.value)}
          aria-label="Filter by choice"
          className="px-3 py-2.5 rounded-xl bg-slate-900/70 border border-slate-700 text-sm text-slate-200"
        >
          <option value="">All choices</option>
          <option value="all">Accepted all</option>
          <option value="essential">Essential only</option>
          <option value="custom">Custom choice</option>
        </select>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-white/[0.08] overflow-hidden bg-[rgb(var(--tw-ink-900)/60%)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/[0.03] text-slate-400 text-[11px] font-mono uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Recorded</th>
                <th className="px-4 py-3">Choice</th>
                <th className="px-4 py-3">Page</th>
                <th className="px-4 py-3">Browser</th>
                <th className="px-4 py-3">Language</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {loading && !records.length && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                    Loading consent records…
                  </td>
                </tr>
              )}
              {!loading && !filtered.length && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                    {total ? 'No record on this page matches the search.' : 'No cookie decisions recorded yet — the banner has not been answered since this was released.'}
                  </td>
                </tr>
              )}
              {filtered.map((row) => (
                <tr key={row.id} className="hover:bg-white/[0.02]">
                  <td className="px-4 py-3 text-slate-300 whitespace-nowrap">{formatWhen(row.createdAt)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full border text-[11px] font-bold ${CHOICE_STYLES[row.choice] || CHOICE_STYLES.essential}`}>
                      {CHOICE_LABELS[row.choice] || row.choice}
                    </span>
                    {row.choice === 'custom' && (
                      <span className="block text-[10px] text-slate-400 mt-1 font-mono">
                        analytics {row.categories?.analytics ? 'on' : 'off'} · marketing {row.categories?.marketing ? 'on' : 'off'}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-400 font-mono text-xs">{row.page || '/'}</td>
                  <td className="px-4 py-3 text-slate-300">{browserLabel(row.userAgent)}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{row.language || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-white/[0.06] text-xs text-slate-400">
          <span>
            {total} record{total === 1 ? '' : 's'} · page {page} of {pages}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => load(Math.max(page - 1, 1))}
              disabled={page <= 1 || loading}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => load(Math.min(page + 1, pages))}
              disabled={page >= pages || loading}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
