import type { UserProfile, RoadmapTask, ResumeDocument, InterviewSessionRecord } from '../../types';

export interface RepositoryResult<T> {
  data: T | null;
  error: string | null;
}

export interface IProfileRepository {
  getProfile(userId: string): Promise<RepositoryResult<UserProfile>>;
  upsertProfile(profile: UserProfile): Promise<RepositoryResult<UserProfile>>;
  deleteProfile(userId: string): Promise<RepositoryResult<void>>;
}

export interface IAssessmentRepository {
  createAttempt(userId: string, version: string): Promise<RepositoryResult<{ id: string }>>;
  saveAnswer(
    attemptId: string,
    userId: string,
    questionId: string,
    selectedKey: string | null,
    isCorrect: boolean | null
  ): Promise<RepositoryResult<void>>;
  getAnswers(attemptId: string): Promise<RepositoryResult<Record<string, 'a' | 'b' | 'c' | 'd'>>>;
  getUserAnswers(userId: string): Promise<RepositoryResult<Record<string, 'a' | 'b' | 'c' | 'd'>>>;
}

export interface IObservationRepository {
  getObservations(userId: string): Promise<RepositoryResult<Record<number, number | null>>>;
  saveObservation(
    userId: string,
    skillId: number,
    value: number | null,
    source: string
  ): Promise<RepositoryResult<void>>;
  saveObservationsBatch(
    userId: string,
    observations: Array<{ skillId: number; value: number | null; source: string }>
  ): Promise<RepositoryResult<void>>;
}

export interface IRoadmapRepository {
  getRoadmapTasks(userId: string, roleId: number): Promise<RepositoryResult<RoadmapTask[]>>;
  saveRoadmapTasks(userId: string, roleId: number, tasks: RoadmapTask[]): Promise<RepositoryResult<void>>;
  toggleTask(userId: string, roleId: number, taskId: string): Promise<RepositoryResult<RoadmapTask[]>>;
}

export interface IResumeRepository {
  getResumeDocument(userId: string): Promise<RepositoryResult<ResumeDocument>>;
  saveResumeDocument(userId: string, resume: ResumeDocument): Promise<RepositoryResult<void>>;
  saveInterviewSession(
    userId: string,
    roleId: number | null,
    mode: 'behavioural' | 'technical',
    questionId: string | null,
    questionText: string,
    answerText: string | null,
    rubricResult: unknown
  ): Promise<RepositoryResult<void>>;
}

export interface IInterviewRepository {
  getInterviewSessions(userId: string, roleId?: number): Promise<RepositoryResult<InterviewSessionRecord[]>>;
  saveInterviewSession(session: InterviewSessionRecord): Promise<RepositoryResult<void>>;
  deleteInterviewSession(userId: string, sessionId: string): Promise<RepositoryResult<void>>;
}
