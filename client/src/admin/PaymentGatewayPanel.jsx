import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import WebhookHealthPanel from './WebhookHealthPanel';
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
  Webhook,
  Copy,
  Check,
  ExternalLink,
  Zap,
  RefreshCw,
  CircleDashed,
} from 'lucide-react';

const authHeaders = () => {
  const token = localStorage.getItem('aft_admin_token') || localStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
};

const STRIPE_KEYS_URL = 'https://dashboard.stripe.com/apikeys';
const STRIPE_WEBHOOKS_URL = 'https://dashboard.stripe.com/webhooks';

const inputClass =
  'w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-sans text-xs focus:outline-none focus:border-blue-500';
const labelClass = 'block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1';

/** Where the label must sit given a pasted key — mirrors the server rule. */
const modeForSecret = (secret) => {
  const value = String(secret || '').trim();
  if (value.startsWith('sk_live_')) return 'live';
  if (value.startsWith('sk_test_')) return 'test';
  return null;
};

function CopyButton({ value, label = 'Copy' }) {
  const [copied, setCopied] = useState(false);
  if (!value) return null;
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
        } catch {
          /* clipboard can be blocked — the value stays visible anyway */
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-mono transition-colors shrink-0"
    >
      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
      {copied ? 'Copied' : label}
    </button>
  );
}

