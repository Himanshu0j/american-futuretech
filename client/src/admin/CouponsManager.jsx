import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  TicketPercent,
  PlusCircle,
  Search,
  Edit2,
  Trash2,
  Power,
  Copy,
  CheckCircle2,
  AlertCircle,
  X,
  Calculator,
  Calendar,
  Users,
  DollarSign,
} from 'lucide-react';

const authHeaders = () => {
  const token = localStorage.getItem('token') || localStorage.getItem('aft_admin_token');
  return { Authorization: `Bearer ${token}` };
};

const emptyForm = () => ({
  code: '',
  description: '',
  discountType: 'percent',
  discountValue: 10,
  minAmount: 0,
  maxDiscount: 0,
  startsAt: '',
  expiresAt: '',
  usageLimit: 0,
  perStudentLimit: 1,
  applicableTiers: [],
  applicableCourses: [],
  active: true,
});

const STATE_STYLES = {
  live: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
  inactive: 'bg-slate-700/30 text-slate-300 border-slate-600',
  expired: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
  exhausted: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
};

export default function CouponsManager() {
  const [coupons, setCoupons] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(null);
  const [previewAmount, setPreviewAmount] = useState(1899);

  const notify = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback({ type: '', message: '' }), 6000);
  };

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/coupons', { headers: authHeaders() });
      if (res.data.success) setCoupons(res.data.coupons || []);
    } catch (err) {
      notify('error', err.response?.data?.message || 'Could not load coupons.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const res = await axios.get('/api/courses');
      setCourses(res.data.courses || []);
    } catch (err) {
      console.error('Failed to load programs for coupon targeting', err);
    }
  };

  useEffect(() => {
    fetchCoupons();
    fetchCourses();
  }, []);

  const handleOpen = (coupon = null) => {
    setPreview(null);
    if (coupon) {
      setEditing(coupon);
      setForm({
        code: coupon.code || '',
        description: coupon.description || '',
        discountType: coupon.discountType || 'percent',
        discountValue: coupon.discountValue ?? 10,
        minAmount: coupon.minAmount || 0,
        maxDiscount: coupon.maxDiscount || 0,
        startsAt: coupon.startsAt ? String(coupon.startsAt).slice(0, 10) : '',
        expiresAt: coupon.expiresAt ? String(coupon.expiresAt).slice(0, 10) : '',
        usageLimit: coupon.usageLimit || 0,
        perStudentLimit: coupon.perStudentLimit ?? 1,
        applicableTiers: coupon.applicableTiers || [],
        applicableCourses: (coupon.applicableCourses || []).map((c) => (typeof c === 'object' ? c._id : c)),
        active: coupon.active !== false,
      });
    } else {
      setEditing(null);
      setForm(emptyForm());
    }
    setModalOpen(true);
  };

  const buildPayload = () => ({
    ...form,
    code: String(form.code || '').toUpperCase().replace(/\s+/g, ''),
    discountValue: Number(form.discountValue) || 0,
    minAmount: Number(form.minAmount) || 0,
    maxDiscount: Number(form.maxDiscount) || 0,
    usageLimit: Number(form.usageLimit) || 0,
    perStudentLimit: Number(form.perStudentLimit) || 0,
    startsAt: form.startsAt || null,
    expiresAt: form.expiresAt || null,
  });

  const handleSave = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const payload = buildPayload();
      if (editing) {
        await axios.put(`/api/coupons/${editing._id}`, payload, { headers: authHeaders() });
        notify('success', `Coupon ${payload.code} updated.`);
      } else {
        await axios.post('/api/coupons', payload, { headers: authHeaders() });
        notify('success', `Coupon ${payload.code} created.`);
      }
      setModalOpen(false);
      fetchCoupons();
    } catch (err) {
      notify('error', err.response?.data?.message || 'Could not save the coupon.');
    } finally {
      setBusy(false);
    }
  };

  const handleToggle = async (coupon) => {
    try {
      await axios.patch(`/api/coupons/${coupon._id}/toggle`, {}, { headers: authHeaders() });
      fetchCoupons();
      notify('success', `${coupon.code} is now ${coupon.active ? 'inactive' : 'active'}.`);
    } catch (err) {
      notify('error', err.response?.data?.message || 'Could not change the coupon status.');
    }
  };

  const handleDelete = async (coupon) => {
    if (!window.confirm(`Delete coupon ${coupon.code}? This cannot be undone.`)) return;
    try {
      await axios.delete(`/api/coupons/${coupon._id}`, { headers: authHeaders() });
      setCoupons((list) => list.filter((c) => c._id !== coupon._id));
      notify('success', `Coupon ${coupon.code} deleted.`);
    } catch (err) {
      notify('error', err.response?.data?.message || 'Could not delete the coupon.');
    }
  };

  const handlePreview = async () => {
    if (!editing) {
      notify('info', 'Save the coupon first, then run a live test.');
      return;
    }
    try {
      const res = await axios.post(
        '/api/coupons/preview',
        { couponId: editing._id, amount: Number(previewAmount) || 1000 },
        { headers: authHeaders() },
      );
      setPreview(res.data.preview);
    } catch (err) {
      notify('error', err.response?.data?.message || 'Preview failed.');
    }
  };

  const filtered = useMemo(() => coupons.filter((coupon) => {
    const term = search.trim().toLowerCase();
    const matchesTerm = !term ||
      coupon.code?.toLowerCase().includes(term) ||
      coupon.description?.toLowerCase().includes(term);
    const matchesStatus = statusFilter === 'all' || coupon.state === statusFilter;
    return matchesTerm && matchesStatus;
  }), [coupons, search, statusFilter]);

  const stats = useMemo(() => ({
    live: coupons.filter((c) => c.state === 'live').length,
    redemptions: coupons.reduce((sum, c) => sum + (c.usedCount || 0), 0),
  }), [coupons]);

  const copyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      notify('success', `${code} copied.`);
    } catch (err) {
      notify('error', 'Clipboard is unavailable in this browser.');
    }
  };

  const toggleTier = (tier) => {
    setForm((prev) => ({
      ...prev,
      applicableTiers: prev.applicableTiers.includes(tier)
        ? prev.applicableTiers.filter((t) => t !== tier)
        : [...prev.applicableTiers, tier],
    }));
  };

  const toggleCourse = (id) => {
    setForm((prev) => ({
      ...prev,
      applicableCourses: prev.applicableCourses.includes(id)
        ? prev.applicableCourses.filter((c) => c !== id)
        : [...prev.applicableCourses, id],
    }));
  };

  const inputClass = 'w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-sans text-xs focus:outline-none focus:border-indigo-500';
  const labelClass = 'block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1';

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-mono uppercase tracking-widest mb-2">
            <TicketPercent className="w-3.5 h-3.5" />
            Coupons &amp; Promotions
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white font-heading">Coupon Management</h1>
          <p className="text-slate-400 text-sm mt-1">
            Flat or percentage vouchers with expiry, usage caps and program targeting. Every discount is
            re-calculated on the server at checkout — the browser can never change a price.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col px-4 py-2 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-[10px] font-mono uppercase text-slate-500">Live coupons</span>
            <span className="text-lg font-bold text-emerald-300">{stats.live}</span>
          </div>
          <div className="hidden sm:flex flex-col px-4 py-2 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-[10px] font-mono uppercase text-slate-500">Redemptions</span>
            <span className="text-lg font-bold text-indigo-300">{stats.redemptions}</span>
          </div>
          <button
            onClick={() => handleOpen()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 text-white font-bold text-xs shadow-lg shadow-indigo-500/20 hover:brightness-110 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            Create Coupon
          </button>
        </div>
      </div>

      {feedback.message && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-xs ${
          feedback.type === 'error'
            ? 'bg-rose-500/10 border-rose-500/30 text-rose-200'
            : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
        }`}>
          {feedback.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          <span>{feedback.message}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by code or description…"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
        >
          <option value="all">All statuses</option>
          <option value="live">Live</option>
          <option value="inactive">Inactive</option>
          <option value="expired">Expired</option>
          <option value="exhausted">Usage limit reached</option>
        </select>
      </div>

      {loading ? (
        <div className="p-10 text-center text-slate-500 font-mono text-xs">Loading coupons…</div>
      ) : filtered.length === 0 ? (
        <div className="p-10 text-center text-slate-400 text-sm bg-slate-900/60 rounded-2xl border border-slate-800">
          {coupons.length === 0
            ? 'No coupons yet. Create one to start a promotion.'
            : 'No coupons match this search.'}
        </div>
      ) : (
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-[10px] uppercase tracking-wider font-mono text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Discount</th>
                  <th className="py-3 px-4">Rules</th>
                  <th className="py-3 px-4">Usage</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filtered.map((coupon) => (
                  <tr key={coupon._id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-white flex items-center gap-2">
                        {coupon.code}
                        <button onClick={() => copyCode(coupon.code)} title="Copy code" className="text-slate-500 hover:text-white cursor-pointer">
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="text-[11px] text-slate-500">{coupon.description || '—'}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-emerald-300 font-bold">
                      {coupon.discountType === 'percent'
                        ? `${coupon.discountValue}% OFF`
                        : `$${Number(coupon.discountValue).toLocaleString()} OFF`}
                      {coupon.maxDiscount > 0 && (
                        <div className="text-[10px] text-slate-500 font-sans">capped at ${coupon.maxDiscount}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-[11px] text-slate-400 space-y-0.5">
                      {coupon.minAmount > 0 && <div>Min ${coupon.minAmount}</div>}
                      {coupon.expiresAt && <div>Expires {new Date(coupon.expiresAt).toLocaleDateString()}</div>}
                      {coupon.applicableTiers?.length > 0 && <div>Tiers: {coupon.applicableTiers.join(', ')}</div>}
                      {coupon.applicableCourses?.length > 0 && <div>{coupon.applicableCourses.length} program(s)</div>}
                      {!coupon.expiresAt && !coupon.minAmount && !coupon.applicableTiers?.length && !coupon.applicableCourses?.length && <div>No restrictions</div>}
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <div className="text-white font-bold">{coupon.usedCount || 0}{coupon.usageLimit > 0 ? ` / ${coupon.usageLimit}` : ''}</div>
                      <div className="text-[10px] text-slate-500">
                        {coupon.perStudentLimit > 0 ? `${coupon.perStudentLimit} per student` : 'unlimited per student'}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono uppercase font-bold border ${STATE_STYLES[coupon.state] || STATE_STYLES.live}`}>
                        {coupon.state}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleToggle(coupon)}
                          title={coupon.active ? 'Deactivate' : 'Activate'}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            coupon.active
                              ? 'bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
                              : 'bg-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpen(coupon)}
                          title="Edit"
                          className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(coupon)}
                          title="Delete"
                          className="p-1.5 rounded-lg bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-3xl rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl max-h-[92vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 p-5">
              <div>
                <h3 className="text-lg font-bold text-white font-heading">
                  {editing ? `Edit coupon ${editing.code}` : 'Create a new coupon'}
                </h3>
                <p className="text-[11px] text-slate-400 font-mono">
                  Discounts are applied server-side at checkout — invalid/expired codes are rejected with a reason.
                </p>
              </div>
              <button onClick={() => setModalOpen(false)} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Coupon Code *</label>
                  <input
                    required
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. AFT2026"
                    className={`${inputClass} font-mono uppercase`}
                  />
                </div>
                <div>
                  <label className={labelClass}>Description (internal)</label>
                  <input
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="e.g. Spring cohort campaign"
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className={labelClass}>Discount Type</label>
                  <select
                    value={form.discountType}
                    onChange={(e) => setForm({ ...form, discountType: e.target.value })}
                    className={inputClass}
                  >
                    <option value="percent">Percentage (%)</option>
                    <option value="flat">Flat amount ($)</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>
                    {form.discountType === 'percent' ? 'Percent Off (%)' : 'Amount Off ($)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step={form.discountType === 'percent' ? '1' : '1'}
                    required
                    value={form.discountValue}
                    onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Max Discount Cap ($)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.maxDiscount}
                    onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })}
                    placeholder="0 = no cap"
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className={labelClass}>Minimum Order ($)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.minAmount}
                    onChange={(e) => setForm({ ...form, minAmount: e.target.value })}
                    placeholder="0 = no minimum"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}><Calendar className="w-3 h-3 inline" /> Start Date</label>
                  <input
                    type="date"
                    value={form.startsAt}
                    onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}><Calendar className="w-3 h-3 inline" /> Expiry Date</label>
                  <input
                    type="date"
                    value={form.expiresAt}
                    onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}><Users className="w-3 h-3 inline" /> Total Usage Limit</label>
                  <input
                    type="number"
                    min="0"
                    value={form.usageLimit}
                    onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
                    placeholder="0 = unlimited"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Per-Student Limit</label>
                  <input
                    type="number"
                    min="0"
                    value={form.perStudentLimit}
                    onChange={(e) => setForm({ ...form, perStudentLimit: e.target.value })}
                    placeholder="0 = unlimited"
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                <label className={labelClass}>Applies to which options? (none selected = all)</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'deposit', label: 'Seat deposit' },
                    { id: 'full', label: 'Full tuition' },
                    { id: 'personalized', label: 'Personalized track' },
                  ].map((tier) => (
                    <button
                      type="button"
                      key={tier.id}
                      onClick={() => toggleTier(tier.id)}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                        form.applicableTiers.includes(tier.id)
                          ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-200'
                          : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      {tier.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                <label className={labelClass}>Restrict to programs (none selected = every program)</label>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                  {courses.map((course) => (
                    <button
                      type="button"
                      key={course._id}
                      onClick={() => toggleCourse(course._id)}
                      className={`px-3 py-1.5 rounded-lg text-[11px] border transition-colors cursor-pointer ${
                        form.applicableCourses.includes(course._id)
                          ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-200'
                          : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      {course.title}
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  className="accent-indigo-500"
                />
                <span>Active — customers can use this code right now</span>
              </label>

              {editing && (
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                  <label className={labelClass}><Calculator className="w-3 h-3 inline" /> Live test this coupon</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      value={previewAmount}
                      onChange={(e) => setPreviewAmount(e.target.value)}
                      className={`${inputClass} max-w-[160px]`}
                    />
                    <button
                      type="button"
                      onClick={handlePreview}
                      className="px-3 py-2 rounded-xl bg-slate-800 text-white font-bold hover:bg-slate-700 cursor-pointer"
                    >
                      Test
                    </button>
                  </div>
                  {preview && (
                    <div className={`text-[11px] font-mono ${preview.ok ? 'text-emerald-300' : 'text-amber-300'}`}>
                      {preview.ok
                        ? `$${preview.sampleAmount} → $${preview.finalAmount} (saves $${preview.discountAmount})`
                        : `Not applicable: ${preview.message}`}
                    </div>
                  )}
                </div>
              )}
            </form>

            <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-200 text-xs font-bold hover:bg-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={busy}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 text-white text-xs font-bold shadow-lg shadow-indigo-500/20 disabled:opacity-50 cursor-pointer"
              >
                <DollarSign className="w-4 h-4" />
                {busy ? 'Saving…' : editing ? 'Save Changes' : 'Create Coupon'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
