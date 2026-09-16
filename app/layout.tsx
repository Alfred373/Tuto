import type { Metadata, Viewport } from 'next';
import '@/styles/design-tokens.css';
import { cormorantGaramond, inter } from '@/app/fonts';

/**
 * ============================================================================
 * Root Layout — Tuto
 * ============================================================================
 * AGENTS.md / design-system-rule.md:
 * - Rule 4: Import design-tokens.css once in the root layout, before any other stylesheet.
 * - Rule 25: Strictly light mode using light theme tokens only. Never emit a dark override,
 *   never add a theme toggle, never honour prefers-color-scheme: dark.
 */

export const metadata: Metadata = {
  metadataBase: new URL('https://tuto.ng'),
  title: {
    default: 'Tuto — Know it, not just answer it | WAEC, NECO & JAMB Prep',
    template: '%s | Tuto',
  },
  description:
    'A mobile-first guided study companion for Nigerian secondary school students (JSS1–SS3) preparing for WAEC, NECO and JAMB. Step-by-step guidance that builds mastery.',
  applicationName: 'Tuto',
  keywords: [
    'WAEC past questions and answers',
    'NECO exam prep Nigeria',
    'JAMB CBT practice',
    'Secondary school study companion',
    'Mathematics WAEC step by step',
    'Nigerian educational app',
    'JSS1 to SS3 exam preparation',
    'Tuto learning',
  ],
  authors: [{ name: 'Tuto Education' }],
  creator: 'Tuto Education',
  publisher: 'Tuto Education',
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/apple-icon.svg', type: 'image/svg+xml' },
    ],
  },
  openGraph: {
    type: 'website',
    locale: 'en_NG',
    url: 'https://tuto.ng',
    siteName: 'Tuto',
    title: 'Tuto — Know it, not just answer it | WAEC, NECO & JAMB Prep',
    description:
      'A mobile-first guided study companion for Nigerian secondary students preparing for WAEC, NECO and JAMB with five-step structured lessons.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tuto — Know it, not just answer it',
    description:
      'A mobile-first guided study companion for Nigerian secondary students preparing for WAEC, NECO and JAMB.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'EducationalApplication',
  name: 'Tuto',
  applicationCategory: 'EducationalApplication',
  operatingSystem: 'Any (Mobile Web)',
  description:
    'Guided exam preparation companion for Nigerian secondary school students preparing for WAEC, NECO, and JAMB.',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'NGN',
  },
  audience: {
    '@type': 'EducationalAudience',
    educationalRole: 'student',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en-NG"
      className={`${cormorantGaramond.variable} ${inter.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        style={{
          backgroundColor: 'var(--color-background)',
          color: 'var(--color-on-background)',
          font: 'var(--typography-body-large)',
          margin: 0,
          padding: 0,
          minHeight: '100vh',
        }}
      >
        {children}
      </body>
    </html>
  );
}
