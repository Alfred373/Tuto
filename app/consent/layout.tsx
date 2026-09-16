import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Parental Consent Verification',
  description: 'Verification flow for parental consent on Tuto.',
  robots: {
    index: false,
    follow: false,
    noarchive: true,
  },
};

export default function ConsentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
