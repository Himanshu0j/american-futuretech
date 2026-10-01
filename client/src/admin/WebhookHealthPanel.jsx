import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  ShieldAlert,
  Clock,
  RotateCcw,
  Webhook,
  Info,
} from 'lucide-react';

const authHeaders = () => {
  const token = localStorage.getItem('aft_admin_token') || localStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
};

const STATUS_STYLE = {
  processed: 'bg-blue-500/10 text-blue-300 border-blue-500/25',
  pending: 'bg-amber-500/10 text-amber-300 border-amber-500/25',
  duplicate: 'bg-slate-500/10 text-slate-300 border-slate-500/25',
  unmatched: 'bg-amber-500/10 text-amber-300 border-amber-500/25',
  failed: 'bg-red-500/10 text-red-300 border-red-500/25',
  rejected: 'bg-red-500/10 text-red-300 border-red-500/25',
  ignored: 'bg-slate-500/10 text-slate-300 border-slate-500/25',
};

/** "2 minutes ago" reads faster than an ISO timestamp when something is wrong. */
const relative = (value) => {
  if (!value) return 'never';
  const diff = Date.now() - new Date(value).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hr ago`;
  return `${Math.round(hours / 24)} day(s) ago`;
};

const STATUS_HELP = {
  processed: 'Verified and acted on — a paid order was settled, or a failed one was recorded.',
  pending: 'Stripe called us but the money had not settled yet. Usually normal; the next event settles it.',
  duplicate: 'A Stripe retry of an event we had already handled. Nothing changed (this is what stops double enrollments).',
  unmatched: 'We could not match the event to a payment record.',
  failed: 'Our handler threw, so Stripe will retry. If this repeats, check the message column.',
  rejected: 'The request claimed to be from Stripe but the signature did not match. A wrong signing secret looks like this — so does a stranger probing the endpoint.',
  ignored: 'Verified, but an event type this platform does not act on.',
};

/**
 * Admin → Settings → Payment Gateway → Webhook health.
 *
 * Answers the one question nobody can answer from Stripe's dashboard alone:
 * did Stripe actually call us when the student paid, and what did we do with it?
 * Also lets the admin re-check a Pending order directly with Stripe, which is the
 * recovery path when a delivery was lost.
 */
export default function WebhookHealthPanel() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [busyId, setBusyId] = useState('');
  const [actionMessage, setActionMessage] = useState({ type: '', message: '' });

  const load = useCallback(async (filter = statusFilter) => {
    try {
      setLoading(true);
      setError('');
      const res = await axios.get('/api/payments/webhook-events', {
        headers: authHeaders(),
        params: { limit: 25, status: filter },
      });
      if (res.data.success) setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load webhook activity.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    load(statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const recheck = async (payment) => {
    setBusyId(payment._id);
    setActionMessage({ type: '', message: '' });
    try {
      const res = await axios.post(
        `/api/payments/${payment._id}/reconcile`,
        {},
        { headers: authHeaders() },
      );
      setActionMessage({
        type: res.data?.settled ? 'success' : 'info',
        message: res.data?.message || 'Re-checked with Stripe.',
      });
      await load(statusFilter);
    } catch (err) {
      setActionMessage({
        type: 'error',
        message: err.response?.data?.message || 'The re-check request failed.',
      });
    } finally {
      setBusyId('');
    }
  };

  const summary = data?.summary;
  const stuck = data?.stuck || [];
  const lastFailure = summary?.lastFailure;

  return (
    <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-5 backdrop-blur-xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-white font-heading flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-400" />
            Webhook health
          </h3>
          <p className="text-[11px] text-slate-400 leading-relaxed mt-1 max-w-2xl">
            Stripe har payment par humein message bhejta hai. Yahin dikhta hai ki wo message aaya, kya hua usme, aur
            koi delivery fail hui to kyun. Kisi payment ka access atak gaya ho to usi row par <b>Re-check</b> dabayein.
          </p>
        </div>
        <button
          type="button"
          onClick={() => load(statusFilter)}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-mono transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* ── Summary ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-[11px] font-mono">
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
          <span className="text-slate-400 uppercase text-[10px] block mb-1">Last event received</span>
          <span className={summary?.lastEventAt ? 'text-blue-300' : 'text-amber-300'}>
            {relative(summary?.lastEventAt)}
          </span>
          {summary?.lastEventAt && (
            <div className="text-[10px] text-slate-400">{new Date(summary.lastEventAt).toLocaleString()}</div>
          )}
        </div>
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
          <span className="text-slate-400 uppercase text-[10px] block mb-1">Last settled</span>
          <span className={summary?.lastProcessedAt ? 'text-blue-300' : 'text-slate-300'}>
            {relative(summary?.lastProcessedAt)}
          </span>
          <div className="text-[10px] text-slate-400">newest paid delivery we handled</div>
        </div>
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
          <span className="text-slate-400 uppercase text-[10px] block mb-1">Failed deliveries</span>
          <span className={summary?.failedDeliveries ? 'text-red-300' : 'text-blue-300'}>
            {summary?.failedDeliveries || 0}
          </span>
          <div className="text-[10px] text-slate-400">Stripe retries these automatically</div>
        </div>
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
          <span className="text-slate-400 uppercase text-[10px] block mb-1">Rejected attempts</span>
          <span className={summary?.rejectedAttempts ? 'text-amber-300' : 'text-blue-300'}>
            {summary?.rejectedAttempts || 0}
          </span>
          <div className="text-[10px] text-slate-400">bad signature (wrong secret / probes)</div>
        </div>
      </div>

      {lastFailure && (
        <div
          className={`flex items-start gap-2 px-4 py-3 rounded-xl border text-[11px] ${
            lastFailure.status === 'rejected'
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
              : 'bg-red-500/10 border-red-500/30 text-red-200'
          }`}
        >
          <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            <b>{lastFailure.status}</b> · {relative(lastFailure.at)} — {lastFailure.message}
            {lastFailure.status === 'rejected' && (
              <span className="block mt-1 text-amber-100/80">
                Agar Stripe dashboard par deliveries 400 dikha rahi hain to webhook signing secret dobara paste karein.
              </span>
            )}
          </span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl border bg-red-500/10 border-red-500/30 text-red-200 text-xs">
          <AlertTriangle className="w-4 h-4" />
          {error}
        </div>
      )}

      {actionMessage.message && (
        <div
          className={`flex items-start gap-2 px-4 py-3 rounded-xl border text-xs ${
            actionMessage.type === 'error'
              ? 'bg-red-500/10 border-red-500/30 text-red-200'
              : actionMessage.type === 'success'
                ? 'bg-blue-500/10 border-blue-500/30 text-blue-200'
                : 'bg-slate-800/60 border-slate-700 text-slate-200'
          }`}
        >
          {actionMessage.type === 'error' ? (
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          ) : (
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
          )}
          <span>{actionMessage.message}</span>
        </div>
      )}

      {/* ── Stuck pending orders (recovery path) ───────────────────────────── */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-slate-400">
          <Clock className="w-3.5 h-3.5" />
          Pending orders older than 30 minutes ({stuck.length})
        </div>
        {stuck.length === 0 ? (
          <p className="text-[11px] text-slate-400 flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-300" />
            Kuch bhi atka hua nahi hai — har checkout ya settle ho gaya ya expire.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-[11px] font-mono">
              <thead className="bg-slate-950/70 text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="px-3 py-2">Invoice</th>
                  <th className="px-3 py-2">Student</th>
                  <th className="px-3 py-2">Amount</th>
                  <th className="px-3 py-2">Started</th>
                  <th className="px-3 py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {stuck.map((payment) => (
                  <tr key={payment._id}>
                    <td className="px-3 py-2 text-blue-300">{payment.invoiceNumber}</td>
                    <td className="px-3 py-2 text-slate-200">
                      {payment.studentName || payment.student?.name || 'Guest'}
                      <div className="text-[10px] text-slate-400">{payment.email}</div>
                    </td>
                    <td className="px-3 py-2 text-slate-300">
                      ${payment.amount} {payment.currency || 'USD'}
                    </td>
                    <td className="px-3 py-2 text-slate-400">{relative(payment.createdAt)}</td>
                    <td className="px-3 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => recheck(payment)}
                        disabled={busyId === payment._id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-50"
                      >
                        <RotateCcw className={`w-3 h-3 ${busyId === payment._id ? 'animate-spin' : ''}`} />
                        {busyId === payment._id ? 'Checking…' : 'Re-check with Stripe'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-[10px] text-slate-400">
          Re-check Stripe se seedha poochta hai ki paisa aaya ya nahi. Aaya ho to order Paid ho kar student ka access
          turant active ho jata hai; na aaya ho to kuch nahi badalta.
        </p>
      </div>

      {/* ── Delivery log ───────────────────────────────────────────────────── */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-slate-400">
            <Webhook className="w-3.5 h-3.5" />
            Recent deliveries
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {['All', 'processed', 'pending', 'duplicate', 'unmatched', 'failed', 'rejected'].map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono uppercase tracking-wider transition-all whitespace-nowrap ${
                  statusFilter === status
                    ? 'bg-blue-600 text-white font-bold'
                    : 'bg-slate-950/80 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {loading && !data ? (
          <p className="text-[11px] text-slate-400">Loading webhook activity…</p>
        ) : (data?.events || []).length === 0 ? (
          <p className="text-[11px] text-slate-400">
            Is filter mein koi delivery nahi hai. Jab pehla payment aayega, uski entry yahan apne aap dikhegi.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-[11px] font-mono">
              <thead className="bg-slate-950/70 text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="px-3 py-2">When</th>
                  <th className="px-3 py-2">Event</th>
                  <th className="px-3 py-2">Result</th>
                  <th className="px-3 py-2">Order</th>
                  <th className="px-3 py-2">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {(data?.events || []).map((event) => (
                  <tr key={event._id} className="align-top">
                    <td className="px-3 py-2 text-slate-400 whitespace-nowrap">
                      <div>{relative(event.createdAt)}</div>
                      <div className="text-[10px] text-slate-400">{new Date(event.createdAt).toLocaleTimeString()}</div>
                    </td>
                    <td className="px-3 py-2 text-slate-300 break-all">
                      <div>{event.type || '—'}</div>
                      {event.eventId && <div className="text-[10px] text-slate-400">{event.eventId}</div>}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full border text-[10px] ${
                          STATUS_STYLE[event.status] || STATUS_STYLE.ignored
                        }`}
                        title={STATUS_HELP[event.status] || ''}
                      >
                        {event.status}
                      </span>
                      {event.httpStatus >= 400 && (
                        <div className="text-[10px] text-red-300 mt-1">HTTP {event.httpStatus}</div>
                      )}
                    </td>
                    <td className="px-3 py-2 text-slate-300">
                      {event.invoiceNumber || '—'}
                      {event.paymentEmail && <div className="text-[10px] text-slate-400">{event.paymentEmail}</div>}
                      {event.amount != null && <div className="text-[10px] text-slate-400">${event.amount}</div>}
                    </td>
                    <td className="px-3 py-2 text-slate-400 max-w-[26rem]">{event.message || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="text-[10px] text-slate-400">
          Log sirf route ki jaankari rakhta hai (event id, kis order ka tha, kya hua) — card ya customer data kabhi
          store nahi hota. Purani entries khud trim ho jaati hain (last 500).
        </p>
      </div>
    </div>
  );
}
