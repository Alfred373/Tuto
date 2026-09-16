'use client';

import Link from 'next/link';
import Image from 'next/image';
import styles from './header.module.css';

export type MarketingView = 'home' | 'testimonials' | 'contact';

interface HeaderProps {
  activeView?: MarketingView;
  onNavigate?: (view: MarketingView) => void;
}

/**
 * ============================================================================
 * Marketing Header Component
 * ============================================================================
 * - Left: Brand logo with favicon and brand title ("Tuto").
 * - Center: Centered navigation menu with Testimonials and Contact.
 *   Active page displays a smooth animated underline with motion tokens.
 * - Right: Call to action button ("Get Started").
 */

export function Header({ activeView = 'home', onNavigate }: HeaderProps) {
  const handleNav = (view: MarketingView) => (e: React.MouseEvent) => {
    if (onNavigate) {
      e.preventDefault();
      onNavigate(view);
    }
  };

  return (
    <header className={styles.header}>
      {/* 1. Left: Brand Logo with Favicon */}
      <Link
        href="/#"
        onClick={handleNav('home')}
        className={styles.brandLink}
        aria-label="Tuto Home"
      >
        <Image
          src="/icon.svg"
          alt="Tuto Logo"
          width={36}
          height={36}
          style={{
            borderRadius: 'var(--shape-corner-small)',
            display: 'block',
          }}
          priority
        />
        <span
          style={{
            font: 'var(--typography-title-large)',
            fontFamily: 'var(--typography-family-display)',
            fontWeight: 700,
            color: 'var(--color-primary)',
            letterSpacing: '-0.5px',
          }}
        >
          Tuto
        </span>
      </Link>

      {/* 2. Center: Centered Navigation Menu with Motion Underline */}
      <nav aria-label="Main Navigation" className={styles.nav}>
        <Link
          href="#testimonials"
          onClick={handleNav('testimonials')}
          className={`${styles.navLink} ${activeView === 'testimonials' ? styles.navLinkActive : ''}`}
          aria-current={activeView === 'testimonials' ? 'page' : undefined}
        >
          Testimonials
        </Link>
        <Link
          href="#contact"
          onClick={handleNav('contact')}
          className={`${styles.navLink} ${activeView === 'contact' ? styles.navLinkActive : ''}`}
          aria-current={activeView === 'contact' ? 'page' : undefined}
        >
          Contact
        </Link>
      </nav>

      {/* 3. Right: Call To Action */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Link href="/auth" className={styles.ctaButton}>
          Get Started
        </Link>
      </div>
    </header>
  );
}
