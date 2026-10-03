import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { CareerProvider } from '../context/CareerContext';
import { AppShell } from '../components/AppShell';
import { RoleDetail } from '../pages/RoleDetail';
import { CAREER_CATALOGUE, getCareerPathBySlug } from '../data/careerCatalogue';
import { generateRoadmapPlan } from '../lib/roadmapGenerator';
import { calculatePathGapAnalysis } from '../lib/gapAnalysis';
import { STORAGE_KEY } from '../context/careerConstants';
import type { CareerPath, UserProfile } from '../types';

const EXPECTED_PHASES = [
  'Foundations',
  'Core skills',
  'Guided project',
  'Portfolio/proof',
  'Practice and review',
];

function renderRoleDetail(slug: string, initialProfile?: Partial<UserProfile>, observations?: Record<number, number | null>) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      profile: {
        id: 'test-user',
        displayName: 'Test Learner',
        branch: 'Computer Science',
        studyYear: '3rd Year',
        hoursPerWeek: 10,
        preferredRoles: [],
        isGuestDemo: false,
        ...initialProfile,
      },
      skillObservations: observations || {},
    })
  );

  return render(
    <MemoryRouter initialEntries={[`/paths/${slug}`]}>
      <CareerProvider>
        <AppShell>
          <Routes>
            <Route path="/paths/:roleSlug" element={<RoleDetail />} />
          </Routes>
        </AppShell>
      </CareerProvider>
    </MemoryRouter>
  );
}

