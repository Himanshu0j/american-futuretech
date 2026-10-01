const mongoose = require('mongoose');

/**
 * Every delivery Stripe makes to POST /api/payments/webhook, kept so the admin
 * can answer the only question that matters when a student says "I paid but got
 * no access": did Stripe actually call us, and what did we do with it?
 *
 * Deliberately NOT a copy of the payload — only the routing facts (event id,
 * type, which payment it was matched to, what we decided, and how long it took).
 * Card and customer data never live here.
 *
 * `rejected` rows are signature failures: the request claimed to be from Stripe
 * but could not be verified. Their writes are throttled in the controller, so a
 * stranger hammering the public endpoint cannot turn this log into a bill.
 */
const WebhookEventSchema = new mongoose.Schema(
  {
    eventId: { type: String, default: '' },
    type: { type: String, default: '' },
    // processed → settled an order
    // pending   → verified, but the money had not settled yet
    // duplicate → already processed (Stripe retry), nothing changed
    // unmatched → no payment row matched the session
    // failed    → handler threw; Stripe will retry
    // rejected  → signature verification failed
    // ignored   → a verified event type we do not act on
    status: {
      type: String,
      enum: ['processed', 'pending', 'duplicate', 'unmatched', 'failed', 'rejected', 'ignored'],
      required: true,
    },
    httpStatus: { type: Number, default: 200 },
    signatureValid: { type: Boolean, default: true },
    message: { type: String, default: '' },
    payment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', default: null },
    invoiceNumber: { type: String, default: '' },
    paymentEmail: { type: String, default: '' },
    sessionId: { type: String, default: '' },
    amount: { type: Number, default: null },
    durationMs: { type: Number, default: 0 },
  },
  { timestamps: true },
);

// The panel always reads "newest first", optionally filtered by status.
WebhookEventSchema.index({ createdAt: -1 });
WebhookEventSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('WebhookEvent', WebhookEventSchema);
