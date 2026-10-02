/**
 * Pure and deterministic scoring engine for CareerAI.
 * Implements the mathematical formulas and boundary rules from PRD Section 5.
 */

export interface RoleSkillRequirement {
  skillId: string;
  targetLevel: number; // 1 to 4
  importance: number; // 1 to 3
  prerequisiteOrder: number;
  rationale: string;
}

export interface SkillObservation {
  skillId: string;
  value: number | null; // 0 to 4 or null if unknown
  source: 'diagnostic' | 'self_report' | 'self_attested_project' | 'reviewed_project';
  observedAt: string;
  rubricVersion?: string;
  confidence?: 'High' | 'Medium' | 'Needs more evidence';
}

export interface RoleScoringResult {
  roleId: string;
  coverage: number; // 0 to 1 float
  coveragePercent: number; // 0 to 100 rounded
  alignment: number | null; // 0 to 100 or null if no known skills or < 60% coverage
  isSufficientCoverage: boolean; // coverage >= 0.60
  statusMessage: string;
  gaps: SkillGapItem[];
}

export interface SkillGapItem {
  skillId: string;
  targetLevel: number;
  observedLevel: number | null;
  gap: number; // max(target - observed, 0)
  importance: number;
  prerequisiteOrder: number;
  isAssessed: boolean;
  priorityScore: number; // importance * gap
}

/**
 * Calculates evidence coverage for a role based on observed skills.
 * coverage = sum(known requirement weights) / sum(all requirement weights)
 */
export function calculateCoverage(
  requirements: RoleSkillRequirement[],
  observations: Map<string, number | null>
): number {
  if (requirements.length === 0) return 0;

  const totalWeight = requirements.reduce((acc, req) => acc + req.importance, 0);
  if (totalWeight === 0) return 0;

  const knownWeight = requirements.reduce((acc, req) => {
    const obs = observations.get(req.skillId);
    // null is unknown; 0 is a known measured zero
    if (obs !== undefined && obs !== null) {
      return acc + req.importance;
    }
    return acc;
  }, 0);

  return knownWeight / totalWeight;
}

/**
 * Calculates assessed alignment:
 * alignment = 100 * sum(weight * min(observed / target, 1)) / sum(known weights)
 * Returns null if no known skills exist.
 */
export function calculateAlignment(
  requirements: RoleSkillRequirement[],
  observations: Map<string, number | null>
): number | null {
  const knownReqs = requirements.filter(req => {
    const obs = observations.get(req.skillId);
    return obs !== undefined && obs !== null;
  });

  if (knownReqs.length === 0) {
    return null;
  }

  const knownWeightTotal = knownReqs.reduce((acc, req) => acc + req.importance, 0);
  if (knownWeightTotal === 0) return null;

  const weightedSum = knownReqs.reduce((acc, req) => {
    const obs = observations.get(req.skillId)!;
    const ratio = Math.min(obs / req.targetLevel, 1);
    return acc + req.importance * ratio;
  }, 0);

  const rawAlignment = (100 * weightedSum) / knownWeightTotal;
  return Math.round(rawAlignment);
}

/**
 * Evaluates skill gaps according to the spec:
 * Grouped/sorted by prerequisite order first, then (importance * gap) descending.
 */
export function calculateSkillGaps(
  requirements: RoleSkillRequirement[],
  observations: Map<string, number | null>
): SkillGapItem[] {
  const gaps: SkillGapItem[] = requirements.map(req => {
    const obs = observations.get(req.skillId);
    const isAssessed = obs !== undefined && obs !== null;
    const observedLevel = isAssessed ? obs : null;
    const gap = isAssessed ? Math.max(req.targetLevel - observedLevel!, 0) : req.targetLevel;
    const priorityScore = req.importance * gap;

    return {
      skillId: req.skillId,
      targetLevel: req.targetLevel,
      observedLevel,
      gap,
      importance: req.importance,
      prerequisiteOrder: req.prerequisiteOrder,
      isAssessed,
      priorityScore,
    };
  });

  // Sort by prerequisite order first, then priorityScore descending
  return gaps.sort((a, b) => {
    if (a.prerequisiteOrder !== b.prerequisiteOrder) {
      return a.prerequisiteOrder - b.prerequisiteOrder;
    }
    return b.priorityScore - a.priorityScore;
  });
}

/**
 * Full role scoring evaluator complying strictly with PRD Section 5:
 * - null means unknown, never zero
 * - No known skills: alignment is null; show "Take the diagnostic"
 * - Below 60% coverage: show "More evidence needed", not a precise role rank
 * - At/above 60%: display rounded assessed skill alignment with coverage adjacent
 */
export function evaluateRoleFit(
  roleId: string,
  requirements: RoleSkillRequirement[],
  observations: Map<string, number | null>
): RoleScoringResult {
  const coverage = calculateCoverage(requirements, observations);
  const coveragePercent = Math.round(coverage * 100);
  const gaps = calculateSkillGaps(requirements, observations);

  const hasAnyKnownSkills = Array.from(observations.values()).some(
    val => val !== null && val !== undefined
  );

  if (!hasAnyKnownSkills) {
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

  const isSufficientCoverage = coverage >= 0.6;
  const rawAlignment = calculateAlignment(requirements, observations);

  if (!isSufficientCoverage) {
    return {
      roleId,
      coverage,
      coveragePercent,
      alignment: null, // do not display precision without sufficient coverage
      isSufficientCoverage: false,
      statusMessage: 'More evidence needed',
      gaps,
    };
  }

  return {
    roleId,
    coverage,
    coveragePercent,
    alignment: rawAlignment,
    isSufficientCoverage: true,
    statusMessage: `${rawAlignment}% assessed alignment (${coveragePercent}% coverage)`,
    gaps,
  };
}
