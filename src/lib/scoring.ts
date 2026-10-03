/**
 * Pure and deterministic scoring engine for CareerAI.
 * Implements the mathematical formulas, boundary rules, and rich explanation
 * contracts from PRD Section 5. Zero external AI calls.
 */

import type {
  CareerRole,
  RoleSkillRequirement,
  Skill,
  SkillObservation,
  AssessmentQuestion,
} from '../types';

export interface AssessmentScoreResult {
  skillId: number;
  totalQuestions: number;
  correctCount: number;
  unansweredCount: number;
  accuracyRatio: number;
  diagnosticEstimate: number | null; // coarse 0-4 or null if unanswered
}

export interface RoleCoverageResult {
  coverageRatio: number; // 0 to 1 float
  coveragePercent: number; // 0 to 100 rounded
  knownWeight: number;
  totalWeight: number;
  isSufficient: boolean; // coverage >= 0.60
}

export interface AssessedAlignmentResult {
  alignmentPercent: number | null; // 0-100 or null if coverage < 60% or no known skills
  state: 'confident' | 'more-evidence-needed' | 'unassessed';
  coverage: RoleCoverageResult;
  scale: '0-100%';
  caveat: string;
}

export interface SkillGapItem {
  skillId: number | string;
  targetLevel: number;
  observedLevel: number | null;
  gap: number; // max(target - observed, 0)
  importance: number;
  prerequisiteOrder: number;
  isAssessed: boolean;
  priorityScore: number; // importance * gap
  rationale?: string;
}

export interface RichRoleAssessment {
  roleId: number | string;
  roleSlug: string;
  roleName: string;
  state: 'confident' | 'more-evidence-needed' | 'unassessed';
  alignment: number | null; // 0-100 or null
  scale: '0-100%';
  coverage: RoleCoverageResult;
  source: string;
  version: string;
  evidenceUsed: Array<{ skillId: number | string; observedLevel: number; targetLevel: number }>;
  unknowns: Array<{ skillId: number | string; targetLevel: number }>;
  knownGaps: SkillGapItem[];
  prioritizedGaps: SkillGapItem[];
  caveat: string;
}

export interface PlanCompletionResult {
  completedTasks: number;
  totalTasks: number;
  completedHours: number;
  totalHours: number;
  planCompletionPercent: number; // 0-100
  label: 'Plan Completion (Effort Tracking Only)';
  caveat: string;
}

/**
 * 1. scoreAssessmentAnswers
 * Grades answered diagnostic questions deterministically per skill.
 * Unanswered questions are NOT marked as incorrect answers; they remain unassessed.
 */
export function scoreAssessmentAnswers(
  questions: AssessmentQuestion[],
  answers: Record<string, 'a' | 'b' | 'c' | 'd'>
): AssessmentScoreResult[] {
  const skillBuckets = new Map<number, { correct: number; total: number; unanswered: number }>();

  questions.forEach(q => {
    if (!skillBuckets.has(q.skill_id)) {
      skillBuckets.set(q.skill_id, { correct: 0, total: 0, unanswered: 0 });
    }
    const bucket = skillBuckets.get(q.skill_id)!;
    bucket.total += 1;

    const selected = answers[q.id];
    if (!selected) {
      bucket.unanswered += 1;
    } else if (selected === q.correct_key) {
      bucket.correct += 1;
    }
  });

  const results: AssessmentScoreResult[] = [];
  skillBuckets.forEach((bucket, skillId) => {
    const answeredCount = bucket.total - bucket.unanswered;
    if (answeredCount === 0) {
      results.push({
        skillId,
        totalQuestions: bucket.total,
        correctCount: 0,
        unansweredCount: bucket.unanswered,
        accuracyRatio: 0,
        diagnosticEstimate: null, // Unassessed
      });
      return;
    }

    const accuracy = bucket.correct / answeredCount;
    // Map accuracy to coarse 0-4 estimate:
    // >= 0.85 -> Level 3-4, >= 0.5 -> Level 2, > 0 -> Level 1, 0 -> Level 0 (measured 0)
    let estimate: number;
    if (accuracy >= 0.85) estimate = 3;
    else if (accuracy >= 0.5) estimate = 2;
    else if (accuracy > 0) estimate = 1;
    else estimate = 0;

    results.push({
      skillId,
      totalQuestions: bucket.total,
      correctCount: bucket.correct,
      unansweredCount: bucket.unanswered,
      accuracyRatio: accuracy,
      diagnosticEstimate: estimate,
    });
  });

  return results;
}

