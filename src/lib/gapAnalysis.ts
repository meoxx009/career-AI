/**
 * Comprehensive, explainable Path-to-Skill-Gap Analysis Engine.
 *
 * Rules:
 * - null means strictly unknown (not assessed);
 * - unknown is NOT zero;
 * - unassessed is NOT a confirmed gap;
 * - low coverage shows "More evidence needed";
 * - no fake readiness percentages;
 * - no hiring, admission, or placement predictions;
 * - interest, degree title, or college name are NEVER treated as skill evidence.
 */

import type {
  CareerPath,
  PathSkillRequirement,
  SkillEvidenceSource,
} from '../types';
import { SKILLS_CATALOGUE, getSkillBySlug } from '../data/skillCatalogue';
import { SEED_SKILLS } from '../data/seedData';

export type SkillEvidenceState =
  | 'evidenced'
  | 'partially_evidenced'
  | 'assessed_gap'
  | 'unassessed';

export interface PathSkillGapItem {
  skillId: string;
  skillName: string;
  category: string;
  targetLevel: number;
  currentEvidenceLevel: number | null;
  importance: number;
  prerequisiteOrder: number;
  evidenceState: SkillEvidenceState;
  evidenceSources: SkillEvidenceSource[];
  activeEvidenceSource: string;
  gapSize: number;
  isAssessed: boolean;
  whyItMatters: string;
  nextAction: string;
}

export interface PathGapAnalysisResult {
  pathId: number;
  pathTitle: string;
  pathSlug: string;
  totalRequirements: number;
  hasDiagnosticEvidence: boolean;
  noDiagnosticMessage?: string;

  evidencedSkills: PathSkillGapItem[];
  partiallyEvidencedSkills: PathSkillGapItem[];
  confirmedAssessedGaps: PathSkillGapItem[];
  unassessedRequirements: PathSkillGapItem[];
  allRequirementGaps: PathSkillGapItem[];

  topPrerequisiteGap: PathSkillGapItem | null;
  assessedGapsCount: number;
  unassessedRequirementsCount: number;
  evidencedRequirementsCount: number;
  partiallyEvidencedCount: number;

  caveat: string;
}

// Map canonical slug to legacy numeric skill ID for backwards-compatible observation lookup
const SLUG_TO_NUMERIC_ID = new Map<string, number>();
SEED_SKILLS.forEach(s => {
  const match = SKILLS_CATALOGUE.find(c => c.slug === s.slug || c.name.toLowerCase() === s.name.toLowerCase());
  if (match) {
    SLUG_TO_NUMERIC_ID.set(match.slug, s.id);
  }
});
// Manual overrides for canonical skill slugs
SLUG_TO_NUMERIC_ID.set('programming', 1);
SLUG_TO_NUMERIC_ID.set('data-structures', 2);
SLUG_TO_NUMERIC_ID.set('python', 3);
SLUG_TO_NUMERIC_ID.set('sql', 4);
SLUG_TO_NUMERIC_ID.set('rest-apis', 5);
SLUG_TO_NUMERIC_ID.set('frontend-web', 6);
SLUG_TO_NUMERIC_ID.set('react', 6);
SLUG_TO_NUMERIC_ID.set('testing', 7);
SLUG_TO_NUMERIC_ID.set('git', 8);
SLUG_TO_NUMERIC_ID.set('communication', 9);
SLUG_TO_NUMERIC_ID.set('data-cleaning', 10);
SLUG_TO_NUMERIC_ID.set('devops', 11);
SLUG_TO_NUMERIC_ID.set('cloud', 11);
SLUG_TO_NUMERIC_ID.set('portfolio-evidence', 12);

/**
 * Resolves observation value for a canonical skill slug from observations map or record.
 */
