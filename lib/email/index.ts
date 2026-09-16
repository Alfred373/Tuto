import nodemailer, { type Transporter } from 'nodemailer';
import { config } from '../config';

/**
 * ============================================================================
 * Nodemailer Email Service Adapter (lib/email/index.ts)
 * ============================================================================
 * - Fully sets up Nodemailer transport.
 * - In development mode: uses ethereal by default unless you provided real keys, but always validates config.
 * - Provides sendVerificationEmail for email verification workflow.
 */

let transporterPromise: Promise<Transporter> | null = null;

async function getTransporter(): Promise<Transporter> {
  if (transporterPromise) return transporterPromise;

  transporterPromise = (async () => {
    const transport = nodemailer.createTransport({
      host: config.SMTP_HOST,
      port: Number(config.SMTP_PORT),
      secure: Number(config.SMTP_PORT) === 465,
      auth: {
        user: config.SMTP_USER,
        pass: config.SMTP_PASS,
      },
    });

    try {
      await transport.verify();
      console.log('✅ Nodemailer SMTP connection verified');
    } catch (error) {
      console.error('❌ Nodemailer failed to verify SMTP connection at startup:', error);
      transporterPromise = null;
      throw error;
    }

    return transport;
  })();

  return transporterPromise;
}

export interface SendVerificationEmailOptions {
  to: string;
  displayName: string;
  code: string;
}

