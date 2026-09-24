const crypto = require('crypto');
const { getJwtSecret } = require('../config/auth');

/**
 * Encryption for admin-entered gateway secrets (Stripe secret key / webhook
 * signing secret).
 *
 * - AES-256-GCM with a random IV per value, so ciphertexts are never reusable.
 * - The key is derived from the server's JWT secret, which lives outside the
 *   database: a database dump alone cannot decrypt anything.
 * - Decryption only ever happens on the server; the API returns a masked hint
 *   ("sk_live_…4f2a") instead of the value, so the browser never receives it.
 */

const deriveKey = () => crypto.createHash('sha256').update(`aft-secret-vault:${getJwtSecret()}`).digest();

const isEncrypted = (value) => typeof value === 'string' && value.startsWith('v1:');

const encryptSecret = (plaintext) => {
  const value = String(plaintext || '').trim();
  if (!value) return '';
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', deriveKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`;
};

const decryptSecret = (payload) => {
  if (!isEncrypted(payload)) return '';
  try {
    const [, ivB64, tagB64, dataB64] = payload.split(':');
    const decipher = crypto.createDecipheriv('aes-256-gcm', deriveKey(), Buffer.from(ivB64, 'base64'));
    decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
    const decrypted = Buffer.concat([decipher.update(Buffer.from(dataB64, 'base64')), decipher.final()]);
    return decrypted.toString('utf8');
  } catch (error) {
    console.warn(`[SecretVault] Could not decrypt a stored secret: ${error.message}`);
    return '';
  }
};

/** "sk_live_51H…4f2a" — enough to recognise the key, useless to an attacker. */
const maskSecret = (value) => {
  const secret = String(value || '');
  if (!secret) return '';
  if (secret.length <= 12) return `${secret.slice(0, 3)}…`;
  return `${secret.slice(0, 8)}…${secret.slice(-4)}`;
};

module.exports = { isEncrypted, encryptSecret, decryptSecret, maskSecret };
