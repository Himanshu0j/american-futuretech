const SiteSettings = require('../models/SiteSettings');
const AuditLog = require('../models/AuditLog');
const { encryptSecret, decryptSecret, maskSecret } = require('../utils/secretVault');
const { sendError } = require('../utils/apiError');
const {
  getPaymentStatus,
  setRuntimeSecrets,
  setRuntimeCurrency,
} = require('../config/payments');

// @desc    Get site settings
// @route   GET /api/settings
// @access  Public
const getSiteSettings = async (req, res) => {
  try {
    let settings = await SiteSettings.findOne();
    if (!settings) {
      settings = await SiteSettings.create({});
    } else {
      let modified = false;
      const schemaDefaults = new SiteSettings().toObject();
      const keysToCheck = ['hero', 'personalizedLearning', 'capstone', 'roadmap', 'aboutCMS', 'globalCtas', 'trustedCompanies', 'sisterCompany', 'pedagogy', 'careerSupport'];

      // Populate the leadership roster for existing databases that predate the team CMS
      if (!settings.leadership || settings.leadership.length === 0) {
        settings.leadership = schemaDefaults.leadership;
        modified = true;
      }
      
      for (const key of keysToCheck) {
        if (!settings[key] || (typeof settings[key] === 'object' && Object.keys(settings[key].toObject ? settings[key].toObject() : settings[key]).length === 0)) {
          settings[key] = schemaDefaults[key];
          modified = true;
        }
      }

      // Check specifically if capstone.tools or roadmap.steps or trustedCompanies.companies are empty
      if (!settings.capstone?.tools || settings.capstone.tools.length === 0) {
        if (!settings.capstone) settings.capstone = {};
        settings.capstone.tools = schemaDefaults.capstone.tools;
        modified = true;
      }
      if (!settings.roadmap?.steps || settings.roadmap.steps.length === 0) {
        if (!settings.roadmap) settings.roadmap = {};
        settings.roadmap.steps = schemaDefaults.roadmap.steps;
        modified = true;
      }
      if (!settings.trustedCompanies?.companies || settings.trustedCompanies.companies.length === 0) {
        if (!settings.trustedCompanies) settings.trustedCompanies = {};
        settings.trustedCompanies.companies = schemaDefaults.trustedCompanies.companies;
        modified = true;
      }

      if (modified) {
        await settings.save();
      }
    }
    // Gateway secrets are write-only: the browser never receives them.
    return res.status(200).json({ success: true, settings: stripGatewaySecrets(settings) });
  } catch (error) {
    return sendError(res, error);
  }
};

// Document fields mongoose manages — never written back from a request body.
const SYSTEM_PATHS = ['_id', '__v', 'createdAt', 'updatedAt'];

const sanitizeSettingsPayload = (body) => {
  const clean = {};
  for (const [key, value] of Object.entries(body || {})) {
    if (!SYSTEM_PATHS.includes(key)) clean[key] = value;
  }
  return clean;
};

/**
 * Find payload paths the schema does not declare.
 *
 * Mongoose runs with `strict: true`, so unknown paths are dropped while the
 * request still returns 200 OK — the exact reason an admin could "successfully
 * save" capstone projects that never appeared on the site. We now report these
 * paths back to the caller instead of pretending the save worked.
 */
const findUnstorablePaths = (body) => {
  const { schema } = SiteSettings;
  const unknown = [];
  if (!body || typeof body !== 'object') return unknown;

  const isKnownPath = (path) => Boolean(schema.paths[path]);
  const isKnownBranch = (key) => Object.keys(schema.paths).some((p) => p.startsWith(`${key}.`));

  for (const [key, value] of Object.entries(body)) {
    if (SYSTEM_PATHS.includes(key)) continue;
    if (!isKnownPath(key) && !isKnownBranch(key)) {
      unknown.push(key);
      continue;
    }
    if (!value || typeof value !== 'object' || Array.isArray(value)) continue;

    for (const [subKey, subValue] of Object.entries(value)) {
      if (SYSTEM_PATHS.includes(subKey)) continue;
      const subPath = schema.paths[`${key}.${subKey}`];
      if (!subPath) {
        unknown.push(`${key}.${subKey}`);
        continue;
      }
      // Free-form Mixed/Map sections (the site editor overrides) accept any key.
      const instance = subPath.instance || (subPath.caster && subPath.caster.instance);
      if (instance === 'Mixed' || instance === 'Map') continue;
      // Arrays of sub-documents: verify the keys inside each entry too.
      if (Array.isArray(subValue) && subPath.schema) {
        for (const item of subValue.slice(0, 25)) {
          if (!item || typeof item !== 'object') continue;
          for (const innerKey of Object.keys(item)) {
            if (SYSTEM_PATHS.includes(innerKey)) continue;
            if (!subPath.schema.paths[innerKey]) unknown.push(`${key}.${subKey}[].${innerKey}`);
          }
        }
      }
    }
  }

  return unknown;
};

