/**
 * CORS origin allowlist.
 *
 * This replaces the earlier `origin: true`, which reflected whatever `Origin`
 * a caller sent. Reflection means any website a signed-in visitor happens to
 * open could read this API's responses in their browser — the API answered
 * "sure, whoever you claim to be". Only the frontends this project actually
 * ships are allowed below; everything else is answered with no CORS headers at
 * all, so the browser refuses to hand the response to the calling page.
 *
 * Two things this deliberately does NOT do:
 *   - reflect an arbitrary origin (that is the bug being fixed)
 *   - emit `Access-Control-Allow-Origin: *` while credentials are enabled
 *     (the browser rejects that combination anyway, and it would be a lie)
 *
 * A request carrying no `Origin` header is not a cross-origin request at all.
 * That covers same-origin navigation, curl/CI, server-to-server callers, and
 * the Vercel `/api/*` rewrite, which proxies the browser's request to this API
 * server-side. Those are always let through.
 */

// Frontends this project ships. Kept in step with the redirect allowlist in
// server/utils/paymentGateway.js so a site is never "a valid redirect target
// but a forbidden API origin" (or the reverse).
const PRODUCTION_ORIGINS = [
  'https://american-futuretech.vercel.app',
  'https://americanfuturetech.com',
  'https://www.americanfuturetech.com',
];

// The local dev servers this project uses by default. Development is not
// limited to this list (see isDevLocalOrigin) — it exists so the resolved
// allowlist can be inspected, and so the common cases are documented.
const LOCAL_ORIGINS = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
  'http://localhost:3000',
];

const stripTrailingSlash = (value) => String(value || '').trim().replace(/\/+$/, '');

const isProduction = () => (process.env.NODE_ENV || 'development') === 'production';

/** localhost / 127.0.0.1 / [::1], with or without a port. */
const isLocalOrigin = (origin) =>
  /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i.test(stripTrailingSlash(origin));

let cached = null;
let warnedAboutLocalClientUrl = false;

/**
 * Every origin allowed right now, de-duplicated.
 *
 * `CLIENT_URL` is trusted when set — that is how a custom domain or a Vercel
 * preview deployment gets in without touching this file. In production a
 * localhost `CLIENT_URL` is ignored rather than honoured, so "local origins
 * only in development" holds even if a deploy is left with the sample value.
 */
const getAllowedOrigins = () => {
  if (cached) return cached;

  const production = isProduction();
  const origins = [...PRODUCTION_ORIGINS];

  const clientUrl = stripTrailingSlash(process.env.CLIENT_URL);
  if (clientUrl) {
    if (production && isLocalOrigin(clientUrl)) {
      if (!warnedAboutLocalClientUrl) {
        warnedAboutLocalClientUrl = true;
        console.warn(
          `\n⚠️  [CORS] Ignoring CLIENT_URL="${clientUrl}" in production — local origins are only allowed in development.\n` +
          '   Set CLIENT_URL to the deployed frontend URL (e.g. https://american-futuretech.vercel.app).\n',
        );
      }
    } else {
      origins.push(clientUrl);
    }
  }

  if (!production) origins.push(...LOCAL_ORIGINS);

  cached = [...new Set(origins)];
  return cached;
};

/**
 * Any localhost / 127.0.0.1 port, but only outside production.
 *
 * A dev server picks its own port (Vite, a preview build, a tool that falls
 * back to :5273), so pinning a fixed list would break the moment someone runs
 * on a different one. None of this is reachable in production, which never
 * enters this branch — so the loosening cannot leak into a deploy.
 */
const isDevLocalOrigin = (origin) => !isProduction() && isLocalOrigin(origin);

/** True when `origin` (the request's Origin header) may read this API. */
const isOriginAllowed = (origin) => {
  if (!origin) return true; // not a cross-origin request
  const normalized = stripTrailingSlash(origin);
  if (isDevLocalOrigin(normalized)) return true;
  return getAllowedOrigins().includes(normalized);
};

/**
 * Options for the `cors` middleware.
 *
 * The origin callback answers `true` for an allowed origin — the middleware
 * then reflects the caller's exact origin (never `*`) and sets `Vary: Origin`
 * so shared caches cannot serve one site's response to another. For a rejected
 * origin it answers `false`, which makes the middleware skip the CORS headers
 * entirely; an actual request still runs (nothing about CORS is authorization)
 * but the browser blocks the caller from reading the reply, and a preflight
 * falls through to the JSON 404 instead of being approved.
 */
const buildCorsOptions = () => ({
  origin: (origin, callback) => callback(null, isOriginAllowed(origin)),
  credentials: true,
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  // Only the two headers the app actually sends. Anything else the browser
  // asks about in a preflight is refused.
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,
  optionsSuccessStatus: 204,
});

// Test-only: the allowlist is cached for the process lifetime by design.
const __resetForTests = () => {
  cached = null;
  warnedAboutLocalClientUrl = false;
};

module.exports = {
  PRODUCTION_ORIGINS,
  LOCAL_ORIGINS,
  getAllowedOrigins,
  isOriginAllowed,
  isLocalOrigin,
  isDevLocalOrigin,
  buildCorsOptions,
  __resetForTests,
};
