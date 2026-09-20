import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  DollarSign,
  Printer,
  FileText,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  Building,
  Mail,
  Phone,
} from 'lucide-react';
import api from '../lib/api';

export default function StudentsManager() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeInvoice, setActiveInvoice] = useState(null);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await api.get('/students');
      if (res.data.success) {
        setStudents(res.data.students);
      }
    } catch (err) {
      console.error('Failed to load students:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleUpdatePayment = async (batchId, studentId, newStatus) => {
    try {
      const res = await api.patch(`/students/${batchId}/${studentId}/payment`, {
        paymentStatus: newStatus,
      });
      if (res.data.success) {
        fetchStudents();
      }
    } catch (err) {
      console.error('Update payment failed:', err);
    }
  };

  const openInvoiceModal = async (invoiceId) => {
    try {
      const res = await api.get(`/students/${invoiceId}/invoice`);
      if (res.data.success) {
        setActiveInvoice(res.data.invoice);
        setInvoiceModalOpen(true);
      }
    } catch (err) {
      console.error('Failed to get invoice:', err);
    }
  };

  const filtered = students.filter(
    (s) =>
      s.studentName.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      s.batchCode.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 text-left">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold font-heading text-white tracking-tight">
            Student Admissions & Fee Directory
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Confirmed student roster, tuition payment ledger, and dynamic PDF invoice generation.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search student or invoice..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-sky-400"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-[#0f172a]/80 backdrop-blur-xl border border-white/[0.08] overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#0b101d] text-slate-400 uppercase text-[10px] tracking-wider border-b border-white/[0.08]">
            <tr>
              <th className="px-6 py-4 font-bold">Student Info</th>
              <th className="px-6 py-4 font-bold">Enrolled Cohort</th>
              <th className="px-6 py-4 font-bold">Tuition Fee</th>
              <th className="px-6 py-4 font-bold">Payment Status</th>
              <th className="px-6 py-4 font-bold">Invoice Ref</th>
              <th className="px-6 py-4 font-bold">Enrolled Date</th>
              <th className="px-6 py-4 font-bold text-right">Invoice</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05]">
            {filtered.map((student) => (
              <tr key={student._id} className="hover:bg-slate-800/30 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-bold text-white text-sm">{student.studentName}</div>
                  <div className="text-slate-400 text-[11px]">{student.email}</div>
                  <div className="text-slate-500 text-[10px]">{student.phone}</div>
                </td>

                <td className="px-6 py-4">
                  <span className="font-bold text-sky-400">{student.batchCode}</span>
                  <div className="text-slate-400 text-[10px]">{student.courseTitle}</div>
                </td>

                <td className="px-6 py-4">
                  <div className="font-bold text-white">${student.feePaid}</div>
                  <div className="text-[10px] text-slate-500">Total: ${student.totalFee}</div>
                </td>

                <td className="px-6 py-4">
                  <select
                    value={student.paymentStatus}
                    onChange={(e) =>
                      handleUpdatePayment(student.batchId, student._id, e.target.value)
                    }
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold border focus:outline-none ${
                      student.paymentStatus === 'Paid'
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        : student.paymentStatus === 'Partial'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                    }`}
                  >
                    <option value="Paid" className="bg-slate-900 text-white">Paid in Full</option>
                    <option value="Partial" className="bg-slate-900 text-white">Partial Deposit</option>
                    <option value="Pending" className="bg-slate-900 text-white">Payment Pending</option>
                  </select>
                </td>

                <td className="px-6 py-4 font-mono text-slate-400 text-[11px]">
                  {student.invoiceId}
                </td>

                <td className="px-6 py-4 text-slate-400 text-[11px]">
                  {new Date(student.enrolledAt).toLocaleDateString([], {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </td>

                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => openInvoiceModal(student.invoiceId)}
                    className="p-2 rounded-lg bg-slate-800 text-sky-300 hover:text-white hover:bg-slate-700 transition-colors inline-flex items-center gap-1.5"
                    title="View & Print Invoice"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>View</span>
                  </button>
                </td>
              </tr>
            ))}

            {filtered.length === 0 && !loading && (
              <tr>
                <td colSpan="7" className="px-6 py-8 text-center text-slate-500 text-xs">
                  No confirmed students found. Convert leads from the CRM tab to populate.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Dynamic Printable PDF Invoice Modal */}
      {invoiceModalOpen && activeInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-xl rounded-3xl bg-[#0f172a] border border-white/[0.12] shadow-2xl p-8 text-left text-xs overflow-hidden">
            
            {/* Action Bar (Top) */}
            <div className="flex items-center justify-between pb-6 border-b border-white/[0.08] mb-6">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="font-bold text-white uppercase tracking-wider text-xs">
                  Official Tuition Invoice
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 rounded-lg bg-sky-500/20 text-sky-300 border border-sky-500/30 hover:bg-sky-500/30 flex items-center gap-1.5 font-semibold"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / Save PDF</span>
                </button>
                <button
                  onClick={() => setInvoiceModalOpen(false)}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Document Area */}
            <div id="printable-invoice" className="space-y-6 text-slate-300">
              
              {/* Invoice Header */}
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-black font-heading text-white">American FutureTech</h2>
                  <p className="text-slate-400 mt-1">{activeInvoice.company.address}</p>
                  <p className="text-slate-400">{activeInvoice.company.city}</p>
                  <p className="text-slate-400 font-mono">{activeInvoice.company.email}</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold font-mono text-sky-400">{activeInvoice.invoiceNumber}</div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Date: {new Date(activeInvoice.issueDate).toLocaleDateString()}
                  </div>
                  <div className="mt-2 inline-block px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold uppercase text-[10px]">
                    {activeInvoice.item.status}
                  </div>
                </div>
              </div>

              {/* Student Billed To */}
              <div className="p-4 rounded-xl bg-slate-900/90 border border-white/5">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Billed Student:
                </div>
                <div className="font-bold text-white text-sm">{activeInvoice.student.name}</div>
                <div className="text-slate-400">{activeInvoice.student.email}</div>
                <div className="text-slate-500 font-mono">{activeInvoice.student.phone}</div>
              </div>

              {/* Itemized Table */}
              <div className="rounded-xl border border-white/10 overflow-hidden">
                <div className="p-3 bg-slate-900 font-bold text-white flex justify-between border-b border-white/10">
                  <span>Description</span>
                  <span>Amount</span>
                </div>
                <div className="p-4 flex justify-between items-center bg-slate-950/60">
                  <div>
                    <div className="font-semibold text-white">{activeInvoice.item.description}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Duration: {activeInvoice.item.duration} • Live Weekend Cohort
                    </div>
                  </div>
                  <div className="font-bold text-white font-mono">
                    ${activeInvoice.item.amount}
                  </div>
                </div>
              </div>

              {/* Totals */}
              <div className="flex justify-end pt-2">
                <div className="w-56 space-y-1.5 text-right font-mono">
                  <div className="flex justify-between text-slate-400">
                    <span>Total Tuition:</span>
                    <span>${activeInvoice.item.amount}</span>
                  </div>
                  <div className="flex justify-between text-emerald-400 font-bold">
                    <span>Amount Paid:</span>
                    <span>${activeInvoice.item.paid}</span>
                  </div>
                  <div className="flex justify-between text-white font-bold text-sm pt-2 border-t border-white/10">
                    <span>Balance Due:</span>
                    <span>${activeInvoice.item.balance}</span>
                  </div>
                </div>
              </div>

              {/* Footer notes */}
              <div className="pt-4 border-t border-white/10 text-[10px] text-slate-500 text-center">
                This is a digitally generated tax invoice from American FutureTech Inc. Tuition payments are subject to educational policies.
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
