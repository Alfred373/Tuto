import { cookies } from 'next/headers';
import { db } from '../../lib/db';
import { config } from '../../lib/config';
import type { User, StudentProfile } from '@prisma/client';

/**
 * ============================================================================
 * Session Management (PRD F1.6, security.md 1, 2)
 * ============================================================================
 * - 90-day persistence via signed HTTP-only cookies (PRD F1.6).
 * - HMAC-SHA256 signature using platform Web Crypto (security.md 28).
 * - Reads user and locked state on server; never trusts client tokens.
 */

const SESSION_COOKIE_NAME = 'tuto_session';
const SESSION_MAX_AGE_SECONDS = 90 * 24 * 60 * 60; // 90 days (PRD F1.6)

export interface SessionUser {
  user: User;
  studentProfile: StudentProfile | null;
  isLockedMinor: boolean;
}

// HMAC-SHA256 signature helpers using Web Crypto
async function sign(value: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, enc.encode(value));
  const b64 = Buffer.from(signature).toString('base64url');
  return `${value}.${b64}`;
}

async function verify(signedValue: string, secret: string): Promise<string | null> {
  const parts = signedValue.split('.');
  if (parts.length !== 2) return null;
  const [value, b64] = parts;
  if (!value || !b64) return null;

  const expected = await sign(value, secret);
  return expected === signedValue ? value : null;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
  if (!sessionCookie?.value) return null;

  const userId = await verify(sessionCookie.value, config.SESSION_SECRET);
  if (!userId) return null;

  const user = await db.user.findUnique({
    where: { id: userId },
    include: { studentProfile: true },
  });

  if (!user || user.deletedAt) return null;

  // F1.4 / security.md 7: Minor under 13 without consent is locked
  const isLockedMinor = Boolean(
    user.studentProfile?.isMinorUnder13 && !user.studentProfile?.consentGrantedAt
  );

  return {
    user,
    studentProfile: user.studentProfile,
    isLockedMinor,
  };
}

export async function setSessionUser(userId: string, rememberMe: boolean = true): Promise<void> {
  const cookieStore = await cookies();
  const signed = await sign(userId, config.SESSION_SECRET);

  cookieStore.set(SESSION_COOKIE_NAME, signed, {
    httpOnly: true,
    secure: config.NODE_ENV === 'production',
    sameSite: 'lax',
    ...(rememberMe ? { maxAge: SESSION_MAX_AGE_SECONDS } : {}),
    path: '/',
  });
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
