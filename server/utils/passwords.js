const crypto = require('crypto');

/**
 * Password generation + policy.
 *
 * One module owns both so every entry point (public signup, checkout-created
 * students, CRM lead conversion, admin reset, self-service profile update) is
 * held to the same rules.
 */

const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;

// Unambiguous, human-typable alphabet (no 0/O/1/l/I).
const PASSWORD_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';

// Passwords that appear at the top of every credential-stuffing list — plus the
// old shared default this platform used to ship.
const WEAK_PASSWORDS = new Set([
  'admin123',
  'admin1234',
  'admin@123',
  'administrator',
  'password',
  'password1',
  'password12',
  'password123',
  'passw0rd',
  '12345678',
  '123456789',
  '1234567890',
  'qwerty123',
  'qwertyuiop',
  'letmein123',
  'welcome123',
  'changeme',
  'iloveyou',
  'americanfuturetech',
  'student123',
  // Previous hardcoded defaults from this very codebase.
  'password@123',
  'password@1',
  'admin@2025',
  'admin@2026',
  'welcome@123',
  'aft@12345',
]);

/**
 * Cryptographically random password that satisfies the policy below.
 * Example shape: Aft-Kx7mQp2ZrT94!
 */
const generateSecurePassword = () => {
  const bytes = crypto.randomBytes(12);
  let body = '';
  for (const byte of bytes) {
    body += PASSWORD_ALPHABET[byte % PASSWORD_ALPHABET.length];
  }
  return `Aft-${body}${crypto.randomInt(10, 99)}!`;
};

const characterClasses = (password) => ({
  lower: /[a-z]/.test(password),
  upper: /[A-Z]/.test(password),
  digit: /[0-9]/.test(password),
  symbol: /[^A-Za-z0-9]/.test(password),
});

/**
 * @returns {{ valid: boolean, errors: string[] }}
 */
const validatePassword = (password, { email = '', name = '' } = {}) => {
  const errors = [];
  const value = typeof password === 'string' ? password : '';

  if (value.length < MIN_PASSWORD_LENGTH) {
    errors.push(`Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`);
  }
  if (value.length > MAX_PASSWORD_LENGTH) {
    errors.push(`Password must be at most ${MAX_PASSWORD_LENGTH} characters long.`);
  }

  const classes = characterClasses(value);
  const classCount = Object.values(classes).filter(Boolean).length;
  if (value.length >= MIN_PASSWORD_LENGTH && classCount < 3) {
    errors.push('Password must combine at least three of: lowercase letters, uppercase letters, numbers, symbols.');
  }

  if (WEAK_PASSWORDS.has(value.toLowerCase())) {
    errors.push('This password is too common and easy to guess. Please choose a unique one.');
  }

  const rawName = String(name || '').toLowerCase();
  const personalTokens = [
    String(email || '').toLowerCase().split('@')[0],
    rawName.replace(/\s+/g, ''),
    // Individual name parts too — people routinely build passwords from their
    // first or last name, with or without separators.
    ...rawName.split(/[\s._-]+/),
  ].filter((token) => token && token.length >= 4);

  const lowered = value.toLowerCase();
  for (const token of personalTokens) {
    if (lowered.includes(token)) {
      errors.push('Password must not contain your name or email address.');
      break;
    }
  }

  return { valid: errors.length === 0, errors };
};

const describePasswordPolicy = () =>
  `At least ${MIN_PASSWORD_LENGTH} characters, combining three of: lowercase, uppercase, numbers, symbols. Avoid common words and your own name or email.`;

module.exports = {
  MIN_PASSWORD_LENGTH,
  MAX_PASSWORD_LENGTH,
  WEAK_PASSWORDS,
  generateSecurePassword,
  validatePassword,
  describePasswordPolicy,
  characterClasses,
};
