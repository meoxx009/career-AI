/**
 * Typed Supabase Client boundary.
 *
 * Security & Runtime Rules:
 * 1. Uses ONLY publishable keys (VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY / VITE_SUPABASE_ANON_KEY).
 * 2. NEVER exposes or accepts service-role secret keys in the browser bundle.
 * 3. Gracefully degrades to local deterministic guest mode if credentials are missing.
 * 4. Zero runtime crashes on unconfigured environments.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          username: string | null;
          contact_email: string | null;
          profile_image_url: string | null;
          profile_image_storage_key: string | null;
          learner_stage: string | null;
          school_class: string | null;
          stream: string | null;
          degree: string | null;
          specialization: string | null;
          institution: string | null;
          expected_graduation_year: string | null;
          branch: string | null;
          study_year: number | null;
          hours_per_week: number | null;
          preferred_roles: string[];
          location_preference: string | null;
          cgpa: string | null;
          current_skills: string[];
          interests: string[];
          favorite_subjects: string[];
          preferred_work_direction: string | null;
          project_facts: string | null;
          target_role_id: number | null;
          target_role_slug: string | null;
          portfolio_url: string | null;
          github_url: string | null;
          linkedin_url: string | null;
          font_size_preference: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          username?: string | null;
          contact_email?: string | null;
          profile_image_url?: string | null;
          profile_image_storage_key?: string | null;
          learner_stage?: string | null;
          school_class?: string | null;
          stream?: string | null;
          degree?: string | null;
          specialization?: string | null;
          institution?: string | null;
          expected_graduation_year?: string | null;
          branch?: string | null;
          study_year?: number | null;
          hours_per_week?: number | null;
          preferred_roles?: string[];
          location_preference?: string | null;
          cgpa?: string | null;
          current_skills?: string[];
          interests?: string[];
          favorite_subjects?: string[];
          preferred_work_direction?: string | null;
          project_facts?: string | null;
          target_role_id?: number | null;
          target_role_slug?: string | null;
          portfolio_url?: string | null;
          github_url?: string | null;
          linkedin_url?: string | null;
          font_size_preference?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          username?: string | null;
          contact_email?: string | null;
          profile_image_url?: string | null;
          profile_image_storage_key?: string | null;
          learner_stage?: string | null;
          school_class?: string | null;
          stream?: string | null;
          degree?: string | null;
          specialization?: string | null;
          institution?: string | null;
          expected_graduation_year?: string | null;
          branch?: string | null;
          study_year?: number | null;
          hours_per_week?: number | null;
          preferred_roles?: string[];
          location_preference?: string | null;
          cgpa?: string | null;
          current_skills?: string[];
          interests?: string[];
          favorite_subjects?: string[];
          preferred_work_direction?: string | null;
          project_facts?: string | null;
          target_role_id?: number | null;
          target_role_slug?: string | null;
          portfolio_url?: string | null;
          github_url?: string | null;
          linkedin_url?: string | null;
          font_size_preference?: string | null;
          updated_at?: string;
        };
      };
      skills: {
        Row: {
          id: number;
          slug: string;
          name: string;
          category: string;
          description: string;
          active: boolean;
        };
      };
      career_roles: {
        Row: {
          id: number;
          slug: string;
          name: string;
          level: string;
          description: string;
          source_label: string;
          source_url: string | null;
          source_checked_at: string | null;
          version: string;
          active: boolean;
        };
      };
      role_skills: {
        Row: {
          role_id: number;
          skill_id: number;
          target_level: number;
          importance: number;
          prerequisite_order: number;
          rationale: string;
          version: string;
        };
      };
      assessment_questions: {
        Row: {
          id: string;
          skill_id: number;
          category: string;
          prompt: string;
          options_json: Record<string, string>;
          answer_key: string;
          explanation: string;
          difficulty: string;
          version: string;
          active: boolean;
        };
      };
      assessment_attempts: {
        Row: {
          id: string;
          user_id: string;
          version: string;
          started_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          version: string;
          started_at?: string;
          completed_at?: string | null;
        };
      };
      assessment_answers: {
        Row: {
          id: string;
          attempt_id: string;
          user_id: string;
          question_id: string;
          selected_key: string | null;
          is_correct: boolean | null;
          answered_at: string;
        };
        Insert: {
          id?: string;
          attempt_id: string;
          user_id: string;
          question_id: string;
          selected_key?: string | null;
          is_correct?: boolean | null;
          answered_at?: string;
        };
      };
      skill_observations: {
        Row: {
          id: string;
          user_id: string;
          skill_id: number;
          value: number | null;
          scale_max: number;
          source: string;
          evidence_note: string | null;
          confidence: string;
          rubric_version: string;
          observed_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          skill_id: number;
          value?: number | null;
          scale_max?: number;
          source: string;
          evidence_note?: string | null;
          confidence?: string;
          rubric_version: string;
          observed_at?: string;
        };
      };
      roadmaps: {
        Row: {
          id: string;
          user_id: string;
          role_id: number;
          role_version: string;
          hours_per_week: number;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role_id: number;
          role_version: string;
          hours_per_week: number;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      roadmap_tasks: {
        Row: {
          id: string;
          roadmap_id: string;
          user_id: string;
          week_number: number;
          title: string;
          description: string;
          deliverable: string;
          estimated_hours: number;
          prerequisite_task_id: string | null;
          resource_url: string | null;
          status: string;
          completed_at: string | null;
          template_id?: string | null;
          parent_task_id?: string | null;
          segment_index?: number | null;
          segment_count?: number | null;
          scheduled_hours?: number | null;
          skill_id?: string | null;
          skill_name?: string | null;
          prerequisite_template_id?: string | null;
        };
        Insert: {
          id?: string;
          roadmap_id: string;
          user_id: string;
          week_number: number;
          title: string;
          description: string;
          deliverable: string;
          estimated_hours: number;
          prerequisite_task_id?: string | null;
          resource_url?: string | null;
          status?: string;
          completed_at?: string | null;
          template_id?: string | null;
          parent_task_id?: string | null;
          segment_index?: number | null;
          segment_count?: number | null;
          scheduled_hours?: number | null;
          skill_id?: string | null;
          skill_name?: string | null;
          prerequisite_template_id?: string | null;
        };
        Update: {
          status?: string;
          completed_at?: string | null;
          template_id?: string | null;
          parent_task_id?: string | null;
          segment_index?: number | null;
          segment_count?: number | null;
          scheduled_hours?: number | null;
          skill_id?: string | null;
          skill_name?: string | null;
          prerequisite_template_id?: string | null;
        };
      };
      resume_documents: {
        Row: {
          id: string;
          user_id: string;
          label: string;
          raw_text: string;
          facts?: unknown[] | null;
          suggestions?: unknown[] | null;
          role_id?: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          label?: string;
          raw_text: string;
          facts?: unknown[] | null;
          suggestions?: unknown[] | null;
          role_id?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          label?: string;
          raw_text?: string;
          facts?: unknown[] | null;
          suggestions?: unknown[] | null;
          role_id?: number | null;
          updated_at?: string;
        };
      };
      interview_sessions: {
        Row: {
          id: string;
          user_id: string;
          role_id: number | null;
          mode: string;
          question_id: string | null;
          question_text: string;
          answer_text: string | null;
          rubric_result_json: unknown;
          model_label: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role_id?: number | null;
          mode: string;
          question_id?: string | null;
          question_text: string;
          answer_text?: string | null;
          rubric_result_json?: unknown;
          model_label?: string;
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

// Default publishable configuration for CareerAI production & preview instances
const DEFAULT_SUPABASE_URL = 'https://ufoslvvpuceazzpgmdgr.supabase.co';
const DEFAULT_SUPABASE_KEY = 'sb_publishable_yeIWzC8Z18E1FvuzjZxU8A_atwHZAEM';

// Environment resolution with Vite import.meta.env with project defaults
const envUrl =
  (typeof import.meta !== 'undefined' ? import.meta.env?.VITE_SUPABASE_URL : undefined) ||
  DEFAULT_SUPABASE_URL;

const envKey =
  (typeof import.meta !== 'undefined'
    ? import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env?.VITE_SUPABASE_ANON_KEY
    : undefined) ||
  DEFAULT_SUPABASE_KEY;

/**
 * Checks whether valid Supabase publishable credentials are configured.
 * Accepts both legacy anon JWT keys (eyJ...) and new publishable key format (sb_publishable_...).
 */
