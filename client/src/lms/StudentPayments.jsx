import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  CreditCard,
  Receipt,
  Download,
  Printer,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Building,
  DollarSign,
  ChevronRight,
  X
} from 'lucide-react';

export default function StudentPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/payments/my-payments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setPayments(res.data.payments || []);
      }
    } catch (err) {
      console.error('Failed to fetch payments:', err);
    } finally {
      setLoading(false);
    }
  };

  const totalPaid = payments
    .filter(p => p.status === 'Paid')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const printInvoice = () => {
    window.print();
  };

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EFE6D6] border border-[#E5C275]/40 text-[#0B1220] text-xs font-bold uppercase tracking-wider mb-2">
            <CreditCard className="w-3.5 h-3.5 text-[#4338CA]" />
            <span>Official Billing Ledger</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-heading font-black tracking-tight text-[#0B1220]">
            Tuition Ledger & Official Invoices
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm mt-1 leading-relaxed max-w-xl">
            Download or inspect verified receipts, tuition breakdown, and $99 cohort seat deposit statements.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-5 py-3 rounded-2xl bg-white border border-slate-200 text-right shadow-xs">
            <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Total Settled</div>
            <div className="text-2xl font-heading font-black text-[#4338CA] mt-0.5">
              ${totalPaid.toLocaleString()} <span className="text-xs font-sans text-slate-500">USD</span>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Invoices</span>
            <Receipt className="w-4 h-4 text-[#4338CA]" />
          </div>
          <div className="text-2xl font-heading font-black text-[#0B1220]">{payments.length}</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Settled Payments</span>
            <CheckCircle2 className="w-4 h-4 text-[#4338CA]" />
          </div>
          <div className="text-2xl font-heading font-black text-[#4338CA]">
            {payments.filter(p => p.status === 'Paid').length}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Enrollment Standing</span>
            <ShieldCheck className="w-4 h-4 text-[#4338CA]" />
          </div>
          <div className="text-sm font-bold text-[#0B1220] mt-1">Active Student • Good Standing</div>
        </div>
      </div>

      {/* Payments Table / List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(n => (
            <div key={n} className="h-16 rounded-xl bg-white border border-slate-200 animate-pulse shadow-xs" />
          ))}
        </div>
      ) : payments.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center max-w-xl mx-auto shadow-xs">
          <Receipt className="w-12 h-12 mx-auto text-slate-400 mb-3" />
          <h3 className="text-base font-heading font-bold text-[#0B1220] mb-1">No Invoices Found</h3>
          <p className="text-slate-500 text-xs mb-6">
            You currently have no recorded payments or invoice receipts in your student portal.
          </p>
          <Link
            to="/courses"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#4338CA] hover:bg-[#3730A3] text-white font-bold text-xs shadow-xs transition-colors"
          >
            Explore Courses & Reserve Seat
          </Link>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-[#F7F7F5] text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3.5 px-6">Invoice #</th>
                  <th className="py-3.5 px-6">Program / Item</th>
                  <th className="py-3.5 px-6">Enrollment Track</th>
                  <th className="py-3.5 px-6">Settled</th>
                  <th className="py-3.5 px-6">Date</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {payments.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-6 font-mono font-bold text-[#0B1220]">
                      {p.invoiceNumber || 'INV-2026-N/A'}
                    </td>
                    <td className="py-4 px-6 font-bold text-slate-800">
                      {p.course?.title || p.courseTitle || 'Applied Engineering Program'}
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#F7F7F5] text-slate-700 border border-slate-200">
                        {p.tier === 'deposit' ? '$99 Seat Deposit' : p.tier === 'personalized' ? 'Personalized Track' : 'Full Tuition'}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-mono font-bold text-[#4338CA]">
                      ${p.amount} {p.currency || 'USD'}
                    </td>
                    <td className="py-4 px-6 text-slate-500 font-mono">
                      {new Date(p.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        p.status === 'Paid'
                          ? 'bg-[#EFE6D6] text-[#0B1220]'
                          : p.status === 'Pending'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {p.status === 'Paid' && <CheckCircle2 className="w-3 h-3 text-[#4338CA]" />}
                        {p.status === 'Pending' && <Clock className="w-3 h-3 text-amber-700" />}
                        {p.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => setSelectedInvoice(p)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-slate-100 border border-slate-300 text-[#0B1220] text-xs font-semibold shadow-xs transition-all"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        <span>View Statement</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Invoice Modal Preview */}
      <AnimatePresence>
        {selectedInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="relative w-full max-w-2xl rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-[#F7F7F5]">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-[#4338CA]" />
                  <h3 className="text-sm font-bold text-[#0B1220] font-mono">
                    {selectedInvoice.invoiceNumber || 'INVOICE RECEIPT'}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={printInvoice}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#4338CA] hover:bg-[#3730A3] text-white text-xs font-bold transition-colors shadow-xs"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Print Receipt
                  </button>
                  <button
                    onClick={() => setSelectedInvoice(null)}
                    className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Printable Invoice Body */}
              <div className="p-8 overflow-y-auto space-y-6 text-slate-700 print:text-black print:bg-white text-xs" id="printable-area">
                {/* Org & Address */}
                <div className="flex justify-between items-start border-b border-slate-200 pb-6">
                  <div>
                    <div className="text-lg font-heading font-black tracking-tight text-[#0B1220]">
                      AMERICAN FUTURETECH LLC
                    </div>
                    <div className="text-xs text-slate-500 mt-1 leading-relaxed">
                      30 N Gould St Ste R, Sheridan, WY 82801, United States<br />
                      info@americantechgloballlc.com | +1 (816) 846-6717
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-[#EFE6D6] text-[#0B1220] uppercase">
                      {selectedInvoice.status}
                    </span>
                    <div className="text-xs text-slate-600 font-mono mt-2">
                      Date: {new Date(selectedInvoice.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Billed To */}
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block uppercase tracking-wider text-[10px] font-bold">BILLED TO:</span>
                    <div className="text-[#0B1220] font-bold mt-1 text-sm">
                      {selectedInvoice.student?.name || 'Student Account'}
                    </div>
                    <div className="text-slate-600 text-xs">{selectedInvoice.student?.email || selectedInvoice.email}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 block uppercase tracking-wider text-[10px] font-bold">TRANSACTION ID:</span>
                    <div className="text-[#0B1220] font-mono font-bold mt-1 break-all text-xs">
                      {selectedInvoice.transactionId || selectedInvoice._id}
                    </div>
                    <div className="text-slate-500 text-xs mt-0.5">Method: {selectedInvoice.paymentMethod || 'Credit / Debit Card'}</div>
                  </div>
                </div>

                {/* Line Items */}
                <div className="rounded-xl border border-slate-200 overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F7F7F5] text-slate-600 uppercase font-bold text-[11px] border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-4">Item Description</th>
                        <th className="py-2.5 px-4 text-center">Qty</th>
                        <th className="py-2.5 px-4 text-right">Price</th>
                        <th className="py-2.5 px-4 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="py-3 px-4">
                          <div className="font-bold text-[#0B1220]">
                            {selectedInvoice.course?.title || selectedInvoice.courseTitle || 'Applied Engineering Curriculum'}
                          </div>
                          <div className="text-slate-500 text-[11px] mt-0.5">
                            {selectedInvoice.tier === 'deposit'
                              ? 'Cohort Seat Reservation Deposit (Deducted from final tuition)'
                              : 'Full Tuition Specialization Track'}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-slate-600">1</td>
                        <td className="py-3 px-4 text-right font-mono text-slate-600">${selectedInvoice.amount}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-[#0B1220]">
                          ${selectedInvoice.amount} USD
                        </td>
                      </tr>
                    </tbody>
                    <tfoot className="bg-[#F7F7F5] font-mono border-t border-slate-200">
                      <tr>
                        <td colSpan={3} className="py-3 px-4 text-right font-bold text-slate-600">TOTAL:</td>
                        <td className="py-3 px-4 text-right font-bold text-[#4338CA] text-sm">
                          ${selectedInvoice.amount} USD
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <div className="pt-4 text-[11px] text-slate-500 text-center leading-relaxed">
                  American FutureTech LLC is a registered US educational provider headquartered in Sheridan, Wyoming. Tuition fees are subject to academic enrollment policies. For questions, contact info@americantechgloballlc.com.
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
