import rawTracks from '../../data/assessment-tracks.json';
import rawQuestions from '../../data/assessment-questions.json';
import type { AssessmentTrack, AssessmentQuestion } from '../types';

export const ASSESSMENT_TRACKS: AssessmentTrack[] = rawTracks as AssessmentTrack[];
export const DYNAMIC_ASSESSMENT_QUESTIONS: AssessmentQuestion[] = rawQuestions as AssessmentQuestion[];

export function getTrackById(trackId: string): AssessmentTrack | undefined {
  const normalized = trackId.trim().toLowerCase();
  return ASSESSMENT_TRACKS.find(
    (t) => t.id.toLowerCase() === normalized || t.slug.toLowerCase() === normalized
  );
}

export function getQuestionsForTrack(trackId: string): AssessmentQuestion[] {
  const track = getTrackById(trackId);
  if (!track) return [];
  return DYNAMIC_ASSESSMENT_QUESTIONS.filter((q) =>
    (q.track_ids || []).some((tid) => tid.toLowerCase() === track.id.toLowerCase())
  );
}

export function getTracksByCategory(category: string): AssessmentTrack[] {
  const normalized = category.trim().toLowerCase();
  return ASSESSMENT_TRACKS.filter((t) => t.category.toLowerCase() === normalized);
}
