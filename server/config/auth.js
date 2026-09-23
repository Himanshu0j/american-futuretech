const crypto = require('crypto');

/**
 * Authentication configuration.
 *
 * The JWT signing secret previously had a hardcoded fallback that was committed
 * to source control, so anyone holding the repository could mint a valid
 * SUPERADMIN token. There is now NO fallback:
 *
 *   production  → the server refuses to boot without a strong, unique secret.
 *   development → a random per-process secret is generated and loudly announced,
 *                 so tokens become invalid on restart instead of being forgeable.
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
 * Throws in production when the configured value is missing or unsafe.
 */
const getJwtSecret = () => {
  if (cachedSecret) return cachedSecret;

  const inspection = inspectSecret(process.env.JWT_SECRET);

  if (inspection.ok) {
    cachedSecret = inspection.secret;
    return cachedSecret;
  }

  if (isProduction()) {
    throw new Error(
      [
        `[FATAL] ${inspection.reason}`,
        'Refusing to start: a guessable JWT secret would let anyone forge admin sessions.',
        `Generate one with: ${GENERATE_COMMAND}`,
        ENV_HINT,
      ].join('\n'),
    );
  }

  cachedSecret = crypto.randomBytes(48).toString('hex');
  resolution = { mode: 'ephemeral-development-secret', reason: inspection.reason };
  console.warn(
    `\n⚠️  [Auth] ${inspection.reason}\n` +
    '   Using a RANDOM development secret instead — existing logins will be invalidated on every restart.\n' +
    `   For stable sessions, add JWT_SECRET to server/.env: ${GENERATE_COMMAND}\n`,
  );
  return cachedSecret;
};

/** Called once during boot so misconfiguration fails fast and loudly. */
const assertAuthConfig = () => {
  const secret = getJwtSecret(); // throws in production when unsafe
  return {
    configured: inspectSecret(process.env.JWT_SECRET).ok,
    mode: resolution ? resolution.mode : (isProduction() ? 'production' : 'development'),
    secretLength: secret.length,
    expiresIn: process.env.JWT_EXPIRE || '7d',
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
