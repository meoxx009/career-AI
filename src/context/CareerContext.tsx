import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type {
  UserProfile,
  RoadmapTask,
  ResumeDocument,
  ResumeSuggestion,
  CareerRole,
  InterviewSessionRecord,
  FontSizePreference,
} from '../types';
import {
  SEED_ROLES,
  ROLES_BY_ID,
  ROLES_BY_SLUG,
  SEED_ROADMAP_TEMPLATES,
} from '../data/seedData';
import {
  DEMO_RAHUL_PROFILE,
  DEMO_RAHUL_ROADMAP_TASKS,
  DEMO_RAHUL_RESUME,
  FICTIONAL_DEMO_BADGE,
} from '../data/demoRahul';
import { generateRoadmapPlan } from '../lib/roadmapGenerator';
import { INTERVIEW_EVALUATION_CAVEAT } from '../lib/interviewEvaluator';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { defaultProfileRepository } from '../lib/repositories/profileRepository';
import { defaultAssessmentRepository } from '../lib/repositories/assessmentRepository';
import { defaultObservationRepository } from '../lib/repositories/observationRepository';
import { defaultRoadmapRepository } from '../lib/repositories/roadmapRepository';
import { defaultInterviewRepository } from '../lib/repositories/interviewRepository';
import { logProductEvent } from '../lib/analytics';
import { AuthModal } from '../components/AuthModal';
import {
  getAIProvider,
  DeterministicFallbackAdapter,
  type RoleExplanationInput,
  type RoleExplanationOutput,
  type ResumeReviewInput,
  type ResumeReviewOutput,
  type InterviewFeedbackInput,
  type InterviewFeedbackOutput,
  type AIResult,
  type AIProviderMeta,
} from '../lib/ai-adapter';

interface CareerContextType {
  profile: UserProfile;
  updateProfile: (profile: Partial<UserProfile>) => void;
  isDemoMode: boolean;
  demoBadgeText: string;
  storageNotice: string;
  skillObservations: Record<number, number | null>;
  setSkillObservation: (skillId: number, level: number | null) => void;
  diagnosticAnswers: Record<string, 'a' | 'b' | 'c' | 'd'>;
  setDiagnosticAnswer: (questionId: string, answerKey: 'a' | 'b' | 'c' | 'd') => void;
  clearDiagnosticAnswer: (questionId: string) => void;
  selectedRoleId: number;
  selectedRoleSlug: string;
  selectedRole: CareerRole;
  setSelectedRoleId: (roleId: number) => void;
  setSelectedRoleSlug: (slug: string) => void;
  roadmapTasks: RoadmapTask[];
  toggleTaskCompletion: (taskId: string) => void;
  rescheduleRoadmap: (newWeeklyHours: number) => { valid: boolean; error?: string };
  resumeDoc: ResumeDocument;
  updateResumeText: (text: string) => void;
  resumeSuggestions: ResumeSuggestion[];
  updateSuggestionStatus: (index: number, status: ResumeSuggestion['status'], updatedRewrite?: string) => void;
  setResumeSuggestions: (suggestions: ResumeSuggestion[]) => void;
  aiMode: 'ai' | 'deterministic-fallback';
  setAiMode: (mode: 'ai' | 'deterministic-fallback') => void;
  language: 'en' | 'hi';
  setLanguage: (lang: 'en' | 'hi') => void;
  fontSizePreference: FontSizePreference;
  setFontSizePreference: (pref: FontSizePreference) => void;
  resetFontSizePreference: () => void;
  toastMessage: string | null;
  showToast: (message: string) => void;
  consentGiven: boolean;
  setConsentGiven: (consent: boolean) => void;
  loadRahulDemo: () => void;
  resetToDemo: () => void;
  resetFresh: () => void;
  user: { id: string; email?: string } | null;
  isAuthenticated: boolean;
  isSupabaseAvailable: boolean;
  authLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  isAuthModalOpen: boolean;
  authModalMode: 'signin' | 'signup' | 'reset';
  openAuthModal: (mode?: 'signin' | 'signup' | 'reset') => void;
  closeAuthModal: () => void;
  persistenceStatus: 'idle' | 'saving' | 'saved' | 'failed';
  lastPersistenceError: string | null;
  isSaving: boolean;
  retryLastSave: () => Promise<void>;
  refetchUserData: () => Promise<void>;
  saveProfile: (partial: Partial<UserProfile>) => Promise<boolean>;
  saveDiagnosticAnswer: (questionId: string, answerKey: 'a' | 'b' | 'c' | 'd') => Promise<boolean>;
  saveSkillObservation: (skillId: number, level: number | null) => Promise<boolean>;
  saveSkillObservationsBatch: (observations: Array<{ skillId: number; value: number | null; source: string }>) => Promise<boolean>;
  interviewHistory: InterviewSessionRecord[];
  saveInterviewAttempt: (session: Omit<InterviewSessionRecord, 'id' | 'savedAt'>) => Promise<{ success: boolean; error?: string }>;
  deleteInterviewAttempt: (sessionId: string) => Promise<void>;
  aiProviderMeta: AIProviderMeta;
  explainRoleWithAI: (input: RoleExplanationInput) => Promise<AIResult<RoleExplanationOutput>>;
  reviewResumeWithAI: (input: ResumeReviewInput) => Promise<AIResult<ResumeReviewOutput>>;
  evaluateInterviewWithAI: (input: InterviewFeedbackInput) => Promise<AIResult<InterviewFeedbackOutput>>;
  exportUserData: () => void;
  eraseUserData: () => Promise<void>;
}

