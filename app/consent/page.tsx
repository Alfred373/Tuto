'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  requestParentConsentOtpAction,
  verifyParentConsentAction,
} from '@/app/actions/auth';
import { SwitchUserControl } from '@/components/ui/switch-user-control';

/**
 * ============================================================================
 * Parental Consent Flow (PRD F1.4, security.md 7, 8)
 * ============================================================================
 * - Accounts declaring age under 13 are locked until a parent verifies via OTP
 *   sent to a DIFFERENT phone number.
 * - Stores consent event with timestamp and consenting phone.
 * - Minimum 48x48px touch targets, tokens only, 360px viewport tested.
 */

export default function ConsentPage() {
  const router = useRouter();

  const [parentPhone, setParentPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSendOtp = async (): Promise<void> => {
    setErrorMsg(null);
    setLoading(true);

    try {
      const res = await requestParentConsentOtpAction({ parentPhone });
      if (!res.ok) {
        setErrorMsg(res.message);
      } else {
        setOtpSent(true);
      }
    } catch {
      setErrorMsg('Failed to send verification code to parent.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyConsent = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const res = await verifyParentConsentAction({ parentPhone, otp });
      if (!res.ok) {
        setErrorMsg(res.message);
        setLoading(false);
        return;
      }

      setSuccessMsg('Parental consent confirmed! Unlocking your account...');
      setTimeout(() => {
        router.push('/dashboard');
        router.refresh();
      }, 1000);
    } catch {
      setErrorMsg('Verification failed. Please check the code and try again.');
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--color-background)',
        color: 'var(--color-on-background)',
        padding: 'var(--spacing-16)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        boxSizing: 'border-box',
        maxWidth: '100%',
      }}
    >
      <main
        style={{
          width: '100%',
          maxWidth: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--spacing-20)',
          boxSizing: 'border-box',
        }}
      >
        <SwitchUserControl displayName="Student (Locked — Under 13)" />

        <header
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--spacing-4)',
          }}
        >
          <h1
            style={{
              font: 'var(--typography-headline-medium)',
              color: 'var(--color-on-background)',
              margin: 0,
            }}
          >
            Parental Consent Required
          </h1>
          <p
            style={{
              font: 'var(--typography-body-medium)',
              color: 'var(--color-on-surface-variant)',
              margin: 0,
            }}
          >
            Under-13 accounts are created locked. A parent or guardian must confirm permission by SMS code sent to their phone before you can solve questions.
          </p>
        </header>

        {errorMsg && (
          <div
            role="alert"
            style={{
              padding: 'var(--spacing-12) var(--spacing-16)',
              backgroundColor: 'var(--color-error-container)',
              color: 'var(--color-on-error-container)',
              borderRadius: 'var(--shape-corner-small)',
              font: 'var(--typography-body-small)',
            }}
          >
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div
            role="status"
            style={{
              padding: 'var(--spacing-12) var(--spacing-16)',
              backgroundColor: 'var(--color-success-container)',
              color: 'var(--color-on-success-container)',
              borderRadius: 'var(--shape-corner-small)',
              font: 'var(--typography-body-small)',
            }}
          >
            {successMsg}
          </div>
        )}

        <form
          onSubmit={handleVerifyConsent}
          style={{
            backgroundColor: 'var(--color-surface)',
            color: 'var(--color-on-surface)',
            padding: 'var(--spacing-20)',
            borderRadius: 'var(--shape-corner-large)',
            outline: '1px solid var(--color-outline-variant)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--spacing-16)',
            boxSizing: 'border-box',
          }}
        >
          {/* Parent Phone Number */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
            <label
              htmlFor="parentPhone"
              style={{
                font: 'var(--typography-label-medium)',
                color: 'var(--color-on-surface)',
              }}
            >
              Parent / Guardian Phone Number
            </label>
            <div style={{ display: 'flex', gap: 'var(--spacing-8)', flexDirection: 'column' }}>
              <input
                id="parentPhone"
                type="tel"
                required
                placeholder="Parent's number (different from student)"
                value={parentPhone}
                onChange={(e) => setParentPhone(e.target.value)}
                style={{
                  minHeight: 'var(--spacing-48)',
                  padding: 'var(--spacing-8) var(--spacing-16)',
                  borderRadius: 'var(--shape-corner-small)',
                  border: '1px solid var(--color-outline)',
                  backgroundColor: 'var(--color-surface)',
                  color: 'var(--color-on-surface)',
                  font: 'var(--typography-body-large)',
                  boxSizing: 'border-box',
                  width: '100%',
                }}
              />
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={loading || !parentPhone}
                style={{
                  minHeight: 'var(--spacing-48)',
                  padding: 'var(--spacing-8) var(--spacing-16)',
                  borderRadius: 'var(--shape-corner-small)',
                  backgroundColor: 'var(--color-secondary-container)',
                  color: 'var(--color-on-secondary-container)',
                  border: 'none',
                  font: 'var(--typography-label-large)',
                  cursor: loading || !parentPhone ? 'not-allowed' : 'pointer',
                  opacity: loading || !parentPhone ? 'var(--state-disabled-content-opacity)' : 1,
                }}
              >
                {otpSent ? 'Code Sent to Parent (Re-send)' : 'Send Code to Parent'}
              </button>
            </div>
            {otpSent && (
              <span
                style={{
                  font: 'var(--typography-label-small)',
                  color: 'var(--color-success)',
                }}
              >
                Code sent to parent! (For local testing: use 123456)
              </span>
            )}
          </div>

          {/* Parent OTP Code */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
            <label
              htmlFor="parentOtp"
              style={{
                font: 'var(--typography-label-medium)',
                color: 'var(--color-on-surface)',
              }}
            >
              6-Digit Code Received by Parent
            </label>
            <input
              id="parentOtp"
              type="text"
              required
              maxLength={6}
              placeholder="123456"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              style={{
                minHeight: 'var(--spacing-48)',
                padding: 'var(--spacing-8) var(--spacing-16)',
                borderRadius: 'var(--shape-corner-small)',
                border: '1px solid var(--color-outline)',
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-on-surface)',
                font: 'var(--typography-body-large)',
                boxSizing: 'border-box',
                width: '100%',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !otp}
            style={{
              minHeight: 'var(--spacing-48)',
              padding: 'var(--spacing-12) var(--spacing-24)',
              borderRadius: 'var(--shape-corner-full)',
              backgroundColor: 'var(--color-primary)',
              color: 'var(--color-on-primary)',
              border: 'none',
              font: 'var(--typography-label-large)',
              cursor: loading || !otp ? 'not-allowed' : 'pointer',
              opacity: loading || !otp ? 'var(--state-disabled-content-opacity)' : 1,
              marginTop: 'var(--spacing-8)',
            }}
          >
            {loading ? 'Verifying Consent...' : 'Confirm Consent & Unlock'}
          </button>
        </form>
      </main>
    </div>
  );
}
