import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  CreditCard,
  DollarSign,
  Receipt,
  Search,
  Download,
  Printer,
  CheckCircle2,
  AlertTriangle,
  User,
  X,
  RefreshCw,
  Settings,
  RotateCcw,
  Info,
} from 'lucide-react';

const STATUS_STYLES = {
  Paid: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  Pending: 'bg-amber-500/10 text-amber-300 border border-amber-500/20',
  Failed: 'bg-red-500/10 text-red-400 border border-red-500/20',
  Expired: 'bg-slate-500/10 text-slate-300 border border-slate-500/20',
  Refunded: 'bg-purple-500/10 text-purple-300 border border-purple-500/20',
};

const tierLabel = (tier) =>
  tier === 'deposit' ? 'Seat Deposit' : tier === 'personalized' ? 'Personalized 1-on-1' : tier === 'installment' ? 'Installment' : 'Full Tuition';

const csvCell = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;

export default function PaymentsManager() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [gateway, setGateway] = useState(null);
  const [recheckingId, setRecheckingId] = useState('');
  const [recheckMessage, setRecheckMessage] = useState({ type: '', message: '' });

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      // Same lookup order as the shared api client: the admin token wins.
      const token = localStorage.getItem('aft_admin_token') || localStorage.getItem('token');
      const res = await axios.get('/api/payments', {
        headers: { Authorization: `Bearer ${token}` },
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

  /**
   * Ask Stripe directly about one Pending order. This is the recovery path when a
   * webhook delivery was lost: if the money is there the order settles (and the
   * student gets access), otherwise nothing changes.
   */
  const recheckWithStripe = async (payment) => {
    setRecheckingId(payment._id);
    setRecheckMessage({ type: '', message: '' });
    try {
      const token = localStorage.getItem('aft_admin_token') || localStorage.getItem('token');
      const res = await axios.post(
        `/api/payments/${payment._id}/reconcile`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setRecheckMessage({
        type: res.data?.settled ? 'success' : 'info',
        message: res.data?.message || 'Re-checked with Stripe.',
      });
      await fetchPayments();
    } catch (err) {
      setRecheckMessage({
        type: 'error',
        message: err.response?.data?.message || 'The re-check request failed.',
      });
    } finally {
      setRecheckingId('');
    }
  };

  const filteredPayments = payments.filter((p) => {
    const haystack = [
      p.invoiceNumber,
      p.studentName,
      p.email,
      p.phone,
      p.courseTitle,
      p.course?.title,
      p.student?.name,
      p.student?.email,
      p.transactionId,
      p.stripePaymentIntentId,
      p.checkoutSessionId,
      p.couponCode,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    const matchesSearch = haystack.includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalRevenue = payments
    .filter((p) => p.status === 'Paid')
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalDiscounts = payments
    .filter((p) => p.status === 'Paid')
    .reduce((sum, p) => sum + (p.discountAmount || 0), 0);
  const depositCount = payments.filter((p) => p.tier === 'deposit').length;
  const unpaidCount = payments.filter((p) => p.status !== 'Paid').length;

  /** Full ledger download — every gateway field, so accounts needs no screenshots. */
  const exportCsv = () => {
    const header = [
      'Invoice',
      'Status',
      'Student',
      'Email',
      'Phone',
      'Enrollment No',
      'Course',
      'Tier',
      'Currency',
      'Amount',
      'List Price',
      'Discount',
      'Coupon',
      'Payment Method',
      'Stripe Payment Intent',
      'Stripe Checkout Session',
      'Transaction ID',
      'Created',
      'Paid At',
      'Failure Reason',
    ];
    const rows = filteredPayments.map((p) => [
      p.invoiceNumber,
      p.status,
      p.student?.name || p.studentName,
      p.student?.email || p.email,
      p.student?.phone || p.phone,
      p.student?.studentDetails?.enrollmentNumber || '',
      p.course?.title || p.courseTitle,
      tierLabel(p.tier),
      p.currency || 'USD',
      p.amount,
      p.originalPrice ?? '',
      p.discountAmount || 0,
      p.couponCode || '',
      p.paymentMethod || '',
      p.stripePaymentIntentId || '',
      p.checkoutSessionId || '',
      p.transactionId || '',
      p.createdAt ? new Date(p.createdAt).toISOString() : '',
      p.paidAt ? new Date(p.paidAt).toISOString() : '',
      p.failureReason || '',
    ]);
    const csv = [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `aft-payments-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const gatewayNote = !gateway
    ? ''
    : gateway.ready
      ? null
      : gateway.configured
        ? 'Webhook secret missing — payments can start but enrollments will not auto-confirm.'
        : 'Card payments are not switched on yet — checkout falls back to the manual enquiry form.';

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono uppercase tracking-widest mb-2">
            <DollarSign className="w-3.5 h-3.5" />
            Financial Transactions
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white font-heading">
            Tuition Billing & Payments CRM
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Every Stripe checkout, seat deposit and invoice — with the gateway references kept for reconciliation.
          </p>
          {gateway && (
            <div
              className={`mt-3 inline-flex flex-wrap items-center gap-2 px-3 py-1.5 rounded-xl border text-[11px] font-mono ${
                gateway.ready
                  ? 'bg-blue-500/10 border-blue-500/25 text-blue-300'
                  : 'bg-red-500/10 border-red-500/25 text-red-300'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              Stripe checkout: {gateway.mode.toUpperCase()}
              {gatewayNote && <span className="font-sans opacity-90">— {gatewayNote}</span>}
              {!gateway.ready && (
                <Link
                  to="/admin/settings?tab=payments"
                  className="inline-flex items-center gap-1 font-sans font-semibold underline decoration-dotted"
                >
                  <Settings className="w-3 h-3" /> Fix in Settings → Payment Gateway
                </Link>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={exportCsv}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
          <button
            onClick={fetchPayments}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-slate-400 uppercase">Total Revenue</span>
            <DollarSign className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-blue-400 font-mono">
            ${totalRevenue.toLocaleString()} USD
          </div>
          <div className="text-[11px] text-slate-400 font-mono mt-1">
            Verified gross · ${totalDiscounts.toLocaleString()} discounted
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-slate-400 uppercase">Total Transactions</span>
            <Receipt className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">{payments.length}</div>
          <div className="text-[11px] text-slate-400 font-mono mt-1">All recorded payments</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-slate-400 uppercase">Seat Reservations</span>
            <CreditCard className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-blue-400 font-mono">{depositCount}</div>
          <div className="text-[11px] text-slate-400 font-mono mt-1">Partial / deposit tier orders</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-slate-400 uppercase">Not Settled</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className={`text-2xl font-black font-mono ${unpaidCount ? 'text-amber-300' : 'text-white'}`}>
            {unpaidCount}
          </div>
          <div className="text-[11px] text-slate-400 font-mono mt-1">Pending, failed or expired</div>
        </div>
      </div>

      {recheckMessage.message && (
        <div
          className={`flex items-start gap-2 px-4 py-3 rounded-xl border text-xs ${
            recheckMessage.type === 'error'
              ? 'bg-red-500/10 border-red-500/30 text-red-200'
              : recheckMessage.type === 'success'
                ? 'bg-blue-500/10 border-blue-500/30 text-blue-200'
                : 'bg-slate-800/60 border-slate-700 text-slate-200'
          }`}
        >
          {recheckMessage.type === 'error' ? (
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          ) : (
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
          )}
          <span>{recheckMessage.message}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search student, email, invoice #, Stripe id, coupon..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500 placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          {['ALL', 'Paid', 'Pending', 'Failed', 'Expired', 'Refunded'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider transition-all whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/20'
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
                  <th className="py-3.5 px-5">Gateway Reference</th>
                  <th className="py-3.5 px-5">Date</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs font-mono">
                {filteredPayments.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-800/30 transition-colors align-top">
                    <td className="py-3.5 px-5 font-bold text-blue-400">
                      {p.invoiceNumber || 'INV-N/A'}
                    </td>
                    <td className="py-3.5 px-5 font-sans font-medium text-white">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3 h-3 text-slate-400" />
                        {p.student?.name || p.studentName || 'Guest Checkout'}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">{p.student?.email || p.email}</div>
                      {(p.student?.phone || p.phone) && (
                        <div className="text-[11px] text-slate-400 font-mono">{p.student?.phone || p.phone}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-5 font-sans text-slate-300">
                      {p.course?.title || p.courseTitle || 'Technical Program'}
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="inline-flex px-2 py-0.5 rounded text-[11px] bg-slate-800 text-slate-300 border border-slate-700">
                        {tierLabel(p.tier)}
                      </span>
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="font-bold text-blue-400">
                        ${p.amount} {p.currency || 'USD'}
                      </div>
                      {Number(p.discountAmount) > 0 && (
                        <div className="text-[11px] text-slate-400">
                          was ${p.originalPrice} · −${p.discountAmount} {p.couponCode ? `(${p.couponCode})` : ''}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-slate-400">
                      <div className="text-[11px]">{p.paymentMethod || 'Stripe Checkout'}</div>
                      {p.stripePaymentIntentId && (
                        <div className="text-[10px] text-slate-400 break-all">{p.stripePaymentIntentId}</div>
                      )}
                      {!p.stripePaymentIntentId && p.transactionId && (
                        <div className="text-[10px] text-slate-400 break-all">{p.transactionId}</div>
                      )}
                      {p.failureReason && (
                        <div className="text-[10px] text-red-300 mt-1 max-w-[220px]">{p.failureReason}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-slate-400">
                      <div>{new Date(p.paidAt || p.createdAt).toLocaleDateString()}</div>
                      <div className="text-[10px] text-slate-400">
                        {p.paidAt ? 'paid' : `created ${new Date(p.createdAt).toLocaleTimeString()}`}
                      </div>
                    </td>
                    <td className="py-3.5 px-5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] ${
                          STATUS_STYLES[p.status] || STATUS_STYLES.Pending
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right font-sans">
                      <div className="flex items-center justify-end gap-2">
                        {p.status === 'Pending' && p.checkoutSessionId && (
                          <button
                            onClick={() => recheckWithStripe(p)}
                            disabled={recheckingId === p._id}
                            title="Ask Stripe whether this order was actually paid"
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-amber-200 text-xs font-semibold transition-colors disabled:opacity-50"
                          >
                            <RotateCcw className={`w-3.5 h-3.5 ${recheckingId === p._id ? 'animate-spin' : ''}`} />
                            {recheckingId === p._id ? 'Checking…' : 'Re-check'}
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedInvoice(p)}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                        >
                          <Receipt className="w-3.5 h-3.5 text-blue-400" />
                          Invoice
                        </button>
                      </div>
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
              className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 space-y-6"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-blue-400" />
                  <h3 className="text-lg font-bold text-white font-mono">
                    {selectedInvoice.invoiceNumber}
                  </h3>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-mono ${
                      STATUS_STYLES[selectedInvoice.status] || STATUS_STYLES.Pending
                    }`}
                  >
                    {selectedInvoice.status}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold"
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                  <div>
                    <span className="text-slate-400 block">STUDENT</span>
                    <span className="text-white font-bold">
                      {selectedInvoice.student?.name || selectedInvoice.studentName || 'Guest'}
                    </span>
                    <div className="text-slate-400">
                      {selectedInvoice.student?.email || selectedInvoice.email}
                    </div>
                    {(selectedInvoice.student?.phone || selectedInvoice.phone) && (
                      <div className="text-slate-400">{selectedInvoice.student?.phone || selectedInvoice.phone}</div>
                    )}
                    {selectedInvoice.student?.studentDetails?.enrollmentNumber && (
                      <div className="text-slate-400">
                        Enrollment #{selectedInvoice.student.studentDetails.enrollmentNumber}
                      </div>
                    )}
                  </div>
                  <div>
                    <span className="text-slate-400 block">PAYMENT REFERENCE</span>
                    <span className="text-blue-400 font-bold break-all">
                      {selectedInvoice.stripePaymentIntentId || selectedInvoice.transactionId || selectedInvoice._id}
                    </span>
                    <div className="text-slate-400">
                      Invoice date: {new Date(selectedInvoice.createdAt).toLocaleString()}
                    </div>
                    {selectedInvoice.paidAt && (
                      <div className="text-slate-400">Paid at: {new Date(selectedInvoice.paidAt).toLocaleString()}</div>
                    )}
                  </div>
                </div>

                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-400">Course:</span>
                    <span className="text-white font-bold text-right">
                      {selectedInvoice.course?.title || selectedInvoice.courseTitle}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-400">Tier:</span>
                    <span className="text-white">{tierLabel(selectedInvoice.tier)}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-400">Payment gateway:</span>
                    <span className="text-white">{selectedInvoice.paymentMethod || 'Stripe / Credit Card'}</span>
                  </div>
                  {selectedInvoice.checkoutSessionId && (
                    <div className="flex justify-between gap-4">
                      <span className="text-slate-400">Checkout session:</span>
                      <span className="text-slate-300 break-all text-right">{selectedInvoice.checkoutSessionId}</span>
                    </div>
                  )}
                  {(selectedInvoice.discountAmount > 0 || selectedInvoice.couponCode) && (
                    <div className="flex justify-between gap-4">
                      <span className="text-slate-400">Discount:</span>
                      <span className="text-white text-right">
                        −${selectedInvoice.discountAmount || 0}
                        {selectedInvoice.couponCode ? ` · ${selectedInvoice.couponLabel || selectedInvoice.couponCode}` : ''}
                      </span>
                    </div>
                  )}
                  {selectedInvoice.originalPrice && (
                    <div className="flex justify-between gap-4">
                      <span className="text-slate-400">List price:</span>
                      <span className="text-slate-400 text-right">
                        ${selectedInvoice.originalPrice} {selectedInvoice.currency || 'USD'}
                      </span>
                    </div>
                  )}
                  {selectedInvoice.failureReason && (
                    <div className="flex justify-between gap-4">
                      <span className="text-slate-400">Reason:</span>
                      <span className="text-red-300 text-right">{selectedInvoice.failureReason}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-slate-800 text-sm">
                    <span className="text-slate-300 font-bold">Total amount:</span>
                    <span className="text-blue-400 font-bold">
                      ${selectedInvoice.amount} {selectedInvoice.currency || 'USD'}
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 font-sans">
                  Amounts are computed on the server and settled only by Stripe's signature-verified webhook — this record
                  cannot be marked paid from a browser.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
