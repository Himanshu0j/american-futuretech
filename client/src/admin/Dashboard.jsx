import React, { useState, useEffect } from 'react';
import {
  Users,
  TrendingUp,
  Calendar,
  DollarSign,
  ChevronRight,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts';
import api from '../lib/api';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [failed, setFailed] = useState(false);

  const fetchAnalytics = async () => {
    try {
      setRefreshing(true);
      const res = await api.get('/analytics/dashboard');
      if (res.data.success) {
        setData(res.data);
        setFailed(false);
      } else {
        setFailed(true);
      }
    } catch (err) {
      console.error('Failed to load dashboard analytics:', err);
      // Never fall back to sample figures: an admin must be able to trust that
      // what is on screen came from the database.
      setFailed(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const kpis = data?.kpis || {};
  const leadsTrend = dayOverDay(kpis.totalLeadsToday, kpis.totalLeadsYesterday);
  const hasData = Boolean(data);

  const kpiList = [
    {
      title: 'Total Leads Today',
      value: hasData ? kpis.totalLeadsToday ?? 0 : '—',
      subValue: `All time: ${kpis.totalLeadsAllTime ?? 0}`,
      icon: Users,
      trend: leadsTrend?.label,
      isPositive: leadsTrend?.isPositive,
      color: 'sky',
    },
    {
      title: 'Admissions Rate',
      value: hasData ? kpis.admissionsRate ?? '0.0%' : '—',
      subValue: `${kpis.totalEnrolled ?? 0} of ${kpis.totalLeadsAllTime ?? 0} leads enrolled`,
      icon: TrendingUp,
      // A real period-over-period rate needs historical snapshots, which this
      // database does not keep — so no change badge is shown at all.
      trend: null,
      isPositive: null,
      color: 'emerald',
    },
    {
      title: 'Active Cohorts',
      value: hasData ? kpis.activeBatches ?? 0 : '—',
      subValue: `${kpis.monitoredCourses ?? 0} programmes tracked`,
      icon: Calendar,
      trend: null,
      isPositive: null,
      color: 'purple',
    },
    {
      title: 'Revenue Pipeline',
      value: hasData ? kpis.totalRevenuePipeline ?? '$0' : '—',
      subValue: 'Enrolled tuition fees',
      icon: DollarSign,
      trend: null,
      isPositive: null,
      color: 'rose',
    },
  ];

  const funnel = data?.funnelData || [];
  const donut = (data?.courseDistribution || []).filter((row) => row.value > 0);
  const funnelColors = ['#38bdf8', '#0ea5e9', '#6366f1', '#8b5cf6', '#10b981'];

  return (
    <div className="space-y-8 text-left">

      {failed && (
        <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-200">
          Live analytics could not be loaded from the server, so no figures are shown here. Nothing on
          this page is sample data — use <span className="font-semibold">Refresh Telemetry</span> to try again.
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-white tracking-tight">
            Executive Operations Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time telemetry, lead pipeline conversions, and admissions velocity.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchAnalytics}
            disabled={refreshing}
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700/80 hover:border-slate-500 text-xs font-semibold text-slate-300 flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-indigo-400' : ''}`} />
            <span>Refresh Telemetry</span>
          </button>

          <Link
            to="/admin/leads"
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-400 hover:to-blue-500 text-white text-xs font-bold shadow-[0_0_20px_rgba(14,165,233,0.3)] transition-all flex items-center gap-1.5"
          >
            <span>Open CRM Pipeline</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* 4 KPI Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpiList.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className="rounded-2xl bg-[#0B1220]/80 backdrop-blur-xl border border-white/[0.08] p-5 relative overflow-hidden transition-all duration-300 hover:border-indigo-400/40 hover:shadow-[0_0_25px_rgba(14,165,233,0.15)] flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {kpi.title}
                </span>
                <div className="w-9 h-9 rounded-xl bg-slate-800/80 border border-white/5 flex items-center justify-center text-indigo-400">
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div>
                <div className="text-2xl sm:text-3xl font-black font-heading text-white tracking-tight">
                  {kpi.value}
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/[0.05] text-xs">
                  <span className="text-slate-400">{kpi.subValue}</span>
                  {kpi.trend && (
                    <span className={`font-semibold flex items-center gap-0.5 ${kpi.isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {kpi.trend}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Visual Charts Grid: Lead Funnel & Course Distribution Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Lead Conversion Funnel — all-time, straight from the leads table */}
        <div className="lg:col-span-8 rounded-2xl bg-[#0B1220]/80 backdrop-blur-xl border border-white/[0.08] p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold font-heading text-white">
                Lead Conversion Funnel
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Enquiry to Enrolled Student drop-off velocity
              </p>
            </div>
            <span className="text-[11px] px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-400/30 text-indigo-400 font-mono font-semibold">
              Conversion: {kpis.admissionsRate ?? '0.0%'}
            </span>
          </div>

          <div className="h-64 sm:h-72 w-full">
            {funnel.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                No applications recorded yet — the funnel fills up as enquiries arrive.
              </div>
            ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={funnel}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis dataKey="stage" type="category" stroke="#94a3b8" tick={{ fontSize: 11 }} width={110} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#070C17', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                />
                <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                  {funnel.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={funnelColors[index % funnelColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Course Distribution Donut */}
        <div className="lg:col-span-4 rounded-2xl bg-[#0B1220]/80 backdrop-blur-xl border border-white/[0.08] p-6 flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="text-base font-bold font-heading text-white">
              Course Distribution
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Applications received per programme
            </p>
          </div>

          <div className="h-56 w-full flex items-center justify-center relative">
            {donut.length === 0 ? (
              <div className="text-center text-xs text-slate-500 px-6">
                No applications have been linked to a programme yet.
              </div>
            ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donut}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={6}
                  dataKey="value"
                >
                  {(donut).map((entry, index) => (
                    <Cell key={`donut-${index}`} fill={entry.color || (index === 0 ? '#0ea5e9' : '#f43f5e')} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#070C17', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
            )}

            {/* Inner Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xs text-slate-400 font-medium">Leads</span>
              <span className="text-lg font-extrabold text-white font-heading">
                {kpis.totalLeadsAllTime ?? 0}
              </span>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-4 pt-4 border-t border-white/[0.06] space-y-2">
            {(data?.courseDistribution || []).map((item, idx) => (
              <div key={idx} className="flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color || (idx === 0 ? '#0ea5e9' : '#f43f5e'), opacity: item.value ? 1 : 0.35 }} />
                  <span className={`truncate ${item.value ? 'text-slate-300' : 'text-slate-500'} font-medium`} title={item.fullName || item.name}>
                    {item.name}
                  </span>
                </div>
                <span className={`shrink-0 ${item.value ? 'text-white font-bold' : 'text-slate-500 font-medium'}`}>
                  {item.value === 0 ? 'No leads yet' : `${item.value} ${item.value === 1 ? 'Lead' : 'Leads'}`}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Real-Time Incoming Student Applications Feed */}
      <div className="rounded-2xl bg-[#0B1220]/80 backdrop-blur-xl border border-white/[0.08] p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <h3 className="text-base font-bold font-heading text-white">
              Live Incoming Lead Application Stream
            </h3>
          </div>
          <Link
            to="/admin/leads"
            className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
          >
            <span>View Full CRM Table</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="divide-y divide-white/[0.05]">
          {(data?.recentLeadsStream || []).map((lead) => (
            <div key={lead.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-800 border border-white/5 flex items-center justify-center font-bold text-indigo-400">
                  {lead.name ? lead.name.charAt(0) : 'L'}
                </div>
                <div>
                  <span className="font-bold text-white text-sm">{lead.name}</span>
                  <div className="text-slate-400 text-[11px]">{lead.email}</div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-medium">
                  {lead.course}
                </span>

                <span
                  className={`px-2.5 py-1 rounded-full font-bold ${
                    lead.status === 'New'
                      ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/40'
                      : lead.status === 'Enrolled'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : lead.status === 'Counseling Scheduled'
                      ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {lead.status}
                </span>

                <span className="text-slate-500 text-[11px] hidden sm:block">
                  {new Date(lead.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}

          {(!data?.recentLeadsStream || data.recentLeadsStream.length === 0) && (
            <div className="py-6 text-center text-slate-500 text-xs">
              No recent leads recorded yet. Applications will stream here automatically.
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

/**
 * Day-over-day change for a count. Returns null when there is nothing to
 * compare against, so the caller can leave the badge off instead of showing a
 * percentage that was never measured.
 */
const dayOverDay = (today, yesterday) => {
  if (typeof today !== 'number' || typeof yesterday !== 'number') return null;
  if (yesterday === 0) return null;
  const change = ((today - yesterday) / yesterday) * 100;
  return {
    label: `${change >= 0 ? '+' : ''}${change.toFixed(1)}% vs yesterday`,
    isPositive: change >= 0,
  };
};
