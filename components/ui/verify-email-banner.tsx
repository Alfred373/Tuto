'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { verifyEmailTokenAction, resendEmailVerificationTokenAction } from '@/app/actions/auth';
import styles from './verify-email-banner.module.css';

type BannerState = 'idle' | 'sending' | 'sent' | 'error';

export function VerifyEmailBanner({ email }: { email: string }) {
  const router = useRouter();
  const [bannerState, setBannerState] = useState<BannerState>('idle');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleSendCode = async (isResend = false) => {
    if (isResend) setResendLoading(true);
    else setBannerState('sending');
    
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await resendEmailVerificationTokenAction();
      if (!res.ok) {
        if (!isResend) setBannerState('error');
        setErrorMsg(res.message);
      } else {
        if (!isResend) setBannerState('sent');
        setCooldown(60);
      }
    } catch {
      if (!isResend) setBannerState('error');
      setErrorMsg('Failed to send verification code.');
    } finally {
      if (isResend) setResendLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) {
      setErrorMsg('Please enter your verification code.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await verifyEmailTokenAction({ token: token.trim() });
      if (!res.ok) {
        setErrorMsg(res.message);
        setLoading(false);
      } else {
        setSuccessMsg('Email verified successfully!');
        setTimeout(() => {
          router.refresh();
        }, 1500);
      }
    } catch {
      setErrorMsg('Failed to verify email. Please try again.');
      setLoading(false);
    }
  };

  if (bannerState === 'idle' || bannerState === 'sending') {
    return (
      <section className={styles.bannerContainer} aria-label="Email Verification Required">
        <header className={styles.bannerHeader}>
          <h2 className={styles.bannerTitle}>Verify your email address</h2>
          <p className={styles.bannerText}>
            Please verify your email address (<strong>{email}</strong>) to fully activate your account.
          </p>
        </header>
        <div className={styles.buttonRow}>
          <button 
            type="button" 
            onClick={() => handleSendCode(false)} 
            disabled={bannerState === 'sending'}
            className={styles.primaryButton}
          >
            {bannerState === 'sending' ? 'Sending...' : 'Send verification code'}
          </button>
        </div>
      </section>
    );
  }

  if (bannerState === 'error') {
    return (
      <section className={styles.bannerContainer} aria-label="Email Verification Required">
        <header className={styles.bannerHeader}>
          <h2 className={styles.bannerTitle}>Verify your email address</h2>
        </header>
        {errorMsg && (
          <p className={styles.alertError} role="alert">
            {errorMsg}
          </p>
        )}
        <div className={styles.buttonRow}>
          <button 
            type="button" 
            onClick={() => handleSendCode(false)} 
            className={styles.primaryButton}
          >
            Retry
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.bannerContainer} aria-label="Email Verification Required">
      <header className={styles.bannerHeader}>
        <h2 className={styles.bannerTitle}>Verify your email address</h2>
        <p className={styles.bannerText}>
          We&apos;ve sent a code to <strong>{email}</strong>. Please enter it below to confirm your account.
        </p>
      </header>

      {errorMsg && (
        <p className={styles.alertError} role="alert">
          {errorMsg}
        </p>
      )}

      {successMsg && (
        <p className={styles.alertSuccess} role="status">
          {successMsg}
        </p>
      )}

      <form onSubmit={handleVerify} className={styles.form}>
        <div className={styles.inputGroup}>
          <label htmlFor="verify-token" className={styles.label}>
            Verification Code
          </label>
          <input
            id="verify-token"
            type="text"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className={styles.input}
            placeholder="8-character code"
            required
            autoComplete="off"
            spellCheck="false"
          />
        </div>

        <div className={styles.buttonRow}>
          <button type="submit" disabled={loading || !token.trim()} className={styles.primaryButton}>
            {loading ? 'Verifying...' : 'Verify Email'}
          </button>
          
          <button 
            type="button" 
            onClick={() => handleSendCode(true)} 
            disabled={cooldown > 0 || resendLoading}
            className={styles.secondaryButton}
          >
            {resendLoading ? 'Sending...' : (cooldown > 0 ? `Resend Code (${cooldown}s)` : 'Resend Code')}
          </button>
        </div>
      </form>
    </section>
  );
}
