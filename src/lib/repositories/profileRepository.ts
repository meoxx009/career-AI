import type { UserProfile } from '../../types';
import type { IProfileRepository, RepositoryResult } from './types';
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { STORAGE_KEY, EMPTY_PROFILE } from '../../context/careerConstants';

export class LocalProfileRepository implements IProfileRepository {
  private storageKey: string;

  constructor(storageKey: string = STORAGE_KEY) {
    this.storageKey = storageKey;
  }

  async getProfile(userId: string): Promise<RepositoryResult<UserProfile>> {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return { data: EMPTY_PROFILE, error: null };
      }
      const isUserScoped = Boolean(userId && !userId.startsWith('guest'));
      const key = isUserScoped ? `career_ai_profile_${userId}` : this.storageKey;
      const raw = window.localStorage.getItem(key);
      if (!raw) return { data: EMPTY_PROFILE, error: null };
      const parsed = JSON.parse(raw);
      return { data: (isUserScoped ? parsed : parsed.profile) || EMPTY_PROFILE, error: null };
    } catch (err) {
      return { data: EMPTY_PROFILE, error: String(err) };
    }
  }

  async upsertProfile(profile: UserProfile): Promise<RepositoryResult<UserProfile>> {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return { data: profile, error: null };
      }
      const isUserScoped = Boolean(profile.id && !profile.id.startsWith('guest'));
      if (isUserScoped) {
        window.localStorage.setItem(`career_ai_profile_${profile.id}`, JSON.stringify(profile));
      } else {
        const raw = window.localStorage.getItem(this.storageKey);
        const state = raw ? JSON.parse(raw) : {};
        state.profile = profile;
        window.localStorage.setItem(this.storageKey, JSON.stringify(state));
      }
      return { data: profile, error: null };
    } catch (err) {
      return { data: null, error: String(err) };
    }
  }

  async deleteProfile(userId: string): Promise<RepositoryResult<void>> {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(`career_ai_profile_${userId}`);
      }
      return { data: undefined, error: null };
    } catch (err) {
      return { data: null, error: String(err) };
    }
  }
}

export class SupabaseProfileRepository implements IProfileRepository {
  async getProfile(userId: string): Promise<RepositoryResult<UserProfile>> {
    if (!supabase || !isSupabaseConfigured()) {
      return new LocalProfileRepository().getProfile(userId);
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        return { data: null, error: error.message };
      }

      if (!data) {
        return { data: EMPTY_PROFILE, error: null };
      }

      const profile: UserProfile = {
        id: data.id,
        displayName: data.display_name || '',
        branch: data.branch || '',
        studyYear: data.study_year ? String(data.study_year) : '',
        hoursPerWeek: data.hours_per_week ? Number(data.hours_per_week) : 8,
        preferredRoles: data.preferred_roles || [],
        preferredRoleIds: [],
        cgpa: '',
        locationPreference: data.location_preference || '',
        currentSkills: [],
        projectFacts: '',
        isGuestDemo: false,
        targetRoleId: 1,
      };

      return { data: profile, error: null };
    } catch (err) {
      return { data: null, error: String(err) };
    }
  }

  async upsertProfile(profile: UserProfile): Promise<RepositoryResult<UserProfile>> {
    if (!supabase || !isSupabaseConfigured()) {
      return new LocalProfileRepository().upsertProfile(profile);
    }

    try {
      const studyYearNum = profile.studyYear ? parseInt(profile.studyYear, 10) : null;
      const hoursNum = profile.hoursPerWeek ? Number(profile.hoursPerWeek) : null;

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: profile.id,
          display_name: profile.displayName || null,
          branch: profile.branch || null,
          study_year: studyYearNum && !isNaN(studyYearNum) ? studyYearNum : null,
          hours_per_week: hoursNum && !isNaN(hoursNum) ? hoursNum : 8,
          preferred_roles: profile.preferredRoles || [],
          location_preference: profile.locationPreference || null,
          updated_at: new Date().toISOString(),
        })
        .select('*')
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: profile, error: null };
    } catch (err) {
      return { data: null, error: String(err) };
    }
  }

  async deleteProfile(userId: string): Promise<RepositoryResult<void>> {
    if (!supabase || !isSupabaseConfigured()) {
      return new LocalProfileRepository().deleteProfile(userId);
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: undefined, error: null };
    } catch (err) {
      return { data: null, error: String(err) };
    }
  }
}

export const defaultProfileRepository: IProfileRepository = new SupabaseProfileRepository();
