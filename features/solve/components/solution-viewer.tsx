'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './solution-viewer.module.css';

interface SolutionStepData {
  id: string;
  ordinal: number;
  statement: string;
  workingLatex: string | null;
  markNote: string | null;
}

interface QuizItemData {
  id: string;
  ordinal: number;
  prompt: string;
  optionsJson: unknown;
  correctOption: string;
  rationale: string | null;
}

interface SolutionViewerProps {
  submission: {
    id: string;
    subject: string | null;
    transcribedText: string | null;
    transcribedLatex: string | null;
    status: string;
    createdAt: Date;
  };
  solution: {
    id: string;
    finalAnswer: string | null;
    finalAnswerLatex: string | null;
    confidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'UNRESOLVED';
    explanation: string | null;
    followUpPrompt: string | null;
    followUpAnswer: string | null;
    steps: SolutionStepData[];
  } | null;
  quiz: {
    id: string;
    items: QuizItemData[];
  } | null;
}

export function SolutionViewer({ submission, solution, quiz }: SolutionViewerProps) {
  // F3.2 action: student must tap to reveal or submit attempt before solution renders
  const [revealed, setRevealed] = useState(false);
  const [studentAttempt, setStudentAttempt] = useState('');
  const [flagged, setFlagged] = useState(false);
  const [flagModalOpen, setFlagModalOpen] = useState(false);
  const [showFollowUpAnswer, setShowFollowUpAnswer] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});

  const handleSelectQuizOption = (itemId: string, optionKey: string) => {
    if (selectedAnswers[itemId]) return; // already answered
    setSelectedAnswers((prev) => ({ ...prev, [itemId]: optionKey }));
  };

  const handleFlag = async () => {
    setFlagged(true);
    setFlagModalOpen(false);
    // In production, records ContentFlag row in database
  };

  const confidenceClass =
    solution?.confidence === 'HIGH'
      ? styles.confidenceBadgeHigh
      : styles.confidenceBadgeMedium;

  return (
    <div className={styles.container}>
      <Link href="/dashboard" className={styles.backBtn}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
        Back to Dashboard
      </Link>

      {/* Top Bar: Subject, Confidence, and One-Tap Flag */}
      <div className={styles.topBar}>
        <div className={styles.badgeGroup}>
          <span className={styles.subjectBadge}>
            {submission.subject || 'GENERAL'}
          </span>
          {solution && (
            <span className={confidenceClass}>
              {solution.confidence === 'HIGH' ? 'Verified (HIGH)' : 'Review Needed (MEDIUM)'}
            </span>
          )}
        </div>

        <button
          type="button"
          className={`${styles.flagBtn} ${flagged ? styles.flagBtnFlagged : ''}`}
          onClick={() => (flagged ? null : handleFlag())}
          aria-label="Flag Solution"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill={flagged ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
            <line x1="4" y1="22" x2="4" y2="15"></line>
          </svg>
          {flagged ? 'Flagged for Review' : 'Flag Question'}
        </button>
      </div>

      {/* STEP 1: Understand (Transcribed Problem) */}
      <section className={styles.stepCard}>
        <div className={styles.stepHeader}>
          <span className={styles.stepTag}>Step 1</span>
          <h2 className={styles.stepTitle}>Understand the Question</h2>
        </div>

        <div className={styles.questionContent}>
          {submission.transcribedText || 'No transcribed question text available.'}
        </div>

        {submission.transcribedLatex && (
          <div className={styles.latexBox}>
            LaTeX: {submission.transcribedLatex}
          </div>
        )}
      </section>

      {/* STEP 2: Solution */}
      <section className={styles.stepCard}>
        <div className={styles.stepHeader}>
          <span className={styles.stepTag}>Step 2</span>
          <h2 className={styles.stepTitle}>Solution & Derivation</h2>
        </div>

        {!revealed ? (
          /* F3.2 Action: One tap required before solution is revealed */
          <div className={styles.revealBox}>
            <p className={styles.revealPrompt}>
              Give it a shot first, or tap below to reveal the step-by-step solution.
            </p>
            <div style={{ display: 'flex', gap: '12px', width: '100%', maxWidth: '400px' }}>
              <input
                type="text"
                placeholder="Your answer (optional)"
                value={studentAttempt}
                onChange={(e) => setStudentAttempt(e.target.value)}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid var(--color-outline-variant)',
                  fontSize: '14px',
                }}
              />
              <button
                type="button"
                className={styles.revealBtn}
                onClick={() => setRevealed(true)}
              >
                Reveal Solution
              </button>
            </div>
          </div>
        ) : (
          <div>
            {solution?.steps && solution.steps.length > 0 ? (
              solution.steps.map((step) => (
                <div key={step.id} className={styles.solutionStepRow}>
                  <div className={styles.stepStatement}>
                    <strong>Step {step.ordinal}:</strong> {step.statement}
                  </div>
                  {step.workingLatex && (
                    <div className={styles.stepWorking}>
                      {step.workingLatex}
                    </div>
                  )}
                  {step.markNote && (
                    <div className={styles.markNote}>
                      {step.markNote}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p>Solution steps in progress...</p>
            )}

            {solution?.finalAnswer && (
              <div className={styles.finalAnswerBox} style={{ marginTop: '20px' }}>
                <span className={styles.finalAnswerLabel}>Final Answer</span>
                <span className={styles.finalAnswerText}>
                  {solution.finalAnswer}
                </span>
              </div>
            )}
          </div>
        )}
      </section>

      {/* STEP 3: Explanation */}
      {revealed && solution?.explanation && (
        <section className={styles.stepCard}>
          <div className={styles.stepHeader}>
            <span className={styles.stepTag}>Step 3</span>
            <h2 className={styles.stepTitle}>Concept Explanation</h2>
          </div>
          <div className={styles.explanationText}>
            {solution.explanation}
          </div>
        </section>
      )}

      {/* STEP 4: Follow-up Challenge */}
      {revealed && solution?.followUpPrompt && (
        <section className={styles.stepCard}>
          <div className={styles.stepHeader}>
            <span className={styles.stepTag}>Step 4</span>
            <h2 className={styles.stepTitle}>Try a Similar Problem</h2>
          </div>
          <div className={styles.questionContent}>
            {solution.followUpPrompt}
          </div>
          <div>
            <button
              type="button"
              onClick={() => setShowFollowUpAnswer(!showFollowUpAnswer)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--color-primary)',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '14px',
                padding: '4px 0',
              }}
            >
              {showFollowUpAnswer ? 'Hide Answer' : 'Show Answer Key'}
            </button>
            {showFollowUpAnswer && solution.followUpAnswer && (
              <div className={styles.finalAnswerBox} style={{ marginTop: '12px' }}>
                <span className={styles.finalAnswerLabel}>Follow-up Answer Key</span>
                <span className={styles.finalAnswerText}>{solution.followUpAnswer}</span>
              </div>
            )}
          </div>
        </section>
      )}

      {/* STEP 5: Quick Quiz */}
      {revealed && quiz && quiz.items && quiz.items.length > 0 && (
        <section className={styles.stepCard}>
          <div className={styles.stepHeader}>
            <span className={styles.stepTag}>Step 5</span>
            <h2 className={styles.stepTitle}>Knowledge Check Quiz</h2>
          </div>

          {quiz.items.map((item) => {
            const rawOptions = item.optionsJson;
            const options: string[] = Array.isArray(rawOptions)
              ? (rawOptions as string[])
              : [];
            const selected = selectedAnswers[item.id];

            return (
              <div key={item.id} className={styles.quizQuestion}>
                <p className={styles.quizPrompt}>
                  {item.ordinal}. {item.prompt}
                </p>

                <div className={styles.optionsGrid}>
                  {options.map((opt, idx) => {
                    const optKey = ['A', 'B', 'C', 'D'][idx] || String(idx);
                    const isSelected = selected === optKey;
                    const isCorrect = item.correctOption === optKey;

                    let btnClass = styles.optionBtn;
                    if (selected) {
                      if (isSelected) {
                        btnClass = isCorrect
                          ? `${styles.optionBtn} ${styles.optionBtnSelectedCorrect}`
                          : `${styles.optionBtn} ${styles.optionBtnSelectedIncorrect}`;
                      } else if (isCorrect) {
                        btnClass = `${styles.optionBtn} ${styles.optionBtnSelectedCorrect}`;
                      }
                    }

                    return (
                      <button
                        key={optKey}
                        type="button"
                        className={btnClass}
                        onClick={() => handleSelectQuizOption(item.id, optKey)}
                        disabled={Boolean(selected)}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>

                {selected && item.rationale && (
                  <div className={styles.rationaleBox}>
                    <strong>Explanation:</strong> {item.rationale}
                  </div>
                )}
              </div>
            );
          })}
        </section>
      )}
    </div>
  );
}
