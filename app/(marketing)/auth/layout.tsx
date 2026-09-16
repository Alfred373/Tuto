import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Authentication | Tuto',
  description: 'Sign in or create your Tuto account for guided WAEC, NECO and JAMB exam preparation.',
  alternates: {
    canonical: '/auth',
  },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
