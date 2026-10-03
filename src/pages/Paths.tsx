import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCareer } from '../context/CareerContext';
import {
  SEED_ROLES,
  SEED_ROLE_SKILL_REQUIREMENTS,
  SKILLS_BY_ID,
} from '../data/seedData';
import {
  buildRoleExplanation,
  sortRoleAssessments,
} from '../lib/scoring';
import {
  DisplayHeading,
  Eyebrow,
  PrimaryButton,
  SecondaryButton,
  DarkCard,
  CottonCard,
  ScoreMeter,
  StatusBadge,
  ProgressPill,
} from '../components/DesignSystem';
import {
  ArrowRight,
  Info,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  SlidersHorizontal,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { LearnerContextIntake } from '../components/LearnerContextIntake';
import { generatePathRecommendations } from '../lib/pathRecommendations';
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

  // Create lookup map of skill observations
  const obsMap = new Map<number | string, number | null>();
  Object.entries(skillObservations).forEach(([sId, val]) => {
    obsMap.set(Number(sId), val);
  });

  // Build rich deterministic assessment for each seed role
  const roleAssessments = SEED_ROLES.map(role =>
    buildRoleExplanation(role, SEED_ROLE_SKILL_REQUIREMENTS, obsMap)
  );

  // Sort: selected first, then confident by alignment, then coverage
  const sortedAssessments = sortRoleAssessments(roleAssessments).sort((a, b) => {
    const aSelected = Number(a.roleId) === selectedRoleId;
    const bSelected = Number(b.roleId) === selectedRoleId;
    if (aSelected && !bSelected) return -1;
    if (!aSelected && bSelected) return 1;
    return 0;
  });

  const handleSelectRole = (roleId: number, roleName: string) => {
    setSelectedRoleId(roleId);
    showToast(`Active path set to ${roleName}.`);
  };

  const handleProfileChange = (updates: Partial<UserProfile>) => {
    updateProfile(updates);
    saveProfile(updates);
  };

  // Generate deterministic personalized path recommendations
  const recResult = generatePathRecommendations(profile);
  const isSchool = recResult.isSchoolLearner;

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
            onClick={() => setIsEditorOpen(!isEditorOpen)}
            className="button button-secondary"
            style={{ fontSize: '0.8rem', padding: '8px 16px', minHeight: '36px' }}
          >
            <SlidersHorizontal size={14} aria-hidden="true" style={{ marginRight: '6px' }} />
            <span>{isEditorOpen ? 'Close Profile Editor' : 'Customize Profile & Interests'}</span>
          </button>
        </div>

        {/* Expandable Reusable Intake Component */}
        {isEditorOpen && (
          <div
            style={{
              marginTop: '24px',
              paddingTop: '24px',
              borderTop: '1px solid var(--color-line-dark)',
            }}
          >
            <LearnerContextIntake
              profile={profile}
              onChange={handleProfileChange}
              mode="all"
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <PrimaryButton onClick={() => setIsEditorOpen(false)} style={{ fontSize: '0.8rem', padding: '8px 18px' }}>
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
            {recResult.streamOpportunity.opportunityDirections.map((dir, idx) => (
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

      {/* Personalized Path Recommendations Section */}
      <section style={{ marginBottom: '48px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <Sparkles size={18} color="var(--color-tangerine)" aria-hidden="true" />
          <Eyebrow text="PERSONALIZED PATH SUGGESTIONS" />
        </div>
        <h2 style={{ fontSize: '1.6rem', color: 'var(--color-linen)', margin: '0 0 8px' }}>
          Suggested Directions for You
        </h2>
        <p className="muted-light" style={{ maxWidth: '720px', margin: '0 0 24px', fontSize: '0.9rem', lineHeight: 1.5 }}>
          Generated deterministically from your stage, stream, interests, and stated hours.
          Eligibility varies by institution and programme.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
            gap: '20px',
          }}
        >
          {recResult.recommendations.map(rec => (
            <DarkCard
              key={rec.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '28px',
                border: '1px solid var(--color-line-dark)',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <StatusBadge variant="tangerine" label={rec.badge} />
                  {rec.alignedRoleId && (
                    <span style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)', color: 'var(--color-cotton)' }}>
                      SEED #{rec.alignedRoleId}
                    </span>
                  )}
                </div>

                <h3 style={{ fontSize: '1.25rem', color: 'var(--color-linen)', margin: '0 0 10px', lineHeight: 1.3 }}>
                  {rec.title}
                </h3>

                <p style={{ margin: '0 0 16px', fontSize: '0.84rem', color: 'var(--color-muted-light)', lineHeight: 1.5 }}>
                  <strong>Why suggested:</strong> {rec.whySuggested}
                </p>

                <div
                  style={{
                    background: 'var(--color-black-soft)',
                    border: '1px solid var(--color-line-dark)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '12px 14px',
                    fontSize: '0.78rem',
                    color: 'var(--color-cotton)',
                    display: 'grid',
                    gap: '6px',
                    marginBottom: '16px',
                  }}
                >
                  <div><strong>Inputs evaluated:</strong> {(rec.inputsEvaluated || rec.contributingInputs || []).join(' · ')}</div>
                  {rec.requirementsEvaluated && rec.requirementsEvaluated.length > 0 && (
                    <div><strong>Requirements evaluated:</strong> {rec.requirementsEvaluated.join(' · ')}</div>
                  )}
                  <div>
                    <strong>Evidence found:</strong>{' '}
                    {rec.evidenceFound && rec.evidenceFound.length > 0 && !rec.evidenceFound.every(e => e.includes('No prior coursework') || e.includes('No verified skill'))
                      ? rec.evidenceFound.join(' · ')
                      : 'No verified skill evidence supplied yet.'}
                  </div>
                  <div>
                    <strong>Still unknown:</strong>{' '}
                    {(rec.stillUnknown || rec.unknowns || []).length > 0
                      ? (rec.stillUnknown || rec.unknowns || []).map(u => u.replace(/Confirmed gap/gi, 'Not assessed yet')).join(' · ')
                      : 'Not assessed yet'}
                  </div>
                  <div>
                    <strong>Prerequisites:</strong>{' '}
                    {(rec.prerequisiteSkills || rec.prerequisites || []).length > 0
                      ? (rec.prerequisiteSkills || rec.prerequisites || []).join(', ')
                      : 'None'}
                  </div>
                </div>

                {/* Estimated Curriculum Preview */}
                <div style={{ marginBottom: '16px' }}>
                  <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-tangerine)', textTransform: 'uppercase' }}>
                    Estimated Curriculum Path
                  </span>
                  <ul style={{ margin: '6px 0 0', paddingLeft: '18px', fontSize: '0.78rem', color: 'var(--color-muted-light)', lineHeight: 1.45 }}>
                    {(rec.estimatedCurriculum || []).map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>

                {/* Next Action */}
                <div style={{ marginBottom: '14px', fontSize: '0.8rem', color: 'var(--color-linen)' }}>
                  <strong style={{ color: 'var(--color-tangerine)' }}>Next Action: </strong>
                  {rec.nextAction}
                </div>
              </div>

              <div>
                <p style={{ fontSize: '0.72rem', color: 'var(--color-muted-dark)', margin: '0 0 14px', lineHeight: 1.4, fontStyle: 'italic' }}>
                  {rec.disclaimer}
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {rec.canExplore && (rec.exploreHref || rec.cataloguePathSlug || rec.catalogueSlug) ? (
                    <button
                      type="button"
                      onClick={() => {
                        const slug = rec.cataloguePathSlug || rec.catalogueSlug;
                        const pathId = rec.cataloguePathId || rec.alignedRoleId;
                        if (pathId) {
                          setSelectedRoleId(pathId);
                        }
                        navigate(rec.exploreHref || `/paths/${slug}`);
                      }}
                      className="button button-primary"
                      style={{ width: '100%', padding: '10px 14px', fontSize: '0.82rem' }}
                    >
                      <span>Explore this curriculum roadmap</span>
                      <ArrowRight size={14} aria-hidden="true" />
                    </button>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '6px 0' }}>
                      <p style={{ margin: '0 0 6px', fontSize: '0.78rem', color: 'var(--color-cotton)' }}>
                        Curriculum content pending review
                      </p>
                      <button
                        type="button"
                        onClick={() => navigate('/paths/builder')}
                        className="button button-secondary"
                        style={{ width: '100%', padding: '8px 12px', fontSize: '0.78rem' }}
                      >
                        <span>Explore in Path Builder ↗</span>
                      </button>
                    </div>
                  )}

                  {/* Secondary Action: Diagnostic Assessment — Never replaces Explore */}
                  <button
                    type="button"
                    onClick={() => navigate('/assessment')}
                    className="button button-secondary"
                    style={{ width: '100%', padding: '8px 14px', fontSize: '0.78rem' }}
                  >
                    <span>Take diagnostic assessment</span>
                    <ArrowRight size={14} aria-hidden="true" />
                  </button>
                </div>
              </div>
            </DarkCard>
          ))}
        </div>
      </section>

      {/* Preloaded Starter Paths (Always Present Below Recommendations) */}
      <section style={{ marginBottom: '40px' }}>
        <header style={{ marginBottom: '20px' }}>
          <Eyebrow text="FOUNDATIONAL BENCHMARKS / ENTRY ROLES" />
          <h2 style={{ fontSize: '1.6rem', color: 'var(--color-linen)', margin: '0 0 8px' }}>
            Starter paths — available to explore before assessment.
          </h2>
          {isSchool ? (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(255, 109, 31, 0.08)',
                border: '1px solid rgba(255, 109, 31, 0.25)',
                fontSize: '0.82rem',
                color: 'var(--color-cotton)',
                marginBottom: '16px',
              }}
            >
              <strong>School Learner Notice: </strong>
              You can begin foundation preparation now. Role readiness is not being claimed.
            </div>
          ) : (
            <p className="muted-light" style={{ maxWidth: '720px', margin: 0, fontSize: '0.9rem', lineHeight: 1.5 }}>
              Compare entry-level directions against your verified diagnostic observations.
              Assessed alignment is only calculated when your evidence covers at least 60% of role requirements.
            </p>
          )}
        </header>

        {/* Three Directions Cards Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
            gap: '24px',
            marginBottom: '40px',
          }}
        >
          {sortedAssessments.map((assessment, index) => {
            const roleId = Number(assessment.roleId);
            const role = SEED_ROLES.find(r => r.id === roleId)!;
            const isSelected = selectedRoleId === roleId;
            const isConfident = assessment.state === 'confident';

            return (
              <DarkCard
                key={role.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '32px',
                  border: isSelected
                    ? '1px solid var(--color-tangerine)'
                    : '1px solid var(--color-line-dark)',
                  background: isSelected
                    ? 'linear-gradient(180deg, rgba(255, 109, 31, 0.08) 0%, var(--color-black-hole) 100%)'
                    : 'var(--color-black-hole)',
                  position: 'relative',
                }}
              >
                <div>
                  {/* Card Topline */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <span style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: 'var(--color-cotton)' }}>
                      0{index + 1} / {role.level.toUpperCase()}
                    </span>
                    {isSelected && (
                      <StatusBadge variant="tangerine" label="Active Target" />
                    )}
                  </div>

                  {/* Role Title */}
                  <h3 style={{ fontSize: '1.6rem', lineHeight: 1.25, color: 'var(--color-linen)', margin: '0 0 10px' }}>
                    {role.name}
                  </h3>
                  <p className="muted-light" style={{ fontSize: '0.86rem', lineHeight: 1.45, margin: '0 0 20px' }}>
                    {role.description}
                  </p>

                  {/* Score & Coverage Block */}
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

                  {/* Evidence & Gaps Summary */}
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

                  {/* Priority Gap Callout if available */}
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

                {/* Card Footer Actions & Source Label */}
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
                        onClick={() => handleSelectRole(role.id, role.name)}
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
