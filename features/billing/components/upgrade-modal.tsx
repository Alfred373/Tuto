'use client';

import React, { useState, useEffect } from 'react';
import styles from './upgrade-modal.module.css';
import { createCheckoutSessionAction, getProrationQuoteAction } from '../actions';
import type { UserPlanInfo } from '@/features/billing/entitlements';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan?: UserPlanInfo;
}

export function UpgradeModal({ isOpen, onClose, plan }: UpgradeModalProps) {
  const [loading, setLoading] = useState<'plus_monthly' | 'plus_annual' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [proration, setProration] = useState<{
    canUpgrade: boolean;
    regularPriceKobo: number;
    proratedPriceKobo: number;
    creditKobo: number;
    remainingDays: number;
  } | null>(null);

  useEffect(() => {
    if (isOpen && plan?.isPlus && plan?.code === 'plus_monthly') {
      getProrationQuoteAction().then(res => {
        if (res.canUpgrade) setProration(res);
      }).catch(console.error);
    }
  }, [isOpen, plan]);

  if (!isOpen) return null;

  const isMonthlyActive = Boolean(plan?.isPlus && plan?.code === 'plus_monthly');
  const isAnnualActive = Boolean(plan?.isPlus && plan?.code === 'plus_annual');

  const handleSubscribe = async (planCode: 'plus_monthly' | 'plus_annual') => {
    setLoading(planCode);
    setError(null);
    
    try {
      const result = await createCheckoutSessionAction(planCode);
      if (result.ok) {
        window.location.href = result.paymentLink;
      } else {
        setError(result.message);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose} aria-label="Close">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div className={styles.header}>
          <h2 className={styles.title}>
            {plan?.isPlus ? 'Tuto Pro Membership' : 'Upgrade to Tuto Pro'}
          </h2>
          <p className={styles.subtitle}>
            {isMonthlyActive
              ? 'You are on the Monthly plan. Upgrade to Yearly to get 2 months free and save 26%!'
              : isAnnualActive
                ? 'You have active Annual Pro access. All exam prep features are unlocked.'
                : 'Unlock unlimited daily questions, KaTeX step-by-step solutions, and offline history.'}
          </p>
          {error && <p style={{ color: '#eb5757', marginTop: '12px', fontSize: '14px' }}>{error}</p>}
        </div>

        <div className={styles.plansContainer}>
          {/* Monthly Plan */}
          <div className={styles.planCard}>
            {isMonthlyActive && <div className={styles.badgeActive}>Active Plan</div>}
            <h3 className={styles.planName}>Monthly</h3>
            <div className={styles.priceContainer}>
              <span className={styles.currency}>₦</span>
              <span className={styles.price}>2,499</span>
              <span className={styles.period}>/mo</span>
            </div>
            
            <ul className={styles.featuresList}>
              <li><CheckIcon /> Unlimited daily questions</li>
              <li><CheckIcon /> KaTeX math rendering</li>
              <li><CheckIcon /> Offline reading of history</li>
              <li><CheckIcon /> Weekly parent summaries</li>
              <li><CheckIcon /> Cancel anytime</li>
            </ul>

            <button 
              className={`${styles.subscribeButton} ${styles.subscribeButtonMonthly}`}
              onClick={() => handleSubscribe('plus_monthly')}
              disabled={isMonthlyActive || isAnnualActive || loading !== null}
            >
              {loading === 'plus_monthly' ? (
                <span className={styles.spinner}></span>
              ) : isMonthlyActive ? (
                'Current Plan (Active)'
              ) : (
                'Subscribe Monthly'
              )}
            </button>
          </div>

          {/* Annual Plan */}
          <div className={`${styles.planCard} ${styles.planCardYearly}`}>
            {isAnnualActive ? (
              <div className={styles.badgeActive}>Active Plan</div>
            ) : (
              <div className={styles.badge}>Save 26%</div>
            )}

            <h3 className={styles.planName}>Annual</h3>
            <div className={styles.priceContainer}>
              <span className={styles.currency}>₦</span>
              <span className={styles.price}>22,000</span>
              <span className={styles.period}>/yr</span>
            </div>

            {isMonthlyActive && proration && proration.creditKobo > 0 && (
              <div className={styles.prorationBox}>
                <strong>Proration Applied:</strong> ₦{(proration.creditKobo / 100).toLocaleString()} credit from your remaining {proration.remainingDays} days of monthly. You pay only <strong>₦{(proration.proratedPriceKobo / 100).toLocaleString()}</strong> today!
              </div>
            )}
            
            <ul className={styles.featuresList}>
              <li><CheckIcon /> Everything in Monthly</li>
              <li><CheckIcon /> 2 months free</li>
              <li><CheckIcon /> Best value for students</li>
              <li><CheckIcon /> Priority AI tutor processing</li>
            </ul>

            <button 
              className={`${styles.subscribeButton} ${styles.subscribeButtonYearly}`}
              onClick={() => handleSubscribe('plus_annual')}
              disabled={isAnnualActive || loading !== null}
            >
              {loading === 'plus_annual' ? (
                <span className={styles.spinner}></span>
              ) : isAnnualActive ? (
                'Current Plan (Active)'
              ) : isMonthlyActive ? (
                'Upgrade to yearly plan'
              ) : (
                'Subscribe Yearly'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  );
}
