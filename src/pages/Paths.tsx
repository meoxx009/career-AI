import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCareer } from '../context/CareerContext';
import {
  DisplayHeading,
  Eyebrow,
  PrimaryButton,
  SecondaryButton,
  DarkCard,
  CottonCard,
  StatusBadge,
  ScoreMeter,
  ProgressPill,
} from '../components/DesignSystem';
import {
  Info,
  SlidersHorizontal,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  ArrowRight,
} from 'lucide-react';
import { LearnerContextIntake } from '../components/LearnerContextIntake';
import { generatePathRecommendations } from '../lib/pathRecommendations';
import { BranchingPathTree } from '../components/BranchingPathTree';
import { SEED_ROLES, SEED_ROLE_SKILL_REQUIREMENTS, SKILLS_BY_ID } from '../data/seedData';
import { buildRoleExplanation } from '../lib/scoring';
import type { UserProfile } from '../types';

export const Paths: React.FC = () => {
  const navigate = useNavigate();
  const {
    profile,
    updateProfile,
    saveProfile,
    skillObservations,
    selectedRoleId,
    setSelectedRoleId,
    showToast,
  } = useCareer();

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [draftProfile, setDraftProfile] = useState<UserProfile>(profile);

  const handleToggleEditor = () => {
    if (!isEditorOpen) {
      setDraftProfile({ ...profile });
    }
    setIsEditorOpen(!isEditorOpen);
  };

  const handleDraftChange = (updates: Partial<UserProfile>) => {
    setDraftProfile(prev => ({ ...prev, ...updates }));
  };

  const handleApplyDraft = () => {
    let hours = Number(draftProfile.hoursPerWeek) || 8;
    if (hours < 1) hours = 1;
    if (hours > 40) hours = 40;

    const validated: UserProfile = {
      ...draftProfile,
      hoursPerWeek: hours,
    };

    updateProfile(validated);
    saveProfile(validated);
    setIsEditorOpen(false);
    showToast('Applied updated profile & interests. Directions recalculated.');
  };

  // Generate deterministic personalized path recommendations from applied profile
  const recResult = generatePathRecommendations(profile);
  const isSchool = recResult.isSchoolLearner;

  const obsMap = useMemo(() => {
    const map = new Map<number | string, number | null>();
    Object.entries(skillObservations).forEach(([sId, val]) => {
      map.set(Number(sId), val);
    });
    return map;
  }, [skillObservations]);

  return (
    <div style={{ maxWidth: '1120px', margin: '0 auto' }}>
      {/* Page Header */}
      <header style={{ marginBottom: '32px' }}>
        <Eyebrow text="ROLE BENCHMARKING / DETERMINISTIC COMPARISON" />
        <DisplayHeading level={1}>CAREER PATH COMPARISON</DisplayHeading>
        <p className="muted-light" style={{ maxWidth: '760px', marginTop: '14px', fontSize: '1rem', lineHeight: 1.5 }}>
          Explore paths tailored for Class 10/12 school streams, college degrees, and self-taught learners.
          We provide transparent curriculum guidance without degree bias or job guarantees.
        </p>
        <div style={{ marginTop: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => navigate('/paths/builder')}
            className="button button-primary"
            style={{ fontSize: '0.85rem', padding: '10px 18px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <BookOpen size={16} aria-hidden="true" />
            <span>Launch Unified Path Builder (33 Careers) →</span>
          </button>
        </div>
      </header>

      {/* Learner Context & Personalization Banner */}
      <DarkCard style={{ marginBottom: '36px', padding: '24px 28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-cotton)' }}>
                CURRENT CONTEXT
              </span>
              <StatusBadge variant="tangerine" label={recResult.stageLabel} />
              {isSchool && profile.stream && (
                <StatusBadge variant="dark" label={`Stream: ${profile.stream.toUpperCase()}`} />
              )}
              {!isSchool && profile.degree && (
                <StatusBadge variant="dark" label={profile.degree} />
              )}
              <span style={{ fontSize: '0.78rem', color: 'var(--color-muted-light)' }}>
                ~{profile.hoursPerWeek || 8} hrs/week
              </span>
            </div>
            <p className="muted-light" style={{ margin: 0, fontSize: '0.86rem' }}>
              Suggestions below are calibrated to this profile. You can adjust your stage, stream, or interests at any time.
            </p>
          </div>

          <button
            type="button"
            onClick={handleToggleEditor}
            className="button button-secondary"
            style={{ fontSize: '0.8rem', padding: '8px 16px', minHeight: '36px' }}
          >
            <SlidersHorizontal size={14} aria-hidden="true" style={{ marginRight: '6px' }} />
            <span>{isEditorOpen ? 'Close Profile Editor' : 'Customize Profile & Interests'}</span>
          </button>
        </div>

        {/* Expandable Reusable Intake Component with Local Draft State */}
        {isEditorOpen && (
          <div
            style={{
              marginTop: '24px',
              paddingTop: '24px',
              borderTop: '1px solid var(--color-line-dark)',
            }}
          >
            <LearnerContextIntake
              profile={draftProfile}
              onChange={handleDraftChange}
              mode="all"
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <SecondaryButton
                onClick={() => {
                  setDraftProfile(profile);
                  setIsEditorOpen(false);
                }}
                style={{ fontSize: '0.8rem', padding: '8px 16px' }}
              >
                Cancel
              </SecondaryButton>
              <PrimaryButton onClick={handleApplyDraft} style={{ fontSize: '0.8rem', padding: '8px 18px' }}>
                Apply &amp; View Updated Directions ↗
              </PrimaryButton>
            </div>
          </div>
        )}
      </DarkCard>

      {/* Stream-Aligned Opportunities (for School Learners) */}
      {recResult.streamOpportunity && (
        <CottonCard style={{ marginBottom: '36px', padding: '28px 32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <BookOpen size={18} color="var(--color-ink)" aria-hidden="true" />
            <Eyebrow text={`STREAM-ALIGNED OPPORTUNITY GROUPS / ${recResult.streamOpportunity.streamName.toUpperCase()}`} />
          </div>

          <h2 style={{ margin: '0 0 10px', fontSize: '1.4rem', color: 'var(--color-ink)' }}>
            Future Opportunities for {recResult.streamOpportunity.streamName}
          </h2>

          <p style={{ margin: '0 0 16px', fontSize: '0.88rem', color: 'var(--color-muted-dark)', lineHeight: 1.5, maxWidth: '800px' }}>
            {recResult.streamOpportunity.description}
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
            {recResult.streamOpportunity.opportunityDirections?.map((dir, idx) => (
              <span
                key={idx}
                style={{
                  padding: '6px 14px',
                  background: 'rgba(34, 34, 34, 0.08)',
                  border: '1px solid rgba(34, 34, 34, 0.15)',
                  borderRadius: 'var(--radius-pill)',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: 'var(--color-ink)',
                }}
              >
                {dir}
              </span>
            ))}
          </div>

          <div
            style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(34, 34, 34, 0.04)',
              fontSize: '0.78rem',
              color: 'var(--color-muted-dark)',
              lineHeight: 1.45,
            }}
          >
            <strong>Official Verification Note: </strong>
            {recResult.streamOpportunity.verificationNote}
          </div>
        </CottonCard>
      )}

      {/* Concise Top-to-Bottom Animated Branching Path Visualization */}
      <BranchingPathTree
        profile={profile}
        recommendations={recResult.recommendations}
        selectedRoleId={selectedRoleId}
        skillObservations={skillObservations}
        onActivateRole={(roleId, roleTitle) => {
          setSelectedRoleId(roleId);
          updateProfile({ targetRoleId: roleId });
          saveProfile({ targetRoleId: roleId });
          showToast(`Active roadmap direction set to ${roleTitle}.`);
        }}
      />

      {/* Preloaded Starter Paths (Always Present Below Recommendations) */}
      <section style={{ marginBottom: '40px' }} aria-labelledby="starter-paths-heading">
        <header style={{ marginBottom: '20px' }}>
          <Eyebrow text="FOUNDATIONAL BENCHMARKS / ENTRY ROLES" />
          <h2 id="starter-paths-heading" style={{ fontSize: '1.6rem', color: 'var(--color-linen)', margin: '0 0 8px' }}>
            Starter paths — available to explore before assessment
          </h2>
          <p className="muted-light" style={{ margin: 0, fontSize: '0.9rem' }}>
            {isSchool
              ? 'Foundational reference careers mapped for early exploration. Full readiness requires completing core curriculum.'
              : 'Deterministic readiness based on your answers so far. Click Explore Plan to view milestone sequence.'}
          </p>
        </header>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
            gap: '24px',
          }}
        >
          {SEED_ROLES.map((role) => {
            const isSelected = selectedRoleId === role.id;
            const assessment = buildRoleExplanation(role, SEED_ROLE_SKILL_REQUIREMENTS, obsMap);
            const isConfident = assessment.state === 'confident';

            return (
              <DarkCard
                key={role.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  border: isSelected ? '1px solid var(--color-tangerine)' : '1px solid var(--color-line-dark)',
                  background: isSelected ? 'rgba(255, 109, 31, 0.04)' : undefined,
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)', color: 'var(--color-cotton)' }}>
                      SEED #{role.id} · {role.level.toUpperCase()}
                    </span>
                    {isSelected && (
                      <span
                        style={{
                          fontSize: '0.70rem',
                          background: 'rgba(255, 109, 31, 0.15)',
                          color: 'var(--color-tangerine)',
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-pill)',
                          border: '1px solid var(--color-tangerine)',
                          fontWeight: 700,
                        }}
                      >
                        Target
                      </span>
                    )}
                  </div>

                  <h3 style={{ fontSize: '1.6rem', lineHeight: 1.25, color: 'var(--color-linen)', margin: '0 0 10px' }}>
                    {role.name}
                  </h3>
                  <p className="muted-light" style={{ fontSize: '0.86rem', lineHeight: 1.45, margin: '0 0 20px' }}>
                    {role.description}
                  </p>

                  <div
                    style={{
                      padding: '16px 20px',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--color-black-soft)',
                      border: '1px solid var(--color-line-dark)',
                      marginBottom: '20px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
                      <div>
                        {isConfident ? (
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                            <span style={{ fontSize: '2.2rem', fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--color-linen)' }}>
                              {assessment.alignment}
                            </span>
                            <span style={{ fontSize: '1rem', color: 'var(--color-cotton)' }}>%</span>
                            <span style={{ fontSize: '0.74rem', color: 'var(--color-muted-light)', marginLeft: '6px' }}>
                              assessed alignment
                            </span>
                          </div>
                        ) : (
                          <div>
                            <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-cotton)' }}>
                              More evidence needed
                            </span>
                            <p style={{ margin: '4px 0 0', fontSize: '0.74rem', color: 'var(--color-muted-light)' }}>
                              {assessment.coverage.coveragePercent < 60
                                ? `Coverage (${assessment.coverage.coveragePercent}%) is below 60% threshold.`
                                : 'Take diagnostic to evaluate.'}
                            </p>
                          </div>
                        )}
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <span
                          style={{
                            fontSize: '0.74rem',
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 700,
                            color: assessment.coverage.isSufficient ? 'var(--color-success)' : 'var(--color-cotton)',
                          }}
                        >
                          COVERAGE {assessment.coverage.coveragePercent}%
                        </span>
                      </div>
                    </div>

                    <ScoreMeter score={assessment.coverage.coveragePercent} />
                  </div>

                  <div style={{ display: 'grid', gap: '10px', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem' }}>
                      <CheckCircle2 size={13} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
                      <span style={{ color: 'var(--color-linen)' }}>
                        <strong>{assessment.evidenceUsed.length}</strong> competencies evidenced
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem' }}>
                      <AlertTriangle size={13} style={{ color: 'var(--color-tangerine)', flexShrink: 0 }} />
                      <span style={{ color: 'var(--color-linen)' }}>
                        <strong>{assessment.prioritizedGaps.length}</strong> known gaps to close
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem' }}>
                      <HelpCircle size={13} style={{ color: 'var(--color-cotton)', flexShrink: 0 }} />
                      <span style={{ color: 'var(--color-muted-light)' }}>
                        <strong>{assessment.unknowns.length}</strong> requirements unassessed
                      </span>
                    </div>
                  </div>

                  {assessment.prioritizedGaps.length > 0 && (
                    <div
                      style={{
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(255, 109, 31, 0.06)',
                        border: '1px solid rgba(255, 109, 31, 0.25)',
                        marginBottom: '20px',
                      }}
                    >
                      <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--color-tangerine)', fontWeight: 700 }}>
                        FIRST NEXT STEP:
                      </span>
                      <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: 'var(--color-linen)', lineHeight: 1.4 }}>
                        {SKILLS_BY_ID.get(Number(assessment.prioritizedGaps[0].skillId))?.name || 'Skill'}:{' '}
                        {assessment.prioritizedGaps[0].rationale || 'Address foundational prerequisite.'}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                    <span className="source-label">{assessment.source} · {assessment.version}</span>
                    <ProgressPill label={isConfident ? 'Confidence: High' : 'Needs Evidence'} />
                  </div>

                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => navigate(`/paths/${role.slug}`)}
                      className="button button-primary"
                      style={{ flex: 1, padding: '10px 16px', fontSize: '0.84rem' }}
                    >
                      <span>Explore plan</span>
                      <ArrowRight size={14} aria-hidden="true" />
                    </button>

                    {!isSelected && (
                      <SecondaryButton
                        onClick={() => {
                          setSelectedRoleId(role.id);
                          showToast(`Selected ${role.name} as benchmark target.`);
                        }}
                        style={{ padding: '10px 14px', fontSize: '0.8rem' }}
                      >
                        Set Active
                      </SecondaryButton>
                    )}
                  </div>
                </div>
              </DarkCard>
            );
          })}
        </div>
      </section>

      {/* Bottom Trust Contract & Transparency Note */}
      <CottonCard style={{ padding: '24px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
          <Info size={18} style={{ color: 'var(--color-tangerine-deep)', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <h3 style={{ margin: '0 0 6px', fontSize: '0.96rem', color: 'var(--color-ink)' }}>
              Transparent Scoring Boundary &amp; Privacy Rule
            </h3>
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--color-ink)', lineHeight: 1.45 }}>
              All recommendations are guidance suggestions and structured exploration plans, never guaranteed admissions or hiring outcomes.
              Missing diagnostic answers are recorded as unassessed unknowns, never penalized as 0%.
              We do not scrape live job postings, predict hiring probabilities, or invent salary figures.
            </p>
          </div>
        </div>
      </CottonCard>
    </div>
  );
};
