'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import styles from './layout.module.css';
import { signoutAction } from '@/app/actions/auth';
import { UpgradeModal } from '@/features/billing/components/upgrade-modal';
import type { UserPlanInfo } from '@/features/billing/entitlements';

export function LayoutClient({ 
  children, 
  userInitials,
  plan
}: { 
  children: React.ReactNode; 
  userInitials: string;
  plan: UserPlanInfo;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    await signoutAction();
    router.push('/auth');
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formattedPeriodEnd = plan.currentPeriodEnd 
    ? new Date(plan.currentPeriodEnd).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : null;

  return (
    <div className={styles.layoutContainer}>
      <aside className={`${styles.sidebar} ${collapsed ? styles.sidebarCollapsed : ''}`}>
        <div className={styles.sidebarHeader}>
          <h1 className={styles.logoText}>{collapsed ? 'T' : 'Tuto'}</h1>
        </div>
        
        <nav className={styles.nav}>
          <Link href="/dashboard" className={`${styles.navItem} ${pathname === '/dashboard' ? styles.navItemActive : ''}`}>
            <span className={styles.navIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
            </span>
            <span className={styles.navLabel}>Dashboard</span>
          </Link>
          <Link href="/quiz" className={`${styles.navItem} ${pathname === '/quiz' ? styles.navItemActive : ''}`}>
            <span className={styles.navIcon}>
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            </span>
            <span className={styles.navLabel}>Quiz</span>
          </Link>
        </nav>

        <div className={styles.sidebarFooter}>
          <button onClick={() => setCollapsed(!collapsed)} className={styles.collapseButton} aria-label="Toggle Sidebar">
            <span className={styles.navIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {collapsed ? (
                  <polyline points="13 17 18 12 13 7"></polyline>
                ) : (
                  <polyline points="11 17 6 12 11 7"></polyline>
                )}
              </svg>
            </span>
            <span className={styles.navLabel}>Collapse</span>
          </button>
        </div>
      </aside>

      <div className={styles.mainWrapper}>
        <header className={styles.topbar}>
          <button 
            className={plan.isPlus ? styles.proPillButton : styles.freePillButton}
            onClick={() => setIsUpgradeModalOpen(true)}
            aria-label={plan.isPlus ? "Manage Pro Plan" : "View Free Plan & Upgrade"}
          >
            {plan.isPlus ? (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                <span>Pro</span>
              </>
            ) : (
              <span>Free</span>
            )}
          </button>

          <div className={styles.avatarContainer} ref={dropdownRef}>
            <div 
              className={styles.avatar} 
              aria-label="User Avatar"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              {userInitials}
            </div>
            {dropdownOpen && (
              <div className={styles.dropdown}>
                <div className={styles.planDropdownInfo}>
                  <div className={styles.planDropdownLabel}>Current Plan</div>
                  <div className={styles.planDropdownTier}>{plan.name}</div>
                  {formattedPeriodEnd && (
                    <div className={styles.planDropdownDate}>
                      Renews {formattedPeriodEnd}
                    </div>
                  )}
                </div>
                <div className={styles.dropdownDivider} />
                <Link href="/account" className={styles.dropdownItem} onClick={() => setDropdownOpen(false)}>My Profile</Link>
                <Link href="/account" className={styles.dropdownItem} onClick={() => setDropdownOpen(false)}>Billing & Subscription</Link>
                <button onClick={handleSignOut} className={styles.dropdownItem}>Sign Out</button>
              </div>
            )}
          </div>
        </header>

        <main className={styles.contentArea}>
          {children}
        </main>
        
        <UpgradeModal 
          isOpen={isUpgradeModalOpen} 
          onClose={() => setIsUpgradeModalOpen(false)} 
          plan={plan}
        />
      </div>
    </div>
  );
}
