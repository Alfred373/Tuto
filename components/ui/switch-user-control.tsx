'use client';

import { signoutAction } from '@/app/actions/auth';
import { useRouter } from 'next/navigation';

/**
 * ============================================================================
 * Switch User Control (PRD F1.6)
 * ============================================================================
 * "On a shared device, an explicit switch-user control is visible, not buried."
 * Tokens only, minimum 48x48px interactive target.
 */

interface SwitchUserControlProps {
  displayName?: string | null;
}

export function SwitchUserControl({ displayName }: SwitchUserControlProps) {
  const router = useRouter();

  const handleSwitchUser = async (): Promise<void> => {
    await signoutAction();
    router.push('/auth');
    router.refresh();
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 'var(--spacing-8) var(--spacing-16)',
        backgroundColor: 'var(--color-surface)',
        borderRadius: 'var(--shape-corner-medium)',
        outline: '1px solid var(--color-outline-variant)',
        gap: 'var(--spacing-12)',
        maxWidth: '100%',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span
          style={{
            font: 'var(--typography-label-small)',
            color: 'var(--color-on-surface-variant)',
          }}
        >
          Active Student
        </span>
        <span
          style={{
            font: 'var(--typography-label-large)',
            color: 'var(--color-on-surface)',
          }}
        >
          {displayName ?? 'Student'}
        </span>
      </div>

      <button
        type="button"
        onClick={handleSwitchUser}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 'var(--spacing-48)',
          minWidth: 'var(--spacing-48)',
          paddingLeft: 'var(--spacing-16)',
          paddingRight: 'var(--spacing-16)',
          borderRadius: 'var(--shape-corner-full)',
          backgroundColor: 'transparent',
          color: 'var(--color-primary)',
          font: 'var(--typography-label-medium)',
          outline: '1px solid var(--color-primary)',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        Switch User
      </button>
    </div>
  );
}