export async function sendVerificationEmail(
  options: SendVerificationEmailOptions
): Promise<{ ok: true; previewUrl?: string | false } | { ok: false; error: string }> {
  try {
    const tx = await getTransporter();
    const info = await tx.sendMail({
      from: '"Tuto Study Assistant" <noreply@tuto.ng>',
      to: options.to,
      subject: 'Verify your email address — Tuto',
      html: `
        <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 580px; margin: 0 auto; padding: 28px; background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 16px; color: #1d1b20;">
          <div style="margin-bottom: 20px;">
            <h2 style="color: #b3261e; margin: 0 0 8px 0; font-size: 24px;">Welcome to Tuto, ${options.displayName}!</h2>
            <p style="margin: 0; color: #49454f; font-size: 15px; line-height: 1.5;">Please enter your unique verification code to confirm your email address and activate your guided secondary exam prep profile.</p>
          </div>
          
          <div style="background-color: #f7f2fa; border: 1px solid #e7e0ec; padding: 18px; border-radius: 12px; margin: 24px 0;">
            <span style="display: block; font-size: 12px; font-weight: 600; color: #49454f; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">Your Verification Code</span>
            <code style="font-family: monospace; font-size: 13px; color: #b3261e; word-break: break-all; font-weight: 700; display: block; line-height: 1.4;">${options.code}</code>
          </div>

          <p style="font-size: 14px; color: #49454f; margin-bottom: 0;">Copy this code and paste it into the email verification banner on your Tuto dashboard.</p>
        </div>
      `,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      process.stdout.write(`\n📬 Nodemailer Verification Email Preview: ${previewUrl}\n\n`);
    }

    return { ok: true, previewUrl };
  } catch (err: any) {
    process.stderr.write(`Failed to send verification email: ${String(err)}\n`);
    return { ok: false, error: err.message || 'Failed to send email' };
  }
}

export interface SendWelcomeEmailOptions {
  to: string;
  displayName: string;
}

export async function sendWelcomeEmail(
  options: SendWelcomeEmailOptions
): Promise<{ ok: true; previewUrl?: string | false } | { ok: false; error: string }> {
  try {
    const tx = await getTransporter();
    const info = await tx.sendMail({
      from: '"Tuto Study Assistant" <noreply@tuto.ng>',
      to: options.to,
      subject: 'Welcome to Tuto! Your AI Study Assistant',
      html: `
<div style="font-family: system-ui, -apple-system, sans-serif; max-width: 580px; margin: 0 auto; padding: 28px; background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 16px; color: #1d1b20;">
  
  <div style="text-align: center; margin-bottom: 32px;">
    <h1 style="color: #6750A4; font-size: 28px; margin: 0; letter-spacing: -0.5px;">Tuto</h1>
  </div>

  <div style="margin-bottom: 24px;">
    <h2 style="color: #1d1b20; margin: 0 0 12px 0; font-size: 22px;">Welcome to Tuto, ${options.displayName}! 🎉</h2>
    <p style="margin: 0; color: #49454f; font-size: 16px; line-height: 1.6;">
      We're thrilled to have you on board! You've just taken the first step toward mastering your WAEC, NECO, and JAMB exams with your own personal AI study assistant.
    </p>
  </div>
  
  <div style="background-color: #f7f2fa; border: 1px solid #e7e0ec; padding: 20px; border-radius: 12px; margin: 24px 0;">
    <h3 style="margin: 0 0 12px 0; color: #1d1b20; font-size: 16px;">Here's how to get started:</h3>
    
    <ol style="margin: 0; padding-left: 20px; color: #49454f; font-size: 15px; line-height: 1.6;">
      <li style="margin-bottom: 8px;"><strong>Snap or Type:</strong> Upload a clear photo of any exam question or type it directly into your dashboard.</li>
      <li style="margin-bottom: 8px;"><strong>Learn Step-by-Step:</strong> Tuto won't just give you the answer—it will break down the solution so you actually understand the concepts.</li>
      <li><strong>Test Yourself:</strong> Take follow-up quizzes on the topic to ensure you've mastered it.</li>
    </ol>
  </div>

  <div style="text-align: center; margin: 32px 0;">
    <a href="https://tuto.ng/dashboard" style="display: inline-block; background-color: #6750A4; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; padding: 14px 32px; border-radius: 9999px; transition: background-color 0.2s;">
      Go to your Dashboard
    </a>
  </div>

  <div style="border-top: 1px solid #e0e0e0; padding-top: 20px; margin-top: 32px;">
    <p style="font-size: 13px; color: #79747e; margin: 0; line-height: 1.5;">
      You're receiving this email because you recently created an account on Tuto. If you need any help, just reply to this email!
    </p>
  </div>
</div>
      `,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      process.stdout.write(`\n📬 Nodemailer Welcome Email Preview: ${previewUrl}\n\n`);
    }

    return { ok: true, previewUrl };
  } catch (err: any) {
    process.stderr.write(`Failed to send welcome email: ${String(err)}\n`);
    return { ok: false, error: err.message || 'Failed to send email' };
  }
}

export interface SendPasswordResetEmailOptions {
  to: string;
  displayName: string;
  code: string;
}

export async function sendPasswordResetEmail(
  options: SendPasswordResetEmailOptions
): Promise<{ ok: true; previewUrl?: string | false } | { ok: false; error: string }> {
  try {
    const tx = await getTransporter();
    const info = await tx.sendMail({
      from: '"Tuto Study Assistant" <noreply@tuto.ng>',
      to: options.to,
      subject: 'Reset your password — Tuto',
      html: `
        <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 580px; margin: 0 auto; padding: 28px; background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 16px; color: #1d1b20;">
          <div style="margin-bottom: 20px;">
            <h2 style="color: #6750A4; margin: 0 0 8px 0; font-size: 24px;">Password Reset Request</h2>
            <p style="margin: 0; color: #49454f; font-size: 15px; line-height: 1.5;">Hi ${options.displayName}, we received a request to reset your password. Please enter the following reset code on the password reset page.</p>
          </div>
          
          <div style="background-color: #f7f2fa; border: 1px solid #e7e0ec; padding: 18px; border-radius: 12px; margin: 24px 0;">
            <span style="display: block; font-size: 12px; font-weight: 600; color: #49454f; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">Your Reset Code</span>
            <code style="font-family: monospace; font-size: 16px; color: #6750A4; word-break: break-all; font-weight: 700; display: block; line-height: 1.4; letter-spacing: 2px;">${options.code}</code>
          </div>

          <p style="font-size: 14px; color: #49454f; margin-bottom: 12px;">This code will expire in 15 minutes.</p>
          <p style="font-size: 14px; color: #49454f; margin-bottom: 0;">If you did not request a password reset, you can safely ignore this email.</p>
        </div>
      `,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      process.stdout.write(`\n📬 Nodemailer Password Reset Email Preview: ${previewUrl}\n\n`);
    }

    return { ok: true, previewUrl };
  } catch (err: any) {
    process.stderr.write(`Failed to send password reset email: ${String(err)}\n`);
    return { ok: false, error: err.message || 'Failed to send email' };
  }
}
