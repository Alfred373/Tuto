import crypto from 'node:crypto';

/**
 * ============================================================================
 * Verification Code Service (PRD F1.6, security.md 28)
 * ============================================================================
 * Generates an 8-character verification code string using crypto.randomBytes(4).
 * We only store the SHA-256 hash of this code in the database.
 */

export function generateVerificationCode(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

export function hashVerificationCode(code: string): string {
  return crypto.createHash('sha256').update(code.toLowerCase()).digest('hex');
}
