import { redirect } from 'next/navigation';
import { getSessionUser } from '@/features/identity/session';
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

  return (
    <LayoutClient userInitials={initials}>
      {children}
    </LayoutClient>
  );
}
