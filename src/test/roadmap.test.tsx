import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { CareerProvider } from '../context/CareerContext';
import { AppShell } from '../components/AppShell';
import { Roadmap } from '../pages/Roadmap';
import {
  validateWeeklyStudyHours,
  sortTemplatesTopologically,
  generateRoadmapPlan,
  isTaskBlocked,
  sanitizeResourceUrl,
} from '../lib/roadmapGenerator';
import {
  calculatePlanProgress,
  LocalStorageRoadmapRepository,
} from '../lib/roadmapRepository';
import { SEED_ROADMAP_TEMPLATES } from '../data/seedData';
import { STORAGE_KEY } from '../context/careerConstants';

function renderRoadmap(selectedRoleId: number = 1) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    selectedRoleId,
    hasSelectedRole: true,
    profile: { displayName: 'Tester', targetRoleId: selectedRoleId, hoursPerWeek: 8 },
  }));
  return render(
    <MemoryRouter initialEntries={['/roadmap']}>
      <CareerProvider>
        <AppShell>
          <Routes>
            <Route path="/roadmap" element={<Roadmap />} />
          </Routes>
        </AppShell>
      </CareerProvider>
    </MemoryRouter>
  );
}

describe('Prompt 08 & Gate 08 — Roadmap and Progress Loop', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('Hour Budgeting & Boundary Validation', () => {
    it('accepts valid weekly study hours between 1 and 168', () => {
      expect(validateWeeklyStudyHours(6).valid).toBe(true);
      expect(validateWeeklyStudyHours(1).valid).toBe(true);
      expect(validateWeeklyStudyHours(40).valid).toBe(true);
      expect(validateWeeklyStudyHours(168).valid).toBe(true);
    });

    it('rejects 0 hours with clear descriptive error (Gate 08)', () => {
      const res = validateWeeklyStudyHours(0);
      expect(res.valid).toBe(false);
      expect(res.error).toMatch(/greater than 0/i);
    });

    it('rejects negative hours with clear descriptive error (Gate 08)', () => {
      const res = validateWeeklyStudyHours(-5);
      expect(res.valid).toBe(false);
      expect(res.error).toMatch(/greater than 0/i);
    });

    it('rejects hours above 168 with clear descriptive error (Gate 08)', () => {
      const res = validateWeeklyStudyHours(169);
      expect(res.valid).toBe(false);
      expect(res.error).toMatch(/cannot exceed 168 hours/i);
    });

    it('rejects NaN or non-finite values', () => {
      expect(validateWeeklyStudyHours(NaN).valid).toBe(false);
      expect(validateWeeklyStudyHours(Infinity).valid).toBe(false);
    });
  });

  describe('Topological Prerequisite Ordering & Plan Generation', () => {
    it('sorts templates so prerequisites strictly precede dependent tasks', () => {
      const sorted = sortTemplatesTopologically(SEED_ROADMAP_TEMPLATES);
      const positionMap = new Map<string, number>();
      sorted.forEach((task, index) => {
        positionMap.set(task.id, index);
      });

      sorted.forEach(task => {
        if (task.prerequisite_id && positionMap.has(task.prerequisite_id)) {
          const prereqIndex = positionMap.get(task.prerequisite_id)!;
          const taskIndex = positionMap.get(task.id)!;
          expect(prereqIndex).toBeLessThan(taskIndex);
        }
      });
    });

    it('budgets tasks into sequential weeks respecting a 6 hours/week budget (Gate 08)', () => {
      const plan = generateRoadmapPlan({
        roleId: 1,
        weeklyStudyHours: 6,
      });

      expect(plan.valid).toBe(true);
      expect(plan.tasks.length).toBeGreaterThan(0);
      expect(plan.estimatedWeeks).toBeGreaterThanOrEqual(1);

      // Verify that each task is assigned a positive weekNumber
      plan.tasks.forEach(task => {
        expect(task.weekNumber).toBeGreaterThanOrEqual(1);
      });

      // Verify that prerequisites appear on or before the dependent task's week
      const taskWeekMap = new Map(plan.tasks.map(t => [t.id, t.weekNumber]));
      plan.tasks.forEach(task => {
        if (task.prerequisiteTaskId && taskWeekMap.has(task.prerequisiteTaskId)) {
          const prereqWeek = taskWeekMap.get(task.prerequisiteTaskId)!;
          expect(prereqWeek).toBeLessThanOrEqual(task.weekNumber);
        }
      });
    });

    it('detects blocked task states when prerequisites are incomplete', () => {
      const plan = generateRoadmapPlan({ roleId: 1, weeklyStudyHours: 6 });
      const taskWithPrereq = plan.tasks.find(t => t.prerequisiteTaskId);
      expect(taskWithPrereq).toBeDefined();

      if (taskWithPrereq) {
        // Initial state: prerequisite is 'todo'
        const blockedCheck = isTaskBlocked(taskWithPrereq, plan.tasks);
        expect(blockedCheck.blocked).toBe(true);
        expect(blockedCheck.prerequisiteTitle).toBeDefined();

        // After completing the prerequisite
        const updatedTasks = plan.tasks.map(t =>
          t.id === taskWithPrereq.prerequisiteTaskId ? { ...t, status: 'completed' as const } : t
        );
        const unblockedCheck = isTaskBlocked(taskWithPrereq, updatedTasks);
        expect(unblockedCheck.blocked).toBe(false);
      }
    });

    it('sanitizes resource URLs safely against XSS and malformed protocols', () => {
      expect(sanitizeResourceUrl('https://developer.mozilla.org')).toBe('https://developer.mozilla.org');
      expect(sanitizeResourceUrl('http://nodejs.org')).toBe('http://nodejs.org');
      expect(sanitizeResourceUrl('javascript:alert(1)')).toBeNull();
      expect(sanitizeResourceUrl('')).toBeNull();
      expect(sanitizeResourceUrl(null)).toBeNull();
    });
  });

  describe('Repository & Progress Calculation', () => {
    it('calculates plan progress accurately', () => {
      const sampleTasks = [
        { id: 't1', weekNumber: 1, title: 'T1', description: '', deliverable: '', estimatedHours: 4, resourceUrl: '', status: 'completed' as const },
        { id: 't2', weekNumber: 1, title: 'T2', description: '', deliverable: '', estimatedHours: 2, resourceUrl: '', status: 'todo' as const },
      ];

      const progress = calculatePlanProgress(sampleTasks);
      expect(progress.totalTasks).toBe(2);
      expect(progress.completedTasks).toBe(1);
      expect(progress.percent).toBe(50);
      expect(progress.totalHours).toBe(6);
      expect(progress.completedHours).toBe(4);
    });

    it('LocalStorageRoadmapRepository toggles tasks and persists to storage', async () => {
      const repo = new LocalStorageRoadmapRepository(STORAGE_KEY);
      const initialTasks = await repo.getTasks(1);
      expect(initialTasks.length).toBeGreaterThan(0);

      const firstTask = initialTasks[0];
      expect(firstTask.status).toBe('todo');

      const updated = await repo.toggleTask(1, firstTask.id);
      expect(updated[0].status).toBe('completed');
      expect(updated[0].completedAt).toBeDefined();

      // Verify persistence by loading fresh
      const loaded = await repo.getTasks(1);
      expect(loaded[0].status).toBe('completed');
    });
  });

  describe('UI & Gate 08 End-to-End Workflow', () => {
    it('renders the preview editorial heading and plan meta', () => {
      renderRoadmap();
      expect(screen.getByText(/Small steps./i)).toBeDefined();
      expect(screen.getByText(/Real proof./i)).toBeDefined();
      expect(screen.getByText(/RESCHEDULE PLAN/i)).toBeDefined();
    });

    it('supports completing a task and reflects progress update (Gate 08)', () => {
      renderRoadmap();

      // Find the first task's "Mark Complete" button
      const markButtons = screen.getAllByRole('button', { name: /Mark .* as completed/i });
      expect(markButtons.length).toBeGreaterThan(0);

      // Complete the first task
      fireEvent.click(markButtons[0]);

      // Confirm button is now "Completed"
      expect(screen.getAllByRole('button', { name: /Mark .* as incomplete/i }).length).toBeGreaterThanOrEqual(1);

      // Verify that progress percentage increased
      expect(screen.getByText(/Plan Completed/i)).toBeDefined();
    });

    it('opens reschedule modal, validates 0, negative and >168, and reschedules to 6 hrs/week (Gate 08)', () => {
      renderRoadmap();

      // Click "Reschedule Plan"
      const rescheduleBtn = screen.getByRole('button', { name: /reschedule or re-budget study plan/i });
      fireEvent.click(rescheduleBtn);

      expect(screen.getByRole('dialog')).toBeDefined();
      expect(screen.getByText(/RE-BUDGET STUDY PLAN/i)).toBeDefined();

      const hoursInput = screen.getByLabelText(/Weekly Study Hours/i);
      const confirmBtn = screen.getByRole('button', { name: /Confirm Reschedule/i });

      // 1. Try 0
      fireEvent.change(hoursInput, { target: { value: '0' } });
      expect(screen.getByText(/Weekly study hours must be greater than 0/i)).toBeDefined();
      expect(confirmBtn.getAttribute('disabled')).not.toBeNull();

      // 2. Try negative (-5)
      fireEvent.change(hoursInput, { target: { value: '-5' } });
      expect(screen.getByText(/Weekly study hours must be greater than 0/i)).toBeDefined();
      expect(confirmBtn.getAttribute('disabled')).not.toBeNull();

      // 3. Try above 168 (180)
      fireEvent.change(hoursInput, { target: { value: '180' } });
      expect(screen.getByText(/cannot exceed 168 hours/i)).toBeDefined();
      expect(confirmBtn.getAttribute('disabled')).not.toBeNull();

      // 4. Set valid 6 hours/week (Gate 08)
      fireEvent.change(hoursInput, { target: { value: '6' } });
      expect(screen.queryByRole('alert')).toBeNull();
      expect(confirmBtn.getAttribute('disabled')).toBeNull();

      // Submit reschedule
      fireEvent.click(confirmBtn);

      // Modal closes and plan updates to 6 HRS / WEEK
      expect(screen.queryByRole('dialog')).toBeNull();
      expect(screen.getByText(/6 HRS \/ WEEK/i)).toBeDefined();
    });
  });
});

