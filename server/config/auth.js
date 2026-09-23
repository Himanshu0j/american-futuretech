const crypto = require('crypto');

/**
 * Authentication configuration.
 *
 * The JWT signing secret previously had a hardcoded fallback that was committed
 * to source control, so anyone holding the repository could mint a valid
 * SUPERADMIN token. That fallback is gone for good:
 *
 *   - A configured, strong secret is used as-is.
 *   - Anything unsafe (missing, too short, or one of the leaked/placeholder
 *     values published in this repository) is NEVER used for signing. The
 *     process instead generates a random 48-byte secret for its own lifetime
 *     and warns loudly, in every environment including production.
 *
 * Falling back to a random secret instead of refusing to boot is deliberate: a
 * missing environment variable must never take the whole API (and therefore the
 * public site) down. The cost is that sessions are invalidated on restart, so
 * the warning tells you exactly how to make them stable.
 */

const MIN_SECRET_LENGTH = 32;

// Known-leaked / placeholder values that must never be accepted again.
const REJECTED_SECRETS = [
  'american_futuretech_jwt_secret_ultra_secure_key_2026',
  'secret',
  'jwt_secret',
  'changeme',
  'your_jwt_secret',
  'test',
];

const GENERATE_COMMAND = "node -e \"console.log(require('crypto').randomBytes(48).toString('hex'))\"";
const ENV_HINT =
  'Set it in your environment (Render → your service → Environment → JWT_SECRET, local: server/.env).';

let cachedSecret = null;
let resolution = null;

const FIX_HINT =
  'Set a unique JWT_SECRET in your environment to make sessions survive restarts (Render → your service → Environment → JWT_SECRET).';

const isProduction = () => process.env.NODE_ENV === 'production';

const inspectSecret = (rawSecret) => {
  const secret = (rawSecret || '').trim();

  if (!secret) {
    return { ok: false, reason: 'JWT_SECRET is not set.' };
  }
  if (secret.length < MIN_SECRET_LENGTH) {
    return { ok: false, reason: `JWT_SECRET is too short (${secret.length} chars, minimum ${MIN_SECRET_LENGTH}).` };
  }
  if (REJECTED_SECRETS.includes(secret.toLowerCase())) {
    return { ok: false, reason: 'JWT_SECRET is a known leaked/placeholder value that is published in this repository.' };
  }
  return { ok: true, secret };
};

/**
 * Resolve (and cache) the signing secret.
 *
 * Never throws: an unsafe/missing value is replaced by a random per-process
 * secret so the API always boots. The unsafe value itself is never used.
 */
const getJwtSecret = () => {
  if (cachedSecret) return cachedSecret;

  const inspection = inspectSecret(process.env.JWT_SECRET);

  if (inspection.ok) {
    cachedSecret = inspection.secret;
    return cachedSecret;
  }

  cachedSecret = crypto.randomBytes(48).toString('hex');
  resolution = { mode: 'ephemeral-generated-secret', reason: inspection.reason };
  console.warn(
    `\n⚠️  [Auth] ${inspection.reason}\n` +
    '   Using a RANDOM secret for this process instead — the configured value is never used for signing.\n' +
    '   Consequence: admin/student logins are invalidated on every restart or redeploy.\n' +
    `   Generate a stable one with: ${GENERATE_COMMAND}\n` +
    `   ${ENV_HINT}\n`,
  );
  return cachedSecret;
};

/** Called once during boot. Always succeeds; reports how the secret resolved. */
const assertAuthConfig = () => {
  const secret = getJwtSecret();
  const configured = inspectSecret(process.env.JWT_SECRET).ok;
  return {
    configured,
    mode: resolution ? resolution.mode : (isProduction() ? 'production' : 'development'),
    secretLength: secret.length,
    expiresIn: process.env.JWT_EXPIRE || '7d',
    // Surfaced by /api/health so a misconfigured deploy is visible without logs.
    warning: configured
      ? null
      : `${resolution.reason} A random per-process secret is in use instead, so admin and student sessions reset on every restart. ${FIX_HINT}`,
  };
};

const getJwtExpire = () => process.env.JWT_EXPIRE || '7d';

// Test-only helper: config is cached for the process lifetime by design.
const __resetForTests = () => {
  cachedSecret = null;
  resolution = null;
};

module.exports = {
  getJwtSecret,
  getJwtExpire,
  assertAuthConfig,
  inspectSecret,
  isProduction,
  MIN_SECRET_LENGTH,
  __test__: { reset: __resetForTests, inspectSecret },
};
