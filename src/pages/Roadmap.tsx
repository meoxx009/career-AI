import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCareer } from '../context/CareerContext';
import {
  DisplayHeading,
  Eyebrow,
  PrimaryButton,
  SecondaryButton,
  DarkCard,
  CottonCard,
  ScoreRing,
  StatusBadge,
  SourceLabel,
  ProgressPill,
  EmptyState,
} from '../components/DesignSystem';
import {
  CheckCircle2,
  Circle,
  ExternalLink,
  Clock,
  ArrowRight,
  Lock,
  Calendar,
  AlertCircle,
  X,
} from 'lucide-react';
import {
  isTaskBlocked,
  sanitizeResourceUrl,
  validateWeeklyStudyHours,
  generateRoadmapPlan,
} from '../lib/roadmapGenerator';
import { resolveTaskResource } from '../lib/resourceResolver';
import {
  calculatePlanProgress,
  getCurrentActiveWeek,
} from '../lib/roadmapRepository';
import { CAREER_CATALOGUE } from '../data/careerCatalogue';
import { calculatePathGapAnalysis } from '../lib/gapAnalysis';

export const Roadmap: React.FC = () => {
  const navigate = useNavigate();
  const {
    profile,
    selectedRole,
    selectedRoleId,
    skillObservations,
    roadmapTasks,
    toggleTaskCompletion,
    rescheduleRoadmap,
    showToast,
  } = useCareer();

  const currentPath = React.useMemo(() => {
    return CAREER_CATALOGUE.find(p => p.numericId === selectedRoleId);
  }, [selectedRoleId]);

  const gapAnalysis = React.useMemo(() => {
    if (!currentPath) return null;
    return calculatePathGapAnalysis(currentPath, skillObservations);
  }, [currentPath, skillObservations]);

  // Reschedule modal state
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [hoursInput, setHoursInput] = useState<string>(String(profile.hoursPerWeek || 8));
  const [hoursError, setHoursError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate plan metrics
  const progress = calculatePlanProgress(roadmapTasks);
  const activeWeek = getCurrentActiveWeek(roadmapTasks);

  // Group tasks by weekNumber
  const tasksByWeek: Record<number, typeof roadmapTasks> = {};
  roadmapTasks.forEach(task => {
    if (!tasksByWeek[task.weekNumber]) {
      tasksByWeek[task.weekNumber] = [];
    }
    tasksByWeek[task.weekNumber].push(task);
  });
  const weeks = Object.keys(tasksByWeek)
    .map(Number)
    .sort((a, b) => a - b);

  const nextPendingTask = roadmapTasks.find(t => t.status !== 'completed' && !isTaskBlocked(t, roadmapTasks).blocked);

  // Preview week count for reschedule modal (pure computation, no side-effects)
  const parsedHoursPreview = Number(hoursInput);
  const previewWeeks = (() => {
    if (!validateWeeklyStudyHours(parsedHoursPreview).valid) return null;
    const preview = generateRoadmapPlan({ roleId: selectedRoleId, weeklyStudyHours: parsedHoursPreview });
    return preview.valid ? preview.estimatedWeeks : null;
  })();

  // Handle hours input change in reschedule modal
  const handleHoursChange = (val: string) => {
    setHoursInput(val);
    const parsed = Number(val);
    const validation = validateWeeklyStudyHours(parsed);
    if (!validation.valid) {
      setHoursError(validation.error || 'Invalid study hours.');
    } else {
      setHoursError(null);
    }
  };

  // Submit reschedule — single submit guard
  const handleConfirmReschedule = () => {
    if (isSubmitting) return;
    const parsed = Number(hoursInput);
    const validation = validateWeeklyStudyHours(parsed);
    if (!validation.valid) {
      setHoursError(validation.error || 'Invalid study hours.');
      return;
    }

    setIsSubmitting(true);
    const res = rescheduleRoadmap(parsed);
    setIsSubmitting(false);
    if (res.valid) {
      setIsRescheduleOpen(false);
    } else {
      setHoursError(res.error || 'Failed to reschedule. Your previous plan is still active.');
    }
  };

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto' }}>
      {/* Header & Editorial Heading */}
      <header className="roadmap-head" style={{ marginBottom: '32px' }}>
        <div>
          <Eyebrow text={`TARGET PATH / ${selectedRole.name.toUpperCase()}`} />
          <DisplayHeading level={1} className="editorial-heading">
            Small steps.<br />
            <i style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 500, color: 'var(--color-linen)' }}>
              Real proof.
            </i>
          </DisplayHeading>
        </div>

        <div className="plan-meta" style={{ textAlign: 'right' }}>
          <span>{selectedRole.name.toUpperCase()} / {weeks.length || 0} WEEKS (ESTIMATE)</span>
          <strong style={{ fontSize: '1.25rem', color: 'var(--color-tangerine)', display: 'block', margin: '4px 0' }}>
            {profile.hoursPerWeek} HRS / WEEK
          </strong>
          <button
            type="button"
            onClick={() => {
              setHoursInput(String(profile.hoursPerWeek || 8));
              setHoursError(null);
              setIsRescheduleOpen(true);
            }}
            className="button button-secondary"
            style={{ padding: '6px 14px', fontSize: '0.74rem', minHeight: '32px', marginTop: '6px' }}
            aria-label="Reschedule or re-budget study plan"
          >
            <Calendar size={13} aria-hidden="true" style={{ marginRight: '6px' }} />
            <span>Reschedule Plan</span>
          </button>
        </div>
      </header>

      {/* Header Gap Summary Banner */}
      {gapAnalysis && (
        <DarkCard
          style={{
            marginBottom: '28px',
            padding: '20px 24px',
            border: '1px solid var(--color-line-dark)',
            background: 'linear-gradient(135deg, rgba(255, 109, 31, 0.08) 0%, var(--color-black-hole) 100%)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-tangerine)' }} />
              <Eyebrow text={`GAP ANALYSIS SUMMARY / ${currentPath?.title.toUpperCase() || selectedRole.name.toUpperCase()}`} />
            </div>
            <button
              type="button"
              onClick={() => navigate(`/paths/${currentPath?.slug || selectedRole.slug}`)}
              className="button-text"
              style={{ fontSize: '0.8rem', color: 'var(--color-tangerine)', fontWeight: 700 }}
            >
              View Full Gap Analysis ↗
            </button>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))',
              gap: '16px',
            }}
          >
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--color-muted-light)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                Top Prerequisite Gap
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-linen)', marginTop: '4px' }}>
                {gapAnalysis.topPrerequisiteGap ? gapAnalysis.topPrerequisiteGap.skillName : 'None detected'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--color-muted-light)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                Assessed Gaps
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-tangerine)', marginTop: '4px' }}>
                {gapAnalysis.assessedGapsCount}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--color-muted-light)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                Unassessed Requirements
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-cotton)', marginTop: '4px' }}>
                {gapAnalysis.unassessedRequirementsCount}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--color-muted-light)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                Evidenced Requirements
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-success)', marginTop: '4px' }}>
                {gapAnalysis.evidencedRequirementsCount}
              </div>
            </div>
          </div>

          {/* Unassessed diagnostic notice if diagnostic assessment was never completed */}
          {!gapAnalysis.hasDiagnosticEvidence && (
            <div
              style={{
                marginTop: '16px',
                paddingTop: '12px',
                borderTop: '1px solid var(--color-line-dark)',
                fontSize: '0.78rem',
                color: 'var(--color-cotton)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '10px',
              }}
            >
              <span>{gapAnalysis.noDiagnosticMessage}</span>
              <button
                type="button"
                onClick={() => navigate('/assessment')}
                className="button button-secondary"
                style={{ padding: '4px 10px', fontSize: '0.72rem', minHeight: '28px' }}
              >
                Take Diagnostic ↗
              </button>
            </div>
          )}
        </DarkCard>
      )}

      {/* Progress Metric Banner — Separated Plan Completion vs Skill Evidence */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))',
          gap: '20px',
          marginBottom: '36px',
        }}
      >
        {/* Metric 1: Estimated Plan Completion */}
        <DarkCard>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <ScoreRing score={progress.percent} size={64} strokeWidth={6} />
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--color-muted-light)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                Estimated Plan Completion
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-linen)', marginTop: '2px' }}>
                {progress.percent}% Plan Completed
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-muted-light)', marginTop: '2px' }}>
                {progress.completedTasks} of {progress.totalTasks} milestones completed ({progress.completedHours}/{progress.totalHours}h)
              </div>
            </div>
          </div>
        </DarkCard>

        {/* Metric 2: Verified Skill Evidence */}
        <DarkCard>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--color-muted-light)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
              COMPETENCY VERIFICATION
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-linen)', marginTop: '2px' }}>
              {gapAnalysis ? `${gapAnalysis.evidencedRequirementsCount} / ${gapAnalysis.totalRequirements}` : '0 / 0'} Verified Skill Evidence
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-muted-light)', marginTop: '4px' }}>
              {gapAnalysis
                ? `${gapAnalysis.partiallyEvidencedCount} partial · ${gapAnalysis.assessedGapsCount} assessed gaps · ${gapAnalysis.unassessedRequirementsCount} unassessed`
                : 'Diagnostic assessment data'}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--color-cotton)', marginTop: '6px', fontStyle: 'italic' }}>
              Based on diagnostic & deliverable evidence only. Not a claim of mastery.
            </div>
          </div>
        </DarkCard>

        {/* Metric 3: Target Effort & Curation */}
        <CottonCard>
          <Eyebrow text="STUDY BUDGET PACING" />
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-ink)', margin: '4px 0' }}>
            {profile.hoursPerWeek} Hours / Week
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--color-muted-dark)' }}>
            ~{weeks.length} estimated weeks to complete verified deliverables.
          </div>
          <div style={{ marginTop: '8px' }}>
            <SourceLabel source="Curated Public Repositories & MDN" date="October 2026" />
          </div>
        </CottonCard>
      </div>

      {/* Disclaimer / Trust contract banner */}
      <div
        style={{
          background: 'rgba(255, 109, 31, 0.06)',
          border: '1px solid rgba(255, 109, 31, 0.25)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 18px',
          marginBottom: '32px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '0.82rem',
          color: 'var(--color-linen)',
        }}
      >
        <span style={{ color: 'var(--color-tangerine)', display: 'flex' }} aria-hidden="true">
          <Clock size={16} />
        </span>
        <span>
          <strong>Estimate only:</strong> All milestone dates, hours and durations are estimated study targets based on {profile.hoursPerWeek} hrs/week. Not a guarantee of employment, mastery, or hiring outcome.
        </span>
      </div>

      {/* Empty State Guard */}
      {progress.totalTasks === 0 ? (
        <EmptyState
          title="No Roadmap Generated Yet"
          message="Select a target role or take the assessment to generate a milestone plan."
          action={
            <PrimaryButton onClick={() => navigate('/paths')}>
              Select a Career Path ↗
            </PrimaryButton>
          }
        />
      ) : (
        /* Milestone Weeks Timeline */
        <div style={{ display: 'grid', gap: '28px' }}>
          {weeks.map(weekNum => {
            const weekTasks = tasksByWeek[weekNum];
            const isWeekAllComplete = weekTasks.every(t => t.status === 'completed');
            const isCurrentWeek = weekNum === activeWeek && !isWeekAllComplete;
            const weekHours = weekTasks.reduce((acc, t) => acc + t.estimatedHours, 0);

            return (
              <DarkCard
                key={weekNum}
                className={isCurrentWeek ? 'active-week' : ''}
                style={{
                  borderLeft: isWeekAllComplete
                    ? '4px solid var(--color-success)'
                    : isCurrentWeek
                    ? '4px solid var(--color-tangerine)'
                    : '4px solid var(--color-line-dark)',
                  background: isCurrentWeek
                    ? 'linear-gradient(90deg, rgba(255, 109, 31, 0.08), rgba(26, 29, 30, 0.95) 45%)'
                    : undefined,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '20px',
                    flexWrap: 'wrap',
                    gap: '12px',
                    borderBottom: '1px solid var(--color-line-dark)',
                    paddingBottom: '14px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '2rem',
                        color: isCurrentWeek ? 'var(--color-tangerine)' : 'var(--color-cotton)',
                        lineHeight: 1,
                      }}
                    >
                      WEEK {String(weekNum).padStart(2, '0')}
                    </span>
                    {isCurrentWeek && (
                      <StatusBadge variant="tangerine" label="CURRENT WEEK" />
                    )}
                    {isWeekAllComplete && (
                      <StatusBadge variant="success" label="WEEK COMPLETE" />
                    )}
                    {!isCurrentWeek && !isWeekAllComplete && (
                      <StatusBadge variant="dark" label={`WEEK ${weekNum}`} />
                    )}
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-muted-light)' }}>
                    Target Budget: ~{weekHours} hours (estimate)
                  </span>
                </div>

                <div style={{ display: 'grid', gap: '18px' }}>
                  {weekTasks.map(task => {
                    const isDone = task.status === 'completed';
                    const { blocked: isBlocked, prerequisiteTitle } = isTaskBlocked(task, roadmapTasks);
                    const safeUrl = sanitizeResourceUrl(resolveTaskResource(task, currentPath?.slug));

                    return (
                      <div
                        key={task.id}
                        style={{
                          background: isBlocked ? 'rgba(16, 17, 17, 0.6)' : 'var(--color-black-soft)',
                          padding: '18px 20px',
                          borderRadius: 'var(--radius-md)',
                          border: isBlocked
                            ? '1px dashed rgba(255, 109, 31, 0.3)'
                            : isDone
                            ? '1px solid rgba(46, 204, 113, 0.3)'
                            : '1px solid var(--color-line-dark)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          gap: '16px',
                          flexWrap: 'wrap',
                          opacity: isBlocked ? 0.75 : 1,
                        }}
                      >
                        <div style={{ flex: 1, minWidth: '260px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', color: isDone ? 'var(--color-cotton)' : 'var(--color-linen)', textDecoration: isDone ? 'line-through' : 'none' }}>
                              {task.title}
                            </h3>
                            <ProgressPill label={task.segmentCount && task.segmentCount > 1 ? `~${task.scheduledHours}h this week` : `~${task.estimatedHours}h est.`} />
                            {isBlocked && (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  fontSize: '0.72rem',
                                  color: 'var(--color-tangerine)',
                                  background: 'rgba(255, 109, 31, 0.1)',
                                  padding: '2px 8px',
                                  borderRadius: '999px',
                                }}
                              >
                                <Lock size={12} aria-hidden="true" />
                                <span>Prerequisite Required</span>
                              </span>
                            )}
                          </div>

                          {/* Linked skill & Evidence State Badges */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
                            {task.phase && (
                              <StatusBadge variant="linen" label={task.phase} />
                            )}
                            {task.skillName && (
                              <span
                                style={{
                                  fontSize: '0.74rem',
                                  fontFamily: 'var(--font-mono)',
                                  padding: '2px 8px',
                                  borderRadius: 'var(--radius-pill)',
                                  background: 'rgba(255, 255, 255, 0.07)',
                                  color: 'var(--color-cotton)',
                                }}
                              >
                                Skill: {task.skillName}
                              </span>
                            )}
                            {task.evidenceState === 'evidenced' && (
                              <StatusBadge variant="success" label="Evidenced (Target Met)" />
                            )}
                            {task.evidenceState === 'partially_evidenced' && (
                              <StatusBadge variant="tangerine" label="Partially Evidenced" />
                            )}
                            {task.evidenceState === 'assessed_gap' && (
                              <StatusBadge variant="warning" label="Assessed Gap" />
                            )}
                            {task.evidenceState === 'unassessed' && (
                              <StatusBadge variant="dark" label="Unassessed Requirement" />
                            )}
                            {task.targetLevel && (
                              <span style={{ fontSize: '0.72rem', color: 'var(--color-muted-light)' }}>
                                Target: Level {task.targetLevel}/4
                              </span>
                            )}
                          </div>

                          <p className="muted-light" style={{ fontSize: '0.86rem', margin: '0 0 10px', lineHeight: 1.5 }}>
                            <strong>Why it matters:</strong> {task.description}
                          </p>

                          {/* Evidence Source */}
                          <div style={{ fontSize: '0.74rem', color: 'var(--color-muted-light)', marginBottom: '10px' }}>
                            <strong>Evidence Source: </strong>
                            <span>{task.evidenceSource || 'Diagnostic assessment / Project fact'}</span>
                          </div>

                          {/* Deliverable Box */}
                          <div
                            style={{
                              background: 'rgba(8, 11, 12, 0.5)',
                              padding: '10px 14px',
                              borderRadius: 'var(--radius-sm)',
                              border: '1px solid var(--color-line-dark)',
                              marginBottom: '10px',
                            }}
                          >
                            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-cotton)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              Verifiable Deliverable Proof
                            </div>
                            <div style={{ fontSize: '0.82rem', color: 'var(--color-linen)', marginTop: '3px' }}>
                              {task.deliverable}
                            </div>
                          </div>

                          {/* Next Action */}
                          {task.nextAction && (
                            <div style={{ fontSize: '0.78rem', color: 'var(--color-cotton)', marginBottom: '10px' }}>
                              <strong style={{ color: 'var(--color-tangerine)' }}>Next Action: </strong>
                              <span>{task.nextAction}</span>
                            </div>
                          )}

                          {/* Blocked explanation banner if prerequisite not complete */}
                          {isBlocked && prerequisiteTitle && (
                            <div
                              style={{
                                fontSize: '0.76rem',
                                color: 'var(--color-warning)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                marginBottom: '10px',
                              }}
                            >
                              <Lock size={13} aria-hidden="true" />
                              <span>Locked until prerequisite milestone <strong>"{prerequisiteTitle}"</strong> is verified.</span>
                            </div>
                          )}

                          {/* Safe Resource URL handling */}
                          {safeUrl ? (
                            <div>
                              <a
                                href={safeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="button-text"
                                style={{ fontSize: '0.78rem', color: 'var(--color-tangerine)' }}
                              >
                                <span>Curated Resource</span>
                                <ExternalLink size={12} aria-hidden="true" />
                              </a>
                            </div>
                          ) : (
                            <div style={{ fontSize: '0.74rem', color: 'var(--color-muted-light)' }}>
                              Verifiable deliverable · Official offline/course notes
                            </div>
                          )}
                        </div>

                        {/* Complete / Uncomplete Control */}
                        <div style={{ textAlign: 'right', marginTop: '4px' }}>
                          <button
                            type="button"
                            disabled={isBlocked && !isDone}
                            onClick={() => {
                              if (isBlocked && !isDone) {
                                showToast(`Milestone is locked. Complete prerequisite "${prerequisiteTitle}" first.`);
                                return;
                              }
                              toggleTaskCompletion(task.id);
                              showToast(
                                isDone
                                  ? `Marked "${task.title}" as pending.`
                                  : `Completed milestone "${task.title}"!`
                              );
                            }}
                            className={isDone ? 'button button-secondary' : isBlocked ? 'button button-quiet' : 'button button-primary'}
                            style={{
                              padding: '8px 16px',
                              minHeight: '38px',
                              fontSize: '0.78rem',
                              cursor: isBlocked && !isDone ? 'not-allowed' : 'pointer',
                              opacity: isBlocked && !isDone ? 0.6 : 1,
                            }}
                            aria-label={
                              isDone
                                ? `Mark "${task.title}" as incomplete`
                                : isBlocked
                                ? `Cannot complete "${task.title}": prerequisite incomplete`
                                : `Mark "${task.title}" as completed`
                            }
                          >
                            {isDone ? (
                              <>
                                <CheckCircle2 size={14} color="var(--color-success)" aria-hidden="true" />
                                <span>Completed</span>
                              </>
                            ) : isBlocked ? (
                              <>
                                <Lock size={14} aria-hidden="true" />
                                <span>Locked</span>
                              </>
                            ) : (
                              <>
                                <Circle size={14} aria-hidden="true" />
                                <span>Mark Complete</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </DarkCard>
            );
          })}
        </div>
      )}

      {/* Primary Action / Practice link */}
      <div style={{ textAlign: 'center', marginTop: '48px', marginBottom: '32px' }}>
        <PrimaryButton
          onClick={() => {
            if (nextPendingTask) {
              showToast(`Next milestone: ${nextPendingTask.title}`);
            }
            navigate('/practice');
          }}
          icon={<ArrowRight size={16} />}
        >
          Practise Interview Questions for {selectedRole.name} ↗
        </PrimaryButton>
      </div>

      {/* Reschedule / Replan Modal Dialog */}
      {isRescheduleOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="reschedule-modal-title"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(8, 11, 12, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
          }}
        >
          <div
            style={{
              background: 'var(--color-black-soft)',
              border: '1px solid var(--color-line-dark)',
              borderRadius: 'var(--radius-lg)',
              maxWidth: '480px',
              width: '100%',
              padding: '28px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
              position: 'relative',
            }}
          >
            <button
              type="button"
              onClick={() => setIsRescheduleOpen(false)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'transparent',
                border: 0,
                color: 'var(--color-muted-light)',
                cursor: 'pointer',
              }}
              aria-label="Close reschedule dialog"
            >
              <X size={20} />
            </button>

            <Eyebrow text="RE-BUDGET STUDY PLAN" />
            <h2 id="reschedule-modal-title" style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', margin: '4px 0 12px' }}>
              Reschedule Roadmap
            </h2>

            <p className="muted-light" style={{ fontSize: '0.86rem', marginBottom: '20px', lineHeight: 1.5 }}>
              Enter your new weekly available hours. Tasks are re-budgeted sequentially, in prerequisite order.
              Tasks whose hours exceed your budget are split into consecutive study segments.
              All completed milestone progress is preserved.
            </p>

            {/* Current → New preview */}
            <div
              style={{
                display: 'flex',
                gap: '12px',
                marginBottom: '20px',
                padding: '12px 14px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--color-line-dark)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.84rem',
                color: 'var(--color-linen)',
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ color: 'var(--color-muted-light)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Current</div>
                <div><strong>{profile.hoursPerWeek} hrs/week</strong> · ~{weeks.length} {weeks.length === 1 ? 'week' : 'weeks'} (estimate)</div>
              </div>
              <div style={{ color: 'var(--color-line-dark)', display: 'flex', alignItems: 'center' }}>→</div>
              <div style={{ flex: 1 }}>
                <div style={{ color: 'var(--color-muted-light)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>New</div>
                {previewWeeks !== null ? (
                  <div><strong>{parsedHoursPreview} hrs/week</strong> · ~{previewWeeks} {previewWeeks === 1 ? 'week' : 'weeks'} (estimate)</div>
                ) : (
                  <div style={{ color: 'var(--color-muted-light)' }}>Enter valid hours to preview</div>
                )}
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label
                htmlFor="study-hours-input"
                style={{
                  display: 'block',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--color-linen)',
                  marginBottom: '8px',
                }}
              >
                Weekly Study Hours (1 to 168)
              </label>
              <input
                id="study-hours-input"
                type="number"
                min="1"
                max="168"
                step="1"
                value={hoursInput}
                onChange={e => handleHoursChange(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--color-void)',
                  border: hoursError ? '1px solid var(--color-danger)' : '1px solid var(--color-line-dark)',
                  color: 'var(--color-linen)',
                  fontSize: '1rem',
                  fontFamily: 'inherit',
                }}
                aria-invalid={Boolean(hoursError)}
                aria-describedby={hoursError ? 'study-hours-error' : undefined}
              />

              {hoursError && (
                <div
                  id="study-hours-error"
                  role="alert"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.78rem',
                    color: 'var(--color-danger)',
                    marginTop: '8px',
                  }}
                >
                  <AlertCircle size={14} aria-hidden="true" />
                  <span>{hoursError}</span>
                </div>
              )}
            </div>

            <p style={{ fontSize: '0.74rem', color: 'var(--color-muted-light)', marginBottom: '20px', lineHeight: 1.5 }}>
              All dates and week counts are estimated study targets. Not a guarantee of employment, mastery or hiring outcome.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
              <SecondaryButton onClick={() => setIsRescheduleOpen(false)}>
                Cancel
              </SecondaryButton>
              <PrimaryButton
                disabled={Boolean(hoursError) || isSubmitting}
                onClick={handleConfirmReschedule}
              >
                {isSubmitting ? 'Rescheduling…' : 'Confirm Reschedule'}
              </PrimaryButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
