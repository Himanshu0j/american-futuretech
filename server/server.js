const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const { getDbInfo } = require('./config/db');
const { getPaymentStatus } = require('./config/payments');
const { assertAuthConfig } = require('./config/auth');
const { autoSeedIfEmpty } = require('./utils/seeder');
const { startSmokeTestWatchdog, getSmokeTestWatchdogStatus } = require('./jobs/smokeTestWatchdog');
const { buildCorsOptions } = require('./config/cors');
const errorHandler = require('./middleware/errorHandler');

// Resolve the JWT signing secret at boot. A missing or unsafe value never stops
// the boot (that would take the public site down with it) — config/auth.js
// generates a random per-process secret instead, warns loudly, and reports it
// through /api/health. The leaked value published in this repo is never used.
const authStatus = assertAuthConfig();

// Deployment provenance. Render exports RENDER_GIT_COMMIT (and the branch) to
// the running service, so /api/health can say which commit this process was
// actually built from. `npm run verify:deploy` compares it against the pushed
// HEAD — the only way to distinguish "the deploy shipped" from "the push
// reached GitHub and the box kept running the previous build".
// `null` means the host did not expose a revision, not that it is current.
/**
 * The revision the built website was stamped with (client/vite.config.js).
 *
 * A host that runs the API and the website as one deployment has no
 * RENDER_GIT_COMMIT to read, and /api/health reporting `null` would make "did
 * the push actually ship?" unanswerable — the one question this field exists
 * for. The bundle being served already carries the answer in its
 * `<meta name="x-aft-commit">`, so read it from there instead of giving up.
 */
const readServedStamp = () => {
  try {
    const html = fs.readFileSync(path.join(__dirname, '../client/dist/index.html'), 'utf8');
    const match = html.match(/<meta[^>]*name=["']x-aft-commit["'][^>]*content=["']([^"']+)["']/i);
    const commit = match ? match[1].trim() : '';
    return commit && commit !== 'unknown' ? commit : null;
  } catch (error) {
    return null;
  }
};

const buildInfo = {
  commit:
    (
      process.env.RENDER_GIT_COMMIT ||
      process.env.GIT_COMMIT ||
      process.env.COMMIT_SHA ||
      process.env.SOURCE_VERSION ||
      ''
    ).trim() || readServedStamp(),
  branch:
    (
      process.env.RENDER_GIT_BRANCH ||
      process.env.GIT_BRANCH ||
      ''
    ).trim() || null,
};

// Initialize database and auto-seed if empty
connectDB().then(async () => {
  // Bring any admin-saved gateway secrets into memory before serving traffic,
  // so real payments work without a restart after the client pastes their keys.
  const { loadPaymentGatewaySecrets } = require('./controllers/settingsController');
  const paymentStatus = await loadPaymentGatewaySecrets();
  console.log(`[Payments] provider=${paymentStatus.provider} mode=${paymentStatus.mode} source=${paymentStatus.source} ready=${paymentStatus.ready}`);

  // Nobody has to open the admin panel for a smoke-test charge to be refunded:
  // the watchdog recovers and refunds stranded charges on its own timer, and
  // emails the owner when the signed webhook never arrived. Started here so its
  // first pass can already talk to Stripe.
  startSmokeTestWatchdog();

  // Set SEED_ON_BOOT=false once the database holds real content and you never
  // want the demo dataset re-created on a fresh/empty database.
  if (process.env.SEED_ON_BOOT === 'false') {
    console.log('[Seeder Skipped]: SEED_ON_BOOT=false.');
    return;
  }
  autoSeedIfEmpty();
});

const app = express();

// Exactly one reverse-proxy hop sits in front of this app (Render's router,
// Hostinger's nginx / Node app runner, any TLS-terminating proxy). Without
// this, `req.ip` is the proxy's own address, so the per-IP limiter on
// /api/leads/apply would throttle every visitor on earth as if they were one
// person — and express-rate-limit would log a validation error on every
// request that carries X-Forwarded-For.
//
// `1` (one trusted hop) and never `true`: with `true` a caller could forge its
// own address by sending its own X-Forwarded-For, which is the very thing the
// limiter is supposed to prevent. One hop means only the header appended by the
// proxy we actually sit behind is believed.
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: false,
}));

// CORS Configuration — an explicit allowlist, never a reflected origin.
// Allowed origins live in server/config/cors.js; an unlisted origin gets no
// CORS headers, so the browser refuses to let the calling page read the reply.
app.use(cors(buildCorsOptions()));

// Rate limiting for public leads apply endpoint
const applyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 60,
  message: {
    success: false,
    message: 'Too many requests submitted from this IP, please try again in 15 minutes.',
  },
});

