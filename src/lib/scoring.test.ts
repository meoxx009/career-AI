import { describe, it, expect } from 'vitest';
import {
  calculateCoverage,
  calculateAlignment,
  calculateSkillGaps,
  evaluateRoleFit,
} from './scoring';
import type { RoleSkillRequirement } from './scoring';

const mockRequirements: RoleSkillRequirement[] = [
  { skillId: 'python', targetLevel: 3, importance: 3, prerequisiteOrder: 1, rationale: 'Core scripting' },
  { skillId: 'sql', targetLevel: 3, importance: 2, prerequisiteOrder: 2, rationale: 'Database storage' },
  { skillId: 'apis', targetLevel: 2, importance: 2, prerequisiteOrder: 3, rationale: 'HTTP endpoints' },
  { skillId: 'system-design', targetLevel: 2, importance: 1, prerequisiteOrder: 4, rationale: 'Architecture basics' },
];
// Total weight = 3 + 2 + 2 + 1 = 8

describe('CareerAI Scoring Engine', () => {
  it('handles completely unknown skills (null) as unknown, not zero', () => {
    const observations = new Map<string, number | null>([
      ['python', null],
      ['sql', null],
      ['apis', null],
      ['system-design', null],
    ]);

    const result = evaluateRoleFit('backend-dev', mockRequirements, observations);
    expect(result.coverage).toBe(0);
    expect(result.alignment).toBeNull();
    expect(result.statusMessage).toBe('Take the diagnostic');
  });

  it('treats a measured zero as a known observation', () => {
    // python = 0 (known 0/3), sql = null (unknown)
    const observations = new Map<string, number | null>([
      ['python', 0],
      ['sql', null],
    ]);

    // Known weight = 3 (python) out of 8 total weight = 3/8 = 0.375
    const coverage = calculateCoverage(mockRequirements, observations);
    expect(coverage).toBeCloseTo(3 / 8);

    // Alignment with only python=0 should be 0, but since coverage is < 60%, evaluateRoleFit reports "More evidence needed"
    const result = evaluateRoleFit('backend-dev', mockRequirements, observations);
    expect(result.isSufficientCoverage).toBe(false);
    expect(result.alignment).toBeNull();
    expect(result.statusMessage).toBe('More evidence needed');
  });

  it('reports "More evidence needed" when coverage is below 60%', () => {
    // Known: python (weight 3) -> 3/8 = 37.5% coverage (< 60%)
    const observations = new Map<string, number | null>([
      ['python', 3],
    ]);

    const result = evaluateRoleFit('backend-dev', mockRequirements, observations);
    expect(result.isSufficientCoverage).toBe(false);
    expect(result.coveragePercent).toBe(38);
    expect(result.alignment).toBeNull();
    expect(result.statusMessage).toBe('More evidence needed');
  });

  it('calculates alignment properly when coverage reaches >= 60%', () => {
    // Known: python (3/3, wt 3), sql (2/3, wt 2) -> (3+2)/8 = 5/8 = 62.5% coverage (>= 60%)
    const observations = new Map<string, number | null>([
      ['python', 3], // 100% of target
      ['sql', 2],    // 66.7% of target (2/3)
    ]);

    const coverage = calculateCoverage(mockRequirements, observations);
    expect(coverage).toBe(0.625);

    // Alignment = 100 * (3 * 1.0 + 2 * (2/3)) / (3 + 2) = 100 * (3 + 1.333) / 5 = 100 * 4.333 / 5 = 86.66% -> 87%
    const alignment = calculateAlignment(mockRequirements, observations);
    expect(alignment).toBe(87);

    const result = evaluateRoleFit('backend-dev', mockRequirements, observations);
    expect(result.isSufficientCoverage).toBe(true);
    expect(result.alignment).toBe(87);
    expect(result.coveragePercent).toBe(63);
    expect(result.statusMessage).toBe('87% assessed alignment (63% coverage)');
  });

  it('orders gaps by prerequisite order first, then by priority (importance * gap)', () => {
    const observations = new Map<string, number | null>([
      ['python', 1], // gap: 2, order: 1, priority: 3*2 = 6
      ['sql', 3],    // gap: 0, order: 2, priority: 0
      ['apis', 0],   // gap: 2, order: 3, priority: 2*2 = 4
      ['system-design', null], // unassessed, gap: 2, order: 4, priority: 1*2 = 2
    ]);

    const gaps = calculateSkillGaps(mockRequirements, observations);
    expect(gaps[0].skillId).toBe('python');
    expect(gaps[1].skillId).toBe('sql');
    expect(gaps[2].skillId).toBe('apis');
    expect(gaps[3].skillId).toBe('system-design');
    expect(gaps[3].isAssessed).toBe(false);
  });
});
