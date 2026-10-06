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

  private getScopedKey(userId: string, roleId: number): string {
    const isUserScoped = Boolean(userId && !userId.startsWith('guest'));
    return isUserScoped
      ? `career_ai_roadmap_${userId}_${roleId}`
      : `career_ai_roadmap_guest_${roleId}`;
  }

  async getRoadmapTasks(userId: string, roleId: number): Promise<RepositoryResult<RoadmapTask[]>> {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return { data: DEFAULT_ROADMAP_TASKS, error: null };
      }
      const key = this.getScopedKey(userId, roleId);
      const raw = window.localStorage.getItem(key);
      const path = CAREER_CATALOGUE.find(p => p.numericId === roleId);

      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const healed = healRoadmapTasks(parsed, path?.slug);
          return { data: healed, error: null };
        }
      }

      // User backwards compatibility fallback: check legacy unscoped key
      const isUserScoped = Boolean(userId && !userId.startsWith('guest'));
      if (isUserScoped) {
        const legacyUserRaw = window.localStorage.getItem(`career_ai_roadmap_${userId}`);
        if (legacyUserRaw) {
          const parsed = JSON.parse(legacyUserRaw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const healed = healRoadmapTasks(parsed, path?.slug);
            return { data: healed, error: null };
          }
        }
      } else {
        // Guest backwards compatibility fallback: check legacy storageKey
        const legacyRaw = window.localStorage.getItem(this.storageKey);
        if (legacyRaw) {
          const legacyParsed = JSON.parse(legacyRaw);
          if (Array.isArray(legacyParsed?.roadmapTasks) && legacyParsed.roadmapTasks.length > 0) {
            const healed = healRoadmapTasks(legacyParsed.roadmapTasks, path?.slug);
            return { data: healed, error: null };
          }
        }
      }

      return { data: DEFAULT_ROADMAP_TASKS, error: null };
    } catch (err) {
      return { data: DEFAULT_ROADMAP_TASKS, error: String(err) };
    }
  }

  async saveRoadmapTasks(userId: string, roleId: number, tasks: RoadmapTask[]): Promise<RepositoryResult<void>> {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return { data: null, error: null };
      }
      const key = this.getScopedKey(userId, roleId);
      const path = CAREER_CATALOGUE.find(p => p.numericId === roleId);
      const healedTasks = healRoadmapTasks(tasks, path?.slug);
      window.localStorage.setItem(key, JSON.stringify(healedTasks));

      // Guest backwards compatibility: also update legacy state
      const isUserScoped = Boolean(userId && !userId.startsWith('guest'));
      if (!isUserScoped) {
        const legacyRaw = window.localStorage.getItem(this.storageKey);
        const state = legacyRaw ? JSON.parse(legacyRaw) : {};
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
        return { data: [], error: null };
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
        return { data: [], error: null };
      }

      const mapped: RoadmapTask[] = tasks.map(t => {
        const stableId = t.template_id || t.id;
        return {
          id: stableId,
          weekNumber: t.week_number,
          title: t.title,
          description: t.description,
          deliverable: t.deliverable,
          estimatedHours: Number(t.estimated_hours),
          prerequisiteTaskId: t.prerequisite_template_id || t.prerequisite_task_id || undefined,
          resourceUrl: t.resource_url || '',
          status: (t.status === 'done' ? 'completed' : t.status === 'in_progress' ? 'in_progress' : 'todo') as RoadmapTask['status'],
          completedAt: t.completed_at ? t.completed_at.split('T')[0] : undefined,
          templateId: t.template_id || undefined,
          parentTaskId: t.parent_task_id || undefined,
          segmentIndex: t.segment_index !== null && t.segment_index !== undefined ? Number(t.segment_index) : undefined,
          segmentCount: t.segment_count !== null && t.segment_count !== undefined ? Number(t.segment_count) : undefined,
          scheduledHours: t.scheduled_hours !== null && t.scheduled_hours !== undefined ? Number(t.scheduled_hours) : undefined,
          skillId: t.skill_id || undefined,
          skillName: t.skill_name || undefined,
          actualWork: t.actual_work || undefined,
        };
      });

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

      // Upsert tasks with durable identity
      const taskRows = healedTasks.map(t => {
        const canonicalTemplateId = t.templateId || t.parentTaskId || t.id.split('__s')[0];
        const isUuid = Boolean(t.id && t.id.includes('-') && t.id.length >= 32);
        return {
          id: isUuid ? t.id : undefined, // database id
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
          template_id: t.id, // Store exact durable client ID in template_id!
          parent_task_id: t.parentTaskId || canonicalTemplateId,
          segment_index: t.segmentIndex !== undefined ? t.segmentIndex : 0,
          segment_count: t.segmentCount !== undefined ? t.segmentCount : 1,
          scheduled_hours: t.scheduledHours !== undefined ? t.scheduledHours : t.estimatedHours,
          skill_id: t.skillId || null,
          skill_name: t.skillName || null,
          prerequisite_template_id: t.prerequisiteTaskId || null,
          actual_work: t.actualWork || null,
        };
      });

      // Delete existing tasks and recreate (clean sync with preserved template_id)
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
