import React, { useState, useEffect } from 'react';
import {
  Users,
  TrendingUp,
  Calendar,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Sparkles,
  ExternalLink,
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
  AreaChart,
  Area,
  CartesianGrid,
} from 'recharts';
import api from '../lib/api';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalytics = async () => {
    try {
      setRefreshing(true);
      const res = await api.get('/analytics/dashboard');
      if (res.data.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard analytics:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const kpiList = [
    {
      title: 'Total Leads Today',
      value: data?.kpis?.totalLeadsToday ?? 4,
      subValue: `All time: ${data?.kpis?.totalLeadsAllTime ?? 10}`,
      icon: Users,
      trend: '+24.5%',
      isPositive: true,
      color: 'sky',
    },
    {
      title: 'Admissions Rate',
      value: data?.kpis?.admissionsRate ?? '33.3%',
      subValue: `${data?.kpis?.totalEnrolled ?? 3} confirmed students`,
      icon: TrendingUp,
      trend: '+5.2%',
      isPositive: true,
      color: 'emerald',
    },
    {
      title: 'Active Cohorts',
      value: data?.kpis?.activeBatches ?? 2,
      subValue: 'DS & Cyber tracks',
      icon: Calendar,
      trend: '100% On Schedule',
      isPositive: true,
      color: 'purple',
    },
    {
      title: 'Revenue Pipeline',
      value: data?.kpis?.totalRevenuePipeline ?? '$9,495',
      subValue: 'Enrolled tuition fees',
      icon: DollarSign,
      trend: '+18.4%',
      isPositive: true,
      color: 'rose',
    },
  ];

  const funnelColors = ['#38bdf8', '#0ea5e9', '#6366f1', '#8b5cf6', '#10b981'];

  return (
    <div className="space-y-8 text-left">
      
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
                  <span className={`font-semibold flex items-center gap-0.5 ${kpi.isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {kpi.trend}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Visual Charts Grid: Lead Funnel & Course Distribution Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Monthly Lead Conversion Funnel */}
        <div className="lg:col-span-8 rounded-2xl bg-[#0B1220]/80 backdrop-blur-xl border border-white/[0.08] p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold font-heading text-white">
                Monthly Lead Conversion Funnel
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Visitor to Enrolled Student drop-off velocity
              </p>
            </div>
            <span className="text-[11px] px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-400/30 text-indigo-400 font-mono font-semibold">
              Conversion: 3.2%
            </span>
          </div>

          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data?.funnelData || defaultFunnel}
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
                  {(data?.funnelData || defaultFunnel).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={funnelColors[index % funnelColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Course Distribution Donut */}
        <div className="lg:col-span-4 rounded-2xl bg-[#0B1220]/80 backdrop-blur-xl border border-white/[0.08] p-6 flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="text-base font-bold font-heading text-white">
              Course Distribution
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Interest ratio: AI vs Cyber Security
            </p>
          </div>

          <div className="h-56 w-full flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.courseDistribution || defaultDonut}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={6}
                  dataKey="value"
                >
                  {(data?.courseDistribution || defaultDonut).map((entry, index) => (
                    <Cell key={`donut-${index}`} fill={entry.color || (index === 0 ? '#0ea5e9' : '#f43f5e')} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#070C17', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Inner Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xs text-slate-400 font-medium">Active</span>
              <span className="text-lg font-extrabold text-white font-heading">
                {data?.kpis?.totalLeadsAllTime ?? 10}
              </span>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-4 pt-4 border-t border-white/[0.06] space-y-2">
            {(data?.courseDistribution || defaultDonut).map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color || (idx === 0 ? '#0ea5e9' : '#f43f5e') }} />
                  <span className="text-slate-300 font-medium">{item.name}</span>
                </div>
                <span className="text-white font-bold">{item.value} Leads</span>
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

const defaultFunnel = [
  { stage: 'Landing Visits', count: 1250 },
  { stage: 'Lead Enquiries', count: 85 },
  { stage: 'Counselor Calls', count: 62 },
  { stage: 'Doubt & Interview', count: 34 },
  { stage: 'Enrolled Students', count: 18 },
];

const defaultDonut = [
  { name: 'Data Science + AI', value: 6, color: '#0ea5e9' },
  { name: 'Cyber Security', value: 4, color: '#f43f5e' },
];