export function resolveSkillObservation(
  skillSlug: string,
  observations?: Record<number | string, number | null> | Map<number | string, number | null>
): number | null {
  if (!observations) return null;

  let val: number | null | undefined = undefined;

  if (observations instanceof Map) {
    if (observations.has(skillSlug)) {
      val = observations.get(skillSlug);
    } else {
      const numId = SLUG_TO_NUMERIC_ID.get(skillSlug);
      if (numId !== undefined && observations.has(numId)) {
        val = observations.get(numId);
      }
    }
  } else {
    if (skillSlug in observations) {
      val = observations[skillSlug];
    } else {
      const numId = SLUG_TO_NUMERIC_ID.get(skillSlug);
      if (numId !== undefined && numId in observations) {
        val = observations[numId];
      }
    }
  }

  if (val === undefined || val === null) {
    return null;
  }
  return typeof val === 'number' && !isNaN(val) ? Math.max(0, val) : null;
}

/**
 * Conducts a pure, deterministic skill gap analysis for a career path against observed evidence.
 */
export function calculatePathGapAnalysis(
  path: CareerPath,
  observations?: Record<number | string, number | null> | Map<number | string, number | null>
): PathGapAnalysisResult {
  const requirements: PathSkillRequirement[] = path.requirements && path.requirements.length > 0
    ? path.requirements
    : buildFallbackRequirements(path);

  let assessedCount = 0;

  const allItems: PathSkillGapItem[] = requirements.map(req => {
    const canonicalSkill = getSkillBySlug(req.skillId);
    const skillName = canonicalSkill ? canonicalSkill.name : req.skillId;
    const category = canonicalSkill ? canonicalSkill.category : 'Technical';
    const targetLevel = req.targetLevel || 3;
    const order = req.prerequisiteOrder || 1;
    const importance = req.importance || 2;

    const observed = resolveSkillObservation(req.skillId, observations);
    const isAssessed = observed !== null;

    if (isAssessed) {
      assessedCount++;
    }

    let evidenceState: SkillEvidenceState = 'unassessed';
    let gapSize = 0;
    let activeEvidenceSource = 'No evidence yet (unassessed)';
    let nextAction = `Complete diagnostic assessment or add a verified project deliverable for ${skillName}.`;

    if (isAssessed) {
      const obsLevel = observed!;
      if (obsLevel >= targetLevel) {
        evidenceState = 'evidenced';
        gapSize = 0;
        activeEvidenceSource = 'Verified assessment diagnostic';
        nextAction = `Evidence target satisfied (Level ${obsLevel}/${targetLevel}). Maintain active hands-on application.`;
      } else if (obsLevel > 0) {
        evidenceState = 'partially_evidenced';
        gapSize = targetLevel - obsLevel;
        activeEvidenceSource = 'Partial diagnostic evidence';
        nextAction = `Advance from Level ${obsLevel} to target Level ${targetLevel} through guided portfolio milestones.`;
      } else {
        evidenceState = 'assessed_gap';
        gapSize = targetLevel;
        activeEvidenceSource = 'Assessed diagnostic gap';
        nextAction = `Address foundational gaps in ${skillName} (prerequisite order ${order}) before higher-level project work.`;
      }
    }

    return {
      skillId: req.skillId,
      skillName,
      category,
      targetLevel,
      currentEvidenceLevel: observed,
      importance,
      prerequisiteOrder: order,
      evidenceState,
      evidenceSources: req.evidenceSources || ['diagnostic', 'assessment', 'project fact'],
      activeEvidenceSource,
      gapSize,
      isAssessed,
      whyItMatters: req.rationale || `Verified competence in ${skillName} is required for ${path.title}.`,
      nextAction,
    };
  });

  // Sort all items strictly by prerequisiteOrder ascending, then importance descending, then skill name
  allItems.sort((a, b) => {
    if (a.prerequisiteOrder !== b.prerequisiteOrder) {
      return a.prerequisiteOrder - b.prerequisiteOrder;
    }
    if (a.importance !== b.importance) {
      return b.importance - a.importance;
    }
    return a.skillName.localeCompare(b.skillName);
  });

  const evidencedSkills = allItems.filter(i => i.evidenceState === 'evidenced');
  const partiallyEvidencedSkills = allItems.filter(i => i.evidenceState === 'partially_evidenced');
  const confirmedAssessedGaps = allItems.filter(i => i.evidenceState === 'assessed_gap');
  const unassessedRequirements = allItems.filter(i => i.evidenceState === 'unassessed');

  const hasDiagnosticEvidence = assessedCount > 0;
  const noDiagnosticMessage = hasDiagnosticEvidence
    ? undefined
    : 'Assessment not completed. Evidence is not available for these requirements yet. Take the diagnostic or add a verified project/resume fact.';

  // Top prerequisite gap: highest priority assessed gap by prerequisite order
  const assessedGapsSorted = [...confirmedAssessedGaps, ...partiallyEvidencedSkills].sort((a, b) => {
    if (a.prerequisiteOrder !== b.prerequisiteOrder) {
      return a.prerequisiteOrder - b.prerequisiteOrder;
    }
    return (b.importance * b.gapSize) - (a.importance * a.gapSize);
  });

  const topPrerequisiteGap = assessedGapsSorted.length > 0 ? assessedGapsSorted[0] : null;

  return {
    pathId: path.numericId,
    pathTitle: path.title,
    pathSlug: path.slug,
    totalRequirements: allItems.length,
    hasDiagnosticEvidence,
    noDiagnosticMessage,

    evidencedSkills,
    partiallyEvidencedSkills,
    confirmedAssessedGaps,
    unassessedRequirements,
    allRequirementGaps: allItems,

    topPrerequisiteGap,
    assessedGapsCount: confirmedAssessedGaps.length,
    unassessedRequirementsCount: unassessedRequirements.length,
    evidencedRequirementsCount: evidencedSkills.length,
    partiallyEvidencedCount: partiallyEvidencedSkills.length,

    caveat: 'Assessed alignment reflects demonstrated diagnostic or project evidence only. Not a placement guarantee, certificate, or employment prediction.',
  };
}

