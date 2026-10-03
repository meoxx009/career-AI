/**
 * Pure and deterministic plan generator and study hour budgeter.
 * Orders prerequisites before dependent tasks and allocates tasks
 * into sequential weeks based on the learner's weekly study budget.
 */

import type { RoadmapTemplate, RoadmapTask } from '../types';
import { SEED_ROADMAP_TEMPLATES } from '../data/seedData';
import { CAREER_CATALOGUE } from '../data/careerCatalogue';
import { calculatePathGapAnalysis, type PathGapAnalysisResult } from './gapAnalysis';
import { getSkillBySlug } from '../data/skillCatalogue';

export interface PlanGenerationOptions {
  roleId: number;
  weeklyStudyHours: number;
  templates?: RoadmapTemplate[];
  existingTasks?: RoadmapTask[];
  observations?: Record<number | string, number | null> | Map<number | string, number | null>;
  gapAnalysis?: PathGapAnalysisResult;
}

export interface PlanGenerationResult {
  valid: boolean;
  tasks: RoadmapTask[];
  totalEstimatedHours: number;
  estimatedWeeks: number;
  weeklyStudyHours: number;
  error?: string;
  disclaimer: string;
}

/**
 * Validates weekly study hours input.
 * Allowed range: 1 to 168 hours/week (finite positive number).
 */
export function validateWeeklyStudyHours(hours: number): { valid: boolean; error?: string } {
  if (isNaN(hours) || !Number.isFinite(hours)) {
    return { valid: false, error: 'Weekly study hours must be a valid number.' };
  }
  if (hours <= 0) {
    return { valid: false, error: 'Weekly study hours must be greater than 0.' };
  }
  if (hours > 168) {
    return { valid: false, error: 'Weekly study hours cannot exceed 168 hours in a week (7 days × 24 hours).' };
  }
  return { valid: true };
}

/**
 * Safely validates a resource URL. Returns sanitized URL or null if invalid.
 */
export function sanitizeResourceUrl(url?: string | null): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      new URL(trimmed);
      return trimmed;
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Topologically sorts roadmap templates so prerequisites strictly precede dependents.
 */
export function sortTemplatesTopologically(templates: RoadmapTemplate[]): RoadmapTemplate[] {
  const result: RoadmapTemplate[] = [];
  const visited = new Set<string>();
  const visiting = new Set<string>();
  const map = new Map<string, RoadmapTemplate>(templates.map(t => [t.id, t]));

  function visit(task: RoadmapTemplate) {
    if (visited.has(task.id)) return;
    if (visiting.has(task.id)) {
      // Cycle detected fallback: push without breaking
      visited.add(task.id);
      result.push(task);
      return;
    }

    visiting.add(task.id);

    if (task.prerequisite_id && map.has(task.prerequisite_id)) {
      visit(map.get(task.prerequisite_id)!);
    }

    visiting.delete(task.id);
    visited.add(task.id);
    result.push(task);
  }

  templates.forEach(t => {
    if (!visited.has(t.id)) {
      visit(t);
    }
  });

  return result;
}

/**
 * Generates an estimated, budgeted roadmap plan for the selected role.
 *
 * Budget algorithm (continuous-pointer):
 * - Maintains a pointer of hours remaining in the current week.
 * - Each template is processed in topological (prerequisite-first) order.
 * - If the task fits entirely in the remaining budget → place it without splitting.
 * - If the task's total hours exceed the weekly budget → split it into sequential
 *   segments of at most `weeklyStudyHours` hours each, spreading across consecutive
 *   weeks. The segment's prerequisiteTaskId chains through the previous segment so
 *   the UI knows segment n is blocked by segment n-1.
 * - Prerequisite order is always preserved.
 * - Completed state is restored from existingTasks by parentTaskId (or task id).
 */
