import React, { useState, useEffect } from 'react';
import { useCareer } from '../context/CareerContext';
import {
  Eyebrow,
  PrimaryButton,
  SecondaryButton,
} from './DesignSystem';
import { X, Lock, Mail, AlertCircle, CheckCircle2 } from 'lucide-react';

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
    resetPassword,
    loadRahulDemo,
    showToast,
  } = useCareer();

  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Close modal on Escape key press for accessible keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
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
        style={{
          background: 'var(--color-black-soft)',
          border: '1px solid var(--color-line-dark)',
          borderRadius: 'var(--radius-lg)',
          maxWidth: '460px',
          width: '100%',
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
