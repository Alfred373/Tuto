import { z } from 'zod';

/**
 * ============================================================================
 * Environment Configuration Parser & Validator
 * ============================================================================
 * 
 * AGENTS.md Rule 32: Nothing reads `process.env` except `lib/config.ts`.
 * coding-standards.md Rule 12: Config is parsed and validated once with Zod.
 */

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().default('postgresql://postgres:postgres@localhost:5432/tuto?schema=public'),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  SESSION_SECRET: z.string().min(16).default('development_session_secret_min_16_chars'),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default('gemini-3.6-flash'),
  DEEPSEEK_API_KEY: z.string().optional(),
  FLW_PUBLIC_KEY: z.string().optional(),
  FLW_SECRET_KEY: z.string().optional(),
  FLW_SECRET_HASH: z.string().optional(),
  VERIFICATION_SERVICE_URL: z.string().url().default('http://localhost:8000'),
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET_NAME: z.string().optional(),
  SMTP_HOST: z.string().min(1, 'SMTP_HOST is required for email delivery'),
  SMTP_PORT: z.string().min(1, 'SMTP_PORT is required'),
  SMTP_USER: z.string().min(1, 'SMTP_USER is required'),
  SMTP_PASS: z.string().min(1, 'SMTP_PASS is required'),
});

const parsed = envSchema.safeParse({
  NODE_ENV: process.env['NODE_ENV'],
  DATABASE_URL: process.env['DATABASE_URL'],
  NEXT_PUBLIC_APP_URL: process.env['NEXT_PUBLIC_APP_URL'],
  SESSION_SECRET: process.env['SESSION_SECRET'],
  GEMINI_API_KEY: process.env['GEMINI_API_KEY'],
  GEMINI_MODEL: process.env['GEMINI_MODEL'] || 'gemini-3.6-flash',
  DEEPSEEK_API_KEY: process.env['DEEPSEEK_API_KEY'],
  FLW_PUBLIC_KEY: process.env['FLW_PUBLIC_KEY'],
  FLW_SECRET_KEY: process.env['FLW_SECRET_KEY'],
  FLW_SECRET_HASH: process.env['FLW_SECRET_HASH'],
  VERIFICATION_SERVICE_URL: process.env['VERIFICATION_SERVICE_URL'],
  R2_ACCOUNT_ID: process.env['R2_ACCOUNT_ID'],
  R2_ACCESS_KEY_ID: process.env['R2_ACCESS_KEY_ID'],
  R2_SECRET_ACCESS_KEY: process.env['R2_SECRET_ACCESS_KEY'],
  R2_BUCKET_NAME: process.env['R2_BUCKET_NAME'],
  SMTP_HOST: process.env['SMTP_HOST'],
  SMTP_PORT: process.env['SMTP_PORT'],
  SMTP_USER: process.env['SMTP_USER'],
  SMTP_PASS: process.env['SMTP_PASS'],
});

if (!parsed.success) {
  const errors = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');
  throw new Error(`Invalid environment configuration: ${errors}`);
}

export const config = parsed.data;
export type AppConfig = z.infer<typeof envSchema>;
