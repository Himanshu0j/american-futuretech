import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Plus,
  Clock,
  Users,
  AlertCircle,
  CheckCircle2,
  Trash2,
  X,
  Sparkles,
} from 'lucide-react';
import api from '../lib/api';

export default function BatchesManager() {
  const [batches, setBatches] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // Form State
  const [courseId, setCourseId] = useState('');
  const [batchCode, setBatchCode] = useState('');
  const [startDate, setStartDate] = useState('');
  const [timing, setTiming] = useState('Sat & Sun: 10:00 AM - 12:00 PM EST');
  const [maxCapacity, setMaxCapacity] = useState(25);
  const [status, setStatus] = useState('Upcoming');

  const fetchBatchesAndCourses = async () => {
    try {
      setLoading(true);
      const [batchRes, courseRes] = await Promise.all([
        api.get('/batches'),
        api.get('/courses/admin/all'),
      ]);

      if (batchRes.data.success) setBatches(batchRes.data.batches);
      if (courseRes.data.success) {
        setCourses(courseRes.data.courses);
        if (courseRes.data.courses.length > 0 && !courseId) {
          setCourseId(courseRes.data.courses[0]._id);
        }
      }
    } catch (err) {
      console.error('Failed to load batches:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatchesAndCourses();
  }, []);

  const handleCreateBatch = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/batches', {
        course: courseId,
        batchCode,
        startDate,
        timing,
        maxCapacity: Number(maxCapacity),
        status,
      });

      if (res.data.success) {
        setModalOpen(false);
        setBatchCode('');
        fetchBatchesAndCourses();
      }
    } catch (err) {
      console.error('Failed to create batch:', err);
    }
  };

  const handleDeleteBatch = async (id) => {
    if (!window.confirm('Are you sure you want to remove this batch?')) return;
    try {
      await api.delete(`/batches/${id}`);
      setBatches((prev) => prev.filter((b) => b._id !== id));
    } catch (err) {
      console.error('Failed to delete batch:', err);
    }
  };

  return (
    <div className="space-y-6 text-left">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold font-heading text-white tracking-tight">
            Cohort Scheduling & Seat Capacity Manager
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage live cohorts, student seat counts, and dynamic scarcity triggers on the landing page.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 text-white font-bold text-xs shadow-lg flex items-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule New Cohort</span>
        </button>
      </div>

      {/* Cohort Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl bg-[#0f172a]/80 border border-white/[0.08] p-6 space-y-4">
              <div className="flex justify-between">
                <div className="h-6 w-24 bg-slate-800 rounded-full" />
                <div className="h-5 w-16 bg-slate-800 rounded" />
              </div>
              <div className="h-6 w-3/4 bg-slate-800 rounded" />
              <div className="h-4 w-1/2 bg-slate-800/60 rounded" />
              <div className="h-10 w-full bg-slate-800/40 rounded-xl" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {batches.map((batch) => {
          const enrolled = batch.enrolledStudents?.length || 0;
          const remaining = Math.max(0, batch.maxCapacity - enrolled);
          const percentFull = Math.min(100, Math.round((enrolled / batch.maxCapacity) * 100));

          return (
            <div
              key={batch._id}
              className="rounded-2xl bg-[#0f172a]/80 backdrop-blur-xl border border-white/[0.08] p-6 flex flex-col justify-between relative overflow-hidden transition-all duration-300 hover:border-sky-400/40"
            >
              {/* Top Details */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-1 rounded-full bg-sky-500/15 border border-sky-400/30 text-sky-400 text-xs font-mono font-bold">
                    {batch.batchCode}
                  </span>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      batch.status === 'Upcoming'
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-emerald-500/20 text-emerald-400'
                    }`}
                  >
                    {batch.status}
                  </span>
                </div>

                <h3 className="text-lg font-bold font-heading text-white tracking-tight">
                  {batch.course?.title || 'Certification Cohort'}
                </h3>

                <div className="mt-4 space-y-2 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-sky-400" />
                    <span>Starts: {new Date(batch.startDate).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-sky-400" />
                    <span>{batch.timing}</span>
                  </div>
                </div>

                {/* Seat Capacity Progress Bar */}
                <div className="mt-6 pt-4 border-t border-white/[0.06]">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-slate-400">Enrollment Capacity</span>
                    <span className="font-bold text-white">
                      {enrolled} / {batch.maxCapacity} ({percentFull}%)
                    </span>
                  </div>

                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      style={{ width: `${percentFull}%` }}
                      className={`h-full rounded-full transition-all duration-500 ${
                        percentFull > 80 ? 'bg-rose-500' : 'bg-sky-500'
                      }`}
                    />
                  </div>

                  {/* Urgency Badge */}
                  <div className="mt-3 p-2 rounded-lg bg-slate-900/80 border border-white/5 flex items-center gap-2 text-[11px] text-amber-300">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                    <span>Urgency Trigger: {remaining} seats left</span>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  {enrolled} confirmed students
                </span>

                <button
                  onClick={() => handleDeleteBatch(batch._id)}
                  className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors"
                  title="Delete Cohort"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

            </div>
          );
        })}
      </div>
      )}

      {/* Schedule Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-lg rounded-3xl bg-[#0f172a] border border-white/[0.12] shadow-2xl p-7 text-left">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-white">Schedule New Cohort</h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBatch} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Select Program</label>
                <select
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs"
                >
                  {courses.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Batch Code (e.g. DS-2026-NOV)</label>
                  <input
                    type="text"
                    required
                    placeholder="DS-2026-NOV"
                    value={batchCode}
                    onChange={(e) => setBatchCode(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Class Schedule & Timings</label>
                <input
                  type="text"
                  required
                  value={timing}
                  onChange={(e) => setTiming(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Max Seat Capacity</label>
                  <input
                    type="number"
                    value={maxCapacity}
                    onChange={(e) => setMaxCapacity(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Cohort Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs"
                  >
                    <option value="Upcoming">Upcoming</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-white/[0.08] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold"
                >
                  Publish Cohort
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
