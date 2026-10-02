import React from 'react';
import { NavLink } from 'react-router-dom';
import { BrandMark, Toast } from './DesignSystem';

interface AppShellProps {
  children: React.ReactNode;
  toastMessage?: string | null;
}

export const AppShell: React.FC<AppShellProps> = ({ children, toastMessage = null }) => {
  return (
    <div className="app-container">
      {/* Background ambient lighting blooms */}
      <div className="ambient ambient-top" aria-hidden="true" />
      <div className="ambient ambient-bottom" aria-hidden="true" />

      {/* Accessible Global Header */}
      <header className="site-header shell" role="banner">
        <NavLink to="/" aria-label="CareerAI home">
          <BrandMark />
        </NavLink>

        <nav className="top-nav" aria-label="Primary navigation">
          <NavLink
            to="/"
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            Overview
          </NavLink>
          <NavLink
            to="/design-system"
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            Design System
          </NavLink>
          <a href="#paths">Your paths</a>
          <a href="#roadmap">Roadmap</a>
          <a href="#practice">Practice</a>
        </nav>

        <button
          className="header-button"
          type="button"
          onClick={() => {
            const el = document.getElementById('top');
            el?.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          Explore demo <span aria-hidden="true">↗</span>
        </button>
      </header>

      {/* Main Landmark Shell */}
      <main id="top" className="shell" role="main" style={{ minHeight: 'calc(100vh - 180px)', padding: '50px 0' }}>
        {children}
      </main>

      {/* Accessible Footer */}
      <footer
        className="shell"
        role="contentinfo"
        style={{
          borderTop: '1px solid var(--color-line-dark)',
          padding: '36px 0',
          fontSize: '0.78rem',
          color: 'var(--color-muted-light)',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '16px',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <strong style={{ color: 'var(--color-linen)' }}>CareerAI</strong> — Transparent Student Preparation Platform
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>
          Sustainable Linen · Recycled Cotton · Electric Tangerine · WCAG AA
        </div>
      </footer>

      {/* Global Toast */}
      <Toast message={toastMessage} />
    </div>
  );
};