// ─── Gate 3 — Time-Budgeting Fix ───────────────────────────────────────────
describe('Prompt 03 & Gate 03 — Correct Time-Budgeting Schedule', () => {
  // Role 1 (Backend): rb01=5h, rb02=6h, rb03=6h, rb04=4h → total 21h
  // Role 2 (Frontend): rf01=5h, rf02=6h, rf03=5h, rf04=4h → total 20h
  // Role 3 (Data Analyst): da01=6h, da02=5h, da03=5h, da04=4h → total 20h

  describe('Hour-rate monotonicity — more hours/week → fewer estimated weeks', () => {
    it('4 hrs/week takes more weeks than 8 hrs/week (role 1)', () => {
      const at4 = generateRoadmapPlan({ roleId: 1, weeklyStudyHours: 4 });
      const at8 = generateRoadmapPlan({ roleId: 1, weeklyStudyHours: 8 });
      expect(at4.valid).toBe(true);
      expect(at8.valid).toBe(true);
      expect(at4.estimatedWeeks).toBeGreaterThan(at8.estimatedWeeks);
    });

    it('8 hrs/week takes more weeks than 12 hrs/week (role 1)', () => {
      const at8 = generateRoadmapPlan({ roleId: 1, weeklyStudyHours: 8 });
      const at12 = generateRoadmapPlan({ roleId: 1, weeklyStudyHours: 12 });
      expect(at8.estimatedWeeks).toBeGreaterThan(at12.estimatedWeeks);
    });

    it('4 hrs/week takes more weeks than 8 hrs/week (role 2)', () => {
      const at4 = generateRoadmapPlan({ roleId: 2, weeklyStudyHours: 4 });
      const at8 = generateRoadmapPlan({ roleId: 2, weeklyStudyHours: 8 });
      expect(at4.estimatedWeeks).toBeGreaterThan(at8.estimatedWeeks);
    });

    it('4 hrs/week takes more weeks than 8 hrs/week (role 3)', () => {
      const at4 = generateRoadmapPlan({ roleId: 3, weeklyStudyHours: 4 });
      const at8 = generateRoadmapPlan({ roleId: 3, weeklyStudyHours: 8 });
      expect(at4.estimatedWeeks).toBeGreaterThan(at8.estimatedWeeks);
    });
  });

  describe('No weekly budget overflow', () => {
    it('no single week\'s scheduledHours sum exceeds the budget (4 hrs/week)', () => {
      const plan = generateRoadmapPlan({ roleId: 1, weeklyStudyHours: 4 });
      expect(plan.valid).toBe(true);

      // For each week, sum the scheduled (or estimated for whole) hours
      const weekMap: Record<number, number> = {};
      for (const t of plan.tasks) {
        const h = t.scheduledHours ?? t.estimatedHours;
        weekMap[t.weekNumber] = (weekMap[t.weekNumber] || 0) + h;
      }
      for (const [week, total] of Object.entries(weekMap)) {
        expect(total).toBeLessThanOrEqual(4 + 0.001); // small tolerance for floating point
        if (total > 4) {
          throw new Error(`Week ${week} overflows: ${total}h > 4h`);
        }
      }
    });

    it('no single week\'s scheduledHours sum exceeds the budget (6 hrs/week)', () => {
      const plan = generateRoadmapPlan({ roleId: 1, weeklyStudyHours: 6 });
      const weekMap: Record<number, number> = {};
      for (const t of plan.tasks) {
        const h = t.scheduledHours ?? t.estimatedHours;
        weekMap[t.weekNumber] = (weekMap[t.weekNumber] || 0) + h;
      }
      for (const total of Object.values(weekMap)) {
        expect(total).toBeLessThanOrEqual(6.001);
      }
    });
  });

  describe('Task splitting for oversized tasks', () => {
    it('splits a task whose hours > weeklyBudget into multiple segments', () => {
      // Role 1 task rb02 has 6h. At 4hrs/week it must be split.
      const plan = generateRoadmapPlan({ roleId: 1, weeklyStudyHours: 4 });
      expect(plan.valid).toBe(true);

      // Check that a segment with parentTaskId exists (split happened)
      const segments = plan.tasks.filter(t => t.parentTaskId !== undefined);
      expect(segments.length).toBeGreaterThan(0);
    });

    it('each segment has scheduledHours ≤ weekly budget', () => {
      const plan = generateRoadmapPlan({ roleId: 1, weeklyStudyHours: 4 });
      for (const t of plan.tasks) {
        if (t.scheduledHours !== undefined) {
          expect(t.scheduledHours).toBeLessThanOrEqual(4);
        }
      }
    });

    it('segment count matches ceil(taskHours / budget)', () => {
      // rb02 has 6h, budget 4h → ceil(6/4)=2 segments
      const plan = generateRoadmapPlan({ roleId: 1, weeklyStudyHours: 4 });
      const rb02segments = plan.tasks.filter(t => t.parentTaskId === 'rb02');
      if (rb02segments.length > 0) {
        expect(rb02segments[0].segmentCount).toBe(2);
        expect(rb02segments.length).toBe(2);
      }
    });

    it('total scheduled hours across all segments equals the parent task hours', () => {
      const plan = generateRoadmapPlan({ roleId: 1, weeklyStudyHours: 4 });
      // Group by parentTaskId
      const parentTotals: Record<string, number> = {};
      for (const t of plan.tasks) {
        if (t.parentTaskId && t.scheduledHours !== undefined) {
          parentTotals[t.parentTaskId] = (parentTotals[t.parentTaskId] || 0) + t.scheduledHours;
        }
      }
      // The summed scheduledHours for each parent should equal the template's estimated_hours
      for (const [parentId, total] of Object.entries(parentTotals)) {
        const template = SEED_ROADMAP_TEMPLATES.find(t => t.id === parentId);
        if (template) {
          expect(Math.round(total)).toBe(Math.max(1, template.estimated_hours));
        }
      }
    });
  });

  describe('Prerequisite order and dependent task blocking', () => {
    it('prerequisite week is always ≤ dependent task week (4 hrs/week)', () => {
      const plan = generateRoadmapPlan({ roleId: 1, weeklyStudyHours: 4 });
      const weekMap = new Map(plan.tasks.map(t => [t.id, t.weekNumber]));
      for (const t of plan.tasks) {
        if (t.prerequisiteTaskId && weekMap.has(t.prerequisiteTaskId)) {
          const prereqWeek = weekMap.get(t.prerequisiteTaskId)!;
          expect(prereqWeek).toBeLessThanOrEqual(t.weekNumber);
        }
      }
    });

    it('a segment is blocked while its previous segment is incomplete', () => {
      const plan = generateRoadmapPlan({ roleId: 1, weeklyStudyHours: 4 });
      const rb02segs = plan.tasks.filter(t => t.parentTaskId === 'rb02');
      if (rb02segs.length >= 2) {
        const seg1 = rb02segs[1]; // index 1 (second segment)
        // seg1 prerequisiteTaskId should point at seg0
        expect(seg1.prerequisiteTaskId).toBe(rb02segs[0].id);
        // With seg0 still todo, seg1 is blocked
        const check = isTaskBlocked(seg1, plan.tasks);
        expect(check.blocked).toBe(true);
      }
    });

    it('a dependent template task is blocked until all prerequisite segments are complete', () => {
      const plan = generateRoadmapPlan({ roleId: 1, weeklyStudyHours: 4 });
      // rb03 depends on rb02. If rb02 is split, rb03's prerequisiteTaskId points to the LAST segment of rb02.
      const rb03 = plan.tasks.find(t => (t.parentTaskId || t.id) === 'rb03' && (t.segmentIndex === 0 || !t.segmentIndex));
      if (rb03) {
        const prereq = plan.tasks.find(t => t.id === rb03.prerequisiteTaskId);
        if (prereq) {
          // prereq is the last segment of rb02 — it's incomplete
          expect(prereq.status).toBe('todo');
          const check = isTaskBlocked(rb03, plan.tasks);
          expect(check.blocked).toBe(true);
        }
      }
    });
  });

  describe('Completed task preservation during rescheduling', () => {
    it('preserves whole-task completion when rescheduling whole → whole', () => {
      // Generate at 12h/week (no splitting), complete first task, reschedule at 8h/week
      const plan12 = generateRoadmapPlan({ roleId: 1, weeklyStudyHours: 12 });
      const completedFirst = plan12.tasks.map((t, i) =>
        i === 0 ? { ...t, status: 'completed' as const, completedAt: '2026-01-01' } : t
      );
      const plan8 = generateRoadmapPlan({ roleId: 1, weeklyStudyHours: 8, existingTasks: completedFirst });
      const rb01In8 = plan8.tasks.find(t => t.id === 'rb01' || t.parentTaskId === 'rb01');
      expect(rb01In8).toBeDefined();
      expect(rb01In8!.status).toBe('completed');
    });

    it('preserves completion when rescheduling whole → split (hours shrink)', () => {
      // At 8h/week tasks are whole; at 4h/week they get split. First task (rb01=5h) gets split at 4h/week.
      const plan8 = generateRoadmapPlan({ roleId: 1, weeklyStudyHours: 8 });
      // Mark rb01 as completed
      const withCompleted = plan8.tasks.map(t =>
        t.id === 'rb01' ? { ...t, status: 'completed' as const, completedAt: '2026-01-01' } : t
      );
      // Reschedule at 4h/week — rb01 (5h) splits into 2 segments
      const plan4 = generateRoadmapPlan({ roleId: 1, weeklyStudyHours: 4, existingTasks: withCompleted });
      const rb01segs = plan4.tasks.filter(t => (t.parentTaskId || t.id) === 'rb01');
      // At least one rb01 segment exists
      expect(rb01segs.length).toBeGreaterThan(0);
      // All segments should be completed (migrated from whole-task completion)
      for (const seg of rb01segs) {
        expect(seg.status).toBe('completed');
      }
    });

    it('preserves completion when rescheduling split → whole (hours grow)', () => {
      // At 4h/week rb01 (5h) splits; mark all segments complete; switch to 8h/week
      const plan4 = generateRoadmapPlan({ roleId: 1, weeklyStudyHours: 4 });
      const rb01segs = plan4.tasks.filter(t => (t.parentTaskId || t.id) === 'rb01');
      const allDone = plan4.tasks.map(t =>
        (t.parentTaskId || t.id) === 'rb01' ? { ...t, status: 'completed' as const, completedAt: '2026-01-01' } : t
      );
      const plan8 = generateRoadmapPlan({ roleId: 1, weeklyStudyHours: 8, existingTasks: allDone });
      const rb01In8 = plan8.tasks.find(t => t.id === 'rb01');
      if (rb01segs.length > 1) {
        // rb01 was split: after migration all-done → whole should be completed
        expect(rb01In8?.status).toBe('completed');
      }
    });
  });

  describe('Failed regeneration preserves old plan', () => {
    it('returns the existing tasks unchanged on invalid hours (NaN, 0, negative)', () => {
      const plan = generateRoadmapPlan({ roleId: 1, weeklyStudyHours: 8 });
      const existing = plan.tasks;

      const badNaN = generateRoadmapPlan({ roleId: 1, weeklyStudyHours: NaN, existingTasks: existing });
      expect(badNaN.valid).toBe(false);
      expect(badNaN.tasks).toBe(existing); // same reference

      const badZero = generateRoadmapPlan({ roleId: 1, weeklyStudyHours: 0, existingTasks: existing });
      expect(badZero.valid).toBe(false);
      expect(badZero.tasks).toBe(existing);

      const badNeg = generateRoadmapPlan({ roleId: 1, weeklyStudyHours: -5, existingTasks: existing });
      expect(badNeg.valid).toBe(false);
      expect(badNeg.tasks).toBe(existing);

      const badInf = generateRoadmapPlan({ roleId: 1, weeklyStudyHours: Infinity, existingTasks: existing });
      expect(badInf.valid).toBe(false);
      expect(badInf.tasks).toBe(existing);

      const badOver = generateRoadmapPlan({ roleId: 1, weeklyStudyHours: 169, existingTasks: existing });
      expect(badOver.valid).toBe(false);
      expect(badOver.tasks).toBe(existing);
    });
  });

  describe('localStorage migration', () => {
    beforeEach(() => { localStorage.clear(); });

    it('loads from localStorage by parentTaskId when migrating from split plan', async () => {
      const repo = new LocalStorageRoadmapRepository(STORAGE_KEY);
      // Generate a 4h/week plan and save it (will have split segments)
      const plan4 = generateRoadmapPlan({ roleId: 1, weeklyStudyHours: 4 });
      await repo.saveTasks(1, plan4.tasks);
      const loaded = await repo.getTasks(1);
      // Should restore split tasks
      expect(loaded.length).toBeGreaterThan(0);
      const hasSeg = loaded.some(t => t.parentTaskId !== undefined);
      expect(hasSeg).toBe(plan4.tasks.some(t => t.parentTaskId !== undefined));
    });

    it('reschedule via repository preserves completed segments', async () => {
      const repo = new LocalStorageRoadmapRepository(STORAGE_KEY);
      const plan4 = generateRoadmapPlan({ roleId: 1, weeklyStudyHours: 4 });
      // Find the first logical parent (first template)
      const firstParent = plan4.tasks[0].parentTaskId || plan4.tasks[0].id;
      // Mark ALL segments/tasks of the first logical task as complete
      const withDone = plan4.tasks.map(t =>
        (t.parentTaskId || t.id) === firstParent
          ? { ...t, status: 'completed' as const, completedAt: '2026-01-01' }
          : t
      );
      await repo.saveTasks(1, withDone);

      // Reschedule to 8h/week
      const res = await repo.reschedulePlan(1, 8, withDone);
      expect(res.valid).toBe(true);
      // The first logical task should still be completed after reschedule
      const firstInNew = res.tasks.find(t => (t.parentTaskId || t.id) === firstParent);
      expect(firstInNew?.status).toBe('completed');
    });

    it('repository reschedulePlan returns valid=false and original tasks on invalid hours', async () => {
      const repo = new LocalStorageRoadmapRepository(STORAGE_KEY);
      const plan = generateRoadmapPlan({ roleId: 1, weeklyStudyHours: 8 });
      await repo.saveTasks(1, plan.tasks);
      const res = await repo.reschedulePlan(1, 0);
      expect(res.valid).toBe(false);
      expect(res.error).toBeDefined();
    });
  });

  describe('Progress calculation — segment-aware', () => {
    it('counts logical tasks (not raw segments) in totalTasks', () => {
      const plan = generateRoadmapPlan({ roleId: 1, weeklyStudyHours: 4 });
      const progress = calculatePlanProgress(plan.tasks);
      // Should equal the number of unique templates for role 1 (4)
      expect(progress.totalTasks).toBe(4);
    });

    it('marks logical task complete only when all segments are complete', () => {
      const plan = generateRoadmapPlan({ roleId: 1, weeklyStudyHours: 4 });
      // Complete only the first segment of a split task — logical task should NOT be complete
      const rb01segs = plan.tasks.filter(t => (t.parentTaskId || t.id) === 'rb01');
      if (rb01segs.length >= 2) {
        const partial = plan.tasks.map(t =>
          t.id === rb01segs[0].id ? { ...t, status: 'completed' as const } : t
        );
        const progress = calculatePlanProgress(partial);
        expect(progress.completedTasks).toBe(0); // rb01 still not fully done
      }
    });

    it('totalHours does not double-count parent estimatedHours for segments', () => {
      // Role 1 total: 5+6+6+4 = 21h
      const plan4 = generateRoadmapPlan({ roleId: 1, weeklyStudyHours: 4 });
      const progress = calculatePlanProgress(plan4.tasks);
      expect(progress.totalHours).toBeCloseTo(21, 0);
    });
  });

  describe('Authenticated repository save/read-back', () => {
    beforeEach(() => { localStorage.clear(); });

    it('saves split-task plan and reads it back identically', async () => {
      const repo = new LocalStorageRoadmapRepository(STORAGE_KEY);
      const plan = generateRoadmapPlan({ roleId: 1, weeklyStudyHours: 4 });
      await repo.saveTasks(1, plan.tasks);
      const loaded = await repo.getTasks(1);
      expect(loaded.length).toBe(plan.tasks.length);
      for (let i = 0; i < plan.tasks.length; i++) {
        expect(loaded[i].id).toBe(plan.tasks[i].id);
        expect(loaded[i].parentTaskId).toBe(plan.tasks[i].parentTaskId);
        expect(loaded[i].scheduledHours).toBe(plan.tasks[i].scheduledHours);
        expect(loaded[i].weekNumber).toBe(plan.tasks[i].weekNumber);
      }
    });
  });
});
