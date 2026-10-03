import type { InterviewSessionRecord } from '../../types';
import type { IInterviewRepository, RepositoryResult } from './types';
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { STORAGE_KEY } from '../../context/careerConstants';

const INTERVIEW_LOCAL_KEY = 'career_ai_interview_history_v1';

export class LocalInterviewRepository implements IInterviewRepository {
  private getStoredSessions(): InterviewSessionRecord[] {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return [];
      }
      // Check isolated interview key first, fallback to unified storage key
      const raw = window.localStorage.getItem(INTERVIEW_LOCAL_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
      const unifiedRaw = window.localStorage.getItem(STORAGE_KEY);
      if (unifiedRaw) {
        const parsed = JSON.parse(unifiedRaw);
        return parsed.interviewHistory || [];
      }
      return [];
    } catch {
      return [];
    }
  }

  private saveStoredSessions(sessions: InterviewSessionRecord[]): void {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return;
      window.localStorage.setItem(INTERVIEW_LOCAL_KEY, JSON.stringify(sessions));

      // Also sync into unified storage key for consistency
      const unifiedRaw = window.localStorage.getItem(STORAGE_KEY);
      const unified = unifiedRaw ? JSON.parse(unifiedRaw) : {};
      unified.interviewHistory = sessions;
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(unified));
    } catch {
      // Storage unavailable or quota exceeded
    }
  }

  async getInterviewSessions(
    userId: string,
    roleId?: number
  ): Promise<RepositoryResult<InterviewSessionRecord[]>> {
    try {
      const all = this.getStoredSessions();
      const filtered = all.filter(s => {
        const matchesUser = s.userId === userId || userId.startsWith('guest-') || userId === 'local-user';
        const matchesRole = roleId ? s.roleId === roleId : true;
        return matchesUser && matchesRole;
      });
      return { data: filtered, error: null };
    } catch (err) {
      return { data: [], error: String(err) };
    }
  }

  async saveInterviewSession(session: InterviewSessionRecord): Promise<RepositoryResult<void>> {
    try {
      const all = this.getStoredSessions();
      // Prepend so newest appears first; keep max 50 sessions
      const updated = [session, ...all.filter(s => s.id !== session.id)].slice(0, 50);
      this.saveStoredSessions(updated);
      return { data: null, error: null };
    } catch (err) {
      return { data: null, error: String(err) };
    }
  }

  async deleteInterviewSession(
    _userId: string,
    sessionId: string
  ): Promise<RepositoryResult<void>> {
    try {
      const all = this.getStoredSessions();
      const updated = all.filter(s => s.id !== sessionId);
      this.saveStoredSessions(updated);
      return { data: null, error: null };
    } catch (err) {
      return { data: null, error: String(err) };
    }
  }
}

export class SupabaseInterviewRepository implements IInterviewRepository {
  async getInterviewSessions(
    userId: string,
    roleId?: number
  ): Promise<RepositoryResult<InterviewSessionRecord[]>> {
    if (!supabase || !isSupabaseConfigured() || userId.startsWith('guest-') || userId.startsWith('local-')) {
      return new LocalInterviewRepository().getInterviewSessions(userId, roleId);
    }

    try {
      let query = supabase
        .from('interview_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (roleId) {
        query = query.eq('role_id', roleId);
      }

      const { data, error } = await query;

      if (error) {
        // Fallback to local mode gracefully if table missing or offline
        return new LocalInterviewRepository().getInterviewSessions(userId, roleId);
      }

      const sessions: InterviewSessionRecord[] = (data || []).map(row => ({
        id: row.id,
        userId: row.user_id,
        roleId: Number(row.role_id) || 1,
        questionId: row.question_id || '',
        mode: row.mode as 'behavioural' | 'technical',
        questionPrompt: row.question_text,
        answerText: row.answer_text || '',
        feedback: row.rubric_result_json,
        savedAt: row.created_at,
      }));

      return { data: sessions, error: null };
    } catch {
      return new LocalInterviewRepository().getInterviewSessions(userId, roleId);
    }
  }

  async saveInterviewSession(session: InterviewSessionRecord): Promise<RepositoryResult<void>> {
    // Always mirror to local storage so user has instant offline access
    await new LocalInterviewRepository().saveInterviewSession(session);

    if (!supabase || !isSupabaseConfigured() || session.userId.startsWith('guest-') || session.userId.startsWith('local-')) {
      return { data: null, error: null };
    }

    try {
      const { error } = await supabase.from('interview_sessions').insert({
        id: session.id && session.id.includes('-') && session.id.length >= 32 ? session.id : undefined,
        user_id: session.userId,
        role_id: session.roleId,
        mode: session.mode,
        question_id: session.questionId,
        question_text: session.questionPrompt,
        answer_text: session.answerText,
        rubric_result_json: session.feedback,
        model_label: 'deterministic-rubric',
      });

      if (error) {
        // We still succeeded locally, but note remote error if needed
        return { data: null, error: error.message };
      }

      return { data: null, error: null };
    } catch (err) {
      return { data: null, error: String(err) };
    }
  }

  async deleteInterviewSession(
    userId: string,
    sessionId: string
  ): Promise<RepositoryResult<void>> {
    await new LocalInterviewRepository().deleteInterviewSession(userId, sessionId);

    if (!supabase || !isSupabaseConfigured() || userId.startsWith('guest-') || userId.startsWith('local-')) {
      return { data: null, error: null };
    }

    try {
      const { error } = await supabase
        .from('interview_sessions')
        .delete()
        .eq('id', sessionId)
        .eq('user_id', userId);

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: null, error: null };
    } catch (err) {
      return { data: null, error: String(err) };
    }
  }
}

export const defaultInterviewRepository: IInterviewRepository = new SupabaseInterviewRepository();
