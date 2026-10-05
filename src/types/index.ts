export type EvidenceSource =
  | 'diagnostic'
  | 'self_report'
  | 'self_attested_project'
  | 'reviewed_project';

export type LearnerStage =
  | 'class_10'
  | 'class_11_12'
  | 'diploma'
  | 'undergraduate'
  | 'postgraduate'
  | 'recent_graduate'
  | 'self_taught';

export type SchoolStream =
  | 'pcm'
  | 'pcb'
  | 'pcmb'
  | 'commerce'
  | 'arts'
  | 'vocational';

export type FontSizePreference = 'default' | 'comfortable' | 'large' | 'extra-large';

export interface UserProfile {
  id: string;
  displayName: string;
  profileImageUrl?: string;
  profileImageStorageKey?: string;
  username?: string;
  contactEmail?: string;
  learnerStage?: LearnerStage;
  schoolClass?: string;
  stream?: SchoolStream;
  degree?: string;
  specialization?: string;
  branch: string;
  studyYear: string;
  hoursPerWeek: number;
  preferredRoles: string[]; // slugs or role IDs
  preferredRoleIds?: number[];
  cgpa?: string;
  locationPreference?: string;
  currentSkills?: string[];
  interests?: string[];
  favoriteSubjects?: string[];
  preferredWorkDirection?: string;
  projectFacts?: string;
  isGuestDemo: boolean;
  targetRoleId?: number;
  targetRoleSlug?: string;
  fontSizePreference?: FontSizePreference;
}

export interface Skill {
  id: number;
  slug: string;
  name: string;
  category: string;
  description: string;
}

export interface RoleSkillRequirement {
  role_id: number;
  skill_id: number;
  target_level: number; // 1-4
  importance: number; // 1-3
  prerequisite_order: number;
  rationale: string;
  version: string;
}

export interface CareerRole {
  id: number;
  slug: string;
  name: string;
  level: string;
  description: string;
  source_label: string;
  source_url: string;
  source_checked_at: string;
  version: string;
  requirements?: RoleSkillRequirement[];
}

// Legacy alias for existing components
export type Role = CareerRole;

export type PathCategory = 'software_engineering' | 'data_ai' | 'design_product';

export type CurriculumPhase =
  | 'Foundations'
  | 'Core skills'
  | 'Guided project'
  | 'Portfolio/proof'
  | 'Practice and review';

export type SkillEvidenceSource =
  | 'diagnostic'
  | 'self-report'
  | 'resume'
  | 'project fact'
  | 'reviewed project'
  | 'practice'
  | 'assessment';

export interface PathSkillRequirement {
  pathId: number;
  skillId: string; // canonical skill slug
  targetLevel: 1 | 2 | 3 | 4;
  importance: 1 | 2 | 3;
  prerequisiteOrder: number;
  rationale: string;
  evidenceSources: SkillEvidenceSource[];
  version: string;
}

export interface CurriculumItem {
  id: string;
  pathId?: number;
  skillIds?: string[];
  title: string;
  phase: CurriculumPhase;
  whyItMatters: string;
  estimatedHours: number;
  deliverable: string;
  prerequisiteItemIds?: string[];
  resourceUrl?: string;
  status?: 'todo' | 'in_progress' | 'completed';
  prerequisite: string | null;
  optionalVerifiedResource: string | null;
  completionState: 'todo' | 'in_progress' | 'completed';
}

export interface CareerPath {
  id: string; // slug / string id
  numericId: number;
  pathType: 'career_role' | 'academic_track';
  title: string;
  slug: string;
  category: PathCategory;
  level: string;
  description: string;
  eligibleLearnerStages: LearnerStage[];
  compatibleStreamsOrDegrees: string[];
  interests: string[];
  prerequisiteSkills: string[];
  coreSkills: string[];
  advancedSkills: string[];
  prerequisiteSkillSlugs?: string[];
  coreSkillSlugs?: string[];
  advancedSkillSlugs?: string[];
  requirements?: PathSkillRequirement[];
  curriculum: CurriculumItem[];
  estimatedEffortHours: number;
  projectDeliverables: string[];
  firstProjectDeliverable: string;
  nextAction: string;
  source: string;
  version: string;
  limitations: string[];
}

