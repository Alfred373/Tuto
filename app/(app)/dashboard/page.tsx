import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { getSessionUser } from '@/features/identity/session';
import { VerifyEmailBanner } from '@/components/ui/verify-email-banner';
import { QuestionComposer } from '@/features/solve/components/question-composer';

export const metadata: Metadata = {
  title: 'Student Dashboard',
  robots: {
    index: false,
    follow: false,
    noarchive: true,
  },
};

import { syncPaymentFromRedirect } from '@/features/billing/actions';

import { PaymentSuccessSnackbar } from '@/components/ui/payment-success-snackbar';

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function DashboardPage(props: Props) {
  const searchParams = await props.searchParams;
  
  if (searchParams.checkout === 'success') {
    const txRef = typeof searchParams.tx_ref === 'string'
      ? searchParams.tx_ref
      : Array.isArray(searchParams.tx_ref)
        ? searchParams.tx_ref[0]
        : null;

    const transactionId = typeof searchParams.transaction_id === 'string'
      ? searchParams.transaction_id
      : Array.isArray(searchParams.transaction_id)
        ? searchParams.transaction_id[0]
        : null;

    if (txRef || transactionId) {
      try {
        await syncPaymentFromRedirect(txRef || '', transactionId || undefined);
      } catch (err) {
        console.error('Failed to sync payment from redirect:', err);
      }
    }
    // Clean redirect to dashboard with success status
    redirect('/dashboard?upgraded=true');
  }

  const session = await getSessionUser();

  if (!session) {
    redirect('/auth');
  }

  const { user } = session;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-24)', alignItems: 'center' }}>
      <PaymentSuccessSnackbar />

      {user.email && !user.emailVerified && (
        <div style={{ width: '100%', maxWidth: '800px', marginBottom: 'var(--spacing-16)' }}>
          <VerifyEmailBanner email={user.email} />
        </div>
      )}

      <header style={{ textAlign: 'center', marginBottom: 'var(--spacing-16)' }}>
        <h2 style={{ 
          font: 'var(--typography-display-medium)', 
          margin: '0 0 var(--spacing-8) 0', 
          color: 'var(--color-on-background)' 
        }}>
          What would you like help with?
        </h2>
        <p style={{ 
          font: 'var(--typography-body-large)', 
          margin: 0, 
          color: 'var(--color-on-surface-variant)' 
        }}>
          Type a question, upload a clear photo of your problem, or both.
        </p>
      </header>

      <QuestionComposer />
    </div>
  );
}
