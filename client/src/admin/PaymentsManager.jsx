import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import {
  CreditCard,
  DollarSign,
  Receipt,
  Search,
  Filter,
  Download,
  Printer,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  User,
  X,
  RefreshCw
} from 'lucide-react';

export default function PaymentsManager() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [gateway, setGateway] = useState(null);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      // Same lookup order as the shared api client: the admin token wins.
      const token = localStorage.getItem('aft_admin_token') || localStorage.getItem('token');
      const res = await axios.get('/api/payments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setPayments(res.data.payments || []);
        if (res.data.gateway) setGateway(res.data.gateway);
      }
    } catch (err) {
      console.error('Failed to fetch payments:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredPayments = payments.filter((p) => {
    const matchesSearch =
      (p.invoiceNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.student?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.student?.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.course?.title || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalRevenue = payments
    .filter(p => p.status === 'Paid')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const depositCount = payments.filter(p => p.tier === 'deposit').length;
  const fullTuitionCount = payments.filter(p => p.tier === 'full' || p.tier === 'personalized').length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono uppercase tracking-widest mb-2">
            <DollarSign className="w-3.5 h-3.5" />
            Financial Transactions
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white font-heading">
            Tuition Billing & Payments CRM
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Real-time tracking of student seat deposits, full tuition checkouts, and automated invoice records.
          </p>
          {gateway && (
            <div
              className={`mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[11px] font-mono ${
                gateway.ready
                  ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300'
                  : gateway.configured
                    ? 'bg-amber-500/10 border-amber-500/25 text-amber-300'
                    : 'bg-rose-500/10 border-rose-500/25 text-rose-300'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              Stripe checkout: {gateway.mode.toUpperCase()}
              {!gateway.ready && (
                <span className="font-sans opacity-90">
                  — {gateway.configured ? 'webhook secret missing, enrollments cannot auto-confirm' : 'card payments disabled, checkout falls back to manual enquiry'}
                </span>
              )}
            </div>
          )}
        </div>

        <button
          onClick={fetchPayments}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono transition-colors self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Data
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-slate-400 uppercase">Total Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            ${totalRevenue.toLocaleString()} USD
          </div>
          <div className="text-[11px] text-slate-400 font-mono mt-1">Verified gross deposits</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-slate-400 uppercase">Total Transactions</span>
            <Receipt className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">{payments.length}</div>
          <div className="text-[11px] text-slate-400 font-mono mt-1">All recorded payments</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-slate-400 uppercase">$99 Seat Reservations</span>
            <CreditCard className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-blue-400 font-mono">{depositCount}</div>
          <div className="text-[11px] text-slate-400 font-mono mt-1">High-intent reserved seats</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-slate-400 uppercase">Full Tuition Paid</span>
            <CheckCircle2 className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-400 font-mono">{fullTuitionCount}</div>
          <div className="text-[11px] text-slate-400 font-mono mt-1">100% upfront tuition</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by student, invoice #, or course..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500 placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          {['ALL', 'Paid', 'Pending', 'Failed', 'Expired'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider transition-all whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-indigo-500 text-slate-950 font-bold shadow-md shadow-indigo-500/20'
                  : 'bg-slate-950/80 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Data Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden backdrop-blur-xl">
        {loading ? (
          <div className="p-12 text-center text-slate-400 font-mono text-xs">
            Loading financial ledger...
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            No transactions found matching criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/70 text-xs font-mono text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-5">Invoice #</th>
                  <th className="py-3.5 px-5">Student</th>
                  <th className="py-3.5 px-5">Course</th>
                  <th className="py-3.5 px-5">Tier</th>
                  <th className="py-3.5 px-5">Amount</th>
                  <th className="py-3.5 px-5">Date</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs font-mono">
                {filteredPayments.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-5 font-bold text-indigo-400">
                      {p.invoiceNumber || 'INV-2026-N/A'}
                    </td>
                    <td className="py-3.5 px-5 font-sans font-medium text-white">
                      <div>{p.student?.name || p.studentName || 'Guest Checkout'}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{p.student?.email || p.email}</div>
                    </td>
                    <td className="py-3.5 px-5 font-sans text-slate-300">
                      {p.course?.title || p.courseTitle || 'Technical Program'}
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="inline-flex px-2 py-0.5 rounded text-[11px] bg-slate-800 text-slate-300 border border-slate-700">
                        {p.tier === 'deposit' ? '$99 Deposit' : p.tier === 'personalized' ? 'Personalized' : 'Full Tuition'}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 font-bold text-emerald-400">
                      ${p.amount} {p.currency || 'USD'}
                    </td>
                    <td className="py-3.5 px-5 text-slate-400">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] ${
                        p.status === 'Paid'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : p.status === 'Pending'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right font-sans">
                      <button
                        onClick={() => setSelectedInvoice(p)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                      >
                        <Receipt className="w-3.5 h-3.5 text-indigo-400" />
                        Invoice
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Admin Invoice Modal */}
      <AnimatePresence>
        {selectedInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 overflow-hidden space-y-6"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-lg font-bold text-white font-mono">
                    {selectedInvoice.invoiceNumber}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-500 text-slate-950 text-xs font-bold"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Print
                  </button>
                  <button
                    onClick={() => setSelectedInvoice(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="space-y-4 text-xs font-mono text-slate-300">
                <div className="grid grid-cols-2 gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                  <div>
                    <span className="text-slate-400 block">STUDENT:</span>
                    <span className="text-white font-bold">{selectedInvoice.student?.name || 'Guest'}</span>
                    <div className="text-slate-400">{selectedInvoice.student?.email || selectedInvoice.email}</div>
                  </div>
                  <div>
                    <span className="text-slate-400 block">TRANSACTION ID:</span>
                    <span className="text-indigo-400 font-bold break-all">{selectedInvoice.transactionId || selectedInvoice._id}</span>
                  </div>
                </div>

                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Course:</span>
                    <span className="text-white font-bold">{selectedInvoice.course?.title || selectedInvoice.courseTitle}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Tier:</span>
                    <span className="text-white">{selectedInvoice.tier === 'deposit' ? '$99 Seat Deposit' : selectedInvoice.tier === 'personalized' ? 'Personalized 1-on-1 Track' : 'Full Tuition'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Payment Gateway:</span>
                    <span className="text-white">{selectedInvoice.paymentMethod || 'Stripe / Credit Card'}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-800 text-sm">
                    <span className="text-slate-300 font-bold">Total Amount:</span>
                    <span className="text-emerald-400 font-bold">${selectedInvoice.amount} USD</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