export type EducationLevel = 'school' | 'diploma' | 'undergraduate' | 'postgraduate' | 'professional';

export interface EducationEntry {
  id: string;
  level: EducationLevel;
  degreeTitle: string;
  specializationTitle: string;
  label: string;
  aliases: string[];
  compatibleLearnerStages: string[];
  relatedAcademicContextIds: string[];
  relatedCareerPathIds: number[];
  source: string;
  version: string;
  active: boolean;
}

export interface CanonicalSkill {
  id: string;
  slug: string;
  name: string;
  category: string;
  aliases: string[];
  description: string;
  evidenceTypes: string[];
  source: string;
  version: string;
  active: boolean;
}

export interface AcademicContext {
  id: string;
  name: string;
  category: string;
  typicalPrerequisites: string[];
  naturalCareerBridges: string[];
  transferableStrengths: string[];
  advisoryNote: string;
}

export interface PathMatchReason {
  type: 'stream_match' | 'interest_match' | 'skill_match' | 'stage_compatible' | 'starter_default';
  description: string;
}

export interface PathMatchResult {
  path: CareerPath;
  score: number;
  reasons: PathMatchReason[];
  prerequisiteGaps: string[];
  isCompatible: boolean;
  missingInfoNotice?: string;
  nextBestAction: string;
}


export interface AssessmentQuestionOption {
  key: 'a' | 'b' | 'c' | 'd';
  text: string;
}

export interface AssessmentQuestion {
  id: string;
  skill_id: number;
  category: string;
  prompt: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_key: 'a' | 'b' | 'c' | 'd';
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  version: string;
  track_ids?: string[];
  domain?: string;
  source_reviewer_status?: string;
  prerequisite_skill?: string;
}

export interface AssessmentTrack {
  id: string;
  title: string;
  slug: string;
  category: 'software' | 'data_ai' | 'hardware' | 'design_product';
  domain: string;
  description: string;
  assessedSkillIds: number[];
  expectedQuestionCount: number;
  difficultyMix: {
    easy: number;
    medium: number;
    hard: number;
  };
  hasSufficientQuestions: boolean;
  contentGapNotice?: string;
}

export interface AssessmentTrackSummary {
  trackTitle: string;
  assessedSkills: Array<{ id: number; name: string }>;
  expectedQuestionCount: number;
  difficultyMix: {
    easy: number;
    medium: number;
    hard: number;
  };
  isContentGap: boolean;
  contentGapNotice?: string;
}

export interface AssessmentAttempt {
  id: string;
  userId: string;
  startedAt: string;
  completedAt?: string;
  answers: Record<string, 'a' | 'b' | 'c' | 'd'>; // questionId -> selectedKey
  savedSkillObservations: Record<number, number | null>; // skillId -> level (0-4 or null)
}

export interface RoadmapTemplate {
  id: string;
  role_id: number;
  week_number: number;
  title: string;
  description: string;
  deliverable: string;
  estimated_hours: number;
  prerequisite_id: string | null;
  resource_url: string;
  status: 'todo' | 'in_progress' | 'completed';
  phase?: string;
  skill_ids?: string[];
}

// User-tracked roadmap task
export interface RoadmapTask {
  id: string;
  weekNumber: number;
  title: string;
  description: string;
  deliverable: string;
  estimatedHours: number;
  prerequisiteTaskId?: string;
  resourceUrl: string;
  status: 'todo' | 'in_progress' | 'completed' | 'pending';
  completedAt?: string;

