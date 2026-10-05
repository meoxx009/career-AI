import React, { useState } from 'react';
import type { CareerPath } from '../types';
import {
  Eyebrow,
  PrimaryButton,
  SecondaryButton,
  DarkCard,
  StatusBadge,
} from './DesignSystem';
import {
  Code2,
  Database,
  Palette,
  Compass,
  ArrowRight,
  Clock,
  Layers,
  Sparkles,
  Flame,
} from 'lucide-react';

export interface RolePreviewHeroProps {
  path: CareerPath;
  onViewRoadmap?: () => void;
  onTakeAssessment?: () => void;
  onChangeRole?: () => void;
}

export const RolePreviewHero: React.FC<RolePreviewHeroProps> = ({
  path,
  onViewRoadmap,
  onTakeAssessment,
  onChangeRole,
}) => {
  const [selectedPhaseIdx, setSelectedPhaseIdx] = useState<number>(0);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'software_engineering':
        return <Code2 size={16} aria-hidden="true" style={{ color: 'var(--color-tangerine)' }} />;
      case 'data_ai':
        return <Database size={16} aria-hidden="true" style={{ color: '#D4B996' }} />;
      case 'design_product':
        return <Palette size={16} aria-hidden="true" style={{ color: '#E8A87C' }} />;
      default:
        return <Compass size={16} aria-hidden="true" style={{ color: 'var(--color-cotton)' }} />;
    }
  };

  const activePhase = path.curriculum[selectedPhaseIdx] || path.curriculum[0];

  return (
    <DarkCard
      style={{
        padding: '32px',
        marginBottom: '36px',
        border: '1px solid var(--color-tangerine)',
        background: 'linear-gradient(180deg, rgba(255, 109, 31, 0.07) 0%, var(--color-black-hole) 100%)',
        position: 'relative',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.45), 0 0 24px rgba(255, 109, 31, 0.1)',
      }}
    >
      {/* Topline Badges & Category */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <StatusBadge variant="tangerine" label="ACTIVE TARGET ROLE" />
          <span
            style={{
              fontSize: '0.74rem',
              fontFamily: 'var(--font-mono)',
              padding: '3px 8px',
              borderRadius: 'var(--radius-pill)',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              color: 'var(--color-cotton)',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            {path.level.toUpperCase()} LEVEL
          </span>
          <span
            style={{
              fontSize: '0.74rem',
              color: 'var(--color-muted-light)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {getCategoryIcon(path.category)}
            <span>{path.category.replace('_', ' ').toUpperCase()}</span>
          </span>
        </div>

        {onChangeRole && (
          <button
            type="button"
            onClick={onChangeRole}
            className="button-text"
            style={{ fontSize: '0.78rem', color: 'var(--color-cotton)' }}
            aria-label={`Change current role ${path.title}`}
          >
            Change Target Role
          </button>
        )}
      </div>

      {/* Role Title & Description */}
      <div style={{ marginBottom: '24px' }}>
        <Eyebrow text={`VALIDATED PRODUCTION CAREER PATH #${path.numericId}`} />
        <h1 style={{ fontSize: '2.2rem', fontFamily: 'var(--font-display)', margin: '4px 0 10px', color: 'var(--color-linen)', letterSpacing: '0.04em' }}>
          {path.title}
        </h1>
        <p
          className="muted-light"
          style={{ maxWidth: '840px', fontSize: '1rem', lineHeight: 1.55, margin: 0 }}
        >
          {path.description}
        </p>
      </div>

      {/* Metrics Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
          marginBottom: '28px',
          padding: '16px',
          backgroundColor: 'rgba(0, 0, 0, 0.35)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-line-dark)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Clock size={18} color="var(--color-tangerine)" aria-hidden="true" />
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--color-cotton)', fontWeight: 700 }}>ESTIMATED EFFORT</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-linen)', fontFamily: 'var(--font-mono)' }}>
              ~{path.estimatedEffortHours} Hours
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Layers size={18} color="var(--color-cotton)" aria-hidden="true" />
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--color-cotton)', fontWeight: 700 }}>CURRICULUM PHASES</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-linen)', fontFamily: 'var(--font-mono)' }}>
              {path.curriculum.length} Structured Phases
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Sparkles size={18} color="var(--color-tangerine)" aria-hidden="true" />
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--color-cotton)', fontWeight: 700 }}>FIRST DELIVERABLE</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-linen)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Phase 1 Milestone
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Animated Phase Progression Strip */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <span
            style={{
              fontSize: '0.76rem',
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              color: 'var(--color-cotton)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            5-Phase Staged Curriculum Progression
          </span>
          <span style={{ fontSize: '0.74rem', color: 'var(--color-muted-light)' }}>
            Tap any phase to inspect milestones
          </span>
        </div>

        <div
          role="tablist"
          aria-label="Curriculum phases for selected role"
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${path.curriculum.length || 5}, minmax(0, 1fr))`,
            gap: '8px',
            marginBottom: '14px',
          }}
        >
          {path.curriculum.map((phase, pIdx) => {
            const isSelectedPhase = pIdx === selectedPhaseIdx;
            return (
              <button
                key={phase.id || pIdx}
                type="button"
                role="tab"
                aria-selected={isSelectedPhase}
                onClick={() => setSelectedPhaseIdx(pIdx)}
                style={{
                  padding: '10px 8px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: isSelectedPhase
                    ? 'rgba(255, 109, 31, 0.2)'
                    : 'rgba(255, 255, 255, 0.04)',
                  border: isSelectedPhase
                    ? '1px solid var(--color-tangerine)'
                    : '1px solid var(--color-line-dark)',
                  color: isSelectedPhase ? 'var(--color-linen)' : 'var(--color-muted-light)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                  outline: 'none',
                  minHeight: '48px',
                }}
              >
                <div
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    color: isSelectedPhase ? 'var(--color-tangerine)' : 'var(--color-cotton)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  PHASE 0{pIdx + 1}
                </div>
                <div
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    marginTop: '2px',
                  }}
                >
                  {phase.phase}
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Phase Detail Box */}
        {activePhase && (
          <div
            style={{
              padding: '16px 20px',
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              borderRadius: 'var(--radius-sm)',
              borderLeft: '3px solid var(--color-tangerine)',
              borderTop: '1px solid var(--color-line-dark)',
              borderRight: '1px solid var(--color-line-dark)',
              borderBottom: '1px solid var(--color-line-dark)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <strong style={{ fontSize: '0.94rem', color: 'var(--color-linen)' }}>
                Phase {selectedPhaseIdx + 1}: {activePhase.title}
              </strong>
              <span style={{ fontSize: '0.76rem', color: 'var(--color-tangerine)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                ~{activePhase.estimatedHours} Hours
              </span>
            </div>
            <p style={{ margin: '0 0 10px', fontSize: '0.84rem', color: 'var(--color-muted-light)', lineHeight: 1.5 }}>
              {activePhase.whyItMatters}
            </p>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-cotton)' }}>
              <strong style={{ color: 'var(--color-linen)' }}>Verified Deliverable: </strong>
              <span>{activePhase.deliverable}</span>
            </div>
          </div>
        )}
      </div>

      {/* First Project Deliverable Highlight */}
      <div
        style={{
          marginBottom: '24px',
          padding: '14px 18px',
          backgroundColor: 'rgba(255, 109, 31, 0.08)',
          borderRadius: 'var(--radius-sm)',
          border: '1px dashed rgba(255, 109, 31, 0.35)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <Flame size={15} color="var(--color-tangerine)" aria-hidden="true" />
          <span style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-tangerine)' }}>
            FIRST PRACTICAL DELIVERABLE TO BUILD
          </span>
        </div>
        <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--color-linen)', fontWeight: 600, lineHeight: 1.45 }}>
          {path.firstProjectDeliverable}
        </p>
      </div>

      {/* Core Competencies & Prerequisites */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <div>
          <span style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-cotton)', textTransform: 'uppercase' }}>
            Core Role Skills
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
            {path.coreSkills.map((skill, sIdx) => (
              <span
                key={sIdx}
                style={{
                  fontSize: '0.76rem',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-pill)',
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid var(--color-line-dark)',
                  color: 'var(--color-linen)',
                }}
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        <div>
          <span style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-cotton)', textTransform: 'uppercase' }}>
            Prerequisite Capabilities
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
            {path.prerequisiteSkills.map((skill, pIdx) => (
              <span
                key={pIdx}
                style={{
                  fontSize: '0.76rem',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-pill)',
                  backgroundColor: 'rgba(255, 109, 31, 0.08)',
                  border: '1px solid rgba(255, 109, 31, 0.2)',
                  color: 'var(--color-cotton)',
                }}
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
          alignItems: 'center',
          paddingTop: '20px',
          borderTop: '1px solid var(--color-line-dark)',
        }}
      >
        {onViewRoadmap && (
          <PrimaryButton
            onClick={onViewRoadmap}
            style={{ fontSize: '0.86rem', padding: '12px 22px', minHeight: '46px' }}
          >
            <span>View Custom Roadmap ({path.title})</span>
            <ArrowRight size={16} aria-hidden="true" />
          </PrimaryButton>
        )}

        {onTakeAssessment && (
          <SecondaryButton
            onClick={onTakeAssessment}
            style={{ fontSize: '0.86rem', padding: '12px 18px', minHeight: '46px' }}
          >
            <span>Take Diagnostic Assessment</span>
          </SecondaryButton>
        )}
      </div>
    </DarkCard>
  );
};
