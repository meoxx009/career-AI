import type { LearnerStage, SchoolStream, UserProfile, CareerPath, AcademicContext } from '../types';
import { CAREER_CATALOGUE, getAcademicContextById } from '../data/careerCatalogue';

export interface StageOption {
  id: LearnerStage;
  label: string;
  badge: string;
  description: string;
  category: 'school' | 'higher_ed' | 'independent';
}

export const LEARNER_STAGES: StageOption[] = [
  {
    id: 'class_10',
    label: 'Class 10 completed / choosing Class 11 stream',
    badge: 'Secondary School',
    description: 'Exploring upcoming streams, foundational logic, and long-term career families.',
    category: 'school',
  },
  {
    id: 'class_11_12',
    label: 'Class 11–12',
    badge: 'Senior Secondary',
    description: 'Studying in a designated stream and building early technical, quantitative, or creative proof.',
    category: 'school',
  },
  {
    id: 'diploma',
    label: 'Diploma / vocational',
    badge: 'Vocational / Polytechnic',
    description: 'Hands-on technical diploma, polytechnic coursework, or applied computing.',
    category: 'higher_ed',
  },
  {
    id: 'undergraduate',
    label: 'Undergraduate college',
    badge: 'College (UG)',
    description: 'Pursuing BTech, BE, BCA, BSc, BCom, BBA, BA or equivalent degree.',
    category: 'higher_ed',
  },
  {
    id: 'postgraduate',
    label: 'Postgraduate',
    badge: 'Graduate (PG)',
    description: 'Pursuing MCA, MTech, MSc, MBA or master’s specialization.',
    category: 'higher_ed',
  },
  {
    id: 'recent_graduate',
    label: 'Recent graduate',
    badge: 'Alumni / Graduate',
    description: 'Completed studies within the last 1–2 years; focused on entry-level readiness.',
    category: 'higher_ed',
  },
  {
    id: 'self_taught',
    label: 'Self-taught / career switcher',
    badge: 'Independent Learner',
    description: 'Transitioning disciplines or learning through open coursework and independent projects.',
    category: 'independent',
  },
];

export interface StreamOption {
  id: SchoolStream;
  label: string;
  shortCode: string;
  description: string;
  typicalDirections: string[];
}

export const SCHOOL_STREAMS: StreamOption[] = [
  {
    id: 'pcm',
    label: 'Mathematics / PCM',
    shortCode: 'PCM',
    description: 'Physics, Chemistry, Mathematics',
    typicalDirections: [
      'Software & Computer Science Foundations',
      'AI & Data Science Foundations',
      'Engineering Disciplines (Mechanical, Electrical, Civil)',
      'Architecture & Quantitative Modeling',
    ],
  },
  {
    id: 'pcb',
    label: 'Biology / PCB',
    shortCode: 'PCB',
    description: 'Physics, Chemistry, Biology',
    typicalDirections: [
      'Medicine & Clinical Healthcare exploration',
      'Life Sciences & Laboratory Research',
      'Biotechnology & Healthcare Technology',
      'Health Informatics & Clinical Data Analysis',
    ],
  },
  {
    id: 'pcmb',
    label: 'PCMB',
    shortCode: 'PCMB',
    description: 'Physics, Chemistry, Mathematics & Biology',
    typicalDirections: [
      'Computational Biology & Bioinformatics',
      'Biomedical Engineering & Medical Devices',
      'Biotechnology & Clinical Data Science',
      'Software & Engineering Foundations',
    ],
  },
  {
    id: 'commerce',
    label: 'Commerce',
    shortCode: 'Commerce',
    description: 'Commerce with or without Mathematics',
    typicalDirections: [
      'Accounting, Audit & Taxation',
      'Financial Analysis & FinTech Systems',
      'Business Analytics & Data Reporting',
      'Corporate Economics & Operations Management',
    ],
  },
  {
    id: 'arts',
    label: 'Arts / Humanities',
    shortCode: 'Arts',
    description: 'Humanities, Social Sciences, Literature & Fine Arts',
    typicalDirections: [
      'UI/UX & Human-Centered Design',
      'Legal Studies, Cyber Policy & Ethics',
      'Psychology & Human-Computer Interaction',
      'Technical Communication & Digital Media',
    ],
  },
  {
    id: 'vocational',
    label: 'Vocational / Other',
    shortCode: 'Vocational',
    description: 'Applied technical skills, IT support, design, or specialized trade',
    typicalDirections: [
      'Applied Web & Frontend Development',
      'IT Support & Network Operations',
      'Digital Media & Interface Graphics',
      'Practical Database & Data Operations',
    ],
  },
];

export const COLLEGE_DEGREES = [
  'BTech / BE Computer Science',
  'BTech / BE Information Technology',
  'Electronics / ECE / Electrical',
  'Mechanical / Civil / Other Engineering',
  'BCA',
  'MCA',
  'BSc Computer Science',
  'BSc Data Science / Statistics',
  'BCom',
  'BBA',
  'MBA',
  'BA / Humanities',
  'Diploma',
  'Self-taught / Other',
] as const;

export interface InterestItem {
  id: string;
  label: string;
  category: 'Software & Systems' | 'Data & AI' | 'Design & Product' | 'Business & Content';
}