export function isSupabaseConfigured(): boolean {
  // Automated test runner runs in deterministic local guest mode unless live tests are explicitly enabled
  if (typeof import.meta !== 'undefined' && import.meta.env?.MODE === 'test' && !import.meta.env?.VITE_TEST_LIVE_SUPABASE) {
    return false;
  }
  if (!envUrl || !envKey) return false;
  try {
    const parsed = new URL(envUrl);
    const urlOk = parsed.protocol.startsWith('http') && parsed.hostname.includes('supabase');
    const keyOk = envKey.trim().length > 10 &&
      (envKey.startsWith('eyJ') || envKey.startsWith('sb_publishable_') || envKey.startsWith('sb_anon_'));
    return urlOk && keyOk;
  } catch {
    return false;
  }
}

/**
 * Creates and initializes the typed Supabase client.
 * Returns null if credentials are unconfigured or invalid, ensuring zero app crashes.
 */
function initSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured() || !envUrl || !envKey) {
    return null;
  }

  try {
    return createClient(envUrl, envKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  } catch (error) {
    console.warn('[CareerAI] Failed to initialize Supabase client; falling back to local guest mode:', error);
    return null;
  }
}

export const supabase: SupabaseClient | null = initSupabaseClient();

export function getSupabaseClient(): SupabaseClient | null {
  return supabase;
}
