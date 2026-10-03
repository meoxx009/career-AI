import {
  DYNAMIC_ASSESSMENT_QUESTIONS,
  getTrackById,
} from '../data/assessmentBank';
import { SKILLS_BY_ID } from '../data/seedData';
import type {
  AssessmentQuestion,
  AssessmentTrack,
  AssessmentTrackSummary,
  UserProfile,
} from '../types';

export interface QuestionSelectionOptions {
  selectedTrackIds?: string[];
  selectedTrackId?: string;
  additionalTrackIds?: string[];
  learnerProfile?: Partial<UserProfile> | null;
  maxQuestions?: number;
}

export interface QuestionSelectionResult {
  questions: AssessmentQuestion[];
  tracks: AssessmentTrack[];
  trackSummary: AssessmentTrackSummary;
  isContentGap: boolean;
  contentGapNotice?: string;
  version: string;
}

const DIFFICULTY_RANK: Record<'easy' | 'medium' | 'hard', number> = {
  easy: 1,
  medium: 2,
  hard: 3,
};

/**
 * Pure and deterministic question selection engine.
 * Selects, prioritizes, and orders assessment questions based on
 * selected track(s) and learner context without using learner stage
 * as an unfair ability score.
 */
export function selectQuestionsForAssessment(
  options: QuestionSelectionOptions
): QuestionSelectionResult {
  const { maxQuestions = 10 } = options;
  const rawTrackIds: string[] = options.selectedTrackIds
    ? [...options.selectedTrackIds]
    : options.selectedTrackId
    ? [options.selectedTrackId]
    : [];

  if (options.additionalTrackIds && options.additionalTrackIds.length > 0) {
    rawTrackIds.push(...options.additionalTrackIds);
  }

  const version = 'v2.0-dynamic';

  // 1. Resolve selected tracks
  const resolvedTracks: AssessmentTrack[] = [];
  const invalidOrGapTracks: AssessmentTrack[] = [];

  const trackIdsToProcess =
    rawTrackIds.length > 0 ? rawTrackIds : ['cse_foundations'];

  trackIdsToProcess.forEach((tId) => {
    const track = getTrackById(tId);
    if (track) {
      if (track.hasSufficientQuestions === false) {
        invalidOrGapTracks.push(track);
      } else {
        resolvedTracks.push(track);
      }
    }
  });

  // Handle content gap scenario
  if (resolvedTracks.length === 0 && invalidOrGapTracks.length > 0) {
    const gapTrack = invalidOrGapTracks[0];
    const fallbackQuestions = DYNAMIC_ASSESSMENT_QUESTIONS.filter((q) =>
      (q.track_ids || []).includes('cse_foundations')
    ).slice(0, maxQuestions);

    return {
      questions: fallbackQuestions,
      tracks: [gapTrack],
      trackSummary: {
        trackTitle: gapTrack.title,
        assessedSkills: [],
        expectedQuestionCount: 0,
        difficultyMix: { easy: 0, medium: 0, hard: 0 },
        isContentGap: true,
        contentGapNotice:
          gapTrack.contentGapNotice ||
          `Content gap notice: Questions for ${gapTrack.title} are currently under peer review. Foundational CSE questions are available in the meantime.`,
      },
      isContentGap: true,
      contentGapNotice:
        gapTrack.contentGapNotice ||
        `Content gap notice: Questions for ${gapTrack.title} are currently under peer review. Foundational CSE questions are available in the meantime.`,
      version,
    };
  }

  // Fallback to cse_foundations if no tracks resolved
  if (resolvedTracks.length === 0) {
    const defaultTrack = getTrackById('cse_foundations')!;
    resolvedTracks.push(defaultTrack);
  }

  // 2. Collect questions matching track IDs
  const activeTrackIds = new Set(resolvedTracks.map((t) => t.id.toLowerCase()));
  const candidateQuestions: AssessmentQuestion[] = [];
  const seenIds = new Set<string>();

  // Primary: Match by selected track_ids
  DYNAMIC_ASSESSMENT_QUESTIONS.forEach((q) => {
    const matchesTrack = (q.track_ids || []).some((tid) =>
      activeTrackIds.has(tid.toLowerCase())
    );
    if (matchesTrack && !seenIds.has(q.id)) {
      candidateQuestions.push(q);
      seenIds.add(q.id);
    }
  });

  // If candidate count is less than 3, supplement with foundational CSE questions
  if (candidateQuestions.length < 3) {
    DYNAMIC_ASSESSMENT_QUESTIONS.forEach((q) => {
      if (
        (q.track_ids || []).includes('cse_foundations') &&
        !seenIds.has(q.id)
      ) {
        candidateQuestions.push(q);
        seenIds.add(q.id);
      }
    });
  }

  // 3. Deterministic Sorting:
  // - Difficulty: Easy (Foundations) -> Medium (Core) -> Hard (Application)
  // - Skill ID: Group related skills together
  // - Alphanumeric tie-breaker: q.id
  candidateQuestions.sort((a, b) => {
    const diffDiff = DIFFICULTY_RANK[a.difficulty] - DIFFICULTY_RANK[b.difficulty];
    if (diffDiff !== 0) return diffDiff;

    const skillDiff = a.skill_id - b.skill_id;
    if (skillDiff !== 0) return skillDiff;

    return a.id.localeCompare(b.id);
  });

  // 4. Slice to target question count
  const selectedQuestions = candidateQuestions.slice(0, maxQuestions);

  // 5. Build summary
  const assessedSkillIds = new Set<number>();
  const difficultyMix = { easy: 0, medium: 0, hard: 0 };

  selectedQuestions.forEach((q) => {
    assessedSkillIds.add(q.skill_id);
    difficultyMix[q.difficulty] += 1;
  });

  const assessedSkills = Array.from(assessedSkillIds).map((id) => {
    const s = SKILLS_BY_ID.get(id);
    return {
      id,
      name: s?.name || `Skill ${id}`,
    };
  });

  const primaryTrack = resolvedTracks[0];
  const combinedTitle =
    resolvedTracks.length === 1
      ? primaryTrack.title
      : `${primaryTrack.title} + ${resolvedTracks.length - 1} more`;

  return {
    questions: selectedQuestions,
    tracks: resolvedTracks,
    trackSummary: {
      trackTitle: combinedTitle,
      assessedSkills,
      expectedQuestionCount: selectedQuestions.length,
      difficultyMix,
      isContentGap: false,
    },
    isContentGap: false,
    version,
  };
}

export function getTrackSummary(trackId: string): AssessmentTrackSummary & {
  trackId: string;
  totalQuestions: number;
  assessedSkillIds: number[];
} {
  const result = selectQuestionsForAssessment({ selectedTrackIds: [trackId] });
  return {
    ...result.trackSummary,
    trackId,
    totalQuestions: result.questions.length,
    assessedSkillIds: result.trackSummary.assessedSkills.map((s) => s.id),
  };
}