// @desc    Update site settings
// @route   PUT /api/settings
// @access  Private (SuperAdmin, Admin)
const updateSiteSettings = async (req, res) => {
  try {
    const ignoredPaths = findUnstorablePaths(req.body);
    if (ignoredPaths.length) {
      console.warn(
        `[Settings] ⚠️  Payload contained fields this schema cannot store and they were IGNORED: ${ignoredPaths.join(', ')}`,
      );
    }

    const payload = sanitizeSettingsPayload(req.body);

    // The gateway block is excluded from the general settings save on purpose:
    // the browser only ever holds masked hints, so writing this key back would
    // wipe the encrypted Stripe secrets. It is saved through the dedicated
    // PUT /api/settings/payment-gateway endpoint instead.
    if (payload.paymentGateway) delete payload.paymentGateway;

    let settings = await SiteSettings.findOne();
    if (!settings) {
      settings = new SiteSettings(payload);
    } else {
      settings.set(payload);
    }
    await settings.save();

    await AuditLog.create({
      actor: req.user?._id,
      actorName: req.user?.name || 'SuperAdmin',
      actorRole: req.user?.role || 'SUPERADMIN',
      action: 'SITE_SETTINGS_UPDATED',
      entity: 'SiteSettings',
      details: 'Global site configuration, CMS sections, and banners updated',
    });

    return res.status(200).json({
      success: true,
      settings,
      ignoredPaths,
      warning: ignoredPaths.length
        ? `These fields are not part of the settings schema and were NOT saved: ${ignoredPaths.join(', ')}`
        : null,
    });
  } catch (error) {
    return sendError(res, error);
  }
};