/**
 * 2. buildSkillObservations
 * Converts diagnostic results into typed SkillObservation records.
 */
export function buildSkillObservations(
  scoreResults: AssessmentScoreResult[],
  source: 'diagnostic' = 'diagnostic'
): SkillObservation[] {
  const now = new Date().toISOString();
  return scoreResults.map(res => ({
    skill_id: res.skillId,
    value: res.diagnosticEstimate !== null ? Math.min(Math.max(res.diagnosticEstimate, 0), 4) : null,
    source,
    observedAt: now,
    rubricVersion: 'v1.0',
    confidence: res.unansweredCount === 0 ? 'High' : 'Needs more evidence',
  }));
}

/**
 * 3. calculateRoleCoverage
 * coverage = sum(known requirement weights) / sum(all requirement weights)
 */
export function calculateRoleCoverage(
  requirements: Array<{ skill_id?: number | string; skillId?: number | string; importance: number }>,
  observations: Map<number | string, number | null>
): RoleCoverageResult {
  if (requirements.length === 0) {
    return {
      coverageRatio: 0,
      coveragePercent: 0,
      knownWeight: 0,
      totalWeight: 0,
      isSufficient: false,
    };
  }

  const totalWeight = requirements.reduce((acc, r) => acc + r.importance, 0);
  if (totalWeight === 0) {
    return {
      coverageRatio: 0,
      coveragePercent: 0,
      knownWeight: 0,
      totalWeight: 0,
      isSufficient: false,
    };
  }

  const knownWeight = requirements.reduce((acc, req) => {
    const key = (req.skill_id ?? req.skillId)!;
    const obs = observations.get(key);
    // null is unknown; 0 is a known measured zero
    if (obs !== undefined && obs !== null) {
      return acc + req.importance;
    }
    return acc;
  }, 0);

  const coverageRatio = knownWeight / totalWeight;
  return {
    coverageRatio,
    coveragePercent: Math.round(coverageRatio * 100),
    knownWeight,
    totalWeight,
    isSufficient: coverageRatio >= 0.6,
  };
}

/**
 * 4. calculateAssessedAlignment
 * alignment = 100 * sum(weight * min(observed / target, 1)) / sum(known weights)
 * - Returns null and 'unassessed' if no known skills exist.
 * - Returns null and 'more-evidence-needed' if coverage < 60%.
 * - Observed values above target are strictly capped at target.
 */
export function calculateAssessedAlignment(
  requirements: Array<{ skill_id?: number | string; skillId?: number | string; target_level?: number; targetLevel?: number; importance: number }>,
  observations: Map<number | string, number | null>
): AssessedAlignmentResult {
  const coverage = calculateRoleCoverage(requirements, observations);

  if (coverage.knownWeight === 0) {
    return {
      alignmentPercent: null,
      state: 'unassessed',
      coverage,
      scale: '0-100%',
      caveat: 'Take the diagnostic to measure verified alignment.',
    };
  }

  if (!coverage.isSufficient) {
    return {
      alignmentPercent: null,
      state: 'more-evidence-needed',
      coverage,
      scale: '0-100%',
      caveat: 'Coverage is below 60%. Diagnostic estimate is not yet confident.',
    };
  }

  let weightedAligned = 0;
  requirements.forEach(req => {
    const key = (req.skill_id ?? req.skillId)!;
    const target = (req.target_level ?? req.targetLevel)!;
    const obs = observations.get(key);
    if (obs !== undefined && obs !== null) {
      // Clamped to 0..target to prevent exceeding scale
      const validObs = Math.max(obs, 0);
      const capped = Math.min(validObs, target);
      weightedAligned += (capped / target) * req.importance;
    }
  });

  const rawAlignment = (100 * weightedAligned) / coverage.knownWeight;
  const alignmentPercent = Math.min(Math.max(Math.round(rawAlignment), 0), 100);

  return {
    alignmentPercent,
    state: 'confident',
    coverage,
    scale: '0-100%',
    caveat: 'Assessed alignment is based on demonstrated diagnostic evidence. Not a placement guarantee.',
  };
}