export function generateRoadmapPlan(options: PlanGenerationOptions): PlanGenerationResult {
  const { roleId, weeklyStudyHours, templates = SEED_ROADMAP_TEMPLATES, existingTasks = [] } = options;

  // 1. Validate study hours budget
  const validation = validateWeeklyStudyHours(weeklyStudyHours);
  if (!validation.valid) {
    return {
      valid: false,
      tasks: existingTasks,
      totalEstimatedHours: existingTasks.reduce((sum, t) => sum + t.estimatedHours, 0),
      estimatedWeeks: 0,
      weeklyStudyHours,
      error: validation.error,
      disclaimer: 'All timelines and hours are estimated targets, not a guarantee of employment or certification.',
    };
  }

  // 2. Filter templates for the target role
  const path = CAREER_CATALOGUE.find(p => p.numericId === roleId);
  let roleTemplates = templates.filter(t => t.role_id === roleId);
  if (roleTemplates.length === 0) {
    if (path && path.curriculum && path.curriculum.length > 0) {
      let prevId: string | null = null;
      roleTemplates = path.curriculum.map((c, idx) => {
        const tid = `tmpl-${path.slug}-${idx + 1}`;
        const template: RoadmapTemplate = {
          id: tid,
          role_id: roleId,
          week_number: idx + 1,
          title: `${c.phase}: ${c.title}`,
          description: `${c.whyItMatters}`,
          deliverable: c.deliverable,
          estimated_hours: c.estimatedHours || 8,
          prerequisite_id: prevId,
          resource_url: c.resourceUrl || `https://careerai.local/curriculum/${path.slug}`,
          status: 'todo',
          phase: c.phase,
          skill_ids: c.skillIds,
        };
        prevId = tid;
        return template;
      });
    }
  }

  if (roleTemplates.length === 0) {
    return {
      valid: false,
      tasks: [],
      totalEstimatedHours: 0,
      estimatedWeeks: 0,
      weeklyStudyHours,
      error: 'Curriculum content pending review',
      disclaimer: 'All timelines and hours are estimated targets, not a guarantee of employment or certification.',
    };
  }

  // 3. Gap analysis resolution for tasks
  const gapAnalysis = options.gapAnalysis || (path ? calculatePathGapAnalysis(path, options.observations) : undefined);

  // 4. Sort templates topologically by prerequisite dependency
  const sortedTemplates = sortTemplatesTopologically(roleTemplates);

  // Build a map from template.id → the *last* generated segment/task id for that template.
  // This is used so that dependent tasks reference the final segment of their prerequisite.
  const templateLastSegmentId = new Map<string, string>();

  // Build completion lookup from existing tasks.
  // For split tasks, keyed by parentTaskId; for whole tasks, keyed by id.
  // A parent is considered complete only if ALL its segments are complete.
  const existingSegmentsByParent = new Map<string, RoadmapTask[]>();
  const existingWholeTasks = new Map<string, RoadmapTask>();

  for (const t of existingTasks) {
    if (t.parentTaskId) {
      const arr = existingSegmentsByParent.get(t.parentTaskId) || [];
      arr.push(t);
      existingSegmentsByParent.set(t.parentTaskId, arr);
    } else {
      existingWholeTasks.set(t.id, t);
    }
  }

  function getExistingSegmentStatus(
    parentId: string,
    segIdx: number
  ): { status: RoadmapTask['status']; completedAt?: string } {
    const segs = existingSegmentsByParent.get(parentId);
    if (segs) {
      const seg = segs.find(s => s.segmentIndex === segIdx);
      if (seg) return { status: seg.status, completedAt: seg.completedAt };
    }
    // Fallback: if the whole parent task was completed, ALL its new segments inherit that completion.
    // This handles the migration case: whole completed task → re-split into segments.
    const whole = existingWholeTasks.get(parentId);
    if (whole && whole.status === 'completed') {
      return { status: 'completed', completedAt: whole.completedAt };
    }
    return { status: 'todo' };
  }

  function getExistingWholeStatus(
    taskId: string
  ): { status: RoadmapTask['status']; completedAt?: string } {
    const whole = existingWholeTasks.get(taskId);
    if (whole) return { status: whole.status, completedAt: whole.completedAt };
    // If previously split, reconstruct: complete only if ALL prior segments were complete
    const segs = existingSegmentsByParent.get(taskId);
    if (segs && segs.length > 0) {
      const allDone = segs.every(s => s.status === 'completed');
      if (allDone) {
        const lastDone = segs
          .filter(s => s.completedAt)
          .map(s => s.completedAt as string)
          .sort()
          .pop();
        return { status: 'completed', completedAt: lastDone };
      }
    }
    return { status: 'todo' };
  }

  // 4. Budget tasks using continuous-pointer algorithm
  let currentWeek = 1;
  let hoursLeftInWeek = weeklyStudyHours;
  const tasks: RoadmapTask[] = [];

  for (const template of sortedTemplates) {
    const totalHours = Math.max(1, template.estimated_hours);

    // Resolve skill gap linking for this task template
    const templateSkills = (template as RoadmapTemplate & { skill_ids?: string[]; phase?: string }).skill_ids;
    const templatePhase = (template as RoadmapTemplate & { skill_ids?: string[]; phase?: string }).phase;
    const primarySkillSlug = templateSkills && templateSkills.length > 0 ? templateSkills[0] : undefined;
    const gapItem = primarySkillSlug && gapAnalysis
      ? gapAnalysis.allRequirementGaps.find(g => g.skillId === primarySkillSlug)
      : undefined;

    const skillId = primarySkillSlug || gapItem?.skillId;
    const skillName = gapItem?.skillName || (skillId ? (getSkillBySlug(skillId)?.name || skillId) : undefined);
    const targetLevel = gapItem?.targetLevel || 3;
    const currentEvidenceLevel = gapItem ? gapItem.currentEvidenceLevel : null;
    const evidenceState = gapItem ? gapItem.evidenceState : 'unassessed';
    const evidenceSource = gapItem ? gapItem.activeEvidenceSource : 'Diagnostic assessment / Project fact';
    const phase = templatePhase || (template.title.includes(':') ? template.title.split(':')[0].trim() : 'Core skills');
    const nextAction = gapItem?.nextAction || `Complete milestone deliverable: ${template.deliverable}`;

    // Determine prerequisite: follow the chain through the last segment of the prereq template
    const prereqSegmentId = template.prerequisite_id
      ? templateLastSegmentId.get(template.prerequisite_id)
      : undefined;

    if (totalHours <= weeklyStudyHours) {
      // ── Whole-task placement ──
      // If the task doesn't fit in the remaining hours of the current week, advance
      if (hoursLeftInWeek < totalHours && hoursLeftInWeek < weeklyStudyHours) {
        currentWeek += 1;
        hoursLeftInWeek = weeklyStudyHours;
      }

      const existing = getExistingWholeStatus(template.id);

      const task: RoadmapTask = {
        id: template.id,
        weekNumber: currentWeek,
        title: template.title,
        description: template.description,
        deliverable: template.deliverable,
        estimatedHours: totalHours,
        prerequisiteTaskId: prereqSegmentId,
        resourceUrl: template.resource_url || '',
        status: existing.status,
        completedAt: existing.completedAt,
        skillId,
        skillName,
        targetLevel,
        currentEvidenceLevel,
        evidenceState,
        evidenceSource,
        phase,
        nextAction,
      };

      tasks.push(task);
      templateLastSegmentId.set(template.id, template.id);
      hoursLeftInWeek -= totalHours;

      // If the week is now exactly spent, close it
      if (hoursLeftInWeek <= 0) {
        currentWeek += 1;
        hoursLeftInWeek = weeklyStudyHours;
      }
    } else {
      // ── Segment splitting ──
      // The task's total hours exceed the weekly budget. Slice into segments.
      let remaining = totalHours;
      let segmentIndex = 0;
      const segmentCount = Math.ceil(totalHours / weeklyStudyHours);
      let prevSegmentId: string | undefined = prereqSegmentId;

      while (remaining > 0) {
        // Start a fresh week if the current one is already full
        if (hoursLeftInWeek <= 0) {
          currentWeek += 1;
          hoursLeftInWeek = weeklyStudyHours;
        }

        const segHours = Math.min(remaining, hoursLeftInWeek);
        const segId = `${template.id}__s${segmentIndex}`;
        const existing = getExistingSegmentStatus(template.id, segmentIndex);

        const seg: RoadmapTask = {
          id: segId,
          weekNumber: currentWeek,
          title: segmentCount === 1
            ? template.title
            : `${template.title} (Part ${segmentIndex + 1}/${segmentCount})`,
          description: template.description,
          deliverable: segmentIndex === segmentCount - 1 ? template.deliverable : `Study progress (part ${segmentIndex + 1} of ${segmentCount})`,
          estimatedHours: totalHours,   // parent total for UI display
          scheduledHours: segHours,     // hours actually in this week
          prerequisiteTaskId: prevSegmentId,
          resourceUrl: template.resource_url || '',
          status: existing.status,
          completedAt: existing.completedAt,
          // Segment metadata
          parentTaskId: template.id,
          segmentIndex,
          segmentCount,
          skillId,
          skillName,
          targetLevel,
          currentEvidenceLevel,
          evidenceState,
          evidenceSource,
          phase,
          nextAction,
        };

        tasks.push(seg);
        prevSegmentId = segId;
        remaining -= segHours;
        hoursLeftInWeek -= segHours;
        segmentIndex += 1;

        // Close week if spent
        if (hoursLeftInWeek <= 0 && remaining > 0) {
          currentWeek += 1;
          hoursLeftInWeek = weeklyStudyHours;
        }
      }

      // The last segment id is what dependents must reference
      templateLastSegmentId.set(template.id, prevSegmentId!);
    }
  }

  const totalEstimatedHours = sortedTemplates.reduce(
    (sum, t) => sum + Math.max(1, t.estimated_hours),
    0
  );
  const estimatedWeeks = tasks.length > 0 ? Math.max(...tasks.map(t => t.weekNumber)) : 0;

  return {
    valid: true,
    tasks,
    totalEstimatedHours,
    estimatedWeeks,
    weeklyStudyHours,
    disclaimer: 'All timelines and hours are estimated targets, not a guarantee of employment or certification.',
  };
}

/**
 * Checks if a task is currently blocked by an uncompleted prerequisite.
 */
export function isTaskBlocked(task: RoadmapTask, allTasks: RoadmapTask[]): { blocked: boolean; prerequisiteTitle?: string } {
  if (!task.prerequisiteTaskId) {
    return { blocked: false };
  }

  const prereq = allTasks.find(t => t.id === task.prerequisiteTaskId);
  if (!prereq) {
    return { blocked: false };
  }

  if (prereq.status !== 'completed') {
    return { blocked: true, prerequisiteTitle: prereq.title };
  }

  return { blocked: false };
}
