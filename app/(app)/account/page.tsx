import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { getSessionUser } from '@/features/identity/session';
import { db } from '@/lib/db';
import { getUserPlan } from '@/features/billing/entitlements';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Account & Billing - Tuto',
  robots: {
    index: false,
    follow: false,
    noarchive: true,
  },
};

export default async function AccountPage() {
  const session = await getSessionUser();

  if (!session) {
    redirect('/auth');
  }

  const { user, studentProfile } = session;
  const plan = await getUserPlan(user.id);

  // Fetch payments for this user through their subscriptions
  const payments = await db.payment.findMany({
    where: {
      subscription: {
        userId: user.id,
      },
    },
    orderBy: { createdAt: 'desc' },
    include: {
      subscription: {
        include: {
          plan: true,
        },
      },
    },
  });

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div>
        <h1 style={{ font: 'var(--typography-headline-large)', margin: '0 0 8px 0', color: 'var(--color-on-background)' }}>
          Account & Subscription
        </h1>
        <p style={{ font: 'var(--typography-body-large)', margin: 0, color: 'var(--color-on-surface-variant)' }}>
          Manage your account settings, active subscription, and view your billing history.
        </p>
      </div>

      {/* Plan Card */}
      <section style={{ 
        backgroundColor: 'var(--color-surface)', 
        borderRadius: '16px', 
        border: '1px solid var(--color-outline-variant)', 
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-on-surface-variant)', fontWeight: 600 }}>
              Current Plan
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: 700, margin: '4px 0', color: 'var(--color-on-surface)' }}>
              {plan.name}
            </h2>
          </div>
          <span style={{ 
            padding: '4px 12px', 
            borderRadius: '20px', 
            fontSize: '12px', 
            fontWeight: 700,
            backgroundColor: plan.isPlus ? '#e6f7ed' : '#f0f0f0',
            color: plan.isPlus ? '#1e7e34' : '#666666'
          }}>
            {plan.isPlus ? 'ACTIVE' : 'FREE TIER'}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', padding: '16px', backgroundColor: 'var(--color-surface-variant)', borderRadius: '12px' }}>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--color-on-surface-variant)' }}>Billing Interval</div>
            <div style={{ fontWeight: 600, marginTop: '2px' }}>{plan.code.includes('annual') ? 'Annual' : plan.isPlus ? 'Monthly' : 'None'}</div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--color-on-surface-variant)' }}>Current Period Start</div>
            <div style={{ fontWeight: 600, marginTop: '2px' }}>
              {plan.currentPeriodStart 
                ? new Date(plan.currentPeriodStart).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                : '—'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--color-on-surface-variant)' }}>Current Period End</div>
            <div style={{ fontWeight: 600, marginTop: '2px' }}>
              {plan.currentPeriodEnd 
                ? new Date(plan.currentPeriodEnd).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                : '—'}
            </div>
          </div>
        </div>

        {!plan.isPlus && (
          <div>
            <Link 
              href="/dashboard"
              style={{
                display: 'inline-block',
                padding: '10px 20px',
                backgroundColor: '#f5a623',
                color: '#fff',
                fontWeight: 600,
                borderRadius: '8px',
                textDecoration: 'none'
              }}
            >
              Upgrade to Plus
            </Link>
          </div>
        )}
      </section>

      {/* Profile Card */}
      <section style={{ 
        backgroundColor: 'var(--color-surface)', 
        borderRadius: '16px', 
        border: '1px solid var(--color-outline-variant)', 
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <h3 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>Student Profile</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--color-on-surface-variant)' }}>Name</div>
            <div style={{ fontWeight: 500, marginTop: '2px' }}>{user.displayName || 'Not set'}</div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--color-on-surface-variant)' }}>Email</div>
            <div style={{ fontWeight: 500, marginTop: '2px' }}>{user.email || 'Not set'}</div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--color-on-surface-variant)' }}>Class Level</div>
            <div style={{ fontWeight: 500, marginTop: '2px' }}>{studentProfile?.classLevel || 'Not set'}</div>
          </div>
        </div>
      </section>

      {/* Payment History */}
      <section style={{ 
        backgroundColor: 'var(--color-surface)', 
        borderRadius: '16px', 
        border: '1px solid var(--color-outline-variant)', 
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <h3 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>Payment History</h3>
        
        {payments.length === 0 ? (
          <p style={{ color: 'var(--color-on-surface-variant)', fontSize: '14px', margin: 0 }}>
            No payment history found.
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-outline-variant)', color: 'var(--color-on-surface-variant)' }}>
                  <th style={{ padding: '8px 12px' }}>Date</th>
                  <th style={{ padding: '8px 12px' }}>Plan</th>
                  <th style={{ padding: '8px 12px' }}>Amount</th>
                  <th style={{ padding: '8px 12px' }}>Channel</th>
                  <th style={{ padding: '8px 12px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--color-outline-variant)' }}>
                    <td style={{ padding: '12px' }}>
                      {p.paidAt 
                        ? new Date(p.paidAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                        : new Date(p.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td style={{ padding: '12px', fontWeight: 500 }}>
                      {p.subscription?.plan?.tier === 'PLUS' ? 'Tuto Plus' : 'Subscription'}
                    </td>
                    <td style={{ padding: '12px', fontWeight: 600 }}>
                      ₦{(p.amountKobo / 100).toLocaleString()}
                    </td>
                    <td style={{ padding: '12px', textTransform: 'capitalize', color: 'var(--color-on-surface-variant)' }}>
                      {p.channel || 'Card'}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ 
                        padding: '2px 8px', 
                        borderRadius: '12px', 
                        fontSize: '11px', 
                        fontWeight: 700,
                        backgroundColor: p.status === 'successful' ? '#e6f7ed' : '#fdeded',
                        color: p.status === 'successful' ? '#1e7e34' : '#d32f2f'
                      }}>
                        {p.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
