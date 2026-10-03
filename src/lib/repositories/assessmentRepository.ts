import type { IAssessmentRepository, RepositoryResult } from './types';
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { STORAGE_KEY } from '../../context/careerConstants';

export class LocalAssessmentRepository implements IAssessmentRepository {
  private storageKey: string;

  constructor(storageKey: string = STORAGE_KEY) {
    this.storageKey = storageKey;
  }

  async createAttempt(userId: string, _version: string): Promise<RepositoryResult<{ id: string }>> {
    const attemptId = `attempt-${userId || 'guest'}-${Date.now()}`;
    return { data: { id: attemptId }, error: null };
  }

  async saveAnswer(
    attemptId: string,
    userId: string,
    questionId: string,
    selectedKey: string | null,
    _isCorrect: boolean | null
  ): Promise<RepositoryResult<void>> {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return { data: null, error: null };
      }

      // Save by attemptId
      const attemptKey = `career_ai_attempt_${attemptId}`;
      const rawAttempt = window.localStorage.getItem(attemptKey);
      const attemptAnswers = rawAttempt ? JSON.parse(rawAttempt) : {};
      if (selectedKey) {
        attemptAnswers[questionId] = selectedKey;
      } else {
        delete attemptAnswers[questionId];
      }
      window.localStorage.setItem(attemptKey, JSON.stringify(attemptAnswers));

      // Also save by user or guest scope
      const isUserScoped = Boolean(userId && !userId.startsWith('guest'));
      const key = isUserScoped ? `career_ai_answers_${userId}` : this.storageKey;
      const raw = window.localStorage.getItem(key);
      const state = raw ? JSON.parse(raw) : (isUserScoped ? {} : {});
      const target = isUserScoped ? state : (state.diagnosticAnswers = state.diagnosticAnswers || {});
      if (selectedKey) {
        target[questionId] = selectedKey;
      } else {
        delete target[questionId];
      }
      window.localStorage.setItem(key, JSON.stringify(state));
      return { data: null, error: null };
    } catch (err) {
      return { data: null, error: String(err) };
    }
  }

  async getAnswers(attemptId: string): Promise<RepositoryResult<Record<string, 'a' | 'b' | 'c' | 'd'>>> {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return { data: {}, error: null };
      }
      const attemptKey = `career_ai_attempt_${attemptId}`;
      const rawAttempt = window.localStorage.getItem(attemptKey);
      if (rawAttempt) {
        return { data: JSON.parse(rawAttempt), error: null };
      }
      const raw = window.localStorage.getItem(this.storageKey);
      if (!raw) return { data: {}, error: null };
      const parsed = JSON.parse(raw);
      return { data: parsed.diagnosticAnswers || {}, error: null };
    } catch (err) {
      return { data: {}, error: String(err) };
    }
  }

  async getUserAnswers(userId: string): Promise<RepositoryResult<Record<string, 'a' | 'b' | 'c' | 'd'>>> {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return { data: {}, error: null };
      }
      const isUserScoped = Boolean(userId && !userId.startsWith('guest'));
      const key = isUserScoped ? `career_ai_answers_${userId}` : this.storageKey;
      const raw = window.localStorage.getItem(key);
      if (!raw) return { data: {}, error: null };
      const parsed = JSON.parse(raw);
      return { data: (isUserScoped ? parsed : parsed.diagnosticAnswers) || {}, error: null };
    } catch (err) {
      return { data: {}, error: String(err) };
    }
  }
}

export class SupabaseAssessmentRepository implements IAssessmentRepository {
  async createAttempt(userId: string, version: string): Promise<RepositoryResult<{ id: string }>> {
    if (!supabase || !isSupabaseConfigured()) {
      return new LocalAssessmentRepository().createAttempt(userId, version);
    }

    try {
      const { data, error } = await supabase
        .from('assessment_attempts')
        .insert({
          user_id: userId,
          version,
        })
        .select('id')
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: { id: data.id }, error: null };
    } catch (err) {
      return { data: null, error: String(err) };
    }
  }

  async saveAnswer(
    attemptId: string,
    userId: string,
    questionId: string,
    selectedKey: string | null,
    isCorrect: boolean | null
  ): Promise<RepositoryResult<void>> {
    if (!supabase || !isSupabaseConfigured()) {
      return new LocalAssessmentRepository().saveAnswer(attemptId, userId, questionId, selectedKey, isCorrect);
    }

    try {
      const { error } = await supabase
        .from('assessment_answers')
        .upsert(
          {
            attempt_id: attemptId,
            user_id: userId,
            question_id: questionId,
            selected_key: selectedKey,
            is_correct: isCorrect,
            answered_at: new Date().toISOString(),
          },
          { onConflict: 'attempt_id,question_id' }
        );

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: null, error: null };
    } catch (err) {
      return { data: null, error: String(err) };
    }
  }

  async getAnswers(attemptId: string): Promise<RepositoryResult<Record<string, 'a' | 'b' | 'c' | 'd'>>> {
    if (!supabase || !isSupabaseConfigured()) {
      return new LocalAssessmentRepository().getAnswers(attemptId);
    }

    try {
      const { data, error } = await supabase
        .from('assessment_answers')
        .select('question_id, selected_key')
        .eq('attempt_id', attemptId);

      if (error) {
        return { data: null, error: error.message };
      }

      const answers: Record<string, 'a' | 'b' | 'c' | 'd'> = {};
      (data || []).forEach(row => {
        if (row.selected_key && ['a', 'b', 'c', 'd'].includes(row.selected_key)) {
          answers[row.question_id] = row.selected_key as 'a' | 'b' | 'c' | 'd';
        }
      });

      return { data: answers, error: null };
    } catch (err) {
      return { data: null, error: String(err) };
    }
  }

  async getUserAnswers(userId: string): Promise<RepositoryResult<Record<string, 'a' | 'b' | 'c' | 'd'>>> {
    if (!supabase || !isSupabaseConfigured()) {
      return new LocalAssessmentRepository().getUserAnswers(userId);
    }

    try {
      const { data: attempt, error: attemptErr } = await supabase
        .from('assessment_attempts')
        .select('id')
        .eq('user_id', userId)
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (attemptErr) {
        return { data: {}, error: attemptErr.message };
      }

      if (!attempt) {
        return { data: {}, error: null };
      }

      return this.getAnswers(attempt.id);
    } catch (err) {
      return { data: {}, error: String(err) };
    }
  }
}

export const defaultAssessmentRepository: IAssessmentRepository = new SupabaseAssessmentRepository();