  // --- Task-splitting segment fields (optional) ---
  // When a task's estimatedHours > weeklyStudyHours it is split into sequential segments.
  // Each segment carries these fields; the unsplit original carries none of them.
  parentTaskId?: string;      // template id of the parent task (same as id when not split)
  segmentIndex?: number;      // 0-based index of this segment
  segmentCount?: number;      // total number of segments for this parent task
  scheduledHours?: number;    // hours assigned to this specific segment

  // --- Path requirement & skill gap linking fields (Prompt 5) ---
  skillId?: string;
  skillName?: string;
  targetLevel?: number;
  currentEvidenceLevel?: number | null;
  evidenceState?: 'evidenced' | 'partially_evidenced' | 'assessed_gap' | 'unassessed';
  evidenceSource?: string;
  phase?: string;
  nextAction?: string;
}

export interface InterviewQuestion {
  id: string;
  role_id: number;
  role_slug?: string;
  type: 'behavioural' | 'technical';
  prompt: string;
  rubric_points: string[];
  version: string;
  purpose?: string;
  interviewerListeningFor?: string[];
  keyPitfalls?: string[];
  isFallback?: boolean;
}

export interface SkillObservation {
  skill_id: number;
  value: number | null; // 0 to 4 or null if unassessed
  source: EvidenceSource;
  observedAt: string;
  rubricVersion?: string;
  confidence?: 'High' | 'Medium' | 'Needs more evidence';
}

export interface RoleAssessment {
  role: CareerRole;
  coverage: number; // 0..1
  assessedAlignment: number | null; // 0..100 or null if coverage < 0.60
  fitScore: number;
  isSufficientCoverage: boolean;
  gaps: Array<{
    skill: Skill;
    targetLevel: number;
    currentLevel: number | null;
    gapSize: number;
    importance: number;
    prerequisiteOrder: number;
    rationale: string;
    isAssessed: boolean;
  }>;
  explanation: string;
}

export interface ResumeSourceFact {
  id: string;
  category: 'project' | 'education' | 'experience' | 'skill';
  text: string;
  verified: boolean;
  source?: string;
  claim?: string;
  evidenceSnippet?: string;
  deliverable?: string;
  verifiedAt?: string;
}

export type ResumeFact = ResumeSourceFact;

export interface ResumeDocument {
  id: string;
  userId: string;
  label: string;
  rawText: string;
  facts: ResumeSourceFact[];
}

export interface ResumeSuggestion {
  id?: string;
  original: string;
  rewrite: string;
  sourceFactIds: string[];
  needsConfirmation: boolean;
  explanation?: string;
  status: 'pending' | 'accepted' | 'edited' | 'rejected';
  reason?: string;
  type?: string;
  isAiGenerated?: boolean;
  confidence?: 'high' | 'medium' | 'needs_more_evidence';
  caveat?: string;
}

export interface InterviewRubricItem {
  id: string;
  criterion: string;
  description: string;
  met: boolean;
}

export interface RubricCheckItem {
  id: string;
  label: string;
  description: string;
  met: boolean;
  evidenceQuote?: string;
  guidance: string;
}

export interface InterviewFeedbackResult {
  questionId: string;
  criteriaResults: RubricCheckItem[];
  metCount: number;
  totalCount: number;
  percentage: number;
  strengths: string[];
  missingPoints: string[];
  nextAction: string;
  caveat: string;
  limitationNotice?: string;
  isAiGenerated?: boolean;
  confidence?: 'high' | 'medium' | 'needs_more_evidence';
  evaluatedAt?: string;
}

export interface InterviewSessionRecord {
  id: string;
  userId: string;
  roleId: number;
  questionId: string;
  mode: 'behavioural' | 'technical';
  questionPrompt: string;
  answerText: string;
  feedback: InterviewFeedbackResult;
  savedAt: string;
}

export interface InterviewFeedback {
  questionId: string;
  rubricResults: Array<{
    criterion: string;
    met: boolean;
    feedback: string;
  }>;
  overallSummary: string;
  isAiGenerated: boolean;
}
