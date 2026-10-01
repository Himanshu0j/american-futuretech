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
const buildInfo = {
  commit:
    (
      process.env.RENDER_GIT_COMMIT ||
      process.env.GIT_COMMIT ||
      process.env.COMMIT_SHA ||
      process.env.SOURCE_VERSION ||
      ''
    ).trim() || null,
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
// `verify` keeps the untouched request body around so the Stripe webhook can be
// validated against its signature (a re-serialized body would break the hash).
app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  }),
);
app.use(express.urlencoded({ extended: true }));

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

// Serve static assets in production if client build exists
if (process.env.NODE_ENV === 'production') {
  const clientDist = path.join(__dirname, '../client/dist');
  if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) return next();
      res.sendFile(path.join(clientDist, 'index.html'));
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