// Parsers
//
// The size limits are explicit, and deliberately so. Express defaults to 100 kB,
// which turned out to be SMALLER than the admin's own saved content: the CMS
// re-sends the stored settings document on every publish, and once the inline
// editor's text/image overrides grew the document past 100 kB, every single
// save answered 413 "request entity too large". The client experienced that as
// "admin se kuch bhi update nahi ho raha" — nothing on the site could be
// changed, from any tab, while every request still looked like a server fault.
//
// The inline editor gets its own, larger ceiling mounted first: its own limits
// (1500 entries x 2000 characters per page) allow a single-page payload that
// would otherwise 413 long before the editor's own validation ever ran. The
// global ceiling stays far below the 2 MB "oversized body" probe the security
// suite asserts is refused, so the DoS protection is unchanged.
app.use('/api/settings/site-editor', express.json({ limit: '8mb' }));
// `verify` keeps the untouched request body around so the Stripe webhook can be
// validated against its signature (a re-serialized body would break the hash).
app.use(
  express.json({
    limit: '1mb',
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  }),
);
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Healthcheck — also reports whether stored content is durable across restarts
app.get('/api/health', (req, res) => {
  const db = getDbInfo();
  const payments = getPaymentStatus();
  const warnings = [];
  if (db.ephemeral) {
    warnings.push(
      'Ephemeral in-memory database: admin content is wiped on every restart/redeploy. Set MONGODB_URI to a persistent MongoDB (e.g. MongoDB Atlas).',
    );
  }
  if (!db.ephemeral && !db.persistedRequired) {
    // Durable right now, but nothing stops a missing/typo'd MONGODB_URI from
    // silently degrading this deployment later. Lock it in.
    warnings.push(
      'Hardening recommended: set REQUIRE_PERSISTENT_DB=true so the API refuses to boot on a temporary database instead of silently losing admin content.',
    );
  }
  if (authStatus && authStatus.warning) warnings.push(authStatus.warning);
  if (payments.warning) warnings.push(payments.warning);

  res.status(200).json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'American FutureTech Enterprise Core API',
    uptimeSeconds: Math.round(process.uptime()),
    build: buildInfo,
    database: db,
    payments,
    auth: authStatus,
    // Background safety nets, so "is a stranded charge going to be refunded
    // tonight?" is answerable without reading deploy logs.
    jobs: { smokeTestWatchdog: getSmokeTestWatchdogStatus() },
    warnings,
    warning: warnings[0] || null,
  });
});

