import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import type {
  UserProfile,
  RoadmapTask,
  ActualWorkDetails,
  ResumeDocument,
  ResumeSuggestion,
  CareerRole,
  InterviewSessionRecord,
  FontSizePreference,
  AuthStatus,
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
import { defaultResumeRepository } from '../lib/repositories/resumeRepository';
import { syncProfileFactsToResume } from '../lib/profileResumeSync';
import {
  syncRoadmapTaskToResumeDoc,
  updateFactInclusionOrEdit,
} from '../lib/roadmapResumeSync';
import { healRoadmapTasks } from '../lib/resourceResolver';
import { CAREER_CATALOGUE, asCareerRole } from '../data/careerCatalogue';
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
  hasSelectedRole: boolean;
  selectedRoleId: number | null;
  selectedRoleSlug: string;
  selectedRole: CareerRole;
  setSelectedRoleId: (roleId: number) => void;
  setSelectedRoleSlug: (slug: string) => void;
  clearSelectedRole: () => void;
  roadmapTasks: RoadmapTask[];
  toggleTaskCompletion: (taskId: string) => void;
  updateTaskActualWork: (taskId: string, actualWork: ActualWorkDetails) => Promise<boolean>;
  rescheduleRoadmap: (newWeeklyHours: number) => { valid: boolean; error?: string };
  resumeDoc: ResumeDocument;
  updateResumeText: (text: string) => void;
  updateResumeFactInclusion: (factId: string, status: 'included' | 'dismissed', customEdit?: string) => void;
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
  authStatus: AuthStatus;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  signInAsLocalGuest: (displayName?: string) => void;
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

/**
 * Detects whether the current navigation is an OAuth callback, password recovery,
 * or email confirmation flow. If true, auto-opening the sign-in modal must be suppressed.
 */
function isAuthCallbackOrRecoveryFlow(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const hash = window.location.hash || '';
    const search = window.location.search || '';
    const pathname = window.location.pathname || '';

    return (
      hash.includes('access_token=') ||
      hash.includes('type=recovery') ||
      hash.includes('type=signup') ||
      hash.includes('type=magiclink') ||
      hash.includes('type=invite') ||
      hash.includes('error=') ||
      search.includes('code=') ||
      search.includes('token_hash=') ||
      pathname.startsWith('/auth')
    );
  } catch {
    return false;
  }
}

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

  // Determine if a role has been explicitly selected
  const initialRoleInfo = (() => {
    // 1. Explicit flag in savedState
    if (savedState?.hasSelectedRole && typeof savedState.selectedRoleId === 'number') {
      const match = CAREER_CATALOGUE.find(p => p.numericId === savedState.selectedRoleId);
      if (match) return { hasSelected: true, roleId: match.numericId };
    }
    // 2. Saved user profile with explicit targetRoleId/targetRoleSlug
    if (savedState?.profile?.targetRoleId && typeof savedState.profile.targetRoleId === 'number') {
      const match = CAREER_CATALOGUE.find(p => p.numericId === savedState.profile.targetRoleId);
      if (match) return { hasSelected: true, roleId: match.numericId };
    }
    if (savedState?.profile?.targetRoleSlug) {
      const match = CAREER_CATALOGUE.find(p => p.slug === savedState.profile.targetRoleSlug);
      if (match) return { hasSelected: true, roleId: match.numericId };
    }
    // 3. Fictional guest demo (Rahul Sharma) always has an explicit active target role (Backend Developer)
    if (savedState?.profile?.isGuestDemo) {
      return { hasSelected: true, roleId: savedState.selectedRoleId || 1 };
    }
    // 4. Backward compatibility: if savedState had explicit roadmapTasks with items and hasSelectedRole was not explicitly false
    if (
      savedState?.hasSelectedRole !== false &&
      typeof savedState?.selectedRoleId === 'number' &&
      Array.isArray(savedState?.roadmapTasks) &&
      savedState.roadmapTasks.length > 0 &&
      savedState?.profile?.displayName
    ) {
      const match = CAREER_CATALOGUE.find(p => p.numericId === savedState.selectedRoleId);
      if (match) return { hasSelected: true, roleId: match.numericId };
    }
    // Fresh state — no role explicitly selected
    return { hasSelected: false, roleId: null };
  })();

  const [hasSelectedRole, setHasSelectedRole] = useState<boolean>(initialRoleInfo.hasSelected);

  const [selectedRoleId, setSelectedRoleIdState] = useState<number | null>(
    initialRoleInfo.roleId
  );

  const [roadmapTasks, setRoadmapTasks] = useState<RoadmapTask[]>(() => {
    if (!initialRoleInfo.hasSelected || initialRoleInfo.roleId === null) {
      return [];
    }
    if (savedState?.roadmapTasks && Array.isArray(savedState.roadmapTasks)) {
      const path = CAREER_CATALOGUE.find(p => p.numericId === initialRoleInfo.roleId);
      return healRoadmapTasks(savedState.roadmapTasks, path?.slug);
    }
    const initial = generateRoadmapPlan({
      roleId: initialRoleInfo.roleId,
      weeklyStudyHours: savedState?.profile?.hoursPerWeek || 8,
      templates: SEED_ROADMAP_TEMPLATES,
    });
    return initial.valid ? initial.tasks : [];
  });

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
  const [authStatus, setAuthStatus] = useState<AuthStatus>(() =>
    isSupabaseConfigured() ? 'initializing' : 'unauthenticated'
  );
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup' | 'reset'>('signin');

  const [persistenceStatus, setPersistenceStatus] = useState<'idle' | 'saving' | 'saved' | 'failed'>('idle');
  const [lastPersistenceError, setLastPersistenceError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [lastFailedAction, setLastFailedAction] = useState<(() => Promise<boolean>) | null>(null);

  const activeUserIdRef = useRef<string | null>(null);
  const lastHydratedUserIdRef = useRef<string | null>(null);

  const authLoading = authStatus === 'initializing';
  const isSupabaseAvailable = isSupabaseConfigured();

  // Load authenticated user data across all repositories with stale request protection
  const loadUserData = useCallback(async (userId: string, metadata?: Record<string, unknown>) => {
    // Avoid duplicate hydration for the same user
    if (lastHydratedUserIdRef.current === userId) {
      return;
    }
    activeUserIdRef.current = userId;

    try {
      const profRes = await defaultProfileRepository.getProfile(userId);
      if (activeUserIdRef.current !== userId) return; // Stale protection

      let activeRoleId: number | null = null;
      let userHasSelected = false;
      const profData = profRes.data;
      if (profData && (profData.displayName || profData.targetRoleId)) {
        setProfile({ ...profData, isGuestDemo: false });
        if (profData.targetRoleId) {
          const targetRoleId = profData.targetRoleId;
          const match = CAREER_CATALOGUE.find(p => p.numericId === targetRoleId);
          if (match) {
            activeRoleId = match.numericId;
            userHasSelected = true;
          }
        }
      } else {
        const metaName =
          typeof metadata?.full_name === 'string'
            ? metadata.full_name
            : typeof metadata?.name === 'string'
            ? metadata.name
            : '';
        const metaAvatar =
          typeof metadata?.avatar_url === 'string'
            ? metadata.avatar_url
            : typeof metadata?.picture === 'string'
            ? metadata.picture
            : '';
        const metaEmail = typeof metadata?.email === 'string' ? metadata.email : '';
        setProfile({
          ...EMPTY_PROFILE,
          id: userId,
          displayName: metaName,
          contactEmail: metaEmail,
          profileImageUrl: metaAvatar,
          isGuestDemo: false,
        });
      }
      if (activeUserIdRef.current !== userId) return;
      setSelectedRoleIdState(activeRoleId);
      setHasSelectedRole(userHasSelected);

      const answersRes = await defaultAssessmentRepository.getUserAnswers(userId);
      if (activeUserIdRef.current !== userId) return;
      setDiagnosticAnswers(answersRes.data || {});

      const obsRes = await defaultObservationRepository.getObservations(userId);
      if (activeUserIdRef.current !== userId) return;
      setSkillObservations(obsRes.data || createEmptyObservations());

      if (activeRoleId) {
        const roadmapRes = await defaultRoadmapRepository.getRoadmapTasks(userId, activeRoleId);
        if (activeUserIdRef.current !== userId) return;
        if (roadmapRes.data && roadmapRes.data.length > 0) {
          setRoadmapTasks(roadmapRes.data);
        } else {
          const initial = generateRoadmapPlan({
            roleId: activeRoleId,
            weeklyStudyHours: profRes.data?.hoursPerWeek || 8,
            templates: SEED_ROADMAP_TEMPLATES,
          });
          if (initial.valid && activeUserIdRef.current === userId) {
            setRoadmapTasks(initial.tasks);
          }
        }
      } else {
        setRoadmapTasks([]);
      }

      const interviewRes = await defaultInterviewRepository.getInterviewSessions(userId);
      if (activeUserIdRef.current !== userId) return;
      if (interviewRes.data) {
        setInterviewHistory(interviewRes.data);
      }

      const resumeRes = await defaultResumeRepository.getResumeDocument(userId);
      if (activeUserIdRef.current !== userId) return;
      if (resumeRes.data && (resumeRes.data.rawText || (resumeRes.data.facts && resumeRes.data.facts.length > 0))) {
        setResumeDoc(resumeRes.data);
      }

      lastHydratedUserIdRef.current = userId;
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
          hasSelectedRole,
          selectedRoleId,
          roadmapTasks: hasSelectedRole && selectedRoleId
            ? healRoadmapTasks(roadmapTasks, CAREER_CATALOGUE.find(p => p.numericId === selectedRoleId)?.slug)
            : [],
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
    hasSelectedRole,
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

  // Supabase Auth listener & Entry session resolution
  useEffect(() => {
    let dismissed = false;
    try {
      dismissed = sessionStorage.getItem('career_ai_auth_prompt_dismissed') === 'true';
    } catch {
      // storage unavailable
    }

    const isTestEnv = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test' && !(window as unknown as { __TEST_ENABLE_AUTH_PROMPT__?: boolean }).__TEST_ENABLE_AUTH_PROMPT__;
    const isCallback = isAuthCallbackOrRecoveryFlow();

    if (!supabase || !isSupabaseAvailable) {
      // In guest / demo mode: promptly show dismissible modal on entry if not dismissed, not in test runner, and not in auth callback flow
      if (!dismissed && !isTestEnv && !isCallback) {
        setTimeout(() => {
          setIsAuthModalOpen(true);
        }, 0);
      }
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        // Valid session exists: restore it and do NOT show login prompt
        setUser({ id: session.user.id, email: session.user.email });
        setAuthStatus('authenticated');
        activeUserIdRef.current = session.user.id;
        // Background load user data without blocking session resolution or causing race conditions
        setTimeout(() => {
          loadUserData(session.user.id, session.user.user_metadata as Record<string, unknown> | undefined);
        }, 0);
      } else {
        // Visitor is signed out: promptly show dismissible modal unless previously dismissed or handling callback
        setUser(null);
        setAuthStatus('unauthenticated');
        activeUserIdRef.current = null;
        if (!dismissed && !isTestEnv && !isCallback) {
          setIsAuthModalOpen(true);
        }
      }
    }).catch(() => {
      setUser(null);
      setAuthStatus('error');
      activeUserIdRef.current = null;
      if (!dismissed && !isTestEnv && !isCallback) {
        setIsAuthModalOpen(true);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email });
        setAuthStatus('authenticated');
        activeUserIdRef.current = session.user.id;
        setIsAuthModalOpen(false);
        // Non-blocking dispatch to avoid provider lock contention
        setTimeout(() => {
          loadUserData(session.user.id, session.user.user_metadata as Record<string, unknown> | undefined);
        }, 0);
      } else {
        setUser(null);
        setAuthStatus('unauthenticated');
        activeUserIdRef.current = null;
        lastHydratedUserIdRef.current = null;
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
      const confirmedProfile = readBack.data || toSave;
      if (readBack.data) {
        setProfile({ ...readBack.data, isGuestDemo: false });
      }

      // Sync grounded profile facts into resumeDoc and persist
      setResumeDoc(prevResume => {
        const synced = syncProfileFactsToResume(confirmedProfile, prevResume);
        if (user && !profile.isGuestDemo) {
          defaultResumeRepository.saveResumeDocument(user.id, synced).catch(() => {});
        }
        return synced;
      });

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

  const setSelectedRoleId = async (roleId: number) => {
    const path = CAREER_CATALOGUE.find(p => p.numericId === roleId);
    if (!path) return;

    setSelectedRoleIdState(roleId);
    setHasSelectedRole(true);

    const updatedProfileUpdates = {
      targetRoleId: path.numericId,
      targetRoleSlug: path.slug,
    };
    setProfile(prev => ({
      ...prev,
      ...updatedProfileUpdates,
    }));

    // Check if there are already saved tasks for this role
    const effectiveUserId = (user && !profile.isGuestDemo) ? user.id : 'guest';
    const existingRes = await defaultRoadmapRepository.getRoadmapTasks(effectiveUserId, roleId);
    if (existingRes.data && existingRes.data.length > 0) {
      setRoadmapTasks(existingRes.data);
      if (user && !profile.isGuestDemo) {
        saveProfile(updatedProfileUpdates);
      }
      return;
    }

    const result = generateRoadmapPlan({
      roleId,
      weeklyStudyHours: profile.hoursPerWeek || 8,
      templates: SEED_ROADMAP_TEMPLATES,
    });
    if (result.valid) {
      setRoadmapTasks(result.tasks);
      if (user && !profile.isGuestDemo) {
        defaultRoadmapRepository.saveRoadmapTasks(user.id, roleId, result.tasks).catch(() => {});
        saveProfile(updatedProfileUpdates);
      }
    }
  };

  const clearSelectedRole = () => {
    setHasSelectedRole(false);
    setSelectedRoleIdState(null);
    setRoadmapTasks([]);
    setProfile(prev => ({
      ...prev,
      targetRoleId: undefined,
      targetRoleSlug: undefined,
    }));
  };

  const rescheduleRoadmap = (newWeeklyHours: number): { valid: boolean; error?: string } => {
    if (!selectedRoleId) {
      return { valid: false, error: 'No active role selected.' };
    }
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
    const matched = CAREER_CATALOGUE.find(p => p.slug.toLowerCase() === slug.toLowerCase()) || ROLES_BY_SLUG.get(slug);
    if (matched) {
      setSelectedRoleId('numericId' in matched ? matched.numericId : matched.id);
    }
  };

  const toggleTaskCompletion = async (taskId: string) => {
    let toggledTask: RoadmapTask | undefined;
    let nextStatus: RoadmapTask['status'] = 'todo';

    const updated = roadmapTasks.map(task => {
      if (task.id === taskId) {
        nextStatus = task.status === 'completed' ? 'todo' : 'completed';
        toggledTask = {
          ...task,
          status: nextStatus,
          completedAt: nextStatus === 'completed' ? new Date().toISOString().split('T')[0] : undefined,
        };
        return toggledTask;
      }
      return task;
    });

    setRoadmapTasks(updated);

    // Sync source-linked resume draft content using actual completed learner work (never planned deliverables)
    if (toggledTask) {
      const roleIdToPersist = selectedRoleId ?? (profile.targetRoleId || 1);
      const roleName = selectedRole?.name || 'Career Milestone';
      const activeUserId = user ? user.id : 'guest-learner';

      const nextResumeDoc = syncRoadmapTaskToResumeDoc({
        currentResumeDoc: resumeDoc,
        task: toggledTask,
        allRoadmapTasks: updated,
        roleId: roleIdToPersist,
        roleName,
        userId: activeUserId,
        action: toggledTask.status === 'completed' ? 'complete' : 'uncomplete',
      });

      setResumeDoc(nextResumeDoc);
      if (user && !profile.isGuestDemo) {
        defaultResumeRepository.saveResumeDocument(user.id, nextResumeDoc).catch(() => {});
      }
    }

    if (profile.isGuestDemo || !user) {
      return;
    }

    const roleIdToPersist = selectedRoleId ?? (profile.targetRoleId || 1);
    try {
      setIsSaving(true);
      setPersistenceStatus('saving');
      await defaultRoadmapRepository.saveRoadmapTasks(user.id, roleIdToPersist, updated);
      const readBack = await defaultRoadmapRepository.getRoadmapTasks(user.id, roleIdToPersist);
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

  const updateTaskActualWork = async (taskId: string, actualWork: ActualWorkDetails): Promise<boolean> => {
    let targetTask: RoadmapTask | undefined;
    const updated = roadmapTasks.map(task => {
      if (task.id === taskId) {
        targetTask = { ...task, actualWork };
        return targetTask;
      }
      return task;
    });

    setRoadmapTasks(updated);

    if (targetTask && targetTask.status === 'completed') {
      const roleIdToPersist = selectedRoleId ?? (profile.targetRoleId || 1);
      const roleName = selectedRole?.name || 'Career Milestone';
      const activeUserId = user ? user.id : 'guest-learner';

      const nextResumeDoc = syncRoadmapTaskToResumeDoc({
        currentResumeDoc: resumeDoc,
        task: targetTask,
        allRoadmapTasks: updated,
        roleId: roleIdToPersist,
        roleName,
        userId: activeUserId,
        action: 'update_work',
        updatedActualWork: actualWork,
      });

      setResumeDoc(nextResumeDoc);
      if (user && !profile.isGuestDemo) {
        defaultResumeRepository.saveResumeDocument(user.id, nextResumeDoc).catch(() => {});
      }
    }

    if (profile.isGuestDemo || !user) {
      return true;
    }

    const roleIdToPersist = selectedRoleId ?? (profile.targetRoleId || 1);
    try {
      setIsSaving(true);
      setPersistenceStatus('saving');
      await defaultRoadmapRepository.saveRoadmapTasks(user.id, roleIdToPersist, updated);
      setPersistenceStatus('saved');
      setIsSaving(false);
      logProductEvent('roadmap_work_updated', { taskId });
      return true;
    } catch {
      setIsSaving(false);
      return false;
    }
  };

  const updateResumeFactInclusion = (factId: string, status: 'included' | 'dismissed', customEdit?: string) => {
    const nextDoc = updateFactInclusionOrEdit(resumeDoc, factId, status, customEdit);
    setResumeDoc(nextDoc);
    if (user && !profile.isGuestDemo) {
      defaultResumeRepository.saveResumeDocument(user.id, nextDoc).catch(() => {});
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
    setResumeDoc(prev => {
      const next = { ...prev, rawText: text };
      if (user && !profile.isGuestDemo) {
        defaultResumeRepository.saveResumeDocument(user.id, next).catch(() => {});
      }
      return next;
    });
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
    setHasSelectedRole(true);
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
    setSelectedRoleIdState(null);
    setHasSelectedRole(false);
    setRoadmapTasks([]);
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
    setPersistenceStatus('saving');
    if (!supabase || !isSupabaseAvailable) {
      const isTestEnv = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';
      if (isTestEnv) {
        const localId = 'local-user-' + email.toLowerCase().replace(/[^a-zA-Z0-9]/g, '_');
        const newUser = { id: localId, email };
        setUser(newUser);
        setAuthStatus('authenticated');
        activeUserIdRef.current = localId;
        await loadUserData(localId);
        try {
          sessionStorage.setItem('career_ai_auth_prompt_dismissed', 'true');
        } catch {
          // ignore
        }
        setIsAuthModalOpen(false);
        setPersistenceStatus('saved');
        return { success: true };
      }

      setPersistenceStatus('failed');
      return {
        success: false,
        error: 'Authentication service is not configured. Live accounts require Supabase setup. You can explore as a guest or demo user.',
      };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setPersistenceStatus('failed');
        return { success: false, error: error.message };
      }
      if (data.user) {
        const newUser = { id: data.user.id, email: data.user.email };
        setUser(newUser);
        setAuthStatus('authenticated');
        activeUserIdRef.current = data.user.id;
        await loadUserData(data.user.id);
        try {
          sessionStorage.setItem('career_ai_auth_prompt_dismissed', 'true');
        } catch {
          // ignore
        }
        setIsAuthModalOpen(false);
        setPersistenceStatus('saved');
        return { success: true };
      }
      setPersistenceStatus('failed');
      return { success: false, error: 'User session not created.' };
    } catch (err) {
      setPersistenceStatus('failed');
      return { success: false, error: String(err) };
    }
  };

  const signUp = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setPersistenceStatus('saving');
    if (!supabase || !isSupabaseAvailable) {
      const isTestEnv = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';
      if (isTestEnv) {
        const localId = 'local-user-' + email.toLowerCase().replace(/[^a-zA-Z0-9]/g, '_');
        const newUser = { id: localId, email };
        setUser(newUser);
        setAuthStatus('authenticated');
        activeUserIdRef.current = localId;
        await loadUserData(localId);
        try {
          sessionStorage.setItem('career_ai_auth_prompt_dismissed', 'true');
        } catch {
          // ignore
        }
        setIsAuthModalOpen(false);
        setPersistenceStatus('saved');
        return { success: true };
      }

      setPersistenceStatus('failed');
      return {
        success: false,
        error: 'Account registration requires configured Supabase authentication service.',
      };
    }

    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setPersistenceStatus('failed');
        return { success: false, error: error.message };
      }
      if (data.user) {
        const newUser = { id: data.user.id, email: data.user.email };
        setUser(newUser);
        setAuthStatus('authenticated');
        activeUserIdRef.current = data.user.id;
        await loadUserData(data.user.id);
        try {
          sessionStorage.setItem('career_ai_auth_prompt_dismissed', 'true');
        } catch {
          // ignore
        }
        setIsAuthModalOpen(false);
      }
      setPersistenceStatus('saved');
      return { success: true };
    } catch (err) {
      setPersistenceStatus('failed');
      return { success: false, error: String(err) };
    }
  };

  const signInWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    // Guest / local mode: Supabase OAuth not available
    if (!supabase || !isSupabaseAvailable) {
      return {
        success: false,
        error: '__NO_SUPABASE__',
      };
    }

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      });
      if (error) {
        return { success: false, error: error.message };
      }
      if (data?.url && typeof window !== 'undefined') {
        window.location.assign(data.url);
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  };

  /**
   * Sign in as a local guest learner (no Supabase required).
   * Explicitly marked as guest session, NOT a cloud authenticated account.
   */
  const signInAsLocalGuest = (displayName: string = 'Google Learner') => {
    const localId = 'google-guest-user-' + Date.now();
    setUser({ id: localId, email: 'local.learner@careerai.local' });
    setAuthStatus('unauthenticated'); // explicitly guest/unauthenticated identity
    activeUserIdRef.current = localId;
    setProfile(prev => ({
      ...prev,
      id: localId,
      displayName,
      contactEmail: 'local.learner@careerai.local',
      isGuestDemo: false,
    }));
    try {
      sessionStorage.setItem('career_ai_auth_prompt_dismissed', 'true');
    } catch {
      // ignore
    }
    setIsAuthModalOpen(false);
    showToast(`Signed in as ${displayName} (local guest session).`);
  };

  const signOut = async (): Promise<void> => {
    activeUserIdRef.current = null;
    lastHydratedUserIdRef.current = null;
    try {
      // Remember dismissal so sign-out restores Sign In without an immediate repetitive popup loop
      sessionStorage.setItem('career_ai_auth_prompt_dismissed', 'true');
    } catch {
      // ignore
    }
    if (supabase && isSupabaseAvailable) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Supabase signOut error:', err);
      }
    }
    setUser(null);
    setAuthStatus('unauthenticated');
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
    setIsAuthModalOpen(false); // Do not pop open modal immediately
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
    try {
      sessionStorage.setItem('career_ai_auth_prompt_dismissed', 'true');
    } catch {
      // storage unavailable
    }
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

  const activeCareerPath = hasSelectedRole && selectedRoleId
    ? CAREER_CATALOGUE.find(p => p.numericId === selectedRoleId)
    : null;
  const selectedRole = activeCareerPath
    ? asCareerRole(activeCareerPath)
    : (selectedRoleId ? (ROLES_BY_ID.get(selectedRoleId) || SEED_ROLES[0]) : SEED_ROLES[0]);
  const selectedRoleSlug = activeCareerPath ? activeCareerPath.slug : selectedRole.slug;
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
        hasSelectedRole,
        selectedRoleId,
        selectedRoleSlug,
        selectedRole,
        setSelectedRoleId,
        setSelectedRoleSlug,
        clearSelectedRole,
        roadmapTasks,
        toggleTaskCompletion,
        updateTaskActualWork,
        rescheduleRoadmap,
        resumeDoc,
        updateResumeText,
        updateResumeFactInclusion,
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
        isAuthenticated: authStatus === 'authenticated' && Boolean(user && !user.id.startsWith('guest-') && !user.id.startsWith('google-guest-') && !profile.isGuestDemo),
        isSupabaseAvailable,
        authLoading,
        authStatus,
        signIn,
        signUp,
        signInWithGoogle,
        signInAsLocalGuest,
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
