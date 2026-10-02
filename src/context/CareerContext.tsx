import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { UserProfile, RoadmapTask, ResumeDocument, ResumeSuggestion } from '../types';
import { INITIAL_PROFILE, SEED_ROADMAP_TASKS } from '../data/seed';

interface CareerContextType {
  profile: UserProfile;
  updateProfile: (profile: Partial<UserProfile>) => void;
  skillObservations: Record<string, number | null>;
  setSkillObservation: (skillId: string, level: number | null) => void;
  diagnosticAnswers: Record<string, string>;
  setDiagnosticAnswer: (questionId: string, answerKey: string) => void;
  selectedRoleId: string;
  setSelectedRoleId: (roleId: string) => void;
  roadmapTasks: RoadmapTask[];
  toggleTaskCompletion: (taskId: string) => void;
  resumeDoc: ResumeDocument;
  updateResumeText: (text: string) => void;
  resumeSuggestions: ResumeSuggestion[];
  updateSuggestionStatus: (index: number, status: ResumeSuggestion['status'], updatedRewrite?: string) => void;
  setResumeSuggestions: (suggestions: ResumeSuggestion[]) => void;
  aiMode: 'ai' | 'deterministic-fallback';
  setAiMode: (mode: 'ai' | 'deterministic-fallback') => void;
  language: 'en' | 'hi';
  setLanguage: (lang: 'en' | 'hi') => void;
  consentGiven: boolean;
  setConsentGiven: (consent: boolean) => void;
  resetToDemo: () => void;
}

const STORAGE_KEY = 'career_ai_state_v1';

const defaultResume: ResumeDocument = {
  id: 'resume-1',
  userId: 'user-rahul-demo',
  label: "Rahul's Backend Draft",
  rawText: `Rahul Sharma
Computer Science Student · 3rd Year

EXPERIENCE & PROJECTS
• Student Project: Mini Task CLI (Python)
  Worked on building a task management CLI using Python dictionaries and JSON storage. Added unit tests with pytest.
• Database Exercise: Student Course Queries (SQLite)
  Helped with writing SQL queries for student registrations using joins and groupings.

SKILLS
Python, SQLite, Git, Basic REST APIs`,
  facts: [
    { id: 'fact-1', category: 'project', text: 'Built a CLI task manager using Python and JSON storage.', verified: true },
    { id: 'fact-2', category: 'project', text: 'Wrote unit tests with pytest for CLI tasks.', verified: true },
    { id: 'fact-3', category: 'project', text: 'Practiced SQL joins and group-by on SQLite course database.', verified: true },
  ],
};

const CareerContext = createContext<CareerContextType | undefined>(undefined);

export const CareerProvider = ({ children }: { children: ReactNode }) => {
  // Load initial state from localStorage or fallback
  const savedState = (() => {
    try {
      const item = localStorage.getItem(STORAGE_KEY);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  })();

  const [profile, setProfile] = useState<UserProfile>(
    savedState?.profile || INITIAL_PROFILE
  );

  // Skill observations (0-4 or null)
  const [skillObservations, setSkillObservations] = useState<Record<string, number | null>>(
    savedState?.skillObservations || {
      python: 2,
      sql: 2,
      apis: null,
      dsa: null,
      react: null,
      system_design: null,
    }
  );

  const [diagnosticAnswers, setDiagnosticAnswers] = useState<Record<string, string>>(
    savedState?.diagnosticAnswers || {}
  );

  const [selectedRoleId, setSelectedRoleId] = useState<string>(
    savedState?.selectedRoleId || 'role-backend'
  );

  const [roadmapTasks, setRoadmapTasks] = useState<RoadmapTask[]>(
    savedState?.roadmapTasks || SEED_ROADMAP_TASKS
  );

  const [resumeDoc, setResumeDoc] = useState<ResumeDocument>(
    savedState?.resumeDoc || defaultResume
  );

  const [resumeSuggestions, setResumeSuggestions] = useState<ResumeSuggestion[]>(
    savedState?.resumeSuggestions || []
  );

  const [aiMode, setAiMode] = useState<'ai' | 'deterministic-fallback'>(
    savedState?.aiMode || 'deterministic-fallback'
  );

  const [consentGiven, setConsentGiven] = useState<boolean>(
    savedState?.consentGiven || true
  );

  const [language, setLanguage] = useState<'en' | 'hi'>(
    savedState?.language || 'en'
  );

  // Persist to localStorage whenever state changes
  useEffect(() => {
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
          aiMode,
          language,
          consentGiven,
        })
      );
    } catch {
      // storage unavailable or quota exceeded
    }
  }, [
    profile,
    skillObservations,
    diagnosticAnswers,
    selectedRoleId,
    roadmapTasks,
    resumeDoc,
    resumeSuggestions,
    aiMode,
    language,
    consentGiven,
  ]);

  const updateProfile = (partial: Partial<UserProfile>) => {
    setProfile(prev => ({ ...prev, ...partial }));
  };

  const setSkillObservation = (skillId: string, level: number | null) => {
    setSkillObservations(prev => ({ ...prev, [skillId]: level }));
  };

  const setDiagnosticAnswer = (questionId: string, answerKey: string) => {
    setDiagnosticAnswers(prev => ({ ...prev, [questionId]: answerKey }));
  };

  const toggleTaskCompletion = (taskId: string) => {
    setRoadmapTasks(prev =>
      prev.map(task => {
        if (task.id === taskId) {
          const nextStatus = task.status === 'completed' ? 'pending' : 'completed';
          return {
            ...task,
            status: nextStatus,
            completedAt: nextStatus === 'completed' ? new Date().toISOString().split('T')[0] : undefined,
          };
        }
        return task;
      })
    );
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

  const resetToDemo = () => {
    setProfile(INITIAL_PROFILE);
    setSkillObservations({
      python: 2,
      sql: 2,
      apis: null,
      dsa: null,
      react: null,
      system_design: null,
    });
    setDiagnosticAnswers({});
    setSelectedRoleId('role-backend');
    setRoadmapTasks(SEED_ROADMAP_TASKS);
    setResumeDoc(defaultResume);
    setResumeSuggestions([]);
    setAiMode('deterministic-fallback');
    setLanguage('en');
    setConsentGiven(true);
  };

  return (
    <CareerContext.Provider
      value={{
        profile,
        updateProfile,
        skillObservations,
        setSkillObservation,
        diagnosticAnswers,
        setDiagnosticAnswer,
        selectedRoleId,
        setSelectedRoleId,
        roadmapTasks,
        toggleTaskCompletion,
        resumeDoc,
        updateResumeText,
        resumeSuggestions,
        updateSuggestionStatus,
        setResumeSuggestions,
        aiMode,
        setAiMode,
        language,
        setLanguage,
        consentGiven,
        setConsentGiven,
        resetToDemo,
      }}
    >
      {children}
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
