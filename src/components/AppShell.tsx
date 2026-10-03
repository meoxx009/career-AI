import React, { useState, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { BrandMark, Toast } from './DesignSystem';
import { ErrorBoundary } from './ErrorBoundary';
import { useCareer } from '../context/CareerContext';
import { Menu, X, Sparkles, RefreshCw } from 'lucide-react';

interface AppShellProps {
  children: React.ReactNode;
  toastMessage?: string | null;
}

export const AppShell: React.FC<AppShellProps> = ({ children, toastMessage = null }) => {
  const {
    isDemoMode,
    demoBadgeText,
    resetToDemo,
    user,
    isAuthenticated,
    openAuthModal,
    signOut,
  } = useCareer();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const isLanding = location.pathname === '/';

  // Handle escape key to close mobile dialog
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  const navLinks = [
    { to: '/', label: 'Overview' },
    { to: '/paths', label: 'Paths' },
    { to: '/assessment', label: 'Assessment' },
    { to: '/roadmap', label: 'Roadmap' },
    { to: '/practice', label: 'Practice' },
    { to: '/resume', label: 'Resume Lab' },
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/settings', label: 'Settings' },
  ];

  return (
    <div className="app-container">
      {/* Skip to Main Content for Screen Readers & Keyboard Users */}
      <a href="#main-content" className="skip-to-content">
        Skip to main content
      </a>

      {/* Background ambient lighting blooms */}
      <div className="ambient ambient-top" aria-hidden="true" />
      <div className="ambient ambient-bottom" aria-hidden="true" />

      {/* Accessible Global Header */}
      <header className="site-header shell" role="banner">
        <div className="header-left">
          <NavLink to="/" aria-label="CareerAI home">
            <BrandMark />
          </NavLink>

          {/* Demo badge only shown on internal routes */}
          {!isLanding && isDemoMode && (
            <span
              className="fictional-demo-badge"
              role="status"
              aria-label="Demo status: Fictional demo data"
              title="You are viewing synthetic demo data. No real student data is used."
            >
              <Sparkles size={12} aria-hidden="true" />
              {demoBadgeText}
            </span>
          )}
        </div>

        {/* Desktop Primary Navigation */}
        <nav className="top-nav" aria-label="Primary navigation">
          {navLinks.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => (isActive ? 'active' : '')}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {isLanding ? (
            /* Landing: clean primary action + explore demo */
            <>
              <button
                type="button"
                onClick={() => openAuthModal('signin')}
                className="button-text"
                style={{ fontSize: '0.74rem', color: 'var(--color-cotton)' }}
                aria-label="Sign in to CareerAI"
              >
                Sign In
              </button>
              <Link
                to="/onboarding"
                className="header-button"
                style={{ textDecoration: 'none' }}
              >
                Find my direction →
              </Link>
            </>
          ) : (
            /* Internal routes: show user email, sign-in/out, demo reset, profile link */
            <>
              {isAuthenticated ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.74rem', color: 'var(--color-cotton)' }}>
                    {user?.email}
                  </span>
                  <button
                    type="button"
                    onClick={signOut}
                    className="button-text"
                    style={{ fontSize: '0.74rem' }}
                    aria-label="Sign out"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => openAuthModal('signin')}
                  className="button-text"
                  style={{ fontSize: '0.74rem', color: 'var(--color-cotton)' }}
                  aria-label="Sign in to CareerAI"
                >
                  Sign In
                </button>
              )}

              {isDemoMode && (
                <button
                  type="button"
                  onClick={resetToDemo}
                  className="button-text"
                  style={{ fontSize: '0.74rem' }}
                  title="Reset state back to initial synthetic demo"
                  aria-label="Reset demo data"
                >
                  <RefreshCw size={13} aria-hidden="true" />
                  Reset Demo
                </button>
              )}

              <Link
                to="/profile/edit"
                className="header-button"
                style={{ textDecoration: 'none' }}
              >
                Profile
              </Link>
            </>
          )}

          {/* Accessible Mobile Menu Toggle Button */}
          <button
            className="mobile-menu-btn"
            type="button"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav-dialog"
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
          </button>
        </div>
      </header>

      {/* Accessible Mobile Navigation Drawer & Backdrop */}
      {mobileMenuOpen && (
        <>
          <div
            className="mobile-nav-backdrop"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <div
            id="mobile-nav-dialog"
            className="mobile-nav-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile Navigation"
          >
            <div className="mobile-nav-drawer-header">
              <BrandMark />
              <button
                type="button"
                className="button-text"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
              >
                <X size={22} aria-hidden="true" />
              </button>
            </div>

            {isDemoMode && (
              <div>
                <span className="fictional-demo-badge">
                  <Sparkles size={12} aria-hidden="true" />
                  {demoBadgeText}
                </span>
              </div>
            )}

            <nav className="mobile-nav-links" aria-label="Mobile primary navigation">
              {navLinks.map(link => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) => (isActive ? 'active' : '')}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </NavLink>
              ))}
              <NavLink
                to="/profile/edit"
                className={({ isActive }) => (isActive ? 'active' : '')}
                onClick={() => setMobileMenuOpen(false)}
              >
                Profile
              </NavLink>
              <NavLink
                to="/design-system"
                className={({ isActive }) => (isActive ? 'active' : '')}
                onClick={() => setMobileMenuOpen(false)}
              >
                Design System
              </NavLink>
            </nav>

            <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--color-line-dark)', display: 'grid', gap: '10px' }}>
              {isAuthenticated ? (
                <button
                  type="button"
                  onClick={() => {
                    signOut();
                    setMobileMenuOpen(false);
                  }}
                  className="button button-secondary"
                  style={{ width: '100%', fontSize: '0.82rem' }}
                >
                  Sign Out ({user?.email})
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    openAuthModal('signin');
                    setMobileMenuOpen(false);
                  }}
                  className="button button-primary"
                  style={{ width: '100%', fontSize: '0.82rem' }}
                >
                  Sign In / Create Account
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  resetToDemo();
                  setMobileMenuOpen(false);
                }}
                className="button button-secondary"
                style={{ width: '100%' }}
              >
                <RefreshCw size={14} aria-hidden="true" />
                Reset Demo Data
              </button>
            </div>
          </div>
        </>
      )}

      {/* Main Landmark Shell wrapped in ErrorBoundary */}
      <main id="main-content" tabIndex={-1} className="shell" role="main" style={{ minHeight: 'calc(100vh - 180px)', padding: '40px 0', outline: 'none' }}>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </main>

      {/* Professional Global Footer */}
      <footer className="site-footer shell" role="contentinfo">
        <div className="footer-main-grid">
          {/* Brand Block */}
          <div className="footer-brand-col">
            <BrandMark />
            <p className="footer-tagline">career<b>/</b>ai</p>
            <p className="footer-subtext">
              Evidence-led preparation for your next chapter. We show what is known, what is still unassessed, and what to do next.
            </p>
          </div>

          {/* Navigation Group */}
          <div>
            <h3 className="footer-col-heading">Explore</h3>
            <ul className="footer-links-list">
              <li><Link to="/">Overview</Link></li>
              <li><Link to="/paths">Paths</Link></li>
              <li><Link to="/assessment">Assessment</Link></li>
              <li><Link to="/roadmap">Roadmap</Link></li>
              <li><Link to="/practice">Practice</Link></li>
              <li><Link to="/resume">Resume Lab</Link></li>
            </ul>
          </div>

          {/* Trust & Privacy Group */}
          <div>
            <h3 className="footer-col-heading">Trust &amp; Privacy</h3>
            <ul className="footer-links-list">
              <li><Link to="/settings">Settings</Link></li>
              <li><Link to="/settings#privacy">How we use your data</Link></li>
              <li><Link to="/terms">Terms of Use</Link></li>
              <li><Link to="/privacy">Privacy &amp; Data</Link></li>
              <li><Link to="/ai-safety">AI Safety</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Row: Disclaimer + Copyright */}
        <div className="footer-bottom-row">
          <p className="footer-disclaimer">
            CareerAI provides learning and preparation guidance. It does not guarantee admission, employment, salary, placement or ATS screening results. All recommendations are evidence-based estimates, not predictions or verdicts.
          </p>
          <span className="footer-copyright">© 2026 CareerAI. Built for clearer next steps.</span>
        </div>
      </footer>

      {/* Global Toast */}
      <Toast message={toastMessage} />
    </div>
  );
};
