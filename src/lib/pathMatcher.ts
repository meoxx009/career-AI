import {
  CAREER_CATALOGUE,
  getAcademicContextById,
  STARTER_CAREER_PATHS,
} from '../data/careerCatalogue';
import type {
  CareerPath,
  PathMatchResult,
  PathMatchReason,
  UserProfile,
  LearnerStage,
  SchoolStream,
} from '../types';

/**
 * Normalizes branch, degree, or school stream string to match
 * an AcademicContext ID from data/academic-contexts.json.
 */
export function resolveAcademicContext(
  profile?: Partial<UserProfile> | null
): ReturnType<typeof getAcademicContextById> {
  if (!profile) return undefined;

  // 1. Check school stream
  if (profile.stream) {
    const streamMap: Record<SchoolStream, string> = {
      pcm: 'school_pcm',
      pcb: 'school_pcb',
      pcmb: 'school_pcmb',
      commerce: 'school_commerce',
      arts: 'school_arts',
      vocational: 'school_vocational',
    };
    const mapped = streamMap[profile.stream];
    if (mapped) {
      const found = getAcademicContextById(mapped);
      if (found) return found;
    }
  }

  // 2. Check branch
  const branchRaw = (profile.branch || '').trim().toLowerCase();
  const degreeRaw = (profile.degree || '').trim().toLowerCase();
  const combined = `${degreeRaw} ${branchRaw}`.trim();

  // Direct ID check
  if (branchRaw) {
    const direct = getAcademicContextById(branchRaw);
    if (direct) return direct;
  }

  // Keyword mappings
  if (branchRaw.includes('computer science') || branchRaw === 'cse' || branchRaw.includes('comp sci')) {
    return getAcademicContextById('cse');
  }
  if (branchRaw.includes('information technology') || branchRaw === 'it') {
    return getAcademicContextById('it');
  }
  if (
    branchRaw.includes('electronics') ||
    branchRaw.includes('telecommunication') ||
    branchRaw === 'ece' ||
    branchRaw === 'etc'
  ) {
    return getAcademicContextById('ece');
  }
  if (branchRaw.includes('electrical') || branchRaw === 'eee') {
    return getAcademicContextById('electrical');
  }
  if (branchRaw.includes('mechanical') || branchRaw === 'mech') {
    return getAcademicContextById('mechanical');
  }
  if (branchRaw.includes('civil')) {
    return getAcademicContextById('civil');
  }
  if (combined.includes('mca') || branchRaw === 'mca') {
    return getAcademicContextById('mca');
  }
  if (combined.includes('bca') || branchRaw === 'bca') {
    return getAcademicContextById('bca');
  }
  if (combined.includes('mba') || branchRaw === 'mba') {
    return getAcademicContextById('mba');
  }
  if (combined.includes('bba') || branchRaw === 'bba') {
    return getAcademicContextById('bba');
  }
  if (combined.includes('bcom') || branchRaw.includes('commerce')) {
    return getAcademicContextById('bcom');
  }
  if (combined.includes('data science')) {
    return getAcademicContextById('bsc_data_science');
  }
  if (combined.includes('statistics') || branchRaw.includes('stat')) {
    return getAcademicContextById('bsc_statistics');
  }
  if (combined.includes('bsc cs') || combined.includes('bsc computer')) {
    return getAcademicContextById('bsc_cs');
  }
  if (branchRaw.includes('humanities') || branchRaw.includes('arts')) {
    return getAcademicContextById('arts_humanities');
  }

  return undefined;
}

function formatStageLabel(stage?: LearnerStage): string {
  switch (stage) {
    case 'class_10':
      return 'Class 10';
    case 'class_11_12':
      return 'Class 11–12';
    case 'diploma':
      return 'Diploma / Vocational';
    case 'undergraduate':
      return 'Undergraduate';
    case 'postgraduate':
      return 'Postgraduate';
    case 'recent_graduate':
      return 'Recent Graduate';
    case 'self_taught':
      return 'Self-Taught / Career Switcher';
    default:
      return 'Learner';
  }
}

