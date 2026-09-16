'use server';

import { z } from 'zod';

import { headers } from 'next/headers';
import {
  requestOtpInput,
  signinInput,
  emailSigninInput,
  signupInput,
  parentConsentOtpInput,
  parentConsentVerifyInput,
  requestPasswordResetInput,
  resetPasswordInput,
} from '@/features/identity/schemas';
import {
  requestStudentOtp,
  registerStudent,
  loginStudent,
  loginStudentWithEmail,
  verifyEmailToken,
  resendEmailVerificationToken,
  requestParentConsentOtp,
  verifyParentConsent,
  requestPasswordReset,
  resetPassword,
  type AuthResult,
} from '@/features/identity/service';
import { getSessionUser, setSessionUser, clearSession } from '@/features/identity/session';

/**
 * ============================================================================
 * Auth Server Actions (Thin Handlers per api-route-scaffolder)
 * ============================================================================
 * Ritual order: Session -> Input -> Ownership -> Limits -> Delegate.
 * Zero Prisma calls in app/.
 */

async function getClientIp(): Promise<string> {
  const headerList = await headers();
  const forwarded = headerList.get('x-forwarded-for');
  if (forwarded) {
    const ip = forwarded.split(',')[0]?.trim();
    if (ip) return ip;
  }
  return headerList.get('x-real-ip') ?? '127.0.0.1';
}

export async function requestOtpAction(raw: unknown): Promise<AuthResult<{ sent: true }>> {
  const parsed = requestOtpInput.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      reason: 'invalid_otp',
      message: parsed.error.issues[0]?.message ?? 'Invalid input',
    };
  }
  const ip = await getClientIp();
  return requestStudentOtp(parsed.data, ip);
}

export async function signupAction(
  raw: unknown
): Promise<AuthResult<{ userId: string; isLockedMinor: boolean }>> {
  const parsed = signupInput.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      reason: 'invalid_otp',
      message: parsed.error.issues[0]?.message ?? 'Invalid signup details',
    };
  }
  const ip = await getClientIp();
  const res = await registerStudent(parsed.data, ip);
  if (res.ok) {
    await setSessionUser(res.data.userId);
  }
  return res;
}

export async function signinAction(
  raw: unknown
): Promise<AuthResult<{ userId: string; isLockedMinor: boolean }>> {
  const parsed = signinInput.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      reason: 'invalid_otp',
      message: parsed.error.issues[0]?.message ?? 'Invalid sign in credentials',
    };
  }
  const ip = await getClientIp();
  const res = await loginStudent(parsed.data, ip);
  if (res.ok) {
    await setSessionUser(res.data.userId);
  }
  return res;
}

export async function emailSigninAction(
  raw: unknown
): Promise<AuthResult<{ userId: string; isLockedMinor: boolean }>> {
  const parsed = emailSigninInput.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      reason: 'invalid_otp',
      message: parsed.error.issues[0]?.message ?? 'Invalid sign in credentials',
    };
  }
  const ip = await getClientIp();
  const res = await loginStudentWithEmail(parsed.data, ip);
  if (res.ok) {
    await setSessionUser(res.data.userId, parsed.data.rememberMe);
  }
  return res;
}

export async function requestParentConsentOtpAction(
  raw: unknown
): Promise<AuthResult<{ sent: true }>> {
  // 1. Session check
  const session = await getSessionUser();
  if (!session) {
    return { ok: false, reason: 'unauthorized', message: 'You must be signed in to request parental consent' };
  }

  // 2. Input validation
  const parsed = parentConsentOtpInput.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      reason: 'invalid_otp',
      message: parsed.error.issues[0]?.message ?? 'Invalid parent phone number',
    };
  }

  // 3. Ownership / Limits inside feature function
  const ip = await getClientIp();
  return requestParentConsentOtp(session.user.id, parsed.data, ip);
}

export async function verifyParentConsentAction(
  raw: unknown
): Promise<AuthResult<{ unlocked: true }>> {
  // 1. Session check
  const session = await getSessionUser();
  if (!session) {
    return { ok: false, reason: 'unauthorized', message: 'You must be signed in to verify parental consent' };
  }

  // 2. Input validation
  const parsed = parentConsentVerifyInput.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      reason: 'invalid_otp',
      message: parsed.error.issues[0]?.message ?? 'Invalid parent verification input',
    };
  }

  // 3. Delegate to service
  return verifyParentConsent(session.user.id, parsed.data);
}

export async function verifyEmailTokenAction(
  raw: unknown
): Promise<AuthResult<{ verified: true }>> {
  const session = await getSessionUser();
  if (!session) {
    return { ok: false, reason: 'unauthorized', message: 'You must be signed in to verify your email address' };
  }

  const parsed = z.object({ token: z.string().trim().min(1, 'Token is required') }).safeParse(raw);
  if (!parsed.success) {
    return { ok: false, reason: 'invalid_otp', message: 'Please enter your verification code' };
  }

  return verifyEmailToken(session.user.id, parsed.data.token);
}

export async function resendEmailVerificationTokenAction(): Promise<AuthResult<{ sent: true }>> {
  const session = await getSessionUser();
  if (!session) {
    return { ok: false, reason: 'unauthorized', message: 'You must be signed in to resend verification email' };
  }

  return resendEmailVerificationToken(session.user.id);
}

export async function signoutAction(): Promise<{ ok: true }> {
  await clearSession();
  return { ok: true };
}

export async function requestPasswordResetAction(
  raw: unknown
): Promise<AuthResult<{ sent: true }>> {
  const parsed = requestPasswordResetInput.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      reason: 'invalid_otp',
      message: parsed.error.issues[0]?.message ?? 'Invalid email address',
    };
  }
  const ip = await getClientIp();
  return requestPasswordReset(parsed.data, ip);
}

export async function resetPasswordAction(
  raw: unknown
): Promise<AuthResult<{ reset: true }>> {
  const parsed = resetPasswordInput.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      reason: 'invalid_otp',
      message: parsed.error.issues[0]?.message ?? 'Invalid password reset input',
    };
  }
  return resetPassword(parsed.data);
}