function StepCard({ index, step, children }) {
  return (
    <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4">
      <div className="flex items-start gap-3">
        <span
          className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
            step?.done ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 border border-slate-700'
          }`}
        >
          {step?.done ? <Check className="w-3.5 h-3.5" /> : index}
        </span>
        <div className="min-w-0">
          <h4 className="text-sm font-bold text-white font-heading flex items-center gap-2">
            {step?.title || `Step ${index}`}
            {step?.done ? (
              <span className="text-[10px] font-mono uppercase text-blue-300 bg-blue-500/10 border border-blue-500/25 px-2 py-0.5 rounded-full">
                Done
              </span>
            ) : (
              <span className="text-[10px] font-mono uppercase text-amber-300 bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 rounded-full">
                Needs setup
              </span>
            )}
          </h4>
          <p className="text-[11px] text-slate-400 leading-relaxed mt-1">{step?.hint}</p>
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

/**
 * Admin → Settings → Payment Gateway (Stripe).
 *
 * Written so the client can finish the setup alone, without a developer:
 * three numbered steps, the exact Stripe menu path next to every field, the
 * webhook URL and event list ready to copy, and a "Test connection" button that
 * asks Stripe whether the key and the webhook really work.
 *
 * Secret keys are write-only: they are posted once, encrypted on the server and
 * never returned. The browser only ever shows a masked hint.
 */
export default function PaymentGatewayPanel() {
  const [gateway, setGateway] = useState(null);
  const [status, setStatus] = useState(null);
  const [setup, setSetup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [secretKey, setSecretKey] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');
  const [showSecrets, setShowSecrets] = useState(false);

  const notify = (type, message) => {
    setFeedback({ type, message });
    if (type === 'error') setTimeout(() => setFeedback({ type: '', message: '' }), 12000);
  };

  const applyResponse = (data) => {
    if (data.gateway) setGateway(data.gateway);
    if (data.payments) setStatus(data.payments);
    if (data.setup) setSetup(data.setup);
  };

  const load = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/settings/payment-gateway', { headers: authHeaders() });
      if (res.data.success) applyResponse(res.data);
    } catch (err) {
      notify('error', err.response?.data?.message || 'Could not load the payment gateway settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  /** Pasting a key also moves the environment label — never a dead end. */
  const onSecretKeyChange = (value) => {
    setSecretKey(value);
    const detected = modeForSecret(value);
    if (detected && gateway && gateway.mode !== detected) {
      setGateway({ ...gateway, mode: detected });
      notify('success', `Detected a ${detected.toUpperCase()} key — the environment was switched to ${detected.toUpperCase()} for you.`);
    }
  };

  const save = async (event) => {
    if (event) event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        enabled: gateway.enabled,
        mode: modeForSecret(secretKey) || gateway.mode,
        publishableKey: gateway.publishableKey,
        currency: gateway.currency,
        checkoutNote: gateway.checkoutNote,
        disabledMessage: gateway.disabledMessage,
      };
      if (secretKey.trim()) payload.secretKey = secretKey.trim();
      if (webhookSecret.trim()) payload.webhookSecret = webhookSecret.trim();

      const res = await axios.put('/api/settings/payment-gateway', payload, { headers: authHeaders() });
      if (res.data.success) {
        applyResponse(res.data);
        setSecretKey('');
        setWebhookSecret('');
        notify('success', res.data.message || 'Payment gateway saved.');
      }
    } catch (err) {
      notify('error', err.response?.data?.message || 'Could not save the gateway settings.');
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const payload = {};
      if (secretKey.trim()) payload.secretKey = secretKey.trim();
      if (webhookSecret.trim()) payload.webhookSecret = webhookSecret.trim();
      const res = await axios.post('/api/settings/payment-gateway/test', payload, { headers: authHeaders() });
      setTestResult(res.data);
    } catch (err) {
      setTestResult(
        err.response?.data || {
          ok: false,
          message: err.message || 'The test request failed.',
        },
      );
    } finally {
      setTesting(false);
    }
  };

  const ready = Boolean(status?.configured && status?.webhookConfigured);
  const enabled = gateway?.enabled !== false;

  const eventsBlock = useMemo(() => (setup?.webhook?.events || []).join('\n'), [setup]);

  if (loading || !gateway) {
    return <div className="p-10 text-center text-slate-400 font-mono text-xs">Loading payment gateway…</div>;
  }

  const steps = setup?.steps || [];
  const stepById = (id) => steps.find((step) => step.id === id);

  return (
    <form onSubmit={save} className="space-y-6">
      {/* ── Status ─────────────────────────────────────────────────────────── */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-5 backdrop-blur-xl">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white font-heading flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-blue-400" />
              Stripe Payment Gateway
            </h3>
            <p className="text-[11px] text-slate-400 leading-relaxed mt-1 max-w-2xl">
              Koi developer ki zarurat nahi — neeche 3 steps follow karein. Secret keys save hote hi encrypt ho jaati hain
              aur dobara kabhi screen par nahi aati. Enrollment sirf Stripe ke signed webhook se confirm hota hai.
            </p>
          </div>

          <div
            className={`px-3 py-2 rounded-xl border text-[11px] font-mono flex items-center gap-2 ${
              !enabled
                ? 'bg-slate-800/60 border-slate-700 text-slate-300'
                : ready
                  ? 'bg-blue-500/10 border-blue-500/30 text-blue-200'
                  : 'bg-red-500/10 border-red-500/30 text-red-200'
            }`}
          >
            {!enabled ? (
              <PlugZap className="w-3.5 h-3.5" />
            ) : ready ? (
              <ShieldCheck className="w-3.5 h-3.5" />
            ) : (
              <ShieldAlert className="w-3.5 h-3.5" />
            )}
            <span>
              {!enabled
                ? 'Payments OFF — checkout shows the admissions enquiry form'
                : ready
                  ? `Card payments ACTIVE (${status?.mode} mode)`
                  : 'Incomplete — secret key or webhook secret missing'}
            </span>
          </div>
        </div>

        {feedback.message && (
          <div
            className={`flex items-start gap-2 px-4 py-3 rounded-xl border text-xs ${
              feedback.type === 'error'
                ? 'bg-red-500/10 border-red-500/30 text-red-200'
                : 'bg-blue-500/10 border-blue-500/30 text-blue-200'
            }`}
          >
            {feedback.type === 'error' ? (
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-[11px] font-mono">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-slate-400 uppercase text-[10px] block mb-1">Secret key</span>
            <span className={status?.configured ? 'text-blue-300' : 'text-red-300'}>
              {status?.configured ? gateway.secretKeyHint || 'Saved' : 'Not saved'}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-slate-400 uppercase text-[10px] block mb-1">Source</span>
            <span className="text-slate-200">
              {status?.source === 'environment'
                ? 'Server environment'
                : status?.source === 'admin-panel'
                  ? 'This panel (encrypted)'
                  : 'Not configured'}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-slate-400 uppercase text-[10px] block mb-1">Webhook</span>
            <span className={status?.webhookConfigured ? 'text-blue-300' : 'text-red-300'}>
              {status?.webhookConfigured ? 'Verified on arrival' : 'Missing'}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-slate-400 uppercase text-[10px] block mb-1">Last updated</span>
            <span className="text-slate-200">
              {gateway.lastUpdatedAt
                ? `${new Date(gateway.lastUpdatedAt).toLocaleDateString()} · ${gateway.lastUpdatedBy}`
                : 'Never from the panel'}
            </span>
          </div>
        </div>
      </div>

      {/* ── Step 1 ─────────────────────────────────────────────────────────── */}
      <StepCard index={1} step={stepById('account')}>
        <div className="text-[11px] text-slate-300 bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-2">
          <p className="font-bold text-white">Stripe dashboard se keys nikaalein</p>
          <ol className="list-decimal pl-5 space-y-1 text-slate-400">
            <li>
              <a
                href={STRIPE_KEYS_URL}
                target="_blank"
                rel="noreferrer"
                className="text-blue-300 underline decoration-dotted inline-flex items-center gap-1"
              >
                dashboard.stripe.com/apikeys <ExternalLink className="w-3 h-3" />
              </a>{' '}
              kholein (Stripe → Developers → API keys).
            </li>
            <li>
              <span className="text-slate-200">Publishable key</span> (pk_live_… / pk_test_…) copy karke niche paste karein.
            </li>
            <li>
              <span className="text-slate-200">Secret key</span> par <span className="text-slate-200">Reveal</span> dabakar
              sk_live_… / sk_test_… copy karein.
            </li>
          </ol>
          <p className="text-slate-400">
            LIVE key paste karte hi environment apne aap <span className="text-slate-200">LIVE</span> ho jayega — koi error
            nahi aayega.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Publishable key (browser-safe)</label>
            <input
              value={gateway.publishableKey}
              onChange={(e) => setGateway({ ...gateway, publishableKey: e.target.value })}
              placeholder="pk_live_… / pk_test_…"
              className={`${inputClass} font-mono`}
            />
          </div>

          <div>
            <label className={labelClass}>
              <KeyRound className="w-3 h-3 inline" /> Secret key {gateway.secretKeyConfigured ? '(saved)' : ''}
            </label>
            <div className="relative">
              <input
                type={showSecrets ? 'text' : 'password'}
                value={secretKey}
                onChange={(e) => onSecretKeyChange(e.target.value)}
                placeholder={gateway.secretKeyConfigured ? gateway.secretKeyHint || '••••••••' : 'sk_live_… / sk_test_…'}
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
            <p className="text-[10px] text-slate-400 mt-1">Khali chhodein to saved key waise hi rahegi.</p>
          </div>

          <div>
            <label className={labelClass}>Environment / Mode</label>
            <select
              value={gateway.mode}
              onChange={(e) => setGateway({ ...gateway, mode: e.target.value })}
              className={inputClass}
            >
              <option value="test">TEST — Stripe test keys (no real card)</option>
              <option value="live">LIVE — real customer cards</option>
            </select>
            <div className="flex items-center gap-2 mt-2">
              <label className="flex items-center gap-2 text-[11px] text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={gateway.enabled}
                  onChange={(e) => setGateway({ ...gateway, enabled: e.target.checked })}
                  className="accent-blue-500"
                />
                Enable online card payments
              </label>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Currency</label>
            <input
              value={gateway.currency}
              onChange={(e) => setGateway({ ...gateway, currency: e.target.value.toUpperCase() })}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Checkout trust note (students ko dikhta hai)</label>
            <input
              value={gateway.checkoutNote}
              onChange={(e) => setGateway({ ...gateway, checkoutNote: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Payments off hone par message</label>
            <input
              value={gateway.disabledMessage}
              onChange={(e) => setGateway({ ...gateway, disabledMessage: e.target.value })}
              className={inputClass}
            />
          </div>
        </div>
      </StepCard>

      {/* ── Step 2 ─────────────────────────────────────────────────────────── */}
      <StepCard index={2} step={stepById('webhook')}>
        <div className="text-[11px] text-slate-300 bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-2">
          <p className="font-bold text-white flex items-center gap-2">
            <Webhook className="w-3.5 h-3.5 text-blue-400" /> Webhook endpoint banayein
          </p>
          <p className="text-slate-400">
            Stripe ko batana padta hai ki payment hote hi humein message bheje. Stripe → Developers → Webhooks →{' '}
            <span className="text-slate-200">Add endpoint</span> par jayein aur yeh URL paste karein:
          </p>
          <div className="flex flex-wrap items-center gap-2 justify-between bg-slate-900 border border-slate-700 rounded-lg px-3 py-2">
            <code className="text-blue-300 break-all">{setup?.webhook?.url || 'https://your-api-domain/api/payments/webhook'}</code>
            <div className="flex items-center gap-2">
              <CopyButton value={setup?.webhook?.url} label="Copy URL" />
              <a
                href={STRIPE_WEBHOOKS_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-mono"
              >
                Stripe <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        <div className="text-[11px] bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="font-bold text-white">Events — yahi {setup?.webhook?.events?.length || 5} select karein</p>
            <CopyButton value={eventsBlock} label="Copy events" />
          </div>
          <ul className="font-mono text-[10px] text-blue-200 grid grid-cols-1 sm:grid-cols-2 gap-1">
            {(setup?.webhook?.events || []).map((name) => (
              <li key={name} className="bg-slate-900/70 border border-slate-800 rounded px-2 py-1">
                {name}
              </li>
            ))}
          </ul>
          <p className="text-slate-400">
            Endpoint banane ke baad Stripe <span className="text-slate-200">Signing secret</span> (whsec_…) dikhata hai —
            usse niche paste karein.
          </p>
        </div>

        <div>
          <label className={labelClass}>
            Webhook signing secret {gateway.webhookSecretConfigured ? '(saved)' : ''}
          </label>
          <input
            type={showSecrets ? 'text' : 'password'}
            value={webhookSecret}
            onChange={(e) => setWebhookSecret(e.target.value)}
            placeholder={gateway.webhookSecretConfigured ? gateway.webhookSecretHint || '••••••••' : 'whsec_…'}
            className={`${inputClass} font-mono`}
            autoComplete="new-password"
          />
          <p className="text-[10px] text-slate-400 mt-1">
            Stripe → Developers → Webhooks → aapka endpoint → Signing secret → Reveal.
          </p>
        </div>
      </StepCard>

      {/* ── Step 3 ─────────────────────────────────────────────────────────── */}
      <StepCard index={3} step={stepById('enabled')}>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={testConnection}
            disabled={testing}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors disabled:opacity-50 cursor-pointer"
          >
            {testing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5 text-amber-300" />}
            {testing ? 'Testing with Stripe…' : 'Test connection'}
          </button>
          <span className="text-[11px] text-slate-400">
            Save se pehle bhi test kar sakte hain — pasted key hi use hoti hai.
          </span>
        </div>

        {testResult && (
          <div
            className={`p-4 rounded-xl border text-xs space-y-2 ${
              testResult.ok
                ? 'bg-blue-500/10 border-blue-500/30 text-blue-100'
                : 'bg-red-500/10 border-red-500/30 text-red-100'
            }`}
          >
            <div className="flex items-start gap-2">
              {testResult.ok ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <span className="font-semibold">{testResult.message}</span>
            </div>

            {testResult.key && (
              <div className="font-mono text-[11px] text-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-2">
                <span>
                  Key: {testResult.key.hint} ({testResult.key.mode?.toUpperCase()})
                </span>
                <span>Account: {testResult.account?.id || '—'}</span>
                <span>
                  Currency: {testResult.account?.currency || '—'} {testResult.account?.country ? `· ${testResult.account.country}` : ''}
                </span>
              </div>
            )}

            {testResult.webhook && (
              <div className="font-mono text-[11px] text-slate-200 space-y-1">
                <div>
                  Webhook {testResult.webhook.registered ? '✅ registered' : '❌ not registered'}
                  {testResult.webhook.status ? ` (${testResult.webhook.status})` : ''} — {testResult.webhook.expectedUrl}
                </div>
                {testResult.webhook.missingEvents?.length > 0 && (
                  <div className="text-red-200">Missing events: {testResult.webhook.missingEvents.join(', ')}</div>
                )}
                {testResult.webhook.listError && (
                  <div className="text-amber-200">
                    Stripe list skipped ({testResult.webhook.listError}) — restricted key may not allow it.
                  </div>
                )}
                {testResult.webhook.otherEndpoints?.length > 0 && (
                  <div className="text-slate-400">
                    Other endpoints on this account: {testResult.webhook.otherEndpoints.join(', ')}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div
          className={`p-3 rounded-xl border text-[11px] flex items-start gap-2 ${
            (setup?.modeLabel || '').startsWith('LIVE')
              ? 'bg-red-500/10 border-red-500/30 text-red-200'
              : 'bg-slate-950/70 border-slate-800 text-slate-300'
          }`}
        >
          <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            {setup?.modeLabel || 'TEST — Stripe test cards only'}. Test cards:{' '}
            <span className="font-mono">4242 4242 4242 4242</span>, koi bhi future expiry, koi bhi CVC.
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-slate-400">
          <span className="flex items-center gap-1.5">
            {status?.configured ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-300" />
            ) : (
              <CircleDashed className="w-3.5 h-3.5" />
            )}
            Secret key
          </span>
          <span className="flex items-center gap-1.5">
            {status?.webhookConfigured ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-300" />
            ) : (
              <CircleDashed className="w-3.5 h-3.5" />
            )}
            Webhook secret
          </span>
          <span className="flex items-center gap-1.5">
            {status?.ready ? <CheckCircle2 className="w-3.5 h-3.5 text-blue-300" /> : <CircleDashed className="w-3.5 h-3.5" />}
            Checkout live on the site
          </span>
        </div>
      </StepCard>

      {/* Did Stripe actually call us, and what did we do with it? */}
      <WebhookHealthPanel />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[11px] text-slate-400">
          Har save ke baad change turant live ho jaata hai — server restart ki zarurat nahi.
        </p>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-600 text-white font-bold text-xs transition-colors shadow-lg shadow-blue-500/20 disabled:opacity-50 cursor-pointer"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving…' : 'Save Gateway Settings'}
        </button>
      </div>
    </form>
  );
}
