import { redirect } from 'next/navigation';
import { getSessionUser } from '@/features/identity/session';
import { getUserPlan } from '@/features/billing/entitlements';
import { LayoutClient } from './layout-client';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionUser();

  if (!session) {
    redirect('/auth');
  }

  if (session.isLockedMinor) {
    redirect('/consent');
  }

  const { user } = session;
  const initials = user.displayName
    ? user.displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'U';

  const plan = await getUserPlan(user.id);

  return (
    <LayoutClient userInitials={initials} plan={plan}>
      {children}
    </LayoutClient>
  );
}
