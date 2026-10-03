import type { IObservationRepository, RepositoryResult } from './types';
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { STORAGE_KEY, createEmptyObservations } from '../../context/careerConstants';

export class LocalObservationRepository implements IObservationRepository {
  private storageKey: string;

  constructor(storageKey: string = STORAGE_KEY) {
    this.storageKey = storageKey;
  }

  async getObservations(userId: string): Promise<RepositoryResult<Record<number, number | null>>> {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return { data: createEmptyObservations(), error: null };
      }
      const isUserScoped = Boolean(userId && !userId.startsWith('guest'));
      const key = isUserScoped ? `career_ai_obs_${userId}` : this.storageKey;
      const raw = window.localStorage.getItem(key);
      if (!raw) return { data: createEmptyObservations(), error: null };
      const parsed = JSON.parse(raw);
      return { data: (isUserScoped ? parsed : parsed.skillObservations) || createEmptyObservations(), error: null };
    } catch (err) {
      return { data: createEmptyObservations(), error: String(err) };
    }
  }

  async saveObservation(
    userId: string,
    skillId: number,
    value: number | null,
    source: string
  ): Promise<RepositoryResult<void>> {
    return this.saveObservationsBatch(userId, [{ skillId, value, source }]);
  }

  async saveObservationsBatch(
    userId: string,
    observations: Array<{ skillId: number; value: number | null; source: string }>
  ): Promise<RepositoryResult<void>> {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return { data: null, error: null };
      }
      const isUserScoped = Boolean(userId && !userId.startsWith('guest'));
      const key = isUserScoped ? `career_ai_obs_${userId}` : this.storageKey;
      const raw = window.localStorage.getItem(key);
      const state = raw ? JSON.parse(raw) : (isUserScoped ? createEmptyObservations() : {});
      const target = isUserScoped ? state : (state.skillObservations = state.skillObservations || createEmptyObservations());
      observations.forEach(obs => {
        target[obs.skillId] = obs.value;
      });
      window.localStorage.setItem(key, JSON.stringify(state));
      return { data: null, error: null };
    } catch (err) {
      return { data: null, error: String(err) };
    }
  }
}

export class SupabaseObservationRepository implements IObservationRepository {
  async getObservations(userId: string): Promise<RepositoryResult<Record<number, number | null>>> {
    if (!supabase || !isSupabaseConfigured()) {
      return new LocalObservationRepository().getObservations(userId);
    }

    try {
      const { data, error } = await supabase
        .from('skill_observations')
        .select('skill_id, value')
        .eq('user_id', userId);

      if (error) {
        return { data: null, error: error.message };
      }

      const map = createEmptyObservations();
      (data || []).forEach(row => {
        map[row.skill_id] = row.value !== null ? Number(row.value) : null;
      });

      return { data: map, error: null };
    } catch (err) {
      return { data: null, error: String(err) };
    }
  }

  async saveObservation(
    userId: string,
    skillId: number,
    value: number | null,
    source: string
  ): Promise<RepositoryResult<void>> {
    return this.saveObservationsBatch(userId, [{ skillId, value, source }]);
  }

  async saveObservationsBatch(
    userId: string,
    observations: Array<{ skillId: number; value: number | null; source: string }>
  ): Promise<RepositoryResult<void>> {
    if (!supabase || !isSupabaseConfigured()) {
      return new LocalObservationRepository().saveObservationsBatch(userId, observations);
    }

    try {
      const rows = observations.map(obs => ({
        user_id: userId,
        skill_id: obs.skillId,
        value: obs.value,
        scale_max: 4,
        source: obs.source,
        confidence: obs.value !== null ? 'high' : 'needs_more_evidence',
        rubric_version: 'v1.0',
        observed_at: new Date().toISOString(),
      }));

      const { error } = await supabase.from('skill_observations').insert(rows);

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: null, error: null };
    } catch (err) {
      return { data: null, error: String(err) };
    }
  }
}

export const defaultObservationRepository: IObservationRepository = new SupabaseObservationRepository();
