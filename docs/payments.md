# Payments — Stripe Checkout

Real card payments with **webhook-only settlement**. No browser request can ever mark an order as paid.

## Lifecycle

| Step | Endpoint | What happens |
|---|---|---|
| 1 | `POST /api/payments/quote` | Server computes the authoritative price (tier + voucher). Nothing is stored. |
| 2 | `POST /api/payments/checkout` | Creates a **Pending** `Payment` row + a Stripe Checkout Session, then returns the hosted page URL. |
| 3 | Stripe hosted page | Customer pays. Card data never touches our servers or database. |
| 4 | `POST /api/payments/webhook` | Signature-verified event settles the payment: status → `Paid`, student account (random temp password), enrollment, progress, cohort seat, audit log, receipt + credentials emails. |
| 5 | `GET /api/payments/checkout-status/:sessionId` | Success screen polls this. If Stripe has the money but the webhook is late, the server reconciles directly with Stripe. |

**Guarantees**

- Amounts are computed server-side only — a tampered browser request cannot change what is charged.
- `Paid` is only ever set by a webhook whose HMAC signature matches `STRIPE_WEBHOOK_SECRET`.
- Every Stripe event id is claimed once, so retried webhooks can never double-enroll a student.
- A late `expired` / `failed` event can never downgrade a settled payment.
- New students receive a **cryptographically random** temporary password, delivered by email only — never in an API response.

## Required environment variables

```bash
STRIPE_SECRET_KEY=sk_live_...        # or sk_test_... while testing
STRIPE_WEBHOOK_SECRET=whsec_...      # Stripe → Developers → Webhooks → your endpoint
PAYMENT_CURRENCY=USD
```

`SMTP_USER` / `SMTP_PASS` must also be set, otherwise receipt and credential emails are only logged to the console (the enrollment still completes).

## Go-live checklist

1. Stripe dashboard → **Developers → API keys** → copy the secret key into `STRIPE_SECRET_KEY`.
2. **Developers → Webhooks → Add endpoint**
   - URL: `https://<your-api-domain>/api/payments/webhook`
   - Events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`,
     `checkout.session.async_payment_failed`, `checkout.session.expired`, `payment_intent.payment_failed`
   - Copy the signing secret into `STRIPE_WEBHOOK_SECRET`.
3. Redeploy the API, then open `GET /api/health` — it must report:
   ```json
   "payments": { "mode": "live", "configured": true, "webhookConfigured": true, "ready": true }
   ```
   Admin → **Payments** shows the same status as a badge.
4. Test with Stripe test cards (`4242 4242 4242 4242`, any future expiry, any CVC) while in test mode, then switch to live keys.

## Behaviour without keys

If `STRIPE_SECRET_KEY` is missing, checkout returns `503 PAYMENTS_NOT_CONFIGURED` and the UI switches to a **manual enquiry**: the lead is saved to the CRM with the quoted amount and admissions follows up with a secure payment link. Nothing is ever recorded as `Paid` without a real charge.

## Verification

```bash
npm run verify:payments
```

Runs 36 checks: pricing/voucher math, temp-password strength, webhook signature enforcement (missing, forged, tampered payloads), and a full end-to-end settlement against a throwaway local MongoDB (settlement, idempotent replays, failed/expired handling, forged-webhook rejection). It forces dummy test keys, so it can never touch live money.