/**
 * Fallback synthesizer for paths whose explicit requirements are pending initialization
 */
function buildFallbackRequirements(path: CareerPath): PathSkillRequirement[] {
  const reqs: PathSkillRequirement[] = [];
  const prereqs = path.prerequisiteSkillSlugs || ['programming', 'git'];
  const cores = path.coreSkillSlugs || ['sql', 'testing'];
  const advs = path.advancedSkillSlugs || ['docker'];

  prereqs.forEach(slug => {
    reqs.push({
      pathId: path.numericId,
      skillId: slug,
      targetLevel: 2,
      importance: 2,
      prerequisiteOrder: 1,
      rationale: `Foundational prerequisite competence in ${slug} is required for ${path.title}.`,
      evidenceSources: ['diagnostic', 'assessment', 'project fact'],
      version: 'catalogue-v2.0',
    });
  });

  cores.forEach(slug => {
    reqs.push({
      pathId: path.numericId,
      skillId: slug,
      targetLevel: 3,
      importance: 3,
      prerequisiteOrder: 2,
      rationale: `Core job execution in ${path.title} depends directly on ${slug}.`,
      evidenceSources: ['diagnostic', 'assessment', 'project fact', 'reviewed project'],
      version: 'catalogue-v2.0',
    });
  });

  advs.forEach(slug => {
    reqs.push({
      pathId: path.numericId,
      skillId: slug,
      targetLevel: 3,
      importance: 2,
      prerequisiteOrder: 3,
      rationale: `Advanced engineering for ${path.title} applies ${slug} in production contexts.`,
      evidenceSources: ['diagnostic', 'assessment', 'project fact', 'reviewed project'],
      version: 'catalogue-v2.0',
    });
  });

  return reqs;
}
