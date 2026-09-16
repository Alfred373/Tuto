import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    absolute: 'Tuto — Know it, not just answer it | WAEC, NECO & JAMB Prep',
  },
  description:
    'A mobile-first guided study companion for Nigerian secondary school students preparing for WAEC, NECO and JAMB.',
  alternates: {
    canonical: '/',
  },
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
