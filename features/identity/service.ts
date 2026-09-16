import { ClassLevel, TargetExam } from '@prisma/client';
import { db } from '../../lib/db';
import { generateAndStoreOtp, verifyStoredOtp } from './otp';
import { hashPassword, verifyPassword } from './password';
import { generateVerificationCode, hashVerificationCode } from './verification';
import { sendVerificationEmail, sendWelcomeEmail, sendPasswordResetEmail } from '../../lib/email';
import type {
  RequestOtpInput,
  SigninInput,
  EmailSigninInput,
  SignupInput,
  ParentConsentOtpInput,
  ParentConsentVerifyInput,
  RequestPasswordResetInput,
  ResetPasswordInput,
} from './schemas';

export type AuthFailureReason =
  | 'rate_limited'
  | 'invalid_otp'
  | 'otp_expired'
  | 'user_exists'
  | 'user_not_found'
  | 'same_phone_not_allowed'
  | 'not_locked_minor'
  | 'unauthorized';

export type AuthResult<T> =
  | { ok: true; data: T }
  | { ok: false; reason: AuthFailureReason; message: string };

export async function requestStudentOtp(
  input: RequestOtpInput,
  ip: string
): Promise<AuthResult<{ sent: true }>> {
  const res = generateAndStoreOtp(input.phone, ip);
  if (!res.ok) {
    return {
      ok: false,
      reason: 'rate_limited',
      message: 'Too many OTP requests. Please wait a few minutes before trying again.',
    };
  }

  return { ok: true, data: { sent: true } };
}

export async function registerStudent(
  input: SignupInput,
  ip: string
): Promise<AuthResult<{ userId: string; isLockedMinor: boolean }>> {
  const phone = input.phone ?? '';
  const otp = input.otp ?? '';

  if (phone && otp) {
    // 1. Verify OTP
    const otpRes = verifyStoredOtp(phone, otp);
    if (!otpRes.ok) {
      return {
        ok: false,
        reason: otpRes.reason === 'expired' ? 'otp_expired' : 'invalid_otp',
        message: otpRes.reason === 'expired' ? 'OTP has expired. Please request a new one.' : 'Invalid OTP code entered.',
      };
    }

    // 2. Check if user already exists
    const existing = await db.user.findUnique({
      where: { phone },
    });

    if (existing) {
      return {
        ok: false,
        reason: 'user_exists',
        message: 'An account with this phone number already exists. Please sign in instead.',
      };
    }
  }

  // 3. Create User & StudentProfile atomically
  const result = await db.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        phone: input.phone,
        phoneVerified: true,
        displayName: input.displayName,
      },
    });

    const profile = await tx.studentProfile.create({
      data: {
        userId: user.id,
        classLevel: input.classLevel,
        targetExam: input.targetExam,
        isMinorUnder13: input.isMinorUnder13,
        // If under 13, consentGrantedAt remains null until verified by parent
        consentGrantedAt: null,
      },
    });

    return { user, profile };
  });

  const isLockedMinor = input.isMinorUnder13;

  return {
    ok: true,
    data: {
      userId: result.user.id,
      isLockedMinor,
    },
  };
}

export async function loginStudent(
  input: SigninInput,
  ip: string
): Promise<AuthResult<{ userId: string; isLockedMinor: boolean }>> {
  // 1. Verify OTP
  const otpRes = verifyStoredOtp(input.phone, input.otp);
  if (!otpRes.ok) {
    return {
      ok: false,
      reason: otpRes.reason === 'expired' ? 'otp_expired' : 'invalid_otp',
      message: otpRes.reason === 'expired' ? 'OTP has expired. Please request a new one.' : 'Invalid OTP code entered.',
    };
  }

  // 2. Lookup User
  const user = await db.user.findUnique({
    where: { phone: input.phone },
    include: { studentProfile: true },
  });

  if (!user) {
    return {
      ok: false,
      reason: 'user_not_found',
      message: 'No account found with this phone number. Please sign up first.',
    };
  }

  const isLockedMinor = Boolean(
    user.studentProfile?.isMinorUnder13 && !user.studentProfile?.consentGrantedAt
  );

  return {
    ok: true,
    data: {
      userId: user.id,
      isLockedMinor,
    },
  };
}

