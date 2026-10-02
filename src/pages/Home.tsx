import React from 'react';

export const Home: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '800px', margin: '0 auto' }}>
      <div>
        <p className="eyebrow">CAREERAI / PHASE 1 SCAFFOLD</p>
        <h1 style={{ fontSize: 'clamp(3.5rem, 8vw, 6.5rem)', color: 'var(--c-linen)', margin: '0 0 16px' }}>
          CLEAR DIRECTION.<br />
          <em style={{ color: 'var(--c-tangerine)', fontStyle: 'normal' }}>EVIDENCE FIRST.</em>
        </h1>
        <p style={{ color: 'var(--c-muted-light)', fontSize: '1.05rem', lineHeight: '1.6', maxWidth: '580px' }}>
          Welcome to the deterministic CareerAI application shell. Built with strict TypeScript, standard CSS variables, and zero fake statistics.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        <div className="linen-card">
          <p className="eyebrow" style={{ color: 'var(--c-muted-dark)' }}>ACTIVE ENVIRONMENT</p>
          <h3 style={{ margin: '0 0 8px', fontSize: '1.5rem', fontWeight: '700' }}>Phase 1 Complete</h3>
          <p style={{ color: 'var(--c-muted-dark)', fontSize: '0.88rem', lineHeight: '1.5' }}>
            Production-structured React 19 + TypeScript + Vite app shell configured with strict checks, ESLint, and Vitest.
          </p>
          <div style={{ marginTop: '16px', fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--c-muted-dark)' }}>
            ✓ Zero Tailwind · Pure CSS Variables
          </div>
        </div>

        <div className="dark-card">
          <p className="eyebrow" style={{ color: 'var(--c-tangerine)' }}>NEXT VERTICAL SLICE</p>
          <h3 style={{ margin: '0 0 8px', fontSize: '1.5rem', fontWeight: '700', color: 'var(--c-linen)' }}>Phase 2: Product Flow</h3>
          <p style={{ color: 'var(--c-muted-light)', fontSize: '0.88rem', lineHeight: '1.5' }}>
            Landing → Onboarding → 18-Question Diagnostic → Deterministic Role Comparison → Dashboard.
          </p>
          <div style={{ marginTop: '16px', fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--c-muted-light)' }}>
            ✓ Seed data & PRD formulas ready
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '10px' }}>
        <a className="button button-primary" href="/preview/index.html" target="_blank" rel="noreferrer">
          Open Visual Preview <span aria-hidden="true">↗</span>
        </a>
        <button
          className="button button-quiet"
          type="button"
          onClick={() => {
            alert('Deterministic flow initialization ready for Phase 2.');
          }}
        >
          Check Runtime Status
        </button>
      </div>
    </div>
  );
};
