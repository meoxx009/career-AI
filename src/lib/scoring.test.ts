import { describe, it, expect } from 'vitest';
import {
  scoreAssessmentAnswers,
  buildSkillObservations,
  calculateRoleCoverage,
  calculateAssessedAlignment,
  calculateKnownGaps,
  prioritiseGaps,
  sortRoleAssessments,
  buildRoleExplanation,
  calculatePlanCompletion,
  // Legacy aliases
  calculateCoverage,
  calculateAlignment,
  calculateSkillGaps,
  evaluateRoleFit,
} from './scoring';
import type { RichRoleAssessment } from './scoring';
import type { AssessmentQuestion, CareerRole, RoleSkillRequirement } from '../types';

const mockRequirements = [
  { skill_id: 1, target_level: 3, importance: 3, prerequisite_order: 1, rationale: 'Logic foundations' },
  { skill_id: 2, target_level: 3, importance: 2, prerequisite_order: 2, rationale: 'Data structures' },
  { skill_id: 3, target_level: 2, importance: 2, prerequisite_order: 3, rationale: 'Language syntax' },
  { skill_id: 4, target_level: 2, importance: 1, prerequisite_order: 4, rationale: 'SQL querying' },
];
// Total weight = 3 + 2 + 2 + 1 = 8

describe('CareerAI Pure Scoring Engine (PRD Section 5 & Prompt 05)', () => {
  describe('Gate 05 Requirements', () => {
    it('proves null !== 0: null represents unknown and does not count as measured zero', () => {
      // With skill 1 = null (unknown): known weight = 0, coverage = 0%
      const nullObs = new Map<number, number | null>([[1, null]]);
      const nullCoverage = calculateRoleCoverage(mockRequirements, nullObs);
      const nullAlignment = calculateAssessedAlignment(mockRequirements, nullObs);

      expect(nullCoverage.knownWeight).toBe(0);
      expect(nullCoverage.coveragePercent).toBe(0);
      expect(nullAlignment.state).toBe('unassessed');
      expect(nullAlignment.alignmentPercent).toBeNull();

      // With skill 1 = 0 (measured zero): known weight = 3, coverage = 37.5%
      const zeroObs = new Map<number, number | null>([[1, 0]]);
      const zeroCoverage = calculateRoleCoverage(mockRequirements, zeroObs);
      const zeroAlignment = calculateAssessedAlignment(mockRequirements, zeroObs);

      expect(zeroCoverage.knownWeight).toBe(3);
      expect(zeroCoverage.coveragePercent).toBe(38);
      // Still < 60% coverage, so more-evidence-needed, but knownWeight is 3!
      expect(zeroAlignment.state).toBe('more-evidence-needed');
      expect(zeroAlignment.coverage.knownWeight).not.toBe(nullCoverage.knownWeight);
    });

    it('proves low coverage (< 60%) is not a confident ranking', () => {
      // Skill 1 alone has weight 3 out of 8 (37.5% coverage < 60%)
      const lowObs = new Map<number, number | null>([[1, 3]]);
      const res = calculateAssessedAlignment(mockRequirements, lowObs);

      expect(res.coverage.isSufficient).toBe(false);
      expect(res.state).toBe('more-evidence-needed');
      expect(res.alignmentPercent).toBeNull();
      expect(res.caveat).toContain('below 60%');
    });

    it('proves scores cannot exceed their scale (capped at target level)', () => {
      // Skill 1 target is 3, but observed is 4 (over-target).
      // Skill 2 target is 3, observed is 5 (invalid/excess).
      // Coverage = (3+2)/8 = 5/8 = 62.5% (>=60%)
      const overTargetObs = new Map<number, number | null>([
        [1, 4],
        [2, 5],
      ]);
      const res = calculateAssessedAlignment(mockRequirements, overTargetObs);

      expect(res.state).toBe('confident');
      // Both capped at their respective targets, so alignment must be exactly 100%, never >100%
      expect(res.alignmentPercent).toBe(100);
      expect(res.alignmentPercent).toBeLessThanOrEqual(100);
    });
  });

  describe('Comprehensive Edge Cases', () => {
    it('handles no observations (empty map)', () => {
      const emptyObs = new Map<number, number | null>();
      const cov = calculateRoleCoverage(mockRequirements, emptyObs);
      const align = calculateAssessedAlignment(mockRequirements, emptyObs);

      expect(cov.coverageRatio).toBe(0);
      expect(cov.knownWeight).toBe(0);
      expect(align.state).toBe('unassessed');
      expect(align.alignmentPercent).toBeNull();
    });

    it('handles one known skill with sufficient coverage', () => {
      // A role where one skill represents 70% of importance weight
      const singleDominantReqs = [
        { skill_id: 1, target_level: 3, importance: 7 },
        { skill_id: 2, target_level: 3, importance: 3 },
      ];
      const obs = new Map<number, number | null>([[1, 3]]);
      const align = calculateAssessedAlignment(singleDominantReqs, obs);

      expect(align.coverage.coverageRatio).toBe(0.7);
      expect(align.state).toBe('confident');
      expect(align.alignmentPercent).toBe(100);
    });

    it('calculates perfect observations across all skills as 100% alignment and 100% coverage', () => {
      const perfectObs = new Map<number, number | null>([
        [1, 3],
        [2, 3],
        [3, 2],
        [4, 2],
      ]);
      const align = calculateAssessedAlignment(mockRequirements, perfectObs);

      expect(align.coverage.coverageRatio).toBe(1.0);
      expect(align.coverage.coveragePercent).toBe(100);
      expect(align.state).toBe('confident');
      expect(align.alignmentPercent).toBe(100);
    });

    it('calculates partial coverage accurately with fractional ratios', () => {
      // Known: Skill 1 (level 2/3, wt 3), Skill 2 (level 2/3, wt 2)
      // Known weights = 5 / 8 = 62.5%
      // Weighted sum = 3 * (2/3) + 2 * (2/3) = 2 + 1.3333 = 3.3333
      // Alignment = 100 * (3.3333 / 5) = 66.67% -> rounded to 67%
      const partialObs = new Map<number, number | null>([
        [1, 2],
        [2, 2],
      ]);
      const align = calculateAssessedAlignment(mockRequirements, partialObs);

      expect(align.coverage.coveragePercent).toBe(63);
      expect(align.state).toBe('confident');
      expect(align.alignmentPercent).toBe(67);
    });

    it('handles negative boundary values safely by clamping to 0', () => {
      const negativeObs = new Map<number, number | null>([
        [1, -2],
        [2, 3],
      ]);
      const gaps = calculateKnownGaps(mockRequirements, negativeObs);
      const gap1 = gaps.find(g => g.skillId === 1)!;

      expect(gap1.observedLevel).toBe(0);
      expect(gap1.gap).toBe(3); // target 3 - 0 = 3
    });

    it('orders gaps strictly by prerequisite order first, then priority score (importance * gap)', () => {
      const obs = new Map<number, number | null>([
        [1, 1], // target 3, gap: 2, order: 1, importance: 3 -> priority = 6
        [2, 1], // target 3, gap: 2, order: 2, importance: 2 -> priority = 4
        [3, 0], // target 2, gap: 2, order: 3, importance: 2 -> priority = 4
        [4, 0], // target 2, gap: 2, order: 4, importance: 1 -> priority = 2
      ]);

      const gaps = calculateKnownGaps(mockRequirements, obs);
      const prioritized = prioritiseGaps(gaps);

      expect(prioritized[0].skillId).toBe(1);
      expect(prioritized[1].skillId).toBe(2);
      expect(prioritized[2].skillId).toBe(3);
      expect(prioritized[3].skillId).toBe(4);
    });

    it('sorts roles with deterministic tie-breaking on role slug', () => {
      const roleA: RichRoleAssessment = {
        roleId: 1,
        roleSlug: 'backend-developer',
        roleName: 'Backend Developer',
        state: 'confident',
        alignment: 80,
        scale: '0-100%',
        coverage: { coverageRatio: 0.8, coveragePercent: 80, knownWeight: 8, totalWeight: 10, isSufficient: true },
        source: 'seed-1',
        version: 'v1',
        evidenceUsed: [],
        unknowns: [],
        knownGaps: [],
        prioritizedGaps: [],
        caveat: '',
      };

      const roleB: RichRoleAssessment = {
        roleId: 2,
        roleSlug: 'data-analyst',
        roleName: 'Data Analyst',
        state: 'confident',
        alignment: 80, // Same alignment
        scale: '0-100%',
        coverage: { coverageRatio: 0.8, coveragePercent: 80, knownWeight: 8, totalWeight: 10, isSufficient: true },
        source: 'seed-1',
        version: 'v1',
        evidenceUsed: [],
        unknowns: [],
        knownGaps: [],
        prioritizedGaps: [],
        caveat: '',
      };

      // In alphabetical order by slug: 'backend-developer' comes before 'data-analyst'
      const sorted = sortRoleAssessments([roleB, roleA]);
      expect(sorted[0].roleSlug).toBe('backend-developer');
      expect(sorted[1].roleSlug).toBe('data-analyst');
    });
  });

  describe('Assessment Diagnostic Grading & Plan Completion', () => {
    it('scores assessment answers without penalizing unanswered questions', () => {
      const mockQuestions: AssessmentQuestion[] = [
        { id: 'q1', skill_id: 1, category: 'logic', prompt: 'P1', option_a: 'A', option_b: 'B', option_c: 'C', option_d: 'D', correct_key: 'a', explanation: '', difficulty: 'easy', version: 'v1' },
        { id: 'q2', skill_id: 1, category: 'logic', prompt: 'P2', option_a: 'A', option_b: 'B', option_c: 'C', option_d: 'D', correct_key: 'b', explanation: '', difficulty: 'easy', version: 'v1' },
        { id: 'q3', skill_id: 2, category: 'technical', prompt: 'P3', option_a: 'A', option_b: 'B', option_c: 'C', option_d: 'D', correct_key: 'c', explanation: '', difficulty: 'easy', version: 'v1' },
      ];

      // User answered q1 correctly, left q2 and q3 unanswered
      const answers: Record<string, 'a' | 'b' | 'c' | 'd'> = { q1: 'a' };
      const scoreResults = scoreAssessmentAnswers(mockQuestions, answers);

      const skill1Score = scoreResults.find(s => s.skillId === 1)!;
      const skill2Score = scoreResults.find(s => s.skillId === 2)!;

      // Skill 1: 1 answered, 1 correct -> 100% accuracy -> estimate 3
      expect(skill1Score.correctCount).toBe(1);
      expect(skill1Score.unansweredCount).toBe(1);
      expect(skill1Score.diagnosticEstimate).toBe(3);

      // Skill 2: 0 answered -> diagnostic estimate is null (not 0)
      expect(skill2Score.diagnosticEstimate).toBeNull();

      const observations = buildSkillObservations(scoreResults);
      const obs1 = observations.find(o => o.skill_id === 1)!;
      const obs2 = observations.find(o => o.skill_id === 2)!;

      expect(obs1.value).toBe(3);
      expect(obs2.value).toBeNull();
    });

    it('calculates plan completion as effort tracking only, not learning mastery', () => {
      const tasks = [
        { status: 'completed', estimatedHours: 5 },
        { status: 'completed', estimatedHours: 6 },
        { status: 'todo', estimatedHours: 5 },
        { status: 'todo', estimatedHours: 4 },
      ];
      // Total hours = 20, Completed = 11 -> 55%
      const plan = calculatePlanCompletion(tasks);

      expect(plan.planCompletionPercent).toBe(55);
      expect(plan.completedHours).toBe(11);
      expect(plan.totalHours).toBe(20);
      expect(plan.label).toBe('Plan Completion (Effort Tracking Only)');
      expect(plan.caveat).toContain('effort expended');
    });

    it('builds rich role explanation with evidence used, unknowns, and trust caveat', () => {
      const mockRole: CareerRole = {
        id: 1,
        slug: 'backend-developer',
        name: 'Backend Developer',
        level: 'entry',
        description: 'Test backend role',
        source_label: 'Curated Rubric',
        source_url: '',
        source_checked_at: '2026-10-02',
        version: 'v1',
      };

      const mockReqs: RoleSkillRequirement[] = [
        { role_id: 1, skill_id: 1, target_level: 3, importance: 3, prerequisite_order: 1, rationale: 'Logic', version: 'v1' },
        { role_id: 1, skill_id: 2, target_level: 3, importance: 3, prerequisite_order: 2, rationale: 'Data', version: 'v1' },
      ];

      const obs = new Map<number | string, number | null>([[1, 2]]);
      const explanation = buildRoleExplanation(mockRole, mockReqs, obs);

      expect(explanation.roleSlug).toBe('backend-developer');
      expect(explanation.evidenceUsed.length).toBe(1);
      expect(explanation.unknowns.length).toBe(1);
      expect(explanation.caveat).toContain('deterministic rubrics');
      expect(explanation.caveat).toContain('No salary prediction');
    });
  });

  describe('Legacy API Compatibility', () => {
    it('maintains compatibility with calculateCoverage, calculateAlignment, evaluateRoleFit', () => {
      const observations = new Map<string, number | null>([
        ['1', 3],
        ['2', 2],
      ]);
      const reqs = [
        { skillId: '1', targetLevel: 3, importance: 3, prerequisiteOrder: 1, rationale: 'R1' },
        { skillId: '2', targetLevel: 3, importance: 2, prerequisiteOrder: 2, rationale: 'R2' },
      ];

      const cov = calculateCoverage(reqs, observations);
      const align = calculateAlignment(reqs, observations);
      const gaps = calculateSkillGaps(reqs, observations);
      const fit = evaluateRoleFit('1', reqs, observations);

      expect(cov).toBe(1.0);
      expect(align).toBeGreaterThan(0);
      expect(gaps.length).toBe(2);
      expect(fit.isSufficientCoverage).toBe(true);
    });
  });
});