/**
 * 5. calculateKnownGaps
 * known_gap = max(target - observed, 0)
 */
export function calculateKnownGaps(
  requirements: Array<{ skill_id?: number | string; skillId?: number | string; target_level?: number; targetLevel?: number; importance: number; prerequisite_order?: number; prerequisiteOrder?: number; rationale?: string }>,
  observations: Map<number | string, number | null>
): SkillGapItem[] {
  return requirements.map(req => {
    const key = (req.skill_id ?? req.skillId)!;
    const target = (req.target_level ?? req.targetLevel)!;
    const order = (req.prerequisite_order ?? req.prerequisiteOrder ?? 1);
    const obs = observations.get(key);
    const isAssessed = obs !== undefined && obs !== null;
    const observedLevel = isAssessed ? Math.max(obs!, 0) : null;
    const gap = isAssessed ? Math.max(target - observedLevel!, 0) : target;
    const priorityScore = req.importance * gap;

    return {
      skillId: key,
      targetLevel: target,
      observedLevel,
      gap,
      importance: req.importance,
      prerequisiteOrder: order,
      isAssessed,
      priorityScore,
      rationale: req.rationale,
    };
  });
}

/**
 * 6. prioritiseGaps
 * Sorts by prerequisite order first (foundations before applications),
 * then by priority score (importance * gap) descending.
 */
export function prioritiseGaps(gaps: SkillGapItem[]): SkillGapItem[] {
  return [...gaps].sort((a, b) => {
    if (a.prerequisiteOrder !== b.prerequisiteOrder) {
      return a.prerequisiteOrder - b.prerequisiteOrder;
    }
    return b.priorityScore - a.priorityScore;
  });
}

/**
 * 7. sortRoleAssessments
 * Sorts adequately covered roles (coverage >= 60%) by alignment descending.
 * Tie-breaks deterministically by stable role slug.
 * Under-covered roles follow afterward, also sorted deterministically.
 */
export function sortRoleAssessments(assessments: RichRoleAssessment[]): RichRoleAssessment[] {
  return [...assessments].sort((a, b) => {
    // Both confident
    if (a.state === 'confident' && b.state === 'confident') {
      if (a.alignment !== b.alignment) {
        return (b.alignment ?? 0) - (a.alignment ?? 0);
      }
      return a.roleSlug.localeCompare(b.roleSlug);
    }
    // Confident before non-confident
    if (a.state === 'confident' && b.state !== 'confident') return -1;
    if (a.state !== 'confident' && b.state === 'confident') return 1;

    // Both non-confident: sort by coverage descending, then slug
    if (a.coverage.coverageRatio !== b.coverage.coverageRatio) {
      return b.coverage.coverageRatio - a.coverage.coverageRatio;
    }
    return a.roleSlug.localeCompare(b.roleSlug);
  });
}

/**
 * 8. buildRoleExplanation
 * Returns a complete, grounded RichRoleAssessment object with evidence used,
 * unknowns, known gaps, and trust caveat.
 */
