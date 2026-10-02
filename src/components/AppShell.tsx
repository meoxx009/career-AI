import React from 'react';
import { NavLink } from 'react-router-dom';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  return (
    <div className="app-container">
      {/* Background ambient lighting */}
      <div className="ambient ambient-top" aria-hidden="true" />
      <div className="ambient ambient-bottom" aria-hidden="true" />

      {/* Accessible Header */}
      <header className="site-header shell" role="banner">
        <NavLink to="/" className="brand" aria-label="CareerAI home">
          <span>career</span>
          <b>/</b>
          <span>ai</span>
        </NavLink>

        <nav className="top-nav" aria-label="Primary navigation">
          <NavLink
            to="/"
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            Overview
          </NavLink>
          <a href="#paths">Your paths</a>
          <a href="#roadmap">Roadmap</a>
          <a href="#practice">Practice</a>
        </nav>

        <button
          className="header-button"
          type="button"
          onClick={() => {
            const el = document.getElementById('shell-content');
            el?.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          Explore demo <span aria-hidden="true">↗</span>
        </button>
      </header>

      {/* Main Landmark */}
      <main id="shell-content" className="shell" role="main" style={{ minHeight: 'calc(100vh - 180px)', padding: '40px 0' }}>
        {children}
      </main>

      {/* Accessible Footer */}
      <footer className="shell" role="contentinfo" style={{ borderTop: '1px solid var(--c-line-dark)', padding: '30px 0', fontSize: '0.75rem', color: 'var(--c-muted-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <strong>CareerAI</strong> — Deterministic Career Preparation Platform
        </div>
        <div style={{ fontFamily: 'monospace' }}>
          Phase 1 Scaffold · Strict TypeScript · WCAG AA
        </div>
      </footer>
    </div>
  );
};
