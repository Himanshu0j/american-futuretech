import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import {
  Settings,
  Shield,
  Save,
  Building,
  Phone,
  Mail,
  MapPin,
  Bell,
  CheckCircle2,
  AlertCircle,
  Clock,
  User,
  RefreshCw,
  Sparkles,
  DollarSign
} from 'lucide-react';

export default function SettingsCMS() {
  const [activeTab, setActiveTab] = useState('settings'); // 'settings' | 'audit'
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Settings state
  const [settings, setSettings] = useState({
    brandName: 'American FutureTech LLC',
    phone: '+1 (307) 201-9494',
    email: 'admissions@americanfuturetech.com',
    address: '30 N Gould St Ste R, Sheridan, WY 82801, United States',
    announcementBanner: {
      active: true,
      text: '🚀 Spring Cohort 2026 Admissions Open — $99 Seat Reservation Now Available!',
      link: '/courses',
    },
    admissionNotice: 'Next Cohort Starts March 2026. Limited to 25 seats per track.',
  });

  // Audit logs state
  const [auditLogs, setAuditLogs] = useState([]);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      if (activeTab === 'settings') {
        const res = await axios.get('/api/settings');
        if (res.data.success && res.data.settings) {
          setSettings(res.data.settings);
        }
      } else {
        const res = await axios.get('/api/settings/audit-logs', { headers });
        if (res.data.success) {
          setAuditLogs(res.data.logs || []);
        }
      }
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setFeedback({ type: '', message: '' });
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      const res = await axios.put('/api/settings', settings, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setFeedback({ type: 'success', message: 'Site configuration updated successfully!' });
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to save settings'
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono uppercase tracking-widest mb-2">
            <Settings className="w-3.5 h-3.5" />
            System Control & Security
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white font-heading">
            Global Site Settings & Audit Trail
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Configure American FutureTech global brand information, US legal identity, announcement banners, and inspect security logs.
          </p>
        </div>

        <div className="flex rounded-xl bg-slate-900 border border-slate-800 p-1 self-start md:self-auto">
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 rounded-lg text-xs font-mono transition-colors ${
              activeTab === 'settings' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            General Settings
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2 rounded-lg text-xs font-mono transition-colors ${
              activeTab === 'audit' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Security Audit Trail
          </button>
        </div>
      </div>

      {feedback.message && (
        <div className={`p-4 rounded-xl text-xs flex items-center gap-3 ${
          feedback.type === 'success'
            ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
            : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
        }`}>
          {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Tab 1: General Settings */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          {/* Section: Organization Identity */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 backdrop-blur-xl">
            <h3 className="text-base font-bold text-white font-heading flex items-center gap-2">
              <Building className="w-4 h-4 text-cyan-400" />
              Corporate Identity & Legal Entity
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div>
                <label className="block text-slate-400 uppercase mb-1.5">Legal Entity Name</label>
                <input
                  type="text"
                  value={settings.brandName || ''}
                  onChange={(e) => setSettings({ ...settings, brandName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-sans focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 uppercase mb-1.5">Official US Contact Phone</label>
                <input
                  type="text"
                  value={settings.phone || ''}
                  onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-sans focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 uppercase mb-1.5">Admissions Email</label>
                <input
                  type="email"
                  value={settings.email || ''}
                  onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-sans focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 uppercase mb-1.5">Registered Wyoming Office</label>
                <input
                  type="text"
                  value={settings.address || ''}
                  onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-sans focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* Section: Announcement & Topbar */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white font-heading flex items-center gap-2">
                <Bell className="w-4 h-4 text-cyan-400" />
                Global Announcement Bar
              </h3>
              <label className="flex items-center gap-2 text-xs font-mono text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.announcementBanner?.active || false}
                  onChange={(e) => setSettings({
                    ...settings,
                    announcementBanner: {
                      ...settings.announcementBanner,
                      active: e.target.checked
                    }
                  })}
                  className="rounded bg-slate-950 border-slate-800 text-cyan-500 focus:ring-0"
                />
                <span>Active Banner</span>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
              <div className="md:col-span-2">
                <label className="block text-slate-400 uppercase mb-1.5">Banner Message</label>
                <input
                  type="text"
                  value={settings.announcementBanner?.text || ''}
                  onChange={(e) => setSettings({
                    ...settings,
                    announcementBanner: {
                      ...settings.announcementBanner,
                      text: e.target.value
                    }
                  })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-sans focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 uppercase mb-1.5">Action Target Link</label>
                <input
                  type="text"
                  value={settings.announcementBanner?.link || ''}
                  onChange={(e) => setSettings({
                    ...settings,
                    announcementBanner: {
                      ...settings.announcementBanner,
                      link: e.target.value
                    }
                  })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors shadow-lg shadow-cyan-500/20"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Site Settings'}
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: Security Audit Trail */}
      {activeTab === 'audit' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden backdrop-blur-xl">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="text-xs font-mono text-slate-400 uppercase">
              Recent System Events ({auditLogs.length})
            </div>
            <button
              onClick={fetchData}
              className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:underline font-mono"
            >
              <RefreshCw className="w-3 h-3" /> Refresh Logs
            </button>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400 text-xs font-mono">Loading audit logs...</div>
          ) : auditLogs.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs font-mono">
              No recent audit trail entries found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/70 text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Actor</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Entity</th>
                    <th className="py-3 px-4">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {auditLogs.map((log) => (
                    <tr key={log._id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4 text-slate-400">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-white font-bold">
                        {log.actorName || 'System Admin'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-300">{log.entity}</td>
                      <td className="py-3 px-4 text-slate-400 max-w-xs truncate font-sans">
                        {log.details || 'Administrative operation'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
