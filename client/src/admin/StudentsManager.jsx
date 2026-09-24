import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  GraduationCap,
  PlusCircle,
  Search,
  Eye,
  Edit2,
  KeyRound,
  ShieldOff,
  Power,
  CheckCircle2,
  AlertCircle,
  X,
  Users,
  Sparkles,
  BookOpen,
  CalendarDays,
  Copy,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Award,
} from 'lucide-react';

const authHeaders = () => {
  const token = localStorage.getItem('token') || localStorage.getItem('aft_admin_token');
  return { Authorization: `Bearer ${token}` };
};

const PAGE_SIZE = 10;

const WIZARD_STEPS = [
  { id: 1, label: 'Student Information' },
  { id: 2, label: 'Account' },
  { id: 3, label: 'Program' },
  { id: 4, label: 'Batch' },
  { id: 5, label: 'LMS Access' },
  { id: 6, label: 'Review' },
];

const emptyDraft = () => ({
  name: '',
  email: '',
  phone: '',
  password: '',
  generatePassword: true,
  isActive: true,
  targetCareer: '',
  courseIds: [],
  batchId: '',
  personalizedLearning: false,
  lmsAccess: {
    classroom: true,
    recordings: true,
    assignments: true,
    certificates: true,
    support: true,
    careerResources: true,
  },
});

const STATUS_BADGE = (active) =>
  active
    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
    : 'bg-slate-700/40 text-slate-300 border-slate-600';

