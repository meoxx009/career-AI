import React, { useState } from 'react';
import {
  BrandMark,
  PrimaryButton,
  SecondaryButton,
  TextButton,
  DisplayHeading,
  Eyebrow,
  BentoCard,
  DarkCard,
  LinenCard,
  CottonCard,
  StatusBadge,
  ProgressPill,
  SourceLabel,
  ScoreMeter,
  ScoreRing,
  EmptyState,
  LoadingState,
  ErrorState,
} from '../components/DesignSystem';
import { ArrowRight, Check, Compass, ShieldCheck, Sparkles } from 'lucide-react';

export const DesignSystemShowcase: React.FC<{ onTriggerToast?: (msg: string) => void }> = ({
  onTriggerToast,
}) => {
  const [meterValue, setMeterValue] = useState(78);

  const handleToastClick = () => {
    onTriggerToast?.('Interactive Design System Toast · Auto-dismisses in 2.6s');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '64px', maxWidth: '1000px', margin: '0 auto' }}>
      {/* 1. Header & Title */}
      <div>
        <Eyebrow tangerine>DESIGN SYSTEM SHOWCASE / GATE 02</Eyebrow>
        <DisplayHeading level={1}>
          PRODUCTION<br />
          <em style={{ color: 'var(--color-tangerine)', fontStyle: 'normal' }}>FOUNDATION.</em>
        </DisplayHeading>
        <p className="muted-light" style={{ fontSize: '1.05rem', maxWidth: '640px', marginTop: '12px' }}>
          Exact verification screen for all CareerAI visual tokens and accessible components across dark canvas, Sustainable Linen, and Recycled Cotton surfaces.
        </p>
        <div style={{ marginTop: '20px', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-muted-light)' }}>Rendered BrandMark:</span>
          <BrandMark />
        </div>
      </div>

      {/* 2. Interactive Buttons */}
      <div>
        <Eyebrow>01 / BUTTON PRIMITIVES</Eyebrow>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
          <PrimaryButton onClick={handleToastClick} icon={<ArrowRight size={16} />}>
            Primary CTA (Tangerine)
          </PrimaryButton>

          <SecondaryButton onClick={handleToastClick} icon={<Compass size={16} />}>
            Secondary Button
          </SecondaryButton>

          <button className="button button-quiet" type="button" onClick={handleToastClick}>
            Quiet Outline Button
          </button>

          <TextButton onClick={handleToastClick} icon={<Sparkles size={14} />}>
            Text Action Link
          </TextButton>

          <PrimaryButton disabled>
            Disabled State
          </PrimaryButton>
        </div>
      </div>

      {/* 3. Surface Contrast Cards */}
      <div>
        <Eyebrow>02 / SURFACE CONTRAST MATRIX</Eyebrow>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          {/* Sustainable Linen */}
          <LinenCard>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span className="eyebrow" style={{ color: 'var(--color-muted-dark)', margin: 0 }}>
                SUSTAINABLE LINEN #FAF3E1
              </span>
              <StatusBadge variant="dark">Dark Badge</StatusBadge>
            </div>
            <div style={{ fontSize: '4.5rem', fontFamily: 'var(--font-display)', lineHeight: '0.9', margin: '14px 0' }}>
              82<span style={{ fontSize: '1.5rem', fontFamily: 'var(--font-body)' }}>%</span>
            </div>
            <h4 style={{ margin: '0 0 8px', fontSize: '1.25rem', fontWeight: 800 }}>Assessed Alignment</h4>
            <p className="muted-dark" style={{ fontSize: '0.85rem' }}>
              Warm light surface for transparent reflection and evidence.
            </p>
            <div style={{ marginTop: '16px' }}>
              <ScoreMeter percentage={82} />
            </div>
          </LinenCard>

          {/* Recycled Cotton */}
          <CottonCard>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span className="eyebrow" style={{ color: 'var(--color-muted-dark)', margin: 0 }}>
                RECYCLED COTTON #F5E7C6
              </span>
              <StatusBadge variant="linen">Linen Badge</StatusBadge>
            </div>
            <div style={{ fontSize: '4.5rem', fontFamily: 'var(--font-display)', lineHeight: '0.9', margin: '14px 0' }}>
              74<span style={{ fontSize: '1.5rem', fontFamily: 'var(--font-body)' }}>%</span>
            </div>
            <h4 style={{ margin: '0 0 8px', fontSize: '1.25rem', fontWeight: 800 }}>Analytical Match</h4>
            <p className="muted-dark" style={{ fontSize: '0.85rem' }}>
              Secondary warm surface for prerequisite analysis and roadmaps.
            </p>
            <div style={{ marginTop: '16px' }}>
              <ScoreMeter percentage={74} />
            </div>
          </CottonCard>

          {/* Black Hole Surface */}
          <DarkCard>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span className="eyebrow" style={{ color: 'var(--color-tangerine)', margin: 0 }}>
                BLACK HOLE #222222
              </span>
              <ScoreRing active />
            </div>
            <h3 style={{ margin: '18px 0 10px', color: 'var(--color-linen)', fontStyle: 'italic' }}>
              Clarity feels better<br />
              <span style={{ color: 'var(--color-tangerine)' }}>when visible.</span>
            </h3>
            <p className="muted-light" style={{ fontSize: '0.85rem' }}>
              Dark focus card on near-black canvas.
            </p>
            <div style={{ marginTop: '22px' }}>
              <TextButton onClick={handleToastClick}>Add to roadmap ↗</TextButton>
            </div>
          </DarkCard>

          {/* Electric Tangerine Surface */}
          <BentoCard surface="featured">
            <span className="eyebrow" style={{ color: 'var(--color-ink)', opacity: 0.8 }}>
              ELECTRIC TANGERINE #FF6D1F
            </span>
            <div style={{ fontSize: '4.5rem', fontFamily: 'var(--font-display)', lineHeight: '0.9', margin: '14px 0', color: 'var(--color-ink)' }}>
              01
            </div>
            <h4 style={{ margin: '0 0 8px', fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-ink)' }}>
              Primary Focal Card
            </h4>
            <p style={{ color: 'var(--color-ink)', fontSize: '0.85rem', opacity: 0.9 }}>
              Used strictly as an intentional signal, never as a full-page background wash.
            </p>
          </BentoCard>
        </div>
      </div>

      {/* 4. Badges, Pills & Status Tokens */}
      <div>
        <Eyebrow>03 / BADGES, PILLS & METERS</Eyebrow>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
            <StatusBadge variant="tangerine" icon={<Sparkles size={12} />}>Tangerine Signal</StatusBadge>
            <StatusBadge variant="success" icon={<Check size={12} />}>Verified (Success)</StatusBadge>
            <StatusBadge variant="warning">Needs Evidence</StatusBadge>
            <StatusBadge variant="danger">Gap Flagged</StatusBadge>
            <StatusBadge variant="dark">Dark Badge</StatusBadge>
            <StatusBadge variant="linen">Linen Badge</StatusBadge>
            <StatusBadge variant="cotton">Cotton Badge</StatusBadge>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'center' }}>
            <ProgressPill current={1} total={3} label="Question Step" />
            <ProgressPill current={2} total={4} label="Milestone Week" />
            <SourceLabel source="Diagnostic" date="02 Oct 2026" version="Rubric v1.2" />
          </div>

          <div style={{ maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
              <span>Interactive Meter ({meterValue}%)</span>
              <button
                type="button"
                onClick={() => setMeterValue((prev) => (prev >= 100 ? 25 : prev + 25))}
                style={{ background: 'transparent', border: 'none', color: 'var(--color-tangerine)', cursor: 'pointer', padding: 0 }}
              >
                Step +25%
              </button>
            </div>
            <ScoreMeter percentage={meterValue} darkTrack />
          </div>
        </div>
      </div>

      {/* 5. State Handling Components */}
      <div>
        <Eyebrow>04 / UI STATE CONTAINERS (LOADING, EMPTY, ERROR)</Eyebrow>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          <LoadingState label="Computing deterministic rubric..." />

          <EmptyState
            title="No Prior Evidence Found"
            description="Complete the 18-question diagnostic to generate your first calibrated alignment score."
            action={
              <PrimaryButton onClick={handleToastClick} style={{ minHeight: '36px', padding: '8px 16px', fontSize: '0.75rem' }}>
                Start Diagnostic
              </PrimaryButton>
            }
          />

          <ErrorState
            title="Validation Boundary Notice"
            message="Input exceeded maximum character budget or contained unverified metrics."
            onRetry={handleToastClick}
          />
        </div>
      </div>

      {/* 6. Accessibility & Trust Checklist */}
      <div className="dark-card" style={{ borderLeft: '4px solid var(--color-tangerine)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <ShieldCheck color="var(--color-tangerine)" size={20} />
          <h4 style={{ margin: 0, fontSize: '1.1rem' }}>Gate 02 Verification Guarantee</h4>
        </div>
        <ul style={{ margin: '12px 0 0', paddingLeft: '20px', fontSize: '0.85rem', color: 'var(--color-muted-light)', lineHeight: '1.8' }}>
          <li>✓ High contrast WCAG AA: Cream on dark canvas and ink on linen/cotton.</li>
          <li>✓ No purple or blue brand accents; strictly void, linen, cotton, and electric tangerine.</li>
          <li>✓ Visible `:focus-visible` ring across all interactive controls.</li>
          <li>✓ No horizontal overflow at 360px mobile width.</li>
        </ul>
      </div>
    </div>
  );
};