export async function requestParentConsentOtp(
  userId: string,
  input: ParentConsentOtpInput,
  ip: string
): Promise<AuthResult<{ sent: true }>> {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: { studentProfile: true },
  });

  if (!user || !user.studentProfile) {
    return { ok: false, reason: 'unauthorized', message: 'User not found' };
  }

  if (!user.studentProfile.isMinorUnder13 || user.studentProfile.consentGrantedAt) {
    return { ok: false, reason: 'not_locked_minor', message: 'Account does not require parental consent' };
  }

  // PRD F1.4 / security.md 8: parent phone must be distinct from student phone
  if (user.phone === input.parentPhone) {
    return {
      ok: false,
      reason: 'same_phone_not_allowed',
      message: 'Parental consent must be verified with a different phone number from the student account.',
    };
  }

  const res = generateAndStoreOtp(input.parentPhone, ip);
  if (!res.ok) {
    return { ok: false, reason: 'rate_limited', message: 'Too many requests. Please wait a moment.' };
  }

  return { ok: true, data: { sent: true } };
}

export async function verifyParentConsent(
  userId: string,
  input: ParentConsentVerifyInput
): Promise<AuthResult<{ unlocked: true }>> {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: { studentProfile: true },
  });

  if (!user || !user.studentProfile) {
    return { ok: false, reason: 'unauthorized', message: 'User not found' };
  }

  if (user.phone === input.parentPhone) {
    return {
      ok: false,
      reason: 'same_phone_not_allowed',
      message: 'Parent phone must be different from student phone',
    };
  }

  const otpRes = verifyStoredOtp(input.parentPhone, input.otp);
  if (!otpRes.ok) {
    return {
      ok: false,
      reason: otpRes.reason === 'expired' ? 'otp_expired' : 'invalid_otp',
      message: otpRes.reason === 'expired' ? 'Parent OTP expired' : 'Invalid parent OTP code',
    };
  }

  // Update consent event with timestamp and consenting number (PRD F1.4)
  await db.studentProfile.update({
    where: { userId },
    data: {
      consentGrantedAt: new Date(),
      consentPhone: input.parentPhone,
    },
  });

  return { ok: true, data: { unlocked: true } };
}

export async function loginStudentWithEmail(
  input: EmailSigninInput,
  _ip: string
): Promise<AuthResult<{ userId: string; isLockedMinor: boolean }>> {
  const existing = await db.user.findUnique({
    where: { email: input.email },
    include: { studentProfile: true },
  });

  if (!existing) {
    const hashed = hashPassword(input.password);

    const result = await db.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: input.email,
          displayName: input.email.split('@')[0] ?? 'Student',
          passwordHash: hashed,
          emailVerified: false,
          emailVerificationToken: null,
          emailVerificationTokenExpiresAt: null,
        },
      });

      await tx.studentProfile.create({
        data: {
          userId: newUser.id,
          classLevel: ClassLevel.SS2,
          targetExam: TargetExam.WAEC,
          isMinorUnder13: false,
        },
      });

      return newUser;
    });

    // Send welcome email in background
    if (result.email) {
      sendWelcomeEmail({
        to: result.email,
        displayName: result.displayName ?? 'Student',
      }).catch(err => console.error('Failed to send welcome email async:', err));
    }

    return {
      ok: true,
      data: {
        userId: result.id,
        isLockedMinor: false,
      },
    };
  }

  // Verify password if hash exists
  if (existing.passwordHash) {
    const isValid = verifyPassword(input.password, existing.passwordHash);
    if (!isValid) {
      return {
        ok: false,
        reason: 'invalid_otp',
        message: 'Invalid email or password',
      };
    }
  } else {
    // Populate passwordHash for existing record
    const hashed = hashPassword(input.password);
    await db.user.update({
      where: { id: existing.id },
      data: { passwordHash: hashed },
    });
  }

  const isLockedMinor = Boolean(
    existing.studentProfile?.isMinorUnder13 && !existing.studentProfile?.consentGrantedAt
  );

  return {
    ok: true,
    data: {
      userId: existing.id,
      isLockedMinor,
    },
  };
}

