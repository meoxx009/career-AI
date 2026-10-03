import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCareer } from '../context/CareerContext';
import {
  ROLES_BY_SLUG,
  SEED_ROLE_SKILL_REQUIREMENTS,
  SKILLS_BY_ID,
} from '../data/seedData';
import {
  getCareerPathBySlug,
  asCareerRole,
} from '../data/careerCatalogue';
import type { RoleSkillRequirement } from '../types';
import {
  buildRoleExplanation,
} from '../lib/scoring';
import { calculatePathGapAnalysis } from '../lib/gapAnalysis';
import type { RoleExplanationOutput } from '../lib/ai-adapter';
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
  ErrorState,
} from '../components/DesignSystem';
import { ArrowLeft, ArrowRight, CheckCircle2, AlertTriangle, HelpCircle, Compass, Sparkles, AlertCircle } from 'lucide-react';

export const RoleDetail: React.FC = () => {
  const { roleSlug } = useParams<{ roleSlug: string }>();
  const navigate = useNavigate();
  const {
    skillObservations,
    selectedRoleId,
    setSelectedRoleId,
    showToast,
    explainRoleWithAI,
    consentGiven,
  } = useCareer();

  const [aiExplanation, setAiExplanation] = useState<RoleExplanationOutput | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const [aiNotice, setAiNotice] = useState<{ message: string; canRetry: boolean } | null>(null);

  const careerPath = roleSlug ? getCareerPathBySlug(roleSlug) : undefined;
  const role = (roleSlug ? ROLES_BY_SLUG.get(roleSlug) : undefined) || (careerPath ? asCareerRole(careerPath) : undefined);

  const gapAnalysis = React.useMemo(() => {
    if (!careerPath) return null;
    return calculatePathGapAnalysis(careerPath, skillObservations);
  }, [careerPath, skillObservations]);

  // Calculate rich role requirements
  const roleRequirements: RoleSkillRequirement[] = React.useMemo(() => {
    if (!role) return [];
    const seedReqs = SEED_ROLE_SKILL_REQUIREMENTS.filter(r => r.role_id === role.id);
    if (seedReqs.length > 0) return seedReqs;

    if (!careerPath) return [];

    const synthesized: RoleSkillRequirement[] = [];
    let order = 1;

    (careerPath.prerequisiteSkills || []).forEach((skillName, idx) => {
      synthesized.push({
        role_id: role.id,
        skill_id: 1000 + role.id * 100 + idx,
        target_level: 2,
        importance: 2,
        prerequisite_order: order++,
        rationale: `Foundational prerequisite capability (${skillName}) required for ${careerPath.title}.`,
        version: 'catalogue-v1',
      });
    });

    (careerPath.coreSkills || []).forEach((skillName, idx) => {
      synthesized.push({
        role_id: role.id,
        skill_id: 2000 + role.id * 100 + idx,
        target_level: 3,
        importance: 3,
        prerequisite_order: order++,
        rationale: `Core professional capability (${skillName}) required for ${careerPath.title}.`,
        version: 'catalogue-v1',
      });
    });

    return synthesized;
  }, [role, careerPath]);

  if (roleSlug === 'builder') {
    navigate('/paths/builder', { replace: true });
    return null;
  }

  if (!role) {
    return (
      <div style={{ maxWidth: '640px', margin: '40px auto' }}>
        <ErrorState
          title="Role Not Found"
          message={`We could not find a career role matching "${roleSlug}".`}
          action={
            <PrimaryButton onClick={() => navigate('/paths')}>
              Return to Role Comparison ↗
            </PrimaryButton>
          }
        />
      </div>
    );
  }

  // Create observations lookup map
  const obsMap = new Map<number | string, number | null>();
  Object.entries(skillObservations).forEach(([sId, val]) => {
    obsMap.set(Number(sId), val);
  });

  function getSkillMeta(skillId: number): { name: string; category: string } {
    const seedSkill = SKILLS_BY_ID.get(skillId);
    if (seedSkill) return { name: seedSkill.name, category: seedSkill.category };

    if (careerPath && role) {
      if (skillId >= 2000) {
        const idx = skillId - 2000 - role.id * 100;
        const name = careerPath.coreSkills[idx] || `Core Skill ${idx + 1}`;
        return { name, category: 'Core Competency' };
      }
      if (skillId >= 1000) {
        const idx = skillId - 1000 - role.id * 100;
        const name = careerPath.prerequisiteSkills[idx] || `Prerequisite ${idx + 1}`;
        return { name, category: 'Prerequisite' };
      }
    }

    return { name: `Skill ${skillId}`, category: 'General' };
  }

  // Calculate rich role assessment
  const explanation = buildRoleExplanation(role, roleRequirements, obsMap);
  const isSelected = selectedRoleId === role.id;
  const isConfident = explanation.state === 'confident';

  // Requirements in strict prerequisite order, then importance
  const requirements = [...roleRequirements].sort((a, b) => {
    if (a.prerequisite_order !== b.prerequisite_order) {
      return a.prerequisite_order - b.prerequisite_order;
    }
    return b.importance - a.importance;
  });

  const handleAdoptRole = () => {
    setSelectedRoleId(role.id);
    showToast(`Adopted ${role.name}. Opening custom roadmap.`);
    navigate('/roadmap');
  };

  const handleExplainAlignment = async () => {
    if (!consentGiven) {
      showToast('External AI requires privacy consent in Settings. Displaying deterministic breakdown.');
      return;
    }
    setIsExplaining(true);
    setAiNotice(null);
    try {
      const res = await explainRoleWithAI({
        roleId: String(role.id),
        roleName: role.name,
        assessedAlignment: explanation.alignment,
        coverage: explanation.coverage.coverageRatio,
        evidence: explanation.evidenceUsed.map(e => ({
          skill: String(e.skillId),
          observed: e.observedLevel,
          target: e.targetLevel,
          source: 'diagnostic-assessment',
        })),
        gaps: explanation.prioritizedGaps.map(g => ({
          skill: String(g.skillId),
          gap: g.gap,
          importance: g.importance,
          prerequisiteOrder: g.prerequisiteOrder,
        })),
        timeBudgetHours: 8,
        consent: true,
      });

      setAiExplanation(res.data);
      if (res.error) {
        setAiNotice({
          message: res.error.userNotice,
          canRetry: res.error.canRetry,
        });
        showToast(res.error.userNotice);
      } else {
        showToast('AI role alignment explanation generated.');
      }
    } catch {
      setAiNotice({
        message: 'AI assistant service encountered an issue. Switched to deterministic breakdown.',
        canRetry: true,
      });
    } finally {
      setIsExplaining(false);
    }
  };

  const topGap = explanation.prioritizedGaps[0];
  const topGapSkill = topGap ? getSkillMeta(Number(topGap.skillId)) : null;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* Navigation Breadcrumb */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <button
          type="button"
          onClick={() => navigate('/paths')}
          className="button-text"
          style={{ fontSize: '0.82rem' }}
        >
          <ArrowLeft size={14} aria-hidden="true" />
          <span>Back to All Paths</span>
        </button>

        <div />
      </div>

      {/* Page Header */}
      <header style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap' }}>
          <Eyebrow text={`PATH SPECIFICATION / ${role.level.toUpperCase()} LEVEL`} />
          {isSelected && <StatusBadge variant="tangerine" label="Active Target Role" />}
        </div>

        <DisplayHeading level={1}>{role.name}</DisplayHeading>

        <p className="muted-light" style={{ maxWidth: '720px', marginTop: '14px', fontSize: '1.05rem', lineHeight: 1.5 }}>
          {role.description}
        </p>

        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginTop: '16px', flexWrap: 'wrap' }}>
          <span className="source-label">{role.source_label}</span>
          <span style={{ fontSize: '0.76rem', color: 'var(--color-muted-light)', fontFamily: 'var(--font-mono)' }}>
            Checked: {role.source_checked_at || '2026-10-02'} · Version: {role.version}
          </span>
        </div>
      </header>

      {/* Topline Alignment & Coverage Banner */}
      <LinenCard style={{ marginBottom: '32px', padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <span style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-muted-dark)' }}>
              EVIDENCE-LED ALIGNMENT
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
              {isConfident ? (
                <>
                  <span style={{ fontSize: '3rem', fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--color-ink)', lineHeight: 1 }}>
                    {explanation.alignment}
                  </span>
                  <span style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-ink)' }}>%</span>
                </>
              ) : (
                <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-ink)' }}>
                  More evidence needed
                </span>
              )}
            </div>
            <p style={{ margin: '8px 0 0', fontSize: '0.82rem', color: 'var(--color-muted-dark)' }}>
              {isConfident
                ? `Calculated from ${explanation.evidenceUsed.length} verified competencies against role requirements.`
                : `Current coverage (${explanation.coverage.coveragePercent}%) is below the 60% threshold for confident comparison.`}
            </p>
          </div>

          <div style={{ textAlign: 'right', minWidth: '180px' }}>
            <span style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-muted-dark)' }}>
              REQUIREMENT COVERAGE
            </span>
            <div style={{ fontSize: '2rem', fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--color-ink)', margin: '4px 0 6px' }}>
              {explanation.coverage.coveragePercent}%
            </div>
            <ScoreMeter score={explanation.coverage.coveragePercent} />
          </div>
        </div>

        <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid rgba(0, 0, 0, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--color-muted-dark)' }}>
            <strong>Evidence summary:</strong> {explanation.evidenceUsed.length} verified · {explanation.prioritizedGaps.length} gaps · {explanation.unknowns.length} unassessed
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <SecondaryButton
              onClick={handleExplainAlignment}
              disabled={isExplaining}
              icon={<Sparkles size={14} />}
            >
              {isExplaining ? 'Analyzing Alignment...' : 'Explain Alignment with AI ↗'}
            </SecondaryButton>
            <PrimaryButton onClick={handleAdoptRole} icon={<ArrowRight size={15} />}>
              {isSelected ? 'View Roadmap ↗' : 'Set as Active Target Path ↗'}
            </PrimaryButton>
          </div>
        </div>
      </LinenCard>

      {/* Inline AI notice with calm message and retry */}
      {aiNotice && (
        <div
          style={{
            marginBottom: '20px',
            padding: '12px 16px',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(255, 109, 31, 0.12)',
            border: '1px solid var(--color-tangerine)',
            color: 'var(--color-linen)',
            fontSize: '0.82rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
          role="status"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={15} color="var(--color-tangerine)" style={{ flexShrink: 0 }} />
            <span>{aiNotice.message}</span>
          </div>
          {aiNotice.canRetry && (
            <button
              type="button"
              onClick={handleExplainAlignment}
              className="button-text"
              style={{ fontSize: '0.76rem', color: 'var(--color-tangerine)', fontWeight: 700, flexShrink: 0 }}
            >
              Retry ↺
            </button>
          )}
        </div>
      )}

      {/* AI Alignment Explanation Card */}
      {aiExplanation && (
        <DarkCard style={{ marginBottom: '32px', padding: '28px', border: '1px solid var(--color-tangerine)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span
                style={{
                  background: 'rgba(255, 109, 31, 0.15)',
                  color: 'var(--color-tangerine)',
                  border: '1px solid var(--color-tangerine)',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '3px 10px',
                  borderRadius: 'var(--radius-pill)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Sparkles size={11} aria-hidden="true" />
                AI suggestion — review before using
              </span>
              <span style={{ fontSize: '0.74rem', color: 'var(--color-muted-light)' }}>
                Deterministic score preserved: <strong>{explanation.alignment ?? 'N/A'}%</strong>
              </span>
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--color-cotton)' }}>
              Confidence: {aiExplanation.confidence}
            </span>
          </div>

          <h3 style={{ margin: '0 0 12px', color: 'var(--color-linen)', fontSize: '1.2rem' }}>
            Why This Role May Fit
          </h3>
          <ul style={{ margin: '0 0 18px', paddingLeft: '20px', color: 'var(--color-muted-light)', fontSize: '0.86rem', lineHeight: 1.6 }}>
            {aiExplanation.whyItMayFit.map((pt, i) => (
              <li key={i}>{pt}</li>
            ))}
          </ul>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '18px' }}>
            <div>
              <h4 style={{ margin: '0 0 6px', fontSize: '0.84rem', color: 'var(--color-cotton)', textTransform: 'uppercase' }}>
                Known Gaps
              </h4>
              <ul style={{ margin: 0, paddingLeft: '18px', color: 'var(--color-muted-light)', fontSize: '0.82rem', lineHeight: 1.5 }}>
                {aiExplanation.knownGaps.map((g, i) => (
                  <li key={i}>{g}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 style={{ margin: '0 0 6px', fontSize: '0.84rem', color: 'var(--color-cotton)', textTransform: 'uppercase' }}>
                Unassessed Skills
              </h4>
              <ul style={{ margin: 0, paddingLeft: '18px', color: 'var(--color-muted-light)', fontSize: '0.82rem', lineHeight: 1.5 }}>
                {aiExplanation.unknowns.map((u, i) => (
                  <li key={i}>{u}</li>
                ))}
              </ul>
            </div>
          </div>

          <div style={{ padding: '12px 16px', background: 'var(--color-black-soft)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-line-dark)' }}>
            <span style={{ fontSize: '0.74rem', color: 'var(--color-tangerine)', fontWeight: 700, textTransform: 'uppercase' }}>
              Recommended Next Action:
            </span>
            <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: 'var(--color-linen)' }}>
              {aiExplanation.nextAction}
            </p>
          </div>

          <p style={{ margin: '14px 0 0', fontSize: '0.72rem', color: 'var(--color-muted-light)', fontStyle: 'italic' }}>
            {aiExplanation.caveat}
          </p>
        </DarkCard>
      )}

      {/* Why This Pathway Fits */}
      <DarkCard style={{ marginBottom: '32px', padding: '28px', border: '1px solid var(--color-line-dark)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <Sparkles size={16} color="var(--color-tangerine)" aria-hidden="true" />
          <Eyebrow text="ROLE ALIGNMENT & FIT" />
        </div>
        <h2 style={{ fontSize: '1.3rem', color: 'var(--color-linen)', margin: '0 0 10px' }}>
          Why this career path fits
        </h2>
        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-cotton)', lineHeight: 1.55 }}>
          {(careerPath as unknown as { whyItFits?: string })?.whyItFits || (aiExplanation?.whyItMayFit && aiExplanation.whyItMayFit[0]) || careerPath?.description || 'Structured career pathway matching your indicated technical competencies and domain interests.'}
        </p>
      </DarkCard>

      {/* First Hands-on Project Deliverable */}
      {careerPath?.firstProjectDeliverable && (
        <CottonCard style={{ marginBottom: '32px', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <Compass size={16} color="var(--color-ink)" aria-hidden="true" />
            <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-ink)', textTransform: 'uppercase' }}>
              FIRST HANDS-ON PROJECT DELIVERABLE
            </span>
          </div>
          <h3 style={{ margin: '0 0 6px', fontSize: '1.15rem', color: 'var(--color-ink)' }}>
            {careerPath.firstProjectDeliverable}
          </h3>
          <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--color-muted-dark)' }}>
            Build early concrete portfolio proof before advancing to complex architecture.
          </p>
        </CottonCard>
      )}

      {/* First Next Best Action Banner */}
      <div style={{ marginBottom: '36px' }}>
        {topGap ? (
          <DarkCard
            style={{
              padding: '28px',
              border: '1px solid var(--color-tangerine)',
              background: 'linear-gradient(135deg, rgba(255, 109, 31, 0.12) 0%, var(--color-black-hole) 100%)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-tangerine)' }} />
                  <span style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)', color: 'var(--color-tangerine)', fontWeight: 700 }}>
                    FIRST PRIORITY ACTION (PREREQUISITE {topGap.prerequisiteOrder})
                  </span>
                </div>
                <h3 style={{ margin: '0 0 6px', fontSize: '1.25rem', color: 'var(--color-linen)' }}>
                  Bridge competency gap: {topGapSkill?.name || `Skill ${topGap.skillId}`}
                </h3>
                <p className="muted-light" style={{ margin: 0, fontSize: '0.84rem', maxWidth: '640px' }}>
                  {topGap.rationale || 'Target Level requirement not yet evidenced.'}
                  {' '}(Requires Level {topGap.targetLevel}, currently {topGap.observedLevel !== null ? `Level ${topGap.observedLevel}` : 'unassessed'}).
                </p>
              </div>

              <PrimaryButton onClick={() => navigate('/roadmap')} icon={<ArrowRight size={14} />}>
                Add to Roadmap ↗
              </PrimaryButton>
            </div>
          </DarkCard>
        ) : (
          <CottonCard style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ margin: '0 0 4px', fontSize: '1.05rem', color: 'var(--color-ink)' }}>
                  Take the diagnostic to discover your priority gap
                </h3>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-ink)' }}>
                  Assessment not completed. Evidence is not available for these requirements yet. Take the diagnostic or add a verified project/resume fact.
                </p>
              </div>
              <PrimaryButton onClick={() => navigate('/assessment')} icon={<Compass size={14} />}>
                Start Diagnostic ↗
              </PrimaryButton>
            </div>
          </CottonCard>
        )}
      </div>

      {/* No Diagnostic Evidence Banner */}
      {gapAnalysis && !gapAnalysis.hasDiagnosticEvidence && (
        <DarkCard
          style={{
            marginBottom: '32px',
            padding: '20px 24px',
            border: '1px solid var(--color-tangerine)',
            background: 'linear-gradient(135deg, rgba(255, 109, 31, 0.12) 0%, var(--color-black-hole) 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '280px' }}>
              <AlertCircle size={20} color="var(--color-tangerine)" style={{ flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '0.9rem', color: 'var(--color-linen)', fontWeight: 600 }}>
                  Assessment not completed. Evidence is not available for these requirements yet. Take the diagnostic or add a verified project/resume fact.
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--color-cotton)', marginTop: '4px' }}>
                  Requirements below are marked as unassessed rather than penalized as confirmed gaps.
                </div>
              </div>
            </div>
            <PrimaryButton onClick={() => navigate('/assessment')} icon={<Compass size={14} />}>
              Start Diagnostic ↗
            </PrimaryButton>
          </div>
        </DarkCard>
      )}

      {/* Prerequisite-Aware Competencies & Gaps List */}
      <section style={{ marginBottom: '40px' }} aria-labelledby="competencies-heading">
        <div style={{ marginBottom: '20px' }}>
          <h2 id="competencies-heading" style={{ fontSize: '1.35rem', color: 'var(--color-linen)', margin: '0 0 8px' }}>
            Prerequisite Competencies & Gaps
          </h2>
          <p className="muted-light" style={{ fontSize: '0.86rem', margin: 0 }}>
            Ordered strictly by learning dependency sequence. Foundational skills are listed before framework specializations.
          </p>
        </div>

        <div style={{ display: 'grid', gap: '14px' }}>
          {requirements.map(req => {
            const skill = getSkillMeta(req.skill_id);
            const observed = obsMap.get(req.skill_id);
            const isAssessed = observed !== undefined && observed !== null;
            const gap = isAssessed ? Math.max(0, req.target_level - observed) : req.target_level;
            const isMet = isAssessed && observed >= req.target_level;

            return (
              <DarkCard
                key={req.skill_id}
                style={{
                  padding: '22px 26px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '16px',
                  border: isMet
                    ? '1px solid rgba(86, 204, 138, 0.3)'
                    : isAssessed && gap > 0
                    ? '1px solid rgba(255, 109, 31, 0.3)'
                    : '1px solid var(--color-line-dark)',
                }}
              >
                <div style={{ flex: 1, minWidth: '280px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.72rem',
                        padding: '3px 8px',
                        borderRadius: 'var(--radius-pill)',
                        background: 'rgba(255, 255, 255, 0.05)',
                        color: 'var(--color-cotton)',
                      }}
                    >
                      PREREQUISITE 0{req.prerequisite_order}
                    </span>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--color-linen)' }}>
                      {skill?.name || `Skill ${req.skill_id}`}
                    </h3>
                    <ProgressPill label={skill?.category || 'General'} />
                    <span className="source-label">Importance: {req.importance}/3</span>
                  </div>

                  <p className="muted-light" style={{ margin: '6px 0 0', fontSize: '0.82rem', lineHeight: 1.45 }}>
                    <strong>Why it matters:</strong> {req.rationale}
                  </p>
                </div>

                {/* Level Comparison */}
                <div style={{ textAlign: 'right', minWidth: '160px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', marginBottom: '4px' }}>
                    {isMet ? (
                      <CheckCircle2 size={16} style={{ color: 'var(--color-success)' }} />
                    ) : isAssessed ? (
                      <AlertTriangle size={16} style={{ color: 'var(--color-tangerine)' }} />
                    ) : (
                      <HelpCircle size={16} style={{ color: 'var(--color-cotton)' }} />
                    )}
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.88rem',
                        fontWeight: 700,
                        color: isMet ? 'var(--color-success)' : isAssessed ? 'var(--color-tangerine)' : 'var(--color-linen)',
                      }}
                    >
                      {isAssessed ? `Observed ${observed}/4` : 'Unassessed'}
                    </span>
                  </div>

                  <span style={{ fontSize: '0.74rem', color: 'var(--color-muted-light)' }}>
                    Target Level {req.target_level}/4
                  </span>
                </div>
              </DarkCard>
            );
          })}
        </div>
      </section>

      {/* 5-Phase Staged Curriculum Roadmap */}
      <section style={{ marginBottom: '40px' }} aria-labelledby="curriculum-heading">
        <div style={{ marginBottom: '20px' }}>
          <h2 id="curriculum-heading" style={{ fontSize: '1.35rem', color: 'var(--color-linen)', margin: '0 0 8px' }}>
            5-Phase Staged Curriculum Roadmap
          </h2>
          <p className="muted-light" style={{ fontSize: '0.86rem', margin: 0 }}>
            Paced curriculum milestones with verified deliverables and estimated effort for this path.
          </p>
        </div>

        {careerPath?.curriculum && careerPath.curriculum.length > 0 ? (
          <div style={{ display: 'grid', gap: '14px' }}>
            {careerPath.curriculum.map((phase, idx) => (
              <DarkCard
                key={phase.id || idx}
                style={{
                  padding: '20px 24px',
                  border: '1px solid var(--color-line-dark)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <StatusBadge variant="linen" label={`Phase 0${idx + 1} (${phase.phase})`} />
                    <h3 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--color-linen)' }}>
                      {phase.title}
                    </h3>
                  </div>
                  <span style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: 'var(--color-tangerine)' }}>
                    ~{phase.estimatedHours || 8} hrs estimated
                  </span>
                </div>

                <p className="muted-light" style={{ margin: '0 0 8px', fontSize: '0.84rem', lineHeight: 1.45 }}>
                  <strong>Focus:</strong> {phase.whyItMatters}
                </p>

                <div style={{ padding: '8px 12px', background: 'var(--color-black-soft)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-line-dark)', fontSize: '0.78rem', color: 'var(--color-cotton)' }}>
                  <strong style={{ color: 'var(--color-tangerine)' }}>Milestone Deliverable: </strong>
                  {phase.deliverable}
                </div>
              </DarkCard>
            ))}
          </div>
        ) : (
          <DarkCard style={{ padding: '24px', textAlign: 'center' }}>
            <p style={{ margin: 0, color: 'var(--color-muted-light)', fontSize: '0.9rem' }}>
              Curriculum content pending review
            </p>
          </DarkCard>
        )}
      </section>

      {/* Bottom CTA */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--color-line-dark)', paddingTop: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <button
          type="button"
          onClick={() => navigate('/paths')}
          className="button-text"
          style={{ fontSize: '0.82rem' }}
        >
          <ArrowLeft size={14} aria-hidden="true" />
          <span>Compare Other Paths</span>
        </button>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <SecondaryButton
            onClick={() => {
              const el = document.getElementById('competencies-heading');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
              else navigate('/assessment');
            }}
          >
            View Competency Gaps ↓
          </SecondaryButton>
          <SecondaryButton onClick={() => navigate('/assessment')}>
            Take Diagnostic ↗
          </SecondaryButton>
          <PrimaryButton onClick={handleAdoptRole} icon={<ArrowRight size={14} />}>
            Open Roadmap for {role.name} ↗
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
};