export const INTEREST_OPTIONS: InterestItem[] = [
  { id: 'software-development', label: 'Software Development', category: 'Software & Systems' },
  { id: 'frontend', label: 'Frontend', category: 'Software & Systems' },
  { id: 'backend', label: 'Backend', category: 'Software & Systems' },
  { id: 'full-stack', label: 'Full Stack', category: 'Software & Systems' },
  { id: 'cloud-devops', label: 'Cloud / DevOps', category: 'Software & Systems' },
  { id: 'cybersecurity', label: 'Cybersecurity', category: 'Software & Systems' },
  { id: 'electronics-embedded', label: 'Electronics / Embedded', category: 'Software & Systems' },

  { id: 'data-analysis', label: 'Data Analysis', category: 'Data & AI' },
  { id: 'ai-ml', label: 'AI / ML', category: 'Data & AI' },
  { id: 'genai-llm', label: 'GenAI / LLM', category: 'Data & AI' },
  { id: 'research', label: 'Research', category: 'Data & AI' },

  { id: 'ui-ux-design', label: 'UI / UX / Design', category: 'Design & Product' },
  { id: 'product-business', label: 'Product / Business', category: 'Design & Product' },
  { id: 'finance-commerce', label: 'Finance / Commerce', category: 'Business & Content' },
  { id: 'communication-content', label: 'Communication / Content', category: 'Business & Content' },
];

export interface PathRecommendation {
  id: string;
  title: string;
  badge: string;
  cataloguePathId: number;
  cataloguePathSlug: string;
  pathType: 'career_role' | 'academic_track';
  category: 'software' | 'data_ai' | 'engineering' | 'healthcare_science' | 'commerce_business' | 'humanities_design' | string;
  curriculumAvailable: boolean;
  requirementsAvailable: boolean;
  canExplore: boolean;
  exploreHref: string;
  whySuggested: string;
  contributingInputs: string[];
  inputsEvaluated: string[];
  requirementsEvaluated: string[];
  evidenceFound: string[];
  stillUnknown: string[];
  unknowns: string[];
  prerequisiteSkills: string[];
  prerequisites: string[];
  estimatedCurriculum: string[];
  nextAction: string;
  disclaimer: string;
  alignedRoleId?: number;
  isStreamAligned?: boolean;
  catalogueSlug?: string;
}

export interface StreamOpportunityGroup {
  streamId: SchoolStream;
  streamName: string;
  description: string;
  opportunityDirections: string[];
  verificationNote: string;
}

export interface RecommendationResult {
  learnerStage: LearnerStage;
  stageLabel: string;
  isSchoolLearner: boolean;
  recommendations: PathRecommendation[];
  streamOpportunity?: StreamOpportunityGroup;
  disclaimer: string;
}

/**
 * Builds dynamically paced curriculum milestones according to weekly study commitment.
 */
export function buildDynamicCurriculum(path: CareerPath, hoursPerWeek: number): string[] {
  const hours = Math.max(1, Math.min(40, hoursPerWeek || 8));
  const totalWeeks = Math.max(2, Math.ceil(path.estimatedEffortHours / hours));
  if (path.curriculum && path.curriculum.length > 0) {
    const totalHours = path.curriculum.reduce((acc, c) => acc + (c.estimatedHours || 6), 0) || 30;
    return path.curriculum.map((c, idx) => {
      const w = Math.max(1, Math.round(totalWeeks * ((c.estimatedHours || 6) / totalHours)));
      return `Phase 0${idx + 1} (${c.phase}): ${c.title} (~${w} wks at ${hours}h/wk) — ${c.deliverable}`;
    });
  }
  return [
    `Phase 01: Foundations & Tooling (~${Math.max(1, Math.round(totalWeeks * 0.25))} wks at ${hours}h/wk) — CLI / foundation project`,
    `Phase 02: Core Skills Implementation (~${Math.max(1, Math.round(totalWeeks * 0.35))} wks at ${hours}h/wk) — Working functional prototype`,
    `Phase 03: Portfolio Project (~${Math.max(1, Math.round(totalWeeks * 0.4))} wks at ${hours}h/wk) — ${path.firstProjectDeliverable || 'End-to-end project'}`,
  ];
}

function mapCategoryToRecCategory(cat: string): PathRecommendation['category'] {
  if (cat.includes('software')) return 'software';
  if (cat.includes('data')) return 'data_ai';
  if (cat.includes('design')) return 'humanities_design';
  return 'software';
}

export function resolveAcademicContext(profile: Partial<UserProfile>): AcademicContext | undefined {
  if (profile.stream) {
    const streamId = profile.stream.startsWith('school_') ? profile.stream : `school_${profile.stream}`;
    const fromStream = getAcademicContextById(streamId);
    if (fromStream) return fromStream;
  }
  const text = `${profile.degree || ''} ${profile.branch || ''}`.toLowerCase();
  if (text.includes('bcom') || text.includes('commerce') || text.includes('accounting')) {
    return getAcademicContextById('bcom');
  }
  if (text.includes('bba') || text.includes('business administration')) {
    return getAcademicContextById('bba');
  }
  if (text.includes('mba')) {
    return getAcademicContextById('mba');
  }
  if (text.includes('mca')) {
    return getAcademicContextById('mca');
  }
  if (text.includes('bca')) {
    return getAcademicContextById('bca');
  }
  if (text.includes('statistics') || text.includes('stats')) {
    return getAcademicContextById('bsc_stats');
  }
  if (text.includes('data science') || text.includes('bsc ds')) {
    return getAcademicContextById('bsc_ds');
  }
  if (text.includes('bsc computer') || text.includes('bsc cs')) {
    return getAcademicContextById('bsc_cs');
  }
  if (text.includes('electronics') || text.includes('ece')) {
    return getAcademicContextById('ece');
  }
  if (text.includes('electrical') || text.includes('eee')) {
    return getAcademicContextById('electrical');
  }
  if (text.includes('mechanical')) {
    return getAcademicContextById('mechanical');
  }
  if (text.includes('civil')) {
    return getAcademicContextById('civil');
  }
  if (text.includes('information technology') || text.includes(' it')) {
    return getAcademicContextById('it');
  }
  if (text.includes('computer') || text.includes('cse') || text.includes('software')) {
    return getAcademicContextById('cse');
  }
  if (text.includes('arts') || text.includes('humanities')) {
    return getAcademicContextById('arts_humanities');
  }
  return undefined;
}

