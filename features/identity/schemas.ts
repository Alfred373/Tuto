import { z } from 'zod';
import { ClassLevel, TargetExam } from '@prisma/client';

/**
 * ============================================================================
 * Identity Schemas — Zod Contracts (PRD F1.2, F1.3, F1.4)
 * ============================================================================
 * - Validates phone numbers (Nigerian national and E.164 formats).
 * - Enforces mandatory class level and target exam (F1.3 cannot be skipped).
 * - Enforces minor consent phone constraints (F1.4 parent phone != student phone).
 */

// Normalise Nigerian phone numbers: 080... -> +23480..., +234... -> +234...
export const phoneSchema = z
  .string()
  .trim()
  .refine(
    (val) => {
      const cleaned = val.replace(/[\s-]/g, '');
      return /^(\+?234|0)[789][01]\d{8}$/.test(cleaned);
    },
    { message: 'Invalid Nigerian phone number. Expected 11 digits (e.g. 08012345678 or +234...)' }
  )
  .transform((val) => {
    const cleaned = val.replace(/[\s-]/g, '');
    if (cleaned.startsWith('0')) {
      return `+234${cleaned.slice(1)}`;
    }
    if (!cleaned.startsWith('+')) {
      return `+${cleaned}`;
    }
    return cleaned;
  });

export const otpSchema = z
  .string()
  .trim()
  .length(6, 'OTP must be 6 digits')
  .regex(/^\d{6}$/, 'OTP must be numeric');

export const requestOtpInput = z.object({
  phone: phoneSchema,
});

export const signinInput = z.object({
  phone: phoneSchema,
  otp: otpSchema,
});

export const emailSigninInput = z.object({
  email: z.string().trim().toLowerCase().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  rememberMe: z.boolean().default(true),
});

export const displayNameSchema = z
  .string()
  .trim()
  .min(2, 'Name must be at least 2 characters')
  .max(100, 'Name must not exceed 100 characters')
  .refine((val) => /^[a-zA-Z\s'-]+$/.test(val), {
    message: 'Full Name Must Use Only Letters',
  })
  .refine((val) => val.trim().split(/\s+/).filter(Boolean).length >= 2, {
    message: 'Full name must contain at least 2 words',
  });

export const signupInput = z.object({
  phone: phoneSchema.optional(),
  otp: otpSchema.optional(),
  displayName: displayNameSchema,
  classLevel: z.nativeEnum(ClassLevel, {
    errorMap: () => ({ message: 'Class level is required (JSS1 to SS3)' }),
  }),
  targetExam: z.nativeEnum(TargetExam, {
    errorMap: () => ({ message: 'Target exam is required' }),
  }),
  isMinorUnder13: z.boolean().default(false),
});

export const parentConsentOtpInput = z.object({
  parentPhone: phoneSchema,
});

export const parentConsentVerifyInput = z.object({
  parentPhone: phoneSchema,
  otp: otpSchema,
});

export type RequestOtpInput = z.infer<typeof requestOtpInput>;
export type SigninInput = z.infer<typeof signinInput>;
export type EmailSigninInput = z.infer<typeof emailSigninInput>;
export type SignupInput = z.infer<typeof signupInput>;
export type ParentConsentOtpInput = z.infer<typeof parentConsentOtpInput>;
export type ParentConsentVerifyInput = z.infer<typeof parentConsentVerifyInput>;

export const requestPasswordResetInput = z.object({
  email: z.string().trim().toLowerCase().email('Please enter a valid email address'),
});

export const resetPasswordInput = z.object({
  email: z.string().trim().toLowerCase().email('Please enter a valid email address'),
  code: otpSchema,
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

export type RequestPasswordResetInput = z.infer<typeof requestPasswordResetInput>;
export type ResetPasswordInput = z.infer<typeof resetPasswordInput>;
