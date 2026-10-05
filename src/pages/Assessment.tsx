import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCareer } from '../context/CareerContext';
import {
  SEED_SKILLS,
  SKILLS_BY_ID,
  ROLES_BY_ID,
} from '../data/seedData';
import {
  ASSESSMENT_TRACKS,
  getTrackById,
} from '../data/assessmentBank';
import { selectQuestionsForAssessment } from '../lib/questionSelector';
import {
  scoreAssessmentAnswers,
  buildSkillObservations,
  calculateRoleCoverage,
  calculateAssessedAlignment,
  calculateKnownGaps,
  prioritiseGaps,
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
  ScoreMeter,
} from '../components/DesignSystem';
import {
  ArrowLeft,
  ArrowRight,
  Save,
  Clock,
  CheckCircle2,
  HelpCircle,
  RotateCcw,
  Compass,
  ListOrdered,
  SlidersHorizontal,
  AlertTriangle,
} from 'lucide-react';

export const Assessment: React.FC = () => {
  const navigate = useNavigate();
  const {
    profile,
    diagnosticAnswers,
    setDiagnosticAnswer,
    saveDiagnosticAnswer,
    clearDiagnosticAnswer,
    setSkillObservation,
    saveSkillObservationsBatch,
    selectedRoleId,
    showToast,
  } = useCareer();

  // Map initial track from selected role or profile
  const initialTrackId = useMemo(() => {
    if (selectedRoleId === 2) return 'frontend';
    if (selectedRoleId === 3) return 'data_analysis';
    if (profile.targetRoleSlug) {
      if (profile.targetRoleSlug.includes('front')) return 'frontend';
      if (profile.targetRoleSlug.includes('back')) return 'backend';
      if (profile.targetRoleSlug.includes('data')) return 'data_analysis';
      if (profile.targetRoleSlug.includes('ai') || profile.targetRoleSlug.includes('learning')) return 'ai_engineering';
      if (profile.targetRoleSlug.includes('embedded') || profile.targetRoleSlug.includes('iot')) return 'ece_embedded';
      if (profile.targetRoleSlug.includes('design')) return 'design';
    }
    return 'backend';
  }, [selectedRoleId, profile.targetRoleSlug]);

  const [selectedTrackId, setSelectedTrackId] = useState<string>(initialTrackId);
  const [trackCategoryFilter, setTrackCategoryFilter] = useState<string>('all');

  const hasExistingAnswers = Object.keys(diagnosticAnswers).length > 0;

  // Step state: 'choose_track' | 'question_runner' | 'completed'
  const [step, setStep] = useState<'choose_track' | 'question_runner' | 'completed'>(
    hasExistingAnswers ? 'question_runner' : 'choose_track'
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [untimedMode, setUntimedMode] = useState(true);
  const [showExplanation, setShowExplanation] = useState(false);

  // Dynamically selected questions for the active track
  const selectionResult = useMemo(() => {
    return selectQuestionsForAssessment({
      selectedTrackIds: [selectedTrackId],
      learnerProfile: profile,
      maxQuestions: 10,
    });
  }, [selectedTrackId, profile]);

  const activeTrack = useMemo(() => {
    return getTrackById(selectedTrackId) || ASSESSMENT_TRACKS[0];
  }, [selectedTrackId]);

  const questions = selectionResult.questions;
  const totalQuestions = questions.length;
  const currentQ = questions[currentIndex] || questions[0];
  const currentSkill = currentQ ? SKILLS_BY_ID.get(currentQ.skill_id) : undefined;
  const selectedKey = currentQ ? diagnosticAnswers[currentQ.id] : undefined;

  const answeredQuestionIds = Object.keys(diagnosticAnswers);
  const answeredCount = answeredQuestionIds.length;
  const progressPercent = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  // Filtered tracks for the track picker
  const filteredTracks = useMemo(() => {
    if (trackCategoryFilter === 'all') return ASSESSMENT_TRACKS;
    return ASSESSMENT_TRACKS.filter((t) => t.category === trackCategoryFilter);
  }, [trackCategoryFilter]);

  // Compute live deterministic scores based on the active questions
  const scoreResults = useMemo(() => {
    return scoreAssessmentAnswers(questions, diagnosticAnswers);
  }, [questions, diagnosticAnswers]);

  const skillObservationsList = useMemo(() => {
    return buildSkillObservations(scoreResults);
  }, [scoreResults]);

  // Map skill observations for quick lookup
  const observationsMap = useMemo(() => {
    const map = new Map<number | string, number | null>();
    skillObservationsList.forEach((obs) => {
      map.set(obs.skill_id, obs.value);
    });
    SEED_SKILLS.forEach((s) => {
      if (!map.has(s.id)) {
        map.set(s.id, null);
      }
    });
    return map;
  }, [skillObservationsList]);

  const targetRole = (typeof selectedRoleId === 'number' ? ROLES_BY_ID.get(selectedRoleId) : undefined) || ROLES_BY_ID.get(1)!;
  const roleReqs = targetRole.requirements || [];
  const coverageResult = calculateRoleCoverage(roleReqs, observationsMap);
  const alignmentResult = calculateAssessedAlignment(roleReqs, observationsMap);
  const knownGaps = calculateKnownGaps(roleReqs, observationsMap);
  const prioritizedGaps = prioritiseGaps(knownGaps);

  const handleSelectOption = (key: 'a' | 'b' | 'c' | 'd') => {
    if (!currentQ) return;
    setDiagnosticAnswer(currentQ.id, key);
    saveDiagnosticAnswer(currentQ.id, key);
  };

  const handleClearCurrent = () => {
    if (!currentQ) return;
    clearDiagnosticAnswer(currentQ.id);
    showToast('Question cleared and marked unanswered.');
  };

  const handleNext = () => {
    setShowExplanation(false);
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      handleFinalize();
    }
  };

  const handlePrev = () => {
    setShowExplanation(false);
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleFinalize = () => {
    skillObservationsList.forEach((obs) => {
      setSkillObservation(obs.skill_id, obs.value);
    });
    saveSkillObservationsBatch(
      skillObservationsList.map((obs) => ({
        skillId: Number(obs.skill_id),
        value: obs.value,
        source: 'diagnostic',
      }))
    );
    setStep('completed');
    showToast('Diagnostic completed! Results evaluated deterministically.');
  };

  const handleSaveAndExit = () => {
    skillObservationsList.forEach((obs) => {
      setSkillObservation(obs.skill_id, obs.value);
    });
    saveSkillObservationsBatch(
      skillObservationsList.map((obs) => ({
        skillId: Number(obs.skill_id),
        value: obs.value,
        source: 'diagnostic',
      }))
    );
    showToast('Diagnostic progress saved.');
    navigate('/dashboard');
  };

  const handleStartAssessment = () => {
    setCurrentIndex(0);
    setShowExplanation(false);
    setStep('question_runner');
  };

  // ================= STEP 0: CHOOSE WHAT YOU WANT TO ASSESS =================
  if (step === 'choose_track') {
    return (
      <div style={{ maxWidth: '960px', margin: '0 auto', paddingBottom: '64px' }}>
        {/* Navigation Breadcrumb */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="button-text"
            style={{ fontSize: '0.82rem' }}
          >
            <ArrowLeft size={14} aria-hidden="true" />
            <span>Return to Overview</span>
          </button>
        </div>

        {/* Header */}
        <header style={{ marginBottom: '32px' }}>
          <Eyebrow text="FIELD &amp; SKILL-BASED DIAGNOSTIC ASSESSMENT" />
          <DisplayHeading level={1}>CHOOSE WHAT YOU WANT TO ASSESS</DisplayHeading>
          <p
            className="muted-light"
            style={{ maxWidth: '780px', marginTop: '12px', fontSize: '1rem', lineHeight: 1.55 }}
          >
            Select a specialized engineering track or foundational assessment. Questions are calibrated
            dynamically to assess real skill requirements without trick questions, speed penalties, or
            IQ/personality scoring.
          </p>
        </header>

        {/* Selected Track Overview & Configuration Bento Card */}
        <LinenCard style={{ marginBottom: '36px', padding: '28px 32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: 'var(--color-muted-dark)',
                  }}
                >
                  SELECTED TRACK
                </span>
                <StatusBadge variant="tangerine" label={activeTrack.domain} />
              </div>
              <h2 style={{ margin: '0 0 8px', fontSize: '1.75rem', color: 'var(--color-ink)' }}>
                {activeTrack.title}
              </h2>
              <p style={{ margin: '0 0 16px', fontSize: '0.88rem', color: 'var(--color-muted-dark)', maxWidth: '640px', lineHeight: 1.45 }}>
                {activeTrack.description}
              </p>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '2rem', fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--color-ink)', lineHeight: 1 }}>
                {selectionResult.questions.length}
              </div>
              <span style={{ fontSize: '0.76rem', color: 'var(--color-muted-dark)', fontWeight: 600 }}>
                Questions Ready
              </span>
            </div>
          </div>

          {/* Content Gap Alert if Track has insufficient questions */}
          {selectionResult.isContentGap && (
            <div
              style={{
                marginBottom: '20px',
                padding: '14px 18px',
                backgroundColor: 'rgba(201, 78, 20, 0.1)',
                border: '1px solid var(--color-tangerine-deep)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <AlertTriangle size={18} color="var(--color-tangerine-deep)" style={{ flexShrink: 0 }} aria-hidden="true" />
              <div style={{ fontSize: '0.84rem', color: 'var(--color-ink)', fontWeight: 600 }}>
                {selectionResult.contentGapNotice}
              </div>
            </div>
          )}

          {/* Track Specifications Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
              paddingTop: '16px',
              borderTop: '1px solid rgba(0,0,0,0.1)',
              marginBottom: '24px',
            }}
          >
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--color-muted-dark)', fontWeight: 700, textTransform: 'uppercase' }}>
                Skills Assessed
              </span>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                {selectionResult.trackSummary.assessedSkills.map((s) => (
                  <span
                    key={s.id}
                    style={{
                      fontSize: '0.72rem',
                      padding: '2px 8px',
                      backgroundColor: 'rgba(0,0,0,0.06)',
                      borderRadius: '6px',
                      color: 'var(--color-ink)',
                      fontWeight: 600,
                    }}
                  >
                    {s.name}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--color-muted-dark)', fontWeight: 700, textTransform: 'uppercase' }}>
                Difficulty Mix
              </span>
              <div style={{ fontSize: '0.82rem', color: 'var(--color-ink)', marginTop: '6px' }}>
                {selectionResult.trackSummary.difficultyMix.easy} Easy • {selectionResult.trackSummary.difficultyMix.medium} Medium • {selectionResult.trackSummary.difficultyMix.hard} Hard
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--color-muted-dark)', fontWeight: 700, textTransform: 'uppercase' }}>
                Untimed &amp; Continuous Save
              </span>
              <div style={{ fontSize: '0.82rem', color: 'var(--color-ink)', marginTop: '6px' }}>
                No countdown clock • Auto-saved to browser
              </div>
            </div>
          </div>

          {/* Diagnostic Limitation Notice */}
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: 'rgba(255, 109, 31, 0.08)',
              border: '1px solid var(--color-tangerine)',
              borderRadius: '8px',
              fontSize: '0.84rem',
              color: 'var(--color-ink)',
              marginBottom: '24px',
              fontWeight: 600,
            }}
          >
            Diagnostic estimate — not a certificate. Assesses demonstrated knowledge on structured questions
            without predicting hiring outcomes or placement guarantees.
          </div>

          {/* Start CTA */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', alignItems: 'center' }}>
            <PrimaryButton
              onClick={handleStartAssessment}
              style={{ fontSize: '0.9rem', padding: '12px 24px' }}
            >
              Start Diagnostic Assessment ({selectionResult.questions.length} questions) →
            </PrimaryButton>
          </div>
        </LinenCard>

        {/* Track Category Filter Tabs */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setTrackCategoryFilter('all')}
              className={`button ${trackCategoryFilter === 'all' ? 'button-primary' : 'button-secondary'}`}
              style={{ fontSize: '0.78rem', padding: '6px 14px' }}
            >
              All Tracks (18)
            </button>
            <button
              type="button"
              onClick={() => setTrackCategoryFilter('software')}
              className={`button ${trackCategoryFilter === 'software' ? 'button-primary' : 'button-secondary'}`}
              style={{ fontSize: '0.78rem', padding: '6px 14px' }}
            >
              Software &amp; Systems
            </button>
            <button
              type="button"
              onClick={() => setTrackCategoryFilter('data_ai')}
              className={`button ${trackCategoryFilter === 'data_ai' ? 'button-primary' : 'button-secondary'}`}
              style={{ fontSize: '0.78rem', padding: '6px 14px' }}
            >
              Data &amp; AI
            </button>
            <button
              type="button"
              onClick={() => setTrackCategoryFilter('hardware')}
              className={`button ${trackCategoryFilter === 'hardware' ? 'button-primary' : 'button-secondary'}`}
              style={{ fontSize: '0.78rem', padding: '6px 14px' }}
            >
              Hardware &amp; ECE
            </button>
            <button
              type="button"
              onClick={() => setTrackCategoryFilter('design_product')}
              className={`button ${trackCategoryFilter === 'design_product' ? 'button-primary' : 'button-secondary'}`}
              style={{ fontSize: '0.78rem', padding: '6px 14px' }}
            >
              Design &amp; Product
            </button>
          </div>
        </div>

        {/* Track Selection Bento Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {filteredTracks.map((track) => {
            const isSelected = track.id === selectedTrackId;
            return (
              <button
                key={track.id}
                type="button"
                onClick={() => setSelectedTrackId(track.id)}
                style={{
                  textAlign: 'left',
                  backgroundColor: 'var(--color-black-hole)',
                  border: isSelected ? '2px solid var(--color-tangerine)' : '1px solid var(--color-line-dark)',
                  borderRadius: '16px',
                  padding: '18px 20px',
                  cursor: 'pointer',
                  boxShadow: isSelected ? '0 0 16px rgba(255, 109, 31, 0.2)' : 'none',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--color-cotton)', textTransform: 'uppercase' }}>
                      {track.domain}
                    </span>
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        color: isSelected ? 'var(--color-tangerine)' : 'var(--color-muted-light)',
                      }}
                    >
                      {track.hasSufficientQuestions ? `${track.expectedQuestionCount} Qs` : 'Peer Review'}
                    </span>
                  </div>

                  <h3 style={{ margin: '0 0 6px', fontSize: '1.02rem', fontWeight: 700, color: 'var(--color-linen)' }}>
                    {track.title}
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-muted-light)', lineHeight: 1.4 }}>
                    {track.description}
                  </p>
                </div>

                <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid var(--color-line-dark)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.74rem', color: isSelected ? 'var(--color-tangerine)' : 'var(--color-muted-light)', fontWeight: 600 }}>
                    {isSelected ? 'Active Track ✓' : 'Select Track'}
                  </span>
                  <ArrowRight size={14} color={isSelected ? 'var(--color-tangerine)' : 'var(--color-muted-light)'} aria-hidden="true" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ================= STEP 2: RICH RESULTS SCREEN =================
  if (step === 'completed') {
    const assessedSkillsCount = scoreResults.filter((s) => s.diagnosticEstimate !== null).length;
    const unassessedSkillsCount = scoreResults.filter((s) => s.diagnosticEstimate === null).length;

    return (
      <div style={{ maxWidth: '840px', margin: '0 auto', paddingBottom: '64px' }}>
        {/* Top bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              onClick={() => setStep('question_runner')}
              className="button-text"
              style={{ fontSize: '0.8rem' }}
            >
              <RotateCcw size={14} aria-hidden="true" />
              <span>Review &amp; Modify Answers</span>
            </button>
            <button
              type="button"
              onClick={() => setStep('choose_track')}
              className="button-text"
              style={{ fontSize: '0.8rem', color: 'var(--color-cotton)' }}
            >
              <SlidersHorizontal size={14} aria-hidden="true" />
              <span>Assess Another Track</span>
            </button>
          </div>
        </div>

        {/* Completion Header */}
        <header style={{ marginBottom: '28px' }}>
          <Eyebrow text={`DIAGNOSTIC SUMMARY / TRACK: ${activeTrack.title.toUpperCase()}`} />
          <DisplayHeading level={1}>DIAGNOSTIC ESTIMATE</DisplayHeading>

          {/* Mandatory exact copy */}
          <div
            style={{
              marginTop: '12px',
              padding: '12px 16px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(255, 109, 31, 0.08)',
              border: '1px solid var(--color-tangerine)',
              color: 'var(--color-linen)',
              fontSize: '0.88rem',
              fontWeight: 600,
            }}
          >
            This is a short diagnostic estimate, not a certificate.
          </div>

          <p className="muted-light" style={{ marginTop: '12px', fontSize: '0.94rem', lineHeight: 1.5 }}>
            Based on {answeredCount} answered questions in the {activeTrack.title} track across {assessedSkillsCount} skill areas.
            Unanswered questions were kept strictly unassessed (unknown), never penalized as 0%.
          </p>
        </header>

        {/* Target Role / Track Alignment & Coverage Card */}
        <LinenCard style={{ marginBottom: '24px', padding: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <span style={{ fontSize: '0.76rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-muted-dark)' }}>
                EVALUATION BENCHMARK
              </span>
              <h2 style={{ margin: '4px 0 0', fontSize: '1.8rem', color: 'var(--color-ink)' }}>
                {activeTrack.title}
              </h2>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '2.4rem', fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--color-ink)', lineHeight: 1 }}>
                {alignmentResult.alignmentPercent !== null ? `${alignmentResult.alignmentPercent}%` : 'Unranked'}
              </div>
              <span style={{ fontSize: '0.74rem', color: 'var(--color-muted-dark)', fontWeight: 600 }}>
                {alignmentResult.state === 'confident'
                  ? 'Assessed Alignment'
                  : 'More Evidence Needed'}
              </span>
            </div>
          </div>

          <div style={{ marginTop: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--color-muted-dark)', marginBottom: '6px' }}>
              <span>Track Coverage Ratio</span>
              <span>{coverageResult.coveragePercent}% ({coverageResult.knownWeight}/{coverageResult.totalWeight} weight)</span>
            </div>
            <ScoreMeter score={coverageResult.coveragePercent} />
          </div>

          <p style={{ margin: '16px 0 0', fontSize: '0.82rem', color: 'var(--color-muted-dark)', lineHeight: 1.45 }}>
            {alignmentResult.caveat}
          </p>
        </LinenCard>

        {/* Evidence Gathered vs Known Gaps Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '20px', marginBottom: '28px' }}>
          {/* Evidence Gathered */}
          <DarkCard style={{ padding: '24px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '1.05rem', color: 'var(--color-linen)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={16} style={{ color: 'var(--color-success)' }} />
              <span>Evidence Gathered ({assessedSkillsCount} Skills)</span>
            </h3>

            <div style={{ display: 'grid', gap: '10px' }}>
              {skillObservationsList
                .filter((obs) => obs.value !== null)
                .map((obs) => {
                  const s = SKILLS_BY_ID.get(obs.skill_id);
                  return (
                    <div
                      key={obs.skill_id}
                      style={{
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--color-black-soft)',
                        border: '1px solid var(--color-line-dark)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span style={{ fontSize: '0.85rem', color: 'var(--color-linen)' }}>
                        {s?.name || `Skill ${obs.skill_id}`}
                      </span>
                      <span
                        style={{
                          fontSize: '0.76rem',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 700,
                          color: 'var(--color-cotton)',
                        }}
                      >
                        Observed Level {obs.value}/4
                      </span>
                    </div>
                  );
                })}
              {assessedSkillsCount === 0 && (
                <p className="muted-light" style={{ fontSize: '0.82rem', margin: 0 }}>
                  No questions answered yet.
                </p>
              )}
            </div>
          </DarkCard>

          {/* Known Gaps */}
          <DarkCard style={{ padding: '24px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '1.05rem', color: 'var(--color-linen)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ListOrdered size={16} style={{ color: 'var(--color-tangerine)' }} />
              <span>Prioritized Gaps ({prioritizedGaps.length})</span>
            </h3>

            <div style={{ display: 'grid', gap: '10px' }}>
              {prioritizedGaps.slice(0, 5).map((gap) => {
                const s = SKILLS_BY_ID.get(Number(gap.skillId));
                return (
                  <div
                    key={String(gap.skillId)}
                    style={{
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--color-black-soft)',
                      border: '1px solid var(--color-line-dark)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-linen)' }}>
                        {s?.name || `Skill ${gap.skillId}`}
                      </span>
                      <span
                        style={{
                          fontSize: '0.74rem',
                          fontFamily: 'var(--font-mono)',
                          color: 'var(--color-tangerine)',
                        }}
                      >
                        Gap: {gap.gap} (Target {gap.targetLevel})
                      </span>
                    </div>
                    {gap.rationale && (
                      <p style={{ margin: '4px 0 0', fontSize: '0.74rem', color: 'var(--color-muted-light)' }}>
                        {gap.rationale}
                      </p>
                    )}
                  </div>
                );
              })}
              {prioritizedGaps.length === 0 && (
                <p className="muted-light" style={{ fontSize: '0.82rem', margin: 0 }}>
                  No known gaps detected for currently assessed skills.
                </p>
              )}
            </div>
          </DarkCard>
        </div>

        {/* Unknowns & Next Action */}
        <CottonCard style={{ marginBottom: '32px', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <HelpCircle size={20} style={{ color: 'var(--color-tangerine-deep)', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <h4 style={{ margin: '0 0 6px', fontSize: '1rem', color: 'var(--color-ink)' }}>
                Unknown Areas &amp; Next Actions ({unassessedSkillsCount} unassessed skills)
              </h4>
              <p style={{ margin: '0 0 16px', fontSize: '0.82rem', color: 'var(--color-ink)', lineHeight: 1.45 }}>
                Skills with no answered questions remain strictly unknown. To increase your coverage above 60%,
                you can review remaining questions, or proceed to role comparison to see how your current evidence maps across paths.
              </p>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <PrimaryButton onClick={() => navigate('/paths')} icon={<Compass size={15} />}>
                  Compare All Paths ↗
                </PrimaryButton>
                <SecondaryButton onClick={() => navigate('/paths/builder')}>
                  Explore 33-Path Builder ↗
                </SecondaryButton>
              </div>
            </div>
          </div>
        </CottonCard>
      </div>
    );
  }

  // ================= STEP 1: MAIN QUESTION RUNNER =================
  if (!currentQ) {
    return (
      <div style={{ maxWidth: '860px', margin: '0 auto', textAlign: 'center', padding: '64px 20px' }}>
        <h2 style={{ color: 'var(--color-linen)' }}>No questions available for this track</h2>
        <p className="muted-light">Please select a different track to assess.</p>
        <PrimaryButton onClick={() => setStep('choose_track')}>Choose Track</PrimaryButton>
      </div>
    );
  }

  const options: Array<{ key: 'a' | 'b' | 'c' | 'd'; text: string }> = [
    { key: 'a', text: currentQ.option_a },
    { key: 'b', text: currentQ.option_b },
    { key: 'c', text: currentQ.option_c },
    { key: 'd', text: currentQ.option_d },
  ];

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', paddingBottom: '64px' }}>
      {/* Top Header & Navigation */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={() => setStep('choose_track')}
            className="button-text"
            style={{ fontSize: '0.8rem' }}
            aria-label="Change Track"
          >
            <ArrowLeft size={14} aria-hidden="true" />
            <span>Change Track</span>
          </button>
          <span style={{ fontSize: '0.76rem', color: 'var(--color-muted-light)' }}>
            Track: <strong style={{ color: 'var(--color-cotton)' }}>{activeTrack.title}</strong>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          {/* Untimed Mode Toggle */}
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.78rem',
              color: 'var(--color-muted-light)',
              cursor: 'pointer',
            }}
          >
            <Clock size={13} aria-hidden="true" />
            <input
              type="checkbox"
              checked={untimedMode}
              onChange={(e) => setUntimedMode(e.target.checked)}
            />
            <span>Untimed Mode (No pressure)</span>
          </label>

          <button
            type="button"
            onClick={handleSaveAndExit}
            className="button-text"
            style={{ fontSize: '0.78rem' }}
          >
            <Save size={13} aria-hidden="true" />
            <span>Save &amp; Resume Later</span>
          </button>

          <button
            type="button"
            onClick={handleFinalize}
            className="button-text"
            style={{ fontSize: '0.78rem', color: 'var(--color-tangerine)' }}
            title="Complete assessment immediately with currently answered questions"
          >
            <CheckCircle2 size={13} aria-hidden="true" />
            <span>Finish now with current answers</span>
          </button>
        </div>
      </div>

      {/* Page Context & Progress Bar */}
      <header style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
          <Eyebrow text={`DIAGNOSTIC / QUESTION ${currentIndex + 1} OF ${totalQuestions}`} />
          <span style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: 'var(--color-cotton)' }}>
            {answeredCount} / {totalQuestions} answered ({progressPercent}%)
          </span>
        </div>

        {/* Visual Progress Bar */}
        <div
          role="progressbar"
          aria-valuenow={progressPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Diagnostic progress"
          style={{
            height: '6px',
            backgroundColor: 'var(--color-line-dark)',
            borderRadius: 'var(--radius-pill)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${progressPercent}%`,
              backgroundColor: 'var(--color-tangerine)',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      </header>

      {/* Main Question Card */}
      <DarkCard style={{ padding: '32px', marginBottom: '24px' }}>
        {/* Category & Skill Badge */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span
              style={{
                fontSize: '0.72rem',
                fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase',
                color: 'var(--color-muted-light)',
                fontWeight: 700,
              }}
            >
              {currentQ.category}
            </span>
            <span style={{ color: 'var(--color-line-dark)' }}>•</span>
            <span style={{ fontSize: '0.78rem', color: 'var(--color-cotton)', fontWeight: 600 }}>
              {currentSkill?.name || 'General Engineering'}
            </span>
          </div>

          <StatusBadge
            variant={currentQ.difficulty === 'easy' ? 'cotton' : currentQ.difficulty === 'medium' ? 'dark' : 'tangerine'}
            label={currentQ.difficulty.toUpperCase()}
          />
        </div>

        {/* Prompt */}
        <h2
          style={{
            fontSize: '1.28rem',
            lineHeight: 1.45,
            color: 'var(--color-linen)',
            fontWeight: 700,
            marginBottom: '24px',
          }}
        >
          {currentQ.prompt}
        </h2>

        {/* Options List */}
        <div
          role="radiogroup"
          aria-label="Answer options"
          style={{ display: 'grid', gap: '12px', marginBottom: '24px' }}
        >
          {options.map((opt) => {
            const isChecked = selectedKey === opt.key;
            return (
              <label
                key={opt.key}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '14px',
                  padding: '16px 20px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: isChecked ? 'rgba(255, 109, 31, 0.12)' : 'var(--color-black-soft)',
                  border: isChecked ? '2px solid var(--color-tangerine)' : '1px solid var(--color-line-dark)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <input
                  type="radio"
                  name={`question-${currentQ.id}`}
                  value={opt.key}
                  checked={isChecked}
                  onChange={() => handleSelectOption(opt.key)}
                  aria-label={opt.text}
                  style={{ marginTop: '3px' }}
                />
                <div style={{ flex: 1 }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      marginRight: '8px',
                      color: isChecked ? 'var(--color-tangerine)' : 'var(--color-cotton)',
                    }}
                  >
                    {opt.key.toUpperCase()}.
                  </span>
                  <span style={{ color: 'var(--color-linen)', fontSize: '0.94rem' }}>
                    {opt.text}
                  </span>
                </div>
              </label>
            );
          })}
        </div>

        {/* Clear & Explanation Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            {selectedKey ? (
              <button
                type="button"
                onClick={handleClearCurrent}
                className="button-text"
                style={{ fontSize: '0.78rem', color: 'var(--color-muted-light)' }}
              >
                Clear Answer (Mark Unanswered)
              </button>
            ) : (
              <span style={{ fontSize: '0.76rem', color: 'var(--color-muted-light)', fontStyle: 'italic' }}>
                Unanswered questions remain unknown, not marked 0%.
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowExplanation(!showExplanation)}
            className="button-text"
            style={{ fontSize: '0.78rem', color: 'var(--color-cotton)' }}
          >
            {showExplanation ? 'Hide Concept Rationale' : 'Why this matters ↗'}
          </button>
        </div>

        {/* Explanation Rationale Panel */}
        {showExplanation && (
          <div
            style={{
              marginTop: '20px',
              padding: '16px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'rgba(245, 231, 198, 0.05)',
              border: '1px solid var(--color-line-dark)',
              fontSize: '0.84rem',
              color: 'var(--color-cotton)',
              lineHeight: 1.5,
            }}
          >
            <strong>Concept Rationale: </strong>
            {currentQ.explanation}
          </div>
        )}
      </DarkCard>

      {/* Navigation Buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <SecondaryButton
          onClick={handlePrev}
          disabled={currentIndex === 0}
          icon={<ArrowLeft size={16} />}
        >
          Previous Question
        </SecondaryButton>

        <div style={{ display: 'flex', gap: '12px' }}>
          {currentIndex === totalQuestions - 1 ? (
            <PrimaryButton onClick={handleFinalize} icon={<CheckCircle2 size={16} />}>
              Finish Diagnostic Assessment
            </PrimaryButton>
          ) : (
            <PrimaryButton onClick={handleNext} icon={<ArrowRight size={16} />}>
              Next Question
            </PrimaryButton>
          )}
        </div>
      </div>
    </div>
  );
};