// Mount Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/courses', require('./routes/courseRoutes'));
app.use('/api/curriculum', require('./routes/curriculumRoutes'));
app.use('/api/lms', require('./routes/lmsRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/coupons', require('./routes/couponRoutes'));
app.use('/api/leads/apply', applyLimiter);
app.use('/api/leads', require('./routes/leadRoutes'));
app.use('/api/batches', require('./routes/batchRoutes'));
app.use('/api/students', require('./routes/studentRoutes'));
app.use('/api/jobs', require('./routes/jobRoutes'));
app.use('/api/content', require('./routes/contentRoutes'));
app.use('/api/support', require('./routes/supportRoutes'));
// Client issue reports: an admin board where a screenshot + a note is recorded
// and copied back out verbatim.
app.use('/api/issues', require('./routes/issueRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/settings', require('./routes/settingsRoutes'));
const uploadRoutes = require('./routes/uploadRoutes');
app.use('/api/upload', uploadRoutes);
app.use('/api/admin/lms', require('./routes/lmsAdminRoutes'));
app.use('/api/admin/certificates', require('./routes/certificateAdminRoutes'));

// Unknown API routes answer in the API's own shape.
//
// Without this, a request the router did not recognise (an unsupported verb on
// an existing path, a typo, a crawler) fell through to Express's default
// handler and returned an HTML error page — unparseable for every JSON client,
// and it surfaced in the admin panel as a mystery crash. This does not create
// or change any route: it only formats the 404 that already happened.
app.use('/api', (req, res) => {
  res.status(404).json({
    success: false,
    code: 'ROUTE_NOT_FOUND',
    message: `API route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Serve uploaded static assets. The database copy is the fallback: a redeploy
// wipes the container disk, and without it every previously uploaded logo and
// card image started 404-ing days after the admin uploaded it.
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.get('/uploads/:filename', uploadRoutes.serveStored);

// A miss stays a miss. express.static finds nothing on disk after a redeploy
// wiped it, serveStored finds nothing in the database, and its `next()` used to
// hand the request to the SPA catch-all below — which answered 200 text/html
// for a missing image. That is only reachable when the API and the website run
// on the same origin, and it turned every broken asset into a fake success.
app.use('/uploads', (req, res) => {
  res.status(404).json({
    success: false,
    code: 'ASSET_NOT_FOUND',
    message: `Upload not found: ${req.originalUrl}`,
  });
});

// Serve static assets in production if client build exists
/**
 * The built index.html, re-read only when the file actually changes.
 *
 * A redeploy replaces the file while this process keeps running, so caching it
 * for the process lifetime would serve the previous page shell until a restart.
 */
let clientHtmlCache = { path: '', mtimeMs: 0, html: '' };

const readClientHtml = (clientDist) => {
  const file = path.join(clientDist, 'index.html');
  const { mtimeMs } = fs.statSync(file);
  if (clientHtmlCache.path !== file || clientHtmlCache.mtimeMs !== mtimeMs) {
    clientHtmlCache = { path: file, mtimeMs, html: fs.readFileSync(file, 'utf8') };
  }
  return clientHtmlCache.html;
};

/**
 * Serve the SPA shell with the CURRENT settings embedded in it.
 *
 * The client used to render its coded defaults (and later a cached copy of an
 * older reply) and only then swap in the saved content, which is what showed
 * "pehle purana text, phir naya text" on every reload. The browser's first paint
 * can only know what the HTML tells it, so the settings snapshot rides along in
 * a script tag and the app starts from it: whatever the serving instance would
 * answer on `/api/settings` is already on screen at paint time.
 *
 * `no-store` is deliberate. With the default `max-age=0` the browser revalidates
 * with an ETag, gets a 304, and reuses the previous HTML — snapshot included —
 * which would reintroduce exactly the stale first paint this removes.
 */
const serveClientHtml = async (req, res, next) => {
  const clientDist = path.join(__dirname, '../client/dist');
  try {
    const html = readClientHtml(clientDist);
    const { getBootstrapSettings, getBootstrapOverrides } = require('./controllers/settingsController');
    const at = Date.now();
    let snapshot = null;
    let overrides = null;
    try {
      [snapshot, overrides] = await Promise.all([
        getBootstrapSettings(),
        getBootstrapOverrides(req.path),
      ]);
    } catch (error) {
      // The page must still load when the settings read fails; the app then
      // falls back to its cached copy and the normal fetch.
      console.warn('[Settings] Could not embed the first-paint snapshot:', error.message);
    }

    res.setHeader('Cache-Control', 'no-store, must-revalidate');
    if (!snapshot && !overrides) return res.type('html').send(html);

    /*
     * The payloads ride in `type="application/json"` tags, NOT as inline JS.
     *
     * helmet sets `script-src 'self'`, so an inline `window.__AFT_SETTINGS__=…`
     * script is refused by the browser and the app silently starts from its
     * defaults again — the exact regression this feature exists to prevent. A
     * JSON data block is inert (never executed, so never blocked) and the app
     * reads it from the DOM.
     *
     * `<` is escaped as \u003c so a value containing `</script>` cannot break out
     * of the tag; the JSON stays valid because it is the same character.
     */
    const escape = (value) => JSON.stringify(value).replace(/</g, '\\u003c');
    const scripts = [];
    if (snapshot) {
      scripts.push(`<script id="aft-settings-bootstrap" type="application/json">${escape({ settings: snapshot, at })}</script>`);
    }
    if (overrides) {
      // The inline editor's own text/image edits for THIS route — the half of the
      // page the settings snapshot does not cover.
      scripts.push(`<script id="aft-overrides-bootstrap" type="application/json">${escape({ ...overrides, at })}</script>`);
    }
    const injected = `${scripts.join('\n')}\n`;
    return res.type('html').send(html.includes('</head>') ? html.replace('</head>', `${injected}</head>`) : html + injected);
  } catch (error) {
    return next(error);
  }
};

if (process.env.NODE_ENV === 'production') {
  const clientDist = path.join(__dirname, '../client/dist');
  if (fs.existsSync(clientDist)) {
    // Vite fingerprints every built asset (`index-CGFa7Rpa.js`), so a given
    // filename can never change contents: it is safe to cache for a year and a
    // new build simply references a new name. Without this the browser
    // revalidated ~50 MB of assets on every visit, which on a slow connection is
    // most of the "website bhut slow hai" wait. `index.html` deliberately keeps
    // the default `max-age=0` so a deploy is picked up immediately.
    // `index: false` sends `/` and `/index.html` to the bootstrap handler below
    // instead of letting static serve the file as-is: the HTML is the only place
    // the current content can reach the FIRST paint, and static cannot inject it.
    app.use(express.static(clientDist, {
      index: false,
      setHeaders: (res, filePath) => {
        if (/[/\\]assets[/\\]/.test(filePath)) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
      },
    }));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) return next();
      return serveClientHtml(req, res, next);
    });
  } else {
    app.get('/', (req, res) => {
      res.json({
        status: 'online',
        message: 'American FutureTech Enterprise API Core is active',
        health: '/api/health',
        docs: '/api/courses',
      });
    });
  }
}

// Centralized error handling
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`[American FutureTech Server Running] on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Rejection Error: ${err.message}`);
});
