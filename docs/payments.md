# Payments — Stripe Checkout

Real card payments with **webhook-only settlement**. No browser request can ever mark an order as paid.

## Lifecycle

| Step | Endpoint | What happens |
|---|---|---|
| 1 | `POST /api/payments/quote` | Server computes the authoritative price (tier + voucher). Nothing is stored. |
| 2 | `POST /api/payments/checkout` | Creates a **Pending** `Payment` row + a Stripe Checkout Session, then returns the hosted page URL. |
| 3 | Stripe hosted page | Customer pays. Card data never touches our servers or database. |
| 4 | `POST /api/payments/webhook` | Signature-verified event settles the payment: status → `Paid`, student account (random temp password), enrollment, progress, cohort seat, audit log, receipt + credentials emails. The receipt is linked to the new student account, so it appears in Student → Payments and in the admin ledger. |
| 5 | `GET /api/payments/checkout-status/:sessionId` | Success screen polls this. If Stripe has the money but the webhook is late, the server reconciles directly with Stripe. |

## Webhook health & recovery

Every delivery to `/api/payments/webhook` is logged in the `webhookevents`
collection (last 500, trimmed automatically on ~5% of writes) so "did Stripe call
us, and what did we do with it?" has an answer that Stripe's own dashboard cannot
give:

| status | meaning |
|---|---|
| `processed` | settled a paid order, or recorded a failure/expiry |
| `pending` | verified, but Stripe reported the money had not settled yet |
| `duplicate` | a Stripe retry of an event already handled (nothing changed) |
| `unmatched` | no payment record matched the session |
| `failed` | our handler threw — Stripe will retry |
| `rejected` | signature verification failed (wrong secret, or a probe) |
| `ignored` | verified, but an event type this platform does not act on |

Only routing facts are stored (event id, type, matched payment, decision,
duration) — never a payload, card or customer detail. `rejected` writes are
throttled in-process (25 per 10 minutes) because that endpoint is public: a real
misconfiguration sends a handful, an attacker sends thousands.

Two endpoints back the admin panel:

- `GET /api/payments/webhook-events` (`SETTINGS_VIEW`) — recent deliveries, a
  summary (last event, last settled, failed/rejected counts) and `stuck`: Pending
  orders older than 30 minutes that still have a Stripe session.
- `POST /api/payments/:id/reconcile` (`SETTINGS_EDIT`) — asks Stripe about one
  order and settles it if the money is really there. It shares the idempotency
  guard with the webhook, so a late webhook arriving after a manual re-check can
  never enroll the student twice. Every successful re-check is written to the
  audit log as `PAYMENT_RECONCILED_BY_ADMIN`.

Admin → **Settings → Payment Gateway → Webhook health** renders both, and the
Tuition & Billing Ledger shows a **Re-check** button on Pending rows.

**Guarantees**

- Amounts are computed server-side only — a tampered browser request cannot change what is charged.
- `Paid` is only ever set by a webhook whose HMAC signature matches `STRIPE_WEBHOOK_SECRET`.
- Every Stripe event id is claimed once, so retried webhooks can never double-enroll a student.
- A late `expired` / `failed` event can never downgrade a settled payment.
- New students receive a **cryptographically random** temporary password, delivered by email only — never in an API response.

## Configuring the gateway (two supported paths)

### Path A — from the admin panel, no redeploy (recommended for the client)

Admin → **Settings → Payment Gateway** is a guided 3-step setup. It is also where
secrets are applied *immediately*: `PUT /api/settings/payment-gateway` stores them
AES-256-GCM encrypted (key derived from `JWT_SECRET`) and loads them into server
memory, so no restart and no redeploy is needed.

1. **Keys** — paste the publishable key (`pk_…`) and the secret key (`sk_…`).
   The environment label follows the key: pasting an `sk_live_…` key switches the
   gateway to `live` automatically (see `alignModeWithSecret`), so the client can
   never get stuck on a mode-mismatch error.
2. **Webhook** — the panel shows the exact endpoint URL plus the five required
   events in one copyable block. Stripe → Developers → Webhooks → Add endpoint,
   then paste the signing secret (`whsec_…`).
3. **Verify** — `POST /api/settings/payment-gateway/test` calls Stripe with the
   saved (or just-pasted) key and reports: key accepted/rejected, account id and
   mode, whether a webhook is registered at *our* URL, and which required events
   are missing. **Test connection** in the panel is that endpoint.

`GET /api/settings/payment-gateway` returns the same information as a checklist
(`setup.steps[]`, `setup.webhook`, `setup.ready`) and never returns secret
material — only booleans and masked hints (`sk_live_…4f2a`).

### Path B — environment variables (infrastructure-level)

```bash
STRIPE_SECRET_KEY=sk_live_...        # or sk_test_... while testing
STRIPE_WEBHOOK_SECRET=whsec_...      # Stripe → Developers → Webhooks → your endpoint
PAYMENT_CURRENCY=USD
```

An environment variable always wins over a key saved in the panel.

`SMTP_USER` / `SMTP_PASS` must also be set, otherwise receipt and credential emails are only logged to the console (the enrollment still completes).

## Go-live checklist

1. Stripe dashboard → **Developers → API keys** → copy the secret key.
2. **Developers → Webhooks → Add endpoint**
   - URL: `https://american-futuretech-api.onrender.com/api/payments/webhook`
     (the panel prints the correct URL for whichever API host serves it)
   - Events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`,
     `checkout.session.async_payment_failed`, `checkout.session.expired`, `payment_intent.payment_failed`
3. Save both secrets (panel or env) and press **Test connection** — it must come
   back green: key accepted, webhook registered, no missing events.
4. `GET /api/health` must report:
   ```json
   "payments": { "mode": "live", "configured": true, "webhookConfigured": true, "ready": true }
   ```
   Admin → **Payments** shows the same status as a badge, and every settled order
   appears in the Tuition & Billing Ledger with its Stripe reference (CSV export
   included).
5. Test with Stripe test cards (`4242 4242 4242 4242`, any future expiry, any CVC) while in test mode, then switch to live keys.

## Behaviour without keys

If `STRIPE_SECRET_KEY` is missing, checkout returns `503 PAYMENTS_NOT_CONFIGURED` and the UI switches to a **manual enquiry**: the lead is saved to the CRM with the quoted amount and admissions follows up with a secure payment link. Nothing is ever recorded as `Paid` without a real charge.

## Verification

```bash
npm run verify:payments
```

Runs 73 checks: pricing/voucher math, temp-password strength, webhook signature
enforcement (missing, forged, tampered payloads), a full end-to-end settlement
against a throwaway local MongoDB (settlement, receipt-to-account linking,
idempotent replays, failed/expired handling, forged-webhook rejection), the
delivery log (processed/duplicate/unmatched/rejected rows, the health summary and
its stuck-order list), the re-check guards, and the admin setup contract
(key/mode auto-alignment, webhook URL + event checklist). It forces dummy test
keys, so it can never touch live money.

The live suite (`npm run verify:live`) is safe to run with real keys saved: it
verifies checkout input validation and status shape, and deliberately never
creates a Stripe Checkout Session, so nothing unpaid is left in the client's
Stripe dashboard.
