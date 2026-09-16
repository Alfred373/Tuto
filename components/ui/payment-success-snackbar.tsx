'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export function PaymentSuccessSnackbar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(true);
  const isUpgraded = searchParams.get('upgraded') === 'true';

  useEffect(() => {
    if (!isUpgraded) return;

    // Show for 4 seconds, then fade out and clean query string
    const timer = setTimeout(() => {
      setVisible(false);
      // Clean up the URL query param without full page reload
      const newUrl = window.location.pathname;
      router.replace(newUrl, { scroll: false });
    }, 4000);

    return () => clearTimeout(timer);
  }, [isUpgraded, router]);

  if (!isUpgraded || !visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        padding: '14px 20px',
        backgroundColor: '#0f3a1e',
        color: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25), 0 2px 8px rgba(30, 126, 52, 0.4)',
        border: '1px solid #28a745',
        animation: 'slideInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        maxWidth: '420px',
      }}
    >
      <div
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          backgroundColor: '#28a745',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff', letterSpacing: '0.2px' }}>
          Payment Successful!
        </div>
        <div style={{ fontSize: '12px', color: '#b7e4c7', marginTop: '2px' }}>
          Welcome to Tuto Plus! Your account has been upgraded.
        </div>
      </div>

      <button
        onClick={() => {
          setVisible(false);
          router.replace(window.location.pathname, { scroll: false });
        }}
        aria-label="Dismiss snackbar"
        style={{
          background: 'transparent',
          border: 'none',
          color: '#85c99e',
          cursor: 'pointer',
          padding: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '4px',
          marginLeft: '4px',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
  );
}
