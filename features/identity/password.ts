import crypto from 'node:crypto';

/**
 * ============================================================================
 * Password Hashing & Verification Service (PRD F1.6, Security Rule 28)
 * ============================================================================
 * Uses Node.js native `crypto.scryptSync` key derivation algorithm with a 16-byte
 * cryptographically random salt per password.
 * Format: `${salt}:${derivedKey}`
 */

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derivedKey}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, key] = parts;
  if (!salt || !key) return false;

  try {
    const keyBuffer = Buffer.from(key, 'hex');
    const derivedBuffer = crypto.scryptSync(password, salt, 64);
    if (keyBuffer.length !== derivedBuffer.length) return false;
    return crypto.timingSafeEqual(keyBuffer, derivedBuffer);
  } catch {
    return false;
  }
}
