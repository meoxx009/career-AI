import React, { useState, useEffect, useRef } from 'react';
import { useCareer } from '../context/CareerContext';
import {
  Eyebrow,
  PrimaryButton,
  SecondaryButton,
} from './DesignSystem';
import { X, Lock, Mail, AlertCircle, CheckCircle2, ExternalLink } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup' | 'reset';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'signin',
}) => {
  const {
    isSupabaseAvailable,
    signIn,
    signUp,
    signInWithGoogle,
    signInAsLocalGuest,
    resetPassword,
    loadRahulDemo,
    showToast,
  } = useCareer();

  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showSupabaseNotice, setShowSupabaseNotice] = useState(false);

  const previousActiveElementRef = useRef<HTMLElement | null>(null);
  const modalContainerRef = useRef<HTMLDivElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);

  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  const [prevInitialMode, setPrevInitialMode] = useState(initialMode);

  // Sync mode and clear transient notices when modal opens or initialMode changes
  if (isOpen !== prevIsOpen || initialMode !== prevInitialMode) {
    setPrevIsOpen(isOpen);
    setPrevInitialMode(initialMode);
    if (isOpen) {
      setMode(initialMode);
      setErrorMsg(null);
      setSuccessMsg(null);
      setShowSupabaseNotice(false);
    }
  }

  // Focus capture, containment, and restoration on open/close
  useEffect(() => {
    if (!isOpen) return;

    previousActiveElementRef.current = document.activeElement as HTMLElement | null;

    // Focus initial input field smoothly
    const timer = setTimeout(() => {
      emailInputRef.current?.focus();
    }, 60);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      // Trap focus within modal dialog
      if (e.key === 'Tab' && modalContainerRef.current) {
        const focusableElements = modalContainerRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
      // Restore focus to previous trigger element
      previousActiveElementRef.current?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    if (mode === 'reset') {
      setLoading(true);
      const res = await resetPassword(email);
      setLoading(false);
      if (res.success) {
        setSuccessMsg('Password reset instructions sent to your email.');
      } else {
        setErrorMsg(res.error || 'Failed to send reset instructions.');
      }
      return;
    }

    if (!password || password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    if (mode === 'signup' && password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);

    if (mode === 'signin') {
      const res = await signIn(email, password);
      setLoading(false);
      if (res.success) {
        showToast('Successfully signed in.');
        onClose();
      } else {
        setErrorMsg(res.error || 'Invalid credentials or user not found.');
      }
    } else {
      const res = await signUp(email, password);
      setLoading(false);
      if (res.success) {
        setSuccessMsg('Account created successfully! Check your email to confirm or sign in.');
        setMode('signin');
      } else {
        setErrorMsg(res.error || 'Failed to create account.');
      }
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setShowSupabaseNotice(false);
    setGoogleLoading(true);
    const res = await signInWithGoogle();
    setGoogleLoading(false);

    if (res.success) {
      // OAuth redirect initiated — browser will navigate away to Google
      showToast('Redirecting to Google...');
      // Modal stays open briefly while redirect happens
    } else if (res.error === '__NO_SUPABASE__') {
      // Supabase not configured — show inline setup notice
      setShowSupabaseNotice(true);
    } else {
      setErrorMsg(res.error || 'Google Sign-In failed. Please try again.');
    }
  };

  const handleContinueAsLocalLearner = () => {
    signInAsLocalGuest('Google Learner');
    setShowSupabaseNotice(false);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(8, 11, 12, 0.88)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1100,
        padding: '16px',
      }}
    >
      <div
        ref={modalContainerRef}
        style={{
          background: 'var(--color-black-soft)',
          border: '1px solid var(--color-line-dark)',
          borderRadius: 'var(--radius-lg)',
          maxWidth: '460px',
          width: '100%',
          maxHeight: 'min(90vh, 760px)',
          overflowY: 'auto',
          padding: '32px',
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.7)',
          position: 'relative',
        }}
      >
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'transparent',
            border: 0,
            color: 'var(--color-muted-light)',
            cursor: 'pointer',
          }}
          aria-label="Close authentication modal"
        >
          <X size={20} />
        </button>

        <Eyebrow text={isSupabaseAvailable ? 'SUPABASE AUTHENTICATION' : 'ACCOUNT AUTHENTICATION'} />
        <h2
          id="auth-modal-title"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.9rem',
            margin: '4px 0 10px',
            color: 'var(--color-linen)',
          }}
        >
          {mode === 'signin' && 'Sign In to CareerAI'}
          {mode === 'signup' && 'Create Your Account'}
          {mode === 'reset' && 'Reset Password'}
        </h2>

        {errorMsg && (
          <div
            role="alert"
            style={{
              background: 'rgba(235, 87, 87, 0.1)',
              border: '1px solid var(--color-danger)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 14px',
              fontSize: '0.82rem',
              color: 'var(--color-danger)',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <AlertCircle size={16} aria-hidden="true" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div
            role="status"
            style={{
              background: 'rgba(46, 204, 113, 0.1)',
              border: '1px solid var(--color-success)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 14px',
              fontSize: '0.82rem',
              color: 'var(--color-success)',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <CheckCircle2 size={16} aria-hidden="true" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Google OAuth action */}
        {mode !== 'reset' && (
          <div style={{ marginBottom: '18px' }}>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading || googleLoading}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                padding: '11px 16px',
                borderRadius: 'var(--radius-sm)',
                background: googleLoading ? 'rgba(255,255,255,0.03)' : 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--color-line-dark)',
                color: googleLoading ? 'var(--color-muted-light)' : 'var(--color-linen)',
                fontSize: '0.88rem',
                fontWeight: 600,
                cursor: (loading || googleLoading) ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s, border-color 0.2s, color 0.2s',
                minHeight: '44px',
              }}
              onMouseEnter={e => {
                if (!loading && !googleLoading) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.09)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)';
                }
              }}
              onMouseLeave={e => {
                if (!loading && !googleLoading) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.borderColor = 'var(--color-line-dark)';
                }
              }}
              aria-label="Continue with Google"
              aria-busy={googleLoading}
            >
              {googleLoading ? (
                <>
                  <svg
                    width="18" height="18" viewBox="0 0 24 24"
                    aria-hidden="true"
                    style={{ animation: 'spin 1s linear infinite', opacity: 0.5 }}
                  >
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" strokeDasharray="40 60" />
                  </svg>
                  <span>Connecting to Google...</span>
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Continue with Google</span>
                </>
              )}
            </button>

            {/* Supabase not configured notice */}
            {showSupabaseNotice && (
              <div
                role="alert"
                style={{
                  marginTop: '12px',
                  padding: '14px 16px',
                  background: 'rgba(255, 109, 31, 0.08)',
                  border: '1px solid rgba(255, 109, 31, 0.35)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.8rem',
                  color: 'var(--color-cotton)',
                  lineHeight: 1.55,
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: '6px', color: 'var(--color-tangerine)', display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <AlertCircle size={14} aria-hidden="true" />
                  <span>Google Sign-In needs Supabase setup</span>
                </div>
                <p style={{ margin: '0 0 10px' }}>
                  To enable live Google authentication, configure your Supabase project and add the Google OAuth Client ID &amp; Secret in{' '}
                  <strong>Supabase Dashboard → Auth → Providers → Google</strong>.
                  See{' '}
                  <a
                    href="https://github.com/meoxx009/career-AI/blob/main/docs/GOOGLE-SIGN-IN-SETUP.md"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'var(--color-tangerine)', textDecoration: 'underline' }}
                  >
                    GOOGLE-SIGN-IN-SETUP.md <ExternalLink size={11} style={{ verticalAlign: 'middle' }} />
                  </a>
                </p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={handleContinueAsLocalLearner}
                    style={{
                      padding: '7px 14px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--color-tangerine)',
                      color: '#000',
                      border: 0,
                      fontWeight: 700,
                      fontSize: '0.76rem',
                      cursor: 'pointer',
                      minHeight: '36px',
                    }}
                  >
                    Continue as Local Learner →
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSupabaseNotice(false)}
                    style={{
                      padding: '7px 12px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'transparent',
                      color: 'var(--color-muted-light)',
                      border: '1px solid var(--color-line-dark)',
                      fontSize: '0.76rem',
                      cursor: 'pointer',
                      minHeight: '36px',
                    }}
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                margin: '16px 0 12px',
                color: 'var(--color-muted-light)',
                fontSize: '0.72rem',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              <div style={{ flex: 1, height: '1px', background: 'var(--color-line-dark)' }} />
              <span style={{ padding: '0 12px' }}>or with email</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--color-line-dark)' }} />
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px' }}>
          <div>
            <label
              htmlFor="auth-email-input"
              style={{
                display: 'block',
                fontSize: '0.74rem',
                fontWeight: 800,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--color-linen)',
                marginBottom: '6px',
              }}
            >
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <input
                ref={emailInputRef}
                id="auth-email-input"
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="student@example.edu"
                style={{
                  width: '100%',
                  padding: '12px 14px 12px 38px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--color-void)',
                  border: '1px solid var(--color-line-dark)',
                  color: 'var(--color-linen)',
                  fontSize: '0.92rem',
                }}
              />
              <Mail
                size={16}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--color-muted-light)',
                }}
                aria-hidden="true"
              />
            </div>
          </div>

          {mode !== 'reset' && (
            <div>
              <label
                htmlFor="auth-password-input"
                style={{
                  display: 'block',
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--color-linen)',
                  marginBottom: '6px',
                }}
              >
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="auth-password-input"
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 38px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--color-void)',
                    border: '1px solid var(--color-line-dark)',
                    color: 'var(--color-linen)',
                    fontSize: '0.92rem',
                  }}
                />
                <Lock
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--color-muted-light)',
                  }}
                  aria-hidden="true"
                />
              </div>
            </div>
          )}

          {mode === 'signup' && (
            <div>
              <label
                htmlFor="auth-confirm-password-input"
                style={{
                  display: 'block',
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--color-linen)',
                  marginBottom: '6px',
                }}
              >
                Confirm Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="auth-confirm-password-input"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 38px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--color-void)',
                    border: '1px solid var(--color-line-dark)',
                    color: 'var(--color-linen)',
                    fontSize: '0.92rem',
                  }}
                />
                <Lock
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--color-muted-light)',
                  }}
                  aria-hidden="true"
                />
              </div>
            </div>
          )}

          <div style={{ marginTop: '8px' }}>
            <PrimaryButton
              type="submit"
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              {loading
                ? 'Processing...'
                : mode === 'signin'
                ? 'Sign In ↗'
                : mode === 'signup'
                ? 'Create Account ↗'
                : 'Send Reset Instructions ↗'}
            </PrimaryButton>
          </div>
        </form>

        {/* Tab & Mode Switchers */}
        <div
          style={{
            marginTop: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            alignItems: 'center',
            fontSize: '0.8rem',
            color: 'var(--color-muted-light)',
          }}
        >
          {mode === 'signin' && (
            <>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setErrorMsg(null);
                }}
                className="button-text"
                style={{ fontSize: '0.8rem' }}
              >
                Need an account? Sign up
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('reset');
                  setErrorMsg(null);
                }}
                className="button-text"
                style={{ fontSize: '0.76rem', color: 'var(--color-muted-light)' }}
              >
                Forgot your password?
              </button>
            </>
          )}

          {mode === 'signup' && (
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setErrorMsg(null);
              }}
              className="button-text"
              style={{ fontSize: '0.8rem' }}
            >
              Already have an account? Sign in
            </button>
          )}

          {mode === 'reset' && (
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setErrorMsg(null);
              }}
              className="button-text"
              style={{ fontSize: '0.8rem' }}
            >
              Back to Sign In
            </button>
          )}

          <div
            style={{
              width: '100%',
              borderTop: '1px solid var(--color-line-dark)',
              marginTop: '12px',
              paddingTop: '14px',
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <SecondaryButton
              onClick={() => {
                loadRahulDemo();
                onClose();
              }}
              style={{ fontSize: '0.76rem', minHeight: '34px', padding: '6px 16px' }}
            >
              Explore Sample Demo (Rahul)
            </SecondaryButton>
          </div>
        </div>
      </div>
    </div>
  );
};
