import type { RoadmapTask } from '../../types';
import type { IRoadmapRepository, RepositoryResult } from './types';
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { STORAGE_KEY, DEFAULT_ROADMAP_TASKS } from '../../context/careerConstants';
import { healRoadmapTasks } from '../resourceResolver';
import { CAREER_CATALOGUE } from '../../data/careerCatalogue';

export class LocalRoadmapRepository implements IRoadmapRepository {
  private storageKey: string;

  constructor(storageKey: string = STORAGE_KEY) {
    this.storageKey = storageKey;
  }

  async getRoadmapTasks(userId: string, _roleId: number): Promise<RepositoryResult<RoadmapTask[]>> {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return { data: DEFAULT_ROADMAP_TASKS, error: null };
      }
      const isUserScoped = Boolean(userId && !userId.startsWith('guest'));
      const key = isUserScoped ? `career_ai_roadmap_${userId}` : this.storageKey;
      const raw = window.localStorage.getItem(key);
      if (!raw) return { data: DEFAULT_ROADMAP_TASKS, error: null };
      const parsed = JSON.parse(raw);
      const rawTasks = (isUserScoped ? parsed : parsed.roadmapTasks) || DEFAULT_ROADMAP_TASKS;
      const path = CAREER_CATALOGUE.find(p => p.numericId === _roleId);
      const healed = healRoadmapTasks(rawTasks, path?.slug);
      return { data: healed, error: null };
    } catch (err) {
      return { data: DEFAULT_ROADMAP_TASKS, error: String(err) };
    }
  }

  async saveRoadmapTasks(userId: string, _roleId: number, tasks: RoadmapTask[]): Promise<RepositoryResult<void>> {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return { data: null, error: null };
      }
      const isUserScoped = Boolean(userId && !userId.startsWith('guest'));
      const key = isUserScoped ? `career_ai_roadmap_${userId}` : this.storageKey;
      const path = CAREER_CATALOGUE.find(p => p.numericId === _roleId);
      const healedTasks = healRoadmapTasks(tasks, path?.slug);
      if (isUserScoped) {
        window.localStorage.setItem(key, JSON.stringify(healedTasks));
      } else {
        const raw = window.localStorage.getItem(this.storageKey);
        const state = raw ? JSON.parse(raw) : {};
        state.roadmapTasks = healedTasks;
        window.localStorage.setItem(this.storageKey, JSON.stringify(state));
      }
      return { data: null, error: null };
    } catch (err) {
      return { data: null, error: String(err) };
    }
  }

  async toggleTask(userId: string, roleId: number, taskId: string): Promise<RepositoryResult<RoadmapTask[]>> {
    const fetchRes = await this.getRoadmapTasks(userId, roleId);
    const tasks = fetchRes.data || [];
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

    await this.saveRoadmapTasks(userId, roleId, updated);
    return { data: updated, error: null };
  }
}

export class SupabaseRoadmapRepository implements IRoadmapRepository {
  async getRoadmapTasks(userId: string, roleId: number): Promise<RepositoryResult<RoadmapTask[]>> {
    if (!supabase || !isSupabaseConfigured()) {
      return new LocalRoadmapRepository().getRoadmapTasks(userId, roleId);
    }

    try {
      // Find roadmap for this user & role
      const { data: roadmap, error: roadmapError } = await supabase
        .from('roadmaps')
        .select('id')
        .eq('user_id', userId)
        .eq('role_id', roleId)
        .maybeSingle();

      if (roadmapError) {
        return { data: null, error: roadmapError.message };
      }

      if (!roadmap) {
        return new LocalRoadmapRepository().getRoadmapTasks(userId, roleId);
      }

      const { data: tasks, error: tasksError } = await supabase
        .from('roadmap_tasks')
        .select('*')
        .eq('roadmap_id', roadmap.id)
        .eq('user_id', userId)
        .order('week_number', { ascending: true });

      if (tasksError) {
        return { data: null, error: tasksError.message };
      }

      if (!tasks || tasks.length === 0) {
        return new LocalRoadmapRepository().getRoadmapTasks(userId, roleId);
      }

      const mapped: RoadmapTask[] = tasks.map(t => ({
        id: t.id,
        weekNumber: t.week_number,
        title: t.title,
        description: t.description,
        deliverable: t.deliverable,
        estimatedHours: Number(t.estimated_hours),
        prerequisiteTaskId: t.prerequisite_task_id || undefined,
        resourceUrl: t.resource_url || '',
        status: (t.status === 'done' ? 'completed' : t.status === 'in_progress' ? 'in_progress' : 'todo') as RoadmapTask['status'],
        completedAt: t.completed_at ? t.completed_at.split('T')[0] : undefined,
      }));

      const path = CAREER_CATALOGUE.find(p => p.numericId === roleId);
      const healed = healRoadmapTasks(mapped, path?.slug);
      return { data: healed, error: null };
    } catch (err) {
      return { data: null, error: String(err) };
    }
  }

