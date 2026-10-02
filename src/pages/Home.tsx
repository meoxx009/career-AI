import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  DisplayHeading,
  Eyebrow,
  LinenCard,
  DarkCard,
  PrimaryButton,
  StatusBadge,
} from '../components/DesignSystem';
import { ArrowRight, Sparkles } from 'lucide-react';

interface HomeProps {
  onTriggerToast?: (message: string) => void;
}

export const Home: React.FC<HomeProps> = ({ onTriggerToast }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '36px', maxWidth: '840px', margin: '0 auto' }}>
      <div>
        <Eyebrow tangerine>CAREERAI / PHASE 1 & 2 FOUNDATION</Eyebrow>
        <DisplayHeading level={1}>
          CLEAR DIRECTION.<br />
          <em style={{ color: 'var(--color-tangerine)', fontStyle: 'normal' }}>EVIDENCE FIRST.</em>
        </DisplayHeading>
        <p className="muted-light" style={{ fontSize: '1.05rem', lineHeight: '1.6', maxWidth: '600px', marginTop: '12px' }}>
          Welcome to the deterministic CareerAI application. Built with strict TypeScript, standard CSS variables, and zero fake statistics.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        <LinenCard>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span className="eyebrow" style={{ color: 'var(--color-muted-dark)', margin: 0 }}>
              DESIGN FOUNDATION
            </span>
            <StatusBadge variant="dark">Gate 02</StatusBadge>
          </div>
          <h3 style={{ margin: '0 0 8px', fontSize: '1.4rem', fontWeight: 800 }}>Production Design System</h3>
          <p className="muted-dark" style={{ fontSize: '0.88rem', lineHeight: '1.5' }}>
            Reference visual tokens, accessible contrast, warm linen and cotton surfaces, and Bebas Neue / Manrope typography.
          </p>
          <div style={{ marginTop: '16px' }}>
            <NavLink to="/design-system" className="button button-primary" style={{ padding: '10px 18px', fontSize: '0.75rem' }}>
              Explore Design System <span aria-hidden="true">→</span>
            </NavLink>
          </div>
        </LinenCard>

        <DarkCard>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span className="eyebrow" style={{ color: 'var(--color-tangerine)', margin: 0 }}>
              DETERMINISTIC FLOW
            </span>
            <StatusBadge variant="tangerine">P0 Ready</StatusBadge>
          </div>
          <h3 style={{ margin: '0 0 8px', fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-linen)' }}>
            Next: Product Flow
          </h3>
          <p className="muted-light" style={{ fontSize: '0.88rem', lineHeight: '1.5' }}>
            Landing → Onboarding → 18-Question Diagnostic → Deterministic Role Comparison → Dashboard.
          </p>
          <div style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
            <PrimaryButton
              onClick={() => onTriggerToast?.('Synthetic Rahul demo path initialized.')}
              icon={<Sparkles size={14} />}
              style={{ padding: '10px 18px', fontSize: '0.75rem' }}
            >
              Test Notification
            </PrimaryButton>
          </div>
        </DarkCard>
      </div>

      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', marginTop: '10px' }}>
        <NavLink to="/design-system" className="button button-primary">
          View Component Showcase <ArrowRight size={16} />
        </NavLink>
        <a className="button button-quiet" href="/preview/index.html" target="_blank" rel="noreferrer">
          Open Visual Preview <span aria-hidden="true">↗</span>
        </a>
      </div>
    </div>
  );
};