// @desc    Get audit logs
// @route   GET /api/settings/audit-logs
// @access  Private (SuperAdmin, Admin)
const getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(100);
    return res.status(200).json({ success: true, count: logs.length, logs });
  } catch (error) {
    return sendError(res, error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Inline site editor — per-route text & image overrides
// ─────────────────────────────────────────────────────────────────────────────

const EDITOR_LIMITS = {
  routeLength: 120,
  keyLength: 90,
  textLength: 600,
  imageUrlLength: 1000,
  entriesPerRoute: 400,
  routes: 60,
};

const normalizeRoute = (route) => {
  const raw = String(route || '/').split('?')[0].split('#')[0];
  const clean = raw.replace(/\/+$/, '') || '/';
  if (clean.length > EDITOR_LIMITS.routeLength) return null;
  if (!/^\/[A-Za-z0-9\-_/:.@~]*$/.test(clean)) return null;
  return clean;
};

const isSafeImageUrl = (value) => {
  const url = String(value || '').trim();
  if (!url || url.length > EDITOR_LIMITS.imageUrlLength) return false;
  return /^(https?:\/\/|\/)[^\s"'<>]+$/i.test(url);
};

const OVERRIDE_KEY_PATTERN = /^[A-Za-z0-9_\-:#>.]+$/;

/**
 * Normalise one override entry.
 *
 * Returns `{ entry }` when it can be stored, or `{ reason }` when it cannot. The
 * reason travels back to the editor so the admin is told WHICH entry failed and
 * WHY — previously a too-long key or value was dropped with nothing but an
 * anonymous "N were rejected" count to go on.
 */
const normalizeEntry = (key, entry, kind) => {
  const keyStr = String(key ?? '');
  if (!keyStr) return { reason: 'the element key is empty' };
  if (keyStr.length > EDITOR_LIMITS.keyLength) {
    return { reason: `its key is ${keyStr.length} characters long, over the ${EDITOR_LIMITS.keyLength}-character limit` };
  }
  if (!OVERRIDE_KEY_PATTERN.test(keyStr)) {
    return { reason: 'its key contains characters the editor cannot store' };
  }

  const value = typeof entry === 'string' ? entry : entry?.value;
  if (typeof value !== 'string') return { reason: 'no value was captured for it' };

  const trimmed = value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
  if (kind === 'image') {
    if (!isSafeImageUrl(trimmed)) {
      return { reason: `the image URL must start with https:// (or /) and stay under ${EDITOR_LIMITS.imageUrlLength} characters` };
    }
  } else if (trimmed.length > EDITOR_LIMITS.textLength) {
    return { reason: `the text is ${trimmed.length} characters long, over the ${EDITOR_LIMITS.textLength}-character limit` };
  }

  const original = typeof entry?.original === 'string' ? entry.original.slice(0, EDITOR_LIMITS.textLength) : '';

  return {
    entry: {
      key: keyStr,
      value: trimmed,
      original,
      updatedAt: new Date(),
    },
  };
};

// @desc    Read the overrides for one public route
// @route   GET /api/settings/site-editor?route=/courses
// @access  Public
const getSiteEditorOverrides = async (req, res) => {
  try {
    const route = normalizeRoute(req.query.route);
    if (!route) {
      return res.status(400).json({ success: false, message: 'A valid route (e.g. /courses) is required.' });
    }

    const settings = await SiteSettings.findOne().lean();
    return res.status(200).json({
      success: true,
      route,
      text: settings?.textOverrides?.[route] || {},
      images: settings?.imageOverrides?.[route] || {},
    });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc    Save (merge) text/image edits for one public route
// @route   PUT /api/settings/site-editor
// @access  Private (SuperAdmin / SETTINGS_EDIT / HOMEPAGE_EDIT)
const saveSiteEditorOverrides = async (req, res) => {
  try {
    const { route: rawRoute, text = {}, images = {}, removeText = [], removeImages = [] } = req.body || {};

    const route = normalizeRoute(rawRoute);
    if (!route) {
      return res.status(400).json({ success: false, message: 'A valid route (e.g. /courses) is required.' });
    }

    let settings = await SiteSettings.findOne();
    if (!settings) settings = new SiteSettings();

    const textMap = { ...(settings.textOverrides ? Object.fromEntries(Object.entries(settings.textOverrides)) : {}) };
    const imageMap = { ...(settings.imageOverrides ? Object.fromEntries(Object.entries(settings.imageOverrides)) : {}) };

    const routeText = { ...(textMap[route] || {}) };
    const routeImages = { ...(imageMap[route] || {}) };

    const rejected = [];      // legacy: ["text.<key>", ...] — kept for older clients
    const rejections = [];    // { kind, key, reason } — what the editor now reports
    let accepted = 0;

    for (const [key, entry] of Object.entries(text)) {
      const { entry: normalized, reason } = normalizeEntry(key, entry, 'text');
      if (!normalized) {
        rejected.push(`text.${key}`);
        rejections.push({ kind: 'text', key: String(key), reason });
        continue;
      }
      routeText[normalized.key] = { original: normalized.original, value: normalized.value, updatedAt: normalized.updatedAt };
      accepted += 1;
    }

    for (const [key, entry] of Object.entries(images)) {
      const { entry: normalized, reason } = normalizeEntry(key, entry, 'image');
      if (!normalized) {
        rejected.push(`image.${key}`);
        rejections.push({ kind: 'image', key: String(key), reason });
        continue;
      }
      routeImages[normalized.key] = { original: normalized.original, value: normalized.value, updatedAt: normalized.updatedAt };
      accepted += 1;
    }

    removeText.forEach((key) => { delete routeText[key]; });
    removeImages.forEach((key) => { delete routeImages[key]; });

    if (Object.keys(routeText).length > EDITOR_LIMITS.entriesPerRoute) {
      return res.status(400).json({
        success: false,
        message: `Too many text overrides for one page (limit ${EDITOR_LIMITS.entriesPerRoute}).`,
      });
    }

    if (Object.keys(routeText).length === 0) delete textMap[route]; else textMap[route] = routeText;
    if (Object.keys(routeImages).length === 0) delete imageMap[route]; else imageMap[route] = routeImages;

    if (Object.keys(textMap).length > EDITOR_LIMITS.routes || Object.keys(imageMap).length > EDITOR_LIMITS.routes) {
      return res.status(400).json({
        success: false,
        message: `Too many edited pages (limit ${EDITOR_LIMITS.routes}).`,
      });
    }

    settings.textOverrides = textMap;
    settings.imageOverrides = imageMap;
    settings.markModified('textOverrides');
    settings.markModified('imageOverrides');
    await settings.save();

    await AuditLog.create({
      actor: req.user?._id,
      actorName: req.user?.name || 'Administrator',
      actorRole: req.user?.role || 'SUPERADMIN',
      action: 'SITE_TEXT_EDITED',
      entity: 'SiteSettings',
      details: `Inline editor saved ${accepted} change(s) on ${route}` + (rejected.length ? ` — rejected: ${rejected.join(', ')}` : ''),
    }).catch(() => {});

    return res.status(200).json({
      success: true,
      route,
      text: routeText,
      images: routeImages,
      saved: accepted,
      rejected,
      rejections,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc    Reset every override on one page (restore the coded defaults)
// @route   DELETE /api/settings/site-editor?route=/courses
// @access  Private (SuperAdmin / SETTINGS_EDIT / HOMEPAGE_EDIT)
const resetSiteEditorRoute = async (req, res) => {
  try {
    const route = normalizeRoute(req.query.route || req.body?.route);
    if (!route) {
      return res.status(400).json({ success: false, message: 'A valid route (e.g. /courses) is required.' });
    }

    const settings = await SiteSettings.findOne();
    if (!settings) return res.status(200).json({ success: true, route, text: {}, images: {} });

    const textMap = { ...(settings.textOverrides || {}) };
    const imageMap = { ...(settings.imageOverrides || {}) };
    const removedText = Object.keys(textMap[route] || {}).length;
    const removedImages = Object.keys(imageMap[route] || {}).length;

    delete textMap[route];
    delete imageMap[route];

    settings.textOverrides = textMap;
    settings.imageOverrides = imageMap;
    settings.markModified('textOverrides');
    settings.markModified('imageOverrides');
    await settings.save();

    await AuditLog.create({
      actor: req.user?._id,
      actorName: req.user?.name || 'Administrator',
      actorRole: req.user?.role || 'SUPERADMIN',
      action: 'SITE_TEXT_RESET',
      entity: 'SiteSettings',
      details: `Inline editor reset ${route} (${removedText} text, ${removedImages} image override(s) removed)`,
    }).catch(() => {});

    return res.status(200).json({ success: true, route, text: {}, images: {}, removedText, removedImages });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc    Every page that has text/image edits, in one list (admin overview)
// @route   GET /api/settings/site-editor/summary
// @access  Private (SuperAdmin / SETTINGS_VIEW / SETTINGS_EDIT)
const getSiteEditorSummary = async (req, res) => {
  try {
    const settings = await SiteSettings.findOne().lean();
    const textMap = settings?.textOverrides || {};
    const imageMap = settings?.imageOverrides || {};

    const routes = Array.from(new Set([...Object.keys(textMap), ...Object.keys(imageMap)]));
    const pages = routes.map((route) => {
      const text = textMap[route] || {};
      const images = imageMap[route] || {};
      const entries = Object.values(text).map((e) => e?.updatedAt).filter(Boolean);
      return {
        route,
        textCount: Object.keys(text).length,
        imageCount: Object.keys(images).length,
        total: Object.keys(text).length + Object.keys(images).length,
        updatedAt: entries.length ? new Date(Math.max(...entries.map((d) => new Date(d).getTime()))) : null,
        samples: Object.values(text).slice(0, 3).map((e) => ({ original: e?.original || '', value: e?.value || '' })),
      };
    }).sort((a, b) => b.total - a.total);

    return res.status(200).json({
      success: true,
      pages,
      totals: {
        pages: pages.length,
        text: pages.reduce((sum, p) => sum + p.textCount, 0),
        images: pages.reduce((sum, p) => sum + p.imageCount, 0),
      },
    });
  } catch (error) {
    return sendError(res, error);
  }
};

/** Remove anything the browser must never receive. */
const stripGatewaySecrets = (settings) => {
  const plain = settings?.toObject ? settings.toObject() : settings;
  if (!plain) return plain;
  if (plain.paymentGateway) {
    delete plain.paymentGateway.secretKeyEncrypted;
    delete plain.paymentGateway.webhookSecretEncrypted;
  }
  return plain;
};

/**
 * Current gateway status for the admin screen. Never returns a secret — only
 * whether one exists, where it came from, and a masked hint.
 */
const getPaymentGatewayStatus = async (req, res) => {
  try {
    const settings = (await SiteSettings.findOne().lean()) || {};
    const gateway = settings.paymentGateway || {};
    return res.status(200).json({
      success: true,
      gateway: {
        enabled: gateway.enabled !== false,
        provider: gateway.provider || 'stripe',
        mode: gateway.mode === 'live' ? 'live' : 'test',
        publishableKey: gateway.publishableKey || '',
        currency: gateway.currency || 'USD',
        checkoutNote: gateway.checkoutNote || '',
        disabledMessage: gateway.disabledMessage || '',
        secretKeyConfigured: Boolean(gateway.secretKeyEncrypted) || Boolean(process.env.STRIPE_SECRET_KEY),
        secretKeyHint: gateway.secretKeyHint || (process.env.STRIPE_SECRET_KEY ? 'set via environment' : ''),
        webhookSecretConfigured: Boolean(gateway.webhookSecretEncrypted) || Boolean(process.env.STRIPE_WEBHOOK_SECRET),
        webhookSecretHint: gateway.webhookSecretHint || (process.env.STRIPE_WEBHOOK_SECRET ? 'set via environment' : ''),
        lastUpdatedBy: gateway.lastUpdatedBy || '',
        lastUpdatedAt: gateway.lastUpdatedAt || null,
      },
      payments: getPaymentStatus(),
    });
  } catch (error) {
    return sendError(res, error);
  }
};

/**
 * Save gateway configuration. Secrets arrive here, are encrypted immediately and
 * are never echoed back — the response only carries masked hints.
 */
const updatePaymentGateway = async (req, res) => {
  try {
    const body = req.body || {};
    let settings = await SiteSettings.findOne();
    if (!settings) settings = new SiteSettings();
    settings.paymentGateway = settings.paymentGateway || {};

    const gateway = settings.paymentGateway;

    // Parse the on/off switch strictly. Loose truthiness here meant a
    // form-encoded or string "false" (or 0) switched card payments back ON
    // after the client had deliberately turned them off.
    if (body.enabled !== undefined) {
      const raw = body.enabled;
      const falsy = raw === false || raw === 0
        || ['false', '0', 'no', 'off', ''].includes(String(raw).trim().toLowerCase());
      gateway.enabled = !falsy;
    }
    if (body.mode !== undefined) gateway.mode = body.mode === 'live' ? 'live' : 'test';
    if (body.publishableKey !== undefined) gateway.publishableKey = String(body.publishableKey || '').trim();
    if (body.currency !== undefined) gateway.currency = String(body.currency || 'USD').toUpperCase();
    if (body.checkoutNote !== undefined) gateway.checkoutNote = String(body.checkoutNote || '').trim();
    if (body.disabledMessage !== undefined) gateway.disabledMessage = String(body.disabledMessage || '').trim();

    let secretKeyToApply;
    let webhookSecretToApply;

    if (body.secretKey) {
      const value = String(body.secretKey).trim();
      if (!value.startsWith('sk_')) {
        return res.status(400).json({
          success: false,
          message: 'That does not look like a Stripe secret key (it must start with "sk_").',
        });
      }
      gateway.secretKeyEncrypted = encryptSecret(value);
      gateway.secretKeyHint = maskSecret(value);
      secretKeyToApply = value;
    }

    if (body.webhookSecret) {
      const value = String(body.webhookSecret).trim();
      if (!value.startsWith('whsec_')) {
        return res.status(400).json({
          success: false,
          message: 'That does not look like a Stripe webhook secret (it must start with "whsec_").',
        });
      }
      gateway.webhookSecretEncrypted = encryptSecret(value);
      gateway.webhookSecretHint = maskSecret(value);
      webhookSecretToApply = value;
    }

    if (body.clearSecrets === true) {
      gateway.secretKeyEncrypted = '';
      gateway.secretKeyHint = '';
      gateway.webhookSecretEncrypted = '';
      gateway.webhookSecretHint = '';
      secretKeyToApply = '';
      webhookSecretToApply = '';
    }

    // Live keys must never be mixed with test ones — a live key in test mode (or
    // the reverse) is the classic way to charge a real card by accident.
    const effectiveSecret = secretKeyToApply !== undefined
      ? secretKeyToApply
      : decryptSecret(gateway.secretKeyEncrypted) || process.env.STRIPE_SECRET_KEY || '';
    if (effectiveSecret.startsWith('sk_live_') && gateway.mode !== 'live') {
      return res.status(400).json({
        success: false,
        message: 'A live secret key can only be saved with the gateway in LIVE mode.',
      });
    }
    if (effectiveSecret.startsWith('sk_test_') && gateway.mode === 'live') {
      return res.status(400).json({
        success: false,
        message: 'A test secret key cannot be used in LIVE mode. Switch to TEST or paste a live key.',
      });
    }

    gateway.lastUpdatedBy = req.user?.email || req.user?.name || 'admin';
    gateway.lastUpdatedAt = new Date();

    await settings.save();

    // Apply immediately — no restart needed for the keys to take effect.
    setRuntimeSecrets({ secretKey: secretKeyToApply, webhookSecret: webhookSecretToApply });
    setRuntimeCurrency(gateway.currency);

    await AuditLog.create({
      actor: req.user?._id,
      actorName: req.user?.name || 'Admin',
      actorRole: req.user?.role || 'ADMIN',
      action: 'PAYMENT_GATEWAY_UPDATED',
      entity: 'SiteSettings',
      entityId: String(settings._id),
      details: `Gateway ${gateway.enabled ? 'enabled' : 'disabled'} in ${gateway.mode} mode${secretKeyToApply ? ' (secret key updated)' : ''}${webhookSecretToApply ? ' (webhook secret updated)' : ''}`,
    }).catch(() => {});

    return res.status(200).json({
      success: true,
      message: 'Payment gateway settings saved. Secrets are stored encrypted and never displayed again.',
      gateway: {
        enabled: gateway.enabled !== false,
        mode: gateway.mode,
        publishableKey: gateway.publishableKey,
        currency: gateway.currency,
        secretKeyConfigured: Boolean(gateway.secretKeyEncrypted) || Boolean(process.env.STRIPE_SECRET_KEY),
        secretKeyHint: gateway.secretKeyHint || (process.env.STRIPE_SECRET_KEY ? 'set via environment' : ''),
        webhookSecretConfigured: Boolean(gateway.webhookSecretEncrypted) || Boolean(process.env.STRIPE_WEBHOOK_SECRET),
        webhookSecretHint: gateway.webhookSecretHint || (process.env.STRIPE_WEBHOOK_SECRET ? 'set via environment' : ''),
      },
      payments: getPaymentStatus(),
    });
  } catch (error) {
    return sendError(res, error);
  }
};

/**
 * Boot-time loader: decrypt the admin-stored gateway secrets into memory so the
 * sync gateway accessors keep working, and apply the admin's currency.
 */
const loadPaymentGatewaySecrets = async () => {
  try {
    const settings = await SiteSettings.findOne().lean();
    const gateway = settings?.paymentGateway;
    if (!gateway) return getPaymentStatus();
    setRuntimeSecrets({
      secretKey: gateway.secretKeyEncrypted ? decryptSecret(gateway.secretKeyEncrypted) : '',
      webhookSecret: gateway.webhookSecretEncrypted ? decryptSecret(gateway.webhookSecretEncrypted) : '',
    });
    setRuntimeCurrency(gateway.currency);
    return getPaymentStatus();
  } catch (error) {
    console.warn(`[Payments] Could not load gateway secrets: ${error.message}`);
    return getPaymentStatus();
  }
};

module.exports = {
  getSiteSettings,
  updateSiteSettings,
  stripGatewaySecrets,
  getPaymentGatewayStatus,
  updatePaymentGateway,
  loadPaymentGatewaySecrets,
  getAuditLogs,
  getSiteEditorOverrides,
  getSiteEditorSummary,
  saveSiteEditorOverrides,
  resetSiteEditorRoute,
  // Exposed for the CMS schema/field contract test.
  __test__: { findUnstorablePaths, sanitizeSettingsPayload },
};
