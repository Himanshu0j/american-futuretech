const crypto = require('crypto');
const CookieConsent = require('../models/CookieConsent');
const { sendError } = require('../utils/apiError');

/**
 * Cookie consent records.
 *
 * `POST /api/consent` is the only public route: it is what the banner calls when
 * a visitor decides. Everything else is admin-only and read-only — a consent
 * record is evidence, so nothing here edits or deletes one.
 *
 * The write is intentionally forgiving: a malformed or unexpected body still
 * produces a valid "essential" record rather than a 400, because the visitor's
 * choice has already taken effect in their browser and losing the record is
 * worse than storing the conservative default.
 */

const CHOICES = ['all', 'essential', 'custom'];
const POLICY_VERSION = '2026-10-17';

const text = (value, max) => String(value == null ? '' : value).trim().slice(0, max);

/** A path, never a full URL: the query string can carry a person's email. */
const cleanPage = (value) => {
  const raw = text(value, 300);
  if (!raw) return '';
  try {
    const url = new URL(raw, 'https://placeholder.local');
    return url.pathname.slice(0, 300);
  } catch (error) {
    return raw.split('?')[0].split('#')[0].slice(0, 300);
  }
};

/**
 * Salted hash of the caller's address.
 *
 * The salt comes from the deployment, so the same address produces a different
 * hash on a different install and the value cannot be reversed by hashing a
 * list of known addresses.
 */
const hashIp = (ip) => {
  const address = String(ip || '').trim();
  if (!address) return '';
  const salt = String(process.env.CONSENT_HASH_SALT || process.env.JWT_SECRET || 'aft-consent').trim();
  return crypto.createHash('sha256').update(`${salt}:${address}`).digest('hex').slice(0, 32);
};

const booleansFor = (choice, categories = {}) => {
  if (choice === 'all') return { necessary: true, analytics: true, marketing: true };
  if (choice === 'essential') return { necessary: true, analytics: false, marketing: false };
  return {
    necessary: true,
    analytics: categories.analytics === true,
    marketing: categories.marketing === true,
  };
};

/** POST /api/consent — the banner's decision. Public. */
const recordConsent = async (req, res) => {
  try {
    const body = req.body || {};
    const requested = text(body.choice, 20).toLowerCase();
    const choice = CHOICES.includes(requested) ? requested : 'essential';

    const record = await CookieConsent.create({
      choice,
      categories: booleansFor(choice, body.categories),
      policyVersion: text(body.policyVersion, 40) || POLICY_VERSION,
      page: cleanPage(body.page),
      // Header first: the browser's own report cannot be spoofed by page script.
      userAgent: text(req.headers['user-agent'], 400),
      language: text(body.language || req.headers['accept-language']?.split(',')[0], 40),
      ipHash: hashIp(req.ip),
    });

    // A record is not personal data, but it is only ever read back by staff, so
    // nothing about it should land in a shared cache.
    res.set('Cache-Control', 'no-store');
    return res.status(201).json({
      success: true,
      id: record._id,
      choice: record.choice,
      recordedAt: record.createdAt,
      policyVersion: record.policyVersion,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

/** GET /api/consent — paginated newest-first list. Admin only. */
const listConsent = async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 200);
    const page = Math.max(Number(req.query.page) || 1, 1);
    const choice = CHOICES.includes(String(req.query.choice || '')) ? String(req.query.choice) : '';

    const filter = choice ? { choice } : {};
    const [total, rows] = await Promise.all([
      CookieConsent.countDocuments(filter),
      CookieConsent.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);

    res.set('Cache-Control', 'no-store');
    return res.json({
      success: true,
      total,
      page,
      limit,
      pages: Math.max(Math.ceil(total / limit), 1),
      records: rows.map((row) => ({
        id: row._id,
        choice: row.choice,
        categories: row.categories,
        policyVersion: row.policyVersion,
        page: row.page,
        userAgent: row.userAgent,
        language: row.language,
        ipHash: row.ipHash,
        createdAt: row.createdAt,
      })),
    });
  } catch (error) {
    return sendError(res, error);
  }
};

/**
 * GET /api/consent/summary — counts for the tiles at the top of the admin
 * screen. `days` bounds the window so the numbers stay useful rather than
 * ever-growing totals.
 */
const summariseConsent = async (req, res) => {
  try {
    const days = Math.min(Math.max(Number(req.query.days) || 30, 1), 365);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const grouped = await CookieConsent.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: '$choice', count: { $sum: 1 } } },
    ]);
    const byChoice = { all: 0, essential: 0, custom: 0 };
    grouped.forEach((row) => {
      if (row._id in byChoice) byChoice[row._id] = row.count;
    });

    const [total, last24h, latest] = await Promise.all([
      CookieConsent.countDocuments({}),
      CookieConsent.countDocuments({ createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }),
      CookieConsent.findOne({}).sort({ createdAt: -1 }).select('createdAt').lean(),
    ]);

    res.set('Cache-Control', 'no-store');
    return res.json({
      success: true,
      windowDays: days,
      total,
      last24h,
      lastRecordedAt: latest?.createdAt || null,
      byChoice,
      windowTotal: byChoice.all + byChoice.essential + byChoice.custom,
      policyVersion: POLICY_VERSION,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

module.exports = {
  recordConsent,
  listConsent,
  summariseConsent,
  POLICY_VERSION,
};
