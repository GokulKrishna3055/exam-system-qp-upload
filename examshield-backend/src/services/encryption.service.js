const crypto = require('crypto');

/**
 * Encryption service using Node.js built-in crypto.
 * Algorithm: AES-256-GCM (authenticated encryption).
 */

const ALGORITHM = 'aes-256-gcm';

/**
 * Generate a cryptographically secure 256-bit (32 byte) key.
 * Returns hex string (64 chars) prefixed with 'sk-'.
 */
function generateSessionKey() {
  const raw = crypto.randomBytes(32).toString('hex');
  // Format: sk-XXXXXXXX-XXXX-XXXX for readability
  return `sk-${raw.substring(0, 8)}-${raw.substring(8, 12)}-${raw.substring(12, 16)}`;
}

/**
 * Extract the raw 32-byte key from the session key string.
 * Pads/truncates to 32 bytes for AES-256.
 */
function deriveRawKey(sessionKey) {
  const stripped = sessionKey.replace(/sk-|-/g, '');
  // Pad to 64 hex chars = 32 bytes
  const padded = stripped.padEnd(64, '0').substring(0, 64);
  return Buffer.from(padded, 'hex');
}

/**
 * Encrypt a buffer with AES-256-GCM.
 * Returns { ciphertext (Buffer), iv (hex), authTag (hex) }
 */
function encryptBuffer(buffer, sessionKey) {
  const key = deriveRawKey(sessionKey);
  const iv = crypto.randomBytes(12); // 96-bit IV for GCM
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    ciphertext: encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
  };
}

/**
 * Decrypt a buffer with AES-256-GCM.
 * Returns decrypted Buffer.
 */
function decryptBuffer(ciphertext, sessionKey, ivHex, authTagHex) {
  const key = deriveRawKey(sessionKey);
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

/**
 * Compute SHA-256 hash of a buffer.
 * Returns hex string.
 */
function computeHash(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Compare a provided key against the stored key (constant-time).
 */
function verifyKey(providedKey, storedKey) {
  try {
    const a = Buffer.from(providedKey.trim());
    const b = Buffer.from(storedKey.trim());
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

module.exports = {
  generateSessionKey,
  encryptBuffer,
  decryptBuffer,
  computeHash,
  verifyKey,
};