  async saveRoadmapTasks(userId: string, roleId: number, tasks: RoadmapTask[]): Promise<RepositoryResult<void>> {
    if (!supabase || !isSupabaseConfigured()) {
      return new LocalRoadmapRepository().saveRoadmapTasks(userId, roleId, tasks);
    }

    try {
      const path = CAREER_CATALOGUE.find(p => p.numericId === roleId);
      const healedTasks = healRoadmapTasks(tasks, path?.slug);

      // Ensure roadmap record exists
      let { data: roadmap } = await supabase
        .from('roadmaps')
        .select('id')
        .eq('user_id', userId)
        .eq('role_id', roleId)
        .maybeSingle();

      if (!roadmap) {
        const { data: created, error: createError } = await supabase
          .from('roadmaps')
          .insert({
            user_id: userId,
            role_id: roleId,
            role_version: 'v1.0',
            hours_per_week: 8,
            status: 'active',
          })
          .select('id')
          .single();

        if (createError) {
          return { data: null, error: createError.message };
        }
        roadmap = created;
      }

      // Upsert tasks
      const taskRows = healedTasks.map(t => ({
        id: t.id.includes('-') && t.id.length >= 32 ? t.id : undefined, // only use uuid if valid
        roadmap_id: roadmap!.id,
        user_id: userId,
        week_number: t.weekNumber,
        title: t.title,
        description: t.description,
        deliverable: t.deliverable,
        estimated_hours: t.estimatedHours,
        resource_url: t.resourceUrl || null,
        status: t.status === 'completed' ? 'done' : t.status,
        completed_at: t.completedAt ? new Date(t.completedAt).toISOString() : null,
      }));

      // Delete existing tasks and recreate (clean sync)
      await supabase.from('roadmap_tasks').delete().eq('roadmap_id', roadmap!.id).eq('user_id', userId);
      const { error: insertError } = await supabase.from('roadmap_tasks').insert(taskRows);

      if (insertError) {
        return { data: null, error: insertError.message };
      }

      return { data: null, error: null };
    } catch (err) {
      return { data: null, error: String(err) };
    }
  }

  async toggleTask(userId: string, roleId: number, taskId: string): Promise<RepositoryResult<RoadmapTask[]>> {
    if (!supabase || !isSupabaseConfigured()) {
      return new LocalRoadmapRepository().toggleTask(userId, roleId, taskId);
    }

    const current = await this.getRoadmapTasks(userId, roleId);
    if (!current.data) return { data: null, error: current.error };

    const updated: RoadmapTask[] = current.data.map(t => {
      if (t.id === taskId) {
        const nextStatus: RoadmapTask['status'] = t.status === 'completed' ? 'todo' : 'completed';
        return {
          ...t,
          status: nextStatus,
          completedAt: nextStatus === 'completed' ? new Date().toISOString().split('T')[0] : undefined,
        };
      }
      return t;
    });

    await this.saveRoadmapTasks(userId, roleId, updated);
    return { data: updated, error: null };
  }
}

export const defaultRoadmapRepository: IRoadmapRepository = new SupabaseRoadmapRepository();