export function buildRoleExplanation(
  role: CareerRole,
  requirements: RoleSkillRequirement[],
  observations: Map<number | string, number | null>,
  _skillsMap?: Map<number, Skill>
): RichRoleAssessment {
  const roleReqs = requirements.filter(r => r.role_id === role.id);
  const alignmentResult = calculateAssessedAlignment(roleReqs, observations);
  const gaps = calculateKnownGaps(roleReqs, observations);
  const prioritized = prioritiseGaps(gaps);

  const evidenceUsed: Array<{ skillId: number | string; observedLevel: number; targetLevel: number }> = [];
  const unknowns: Array<{ skillId: number | string; targetLevel: number }> = [];

  roleReqs.forEach(req => {
    const obs = observations.get(req.skill_id);
    if (obs !== undefined && obs !== null) {
      evidenceUsed.push({
        skillId: req.skill_id,
        observedLevel: obs,
        targetLevel: req.target_level,
      });
    } else {
      unknowns.push({
        skillId: req.skill_id,
        targetLevel: req.target_level,
      });
    }
  });

  return {
    roleId: role.id,
    roleSlug: role.slug,
    roleName: role.name,
    state: alignmentResult.state,
    alignment: alignmentResult.alignmentPercent,
    scale: '0-100%',
    coverage: alignmentResult.coverage,
    source: role.source_label,
    version: role.version,
    evidenceUsed,
    unknowns,
    knownGaps: gaps,
    prioritizedGaps: prioritized,
    caveat:
      'CareerAI uses deterministic rubrics to compare measured evidence. No salary prediction, placement probability, or ATS pass score is calculated.',
  };
}

/**
 * 9. calculatePlanCompletion
 * Progress = completed planned effort / total planned effort
 * Explicitly labeled as plan completion, never skill mastery.
 */
export function calculatePlanCompletion(
  tasks: Array<{ status: string; estimatedHours?: number }>
): PlanCompletionResult {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const totalHours = tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
  const completedHours = tasks
    .filter(t => t.status === 'completed')
    .reduce((sum, t) => sum + (t.estimatedHours || 0), 0);

  const planCompletionPercent =
    totalHours > 0
      ? Math.round((completedHours / totalHours) * 100)
      : totalTasks > 0
      ? Math.round((completedTasks / totalTasks) * 100)
      : 0;

  return {
    completedTasks,
    totalTasks,
    completedHours,
    totalHours,
    planCompletionPercent,
    label: 'Plan Completion (Effort Tracking Only)',
    caveat:
      'Plan completion measures effort expended on learning deliverables. It does not certify skill mastery or placement readiness.',
  };
}

// -------------------------------------------------------------
// Legacy Aliases for Existing Phase 1 Consumers
// -------------------------------------------------------------
export type LegacyRequirement = {
  skill_id?: number | string;
  skillId?: string | number;
  target_level?: number;
  targetLevel?: number;
  importance: number;
  prerequisite_order?: number;
  prerequisiteOrder?: number;
  rationale?: string;
};

export const calculateCoverage = (
  requirements: LegacyRequirement[],
  observations: Map<string | number, number | null>
): number => calculateRoleCoverage(requirements, observations).coverageRatio;

export const calculateAlignment = (
  requirements: LegacyRequirement[],
  observations: Map<string | number, number | null>
): number | null => {
  const res = calculateAssessedAlignment(requirements, observations);
  return res.alignmentPercent;
};

export const calculateSkillGaps = (
  requirements: LegacyRequirement[],
  observations: Map<string | number, number | null>
): SkillGapItem[] => prioritiseGaps(calculateKnownGaps(requirements, observations));

export const evaluateRoleFit = (
  roleId: string,
  requirements: LegacyRequirement[],
  observations: Map<string | number, number | null>
) => {
  const cov = calculateRoleCoverage(requirements, observations);
  const align = calculateAssessedAlignment(requirements, observations);
  const gaps = calculateSkillGaps(requirements, observations);

  const hasAnyKnown = Array.from(observations.values()).some(v => v !== null && v !== undefined);

  if (!hasAnyKnown) {
    return {
      roleId,
      coverage: 0,
      coveragePercent: 0,
      alignment: null,
      isSufficientCoverage: false,
      statusMessage: 'Take the diagnostic',
      gaps,
    };
  }

  return {
    roleId,
    coverage: cov.coverageRatio,
    coveragePercent: cov.coveragePercent,
    alignment: align.alignmentPercent,
    isSufficientCoverage: cov.isSufficient,
    statusMessage: cov.isSufficient
      ? `${align.alignmentPercent}% assessed alignment (${cov.coveragePercent}% coverage)`
      : 'More evidence needed',
    gaps,
  };
};
