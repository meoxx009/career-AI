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
      const loaded = isUserScoped ? parsed : parsed.profile;
      return { data: loaded ? { ...EMPTY_PROFILE, ...loaded } : EMPTY_PROFILE, error: null };
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
        username: data.username || undefined,
        contactEmail: data.contact_email || undefined,
        profileImageUrl: data.profile_image_url || undefined,
        profileImageStorageKey: data.profile_image_storage_key || undefined,
        learnerStage: (data.learner_stage as UserProfile['learnerStage']) || undefined,
        schoolClass: data.school_class || undefined,
        stream: (data.stream as UserProfile['stream']) || undefined,
        degree: data.degree || undefined,
        specialization: data.specialization || undefined,
        institution: data.institution || undefined,
        expectedGraduationYear: data.expected_graduation_year || undefined,
        branch: data.branch || '',
        studyYear: data.study_year ? String(data.study_year) : '',
        hoursPerWeek: data.hours_per_week ? Number(data.hours_per_week) : 8,
        preferredRoles: data.preferred_roles || [],
        preferredRoleIds: data.target_role_id ? [data.target_role_id] : [],
        cgpa: data.cgpa || '',
        locationPreference: data.location_preference || '',
        currentSkills: data.current_skills || [],
        interests: data.interests || [],
        favoriteSubjects: data.favorite_subjects || [],
        preferredWorkDirection: data.preferred_work_direction || undefined,
        projectFacts: data.project_facts || '',
        portfolioUrl: data.portfolio_url || undefined,
        githubUrl: data.github_url || undefined,
        linkedinUrl: data.linkedin_url || undefined,
        isGuestDemo: false,
        targetRoleId: data.target_role_id !== null && data.target_role_id !== undefined ? Number(data.target_role_id) : undefined,
        targetRoleSlug: data.target_role_slug || undefined,
        fontSizePreference: (data.font_size_preference as UserProfile['fontSizePreference']) || undefined,
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
          username: profile.username || null,
          contact_email: profile.contactEmail || null,
          profile_image_url: profile.profileImageUrl || null,
          profile_image_storage_key: profile.profileImageStorageKey || null,
          learner_stage: profile.learnerStage || null,
          school_class: profile.schoolClass || null,
          stream: profile.stream || null,
          degree: profile.degree || null,
          specialization: profile.specialization || null,
          institution: profile.institution || null,
          expected_graduation_year: profile.expectedGraduationYear || null,
          branch: profile.branch || null,
          study_year: studyYearNum && !isNaN(studyYearNum) ? studyYearNum : null,
          hours_per_week: hoursNum && !isNaN(hoursNum) ? hoursNum : 8,
          preferred_roles: profile.preferredRoles || [],
          location_preference: profile.locationPreference || null,
          cgpa: profile.cgpa || null,
          current_skills: profile.currentSkills || [],
          interests: profile.interests || [],
          favorite_subjects: profile.favoriteSubjects || [],
          preferred_work_direction: profile.preferredWorkDirection || null,
          project_facts: profile.projectFacts || null,
          target_role_id: profile.targetRoleId !== undefined ? profile.targetRoleId : null,
          target_role_slug: profile.targetRoleSlug || null,
          portfolio_url: profile.portfolioUrl || null,
          github_url: profile.githubUrl || null,
          linkedin_url: profile.linkedinUrl || null,
          font_size_preference: profile.fontSizePreference || null,
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