import {
  STORAGE_KEY,
  STORAGE_NOTICE,
  EMPTY_PROFILE,
  EMPTY_RESUME,
  DEFAULT_ROADMAP_TASKS,
  createEmptyObservations,
  rahulObservationsMap,
} from './careerConstants';

const CareerContext = createContext<CareerContextType | undefined>(undefined);

export const CareerProvider = ({ children }: { children: ReactNode }) => {
  // Load state from localStorage or start fresh empty
  const savedState = (() => {
    try {
      const item = localStorage.getItem(STORAGE_KEY);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  })();

  const [profile, setProfile] = useState<UserProfile>(
    savedState?.profile || EMPTY_PROFILE
  );

  const [skillObservations, setSkillObservations] = useState<Record<number, number | null>>(
    savedState?.skillObservations || createEmptyObservations()
  );

  const [diagnosticAnswers, setDiagnosticAnswers] = useState<Record<string, 'a' | 'b' | 'c' | 'd'>>(
    savedState?.diagnosticAnswers || {}
  );

  const [selectedRoleId, setSelectedRoleIdState] = useState<number>(
    savedState?.selectedRoleId || 1
  );

  const [roadmapTasks, setRoadmapTasks] = useState<RoadmapTask[]>(
    savedState?.roadmapTasks || DEFAULT_ROADMAP_TASKS
  );

  const [resumeDoc, setResumeDoc] = useState<ResumeDocument>(
    savedState?.resumeDoc || EMPTY_RESUME
  );

  const [resumeSuggestions, setResumeSuggestions] = useState<ResumeSuggestion[]>(
    savedState?.resumeSuggestions || []
  );

  const [interviewHistory, setInterviewHistory] = useState<InterviewSessionRecord[]>(
    savedState?.interviewHistory || []
  );

  const [aiMode, setAiMode] = useState<'ai' | 'deterministic-fallback'>(
    savedState?.aiMode || 'deterministic-fallback'
  );

  const [consentGiven, setConsentGiven] = useState<boolean>(
    savedState?.consentGiven ?? true
  );

  const [language, setLanguage] = useState<'en' | 'hi'>(
    savedState?.language || 'en'
  );

  const [fontSizePreference, setFontSizePreferenceState] = useState<FontSizePreference>(() => {
    try {
      const stored = localStorage.getItem('career_ai_font_size') as FontSizePreference;
      if (stored && ['default', 'comfortable', 'large', 'extra-large'].includes(stored)) {
        return stored;
      }
      return profile.fontSizePreference || savedState?.fontSizePreference || 'default';
    } catch {
      return 'default';
    }
  });

  // Apply font size preference to root DOM element
  useEffect(() => {
    try {
      localStorage.setItem('career_ai_font_size', fontSizePreference);
    } catch {
      // ignore storage failure
    }
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-font-size', fontSizePreference);
      const scaleMap: Record<FontSizePreference, string> = {
        default: '16px',
        comfortable: '17px',
        large: '18px',
        'extra-large': '20px',
      };
      const px = scaleMap[fontSizePreference] || '16px';
      document.documentElement.style.fontSize = px;
      document.documentElement.style.setProperty('--app-font-size', px);
    }
  }, [fontSizePreference]);

  const setFontSizePreference = useCallback((pref: FontSizePreference) => {
    setFontSizePreferenceState(pref);
    setProfile(prev => ({ ...prev, fontSizePreference: pref }));
  }, []);

  const resetFontSizePreference = useCallback(() => {
    setFontSizePreference('default');
  }, [setFontSizePreference]);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(prev => (prev === message ? null : prev));
    }, 2800);
  };

  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup' | 'reset'>('signin');

  const [persistenceStatus, setPersistenceStatus] = useState<'idle' | 'saving' | 'saved' | 'failed'>('idle');
  const [lastPersistenceError, setLastPersistenceError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [lastFailedAction, setLastFailedAction] = useState<(() => Promise<boolean>) | null>(null);

  const isSupabaseAvailable = isSupabaseConfigured();

  // Load authenticated user data across all repositories
  const loadUserData = useCallback(async (userId: string) => {
    try {
      const profRes = await defaultProfileRepository.getProfile(userId);
      let activeRoleId = 1;
      if (profRes.data && (profRes.data.displayName || profRes.data.targetRoleId)) {
        setProfile({ ...profRes.data, isGuestDemo: false });
        if (profRes.data.targetRoleId) {
          activeRoleId = profRes.data.targetRoleId;
        }
      } else {
        setProfile({ ...EMPTY_PROFILE, id: userId, isGuestDemo: false });
      }
      setSelectedRoleIdState(activeRoleId);

      const answersRes = await defaultAssessmentRepository.getUserAnswers(userId);
      setDiagnosticAnswers(answersRes.data || {});

      const obsRes = await defaultObservationRepository.getObservations(userId);
      setSkillObservations(obsRes.data || createEmptyObservations());

      const roadmapRes = await defaultRoadmapRepository.getRoadmapTasks(userId, activeRoleId);
      if (roadmapRes.data && roadmapRes.data.length > 0) {
        setRoadmapTasks(roadmapRes.data);
      } else {
        const initial = generateRoadmapPlan({
          roleId: activeRoleId,
          weeklyStudyHours: profRes.data?.hoursPerWeek || 8,
          templates: SEED_ROADMAP_TEMPLATES,
        });
        if (initial.valid) {
          setRoadmapTasks(initial.tasks);
        }
      }

      const interviewRes = await defaultInterviewRepository.getInterviewSessions(userId);
      if (interviewRes.data) {
        setInterviewHistory(interviewRes.data);
      }
    } catch (err) {
      console.warn('Failed loading user data:', err);
    }
  }, []);

  // Sync state to localStorage ONLY for unauthenticated guests
  useEffect(() => {
    if (user !== null) {
      // Authenticated users never sync private state into the shared demo key
      return;
    }
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          profile,
          skillObservations,
          diagnosticAnswers,
          selectedRoleId,
          roadmapTasks,
          resumeDoc,
          resumeSuggestions,
          interviewHistory,
          aiMode,
          language,
          fontSizePreference,
          consentGiven,
        })
      );
    } catch {
      // storage unavailable
    }
  }, [
    user,
    profile,
    skillObservations,
    diagnosticAnswers,
    selectedRoleId,
    roadmapTasks,
    resumeDoc,
    resumeSuggestions,
    interviewHistory,
    aiMode,
    language,
    fontSizePreference,
    consentGiven,
  ]);

  // Supabase Auth listener
  useEffect(() => {
    if (!supabase || !isSupabaseAvailable) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email });
        loadUserData(session.user.id);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email });
        await loadUserData(session.user.id);
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [isSupabaseAvailable, loadUserData]);

  const updateProfile = (partial: Partial<UserProfile>) => {
    setProfile(prev => ({ ...prev, ...partial }));
  };

  const saveProfile = async (partial: Partial<UserProfile>): Promise<boolean> => {
    // Synthetic Rahul demo profile is strictly guest-only and must never be saved to user databases
    if (profile.isGuestDemo) {
      setProfile(prev => ({ ...prev, ...partial }));
      return true;
    }

    if (isSaving) {
      return false; // prevent double submit
    }

    setIsSaving(true);
    setPersistenceStatus('saving');
    setLastPersistenceError(null);

    // Optimistically preserve draft locally so user never loses edits on network failure
    const updatedDraft = { ...profile, ...partial, isGuestDemo: false };
    setProfile(updatedDraft);

    if (!user) {
      setIsSaving(false);
      setPersistenceStatus('saved');
      return true;
    }

    try {
      const toSave = { ...updatedDraft, id: user.id };
      const res = await defaultProfileRepository.upsertProfile(toSave);
      if (res.error) {
        setPersistenceStatus('failed');
        setLastPersistenceError(res.error);
        setLastFailedAction(() => () => saveProfile(partial));
        setIsSaving(false);
        return false;
      }

      // Read back confirmed record from persistence boundary
      const readBack = await defaultProfileRepository.getProfile(user.id);
      if (readBack.data) {
        setProfile({ ...readBack.data, isGuestDemo: false });
      }

      setPersistenceStatus('saved');
      setLastPersistenceError(null);
      setLastFailedAction(null);
      setIsSaving(false);
      logProductEvent('profile_saved', {
        roleTarget: updatedDraft.targetRoleId,
        hoursPerWeek: updatedDraft.hoursPerWeek,
      });
      return true;
    } catch (err) {
      setPersistenceStatus('failed');
      setLastPersistenceError(String(err));
      setLastFailedAction(() => () => saveProfile(partial));
      setIsSaving(false);
      return false;
    }
  };

  const setSkillObservation = (skillId: number, level: number | null) => {
    setSkillObservations(prev => ({ ...prev, [skillId]: level }));
  };

  const saveSkillObservation = async (skillId: number, level: number | null): Promise<boolean> => {
    setSkillObservations(prev => ({ ...prev, [skillId]: level }));

    if (profile.isGuestDemo || !user) {
      return true;
    }

    try {
      setIsSaving(true);
      setPersistenceStatus('saving');
      const res = await defaultObservationRepository.saveObservation(user.id, skillId, level, 'self_report');
      if (res.error) {
        setPersistenceStatus('failed');
        setLastPersistenceError(res.error);
        setIsSaving(false);
        return false;
      }

      const readBack = await defaultObservationRepository.getObservations(user.id);
      if (readBack.data) {
        setSkillObservations(readBack.data);
      }

      setPersistenceStatus('saved');
      setLastPersistenceError(null);
      setIsSaving(false);
      logProductEvent('skill_observation_saved', { skillId, level });
      return true;
    } catch (err) {
      setPersistenceStatus('failed');
      setLastPersistenceError(String(err));
      setIsSaving(false);
      return false;
    }
  };

  const saveSkillObservationsBatch = async (
    observations: Array<{ skillId: number; value: number | null; source: string }>
  ): Promise<boolean> => {
    setSkillObservations(prev => {
      const copy = { ...prev };
      observations.forEach(o => {
        copy[o.skillId] = o.value;
      });
      return copy;
    });

    if (profile.isGuestDemo || !user) {
      return true;
    }

    try {
      setIsSaving(true);
      setPersistenceStatus('saving');
      const res = await defaultObservationRepository.saveObservationsBatch(user.id, observations);
      if (res.error) {
        setPersistenceStatus('failed');
        setLastPersistenceError(res.error);
        setIsSaving(false);
        return false;
      }

      const readBack = await defaultObservationRepository.getObservations(user.id);
      if (readBack.data) {
        setSkillObservations(readBack.data);
      }

      setPersistenceStatus('saved');
      setLastPersistenceError(null);
      setIsSaving(false);
      return true;
    } catch (err) {
      setPersistenceStatus('failed');
      setLastPersistenceError(String(err));
      setIsSaving(false);
      return false;
    }
  };

  const setDiagnosticAnswer = (questionId: string, answerKey: 'a' | 'b' | 'c' | 'd') => {
    setDiagnosticAnswers(prev => ({ ...prev, [questionId]: answerKey }));
  };

  const saveDiagnosticAnswer = async (
    questionId: string,
    answerKey: 'a' | 'b' | 'c' | 'd'
  ): Promise<boolean> => {
    setDiagnosticAnswers(prev => ({ ...prev, [questionId]: answerKey }));

    if (profile.isGuestDemo || !user) {
      setPersistenceStatus('saved');
      return true;
    }

    try {
      setIsSaving(true);
      setPersistenceStatus('saving');
      const attemptId = `attempt-${user.id}`;
      const res = await defaultAssessmentRepository.saveAnswer(
        attemptId,
        user.id,
        questionId,
        answerKey,
        null
      );
      if (res.error) {
        setPersistenceStatus('failed');
        setLastPersistenceError(res.error);
        setIsSaving(false);
        return false;
      }

      const readBack = await defaultAssessmentRepository.getUserAnswers(user.id);
      if (readBack.data) {
        setDiagnosticAnswers(readBack.data);
      }

      setPersistenceStatus('saved');
      setLastPersistenceError(null);
      setIsSaving(false);
      logProductEvent('assessment_question_answered', { questionId });
      return true;
    } catch (err) {
      setPersistenceStatus('failed');
      setLastPersistenceError(String(err));
      setIsSaving(false);
      return false;
    }
  };

  const clearDiagnosticAnswer = (questionId: string) => {
    setDiagnosticAnswers(prev => {
      const copy = { ...prev };
      delete copy[questionId];
      return copy;
    });
  };

  const setSelectedRoleId = (roleId: number) => {
    setSelectedRoleIdState(roleId);
    const result = generateRoadmapPlan({
      roleId,
      weeklyStudyHours: profile.hoursPerWeek || 8,
      templates: SEED_ROADMAP_TEMPLATES,
    });
    if (result.valid) {
      setRoadmapTasks(result.tasks);
      if (user && !profile.isGuestDemo) {
        defaultRoadmapRepository.saveRoadmapTasks(user.id, roleId, result.tasks).catch(() => {});
        const role = ROLES_BY_ID.get(roleId);
        if (role) {
          saveProfile({ targetRoleId: role.id, targetRoleSlug: role.slug });
        }
      }
    }
  };

  const rescheduleRoadmap = (newWeeklyHours: number): { valid: boolean; error?: string } => {
    const result = generateRoadmapPlan({
      roleId: selectedRoleId,
      weeklyStudyHours: newWeeklyHours,
      templates: SEED_ROADMAP_TEMPLATES,
      existingTasks: roadmapTasks,
    });

    if (!result.valid) {
      return { valid: false, error: result.error };
    }

    setRoadmapTasks(result.tasks);
    setProfile(prev => ({ ...prev, hoursPerWeek: newWeeklyHours }));
    if (user && !profile.isGuestDemo) {
      defaultRoadmapRepository.saveRoadmapTasks(user.id, selectedRoleId, result.tasks).catch(() => {});
      saveProfile({ hoursPerWeek: newWeeklyHours });
    }
    showToast(`Roadmap rescheduled to ${newWeeklyHours} hrs/week (${result.estimatedWeeks} weeks).`);
    return { valid: true };
  };

  const setSelectedRoleSlug = (slug: string) => {
    const matched = ROLES_BY_SLUG.get(slug);
    if (matched) {
      setSelectedRoleId(matched.id);
    }
  };

  const toggleTaskCompletion = async (taskId: string) => {
    const updated = roadmapTasks.map(task => {
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

    setRoadmapTasks(updated);

    if (profile.isGuestDemo || !user) {
      return;
    }

    try {
      setIsSaving(true);
      setPersistenceStatus('saving');
      await defaultRoadmapRepository.saveRoadmapTasks(user.id, selectedRoleId, updated);
      const readBack = await defaultRoadmapRepository.getRoadmapTasks(user.id, selectedRoleId);
      if (readBack.data) {
        setRoadmapTasks(readBack.data);
      }
      setPersistenceStatus('saved');
      setIsSaving(false);
      logProductEvent('roadmap_task_toggled', { taskId });
    } catch {
      setIsSaving(false);
    }
  };

  const retryLastSave = async (): Promise<void> => {
    if (lastFailedAction) {
      await lastFailedAction();
    }
  };

  const refetchUserData = async (): Promise<void> => {
    if (user) {
      await loadUserData(user.id);
    }
  };

  const updateResumeText = (text: string) => {
    setResumeDoc(prev => ({ ...prev, rawText: text }));
  };

  const updateSuggestionStatus = (
    index: number,
    status: ResumeSuggestion['status'],
    updatedRewrite?: string
  ) => {
    setResumeSuggestions(prev =>
      prev.map((sug, i) => {
        if (i === index) {
          return {
            ...sug,
            status,
            rewrite: updatedRewrite !== undefined ? updatedRewrite : sug.rewrite,
          };
        }
        return sug;
      })
    );
  };

  const saveInterviewAttempt = async (
    sessionInput: Omit<InterviewSessionRecord, 'id' | 'savedAt'>
  ): Promise<{ success: boolean; error?: string }> => {
    const newSession: InterviewSessionRecord = {
      ...sessionInput,
      id: `interview-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      savedAt: new Date().toISOString(),
    };

    setInterviewHistory(prev => [newSession, ...prev.filter(s => s.id !== newSession.id)]);

    const activeUserId = user ? user.id : 'guest-learner';

    try {
      const res = await defaultInterviewRepository.saveInterviewSession({
        ...newSession,
        userId: activeUserId,
      });
      if (res.error) {
        return { success: false, error: res.error };
      }
      logProductEvent('interview_session_saved', {
        roleId: sessionInput.roleId,
        questionId: sessionInput.questionId,
        metCount: sessionInput.feedback.metCount,
        totalCount: sessionInput.feedback.totalCount,
      });
      return { success: true };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  };

  const deleteInterviewAttempt = async (sessionId: string): Promise<void> => {
    setInterviewHistory(prev => prev.filter(s => s.id !== sessionId));
    const activeUserId = user ? user.id : 'guest-learner';
    await defaultInterviewRepository.deleteInterviewSession(activeUserId, sessionId);
  };

  const loadRahulDemo = () => {
    setProfile(DEMO_RAHUL_PROFILE);
    setSkillObservations(rahulObservationsMap);
    setDiagnosticAnswers({
      q01: 'a',
      q02: 'b',
      q03: 'a',
      q05: 'a',
      q06: 'a',
      q07: 'a',
    });
    setSelectedRoleIdState(1);
    setRoadmapTasks(DEMO_RAHUL_ROADMAP_TASKS);
    setResumeDoc(DEMO_RAHUL_RESUME);
    setResumeSuggestions([]);
    setInterviewHistory([
      {
        id: 'interview-demo-rahul-01',
        userId: 'synthetic-demo-rahul-01',
        roleId: 1,
        questionId: 'ib01',
        mode: 'behavioural',
        questionPrompt: 'Tell me about a project problem you solved. What was your contribution and what did you learn?',
        answerText: 'In my Python CLI task organizer project, I encountered corrupted JSON files during sudden program interruptions. I wrote unit tests with pytest to isolate the parsing crash, implemented atomic write operations using temporary staging files with safe rename, and verified that edge cases return user-friendly errors instead of unhandled exceptions. This reinforced the importance of transactional writes and defensive error handling even in simple utilities.',
        feedback: {
          questionId: 'ib01',
          criteriaResults: [
            { id: 'context', label: 'Specific Technical Context', description: 'Identifies the project, system component, or technical bug being addressed.', met: true, guidance: '' },
            { id: 'contribution', label: 'Personal Technical Contribution', description: 'Specifies what code, tests, or scripts you personally authored.', met: true, guidance: '' },
            { id: 'decision', label: 'Technical Decision & Rationale', description: 'Explains why a specific technical approach was chosen over alternatives.', met: true, guidance: '' },
            { id: 'result_or_limitation', label: 'Concrete Result or Constraint', description: 'Mentions the verifiable outcome or an engineering limitation/trade-off.', met: true, guidance: '' },
            { id: 'reflection', label: 'Engineering Reflection / Takeaway', description: 'Shares an honest insight, lesson learned, or what you would do differently.', met: true, guidance: '' },
          ],
          metCount: 5,
          totalCount: 5,
          percentage: 100,
          strengths: [
            'Specific Technical Context: Clear coverage of project context',
            'Personal Technical Contribution: Demonstrated with evidence ("I wrote unit tests with pytest")',
            'Technical Decision & Rationale: Explained technical approach',
            'Concrete Result or Constraint: Verifiable outcome reached',
            'Engineering Reflection / Takeaway: Articulated lesson on transactional writes',
          ],
          missingPoints: [],
          nextAction: 'Excellent coverage across all rubric criteria. Practice articulating this answer concisely in under 2 minutes.',
          caveat: INTERVIEW_EVALUATION_CAVEAT,
          evaluatedAt: '2026-10-02T10:00:00Z',
        },
        savedAt: '2026-10-02T10:00:00Z',
      },
    ]);
    setAiMode('deterministic-fallback');
    setLanguage('en');
    setConsentGiven(true);
    showToast('Loaded synthetic demo profile (Rahul Sharma).');
  };

  const resetToDemo = () => {
    loadRahulDemo();
  };

  const resetFresh = () => {
    setProfile(EMPTY_PROFILE);
    setSkillObservations(createEmptyObservations());
    setDiagnosticAnswers({});
    setSelectedRoleIdState(1);
    setRoadmapTasks(DEFAULT_ROADMAP_TASKS);
    setResumeDoc(EMPTY_RESUME);
    setResumeSuggestions([]);
    setInterviewHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // storage unavailable
    }
    showToast('Cleared local data. Starting fresh profile.');
  };

  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setAuthLoading(true);
    if (!supabase || !isSupabaseAvailable) {
      setAuthLoading(false);
      const localId = 'local-user-' + email.toLowerCase().replace(/[^a-zA-Z0-9]/g, '_');
      const newUser = { id: localId, email };
      setUser(newUser);
      await loadUserData(localId);
      return { success: true };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      setAuthLoading(false);
      if (error) {
        return { success: false, error: error.message };
      }
      if (data.user) {
        const newUser = { id: data.user.id, email: data.user.email };
        setUser(newUser);
        await loadUserData(data.user.id);
        return { success: true };
      }
      return { success: false, error: 'User session not created.' };
    } catch (err) {
      setAuthLoading(false);
      return { success: false, error: String(err) };
    }
  };

  const signUp = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setAuthLoading(true);
    if (!supabase || !isSupabaseAvailable) {
      setAuthLoading(false);
      const localId = 'local-user-' + email.toLowerCase().replace(/[^a-zA-Z0-9]/g, '_');
      const newUser = { id: localId, email };
      setUser(newUser);
      await loadUserData(localId);
      return { success: true };
    }

    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      setAuthLoading(false);
      if (error) {
        return { success: false, error: error.message };
      }
      if (data.user) {
        const newUser = { id: data.user.id, email: data.user.email };
        setUser(newUser);
        await loadUserData(data.user.id);
      }
      return { success: true };
    } catch (err) {
      setAuthLoading(false);
      return { success: false, error: String(err) };
    }
  };

  const signOut = async (): Promise<void> => {
    if (supabase && isSupabaseAvailable) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setProfile(EMPTY_PROFILE);
    setSkillObservations(createEmptyObservations());
    setDiagnosticAnswers({});
    setRoadmapTasks(DEFAULT_ROADMAP_TASKS);
    setResumeDoc(EMPTY_RESUME);
    setResumeSuggestions([]);
    setInterviewHistory([]);
    setPersistenceStatus('idle');
    setLastPersistenceError(null);
    setLastFailedAction(null);
    showToast('Signed out. In-memory private session cleared.');
  };

  const exportUserData = () => {
    const exportBundle = {
      version: 'career_ai_export_v1',
      exportedAt: new Date().toISOString(),
      user: user ? { id: user.id, email: user.email } : null,
      profile,
      diagnosticAnswers,
      skillObservations,
      selectedRoleId,
      roadmapTasks,
      resumeDoc,
      interviewHistory,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportBundle, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `career-ai-export-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Exported your CareerAI data bundle as JSON.');
  };

  const eraseUserData = async (): Promise<void> => {
    if (user) {
      try {
        await defaultProfileRepository.deleteProfile(user.id);
      } catch (err) {
        console.warn('Failed deleting profile:', err);
      }
    }

    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Storage unavailable
    }

    await signOut();
    showToast('All user data and session state wiped successfully.');
  };

  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    if (!supabase || !isSupabaseAvailable) {
      return { success: true };
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/settings',
      });
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  };

  const openAuthModal = (mode: 'signin' | 'signup' | 'reset' = 'signin') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const activeProvider = getAIProvider();
  const aiProviderMeta: AIProviderMeta = {
    provider: aiMode === 'deterministic-fallback' ? 'deterministic-fallback' : activeProvider.providerName,
    model: aiMode === 'deterministic-fallback' ? 'local-rules-engine' : activeProvider.modelName,
    promptVersion: '2026-10-02.1',
  };

  const explainRoleWithAI = useCallback(
    async (input: RoleExplanationInput): Promise<AIResult<RoleExplanationOutput>> => {
      const provider = aiMode === 'deterministic-fallback' ? new DeterministicFallbackAdapter() : getAIProvider();
      return provider.explainRoleAlignment(input);
    },
    [aiMode]
  );

  const reviewResumeWithAI = useCallback(
    async (input: ResumeReviewInput): Promise<AIResult<ResumeReviewOutput>> => {
      const provider = aiMode === 'deterministic-fallback' ? new DeterministicFallbackAdapter() : getAIProvider();
      return provider.suggestResumeReview(input);
    },
    [aiMode]
  );

  const evaluateInterviewWithAI = useCallback(
    async (input: InterviewFeedbackInput): Promise<AIResult<InterviewFeedbackOutput>> => {
      const provider = aiMode === 'deterministic-fallback' ? new DeterministicFallbackAdapter() : getAIProvider();
      return provider.evaluateInterviewAnswer(input);
    },
    [aiMode]
  );

  const selectedRole = ROLES_BY_ID.get(selectedRoleId) || SEED_ROLES[0];
  const selectedRoleSlug = selectedRole.slug;
  const isDemoMode = Boolean(profile.isGuestDemo);

  return (
    <CareerContext.Provider
      value={{
        profile,
        updateProfile,
        isDemoMode,
        demoBadgeText: FICTIONAL_DEMO_BADGE,
        storageNotice: STORAGE_NOTICE,
        skillObservations,
        setSkillObservation,
        diagnosticAnswers,
        setDiagnosticAnswer,
        clearDiagnosticAnswer,
        selectedRoleId,
        selectedRoleSlug,
        selectedRole,
        setSelectedRoleId,
        setSelectedRoleSlug,
        roadmapTasks,
        toggleTaskCompletion,
        rescheduleRoadmap,
        resumeDoc,
        updateResumeText,
        resumeSuggestions,
        updateSuggestionStatus,
        setResumeSuggestions,
        interviewHistory,
        saveInterviewAttempt,
        deleteInterviewAttempt,
        aiMode,
        setAiMode,
        language,
        setLanguage,
        fontSizePreference,
        setFontSizePreference,
        resetFontSizePreference,
        toastMessage,
        showToast,
        consentGiven,
        setConsentGiven,
        loadRahulDemo,
        resetToDemo,
        resetFresh,
        user,
        isAuthenticated: Boolean(user),
        isSupabaseAvailable,
        authLoading,
        signIn,
        signUp,
        signOut,
        resetPassword,
        isAuthModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
        persistenceStatus,
        lastPersistenceError,
        isSaving,
        retryLastSave,
        refetchUserData,
        saveProfile,
        saveDiagnosticAnswer,
        saveSkillObservation,
        saveSkillObservationsBatch,
        aiProviderMeta,
        explainRoleWithAI,
        reviewResumeWithAI,
        evaluateInterviewWithAI,
        exportUserData,
        eraseUserData,
      }}
    >
      {children}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={closeAuthModal}
        initialMode={authModalMode}
      />
    </CareerContext.Provider>
  );
};

export const useCareer = () => {
  const context = useContext(CareerContext);
  if (!context) {
    throw new Error('useCareer must be used within a CareerProvider');
  }
  return context;
};
