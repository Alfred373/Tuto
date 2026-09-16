/**
 * ============================================================================
 * Checkpoint 3: Design System Token Proof Page
 * ============================================================================
 * Requirements:
 * - Render UI sample using light theme tokens only.
 * - Strict token discipline: zero hex, zero rgb/hsl, zero raw px, zero primitives.
 * - Minimum 48x48px interactive target.
 * - Mobile-ready at 360px viewport width with no sideways scroll.
 * - Strictly light mode: no dark overrides, no theme toggle, no prefers-color-scheme: dark.
 */

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Design System Token Verification',
  robots: {
    index: false,
    follow: false,
    noarchive: true,
  },
};

export default function ThemeProofPage() {
  return (
    <main
      style={{
        maxWidth: '100%',
        padding: 'var(--spacing-16)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-32)',
        boxSizing: 'border-box',
      }}
    >
      <header
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--spacing-8)',
        }}
      >
        <h1
          style={{
            font: 'var(--typography-headline-large)',
            color: 'var(--color-on-background)',
            margin: 0,
          }}
        >
          Design System Token Verification
        </h1>
        <p
          style={{
            font: 'var(--typography-body-medium)',
            color: 'var(--color-on-surface-variant)',
            margin: 0,
          }}
        >
          Verification proof of Material Design 3 light theme tokens. Light mode only.
        </p>
      </header>

      {/* LIGHT THEME SAMPLE */}
      <section
        style={{
          backgroundColor: 'var(--color-surface)',
          color: 'var(--color-on-surface)',
          padding: 'var(--spacing-24)',
          borderRadius: 'var(--shape-corner-large)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--spacing-16)',
          outline: '1px solid var(--color-outline-variant)',
        }}
      >
        <div>
          <h2
            style={{
              font: 'var(--typography-title-large)',
              color: 'var(--color-on-surface)',
              margin: 0,
            }}
          >
            Mathematics — Quadratic Equations
          </h2>
          <p
            style={{
              font: 'var(--typography-body-medium)',
              color: 'var(--color-on-surface-variant)',
              marginTop: 'var(--spacing-8)',
              marginBottom: 0,
            }}
          >
            Solve for x given 2x² - 5x + 3 = 0. Step-by-step guidance prepares you for WAEC and NECO.
          </p>
        </div>

        <div>
          <button
            type="button"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 'var(--spacing-48)',
              minWidth: 'var(--spacing-48)',
              paddingLeft: 'var(--spacing-24)',
              paddingRight: 'var(--spacing-24)',
              borderRadius: 'var(--shape-corner-full)',
              backgroundColor: 'var(--color-primary)',
              color: 'var(--color-on-primary)',
              font: 'var(--typography-label-large)',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Start Guided Solution
          </button>
        </div>
      </section>
    </main>
  );
}
