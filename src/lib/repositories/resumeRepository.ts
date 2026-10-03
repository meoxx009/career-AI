import type { ResumeDocument } from '../../types';
import type { IResumeRepository, RepositoryResult } from './types';
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { STORAGE_KEY, EMPTY_RESUME } from '../../context/careerConstants';

export class LocalResumeRepository implements IResumeRepository {
  private storageKey: string;

  constructor(storageKey: string = STORAGE_KEY) {
    this.storageKey = storageKey;
  }

  async getResumeDocument(_userId: string): Promise<RepositoryResult<ResumeDocument>> {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return { data: EMPTY_RESUME, error: null };
      }
      const raw = window.localStorage.getItem(this.storageKey);
      if (!raw) return { data: EMPTY_RESUME, error: null };
      const parsed = JSON.parse(raw);
      return { data: parsed.resumeDoc || EMPTY_RESUME, error: null };
    } catch (err) {
      return { data: EMPTY_RESUME, error: String(err) };
    }
  }

  async saveResumeDocument(_userId: string, resume: ResumeDocument): Promise<RepositoryResult<void>> {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return { data: null, error: null };
      }
      const raw = window.localStorage.getItem(this.storageKey);
      const state = raw ? JSON.parse(raw) : {};
      state.resumeDoc = resume;
      window.localStorage.setItem(this.storageKey, JSON.stringify(state));
      return { data: null, error: null };
    } catch (err) {
      return { data: null, error: String(err) };
    }
  }

  async saveInterviewSession(
    _userId: string,
    _roleId: number | null,
    _mode: 'behavioural' | 'technical',
    _questionId: string | null,
    _questionText: string,
    _answerText: string | null,
    _rubricResult: unknown
  ): Promise<RepositoryResult<void>> {
    // Local mode saves in browser session/state
    return { data: null, error: null };
  }
}

export class SupabaseResumeRepository implements IResumeRepository {
  async getResumeDocument(userId: string): Promise<RepositoryResult<ResumeDocument>> {
    if (!supabase || !isSupabaseConfigured()) {
      return new LocalResumeRepository().getResumeDocument(userId);
    }

    try {
      const { data, error } = await supabase
        .from('resume_documents')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        return { data: null, error: error.message };
      }

      if (!data) {
        return { data: EMPTY_RESUME, error: null };
      }

      const doc: ResumeDocument = {
        id: data.id,
        userId: data.user_id,
        label: data.label,
        rawText: data.raw_text,
        facts: [],
      };

      return { data: doc, error: null };
    } catch (err) {
      return { data: null, error: String(err) };
    }
  }

  async saveResumeDocument(userId: string, resume: ResumeDocument): Promise<RepositoryResult<void>> {
    if (!supabase || !isSupabaseConfigured()) {
      return new LocalResumeRepository().saveResumeDocument(userId, resume);
    }

    try {
      const { error } = await supabase.from('resume_documents').upsert({
        id: resume.id && resume.id.includes('-') && resume.id.length >= 32 ? resume.id : undefined,
        user_id: userId,
        label: resume.label || 'Draft Resume',
        raw_text: resume.rawText,
        updated_at: new Date().toISOString(),
      });

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: null, error: null };
    } catch (err) {
      return { data: null, error: String(err) };
    }
  }

  async saveInterviewSession(
    userId: string,
    roleId: number | null,
    mode: 'behavioural' | 'technical',
    questionId: string | null,
    questionText: string,
    answerText: string | null,
    rubricResult: unknown
  ): Promise<RepositoryResult<void>> {
    if (!supabase || !isSupabaseConfigured()) {
      return new LocalResumeRepository().saveInterviewSession(
        userId,
        roleId,
        mode,
        questionId,
        questionText,
        answerText,
        rubricResult
      );
    }

    try {
      const { error } = await supabase.from('interview_sessions').insert({
        user_id: userId,
        role_id: roleId,
        mode,
        question_id: questionId,
        question_text: questionText,
        answer_text: answerText,
        rubric_result_json: rubricResult,
        model_label: 'deterministic-rubric',
      });

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: null, error: null };
    } catch (err) {
      return { data: null, error: String(err) };
    }
  }
}

export const defaultResumeRepository: IResumeRepository = new SupabaseResumeRepository();
