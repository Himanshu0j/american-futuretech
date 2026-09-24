import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  CreditCard,
  ShieldCheck,
  ShieldAlert,
  Save,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Eye,
  EyeOff,
  PlugZap,
} from 'lucide-react';

const authHeaders = () => {
  const token = localStorage.getItem('token') || localStorage.getItem('aft_admin_token');
  return { Authorization: `Bearer ${token}` };
};

/**
 * Admin → Payment Gateway (Stripe).
 *
 * Secret keys are write-only: they are posted once, encrypted on the server and
 * never returned. The panel only ever shows a masked hint, and the browser never
 * receives STRIPE_SECRET_KEY or the webhook signing secret.
 */
export default function PaymentGatewayPanel() {
  const [gateway, setGateway] = useState(null);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [secretKey, setSecretKey] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');
  const [showSecrets, setShowSecrets] = useState(false);

  const notify = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback({ type: '', message: '' }), 8000);
  };

  const load = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/settings/payment-gateway', { headers: authHeaders() });
      if (res.data.success) {
        setGateway(res.data.gateway);
        setStatus(res.data.payments);
      }
    } catch (err) {
      notify('error', err.response?.data?.message || 'Could not load the payment gateway settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const save = async (event) => {
    if (event) event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        enabled: gateway.enabled,
        mode: gateway.mode,
        publishableKey: gateway.publishableKey,
        currency: gateway.currency,
        checkoutNote: gateway.checkoutNote,
        disabledMessage: gateway.disabledMessage,
      };
      if (secretKey.trim()) payload.secretKey = secretKey.trim();
      if (webhookSecret.trim()) payload.webhookSecret = webhookSecret.trim();

      const res = await axios.put('/api/settings/payment-gateway', payload, { headers: authHeaders() });
      if (res.data.success) {
        setGateway(res.data.gateway);
        setStatus(res.data.payments);
        setSecretKey('');
        setWebhookSecret('');
        notify('success', 'Payment gateway saved. Secrets are stored encrypted and will not be shown again.');
      }
    } catch (err) {
      notify('error', err.response?.data?.message || 'Could not save the gateway settings.');
    } finally {
      setSaving(false);
    }
  };

  const inputClass = 'w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-sans text-xs focus:outline-none focus:border-indigo-500';
  const labelClass = 'block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1';

  if (loading || !gateway) {
    return <div className="p-10 text-center text-slate-400 font-mono text-xs">Loading payment gateway…</div>;
  }

  const ready = Boolean(status?.configured && status?.webhookConfigured);
  const liveKey = gateway.mode === 'live';

  return (
    <form onSubmit={save} className="space-y-6">
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-5 backdrop-blur-xl">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white font-heading flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-indigo-400" />
              Stripe Payment Gateway
            </h3>
            <p className="text-[11px] text-slate-400 leading-relaxed mt-1 max-w-2xl">
              Paste your Stripe keys here and switch online payments on or off without a developer. Secret keys are
              encrypted before storage and are never sent back to the browser. Enrollment is confirmed only when
              Stripe's signed webhook reaches the server.
            </p>
          </div>

          <div className={`px-3 py-2 rounded-xl border text-[11px] font-mono flex items-center gap-2 ${
            !gateway.enabled
              ? 'bg-slate-800/60 border-slate-700 text-slate-300'
              : ready
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
          }`}>
            {!gateway.enabled ? <PlugZap className="w-3.5 h-3.5" /> : ready ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
            <span>
              {!gateway.enabled
                ? 'Stripe disabled — checkout falls back to admissions enquiry'
                : ready
                  ? `Live charging active (${gateway.mode} mode)`
                  : 'Incomplete — missing secret key or webhook secret'}
            </span>
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <label className="flex items-center gap-2 text-xs text-slate-300 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={gateway.enabled}
              onChange={(e) => setGateway({ ...gateway, enabled: e.target.checked })}
              className="accent-indigo-500"
            />
            Enable online payments
          </label>

          <div>
            <label className={labelClass}>Environment</label>
            <select
              value={gateway.mode}
              onChange={(e) => setGateway({ ...gateway, mode: e.target.value })}
              className={inputClass}
            >
              <option value="test">TEST — Stripe test keys</option>
              <option value="live">LIVE — real customer cards</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Currency</label>
            <input
              value={gateway.currency}
              onChange={(e) => setGateway({ ...gateway, currency: e.target.value.toUpperCase() })}
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Publishable key (safe for the browser)</label>
            <input
              value={gateway.publishableKey}
              onChange={(e) => setGateway({ ...gateway, publishableKey: e.target.value })}
              placeholder="pk_test_… / pk_live_…"
              className={`${inputClass} font-mono`}
            />
          </div>

          <div>
            <label className={labelClass}>
              <KeyRound className="w-3 h-3 inline" /> Secret key {gateway.secretKeyConfigured ? '(already saved)' : ''}
            </label>
            <div className="relative">
              <input
                type={showSecrets ? 'text' : 'password'}
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                placeholder={gateway.secretKeyConfigured ? gateway.secretKeyHint || '••••••••' : 'sk_test_… / sk_live_…'}
                className={`${inputClass} font-mono pr-9`}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowSecrets((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                aria-label={showSecrets ? 'Hide secret' : 'Show secret'}
              >
                {showSecrets ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Leave blank to keep the saved key. Never shown again after saving.
            </p>
          </div>

          <div>
            <label className={labelClass}>
              Webhook signing secret {gateway.webhookSecretConfigured ? '(already saved)' : ''}
            </label>
            <input
              type={'password'}
              value={webhookSecret}
              onChange={(e) => setWebhookSecret(e.target.value)}
              placeholder={gateway.webhookSecretConfigured ? gateway.webhookSecretHint || '••••••••' : 'whsec_…'}
              className={`${inputClass} font-mono`}
              autoComplete="new-password"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Stripe → Developers → Webhooks → your endpoint → Signing secret.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Checkout trust note (shown to students)</label>
            <input
              value={gateway.checkoutNote}
              onChange={(e) => setGateway({ ...gateway, checkoutNote: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Message when payments are switched off</label>
            <input
              value={gateway.disabledMessage}
              onChange={(e) => setGateway({ ...gateway, disabledMessage: e.target.value })}
              className={inputClass}
            />
          </div>
        </div>

        {liveKey && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-[11px] flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              LIVE mode charges real cards. Test the full flow in TEST mode first — a live key can only be saved while
              the gateway is in LIVE mode, so a production key can never be used against test data by accident.
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800 text-[11px] font-mono text-slate-400">
          <div>
            <span className="text-slate-400 uppercase text-[10px] block">Secret key source</span>
            {status?.source === 'environment' ? 'Environment variable' : status?.source === 'admin-panel' ? 'Admin panel (encrypted)' : 'Not configured'}
          </div>
          <div>
            <span className="text-slate-400 uppercase text-[10px] block">Webhook</span>
            {status?.webhookConfigured ? 'Verified — enrollments auto-confirm' : 'Missing — payments cannot be auto-confirmed'}
          </div>
          <div>
            <span className="text-slate-400 uppercase text-[10px] block">Last updated</span>
            {gateway.lastUpdatedAt
              ? `${new Date(gateway.lastUpdatedAt).toLocaleString()} · ${gateway.lastUpdatedBy}`
              : 'Never from the panel'}
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-bold text-xs transition-colors shadow-lg shadow-indigo-500/20 disabled:opacity-50 cursor-pointer"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving…' : 'Save Gateway Settings'}
        </button>
      </div>
    </form>
  );
}
