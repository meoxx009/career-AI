import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCareer } from '../context/CareerContext';
import {
  SEED_ROLE_SKILL_REQUIREMENTS,
  SKILLS_BY_ID,
} from '../data/seedData';
import {
  calculateRoleCoverage,
  calculateAssessedAlignment,
  calculateKnownGaps,
  prioritiseGaps,
  calculatePlanCompletion,
} from '../lib/scoring';
import {
  DisplayHeading,
  Eyebrow,
  PrimaryButton,
  SecondaryButton,
  DarkCard,
  LinenCard,
  CottonCard,
  StatusBadge,
  ProgressPill,
  ScoreMeter,
} from '../components/DesignSystem';
import {
  Compass,
  ArrowRight,
  FileText,
  MessageSquare,
  CheckCircle2,
  Info,
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const {
    profile,
    selectedRole,
    skillObservations,
    roadmapTasks,
    toggleTaskCompletion,
    showToast,
    isDemoMode,
  } = useCareer();

  // Create observations lookup map
  const obsMap = new Map<number | string, number | null>();
  Object.entries(skillObservations).forEach(([sId, val]) => {
    obsMap.set(Number(sId), val);
  });

  // Calculate coverage and alignment deterministically
  const requirements = SEED_ROLE_SKILL_REQUIREMENTS.filter(r => r.role_id === selectedRole.id);
  const coverageResult = calculateRoleCoverage(requirements, obsMap);
  const alignmentResult = calculateAssessedAlignment(requirements, obsMap);
  const knownGaps = calculateKnownGaps(requirements, obsMap);
  const prioritizedGaps = prioritiseGaps(knownGaps);

  // Calculate plan completion separately from skill proficiency
  const planCompletion = calculatePlanCompletion(roadmapTasks);

  // Current active roadmap task
  const currentTask = roadmapTasks.find(t => t.status !== 'completed') || roadmapTasks[0];
  const topGap = prioritizedGaps[0];
  const topGapSkill = topGap ? SKILLS_BY_ID.get(Number(topGap.skillId)) : null;

  const handleToggleTask = (taskId: string) => {
    toggleTaskCompletion(taskId);
    showToast('Roadmap task status updated.');
  };

  return (
    <div style={{ maxWidth: '1060px', margin: '0 auto' }}>
      {/* Page Header */}
      <header style={{ marginBottom: '36px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <Eyebrow
            text={
              isDemoMode
                ? "RAHUL'S SNAPSHOT / FICTIONAL DATA"
                : `${profile.displayName || 'LEARNER'}'S SNAPSHOT / ${profile.branch || 'ACADEMIC CONTEXT'}`
            }
          />
          <DisplayHeading level={1}>
            CLARITY FEELS BETTER<br />
            <i>WHEN IT IS VISIBLE.</i>
          </DisplayHeading>
          <p className="muted-light" style={{ maxWidth: '620px', marginTop: '12px', fontSize: '0.98rem', lineHeight: 1.5 }}>
            Benchmarking verified competencies against <strong style={{ color: 'var(--color-linen)' }}>{selectedRole.name}</strong>.
            All estimates are deterministic. No placement odds, salary predictions, or artificial rankings.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <SecondaryButton onClick={() => navigate('/paths')} style={{ padding: '10px 16px', fontSize: '0.8rem' }}>
            <Compass size={14} aria-hidden="true" />
            Switch Path
          </SecondaryButton>
          <PrimaryButton onClick={() => navigate('/roadmap')} icon={<ArrowRight size={14} />}>
            Open Roadmap ↗
          </PrimaryButton>
        </div>
      </header>

      {/* Two-Card Snapshot Row (Matching reference preview/index.html) */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
          gap: '24px',
          marginBottom: '36px',
        }}
        aria-labelledby="snapshot-heading"
      >
        <h2 id="snapshot-heading" style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}>
          Role Snapshot Overview
        </h2>

        {/* 1. Warm Linen Assessed-Alignment Card */}
        <LinenCard style={{ padding: '32px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-muted-dark)' }}>
                ASSESSED ALIGNMENT
              </span>
              <span className="badge dark-badge" style={{ fontSize: '0.74rem', padding: '4px 10px' }}>
                COVERAGE {coverageResult.coveragePercent}%
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', margin: '4px 0 10px' }}>
              {alignmentResult.alignmentPercent !== null ? (
                <>
                  <span style={{ fontSize: '3.6rem', fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--color-ink)', lineHeight: 1 }}>
                    {alignmentResult.alignmentPercent}
                  </span>
                  <span style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-ink)' }}>%</span>
                </>
              ) : (
                <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-ink)' }}>
                  More evidence needed
                </span>
              )}
            </div>

            <p style={{ margin: '0 0 16px', fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-ink)' }}>
              {selectedRole.name}
            </p>

            <div style={{ marginBottom: '16px' }}>
              <ScoreMeter score={alignmentResult.alignmentPercent || 0} />
            </div>
          </div>

          <div
            style={{
              paddingTop: '16px',
              borderTop: '1px solid rgba(0, 0, 0, 0.1)',
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.74rem',
              color: 'var(--color-muted-dark)',
            }}
          >
            <span>Evidence-led estimate</span>
            <span>Version {selectedRole.version}</span>
          </div>
        </LinenCard>

        {/* 2. Dark Next-Best-Action Tangerine Card */}
        <DarkCard
          style={{
            padding: '32px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            border: '1px solid var(--color-tangerine)',
            background: 'linear-gradient(135deg, rgba(255, 109, 31, 0.14) 0%, var(--color-black-hole) 100%)',
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-tangerine)' }}>
                NEXT BEST ACTION
              </span>
              <span
                style={{
                  width: '9px',
                  height: '9px',
                  borderRadius: '50%',
                  background: 'var(--color-tangerine)',
                  boxShadow: '0 0 8px var(--color-tangerine)',
                }}
              />
            </div>

            {topGap ? (
              <>
                <h3 style={{ margin: '0 0 10px', fontSize: '1.5rem', lineHeight: 1.3, color: 'var(--color-linen)' }}>
                  Bridge gap: <span style={{ color: 'var(--color-tangerine)' }}>{topGapSkill?.name || 'API endpoint'}</span>
                </h3>
                <p className="muted-light" style={{ fontSize: '0.86rem', lineHeight: 1.45, margin: '0 0 20px' }}>
                  {topGap.rationale || 'A focused learning deliverable to turn this competency requirement into verified project proof.'}
                </p>
              </>
            ) : currentTask ? (
              <>
                <h3 style={{ margin: '0 0 10px', fontSize: '1.5rem', lineHeight: 1.3, color: 'var(--color-linen)' }}>
                  Week {currentTask.weekNumber}: <span style={{ color: 'var(--color-tangerine)' }}>{currentTask.title}</span>
                </h3>
                <p className="muted-light" style={{ fontSize: '0.86rem', lineHeight: 1.45, margin: '0 0 20px' }}>
                  {currentTask.description} Deliverable: {currentTask.deliverable}.
                </p>
              </>
            ) : (
              <>
                <h3 style={{ margin: '0 0 10px', fontSize: '1.5rem', lineHeight: 1.3, color: 'var(--color-linen)' }}>
                  Take the diagnostic assessment
                </h3>
                <p className="muted-light" style={{ fontSize: '0.86rem', lineHeight: 1.45, margin: '0 0 20px' }}>
                  Answer 18 calm, untimed questions to identify your starting evidence map.
                </p>
              </>
            )}
          </div>

          <div>
            <button
              className="text-link"
              type="button"
              onClick={() => {
                navigate(topGap ? '/roadmap' : '/assessment');
                showToast('Opening next step.');
              }}
              style={{ fontSize: '0.9rem' }}
            >
              <span>{topGap ? 'Add to roadmap' : 'Start diagnostic'}</span>
              <span aria-hidden="true"> ↗</span>
            </button>
          </div>
        </DarkCard>
      </section>

      {/* Priority Competency Gap & Active Roadmap Task Section */}
      <section style={{ marginBottom: '36px' }} aria-labelledby="metrics-heading">
        <div style={{ marginBottom: '18px' }}>
          <h2 id="metrics-heading" style={{ fontSize: '1.35rem', color: 'var(--color-linen)', margin: '0 0 6px' }}>
            ROLE ALIGNMENT METRICS & PRIORITY GAPS
          </h2>
          <p className="muted-light" style={{ fontSize: '0.84rem', margin: 0 }}>
            Prioritized by prerequisite dependency order before gap size.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '20px' }}>
          {/* Priority Gap Card */}
          <DarkCard style={{ padding: '26px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-cotton)' }}>
                TOP PRIORITY GAP
              </span>
              {topGap && (
                <ProgressPill label={`Prerequisite 0${topGap.prerequisiteOrder}`} />
              )}
            </div>

            {topGap ? (
              <div>
                <h3 style={{ margin: '0 0 8px', fontSize: '1.15rem', color: 'var(--color-linen)' }}>
                  {topGapSkill?.name || `Skill ${topGap.skillId}`}
                </h3>
                <p className="muted-light" style={{ fontSize: '0.82rem', lineHeight: 1.45, margin: '0 0 16px' }}>
                  {topGap.rationale}
                </p>

                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--color-black-soft)',
                    border: '1px solid var(--color-line-dark)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.78rem',
                  }}
                >
                  <span style={{ color: 'var(--color-muted-light)' }}>
                    Current: <strong style={{ color: 'var(--color-linen)' }}>{topGap.observedLevel !== null ? `Level ${topGap.observedLevel}` : 'Unassessed'}</strong>
                  </span>
                  <span style={{ color: 'var(--color-tangerine)' }}>
                    Required: <strong>Level {topGap.targetLevel} / 4</strong>
                  </span>
                </div>
              </div>
            ) : (
              <p className="muted-light" style={{ fontSize: '0.84rem' }}>
                No active gaps identified. Complete the diagnostic to discover gaps.
              </p>
            )}
          </DarkCard>

          {/* Current Roadmap Task Card */}
          <DarkCard style={{ padding: '26px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-cotton)' }}>
                CURRENT ROADMAP TASK
              </span>
              {currentTask && (
                <StatusBadge
                  variant={currentTask.status === 'completed' ? 'cotton' : 'tangerine'}
                  label={currentTask.status === 'completed' ? 'Completed' : 'To Do'}
                />
              )}
            </div>

            {currentTask ? (
              <div>
                <h3 style={{ margin: '0 0 8px', fontSize: '1.15rem', color: 'var(--color-linen)' }}>
                  Week {currentTask.weekNumber}: {currentTask.title}
                </h3>
                <p className="muted-light" style={{ fontSize: '0.82rem', lineHeight: 1.45, margin: '0 0 16px' }}>
                  Deliverable: {currentTask.deliverable} ({currentTask.estimatedHours} hrs).
                </p>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={() => handleToggleTask(currentTask.id)}
                    className="button-text"
                    style={{ fontSize: '0.8rem', color: currentTask.status === 'completed' ? 'var(--color-success)' : 'var(--color-tangerine)' }}
                  >
                    <CheckCircle2 size={14} aria-hidden="true" />
                    <span>{currentTask.status === 'completed' ? 'Mark as Pending' : 'Mark Task Done'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate('/roadmap')}
                    className="button-text"
                    style={{ fontSize: '0.78rem' }}
                  >
                    View Week ↗
                  </button>
                </div>
              </div>
            ) : (
              <p className="muted-light" style={{ fontSize: '0.84rem' }}>
                No roadmap tasks configured yet.
              </p>
            )}
          </DarkCard>
        </div>
      </section>

      {/* Plan Completion Section (Separated from Skill Proficiency) */}
      <section style={{ marginBottom: '36px' }} aria-labelledby="plan-completion-heading">
        <CottonCard style={{ padding: '26px 30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '14px' }}>
            <div>
              <span style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-muted-dark)' }}>
                EFFORT TRACKING / {planCompletion.label.toUpperCase()}
              </span>
              <h3 id="plan-completion-heading" style={{ margin: '4px 0 0', fontSize: '1.4rem', color: 'var(--color-ink)' }}>
                {planCompletion.planCompletionPercent}% of weekly tasks completed
              </h3>
            </div>

            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '1.3rem', fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--color-ink)' }}>
                {planCompletion.completedHours} / {planCompletion.totalHours} hrs
              </span>
              <span style={{ display: 'block', fontSize: '0.74rem', color: 'var(--color-muted-dark)' }}>
                ({planCompletion.completedTasks} of {planCompletion.totalTasks} milestones)
              </span>
            </div>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <ScoreMeter score={planCompletion.planCompletionPercent} />
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.76rem', color: 'var(--color-muted-dark)' }}>
            <Info size={13} style={{ flexShrink: 0, marginTop: '2px', color: 'var(--color-tangerine-deep)' }} />
            <span>
              <strong>Crucial Distinction:</strong> {planCompletion.caveat}
            </span>
          </div>
        </CottonCard>
      </section>

      {/* Practice Room & Resume Lab Quick Access */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '20px' }}>
        <DarkCard style={{ padding: '26px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <FileText size={18} style={{ color: 'var(--color-cotton)' }} />
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--color-linen)' }}>Resume Integrity Lab</h3>
          </div>
          <p className="muted-light" style={{ fontSize: '0.82rem', lineHeight: 1.45, margin: '0 0 16px' }}>
            Audit your resume draft against verified project facts. Detects unsupported metrics and protects against hallucinations.
          </p>
          <PrimaryButton onClick={() => navigate('/resume')} icon={<ArrowRight size={14} />}>
            Open Resume Lab ↗
          </PrimaryButton>
        </DarkCard>

        <DarkCard style={{ padding: '26px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <MessageSquare size={18} style={{ color: 'var(--color-tangerine)' }} />
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--color-linen)' }}>Interview Practice Room</h3>
          </div>
          <p className="muted-light" style={{ fontSize: '0.82rem', lineHeight: 1.45, margin: '0 0 16px' }}>
            Practise technical and behavioural questions in text mode with objective rubrics. Zero video or voice surveillance.
          </p>
          <PrimaryButton onClick={() => navigate('/practice')} icon={<ArrowRight size={14} />}>
            Start Practice Question ↗
          </PrimaryButton>
        </DarkCard>
      </section>
    </div>
  );
};
