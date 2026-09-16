'use client';

import { useState, useEffect } from 'react';
import { Header, type MarketingView } from '@/components/ui/header';
import marketingStyles from './marketing.module.css';

/**
 * ============================================================================
 * Single Page Architecture — Tuto Marketing (app/(marketing)/page.tsx)
 * ============================================================================
 * - Houses Home, Testimonials, and Contact in a single 100vh non-scrollable page.
 * - Conditionally renders view based on navigation state.
 * - Dynamically updates document.title and header title context.
 * - Strictly respects the 100vh constraint with zero scrollbars.
 */

const TESTIMONIALS = [
  {
    quote:
      'The step-by-step guidance in Further Mathematics helped me master difficult calculus questions before WAEC. I know the method now, not just the final number.',
    author: 'Amina O.',
    role: 'SS3 Student, Lagos',
    exam: 'WAEC Candidate',
  },
  {
    quote:
      'As a parent, I love that Tuto guides my son through the reasoning behind NECO science solutions instead of just giving answers away.',
    author: 'Mr. B. Adeyemi',
    role: 'Parent, Ibadan',
    exam: 'Parent of SS2 Student',
  },
];

export default function MarketingPage() {
  const [activeView, setActiveView] = useState<MarketingView>('home');
  const [submitted, setSubmitted] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: '',
    contact: '',
    message: '',
  });

  // Dynamically reflect active view in document header title
  useEffect(() => {
    switch (activeView) {
      case 'testimonials':
        document.title = 'Testimonials | Tuto';
        break;
      case 'contact':
        document.title = 'Contact | Tuto';
        break;
      default:
        document.title = 'Tuto — Know it, not just answer it | WAEC, NECO & JAMB Prep';
        break;
    }
  }, [activeView]);

  const handleContactSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.contact || !contactForm.message) return;
    setSubmitted(true);
  };

  return (
    <div
      style={{
        height: '100vh',
        maxHeight: '100vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--color-background)',
        color: 'var(--color-on-background)',
        boxSizing: 'border-box',
      }}
    >
      <Header activeView={activeView} onNavigate={setActiveView} />

      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'var(--spacing-24) var(--spacing-72)',
          boxSizing: 'border-box',
          overflow: 'hidden',
          width: '100%',
        }}
      >
        {/* 1. HOME VIEW */}
        {activeView === 'home' && (
          <div className={marketingStyles.displayHero}>
            <h1 className={marketingStyles.displayTitle}>
              <span className={marketingStyles.displaySubtitle}>Your AI Study Helper</span>
              <span className={marketingStyles.displayPunchline}>
                <span className={marketingStyles.redGradientText}>Tuto</span> it, Ace it!
              </span>
            </h1>
          </div>
        )}

        {/* 2. TESTIMONIALS VIEW */}
        {activeView === 'testimonials' && (
          <div
            style={{
              maxWidth: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 'var(--spacing-24)',
              boxSizing: 'border-box',
              width: '100%',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 'var(--spacing-8)',
                textAlign: 'center',
              }}
            >
              <h1
                style={{
                  font: 'var(--typography-display-medium)',
                  fontFamily: 'var(--typography-family-display)',
                  color: 'var(--color-on-background)',
                  margin: 0,
                  letterSpacing: '-0.5px',
                }}
              >
                Testimonials
              </h1>
              <p
                style={{
                  font: 'var(--typography-title-small)',
                  color: 'var(--color-on-surface-variant)',
                  margin: 0,
                }}
              >
                Real feedback from Nigerian students and parents preparing for national examinations.
              </p>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                gap: 'var(--spacing-24)',
                width: '100%',
                maxWidth: '100%',
                justifyContent: 'center',
                boxSizing: 'border-box',
                flexWrap: 'wrap',
              }}
            >
              {TESTIMONIALS.map((item) => (
                <article
                  key={item.author}
                  style={{
                    backgroundColor: 'var(--color-surface)',
                    color: 'var(--color-on-surface)',
                    padding: 'var(--spacing-24)',
                    borderRadius: 'var(--shape-corner-medium)',
                    outline: '1px solid var(--color-outline-variant)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: 'var(--spacing-16)',
                    flex: '1 1 300px',
                    maxWidth: '460px',
                    boxSizing: 'border-box',
                  }}
                >
                  <blockquote
                    style={{
                      margin: 0,
                      font: 'var(--typography-body-large)',
                      color: 'var(--color-on-surface)',
                      lineHeight: 1.5,
                    }}
                  >
                    &ldquo;{item.quote}&rdquo;
                  </blockquote>

                  <footer
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderTop: '1px solid var(--color-outline-variant)',
                      paddingTop: 'var(--spacing-12)',
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span
                        style={{
                          font: 'var(--typography-label-large)',
                          fontWeight: 600,
                          color: 'var(--color-on-surface)',
                        }}
                      >
                        {item.author}
                      </span>
                      <span
                        style={{
                          font: 'var(--typography-body-small)',
                          color: 'var(--color-on-surface-variant)',
                        }}
                      >
                        {item.role}
                      </span>
                    </div>

                    <span
                      style={{
                        font: 'var(--typography-label-small)',
                        color: 'var(--color-on-surface-variant)',
                      }}
                    >
                      {item.exam}
                    </span>
                  </footer>
                </article>
              ))}
            </div>
          </div>
        )}

        {/* 3. CONTACT VIEW */}
        {activeView === 'contact' && (
          <div
            style={{
              width: '100%',
              maxWidth: '460px',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--spacing-16)',
              boxSizing: 'border-box',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--spacing-4)',
                textAlign: 'center',
              }}
            >
              <h1
                style={{
                  font: 'var(--typography-display-medium)',
                  fontFamily: 'var(--typography-family-display)',
                  color: 'var(--color-on-background)',
                  margin: 0,
                  letterSpacing: '-0.5px',
                }}
              >
                Contact
              </h1>
              <p
                style={{
                  font: 'var(--typography-title-small)',
                  color: 'var(--color-on-surface-variant)',
                  margin: 0,
                }}
              >
                Have a question or feedback? We are here to help.
              </p>
            </div>

            {submitted ? (
              <div
                role="alert"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  color: 'var(--color-on-surface)',
                  padding: 'var(--spacing-24)',
                  borderRadius: 'var(--shape-corner-medium)',
                  outline: '1px solid var(--color-outline-variant)',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--spacing-8)',
                }}
              >
                <h2
                  style={{
                    font: 'var(--typography-title-medium)',
                    color: 'var(--color-primary)',
                    margin: 0,
                  }}
                >
                  Message Sent
                </h2>
                <p
                  style={{
                    font: 'var(--typography-body-medium)',
                    color: 'var(--color-on-surface-variant)',
                    margin: 0,
                  }}
                >
                  Thank you. Our support team will get back to you shortly.
                </p>
              </div>
            ) : (
              <form
                onSubmit={handleContactSubmit}
                style={{
                  backgroundColor: 'var(--color-surface)',
                  padding: 'var(--spacing-20)',
                  borderRadius: 'var(--shape-corner-medium)',
                  outline: '1px solid var(--color-outline-variant)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--spacing-12)',
                  boxSizing: 'border-box',
                  width: '100%',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
                  <label
                    htmlFor="contact-name"
                    style={{
                      font: 'var(--typography-label-medium)',
                      color: 'var(--color-on-surface)',
                    }}
                  >
                    Your Name
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    required
                    placeholder="e.g. Chinedu Okafor"
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    className={marketingStyles.input}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
                  <label
                    htmlFor="contact-identifier"
                    style={{
                      font: 'var(--typography-label-medium)',
                      color: 'var(--color-on-surface)',
                    }}
                  >
                    Phone Number or Email
                  </label>
                  <input
                    id="contact-identifier"
                    type="text"
                    required
                    placeholder="e.g. 08012345678 or student@example.com"
                    value={contactForm.contact}
                    onChange={(e) => setContactForm({ ...contactForm, contact: e.target.value })}
                    className={marketingStyles.input}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
                  <label
                    htmlFor="contact-message"
                    style={{
                      font: 'var(--typography-label-medium)',
                      color: 'var(--color-on-surface)',
                    }}
                  >
                    Message
                  </label>
                  <textarea
                    id="contact-message"
                    required
                    rows={2}
                    placeholder="How can we help?"
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    className={marketingStyles.textarea}
                  />
                </div>

                <button
                  type="submit"
                  className={marketingStyles.submitButton}
                >
                  Send Message
                </button>
              </form>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
