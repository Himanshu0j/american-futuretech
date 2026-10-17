const mongoose = require('mongoose');

/**
 * One visitor's cookie choice, as answered in the site banner.
 *
 * The client asked to "le le details jab cookie accept kare" — so a decision is
 * stored, not just remembered in the visitor's own browser. What is stored is
 * deliberately narrow:
 *
 *   · WHICH choice was made (everything / essentials only / a custom mix),
 *   · WHEN it was made and on which page,
 *   · which browser reported it, and
 *   · a salted HASH of the address it came from.
 *
 * No name, email, phone or raw IP. The hash is enough to recognise a repeat
 * decision from the same connection for counting, and cannot be turned back
 * into an address without the deployment's salt.
 *
 * Records are never edited: a visitor who changes their mind writes a NEW row,
 * so the history of consent is intact (which is the point of keeping it).
 */
const CookieConsentSchema = new mongoose.Schema(
  {
    // `all`       — analytics + marketing cookies allowed
    // `essential` — only what the site needs to function (the default answer)
    // `custom`    — the visitor picked individual categories
    choice: {
      type: String,
      enum: ['all', 'essential', 'custom'],
      required: true,
      index: true,
    },
    // The individual switches as they stood when the record was written. For
    // `all` / `essential` they are derived from the choice, so a report never
    // has to guess what "all" meant at that moment.
    categories: {
      necessary: { type: Boolean, default: true },
      analytics: { type: Boolean, default: false },
      marketing: { type: Boolean, default: false },
    },
    // Which version of the notice the visitor answered. Bumping it re-asks
    // everybody, and old rows still say which wording they agreed to.
    policyVersion: { type: String, default: '', trim: true, maxlength: 40 },
    // Where the banner was answered ("/courses?x=1" is trimmed to its path).
    page: { type: String, default: '', trim: true, maxlength: 300 },
    // Enough to tell a phone from a desktop in a report; not a fingerprint.
    userAgent: { type: String, default: '', trim: true, maxlength: 400 },
    language: { type: String, default: '', trim: true, maxlength: 40 },
    ipHash: { type: String, default: '', trim: true, maxlength: 64, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// The admin screen reads newest-first and filters by choice.
CookieConsentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('CookieConsent', CookieConsentSchema);
