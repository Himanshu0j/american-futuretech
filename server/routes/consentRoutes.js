const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const {
  recordConsent,
  listConsent,
  summariseConsent,
} = require('../controllers/consentController');
const { protect } = require('../middleware/auth');

/**
 * Cookie consent records.
 *
 * Only the recording route is public — that is what the banner calls, and it is
 * the same decision the visitor just made in the UI, so it carries no session.
 * It is rate-limited per address because the body is unauthenticated and every
 * accepted request writes a row; without a ceiling a script could fill the
 * collection with noise and make the real answers unreadable.
 *
 * Reading is `protect`-only rather than permission-gated for the same reason the
 * issue board is: this is a small compliance screen, and a missing grant would
 * hide it from the one person who needs it. Nothing in a record identifies a
 * person, so there is no cross-tenant secret to leak.
 */
const consentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many consent records from this address. Please try again later.',
  },
});

router.post('/', consentLimiter, recordConsent);
router.get('/summary', protect, summariseConsent);
router.get('/', protect, listConsent);

module.exports = router;