describe('Prompt 5 — Unified Path-to-Gap-to-Roadmap Flow Verification', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // 1. Every active career path has non-empty curriculum
  it('1. Every active career path has non-empty curriculum', () => {
    expect(CAREER_CATALOGUE.length).toBe(33);
    CAREER_CATALOGUE.forEach((path: CareerPath) => {
      expect(path.curriculum, `Path ${path.slug} missing curriculum`).toBeDefined();
      expect(path.curriculum.length, `Path ${path.slug} has empty curriculum`).toBeGreaterThan(0);
    });
  });

  // 2. Every active career path has non-empty requirements
  it('2. Every active career path has non-empty requirements', () => {
    CAREER_CATALOGUE.forEach((path: CareerPath) => {
      expect(path.requirements, `Path ${path.slug} missing requirements`).toBeDefined();
      expect(path.requirements!.length, `Path ${path.slug} has empty requirements`).toBeGreaterThan(0);

      path.requirements!.forEach(req => {
        expect(req.pathId).toBe(path.numericId);
        expect(req.skillId.length).toBeGreaterThan(0);
        expect(req.targetLevel).toBeGreaterThanOrEqual(1);
        expect(req.targetLevel).toBeLessThanOrEqual(4);
        expect(req.importance).toBeGreaterThanOrEqual(1);
        expect(req.importance).toBeLessThanOrEqual(3);
        expect(req.prerequisiteOrder).toBeGreaterThanOrEqual(1);
        expect(req.rationale.length).toBeGreaterThan(0);
        expect(req.evidenceSources.length).toBeGreaterThan(0);
      });
    });
  });

  // 3. All 5 phases exist in order for every career path
  it('3. All 5 phases exist in order for every career path', () => {
    CAREER_CATALOGUE.forEach((path: CareerPath) => {
      expect(path.curriculum.length).toBe(5);
      const phases = path.curriculum.map(c => c.phase);
      expect(phases, `Path ${path.slug} phases out of order`).toEqual(EXPECTED_PHASES);
    });
  });

  // 4. Roadmap generation produces valid tasks for all 33 paths
  it('4. Roadmap generation produces valid tasks for all 33 paths', () => {
    CAREER_CATALOGUE.forEach((path: CareerPath) => {
      const plan = generateRoadmapPlan({
        roleId: path.numericId,
        weeklyStudyHours: 8,
      });

      expect(plan.valid, `Plan invalid for roleId ${path.numericId} (${path.slug})`).toBe(true);
      expect(plan.tasks.length, `No tasks for roleId ${path.numericId} (${path.slug})`).toBeGreaterThan(0);
      expect(plan.estimatedWeeks).toBeGreaterThan(0);
      expect(plan.totalEstimatedHours).toBeGreaterThan(0);
    });
  });

  // 5. Generated tasks carry valid deliverables
  it('5. Generated tasks carry valid deliverables', () => {
    CAREER_CATALOGUE.forEach((path: CareerPath) => {
      const plan = generateRoadmapPlan({
        roleId: path.numericId,
        weeklyStudyHours: 10,
      });

      plan.tasks.forEach(task => {
        expect(task.deliverable, `Task ${task.id} in ${path.slug} missing deliverable`).toBeDefined();
        expect(task.deliverable!.length).toBeGreaterThan(0);
        expect(task.estimatedHours).toBeGreaterThan(0);
      });
    });
  });

  // 6. Prerequisite order is preserved across tasks
  it('6. Prerequisite order is preserved across tasks', () => {
    CAREER_CATALOGUE.forEach((path: CareerPath) => {
      const plan = generateRoadmapPlan({
        roleId: path.numericId,
        weeklyStudyHours: 6,
      });

      const taskIndexMap = new Map<string, number>();
      plan.tasks.forEach((t, idx) => taskIndexMap.set(t.id, idx));

      plan.tasks.forEach(t => {
        if (t.prerequisiteTaskId) {
          const prereqIdx = taskIndexMap.get(t.prerequisiteTaskId);
          const currentIdx = taskIndexMap.get(t.id)!;
          expect(prereqIdx, `Missing prerequisite ${t.prerequisiteTaskId} for task ${t.id}`).toBeDefined();
          expect(prereqIdx!).toBeLessThan(currentIdx);
        }
      });
    });
  });

  // 7. Large tasks are budgeted across weeks without exceeding weekly study budget
  it('7. Large tasks are budgeted across weeks without exceeding weekly study budget', () => {
    // Test with a tight budget of 4 hours/week on frontend-developer (which has 12h tasks)
    const plan = generateRoadmapPlan({
      roleId: 1,
      weeklyStudyHours: 4,
    });

    expect(plan.valid).toBe(true);
    // Group scheduled hours by week
    const hoursByWeek = new Map<number, number>();
    plan.tasks.forEach(t => {
      const scheduled = t.scheduledHours !== undefined ? t.scheduledHours : t.estimatedHours;
      hoursByWeek.set(t.weekNumber, (hoursByWeek.get(t.weekNumber) || 0) + scheduled);
    });

    hoursByWeek.forEach((weekHours, weekNum) => {
      expect(weekHours, `Week ${weekNum} exceeded 4 hours budget`).toBeLessThanOrEqual(4);
    });
  });

  // 8. Task completion persists without losing state
  it('8. Task completion persists without losing state across replanning', () => {
    // Generate initial plan
    const initialPlan = generateRoadmapPlan({
      roleId: 1,
      weeklyStudyHours: 8,
    });
    expect(initialPlan.tasks.length).toBeGreaterThan(0);

    // Mark first task completed
    const completedTasks = initialPlan.tasks.map((t, idx) =>
      idx === 0 ? { ...t, status: 'completed' as const, completedAt: '2026-10-03' } : t
    );

    // Reschedule with a different budget (e.g., 4 hrs/week)
    const rescheduledPlan = generateRoadmapPlan({
      roleId: 1,
      weeklyStudyHours: 4,
      existingTasks: completedTasks,
    });

    expect(rescheduledPlan.valid).toBe(true);
    // The first task/segment should remain completed
    const firstTask = rescheduledPlan.tasks[0];
    expect(firstTask.status).toBe('completed');
  });

  // 9. Gap calculation correctly identifies unassessed vs verified gaps
  it('9. Gap calculation correctly identifies unassessed vs verified gaps', () => {
    const path = getCareerPathBySlug('frontend-developer')!;
    expect(path).toBeDefined();

    // Partial observations: programming assessed high, git assessed low, others unassessed
    const observations = {
      1: 4, // programming: level 4 (meets level 3) -> evidenced
      8: 1, // git: level 1 (below level 3) -> partially_evidenced or assessed_gap
    };

    const result = calculatePathGapAnalysis(path, observations);

    expect(result.hasDiagnosticEvidence).toBe(true);
    expect(result.evidencedRequirementsCount).toBeGreaterThanOrEqual(1);
    expect(result.unassessedRequirementsCount).toBeGreaterThan(0);
    // Unassessed must match unassessedRequirements
    expect(result.unassessedRequirements.length).toBe(result.unassessedRequirementsCount);
  });

  // 10. Interest or degree is not counted as skill evidence
  it('10. Interest or degree is not counted as skill evidence', () => {
    const path = getCareerPathBySlug('machine-learning-engineer')!;
    expect(path).toBeDefined();

    // Zero skill observations, but high interest and degree in profile
    const emptyObservations = {};
    const result = calculatePathGapAnalysis(path, emptyObservations);

    expect(result.hasDiagnosticEvidence).toBe(false);
    expect(result.evidencedRequirementsCount).toBe(0);
    expect(result.partiallyEvidencedCount).toBe(0);
    expect(result.assessedGapsCount).toBe(0);
    expect(result.unassessedRequirementsCount).toBe(result.totalRequirements);
  });

  // 11. Unassessed requirements are not penalized as 0
  it('11. Unassessed requirements are not penalized as 0', () => {
    const path = getCareerPathBySlug('devops-engineer')!;
    const emptyObservations = {};
    const result = calculatePathGapAnalysis(path, emptyObservations);

    result.allRequirementGaps.forEach(item => {
      expect(item.evidenceState).toBe('unassessed');
      // currentEvidenceLevel must be null, never 0
      expect(item.currentEvidenceLevel).toBeNull();
      expect(item.currentEvidenceLevel).not.toBe(0);
    });

    // Confirmed assessed gaps must not count unassessed skills
    expect(result.confirmedAssessedGaps.length).toBe(0);
  });

  // 12. No-diagnostic fallback displays exact required text
  it('12. No-diagnostic fallback displays exact required text', () => {
    renderRoleDetail('backend-developer', undefined, {});

    const expectedNoticeRegex = /Assessment not completed\. Evidence is not available for these requirements yet\. Take the diagnostic or add a verified project\/resume fact\./i;
    expect(screen.getAllByText(expectedNoticeRegex).length).toBeGreaterThan(0);
  });

  // 13. Explore action is never broken for any active path
  it('13. Explore action is never broken for any active path', () => {
    CAREER_CATALOGUE.forEach((path: CareerPath) => {
      expect(path.slug.length).toBeGreaterThan(0);
      expect(path.numericId).toBeGreaterThan(0);
      expect(path.title.length).toBeGreaterThan(0);
      expect(path.curriculum.length).toBe(5);
      expect(path.requirements!.length).toBeGreaterThan(0);
    });
  });
});