function formatInterestLabel(interest: string): string {
  return interest
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Pure deterministic matching between user context and career catalogue.
 * No AI inference, no CGPA scoring, no college prestige bias.
 */
export function evaluatePathMatch(
  path: CareerPath,
  profile?: Partial<UserProfile> | null,
  academicContext?: ReturnType<typeof getAcademicContextById>
): PathMatchResult {
  const reasons: PathMatchReason[] = [];
  let score = 0;
  const userSkills = (profile?.currentSkills || []).map((s) => s.toLowerCase());
  const userInterests = (profile?.interests || []).map((i) => i.toLowerCase());
  const preferredRoles = (profile?.preferredRoles || []).map((r) => r.toLowerCase());
  const targetSlug = profile?.targetRoleSlug?.toLowerCase();
  const targetId = profile?.targetRoleId;

  const hasContext = Boolean(
    profile?.learnerStage ||
      profile?.stream ||
      profile?.branch ||
      (profile?.interests && profile.interests.length > 0) ||
      (profile?.currentSkills && profile.currentSkills.length > 0)
  );

  // 1. Academic Bridge Match
  if (academicContext) {
    if (academicContext.naturalCareerBridges.includes(path.slug)) {
      score += 40;
      reasons.push({
        type: 'stream_match',
        description: `Direct career bridge from your ${academicContext.name} background.`,
      });
    } else if (
      path.compatibleStreamsOrDegrees.some(
        (streamId) =>
          streamId === academicContext.id ||
          streamId.toLowerCase() === (profile?.stream || '').toLowerCase()
      )
    ) {
      score += 20;
      reasons.push({
        type: 'stream_match',
        description: `Compatible foundational curriculum for ${academicContext.name} learners.`,
      });
    }
  }

  // 2. Explicit User Selection
  if (
    (targetSlug && targetSlug === path.slug.toLowerCase()) ||
    (targetId && targetId === path.numericId) ||
    preferredRoles.includes(path.slug.toLowerCase()) ||
    preferredRoles.includes(path.title.toLowerCase())
  ) {
    score += 30;
    reasons.push({
      type: 'interest_match',
      description: 'Matches your explicitly selected target career role.',
    });
  }

  // 3. Interest Alignment
  userInterests.forEach((interest) => {
    if (
      path.interests.some(
        (pi) =>
          pi.toLowerCase() === interest ||
          pi.toLowerCase().includes(interest) ||
          interest.includes(pi.toLowerCase())
      ) ||
      path.slug.toLowerCase().includes(interest) ||
      path.category.toLowerCase().includes(interest)
    ) {
      score += 15;
      reasons.push({
        type: 'interest_match',
        description: `Aligns with your indicated interest in ${formatInterestLabel(interest)}.`,
      });
    }
  });

  // 4. Learner Stage Compatibility
  if (profile?.learnerStage) {
    if (path.eligibleLearnerStages.includes(profile.learnerStage)) {
      score += 10;
      reasons.push({
        type: 'stage_compatible',
        description: `Structured curriculum paced for ${formatStageLabel(profile.learnerStage)} stage.`,
      });
    }
  }

  // 5. Existing Skills Match
  userSkills.forEach((skill) => {
    const isCore = path.coreSkills.some((cs) => cs.toLowerCase().includes(skill));
    const isPrereq = path.prerequisiteSkills.some((ps) => ps.toLowerCase().includes(skill));
    if (isCore || isPrereq) {
      score += 12;
      reasons.push({
        type: 'skill_match',
        description: `Builds upon your prior background in ${skill}.`,
      });
    }
  });

  // If no specific signals were matched, give default starter rationale
  if (reasons.length === 0) {
    if ([1, 2, 3].includes(path.numericId)) {
      score = 10;
      reasons.push({
        type: 'starter_default',
        description: 'Industry benchmark starter path with diagnostic verification.',
      });
    } else {
      score = 5;
      reasons.push({
        type: 'stage_compatible',
        description: 'Open curriculum available across all learner stages.',
      });
    }
  }

  // Identify prerequisite gaps
  const prerequisiteGaps = path.prerequisiteSkills.filter(
    (prereq) => !userSkills.some((s) => prereq.toLowerCase().includes(s))
  );

  // Missing info notice if user profile has not provided academic context or interests
  let missingInfoNotice: string | undefined = undefined;
  if (!hasContext) {
    missingInfoNotice =
      'More information needed to personalize this path — set your academic context or interests in Onboarding or Settings.';
  }

  // Determine next best concrete action
  let nextBestAction = `Review the 5-phase curriculum and complete Phase 1: "${path.firstProjectDeliverable}".`;
  if (path.numericId <= 3) {
    nextBestAction = 'Take the diagnostic assessment to verify foundational skills or start Week 1.';
  }

  return {
    path,
    score,
    reasons,
    prerequisiteGaps,
    isCompatible: score > 0,
    missingInfoNotice,
    nextBestAction,
  };
}

/**
 * Matches and ranks all catalogue paths against the learner profile.
 * Returns sorted recommendations, the original 3 starter paths,
 * and academic context guidance.
 */
export function matchCareerPaths(
  profile?: Partial<UserProfile> | null,
  limit: number = 6
): {
  recommendations: PathMatchResult[];
  starterPaths: PathMatchResult[];
  allRanked: PathMatchResult[];
  hasSufficientInfo: boolean;
  academicContext: ReturnType<typeof getAcademicContextById>;
} {
  const academicContext = resolveAcademicContext(profile);
  const hasSufficientInfo = Boolean(
    profile &&
      (profile.stream ||
        profile.branch ||
        profile.degree ||
        (profile.interests && profile.interests.length > 0) ||
        (profile.currentSkills && profile.currentSkills.length > 0))
  );

  const allRanked = CAREER_CATALOGUE.map((path) =>
    evaluatePathMatch(path, profile, academicContext)
  ).sort((a, b) => b.score - a.score);

  const recommendations = allRanked.slice(0, limit);

  const starterPaths = STARTER_CAREER_PATHS.map((path) =>
    evaluatePathMatch(path, profile, academicContext)
  );

  return {
    recommendations,
    starterPaths,
    allRanked,
    hasSufficientInfo,
    academicContext,
  };
}

/**
 * Pure deterministic calculation of up to three related career paths
 * based strictly on real career catalogue data.
 *
 * Ranking criteria:
 * 1. Same career category (+10 points)
 * 2. Shared core skills (+3 points each)
 * 3. Shared prerequisite skills (+2 points each)
 * 4. Shared interests (+1.5 points each)
 * 5. Shared eligible learner stages (+1 point each)
 * 6. Shared compatible streams or degrees (+0.5 points each)
 * 7. Stable catalogue order (numericId ascending) as tie-breaker
 */
export function getRelatedCareerPaths(
  selectedPath: CareerPath,
  catalogue: CareerPath[] = CAREER_CATALOGUE,
  limit: number = 3
): CareerPath[] {
  if (!selectedPath) return [];

  const selectedCore = new Set((selectedPath.coreSkills || []).map((s) => s.toLowerCase().trim()));
  const selectedPrereqs = new Set((selectedPath.prerequisiteSkills || []).map((s) => s.toLowerCase().trim()));
  const selectedInterests = new Set((selectedPath.interests || []).map((i) => i.toLowerCase().trim()));
  const selectedStages = new Set(selectedPath.eligibleLearnerStages || []);
  const selectedStreams = new Set((selectedPath.compatibleStreamsOrDegrees || []).map((s) => s.toLowerCase().trim()));

  const candidates = catalogue.filter(
    (p) => p.numericId !== selectedPath.numericId && p.slug !== selectedPath.slug
  );

  const scored = candidates.map((candidate) => {
    let score = 0;

    // 1. Same career category
    if (candidate.category === selectedPath.category) {
      score += 10;
    }

    // 2. Shared core skills
    (candidate.coreSkills || []).forEach((s) => {
      if (selectedCore.has(s.toLowerCase().trim())) {
        score += 3;
      }
    });

    // 3. Shared prerequisite skills
    (candidate.prerequisiteSkills || []).forEach((s) => {
      if (selectedPrereqs.has(s.toLowerCase().trim())) {
        score += 2;
      }
    });

    // 4. Shared interests
    (candidate.interests || []).forEach((i) => {
      if (selectedInterests.has(i.toLowerCase().trim())) {
        score += 1.5;
      }
    });

    // 5. Shared eligible learner stages
    (candidate.eligibleLearnerStages || []).forEach((st) => {
      if (selectedStages.has(st)) {
        score += 1;
      }
    });

    // 6. Shared compatible streams or degrees
    (candidate.compatibleStreamsOrDegrees || []).forEach((deg) => {
      if (selectedStreams.has(deg.toLowerCase().trim())) {
        score += 0.5;
      }
    });

    return { candidate, score };
  });

  // Sort descending by score; stable tie-breaker: candidate.numericId ascending
  scored.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.candidate.numericId - b.candidate.numericId;
  });

  return scored.slice(0, limit).map((s) => s.candidate);
}
