'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './onboarding.module.css';

/**
 * ============================================================================
 * Student Onboarding Sequence (/onboarding)
 * ============================================================================
 * - Rendered after Create Account before navigating to the Dashboard.
 * - Allows student to confirm target exam, class level, and subject interests.
 */

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [targetExam, setTargetExam] = useState('WAEC');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([
    'Mathematics',
    'English Language',
  ]);

  useEffect(() => {
    document.title = 'Welcome Onboarding | Tuto';
  }, []);

  const toggleSubject = (sub: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(sub) ? prev.filter((s) => s !== sub) : [...prev, sub]
    );
  };

  const handleNext = () => {
    if (step < 2) {
      setStep(step + 1);
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div className={styles.container}>
      <main className={styles.card}>
        <div className={styles.stepIndicator}>
          <div className={`${styles.stepDot} ${step === 1 ? styles.activeDot : ''}`} />
          <div className={`${styles.stepDot} ${step === 2 ? styles.activeDot : ''}`} />
        </div>

        {step === 1 && (
          <>
            <header className={styles.header}>
              <h1 className={styles.title}>Set Your Target Examination</h1>
              <p className={styles.subtext}>
                Tuto tailors every 5-step guided solution to your specific exam syllabus.
              </p>
            </header>

            <div className={styles.formGroup}>
              <label htmlFor="onboarding-exam" className={styles.label}>
                Select Examination Target
              </label>
              <select
                id="onboarding-exam"
                value={targetExam}
                onChange={(e) => setTargetExam(e.target.value)}
                className={styles.select}
              >
                <option value="WAEC">WAEC (Senior School Certificate)</option>
                <option value="NECO">NECO (National Exams Council)</option>
                <option value="JAMB">JAMB UTME</option>
              </select>
            </div>

            <button type="button" onClick={handleNext} className={styles.primaryButton}>
              Next: Select Subjects
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <header className={styles.header}>
              <h1 className={styles.title}>Pick Your Core Subjects</h1>
              <p className={styles.subtext}>
                Choose the subjects you are preparing for this term.
              </p>
            </header>

            <div className={styles.subjectGrid}>
              {['Mathematics', 'English Language', 'Physics', 'Chemistry'].map((subject) => (
                <button
                  key={subject}
                  type="button"
                  onClick={() => toggleSubject(subject)}
                  className={`${styles.subjectPill} ${
                    selectedSubjects.includes(subject) ? styles.selectedPill : ''
                  }`}
                >
                  {subject}
                </button>
              ))}
            </div>

            <button type="button" onClick={handleNext} className={styles.primaryButton}>
              Go to Dashboard
            </button>
          </>
        )}
      </main>
    </div>
  );
}