export default function StudentsManager() {
  const [students, setStudents] = useState([]);
  const [options, setOptions] = useState({ courses: [], batches: [] });
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1, pageSize: PAGE_SIZE });
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [credentials, setCredentials] = useState(null);
  const [busy, setBusy] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [courseFilter, setCourseFilter] = useState('all');
  const [batchFilter, setBatchFilter] = useState('all');
  const [page, setPage] = useState(1);

  // Wizard / drawer
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState(emptyDraft());
  const [detail, setDetail] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const notify = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback({ type: '', message: '' }), 7000);
  };

  const fetchOptions = async () => {
    try {
      const res = await axios.get('/api/students/admin/options', { headers: authHeaders() });
      if (res.data.success) setOptions({ courses: res.data.courses || [], batches: res.data.batches || [] });
    } catch (err) {
      console.error('Failed to load assignment options', err);
    }
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/students/admin', {
        headers: authHeaders(),
        params: {
          search: search.trim() || undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          courseId: courseFilter !== 'all' ? courseFilter : undefined,
          batchId: batchFilter !== 'all' ? batchFilter : undefined,
          page,
          limit: PAGE_SIZE,
        },
      });
      if (res.data.success) {
        setStudents(res.data.students || []);
        setPagination(res.data.pagination || { page: 1, total: 0, totalPages: 1 });
      }
    } catch (err) {
      notify('error', err.response?.data?.message || 'Could not load students.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOptions();
  }, []);

  useEffect(() => {
    fetchStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter, courseFilter, batchFilter, page]);

  // Any filter change starts from page 1 so a stale page can never hide results.
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, courseFilter, batchFilter]);

  const stats = useMemo(() => ({
    total: pagination.total,
    active: students.filter((s) => s.isActive).length,
    personalized: students.filter((s) => s.personalizedLearning).length,
  }), [students, pagination.total]);

  const openCreate = () => {
    setEditingId(null);
    setDraft(emptyDraft());
    setStep(1);
    setWizardOpen(true);
  };

  const openEdit = (student) => {
    setEditingId(student._id);
    setDraft({
      ...emptyDraft(),
      name: student.name || '',
      email: student.email || '',
      phone: student.phone || '',
      generatePassword: false,
      isActive: student.isActive !== false,
      targetCareer: student.targetCareer || '',
      courseIds: student.courseIds || [],
      batchId: student.batchId || '',
      personalizedLearning: Boolean(student.personalizedLearning),
      lmsAccess: { ...emptyDraft().lmsAccess, ...(student.lmsAccess || {}) },
    });
    setStep(1);
    setWizardOpen(true);
  };

  const openDetail = async (student) => {
    try {
      const res = await axios.get(`/api/students/admin/${student._id}`, { headers: authHeaders() });
      if (res.data.success) {
        setDetail(res.data);
        setDetailOpen(true);
      }
    } catch (err) {
      notify('error', err.response?.data?.message || 'Could not load the student profile.');
    }
  };

  const toggleCourse = (courseId) => {
    setDraft((prev) => ({
      ...prev,
      courseIds: prev.courseIds.includes(courseId)
        ? prev.courseIds.filter((id) => id !== courseId)
        : [...prev.courseIds, courseId],
    }));
  };

  const saveStudent = async () => {
    if (!draft.name.trim() || !draft.email.trim()) {
      notify('error', 'Name and email are required.');
      setStep(1);
      return;
    }
    setBusy(true);
    try {
      const payload = {
        name: draft.name,
        email: draft.email,
        phone: draft.phone,
        isActive: draft.isActive,
        targetCareer: draft.targetCareer,
        courseIds: draft.courseIds,
        batchId: draft.batchId || null,
        personalizedLearning: draft.personalizedLearning,
        lmsAccess: draft.lmsAccess,
        ...(draft.generatePassword ? {} : { password: draft.password }),
      };

      if (editingId) {
        const res = await axios.put(`/api/students/admin/${editingId}`, payload, { headers: authHeaders() });
        if (res.data.success) {
          notify('success', `${res.data.student.name} updated.`);
          setWizardOpen(false);
          fetchStudents();
        }
      } else {
        const res = await axios.post('/api/students/admin', payload, { headers: authHeaders() });
        if (res.data.success) {
          notify('success', `Student ${res.data.student.name} created with ${draft.courseIds.length} assignment(s).`);
          setCredentials(res.data.credentials);
          setWizardOpen(false);
          fetchStudents();
        }
      }
    } catch (err) {
      notify('error', err.response?.data?.message || 'Could not save the student.');
    } finally {
      setBusy(false);
    }
  };

  const resetAccess = async (student) => {
    if (!window.confirm(`Issue new login credentials for ${student.name}? Their current password stops working immediately.`)) return;
    try {
      const res = await axios.post(`/api/students/admin/${student._id}/reset-access`, {}, { headers: authHeaders() });
      if (res.data.success) {
        setCredentials(res.data.credentials);
        notify('success', 'New credentials generated — copy them now, they are shown once.');
      }
    } catch (err) {
      notify('error', err.response?.data?.message || 'Could not reset access.');
    }
  };

  const revokeAccess = async (student) => {
    if (!window.confirm(`Remove ALL course access for ${student.name}? The account stays, the enrollments are revoked.`)) return;
    try {
      await axios.delete(`/api/students/admin/${student._id}/access`, { headers: authHeaders() });
      notify('success', `${student.name}'s course access was revoked.`);
      fetchStudents();
    } catch (err) {
      notify('error', err.response?.data?.message || 'Could not revoke access.');
    }
  };

  const toggleActive = async (student) => {
    try {
      await axios.put(
        `/api/students/admin/${student._id}`,
        { isActive: !student.isActive },
        { headers: authHeaders() },
      );
      notify('success', `${student.name} is now ${student.isActive ? 'deactivated' : 'active'}.`);
      fetchStudents();
    } catch (err) {
      notify('error', err.response?.data?.message || 'Could not change the account status.');
    }
  };

  const copyText = async (value) => {
    try {
      await navigator.clipboard.writeText(value);
      notify('success', 'Copied to clipboard.');
    } catch (err) {
      notify('error', 'Clipboard unavailable — copy manually.');
    }
  };

  const inputClass = 'w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-sans text-xs focus:outline-none focus:border-indigo-500';
  const labelClass = 'block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1';

  const batchLabel = (batch) =>
    `${batch.batchCode}${batch.courseTitle ? ` · ${batch.courseTitle}` : ''}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-mono uppercase tracking-widest mb-2">
            <GraduationCap className="w-3.5 h-3.5" />
            Enrolled Students &amp; LMS Access
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white font-heading">Student Management</h1>
          <p className="text-slate-400 text-sm mt-1">
            Create student accounts and assign programs, batches, personalized mentorship and LMS access. Students
            only ever see what you assign here — the API enforces it, not just the dashboard.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col px-4 py-2 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-[10px] font-mono uppercase text-slate-400">Students</span>
            <span className="text-lg font-bold text-white">{stats.total}</span>
          </div>
          <div className="hidden sm:flex flex-col px-4 py-2 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-[10px] font-mono uppercase text-slate-400">Personalized</span>
            <span className="text-lg font-bold text-amber-300">{stats.personalized}</span>
          </div>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 text-white font-bold text-xs shadow-lg shadow-indigo-500/20 hover:brightness-110 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            Add Student
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

      {credentials && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-100 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold flex items-center gap-2">
              <KeyRound className="w-4 h-4" />
              Share these credentials securely — the password is shown only once
            </span>
            <button onClick={() => setCredentials(null)} className="text-amber-200 hover:text-white cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
            <span className="px-3 py-1.5 rounded-lg bg-slate-950/60 border border-amber-500/30">{credentials.email}</span>
            <span className="px-3 py-1.5 rounded-lg bg-slate-950/60 border border-amber-500/30">{credentials.temporaryPassword}</span>
            <button
              onClick={() => copyText(`${credentials.email} / ${credentials.temporaryPassword}`)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" /> Copy
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, phone or student ID…"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
          />
        </div>
        <select aria-label="Filter by status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={inputClass}>
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Deactivated</option>
        </select>
        <select aria-label="Filter by program" value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)} className={inputClass}>
          <option value="all">All programs</option>
          {options.courses.map((course) => (
            <option key={course._id} value={course._id}>{course.title}</option>
          ))}
        </select>
        <select aria-label="Filter by batch" value={batchFilter} onChange={(e) => setBatchFilter(e.target.value)} className={inputClass}>
          <option value="all">All batches</option>
          {options.batches.map((batch) => (
            <option key={batch._id} value={batch._id}>{batchLabel(batch)}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="p-10 text-center text-slate-400 font-mono text-xs">Loading students…</div>
      ) : students.length === 0 ? (
        <div className="p-10 text-center text-slate-400 text-sm bg-slate-900/60 rounded-2xl border border-slate-800">
          No students match these filters. Use “Add Student” to create an account and assign access.
        </div>
      ) : (
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-[10px] uppercase tracking-wider font-mono text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Programs</th>
                  <th className="py-3 px-4">Batch</th>
                  <th className="py-3 px-4">Personalized</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Progress</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {students.map((student) => {
                  const avgProgress = student.courses.length
                    ? Math.round(student.courses.reduce((sum, c) => sum + (c.progressPercent || 0), 0) / student.courses.length)
                    : 0;
                  const batch = options.batches.find((b) => String(b._id) === String(student.batchId));
                  return (
                    <tr key={student._id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-white">{student.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{student.email}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {student.enrollmentNumber || 'No ID'} {student.phone ? `· ${student.phone}` : ''}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {student.courses.length === 0 ? (
                          <span className="text-[11px] text-amber-300">No program assigned</span>
                        ) : (
                          <div className="flex flex-wrap gap-1 max-w-[240px]">
                            {student.courses.map((course) => (
                              <span
                                key={String(course.courseId)}
                                className="px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-200 text-[10px] font-medium"
                              >
                                {course.title}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-[11px] font-mono text-slate-300">
                        {batch ? batch.batchCode : '—'}
                      </td>
                      <td className="py-3 px-4">
                        {student.personalizedLearning ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-200 text-[10px] font-bold">
                            <Sparkles className="w-3 h-3" /> 1-on-1
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">Group</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-1 rounded-full border text-[10px] font-mono uppercase font-bold ${STATUS_BADGE(student.isActive)}`}>
                          {student.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                            <div className="h-full bg-indigo-500" style={{ width: `${avgProgress}%` }} />
                          </div>
                          <span className="text-[10px] font-mono text-slate-400">{avgProgress}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button onClick={() => openDetail(student)} title="View profile" className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white cursor-pointer">
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => openEdit(student)} title="Edit / assign" className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 cursor-pointer">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => resetAccess(student)} title="Reset access" className="p-1.5 rounded-lg bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 cursor-pointer">
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => revokeAccess(student)} title="Remove all course access" className="p-1.5 rounded-lg bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 cursor-pointer">
                            <ShieldOff className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => toggleActive(student)}
                            title={student.isActive ? 'Deactivate' : 'Activate'}
                            className={`p-1.5 rounded-lg cursor-pointer ${student.isActive ? 'bg-emerald-500/15 text-emerald-300' : 'bg-slate-800 text-slate-400'}`}
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-slate-800 text-xs">
              <span className="text-slate-400 font-mono">
                Page {pagination.page} of {pagination.totalPages} · {pagination.total} students
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={pagination.page <= 1}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(p + 1, pagination.totalPages))}
                  disabled={pagination.page >= pagination.totalPages}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  Next <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create / edit wizard */}
      {wizardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-3xl rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 p-5">
              <div>
                <h3 className="text-lg font-bold text-white font-heading">
                  {editingId ? 'Edit student & assignments' : 'Add a new student'}
                </h3>
                <p className="text-[11px] text-slate-400 font-mono">
                  Step {step} of {WIZARD_STEPS.length} — {WIZARD_STEPS[step - 1].label}
                </p>
              </div>
              <button onClick={() => setWizardOpen(false)} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-5 pt-4 flex items-center gap-1.5 flex-wrap">
              {WIZARD_STEPS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setStep(item.id)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-mono uppercase tracking-wider border cursor-pointer ${
                    item.id === step
                      ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-200 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  {item.id}. {item.label}
                </button>
              ))}
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
              {step === 1 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Full name *</label>
                    <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Email *</label>
                    <input type="email" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Phone</label>
                    <input value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Target career (optional)</label>
                    <input value={draft.targetCareer} onChange={(e) => setDraft({ ...draft, targetCareer: e.target.value })} className={inputClass} />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={draft.generatePassword}
                      onChange={(e) => setDraft({ ...draft, generatePassword: e.target.checked })}
                      className="accent-indigo-500"
                    />
                    Generate a secure temporary password and show it once
                  </label>
                  {!draft.generatePassword && !editingId && (
                    <div>
                      <label className={labelClass}>Password</label>
                      <input
                        type="text"
                        value={draft.password}
                        onChange={(e) => setDraft({ ...draft, password: e.target.value })}
                        placeholder="At least 8 characters with a number and a symbol"
                        className={inputClass}
                      />
                    </div>
                  )}
                  <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={draft.isActive}
                      onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })}
                      className="accent-indigo-500"
                    />
                    Account active (student can log in)
                  </label>
                  <p className="text-[11px] text-slate-400 font-sans">
                    Passwords are hashed before storage — the plaintext is never saved. Students can rotate it from their profile.
                  </p>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-3">
                  <p className="text-[11px] text-slate-400">
                    Select every program this student may open. Nothing else appears in their LMS.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {options.courses.map((course) => (
                      <button
                        key={course._id}
                        type="button"
                        onClick={() => toggleCourse(course._id)}
                        className={`text-left px-3 py-2.5 rounded-xl border transition-colors cursor-pointer ${
                          draft.courseIds.includes(course._id)
                            ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-100'
                            : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="font-bold text-[11px] flex items-center gap-2">
                          <BookOpen className="w-3.5 h-3.5" />
                          {course.title}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {course.category || 'Program'} · {course.duration || 'Flexible'}
                        </div>
                      </button>
                    ))}
                  </div>

                  <label className="flex items-center gap-2 text-slate-300 cursor-pointer pt-2 border-t border-slate-800">
                    <input
                      type="checkbox"
                      checked={draft.personalizedLearning}
                      onChange={(e) => setDraft({ ...draft, personalizedLearning: e.target.checked })}
                      className="accent-amber-500"
                    />
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      Personalized 1-on-1 mentorship (separate fee &amp; duration)
                    </span>
                  </label>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-3">
                  <label className={labelClass}>Assign to a batch</label>
                  <select value={draft.batchId} onChange={(e) => setDraft({ ...draft, batchId: e.target.value })} className={inputClass}>
                    <option value="">— No batch yet —</option>
                    {options.batches.map((batch) => (
                      <option key={batch._id} value={batch._id}>
                        {batchLabel(batch)} · {batch.status || 'Upcoming'}
                      </option>
                    ))}
                  </select>
                  {draft.batchId && (() => {
                    const batch = options.batches.find((b) => String(b._id) === String(draft.batchId));
                    if (!batch) return null;
                    return (
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-300 space-y-1">
                        <div className="flex items-center gap-2"><CalendarDays className="w-3.5 h-3.5 text-indigo-400" /> Starts {batch.startDate ? new Date(batch.startDate).toLocaleDateString() : 'TBA'}</div>
                        <div>Schedule: {batch.timing || 'To be announced'}</div>
                        <div>Seats: {batch.enrolled}/{batch.maxCapacity || '—'}</div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {step === 5 && (
                <div className="space-y-3">
                  <p className="text-[11px] text-slate-400">What can this student access inside the LMS?</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      { key: 'classroom', label: 'Live classroom & lessons' },
                      { key: 'recordings', label: 'Class recordings' },
                      { key: 'assignments', label: 'Assignments & quizzes' },
                      { key: 'certificates', label: 'Certificates & credentials' },
                      { key: 'support', label: 'Support desk' },
                      { key: 'careerResources', label: 'Career & placement resources' },
                    ].map((item) => (
                      <label
                        key={item.key}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border cursor-pointer ${
                          draft.lmsAccess[item.key]
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-100'
                            : 'bg-slate-950 border-slate-800 text-slate-400'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={Boolean(draft.lmsAccess[item.key])}
                          onChange={(e) => setDraft({
                            ...draft,
                            lmsAccess: { ...draft.lmsAccess, [item.key]: e.target.checked },
                          })}
                          className="accent-emerald-500"
                        />
                        <span className="text-[11px] font-medium">{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {step === 6 && (
                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-[11px]">
                    <div className="flex items-center gap-2 text-white font-bold">
                      <Users className="w-3.5 h-3.5" /> {draft.name || '(no name)'}
                    </div>
                    <div className="text-slate-400 font-mono">{draft.email || '(no email)'} {draft.phone ? `· ${draft.phone}` : ''}</div>
                    <div className="text-slate-300">
                      Programs: {draft.courseIds.length === 0
                        ? <span className="text-amber-300">none assigned yet</span>
                        : draft.courseIds
                          .map((id) => options.courses.find((c) => c._id === id)?.title)
                          .filter(Boolean)
                          .join(', ')}
                    </div>
                    <div className="text-slate-300">
                      Batch: {draft.batchId
                        ? batchLabel(options.batches.find((b) => String(b._id) === String(draft.batchId)) || {})
                        : 'none'}
                    </div>
                    <div className="text-slate-300">
                      Personalized 1-on-1: {draft.personalizedLearning ? 'Yes' : 'No'} · Account: {draft.isActive ? 'Active' : 'Inactive'}
                    </div>
                    <div className="text-slate-300">
                      LMS access: {Object.entries(draft.lmsAccess).filter(([, v]) => v).map(([k]) => k).join(', ') || 'none'}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 p-4 border-t border-slate-800">
              <div className="text-[10px] text-slate-400 font-mono">
                {step === 1 && 'Name + email are required.'}
                {step === 3 && 'Access is enforced by the API — not just hidden in the UI.'}
                {step === 6 && 'Review, then create the account.'}
              </div>
              <div className="flex items-center gap-2">
                {step > 1 && (
                  <button
                    onClick={() => setStep((s) => s - 1)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-200 text-xs font-bold hover:bg-slate-700 cursor-pointer"
                  >
                    Back
                  </button>
                )}
                {step < WIZARD_STEPS.length ? (
                  <button
                    onClick={() => setStep((s) => s + 1)}
                    className="px-5 py-2.5 rounded-xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-100 text-xs font-bold hover:bg-indigo-500/30 cursor-pointer"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    onClick={saveStudent}
                    disabled={busy}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 text-white text-xs font-bold shadow-lg shadow-indigo-500/20 disabled:opacity-50 cursor-pointer"
                  >
                    {busy ? 'Saving…' : editingId ? 'Save Changes' : 'Create Student'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail drawer */}
      {detailOpen && detail && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-xl h-full bg-slate-900 border-l border-slate-800 overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-800 sticky top-0 bg-slate-900/95 backdrop-blur">
              <div>
                <h3 className="text-base font-bold text-white font-heading">{detail.student.name}</h3>
                <p className="text-[11px] text-slate-400 font-mono">{detail.student.email}</p>
              </div>
              <button onClick={() => setDetailOpen(false)} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-5 text-xs">
              <section className="space-y-2">
                <h4 className="text-[10px] font-mono uppercase text-slate-400">Profile & account</h4>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    ['Student ID', detail.student.enrollmentNumber || '—'],
                    ['Phone', detail.student.phone || '—'],
                    ['Status', detail.student.isActive ? 'Active' : 'Deactivated'],
                    ['Created', detail.student.createdAt ? new Date(detail.student.createdAt).toLocaleDateString() : '—'],
                    ['Personalized', detail.student.personalizedLearning ? 'Yes' : 'No'],
                    ['Target career', detail.student.targetCareer || '—'],
                  ].map(([label, value]) => (
                    <div key={label} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                      <div className="text-[10px] text-slate-400 font-mono uppercase">{label}</div>
                      <div className="text-white font-semibold">{value}</div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="space-y-2">
                <h4 className="text-[10px] font-mono uppercase text-slate-400">Assigned programs & progress</h4>
                {detail.student.courses.length === 0 && (
                  <p className="text-slate-400">No program assigned — this student cannot open any course.</p>
                )}
                {detail.student.courses.map((course) => (
                  <div key={String(course.courseId)} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-white font-bold">{course.title}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {course.duration || 'Flexible'} · {course.batchCode || 'No batch'} · {course.status}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-indigo-300 font-bold font-mono">{course.progressPercent || 0}%</div>
                      <div className="text-[10px] text-slate-400">completed</div>
                    </div>
                  </div>
                ))}
              </section>

              <section className="space-y-2">
                <h4 className="text-[10px] font-mono uppercase text-slate-400">Payments & enrollment</h4>
                {(detail.detail?.payments || []).length === 0 ? (
                  <p className="text-slate-400">No payment records yet.</p>
                ) : (
                  (detail.detail.payments || []).map((payment) => (
                    <div key={payment._id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="text-white font-bold flex items-center gap-2">
                          <CreditCard className="w-3.5 h-3.5 text-indigo-400" />
                          {payment.courseTitle}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {payment.invoiceNumber} · {payment.tier}
                          {payment.couponCode ? ` · coupon ${payment.couponCode}` : ''}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-mono font-bold">${payment.amount}</div>
                        <div className={`text-[10px] font-mono ${payment.status === 'Paid' ? 'text-emerald-300' : 'text-amber-300'}`}>
                          {payment.status}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </section>

              <section className="space-y-2">
                <h4 className="text-[10px] font-mono uppercase text-slate-400">Certificates</h4>
                {(detail.detail?.certificates || []).length === 0 ? (
                  <p className="text-slate-400">No certificates issued yet.</p>
                ) : (
                  (detail.detail.certificates || []).map((cert) => (
                    <div key={cert._id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2">
                      <Award className="w-4 h-4 text-amber-400" />
                      <div>
                        <div className="text-white font-bold">{cert.courseTitle}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{cert.certificateId}</div>
                      </div>
                    </div>
                  ))
                )}
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
