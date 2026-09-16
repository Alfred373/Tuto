import localFont from 'next/font/local';

/**
 * ============================================================================
 * Self-hosted Fonts via next/font/local
 * ============================================================================
 * AGENTS.md / design-system-rule.md Rule 13, 14, 15:
 * - Two system families: Cormorant Garamond (Display) and Inter (Body).
 * - Self-hosted via next/font, no external runtime CDN requests.
 */

export const cormorantGaramond = localFont({
  src: '../public/fonts/cormorant-garamond.woff2',
  variable: '--font-cormorant-garamond',
  display: 'swap',
  weight: '400 700',
});

export const inter = localFont({
  src: '../public/fonts/inter.woff2',
  variable: '--font-inter',
  display: 'swap',
  weight: '400 600',
});
