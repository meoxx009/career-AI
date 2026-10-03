import type { UserProfile, ResumeDocument, RoadmapTask } from '../types';
import { SEED_SKILLS, SEED_ROADMAP_TEMPLATES } from '../data/seedData';
import { DEMO_RAHUL_OBSERVATIONS } from '../data/demoRahul';

export const STORAGE_KEY = 'career_ai_state_v3';
export const STORAGE_NOTICE = 'Demo progress stored on this browser';

export const DEFAULT_ROADMAP_TASKS: RoadmapTask[] = SEED_ROADMAP_TEMPLATES
  .filter(t => t.role_id === 1)
  .map(t => ({
    id: t.id,
    weekNumber: t.week_number,
    title: t.title,
    description: t.description,
    deliverable: t.deliverable,
    estimatedHours: t.estimated_hours,
    prerequisiteTaskId: t.prerequisite_id || undefined,
    resourceUrl: t.resource_url,
    status: 'todo',
  }));

export const EMPTY_PROFILE: UserProfile = {
  id: 'guest-learner',
  displayName: '',
  profileImageUrl: '',
  profileImageStorageKey: '',
  username: '',
  contactEmail: '',
  branch: '',
  studyYear: '',
  hoursPerWeek: 8,
  preferredRoles: [],
  preferredRoleIds: [],
  cgpa: '',
  locationPreference: '',
  currentSkills: [],
  interests: [],
  favoriteSubjects: [],
  projectFacts: '',
  isGuestDemo: false,
  targetRoleId: 1,
  fontSizePreference: 'default',
};

export const createEmptyObservations = (): Record<number, number | null> => {
  const map: Record<number, number | null> = {};
  SEED_SKILLS.forEach(skill => {
    map[skill.id] = null;
  });
  return map;
};

export const rahulObservationsMap = DEMO_RAHUL_OBSERVATIONS.reduce(
  (acc, obs) => {
    acc[obs.skill_id] = obs.value;
    return acc;
  },
  {} as Record<number, number | null>
);

SEED_SKILLS.forEach(skill => {
  if (rahulObservationsMap[skill.id] === undefined) {
    rahulObservationsMap[skill.id] = null;
  }
});

export const EMPTY_RESUME: ResumeDocument = {
  id: 'guest-resume',
  userId: 'guest-learner',
  label: 'Draft Resume',
  rawText: '',
  facts: [],
};
