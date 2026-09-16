import { config } from '../../lib/config';

/**
 * ============================================================================
 * OTP & Rate Limiting Service (PRD F1.2, security.md 11, 22)
 * ============================================================================
 * - In-memory token store with 5-minute TTL.
 * - Sliding window rate limiter per phone hash and IP address (security.md 22).
 * - Zero logging of raw phone numbers or OTP codes (security.md 11).
 */

interface OtpRecord {
  code: string;
  expiresAt: number;
  attempts: number;
}

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_REQUESTS_PER_WINDOW = 5;

// In-memory state for scaffold (can be backed by Redis / Upstash in production)
const otpStore = new Map<string, OtpRecord>();
const rateLimitStore = new Map<string, RateLimitRecord>();

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }

  record.count += 1;
  return true;
}

export function generateAndStoreOtp(phone: string, ip: string): { ok: boolean; reason?: 'rate_limited' } {
  // Rate limit by IP and by phone independently
  if (!checkRateLimit(`ip:${ip}`) || !checkRateLimit(`phone:${phone}`)) {
    return { ok: false, reason: 'rate_limited' };
  }

  // In development, allow 123456 as the standard test code
  const code = config.NODE_ENV === 'development' ? '123456' : Math.floor(100000 + Math.random() * 900000).toString();

  otpStore.set(phone, {
    code,
    expiresAt: Date.now() + OTP_TTL_MS,
    attempts: 0,
  });

  return { ok: true };
}

export function verifyStoredOtp(phone: string, inputCode: string): { ok: boolean; reason?: 'expired' | 'invalid' | 'max_attempts' } {
  const record = otpStore.get(phone);

  if (!record) {
    // In local development, permit '123456' as fallback
    if (config.NODE_ENV === 'development' && inputCode === '123456') {
      return { ok: true };
    }
    return { ok: false, reason: 'invalid' };
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(phone);
    return { ok: false, reason: 'expired' };
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    otpStore.delete(phone);
    return { ok: false, reason: 'max_attempts' };
  }

  record.attempts += 1;

  if (record.code !== inputCode && !(config.NODE_ENV === 'development' && inputCode === '123456')) {
    return { ok: false, reason: 'invalid' };
  }

  // Verification succeeded; clear OTP to prevent reuse
  otpStore.delete(phone);
  return { ok: true };
}
