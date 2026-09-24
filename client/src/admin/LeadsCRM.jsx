import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  PhoneCall,
  User,
  Calendar,
  Clock,
  CheckCircle2,
  X,
  MessageSquare,
  Sparkles,
  ChevronRight,
  GraduationCap,
  Plus,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function LeadsCRM() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedLead, setSelectedLead] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Mirrors `authorizeScoped` in server/middleware/auth.js: COUNSELOR keeps its
  // documented role scope, SUPERADMIN is unrestricted, and a normal admin needs
  // the matching grant. Controls that would answer 403 are not rendered — a
  // read-only account still sees the full lead record, just no write actions.
  const { user } = useAuth();
  const crmRole = (user?.role || '').toUpperCase();
  const crmPermissions = user?.permissions || [];
  const crmCounselorScope = crmRole === 'SUPERADMIN' || crmRole === 'COUNSELOR';
  const canEditLeads = crmCounselorScope || crmPermissions.includes('LEADS_EDIT');
  const canExportLeads = crmCounselorScope || crmPermissions.includes('LEADS_EXPORT');

  // Call log form state
  const [callNote, setCallNote] = useState('');
  const [callOutcome, setCallOutcome] = useState('Answered');
  const [followUpDate, setFollowUpDate] = useState('');
  const [loggingCall, setLoggingCall] = useState(false);

  // Convert to student state
  const [converting, setConverting] = useState(false);
  const [convertSuccess, setConvertSuccess] = useState('');

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedStatus !== 'All') params.status = selectedStatus;
      if (search.trim()) params.search = search.trim();

      const res = await api.get('/leads', { params });
      if (res.data.success) {
        setLeads(res.data.leads);
        // If drawer open, refresh selected lead
        if (selectedLead) {
          const updated = res.data.leads.find((l) => l._id === selectedLead._id);
          if (updated) setSelectedLead(updated);
        }
      }
    } catch (err) {
      console.error('Failed to load leads:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [selectedStatus, search]);

  const handleRowClick = (lead) => {
    setSelectedLead(lead);
    setDrawerOpen(true);
    setConvertSuccess('');
  };

  const handleAddCallLog = async (e) => {
    e.preventDefault();
    if (!callNote.trim() || !selectedLead) return;

    try {
      setLoggingCall(true);
      const res = await api.post(`/leads/${selectedLead._id}/call-logs`, {
        note: callNote,
        callOutcome,
        followUpDate: followUpDate || undefined,
      });

      if (res.data.success) {
        setCallNote('');
        setFollowUpDate('');
        setSelectedLead(res.data.lead);
        // Update local list
        setLeads((prev) =>
          prev.map((l) => (l._id === res.data.lead._id ? res.data.lead : l))
        );
      }
    } catch (err) {
      console.error('Failed to add call log:', err);
    } finally {
      setLoggingCall(false);
    }
  };

  const handleConvertToStudent = async () => {
    if (!selectedLead) return;
    try {
      setConverting(true);
      const res = await api.post(`/leads/${selectedLead._id}/convert`, {});
      if (res.data.success) {
        setConvertSuccess(`Enrolled in batch ${res.data.batchCode}! Invoice: ${res.data.student.invoiceId}`);
        fetchLeads();
      }
    } catch (err) {
      console.error('Conversion failed:', err);
    } finally {
      setConverting(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const res = await api.get('/leads/export/csv', { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `AmericanFutureTech_Leads_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const statuses = ['All', 'New', 'Contacted', 'Counseling Scheduled', 'Enrolled', 'Lost'];

  return (
    <div className="space-y-6 text-left relative">
      
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold font-heading text-white tracking-tight">
            Lead CRM & Admissions Pipeline
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Track prospective students, record calls, schedule counseling, and convert to enrolled cohorts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchLeads}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-300 transition-colors"
            title="Refresh Leads"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {canExportLeads && (
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-indigo-400/50 text-indigo-300 hover:text-white text-xs font-semibold flex items-center gap-2 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-[#0B1220]/80 backdrop-blur-xl border border-white/[0.08] flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search leads by name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900/90 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-400"
          />
        </div>

        {/* Status Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {statuses.map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedStatus === st
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-[0_0_10px_rgba(14,165,233,0.2)]'
                  : 'bg-slate-900/60 text-slate-400 border border-white/5 hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Leads Table */}
      <div className="rounded-2xl bg-[#0B1220]/80 backdrop-blur-xl border border-white/[0.08] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#070C17] text-slate-400 uppercase text-[10px] tracking-wider border-b border-white/[0.08]">
              <tr>
                <th className="px-5 py-3.5 font-bold">Applicant Details</th>
                <th className="px-5 py-3.5 font-bold">Target Program</th>
                <th className="px-5 py-3.5 font-bold">Preferred Batch</th>
                <th className="px-5 py-3.5 font-bold">Status</th>
                <th className="px-5 py-3.5 font-bold">Call History</th>
                <th className="px-5 py-3.5 font-bold">Applied On</th>
                <th className="px-5 py-3.5 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {leads.map((lead) => (
                <tr
                  key={lead._id}
                  onClick={() => handleRowClick(lead)}
                  className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                >
                  {/* Name & Contact */}
                  <td className="px-5 py-4">
                    <div className="font-bold text-white text-sm">{lead.fullName}</div>
                    <div className="text-slate-400 text-[11px]">{lead.email}</div>
                    <div className="text-slate-400 text-[10px] font-mono">{lead.phone}</div>
                  </td>

                  {/* Target Program */}
                  <td className="px-5 py-4">
                    <span className="font-semibold text-slate-200">
                      {lead.targetCourse?.title || 'General Technology'}
                    </span>
                    <div className="text-[10px] text-slate-400">
                      {lead.targetCourse?.duration || '6 Months'}
                    </div>
                  </td>

                  {/* Batch */}
                  <td className="px-5 py-4 text-slate-300">
                    {lead.preferredBatch}
                  </td>

                  {/* Status Tag */}
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        lead.status === 'New'
                          ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                          : lead.status === 'Contacted'
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          : lead.status === 'Counseling Scheduled'
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                          : lead.status === 'Enrolled'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {lead.status}
                    </span>
                  </td>

                  {/* Call Log summary */}
                  <td className="px-5 py-4">
                    <span className="text-slate-400 font-mono">
                      {lead.callLogs?.length || 0} calls
                    </span>
                    {lead.callLogs?.length > 0 && (
                      <div className="text-[10px] text-indigo-400 truncate max-w-[150px]">
                        Last: {lead.callLogs[0].callOutcome}
                      </div>
                    )}
                  </td>

                  {/* Applied Date */}
                  <td className="px-5 py-4 text-slate-400 text-[11px]">
                    {new Date(lead.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>

                  {/* Action arrow */}
                  <td className="px-5 py-4 text-right">
                    <div className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-800/80 text-slate-400 group-hover:text-white">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </td>
                </tr>
              ))}

              {loading && (
                [1, 2, 3, 4, 5].map((i) => (
                  <tr key={i} className="animate-pulse border-b border-white/[0.04]">
                    <td className="px-5 py-4"><div className="h-4 w-32 bg-slate-800 rounded" /></td>
                    <td className="px-5 py-4"><div className="h-4 w-28 bg-slate-800/70 rounded" /></td>
                    <td className="px-5 py-4"><div className="h-4 w-24 bg-slate-800/60 rounded" /></td>
                    <td className="px-5 py-4"><div className="h-5 w-16 bg-slate-800/80 rounded-full" /></td>
                    <td className="px-5 py-4"><div className="h-5 w-20 bg-slate-800/50 rounded-full" /></td>
                    <td className="px-5 py-4"><div className="h-4 w-24 bg-slate-800/50 rounded" /></td>
                    <td className="px-5 py-4"><div className="h-6 w-6 bg-slate-800 rounded-lg ml-auto" /></td>
                  </tr>
                ))
              )}

              {leads.length === 0 && !loading && (
                <tr>
                  <td colSpan="7" className="px-5 py-10 text-center text-slate-400 text-xs">
                    No applicants matching current filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-over Drawer for Detailed Applicant Profile & Call Recorder */}
      {drawerOpen && selectedLead && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-[#0B1220] border-l border-white/[0.1] h-full shadow-2xl flex flex-col overflow-hidden animate-slideInRight">
            
            {/* Drawer Header */}
            <div className="p-6 bg-[#070C17] border-b border-white/[0.08] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-400 to-blue-600 flex items-center justify-center font-bold text-white">
                  {selectedLead.fullName.charAt(0)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {selectedLead.fullName}
                  </h3>
                  <p className="text-xs text-slate-400">{selectedLead.email}</p>
                </div>
              </div>

              <button
                onClick={() => setDrawerOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Drawer Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              
              {/* Convert to Student Action Banner */}
              {!canEditLeads ? (
                <div className="p-3 rounded-xl bg-slate-900/80 border border-white/5 text-slate-400 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>Read-only access — LEADS_EDIT is required to record activity or convert this lead.</span>
                </div>
              ) : selectedLead.status !== 'Enrolled' ? (
                <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 to-slate-900 border border-emerald-500/30 flex items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-emerald-400 text-sm">
                      Ready to Enroll?
                    </h4>
                    <p className="text-[11px] text-slate-300 mt-0.5">
                      Move lead to active cohort & generate tuition invoice.
                    </p>
                  </div>
                  <button
                    onClick={handleConvertToStudent}
                    disabled={converting}
                    className="px-3.5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <GraduationCap className="w-4 h-4" />
                    <span>{converting ? 'Converting...' : 'Convert to Student'}</span>
                  </button>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Enrolled Student Confirmed</span>
                </div>
              )}

              {convertSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs font-semibold">
                  {convertSuccess}
                </div>
              )}

              {/* Profile Details Cards */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-white/5 space-y-2.5">
                <h4 className="font-bold uppercase tracking-wider text-[10px] text-slate-400">
                  Lead Metadata & Schedule Preference
                </h4>
                <div className="grid grid-cols-2 gap-3 text-slate-300">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Phone:</span>
                    <span className="font-semibold">{selectedLead.phone}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Marketing Source:</span>
                    <span className="font-semibold">{selectedLead.marketingSource || 'Landing Page'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Program:</span>
                    <span className="font-semibold">{selectedLead.targetCourse?.title || 'Data Science / Cyber'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Preferred Batch:</span>
                    <span className="font-semibold">{selectedLead.preferredBatch}</span>
                  </div>
                </div>
              </div>

              {/* Call Log Recorder */}
              {canEditLeads && (
              <div className="p-4 rounded-xl bg-slate-900/80 border border-white/5 space-y-3">
                <h4 className="font-bold uppercase tracking-wider text-[10px] text-indigo-400 flex items-center gap-1.5">
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Record Admissions Call / Note</span>
                </h4>

                <form onSubmit={handleAddCallLog} className="space-y-3">
                  <div>
                    <textarea
                      rows="2"
                      required
                      placeholder="Enter counseling summary, questions asked, or objections..."
                      value={callNote}
                      onChange={(e) => setCallNote(e.target.value)}
                      className="w-full p-2.5 rounded-lg bg-slate-950 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-400"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Call Outcome</label>
                      <select
                        value={callOutcome}
                        onChange={(e) => setCallOutcome(e.target.value)}
                        className="w-full p-2 rounded-lg bg-slate-950 border border-white/10 text-white text-xs"
                      >
                        <option value="Answered">Answered</option>
                        <option value="Callback Requested">Callback Requested</option>
                        <option value="Interested">Interested</option>
                        <option value="Counseling Scheduled">Counseling Scheduled</option>
                        <option value="Not Interested">Not Interested</option>
                        <option value="Voicemail">Voicemail</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Follow-Up Date</label>
                      <input
                        type="date"
                        value={followUpDate}
                        onChange={(e) => setFollowUpDate(e.target.value)}
                        className="w-full p-2 rounded-lg bg-slate-950 border border-white/10 text-white text-xs"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loggingCall}
                    className="w-full py-2 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{loggingCall ? 'Saving...' : 'Add Call Log Entry'}</span>
                  </button>
                </form>
              </div>
              )}

              {/* Call Log History Timeline */}
              <div className="space-y-3">
                <h4 className="font-bold uppercase tracking-wider text-[10px] text-slate-400">
                  Call & Activity Timeline ({selectedLead.callLogs?.length || 0})
                </h4>

                <div className="space-y-2.5">
                  {selectedLead.callLogs?.map((log, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-slate-900/60 border border-white/[0.04] space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-[11px]">{log.caller || 'Counselor'}</span>
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-indigo-300 font-mono">
                          {log.callOutcome}
                        </span>
                      </div>
                      <p className="text-slate-300 text-[11px]">{log.note}</p>
                      <div className="text-[10px] text-slate-400">
                        {new Date(log.timestamp).toLocaleString()}
                        {log.followUpDate && (
                          <span className="ml-2 text-amber-400">
                            • Follow-up: {new Date(log.followUpDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}

                  {(!selectedLead.callLogs || selectedLead.callLogs.length === 0) && (
                    <p className="text-slate-400 text-[11px]">No call notes recorded yet.</p>
                  )}
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