export async function verifyEmailToken(
  userId: string,
  token: string
): Promise<AuthResult<{ verified: true }>> {
  const user = await db.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return { ok: false, reason: 'unauthorized', message: 'User account not found' };
  }

  if (user.emailVerificationAttempts >= 5) {
    // Invalidate token
    await db.user.update({
      where: { id: userId },
      data: { emailVerificationToken: null, emailVerificationTokenExpiresAt: null },
    });
    return { ok: false, reason: 'invalid_otp', message: 'Too many failed attempts. Please request a new code.' };
  }

  const cleanToken = token.trim();
  const hashedInput = hashVerificationCode(cleanToken);

  if (!user.emailVerificationToken || user.emailVerificationToken !== hashedInput) {
    await db.user.update({
      where: { id: userId },
      data: { emailVerificationAttempts: { increment: 1 } },
    });
    return { ok: false, reason: 'invalid_otp', message: 'Invalid verification code entered.' };
  }

  if (user.emailVerificationTokenExpiresAt && user.emailVerificationTokenExpiresAt < new Date()) {
    return { ok: false, reason: 'otp_expired', message: 'Verification code has expired. Please request a new code.' };
  }

  await db.user.update({
    where: { id: userId },
    data: {
      emailVerified: true,
      emailVerificationToken: null,
      emailVerificationTokenExpiresAt: null,
      emailVerificationAttempts: 0,
    },
  });

  return { ok: true, data: { verified: true } };
}

export async function resendEmailVerificationToken(
  userId: string
): Promise<AuthResult<{ sent: true }>> {
  const user = await db.user.findUnique({
    where: { id: userId },
  });

  if (!user || !user.email) {
    return { ok: false, reason: 'unauthorized', message: 'User or email address not found' };
  }

  const token = generateVerificationCode();
  const hashedToken = hashVerificationCode(token);
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  // Send email first
  const sendRes = await sendVerificationEmail({
    to: user.email,
    displayName: user.displayName ?? 'Student',
    code: token,
  });

  if (!sendRes.ok) {
    return {
      ok: false,
      reason: 'invalid_otp',
      message: 'error' in sendRes ? sendRes.error : 'Failed to send verification email. Please try again.',
    };
  }

  // Persist after successful send
  await db.user.update({
    where: { id: userId },
    data: {
      emailVerificationToken: hashedToken,
      emailVerificationTokenExpiresAt: expiresAt,
      emailVerificationAttempts: 0,
    },
  });

  return { ok: true, data: { sent: true } };
}

export async function requestPasswordReset(
  input: RequestPasswordResetInput,
  _ip: string
): Promise<AuthResult<{ sent: true }>> {
  const user = await db.user.findUnique({
    where: { email: input.email },
  });

  if (!user || !user.email) {
    // For security reasons, don't reveal if the user exists or not
    return { ok: true, data: { sent: true } };
  }

  const token = generateVerificationCode();
  const hashedToken = hashVerificationCode(token);
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  const sendRes = await sendPasswordResetEmail({
    to: user.email,
    displayName: user.displayName ?? 'Student',
    code: token,
  });

  if (!sendRes.ok) {
    return {
      ok: false,
      reason: 'invalid_otp',
      message: 'Failed to send password reset email. Please try again.',
    };
  }

  await db.user.update({
    where: { id: user.id },
    data: {
      passwordResetToken: hashedToken,
      passwordResetTokenExpiresAt: expiresAt,
    },
  });

  return { ok: true, data: { sent: true } };
}

export async function resetPassword(
  input: ResetPasswordInput
): Promise<AuthResult<{ reset: true }>> {
  const user = await db.user.findUnique({
    where: { email: input.email },
  });

  if (!user || !user.passwordResetToken) {
    return { ok: false, reason: 'invalid_otp', message: 'Invalid or expired reset code.' };
  }

  if (user.passwordResetTokenExpiresAt && user.passwordResetTokenExpiresAt < new Date()) {
    return { ok: false, reason: 'otp_expired', message: 'Reset code has expired. Please request a new one.' };
  }

  const cleanToken = input.code.trim();
  const hashedInput = hashVerificationCode(cleanToken);

  if (user.passwordResetToken !== hashedInput) {
    return { ok: false, reason: 'invalid_otp', message: 'Invalid reset code entered.' };
  }

  const hashedNewPassword = hashPassword(input.newPassword);

  await db.user.update({
    where: { id: user.id },
    data: {
      passwordHash: hashedNewPassword,
      passwordResetToken: null,
      passwordResetTokenExpiresAt: null,
    },
  });

  return { ok: true, data: { reset: true } };
}
