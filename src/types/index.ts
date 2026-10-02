export type EvidenceSource =
  | 'diagnostic'
  | 'self_report'
  | 'self_attested_project'
  | 'reviewed_project';

export interface UserProfile {
  id: string;
  displayName: string;
  branch: string;
  studyYear: string;
  hoursPerWeek: number;
  preferredRoles: string[];
  cgpa?: string;
  isGuestDemo: boolean;
}

export interface Skill {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string;
}

export interface Role {
  id: string;
  slug: string;
  name: string;
  level: string;
  description: string;
  sourceLabel: string;
  sourceUrl: string;
  sourceCheckedAt: string;
  version: string;
  requirements: Array<{
    skillId: string;
    targetLevel: number; // 1-4
    importance: number; // 1-3
    prerequisiteOrder: number;
    rationale: string;
  }>;
}

export interface AssessmentQuestion {
  id: string;
  skillId: string;
  prompt: string;
  options: {
    key: string;
    text: string;
  }[];
  answerKey: string;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  version: string;
}

export interface AssessmentAttempt {
  id: string;
  userId: string;
  startedAt: string;
  completedAt?: string;
  answers: Record<string, string>; // questionId -> selectedKey
  savedSkillObservations: Record<string, number>; // skillId -> level (0-4)
}

export interface RoadmapTask {
  id: string;
  weekNumber: number;
  title: string;
  description: string;
  deliverable: string;
  estimatedHours: number;
  prerequisiteTaskId?: string;
  resourceUrl: string;
  status: 'pending' | 'completed';
  completedAt?: string;
}

export interface ResumeSourceFact {
  id: string;
  category: 'project' | 'education' | 'experience' | 'skill';
  text: string;
  verified: boolean;
}

export interface ResumeDocument {
  id: string;
  userId: string;
  label: string;
  rawText: string;
  facts: ResumeSourceFact[];
}

export interface ResumeSuggestion {
  original: string;
  rewrite: string;
  sourceFactIds: string[];
  needsConfirmation: boolean;
  status: 'pending' | 'accepted' | 'edited' | 'rejected';
}

export interface InterviewRubricItem {
  id: string;
  criterion: string;
  description: string;
  met: boolean;
}
