'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import authHeroImg from '../../../public/images/auth-hero.jpg';
import { emailSigninAction, requestPasswordResetAction, resetPasswordAction } from '@/app/actions/auth';
import { ClassLevel, TargetExam } from '@prisma/client';
import styles from './auth.module.css';

export type AuthMode = 'signin' | 'signup' | 'forgot' | 'reset';

/**
 * ============================================================================
 * Split-Screen Authentication Architecture — Tuto (/auth)
 * ============================================================================
 * Includes comprehensive client-side validation:
 * - Blur check for empty fields: "(label) field Cannot Be Empty".
 * - Real-time email validation: "Enter A Valid Email Address" until domain after @ is typed.
 * - Full name alphabetic validation: "Full Name Must Use Only Letters".
 * - Full name multi-word validation: At least 2 names required, supports 2, 3, or more words.
 * - Real-time password requirement guide (hidden by default, displayed 1 by 1, length last).
 * - Submit button disabled until all fields are completely filled with valid data.
 * - Trimming of trailing whitespace on all input fields.
 */

export default function AuthPage() {
  const router = useRouter();

  // Mode: 'signin' | 'signup' | 'forgot'
  const [authMode, setAuthMode] = useState<AuthMode>('signin');

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Reset specific fields
  const [resetCode, setResetCode] = useState('');

  // Signup-specific fields
  const [displayName, setDisplayName] = useState('');
  const [classLevel, setClassLevel] = useState<ClassLevel>(ClassLevel.SS2);
  const [targetExam, setTargetExam] = useState<TargetExam>(TargetExam.WAEC);
  const [isMinorUnder13, setIsMinorUnder13] = useState(false);

  // Field touch state for blur validation
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Status feedback
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Dynamically update page title based on the active form / action
  useEffect(() => {
    if (authMode === 'signup') {
      document.title = 'Create Account | Tuto';
    } else if (authMode === 'forgot' || authMode === 'reset') {
      document.title = 'Forgot Password | Tuto';
    } else {
      document.title = 'Sign In | Tuto';
    }
  }, [authMode]);

  const switchMode = (mode: AuthMode): void => {
    setAuthMode(mode);
    setErrorMsg(null);
    setSuccessMsg(null);
    setTouched({});
  };

  const markTouched = (fieldName: string): void => {
    setTouched((prev) => ({ ...prev, [fieldName]: true }));
  };

  // ==========================================================================
  // Client-Side Field Validation Helpers
  // ==========================================================================

  const getEmailError = (val: string, fieldName: string, label: string): string | null => {
    const trimmed = val.trimEnd();
    if (!trimmed) {
      return touched[fieldName] ? `${label} field Cannot Be Empty` : null;
    }
    // Real-time validation: valid email regex with domain after @
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRegex.test(trimmed)) {
      return 'Enter A Valid Email Address';
    }
    return null;
  };

  // Real-time password requirement tracker (hidden by default, displayed 1 by 1, length LAST)
  const getPasswordRequirement = (val: string): string | null => {
    if (!val) return null; // Hidden by default until user types

    const hasLower = /[a-z]/.test(val);
    const hasUpper = /[A-Z]/.test(val);
    const hasNumber = /[0-9]/.test(val);
    const hasSpecial = /[#@>^!$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(val);
    const hasLength = val.length >= 8;

    // Ordered sequence: character rules first, length requirement LAST
    if (!hasLower) {
      return 'Password must contain a lowercase letter';
    }
    if (!hasUpper) {
      return 'Password must contain an uppercase letter';
    }
    if (!hasNumber) {
      return 'Password must contain a number';
    }
    if (!hasSpecial) {
      return 'Password must contain a special character (#@>^)';
    }
    if (!hasLength) {
      return 'Minimum Of 8 Characters';
    }

    return null; // All 5 requirements met!
  };

  const getPasswordError = (val: string, fieldName: string, label: string): string | null => {
    const trimmed = val.trimEnd();
    if (!trimmed) {
      return touched[fieldName] ? `${label} field Cannot Be Empty` : null;
    }
    return getPasswordRequirement(trimmed);
  };

  const getFullNameError = (val: string, fieldName: string, label: string): string | null => {
    const trimmed = val.trimEnd();
    if (!trimmed) {
      return touched[fieldName] ? `${label} field Cannot Be Empty` : null;
    }
    // 1. Validate only alphabets, spaces, and hyphens
    if (/[^a-zA-Z\s'-]/.test(val)) {
      return 'Full Name Must Use Only Letters';
    }
    // 2. Ensure at least 2 words (e.g. first and last name, or 3+ for middle names)
    const words = trimmed.split(/\s+/).filter(Boolean);
    if (words.length < 2) {
      return 'Full name must contain at least 2 words';
    }
    return null;
  };

  // Active validation errors for rendering
  const signinEmailError = getEmailError(email, 'signin-email', 'Email address');
  const signinPasswordError = getPasswordError(password, 'signin-password', 'Password');

  const signupNameError = getFullNameError(displayName, 'signup-name', 'Full name');
  const signupEmailError = getEmailError(email, 'signup-email', 'Email address');
  const signupPasswordReq = getPasswordRequirement(password);
  const signupPasswordError = getPasswordError(password, 'signup-password', 'Create password');

  const forgotEmailError = getEmailError(email, 'forgot-email', 'Registered email address');

  // Form completion check (Enables button ONLY when all fields are completely filled & valid)
  const isSigninFormComplete =
    Boolean(email.trim()) &&
    Boolean(password.trim()) &&
    !signinEmailError &&
    !signinPasswordError;

  const isSignupFormComplete =
    Boolean(displayName.trim()) &&
    Boolean(email.trim()) &&
    Boolean(password.trim()) &&
    !signupNameError &&
    !signupEmailError &&
    signupPasswordReq === null;

  const isForgotFormComplete = Boolean(email.trim()) && !forgotEmailError;

  // Form Submit Handlers
  const handleSigninSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setErrorMsg(null);

    markTouched('signin-email');
    markTouched('signin-password');

    if (!isSigninFormComplete) {
      return;
    }

    setLoading(true);

    try {
      const res = await emailSigninAction({
        email: email.trimEnd(),
        password: password.trimEnd(),
        rememberMe,
      });

      if (!res.ok) {
        setErrorMsg(res.message);
        setLoading(false);
        return;
      }

      if (res.data.isLockedMinor) {
        router.push('/consent');
      } else {
        router.push('/dashboard');
      }
    } catch {
      setErrorMsg('Sign in failed. Please check your credentials and try again.');
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setErrorMsg(null);

    markTouched('signup-name');
    markTouched('signup-email');
    markTouched('signup-password');

    if (!isSignupFormComplete) {
      return;
    }

    setLoading(true);

    try {
      const res = await emailSigninAction({
        email: email.trimEnd(),
        password: password.trimEnd(),
        rememberMe,
      });

      if (!res.ok) {
        setErrorMsg(res.message);
        setLoading(false);
        return;
      }

      if (res.data.isLockedMinor || isMinorUnder13) {
        router.push('/consent');
      } else {
        router.push('/onboarding');
      }
    } catch {
      setErrorMsg('Could not complete registration. Please try again.');
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    markTouched('forgot-email');
    if (!isForgotFormComplete) {
      return;
    }

    setLoading(true);

    try {
      const res = await requestPasswordResetAction({ email });
      setLoading(false);
      
      if (!res.ok) {
        setErrorMsg(res.message);
        return;
      }

      setSuccessMsg(
        `If an account exists for ${email.trimEnd()}, a password reset code has been dispatched.`
      );
      setAuthMode('reset');
    } catch {
      setErrorMsg('Could not process request. Please try again.');
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    setLoading(true);
    
    try {
      const res = await resetPasswordAction({ email, code: resetCode, newPassword: password });
      setLoading(false);

      if (!res.ok) {
        setErrorMsg(res.message);
        return;
      }

      setSuccessMsg('Password has been successfully reset. Please sign in with your new password.');
      setAuthMode('signin');
      setResetCode('');
      setPassword('');
    } catch {
      setErrorMsg('Could not reset password. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className={styles.authContainer}>
      {/* 1. LEFT PANEL: Centred Container (~50% screen) */}
      <section className={styles.leftPanel} aria-label="Authentication form">
        <div className={styles.cardContainer}>
          {/* Product Logo & Product Name */}
          <div className={styles.brandHeader}>
            <Link href="/" className={styles.brandLink} aria-label="Tuto Home">
              <Image
                src="/icon.svg"
                alt="Tuto Logo"
                width={40}
                height={40}
                className={styles.brandLogo}
                priority
              />
              <span className={styles.brandName}>Tuto</span>
            </Link>
          </div>

          {/* Short Welcome Message */}
          <header className={styles.headerSection}>
            <h1 className={styles.welcomeHeading}>
              {authMode === 'signin' && 'Welcome back'}
              {authMode === 'signup' && 'Create your account'}
              {authMode === 'forgot' && 'Reset your password'}
            </h1>
            <p className={styles.welcomeSubtext}>
              {authMode === 'signin' &&
                'Please enter your details to sign in and continue your exam preparation.'}
              {authMode === 'signup' && 'Create an account in minutes'}
              {authMode === 'forgot' &&
                "Enter your registered email address and we'll send you a password reset link."}
            </p>
          </header>

          {/* Feedback alerts */}
          {errorMsg && (
            <div role="alert" className={styles.errorAlert}>
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div role="status" className={styles.successAlert}>
              {successMsg}
            </div>
          )}

          {/* ============================================================ */}
          {/* A. SIGN IN FORM                                              */}
          {/* ============================================================ */}
          {authMode === 'signin' && (
            <form onSubmit={handleSigninSubmit} className={styles.form} noValidate>
              {/* Email Field */}
              <div className={styles.fieldGroup}>
                <label htmlFor="auth-email" className={styles.label}>
                  Email address
                </label>
                <input
                  id="auth-email"
                  type="email"
                  name="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => {
                    markTouched('signin-email');
                    setEmail((prev) => prev.trimEnd());
                  }}
                  className={`${styles.input} ${signinEmailError ? styles.inputError : ''}`}
                />
                {signinEmailError && (
                  <span className={styles.fieldError} role="alert">
                    {signinEmailError}
                  </span>
                )}
              </div>

              {/* Password Field */}
              <div className={styles.fieldGroup}>
                <label htmlFor="auth-password" className={styles.label}>
                  Password
                </label>
                <div className={styles.passwordWrapper}>
                  <input
                    id="auth-password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onBlur={() => {
                      markTouched('signin-password');
                      setPassword((prev) => prev.trimEnd());
                    }}
                    className={`${styles.passwordInput} ${
                      signinPasswordError ? styles.inputError : ''
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={styles.showHideButton}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                        <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                        <path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                        <line x1="2" y1="2" x2="22" y2="22" />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
                {signinPasswordError && (
                  <span className={styles.fieldError} role="alert">
                    {signinPasswordError}
                  </span>
                )}
              </div>

              {/* Remember Me & Forgot Password */}
              <div className={styles.optionsRow}>
                <label htmlFor="auth-remember" className={styles.rememberLabel}>
                  <input
                    id="auth-remember"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className={styles.checkbox}
                  />
                  <span>Remember me</span>
                </label>

                <button
                  type="button"
                  onClick={() => switchMode('forgot')}
                  className={styles.forgotLink}
                >
                  Forgot password?
                </button>
              </div>

              {/* Primary Sign-In Button */}
              <button
                type="submit"
                disabled={loading || !isSigninFormComplete}
                className={styles.primaryButton}
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>
          )}

          {/* ============================================================ */}
          {/* B. CREATE ACCOUNT FORM                                       */}
          {/* ============================================================ */}
          {authMode === 'signup' && (
            <form onSubmit={handleSignupSubmit} className={styles.form} noValidate>
              {/* Full Name */}
              <div className={styles.fieldGroup}>
                <label htmlFor="signup-name" className={styles.label}>
                  Full name
                </label>
                <input
                  id="signup-name"
                  type="text"
                  name="name"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  onBlur={() => {
                    markTouched('signup-name');
                    setDisplayName((prev) => prev.trimEnd());
                  }}
                  className={`${styles.input} ${signupNameError ? styles.inputError : ''}`}
                />
                {signupNameError && (
                  <span className={styles.fieldError} role="alert">
                    {signupNameError}
                  </span>
                )}
              </div>

              {/* Email Address */}
              <div className={styles.fieldGroup}>
                <label htmlFor="signup-email" className={styles.label}>
                  Email address
                </label>
                <input
                  id="signup-email"
                  type="email"
                  name="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => {
                    markTouched('signup-email');
                    setEmail((prev) => prev.trimEnd());
                  }}
                  className={`${styles.input} ${signupEmailError ? styles.inputError : ''}`}
                />
                {signupEmailError && (
                  <span className={styles.fieldError} role="alert">
                    {signupEmailError}
                  </span>
                )}
              </div>

              {/* Password with Real-Time Requirement Guide */}
              <div className={styles.fieldGroup}>
                <label htmlFor="signup-password" className={styles.label}>
                  Create password
                </label>
                <div className={styles.passwordWrapper}>
                  <input
                    id="signup-password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    required
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onBlur={() => {
                      markTouched('signup-password');
                      setPassword((prev) => prev.trimEnd());
                    }}
                    className={`${styles.passwordInput} ${
                      signupPasswordError ? styles.inputError : ''
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={styles.showHideButton}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                        <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                        <path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                        <line x1="2" y1="2" x2="22" y2="22" />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>

                {/* Real-time single password requirement or blur empty error */}
                {signupPasswordReq ? (
                  <span className={styles.passwordGuide} role="status">
                    • {signupPasswordReq}
                  </span>
                ) : signupPasswordError ? (
                  <span className={styles.fieldError} role="alert">
                    {signupPasswordError}
                  </span>
                ) : null}
              </div>

              {/* Class Level */}
              <div className={styles.fieldGroup}>
                <label htmlFor="signup-class" className={styles.label}>
                  Class level
                </label>
                <select
                  id="signup-class"
                  value={classLevel}
                  onChange={(e) => setClassLevel(e.target.value as ClassLevel)}
                  className={styles.input}
                >
                  <option value={ClassLevel.JSS1}>JSS 1</option>
                  <option value={ClassLevel.JSS2}>JSS 2</option>
                  <option value={ClassLevel.JSS3}>JSS 3</option>
                  <option value={ClassLevel.SS1}>SS 1</option>
                  <option value={ClassLevel.SS2}>SS 2</option>
                  <option value={ClassLevel.SS3}>SS 3</option>
                </select>
              </div>

              {/* Target Exam */}
              <div className={styles.fieldGroup}>
                <label htmlFor="signup-exam" className={styles.label}>
                  Target examination
                </label>
                <select
                  id="signup-exam"
                  value={targetExam}
                  onChange={(e) => setTargetExam(e.target.value as TargetExam)}
                  className={styles.input}
                >
                  <option value={TargetExam.WAEC}>WAEC (Senior School Certificate)</option>
                  <option value={TargetExam.NECO}>NECO (National Exams Council)</option>
                  <option value={TargetExam.JAMB}>JAMB UTME</option>
                  <option value={TargetExam.NONE}>General Secondary Curriculum</option>
                </select>
              </div>

              {/* Minor Checkbox */}
              <label htmlFor="signup-minor" className={styles.rememberLabel}>
                <input
                  id="signup-minor"
                  type="checkbox"
                  checked={isMinorUnder13}
                  onChange={(e) => setIsMinorUnder13(e.target.checked)}
                  className={styles.checkbox}
                />
                <span>I am under 13 years of age</span>
              </label>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !isSignupFormComplete}
                className={styles.primaryButton}
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>
          )}

          {/* ============================================================ */}
          {/* C. FORGOT PASSWORD FORM                                      */}
          {/* ============================================================ */}
          {authMode === 'forgot' && (
            <form onSubmit={handleForgotSubmit} className={styles.form} noValidate>
              <div className={styles.fieldGroup}>
                <label htmlFor="forgot-email" className={styles.label}>
                  Registered email address
                </label>
                <input
                  id="forgot-email"
                  type="email"
                  name="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => {
                    markTouched('forgot-email');
                    setEmail((prev) => prev.trimEnd());
                  }}
                  className={`${styles.input} ${forgotEmailError ? styles.inputError : ''}`}
                />
                {forgotEmailError && (
                  <span className={styles.fieldError} role="alert">
                    {forgotEmailError}
                  </span>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !isForgotFormComplete}
                className={styles.primaryButton}
              >
                {loading ? 'Sending code...' : 'Send Reset Code'}
              </button>
            </form>
          )}

          {/* ============================================================ */}
          {/* D. RESET PASSWORD FORM                                       */}
          {/* ============================================================ */}
          {authMode === 'reset' && (
            <form onSubmit={handleResetSubmit} className={styles.form} noValidate>
              <div className={styles.fieldGroup}>
                <label htmlFor="reset-code" className={styles.label}>
                  6-Digit Reset Code
                </label>
                <input
                  id="reset-code"
                  type="text"
                  name="resetCode"
                  required
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  className={styles.input}
                  placeholder="e.g. 123456"
                  maxLength={6}
                />
              </div>

              <div className={styles.fieldGroup}>
                <label htmlFor="new-password" className={styles.label}>
                  New Password
                </label>
                <input
                  id="new-password"
                  type="password"
                  name="newPassword"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={styles.input}
                />
              </div>

              <button
                type="submit"
                disabled={loading || resetCode.length !== 6 || password.length < 8}
                className={styles.primaryButton}
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          )}

          {/* ============================================================ */}
          {/* Mode Switch Navigation Links                                 */}
          {/* ============================================================ */}
          <footer className={styles.bottomToggle}>
            {authMode === 'signin' && (
              <p>
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('signup')}
                  className={styles.toggleAction}
                >
                  Create account
                </button>
              </p>
            )}

            {authMode === 'signup' && (
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('signin')}
                  className={styles.toggleAction}
                >
                  Sign in
                </button>
              </p>
            )}

            {authMode === 'forgot' && (
              <p>
                Remember your password?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('signin')}
                  className={styles.toggleAction}
                >
                  Back to sign in
                </button>
              </p>
            )}
          </footer>
        </div>
      </section>

      {/* 2. RIGHT PANEL: Visual Hero Image Panel (~50% screen) */}
      <aside className={styles.rightPanel} aria-label="Visual presentation">
        <Image
          src={authHeroImg}
          alt="Tuto Study Workspace with textbooks and learning materials"
          fill
          sizes="50vw"
          priority
          className={styles.heroImage}
        />
        <div className={styles.heroOverlay}>
          <h2 className={styles.heroTitle}>Your AI Study Helper</h2>
          <p className={styles.heroSubtitle}>Tuto it, Ace it!</p>
        </div>
      </aside>
    </div>
  );
}