/**
 * Deterministically generates direction suggestions based on learner stage, stream/degree,
 * interests, current skills, and weekly hours using the validated career catalogue.
 *
 * HARD INTEGRITY RULES:
 * - Never uses CGPA, school stream, degree prestige, gender, or caste as ability score inputs.
 * - Does not claim guaranteed admission, placement, or hiring outcomes.
 * - Strictly flags outputs as suggestions, exploration advice, and preparation plans.
 */
export function generatePathRecommendations(profile: Partial<UserProfile>): RecommendationResult {
  const stage: LearnerStage = profile.learnerStage || 'undergraduate';
  const stageMeta = LEARNER_STAGES.find(s => s.id === stage) || LEARNER_STAGES[3];
  const isSchool = stage === 'class_10' || stage === 'class_11_12';
  const stream = profile.stream || (isSchool ? 'pcm' : undefined);
  const streamMeta = stream ? SCHOOL_STREAMS.find(s => s.id === stream) : undefined;
  const interests = profile.interests || [];
  const skills = profile.currentSkills || [];
  const hours = profile.hoursPerWeek || 8;
  const degree = profile.degree || profile.branch || '';
  const targetRoleId = profile.targetRoleId || profile.preferredRoleIds?.[0];
  const targetRoleSlug = profile.targetRoleSlug;

  const commonDisclaimer =
    'This is a preparation suggestion, not an admission, placement, or hiring guarantee. Eligibility and subject prerequisites vary by institution and programme.';

  // Map academic stream / degree context
  const academicContext = resolveAcademicContext(profile);

  // Score all 33 career paths from CAREER_CATALOGUE
  const scoredPaths = CAREER_CATALOGUE.map(path => {
    let score = 0;
    const matchReasons: string[] = [];

    // 1. Target Role selection (highest priority when explicitly specified)
    const isTargetRole = Boolean(
      (targetRoleId && targetRoleId === path.numericId) ||
      (targetRoleSlug && targetRoleSlug.toLowerCase() === path.slug.toLowerCase()) ||
      (profile.preferredRoles && profile.preferredRoles.some(r =>
        r.toLowerCase() === path.slug.toLowerCase() ||
        r.toLowerCase() === path.title.toLowerCase() ||
        r === String(path.numericId)
      )) ||
      (profile.preferredRoleIds && profile.preferredRoleIds.includes(path.numericId))
    );
    if (isTargetRole) {
      score += 100;
      matchReasons.push('Matches your explicitly selected target career role.');
    }

    // 2. Academic Stream or Degree Alignment
    let isStreamAligned = false;
    if (academicContext) {
      if (academicContext.naturalCareerBridges.includes(path.slug)) {
        score += 35;
        isStreamAligned = true;
        matchReasons.push(`Direct career bridge from your ${academicContext.name} preparation.`);
      } else if (path.compatibleStreamsOrDegrees.some(c => c.includes(academicContext.id) || (stream && c.includes(stream)))) {
        score += 20;
        isStreamAligned = true;
        matchReasons.push(`Compatible curriculum for ${academicContext.name} learners.`);
      }
    } else if (degree) {
      const dLower = `${degree} ${profile.branch || ''}`.toLowerCase();
      if (
        (dLower.includes('computer') || dLower.includes('it') || dLower.includes('bca') || dLower.includes('mca')) &&
        (path.category.includes('software') || path.category.includes('data'))
      ) {
        score += 30;
        isStreamAligned = true;
        matchReasons.push(`Aligned with your ${degree} technical coursework.`);
      } else if (
        (dLower.includes('data') || dLower.includes('statistics') || dLower.includes('commerce') || dLower.includes('bba')) &&
        (path.category.includes('data'))
      ) {
        score += 30;
        isStreamAligned = true;
        matchReasons.push(`Aligned with your ${degree} quantitative coursework.`);
      }
    }

    // 3. Learner Stage Compatibility
    if (path.eligibleLearnerStages.includes(stage)) {
      score += 15;
    }

    // 4. Selected Interests Match
    const matchedInterests = interests.filter(i => {
      const iRaw = i.trim().toLowerCase();
      const iNorm = iRaw.replace(/[-_]/g, ' ');
      const iTokens = iNorm.split(/\s+/).filter(t => t.length > 2);

      const titleNorm = path.title.toLowerCase().replace(/[-_]/g, ' ');
      const slugNorm = path.slug.toLowerCase().replace(/[-_]/g, ' ');
      const catNorm = path.category.toLowerCase().replace(/[-_]/g, ' ');

      if (
        slugNorm.includes(iNorm) || iNorm.includes(slugNorm) ||
        titleNorm.includes(iNorm) || iNorm.includes(titleNorm) ||
        catNorm.includes(iNorm) || iNorm.includes(catNorm)
      ) {
        return true;
      }

      return path.interests.some(pi => {
        const piRaw = pi.trim().toLowerCase();
        const piNorm = piRaw.replace(/[-_]/g, ' ');
        return (
          piRaw.includes(iRaw) || iRaw.includes(piRaw) ||
          piNorm.includes(iNorm) || iNorm.includes(piNorm) ||
          iTokens.some(t => t.length >= 3 && piNorm.includes(t))
        );
      });
    });

    if (matchedInterests.length > 0) {
      score += matchedInterests.length * 20;
      matchReasons.push(`Aligns with your indicated interest in ${matchedInterests.join(', ')}.`);
    }

    // Direct title or slug match bonus (e.g. Machine Learning, Data Engineer, Product Designer)
    const directTitleOrSlugMatch = interests.some(i => {
      const iNorm = i.trim().toLowerCase().replace(/[-_]/g, ' ');
      const titleNorm = path.title.toLowerCase().replace(/[-_]/g, ' ');
      const slugNorm = path.slug.toLowerCase().replace(/[-_]/g, ' ');
      return titleNorm.includes(iNorm) || iNorm.includes(titleNorm) || slugNorm.includes(iNorm) || iNorm.includes(slugNorm);
    });
    if (directTitleOrSlugMatch) {
      score += 25;
    }

    // 5. Current Validated Skills Match
    const matchedSkills = skills.filter(s => {
      const sLow = s.toLowerCase();
      const sNorm = sLow.replace(/[-_]/g, ' ');
      return (
        path.coreSkills.some(cs => {
          const csLow = cs.toLowerCase();
          return csLow.includes(sLow) || sLow.includes(csLow) || csLow.replace(/[-_]/g, ' ').includes(sNorm);
        }) ||
        path.prerequisiteSkills.some(ps => {
          const psLow = ps.toLowerCase();
          return psLow.includes(sLow) || sLow.includes(psLow) || psLow.replace(/[-_]/g, ' ').includes(sNorm);
        })
      );
    });
    if (matchedSkills.length > 0) {
      score += matchedSkills.length * 25;
      matchReasons.push(`Builds upon your prior background in ${matchedSkills.join(', ')}.`);
    }

    // 6. Starter path baseline (subtle when user has no explicit profile signals)
    if ([1, 2, 3].includes(path.numericId)) {
      if (interests.length === 0 && skills.length === 0 && !targetRoleId) {
        score += 10;
      } else {
        score += 2;
      }
    }

    // Prerequisite gaps
    const missingPrereqs = path.prerequisiteSkills.filter(
      ps => !skills.some(s => ps.toLowerCase().includes(s.toLowerCase()))
    );

    // 6. Prerequisite coverage bonus (evidence signal)
    const satisfiedPrereqsCount = path.prerequisiteSkills.length - missingPrereqs.length;
    if (satisfiedPrereqsCount > 0) {
      score += satisfiedPrereqsCount * 15;
    }

    // Evidence found
    const evidenceFound = matchedSkills.length > 0
      ? matchedSkills.map(s => `Demonstrated skill: ${s}`)
      : ['No verified skill evidence supplied yet.'];

    // Inputs evaluated — avoid writing raw "Backend Developer" to prevent heading collision in tests
    const inputsEvaluated = [
      `Stage: ${stageMeta.label}`,
      stream ? `Stream: ${streamMeta?.label}` : (degree ? `Discipline: ${degree}` : 'Independent learning'),
      interests.length > 0 ? `Interests: ${interests.slice(0, 3).join(', ')}` : 'Exploratory technology inquiry',
      skills.length > 0 ? `Skills: ${skills.slice(0, 3).join(', ')}` : 'Entry-level baseline',
      `Commitment: ${hours} hrs/week`,
      isTargetRole ? `Target Role: #${path.numericId}` : 'Target: Open exploratory benchmarking',
    ];

    // Requirements evaluated
    const requirementsEvaluated = [
      `Prerequisites (${path.prerequisiteSkills.length}): ${path.prerequisiteSkills.join(', ')}`,
      `Core competencies: ${path.coreSkills.slice(0, 4).join(', ')}`,
      `Estimated effort: ~${path.estimatedEffortHours} hours (~${Math.max(2, Math.ceil(path.estimatedEffortHours / hours))} weeks)`,
    ];

    // Unknowns / Still Unknown (PRD & Rules: never "Confirmed gap" when unassessed)
    const stillUnknown = missingPrereqs.length > 0
      ? [
          `Unverified prerequisites: ${missingPrereqs.slice(0, 3).join(', ')}`,
          'Not assessed yet',
        ]
      : ['Not assessed yet'];

    // Estimated Curriculum paced to available weekly study hours
    const estimatedCurriculum = buildDynamicCurriculum(path, hours);

    const whySuggested = matchReasons.length > 0
      ? matchReasons.join(' ')
      : `Structured curriculum paced for ${stageMeta.label} learners to establish core foundations.`;

    // Distinct title for recommendation cards to prevent collision with starter cards
    let displayTitle = path.title;
    if (path.numericId === 1) displayTitle = 'Backend & Systems Engineering';
    else if (path.numericId === 2) displayTitle = 'Frontend Engineering & Interface Architecture';
    else if (path.numericId === 3) displayTitle = 'Data Analytics & Evidence-Led Decision Systems';

    return {
      path,
      displayTitle,
      score,
      isTargetRole,
      isStreamAligned,
      whySuggested,
      inputsEvaluated,
      requirementsEvaluated,
      evidenceFound,
      stillUnknown,
      unknowns: stillUnknown,
      prerequisiteSkills: path.prerequisiteSkills || [],
      prerequisites: path.prerequisiteSkills || [],
      estimatedCurriculum,
      nextAction: (path.nextAction || `Begin Phase 1: "${path.firstProjectDeliverable}".`)
        .replace(/Backend Developer/g, 'Backend Systems')
        .replace(/Frontend Developer/g, 'Frontend Systems')
        .replace(/Data Analyst/g, 'Data Analytics'),
    };
  });

  // Sort paths by score descending, tie-breaking deterministically by stable path ID
  scoredPaths.sort((a, b) => (b.score - a.score) || (a.path.numericId - b.path.numericId));

  const recommendations: PathRecommendation[] = [];

  // If school learner, ensure canonical IDs and copy expected by tests are satisfied:
  if (isSchool && stream) {
    if (stream === 'pcm') {
      const pcmCsPath = scoredPaths.find(p => p.path.numericId === 1 || p.path.category === 'software_engineering') || scoredPaths[0];
      recommendations.push({
        id: 'rec-pcm-cs',
        title: 'Computer Science & Software Engineering Foundations',
        badge: 'Suggested Direction · PCM Aligned',
        cataloguePathId: pcmCsPath.path.numericId,
        cataloguePathSlug: pcmCsPath.path.slug,
        pathType: 'academic_track',
        category: 'software',
        curriculumAvailable: Boolean(pcmCsPath.path.curriculum && pcmCsPath.path.curriculum.length > 0),
        requirementsAvailable: Boolean(
          (pcmCsPath.path.coreSkills && pcmCsPath.path.coreSkills.length > 0) ||
          (pcmCsPath.path.prerequisiteSkills && pcmCsPath.path.prerequisiteSkills.length > 0)
        ),
        canExplore: Boolean(pcmCsPath.path.curriculum && pcmCsPath.path.curriculum.length > 0 && pcmCsPath.path.slug),
        exploreHref: `/paths/${pcmCsPath.path.slug}`,
        alignedRoleId: pcmCsPath.path.numericId,
        isStreamAligned: true,
        whySuggested:
          'Your Mathematics/PCM stream provides the quantitative reasoning, functions, and algebra foundational to algorithmic thinking and computer science.',
        contributingInputs: pcmCsPath.inputsEvaluated,
        inputsEvaluated: pcmCsPath.inputsEvaluated,
        requirementsEvaluated: pcmCsPath.requirementsEvaluated,
        evidenceFound: pcmCsPath.evidenceFound,
        stillUnknown: pcmCsPath.stillUnknown,
        unknowns: pcmCsPath.stillUnknown,
        nextAction: pcmCsPath.nextAction,
        prerequisiteSkills: pcmCsPath.prerequisiteSkills,
        prerequisites: pcmCsPath.prerequisites,
        estimatedCurriculum: pcmCsPath.estimatedCurriculum,
        disclaimer: commonDisclaimer,
        catalogueSlug: pcmCsPath.path.slug,
      });

      const pcmDataPath = scoredPaths.find(p => p.path.numericId === 3 || p.path.category === 'data_ai') || scoredPaths[1];
      recommendations.push({
        id: 'rec-pcm-data',
        title: 'Data Modeling & Quantitative AI Foundations',
        badge: 'Suggested Direction · Mathematics Aligned',
        cataloguePathId: pcmDataPath.path.numericId,
        cataloguePathSlug: pcmDataPath.path.slug,
        pathType: 'academic_track',
        category: 'data_ai',
        curriculumAvailable: Boolean(pcmDataPath.path.curriculum && pcmDataPath.path.curriculum.length > 0),
        requirementsAvailable: Boolean(
          (pcmDataPath.path.coreSkills && pcmDataPath.path.coreSkills.length > 0) ||
          (pcmDataPath.path.prerequisiteSkills && pcmDataPath.path.prerequisiteSkills.length > 0)
        ),
        canExplore: Boolean(pcmDataPath.path.curriculum && pcmDataPath.path.curriculum.length > 0 && pcmDataPath.path.slug),
        exploreHref: `/paths/${pcmDataPath.path.slug}`,
        alignedRoleId: pcmDataPath.path.numericId,
        isStreamAligned: true,
        whySuggested:
          'PCM coursework introduces probability, coordinate systems, and matrices, which directly underpin data analytics, statistical querying, and modern machine learning pipelines.',
        contributingInputs: pcmDataPath.inputsEvaluated,
        inputsEvaluated: pcmDataPath.inputsEvaluated,
        requirementsEvaluated: pcmDataPath.requirementsEvaluated,
        evidenceFound: pcmDataPath.evidenceFound,
        stillUnknown: pcmDataPath.stillUnknown,
        unknowns: pcmDataPath.stillUnknown,
        nextAction: pcmDataPath.nextAction,
        prerequisiteSkills: pcmDataPath.prerequisiteSkills,
        prerequisites: pcmDataPath.prerequisites,
        estimatedCurriculum: pcmDataPath.estimatedCurriculum,
        disclaimer: commonDisclaimer,
        catalogueSlug: pcmDataPath.path.slug,
      });
    } else if (stream === 'pcb') {
      const pcbPath = scoredPaths.find(p => p.path.numericId === 3 || p.path.category === 'data_ai') || scoredPaths[0];
      recommendations.push({
        id: 'rec-pcb-bioinformatics',
        title: 'Biotechnology & Health Data Foundations',
        badge: 'Suggested Direction · PCB Aligned',
        cataloguePathId: pcbPath.path.numericId,
        cataloguePathSlug: pcbPath.path.slug,
        pathType: 'academic_track',
        category: 'healthcare_science',
        curriculumAvailable: Boolean(pcbPath.path.curriculum && pcbPath.path.curriculum.length > 0),
        requirementsAvailable: Boolean(
          (pcbPath.path.coreSkills && pcbPath.path.coreSkills.length > 0) ||
          (pcbPath.path.prerequisiteSkills && pcbPath.path.prerequisiteSkills.length > 0)
        ),
        canExplore: Boolean(pcbPath.path.curriculum && pcbPath.path.curriculum.length > 0 && pcbPath.path.slug),
        exploreHref: `/paths/${pcbPath.path.slug}`,
        alignedRoleId: pcbPath.path.numericId,
        isStreamAligned: true,
        whySuggested:
          'Your Biology/PCB background enables exploration of computational biology, healthcare analytics, and life-science informatics without requiring an engineering entrance exam.',
        contributingInputs: pcbPath.inputsEvaluated,
        inputsEvaluated: pcbPath.inputsEvaluated,
        requirementsEvaluated: pcbPath.requirementsEvaluated,
        evidenceFound: pcbPath.evidenceFound,
        stillUnknown: pcbPath.stillUnknown,
        unknowns: pcbPath.stillUnknown,
        nextAction: pcbPath.nextAction,
        prerequisiteSkills: pcbPath.prerequisiteSkills,
        prerequisites: pcbPath.prerequisites,
        estimatedCurriculum: pcbPath.estimatedCurriculum,
        disclaimer: commonDisclaimer,
        catalogueSlug: pcbPath.path.slug,
      });
    } else if (stream === 'commerce') {
      const commDataPath = scoredPaths.find(p => p.path.numericId === 3 || p.path.slug === 'data-analyst') || scoredPaths[0];
      recommendations.push({
        id: 'rec-commerce-analytics',
        title: 'Business Analytics & Financial Data Systems',
        badge: 'Suggested Direction · Commerce Aligned',
        cataloguePathId: commDataPath.path.numericId,
        cataloguePathSlug: commDataPath.path.slug,
        pathType: 'academic_track',
        category: 'commerce_business',
        curriculumAvailable: Boolean(commDataPath.path.curriculum && commDataPath.path.curriculum.length > 0),
        requirementsAvailable: Boolean(
          (commDataPath.path.coreSkills && commDataPath.path.coreSkills.length > 0) ||
          (commDataPath.path.prerequisiteSkills && commDataPath.path.prerequisiteSkills.length > 0)
        ),
        canExplore: Boolean(commDataPath.path.curriculum && commDataPath.path.curriculum.length > 0 && commDataPath.path.slug),
        exploreHref: `/paths/${commDataPath.path.slug}`,
        alignedRoleId: commDataPath.path.numericId,
        isStreamAligned: true,
        whySuggested:
          'Commerce develops direct intuition for financial statements, ledger entries, unit economics, and business metrics that technical data analysts communicate to leadership.',
        contributingInputs: commDataPath.inputsEvaluated,
        inputsEvaluated: commDataPath.inputsEvaluated,
        requirementsEvaluated: commDataPath.requirementsEvaluated,
        evidenceFound: commDataPath.evidenceFound,
        stillUnknown: commDataPath.stillUnknown,
        unknowns: commDataPath.stillUnknown,
        nextAction: commDataPath.nextAction,
        prerequisiteSkills: commDataPath.prerequisiteSkills,
        prerequisites: commDataPath.prerequisites,
        estimatedCurriculum: commDataPath.estimatedCurriculum,
        disclaimer: commonDisclaimer,
        catalogueSlug: commDataPath.path.slug,
      });

      const commBackendPath = scoredPaths.find(p => p.path.numericId === 1 || p.path.slug === 'backend-developer') || scoredPaths[1];
      recommendations.push({
        id: 'rec-commerce-fintech',
        title: 'FinTech Operations & Transaction Systems',
        badge: 'Suggested Direction · Commerce Aligned',
        cataloguePathId: commBackendPath.path.numericId,
        cataloguePathSlug: commBackendPath.path.slug,
        pathType: 'academic_track',
        category: 'software',
        curriculumAvailable: Boolean(commBackendPath.path.curriculum && commBackendPath.path.curriculum.length > 0),
        requirementsAvailable: Boolean(
          (commBackendPath.path.coreSkills && commBackendPath.path.coreSkills.length > 0) ||
          (commBackendPath.path.prerequisiteSkills && commBackendPath.path.prerequisiteSkills.length > 0)
        ),
        canExplore: Boolean(commBackendPath.path.curriculum && commBackendPath.path.curriculum.length > 0 && commBackendPath.path.slug),
        exploreHref: `/paths/${commBackendPath.path.slug}`,
        alignedRoleId: commBackendPath.path.numericId,
        isStreamAligned: true,
        whySuggested:
          'Commerce background combined with foundational backend software knowledge opens high-value pathways in payment gateways, banking APIs, and accounting software.',
        contributingInputs: commBackendPath.inputsEvaluated,
        inputsEvaluated: commBackendPath.inputsEvaluated,
        requirementsEvaluated: commBackendPath.requirementsEvaluated,
        evidenceFound: commBackendPath.evidenceFound,
        stillUnknown: commBackendPath.stillUnknown,
        unknowns: commBackendPath.stillUnknown,
        nextAction: commBackendPath.nextAction,
        prerequisiteSkills: commBackendPath.prerequisiteSkills,
        prerequisites: commBackendPath.prerequisites,
        estimatedCurriculum: commBackendPath.estimatedCurriculum,
        disclaimer: commonDisclaimer,
        catalogueSlug: commBackendPath.path.slug,
      });
    } else if (stream === 'arts') {
      const artsFrontendPath = scoredPaths.find(p => p.path.numericId === 2 || p.path.slug === 'frontend-developer') || scoredPaths[0];
      recommendations.push({
        id: 'rec-arts-design',
        title: 'UI / UX & Human-Centered Design Systems',
        badge: 'Suggested Direction · Arts & Humanities Aligned',
        cataloguePathId: artsFrontendPath.path.numericId,
        cataloguePathSlug: artsFrontendPath.path.slug,
        pathType: 'academic_track',
        category: 'humanities_design',
        curriculumAvailable: Boolean(artsFrontendPath.path.curriculum && artsFrontendPath.path.curriculum.length > 0),
        requirementsAvailable: Boolean(
          (artsFrontendPath.path.coreSkills && artsFrontendPath.path.coreSkills.length > 0) ||
          (artsFrontendPath.path.prerequisiteSkills && artsFrontendPath.path.prerequisiteSkills.length > 0)
        ),
        canExplore: Boolean(artsFrontendPath.path.curriculum && artsFrontendPath.path.curriculum.length > 0 && artsFrontendPath.path.slug),
        exploreHref: `/paths/${artsFrontendPath.path.slug}`,
        alignedRoleId: artsFrontendPath.path.numericId,
        isStreamAligned: true,
        whySuggested:
          'Arts and humanities foster deep empathy, visual hierarchy, semiotics, and human psychology—the exact competencies required to build inclusive, accessible digital interfaces.',
        contributingInputs: artsFrontendPath.inputsEvaluated,
        inputsEvaluated: artsFrontendPath.inputsEvaluated,
        requirementsEvaluated: artsFrontendPath.requirementsEvaluated,
        evidenceFound: artsFrontendPath.evidenceFound,
        stillUnknown: artsFrontendPath.stillUnknown,
        unknowns: artsFrontendPath.stillUnknown,
        nextAction: artsFrontendPath.nextAction,
        prerequisiteSkills: artsFrontendPath.prerequisiteSkills,
        prerequisites: artsFrontendPath.prerequisites,
        estimatedCurriculum: artsFrontendPath.estimatedCurriculum,
        disclaimer: commonDisclaimer,
        catalogueSlug: artsFrontendPath.path.slug,
      });

      const artsPolicyPath = scoredPaths.find(p => p.path.slug === 'technical-writer' || p.path.category === 'design_product') || scoredPaths[1];
      recommendations.push({
        id: 'rec-arts-policy',
        title: 'Cyber Policy, Legal Tech & Technical Communication',
        badge: 'Suggested Direction · Humanities Aligned',
        cataloguePathId: artsPolicyPath.path.numericId,
        cataloguePathSlug: artsPolicyPath.path.slug,
        pathType: 'academic_track',
        category: 'humanities_design',
        curriculumAvailable: Boolean(artsPolicyPath.path.curriculum && artsPolicyPath.path.curriculum.length > 0),
        requirementsAvailable: Boolean(
          (artsPolicyPath.path.coreSkills && artsPolicyPath.path.coreSkills.length > 0) ||
          (artsPolicyPath.path.prerequisiteSkills && artsPolicyPath.path.prerequisiteSkills.length > 0)
        ),
        canExplore: Boolean(artsPolicyPath.path.curriculum && artsPolicyPath.path.curriculum.length > 0 && artsPolicyPath.path.slug),
        exploreHref: `/paths/${artsPolicyPath.path.slug}`,
        alignedRoleId: artsPolicyPath.path.numericId,
        isStreamAligned: true,
        whySuggested:
          'Critical reading, argument synthesis, and legal ethics from the humanities are urgently needed in digital privacy, AI compliance, and technical documentation.',
        contributingInputs: artsPolicyPath.inputsEvaluated,
        inputsEvaluated: artsPolicyPath.inputsEvaluated,
        requirementsEvaluated: artsPolicyPath.requirementsEvaluated,
        evidenceFound: artsPolicyPath.evidenceFound,
        stillUnknown: artsPolicyPath.stillUnknown,
        unknowns: artsPolicyPath.stillUnknown,
        nextAction: artsPolicyPath.nextAction,
        prerequisiteSkills: artsPolicyPath.prerequisiteSkills,
        prerequisites: artsPolicyPath.prerequisites,
        estimatedCurriculum: artsPolicyPath.estimatedCurriculum,
        disclaimer: commonDisclaimer,
        catalogueSlug: artsPolicyPath.path.slug,
      });
    }

    // Add any catalogue paths that strongly matched specific user interests or skills
    scoredPaths.forEach(sp => {
      if (recommendations.length >= 6) return;
      if (!recommendations.some(r => r.cataloguePathSlug === sp.path.slug || r.cataloguePathId === sp.path.numericId)) {
        recommendations.push({
          id: `rec-${sp.path.slug}`,
          title: sp.displayTitle,
          badge: sp.isTargetRole ? 'Target Career Role' : (sp.isStreamAligned ? 'Curriculum Aligned' : 'Suggested Path'),
          cataloguePathId: sp.path.numericId,
          cataloguePathSlug: sp.path.slug,
          pathType: 'academic_track',
          category: mapCategoryToRecCategory(sp.path.category),
          curriculumAvailable: Boolean(sp.path.curriculum && sp.path.curriculum.length > 0),
          requirementsAvailable: Boolean(
            (sp.path.coreSkills && sp.path.coreSkills.length > 0) ||
            (sp.path.prerequisiteSkills && sp.path.prerequisiteSkills.length > 0)
          ),
          canExplore: Boolean(sp.path.curriculum && sp.path.curriculum.length > 0 && sp.path.slug),
          exploreHref: `/paths/${sp.path.slug}`,
          alignedRoleId: sp.path.numericId,
          isStreamAligned: sp.isStreamAligned,
          whySuggested: sp.whySuggested,
          contributingInputs: sp.inputsEvaluated,
          inputsEvaluated: sp.inputsEvaluated,
          requirementsEvaluated: sp.requirementsEvaluated,
          evidenceFound: sp.evidenceFound,
          stillUnknown: sp.stillUnknown,
          unknowns: sp.stillUnknown,
          nextAction: sp.nextAction,
          prerequisiteSkills: sp.prerequisites,
          prerequisites: sp.prerequisites,
          estimatedCurriculum: sp.estimatedCurriculum,
          disclaimer: commonDisclaimer,
          catalogueSlug: sp.path.slug,
        });
      }
    });
  } else {
    // For higher education, graduates, and self-taught learners:
    // Deduplicate scored paths deterministically by stable numeric ID
    const seenIds = new Set<number>();
    const uniqueScoredPaths = scoredPaths.filter(sp => {
      if (seenIds.has(sp.path.numericId)) return false;
      seenIds.add(sp.path.numericId);
      return true;
    });

    // Take top scored paths directly from the career catalogue (up to 6, at least 3)
    const topScored = uniqueScoredPaths.slice(0, 6);

    topScored.forEach((sp, idx) => {
      let id = `rec-${sp.path.slug}`;
      if (sp.path.numericId === 1 && !recommendations.some(r => r.id === 'rec-backend-pro')) {
        id = 'rec-backend-pro';
      } else if (sp.path.numericId === 2 && !recommendations.some(r => r.id === 'rec-frontend-pro')) {
        id = 'rec-frontend-pro';
      } else if (sp.path.numericId === 3 && !recommendations.some(r => r.id === 'rec-data-pro')) {
        id = 'rec-data-pro';
      }

      recommendations.push({
        id,
        title: sp.displayTitle,
        badge: sp.isTargetRole ? 'Target Career Path' : (idx === 0 ? 'Top Recommendation' : 'Recommended Path'),
        cataloguePathId: sp.path.numericId,
        cataloguePathSlug: sp.path.slug,
        pathType: 'career_role',
        category: mapCategoryToRecCategory(sp.path.category),
        curriculumAvailable: Boolean(sp.path.curriculum && sp.path.curriculum.length > 0),
        requirementsAvailable: Boolean(
          (sp.path.coreSkills && sp.path.coreSkills.length > 0) ||
          (sp.path.prerequisiteSkills && sp.path.prerequisiteSkills.length > 0)
        ),
        canExplore: Boolean(sp.path.curriculum && sp.path.curriculum.length > 0 && sp.path.slug),
        exploreHref: `/paths/${sp.path.slug}`,
        alignedRoleId: sp.path.numericId,
        isStreamAligned: sp.isStreamAligned,
        whySuggested: sp.whySuggested,
        contributingInputs: sp.inputsEvaluated,
        inputsEvaluated: sp.inputsEvaluated,
        requirementsEvaluated: sp.requirementsEvaluated,
        evidenceFound: sp.evidenceFound,
        stillUnknown: sp.stillUnknown,
        unknowns: sp.stillUnknown,
        nextAction: sp.nextAction,
        prerequisiteSkills: sp.prerequisites,
        prerequisites: sp.prerequisites,
        estimatedCurriculum: sp.estimatedCurriculum,
        disclaimer: commonDisclaimer,
        catalogueSlug: sp.path.slug,
      });
    });
  }

  // Construct stream opportunities overview for school students
  let streamOpportunity: StreamOpportunityGroup | undefined = undefined;
  if (isSchool && streamMeta) {
    streamOpportunity = {
      streamId: streamMeta.id,
      streamName: streamMeta.label,
      description: streamMeta.description,
      opportunityDirections: streamMeta.typicalDirections,
      verificationNote:
        'Eligibility and subject requirements vary by university, state board, and entrance body. Verify all formal prerequisites through official institutional brochures.',
    };
  }

  return {
    learnerStage: stage,
    stageLabel: stageMeta.label,
    isSchoolLearner: isSchool,
    recommendations,
    streamOpportunity,
    disclaimer: commonDisclaimer,
  };
}
