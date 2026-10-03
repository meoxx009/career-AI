/**
 * Roadmap Repository abstraction for persisting and managing roadmap plans.
 * Supports guest local storage persistence today and provides the interface
 * contract for future Supabase RLS database persistence.
 */

import type { RoadmapTask } from '../types';
import {
  generateRoadmapPlan,
  validateWeeklyStudyHours,
} from './roadmapGenerator';
import { SEED_ROADMAP_TEMPLATES } from '../data/seedData';
import { STORAGE_KEY, DEFAULT_ROADMAP_TASKS } from '../context/careerConstants';

export interface PlanProgress {
  totalTasks: number;
  completedTasks: number;
  percent: number;
  totalHours: number;
  completedHours: number;
}

/**
 * Calculates completion statistics for a list of roadmap tasks.
 * Handles both whole tasks and split segment tasks correctly:
 * - A split task (parentTaskId set) contributes only its scheduledHours to totalHours.
 * - A whole task contributes its estimatedHours.
 * - Logical task count counts parent tasks (or whole tasks) not individual segments.
 * Pure function, zero side-effects.
 */
export function calculatePlanProgress(tasks: RoadmapTask[]): PlanProgress {
  // Determine unique logical tasks (by parentTaskId or id)
  const logicalTaskIds = new Set<string>();
  for (const t of tasks) {
    logicalTaskIds.add(t.parentTaskId || t.id);
  }

  // A logical task is complete when ALL its segments (or the whole task) are complete
  const logicalCompleted = new Set<string>();
  for (const parentId of logicalTaskIds) {
    const parts = tasks.filter(t => (t.parentTaskId || t.id) === parentId);
    if (parts.every(t => t.status === 'completed')) {
      logicalCompleted.add(parentId);
    }
  }

  const totalTasks = logicalTaskIds.size;
  const completedTasks = logicalCompleted.size;
  const percent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Hours: use scheduledHours for segments (avoids counting parent estimatedHours multiple times)
  const totalHours = tasks.reduce((sum, t) => {
    if (t.parentTaskId !== undefined) {
      return sum + (t.scheduledHours ?? t.estimatedHours);
    }
    return sum + t.estimatedHours;
  }, 0);

  const completedHours = tasks
    .filter(t => t.status === 'completed')
    .reduce((sum, t) => {
      if (t.parentTaskId !== undefined) {
        return sum + (t.scheduledHours ?? t.estimatedHours);
      }
      return sum + t.estimatedHours;
    }, 0);

  return {
    totalTasks,
    completedTasks,
    percent,
    totalHours: Math.round(totalHours * 10) / 10,
    completedHours: Math.round(completedHours * 10) / 10,
  };
}

/**
 * Returns the current active week number (the earliest week with incomplete tasks),
 * or the last week if all tasks are complete, or 1 if empty.
 */
export function getCurrentActiveWeek(tasks: RoadmapTask[]): number {
  if (tasks.length === 0) return 1;
  const incompleteTasks = tasks.filter(t => t.status !== 'completed');
  if (incompleteTasks.length === 0) {
    return Math.max(...tasks.map(t => t.weekNumber));
  }
  return Math.min(...incompleteTasks.map(t => t.weekNumber));
}

/**
 * Repository interface for roadmap data persistence.
 */
export interface IRoadmapRepository {
  getTasks(roleId: number): Promise<RoadmapTask[]>;
  saveTasks(roleId: number, tasks: RoadmapTask[]): Promise<void>;
  toggleTask(roleId: number, taskId: string): Promise<RoadmapTask[]>;
  reschedulePlan(
    roleId: number,
    weeklyHours: number,
    existingTasks?: RoadmapTask[]
  ): Promise<{ valid: boolean; tasks: RoadmapTask[]; error?: string }>;
}

/**
 * LocalStorage implementation of IRoadmapRepository for guest learners.
 */
export class LocalStorageRoadmapRepository implements IRoadmapRepository {
  private storageKey: string;

  constructor(storageKey: string = STORAGE_KEY) {
    this.storageKey = storageKey;
  }

  private getStoredState(): Record<string, unknown> | null {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return null;
      const data = window.localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  private saveStoredState(state: Record<string, unknown>): void {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return;
      window.localStorage.setItem(this.storageKey, JSON.stringify(state));
    } catch {
      // Storage unavailable or quota exceeded
    }
  }

  async getTasks(roleId: number): Promise<RoadmapTask[]> {
    const state = this.getStoredState();
    if (state && Array.isArray(state.roadmapTasks)) {
      return state.roadmapTasks as RoadmapTask[];
    }

    // Fallback: generate default plan for the role
    const result = generateRoadmapPlan({
      roleId,
      weeklyStudyHours: 8,
      templates: SEED_ROADMAP_TEMPLATES,
    });
    return result.valid ? result.tasks : DEFAULT_ROADMAP_TASKS;
  }

  async saveTasks(roleId: number, tasks: RoadmapTask[]): Promise<void> {
    const state = this.getStoredState() || {};
    state.roadmapTasks = tasks;
    state.selectedRoleId = roleId;
    this.saveStoredState(state);
  }

  async toggleTask(roleId: number, taskId: string): Promise<RoadmapTask[]> {
    const tasks = await this.getTasks(roleId);
    const updated: RoadmapTask[] = tasks.map(task => {
      if (task.id === taskId) {
        const nextStatus: RoadmapTask['status'] = task.status === 'completed' ? 'todo' : 'completed';
        return {
          ...task,
          status: nextStatus,
          completedAt: nextStatus === 'completed' ? new Date().toISOString().split('T')[0] : undefined,
        };
      }
      return task;
    });

    await this.saveTasks(roleId, updated);
    return updated;
  }

  async reschedulePlan(
    roleId: number,
    weeklyHours: number,
    existingTasks?: RoadmapTask[]
  ): Promise<{ valid: boolean; tasks: RoadmapTask[]; error?: string }> {
    const validation = validateWeeklyStudyHours(weeklyHours);
    if (!validation.valid) {
      const current = existingTasks || (await this.getTasks(roleId));
      return { valid: false, tasks: current, error: validation.error };
    }

    const currentTasks = existingTasks || (await this.getTasks(roleId));
    const result = generateRoadmapPlan({
      roleId,
      weeklyStudyHours: weeklyHours,
      templates: SEED_ROADMAP_TEMPLATES,
      existingTasks: currentTasks,
    });

    if (result.valid) {
      await this.saveTasks(roleId, result.tasks);
      return { valid: true, tasks: result.tasks };
    }

    return { valid: false, tasks: currentTasks, error: result.error };
  }
}

export const defaultRoadmapRepository: IRoadmapRepository = new LocalStorageRoadmapRepository();
