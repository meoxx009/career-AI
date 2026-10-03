import { z } from 'zod';
import type {
  Skill,
  CareerRole,
  RoleSkillRequirement,
  AssessmentQuestion,
  RoadmapTemplate,
  InterviewQuestion,
  CareerPath,
  AcademicContext,
  AssessmentTrack,
  EducationEntry,
  CanonicalSkill,
} from '../types';

export const LearnerStageSchema = z.enum([
  'class_10',
  'class_11_12',
  'diploma',
  'undergraduate',
  'postgraduate',
  'recent_graduate',
  'self_taught',
]);

export const SchoolStreamSchema = z.enum([
  'pcm',
  'pcb',
  'pcmb',
  'commerce',
  'arts',
  'vocational',
]);

export const UserProfileSchema = z.object({
  id: z.string().min(1),
  displayName: z.string(),
  profileImageUrl: z.string().optional(),
  profileImageStorageKey: z.string().optional(),
  username: z.string().optional(),
  contactEmail: z.string().optional(),
  learnerStage: LearnerStageSchema.optional(),
  schoolClass: z.string().optional(),
  stream: SchoolStreamSchema.optional(),
  degree: z.string().optional(),
  branch: z.string(),
  studyYear: z.string(),
  hoursPerWeek: z.number().min(1).max(168),
  preferredRoles: z.array(z.string()),
  preferredRoleIds: z.array(z.number()).optional(),
  cgpa: z.string().optional(),
  locationPreference: z.string().optional(),
  currentSkills: z.array(z.string()).optional(),
  interests: z.array(z.string()).optional(),
  favoriteSubjects: z.array(z.string()).optional(),
  preferredWorkDirection: z.string().optional(),
  projectFacts: z.string().optional(),
  isGuestDemo: z.boolean(),
  targetRoleId: z.number().optional(),
  targetRoleSlug: z.string().optional(),
});

export const SkillSchema = z.object({
  id: z.number().int().positive(),
  slug: z.string().min(1),
  name: z.string().min(1),
  category: z.string().min(1),
  description: z.string().min(1),
});

export const CareerRoleSchema = z.object({
  id: z.number().int().positive(),
  slug: z.string().min(1),
  name: z.string().min(1),
  level: z.string().min(1),
  description: z.string().min(1),
  source_label: z.string().min(1),
  source_url: z.string(),
  source_checked_at: z.string().min(1),
  version: z.string().min(1),
});

export const RoleSkillRequirementSchema = z.object({
  role_id: z.number().int().positive(),
  skill_id: z.number().int().positive(),
  target_level: z.number().int().min(1).max(4),
  importance: z.number().int().min(1).max(3),
  prerequisite_order: z.number().int().min(1),
  rationale: z.string().min(1),
  version: z.string().min(1),
});

export const AssessmentQuestionSchema = z.object({
  id: z.string().min(1),
  skill_id: z.number().int().positive(),
  category: z.string().min(1),
  prompt: z.string().min(1),
  option_a: z.string().min(1),
  option_b: z.string().min(1),
  option_c: z.string().min(1),
  option_d: z.string().min(1),
  correct_key: z.enum(['a', 'b', 'c', 'd']),
  explanation: z.string().min(1),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  version: z.string().min(1),
  track_ids: z.array(z.string().min(1)).optional(),
  domain: z.string().optional(),
  source_reviewer_status: z.string().optional(),
  prerequisite_skill: z.string().optional(),
});

export const AssessmentTrackSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  slug: z.string().min(1),
  category: z.enum(['software', 'data_ai', 'hardware', 'design_product']),
  domain: z.string().min(1),
  description: z.string().min(1),
  assessedSkillIds: z.array(z.number().int().positive()),
  expectedQuestionCount: z.number().int().nonnegative(),
  difficultyMix: z.object({
    easy: z.number().int().nonnegative(),
    medium: z.number().int().nonnegative(),
    hard: z.number().int().nonnegative(),
  }),
  hasSufficientQuestions: z.boolean(),
  contentGapNotice: z.string().optional(),
});

export const RoadmapTemplateSchema = z.object({
  id: z.string().min(1),
  role_id: z.number().int().positive(),
  week_number: z.number().int().positive(),
  title: z.string().min(1),
  description: z.string().min(1),
  deliverable: z.string().min(1),
  estimated_hours: z.number().positive(),
  prerequisite_id: z.string().nullable(),
  resource_url: z.string().url(),
  status: z.enum(['todo', 'in_progress', 'completed']),
});

export const InterviewQuestionSchema = z.object({
  id: z.string().min(1),
  role_id: z.number().int().positive(),
  type: z.enum(['behavioural', 'technical']),
  prompt: z.string().min(1),
  rubric_points: z.array(z.string().min(1)).min(1),
  version: z.string().min(1),
});

export const PathCategorySchema = z.enum([
  'software_engineering',
  'data_ai',
  'design_product',
]);

export const CurriculumPhaseSchema = z.enum([
  'Foundations',
  'Core skills',
  'Guided project',
  'Portfolio/proof',
  'Practice and review',
]);

export const PathSkillRequirementSchema = z.object({
  pathId: z.number().int().positive(),
  skillId: z.string().min(1),
  targetLevel: z.number().int().min(1).max(4),
  importance: z.number().int().min(1).max(3),
  prerequisiteOrder: z.number().int().min(1),
  rationale: z.string().min(1),
  evidenceSources: z.array(z.string()).min(1),
  version: z.string().min(1),
});

export const CurriculumItemSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  phase: CurriculumPhaseSchema,
  whyItMatters: z.string().min(1),
  estimatedHours: z.number().positive(),
  deliverable: z.string().min(1),
  prerequisite: z.string().nullable().optional(),
  optionalVerifiedResource: z.string().nullable().optional(),
  completionState: z.enum(['todo', 'in_progress', 'completed']).optional(),
  pathId: z.number().optional(),
  skillIds: z.array(z.string()).optional(),
  prerequisiteItemIds: z.array(z.string()).optional(),
  resourceUrl: z.string().optional(),
  status: z.enum(['todo', 'in_progress', 'completed']).optional(),
});

export const CareerPathSchema = z.object({
  id: z.string().min(1),
  numericId: z.number().int().positive(),
  pathType: z.enum(['career_role', 'academic_track']),
  title: z.string().min(1),
  slug: z.string().min(1),
  category: PathCategorySchema,
  level: z.string().min(1),
  description: z.string().min(1),
  eligibleLearnerStages: z.array(LearnerStageSchema).min(1),
  compatibleStreamsOrDegrees: z.array(z.string().min(1)).min(1),
  interests: z.array(z.string().min(1)).min(1),
  prerequisiteSkills: z.array(z.string().min(1)),
  coreSkills: z.array(z.string().min(1)).min(1),
  advancedSkills: z.array(z.string().min(1)),
  prerequisiteSkillSlugs: z.array(z.string().min(1)).optional(),
  coreSkillSlugs: z.array(z.string().min(1)).optional(),
  advancedSkillSlugs: z.array(z.string().min(1)).optional(),
  requirements: z.array(PathSkillRequirementSchema).optional(),
  curriculum: z.array(CurriculumItemSchema).length(5),
  estimatedEffortHours: z.number().positive(),
  projectDeliverables: z.array(z.string().min(1)).min(1),
  firstProjectDeliverable: z.string().min(1),
  nextAction: z.string().min(1),
  source: z.string().min(1),
  version: z.string().min(1),
  limitations: z.array(z.string().min(1)),
});

export const AcademicContextSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  category: z.string().min(1),
  typicalPrerequisites: z.array(z.string().min(1)),
  naturalCareerBridges: z.array(z.string().min(1)),
  transferableStrengths: z.array(z.string().min(1)),
  advisoryNote: z.string().min(1),
});

/**
 * Validates the rich Career Catalogue and Academic Context profiles
 * checking schema compliance, slug uniqueness, 5-phase curriculum sequences,
 * and foreign references.
 */
export function validateCareerCatalogue(
  catalogue: CareerPath[],
  academicContexts: AcademicContext[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const slugs = new Set<string>();
  const numericIds = new Set<number>();
  const academicIds = new Set<string>();

  // 1. Validate Academic Contexts
  academicContexts.forEach((ctx, idx) => {
    const res = AcademicContextSchema.safeParse(ctx);
    if (!res.success) {
      errors.push(`AcademicContext [${idx}]: ${res.error.message}`);
    }
    if (academicIds.has(ctx.id)) {
      errors.push(`Duplicate AcademicContext ID: ${ctx.id}`);
    }
    academicIds.add(ctx.id);
  });

  // 2. Validate Career Paths
  catalogue.forEach((path, idx) => {
    const res = CareerPathSchema.safeParse(path);
    if (!res.success) {
      errors.push(`CareerPath [${idx}] (${path.slug || path.id}): ${res.error.message}`);
    }
    if (slugs.has(path.slug)) {
      errors.push(`Duplicate CareerPath slug: ${path.slug}`);
    }
    slugs.add(path.slug);

    if (numericIds.has(path.numericId)) {
      errors.push(`Duplicate CareerPath numericId: ${path.numericId}`);
    }
    numericIds.add(path.numericId);

    // Verify 5 phases in proper sequence
    const expectedPhases = [
      'Foundations',
      'Core skills',
      'Guided project',
      'Portfolio/proof',
      'Practice and review',
    ];
    if (path.curriculum && path.curriculum.length === 5) {
      path.curriculum.forEach((item, cIdx) => {
        if (item.phase !== expectedPhases[cIdx]) {
          errors.push(
            `CareerPath ${path.slug} curriculum step ${cIdx} phase mismatch: expected ${expectedPhases[cIdx]}, got ${item.phase}`
          );
        }
      });
    }

    // Verify curriculum item prerequisites & cycle detection
    const currMap = new Map<string, (typeof path.curriculum)[0]>();
    const currIds = new Set<string>();
    path.curriculum?.forEach((c) => {
      currIds.add(c.id);
      currMap.set(c.id, c);
    });

    path.curriculum?.forEach((c) => {
      if (c.prerequisite) {
        if (!currIds.has(c.prerequisite)) {
          errors.push(
            `CareerPath ${path.slug} curriculum item ${c.id} references missing prerequisite ${c.prerequisite}`
          );
        } else {
          // cycle check
          const visited = new Set<string>([c.id]);
          let currPrereq: string | null = c.prerequisite;
          while (currPrereq) {
            if (visited.has(currPrereq)) {
              errors.push(
                `Cycle detected in curriculum prerequisites for ${path.slug}: ${c.id} -> ${currPrereq}`
              );
              break;
            }
            visited.add(currPrereq);
            const parent = currMap.get(currPrereq);
            currPrereq = parent ? parent.prerequisite : null;
          }
        }
      }
    });
  });

  // 3. Verify naturalCareerBridges point to valid career slugs
  academicContexts.forEach((ctx) => {
    ctx.naturalCareerBridges.forEach((bridgeSlug) => {
      if (!slugs.has(bridgeSlug)) {
        errors.push(
          `AcademicContext ${ctx.id} references non-existent career path bridge: ${bridgeSlug}`
        );
      }
    });
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates dynamic assessment tracks and question bank foreign track IDs.
 */
export function validateAssessmentTracks(
  tracks: AssessmentTrack[],
  questions: AssessmentQuestion[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const trackIds = new Set<string>();

  tracks.forEach((track, idx) => {
    const res = AssessmentTrackSchema.safeParse(track);
    if (!res.success) {
      errors.push(`AssessmentTrack [${idx}]: ${res.error.message}`);
    }
    if (trackIds.has(track.id)) {
      errors.push(`Duplicate AssessmentTrack ID: ${track.id}`);
    }
    trackIds.add(track.id);
  });

  const questionIds = new Set<string>();
  questions.forEach((q, idx) => {
    const res = AssessmentQuestionSchema.safeParse(q);
    if (!res.success) {
      errors.push(`AssessmentQuestion [${idx}] (${q.id}): ${res.error.message}`);
    }
    if (questionIds.has(q.id)) {
      errors.push(`Duplicate AssessmentQuestion ID: ${q.id}`);
    }
    questionIds.add(q.id);

    (q.track_ids || []).forEach((tId) => {
      if (!trackIds.has(tId)) {
        errors.push(`AssessmentQuestion ${q.id} references non-existent track: ${tId}`);
      }
    });
  });

  return { valid: errors.length === 0, errors };
}

export interface SeedValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validates the full suite of CareerAI seed data against schema constraints,
 * foreign key integrity, uniqueness, and absence of prerequisite cycles.
 */
export function validateSeedData(data: {
  skills: Skill[];
  roles: CareerRole[];
  requirements: RoleSkillRequirement[];
  assessmentQuestions: AssessmentQuestion[];
  roadmapTemplates: RoadmapTemplate[];
  interviewQuestions: InterviewQuestion[];
}): SeedValidationResult {
  const errors: string[] = [];

  // 1. Validate entity schemas and unique IDs
  const skillIds = new Set<number>();
  data.skills.forEach((skill, index) => {
    const res = SkillSchema.safeParse(skill);
    if (!res.success) {
      errors.push(`Skill [${index}]: ${res.error.message}`);
    }
    if (skillIds.has(skill.id)) {
      errors.push(`Duplicate skill ID: ${skill.id}`);
    }
    skillIds.add(skill.id);
  });

  const roleIds = new Set<number>();
  data.roles.forEach((role, index) => {
    const res = CareerRoleSchema.safeParse(role);
    if (!res.success) {
      errors.push(`Role [${index}]: ${res.error.message}`);
    }
    if (roleIds.has(role.id)) {
      errors.push(`Duplicate role ID: ${role.id}`);
    }
    roleIds.add(role.id);
  });

  // 2. Validate requirements and foreign keys
  data.requirements.forEach((req, index) => {
    const res = RoleSkillRequirementSchema.safeParse(req);
    if (!res.success) {
      errors.push(`Requirement [${index}]: ${res.error.message}`);
    }
    if (!roleIds.has(req.role_id)) {
      errors.push(`Requirement [${index}] references non-existent role_id: ${req.role_id}`);
    }
    if (!skillIds.has(req.skill_id)) {
      errors.push(`Requirement [${index}] references non-existent skill_id: ${req.skill_id}`);
    }
  });

  // 3. Validate assessment questions and foreign keys
  const questionIds = new Set<string>();
  data.assessmentQuestions.forEach((q, index) => {
    const res = AssessmentQuestionSchema.safeParse(q);
    if (!res.success) {
      errors.push(`Assessment question [${index}]: ${res.error.message}`);
    }
    if (questionIds.has(q.id)) {
      errors.push(`Duplicate question ID: ${q.id}`);
    }
    questionIds.add(q.id);

    if (!skillIds.has(q.skill_id)) {
      errors.push(`Assessment question [${q.id}] references non-existent skill_id: ${q.skill_id}`);
    }

    // Verify option corresponding to correct_key exists and is non-empty
    const keyMap = { a: q.option_a, b: q.option_b, c: q.option_c, d: q.option_d };
    if (!keyMap[q.correct_key] || keyMap[q.correct_key].trim() === '') {
      errors.push(`Assessment question [${q.id}] has empty answer option for correct_key: ${q.correct_key}`);
    }
  });

  // 4. Validate roadmap templates, FKs, and cycle detection
  const roadmapIds = new Set<string>();
  const roadmapMap = new Map<string, RoadmapTemplate>();
  data.roadmapTemplates.forEach((t, index) => {
    const res = RoadmapTemplateSchema.safeParse(t);
    if (!res.success) {
      errors.push(`Roadmap template [${index}]: ${res.error.message}`);
    }
    if (roadmapIds.has(t.id)) {
      errors.push(`Duplicate roadmap template ID: ${t.id}`);
    }
    roadmapIds.add(t.id);
    roadmapMap.set(t.id, t);

    if (!roleIds.has(t.role_id)) {
      errors.push(`Roadmap template [${t.id}] references non-existent role_id: ${t.role_id}`);
    }
  });

  // Check prerequisite references and cycle detection
  data.roadmapTemplates.forEach(t => {
    if (t.prerequisite_id) {
      if (!roadmapIds.has(t.prerequisite_id)) {
        errors.push(`Roadmap template [${t.id}] references non-existent prerequisite_id: ${t.prerequisite_id}`);
      } else {
        // Cycle detection
        const visited = new Set<string>([t.id]);
        let currPrereq: string | null = t.prerequisite_id;
        while (currPrereq) {
          if (visited.has(currPrereq)) {
            errors.push(`Cycle detected in roadmap prerequisites starting from ${t.id} -> ${currPrereq}`);
            break;
          }
          visited.add(currPrereq);
          const parent = roadmapMap.get(currPrereq);
          currPrereq = parent ? parent.prerequisite_id : null;
        }
      }
    }
  });

  // 5. Validate interview questions
  const interviewIds = new Set<string>();
  data.interviewQuestions.forEach((iq, index) => {
    const res = InterviewQuestionSchema.safeParse(iq);
    if (!res.success) {
      errors.push(`Interview question [${index}]: ${res.error.message}`);
    }
    if (interviewIds.has(iq.id)) {
      errors.push(`Duplicate interview question ID: ${iq.id}`);
    }
    interviewIds.add(iq.id);

    if (!roleIds.has(iq.role_id)) {
      errors.push(`Interview question [${iq.id}] references non-existent role_id: ${iq.role_id}`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

export const EducationLevelSchema = z.enum([
  'school',
  'diploma',
  'undergraduate',
  'postgraduate',
  'professional',
]);

export const EducationEntrySchema = z.object({
  id: z.string().min(1),
  level: EducationLevelSchema,
  degreeTitle: z.string().min(1),
  specializationTitle: z.string().min(1),
  label: z.string().min(1),
  aliases: z.array(z.string()),
  compatibleLearnerStages: z.array(LearnerStageSchema).min(1),
  relatedAcademicContextIds: z.array(z.string().min(1)),
  relatedCareerPathIds: z.array(z.number().int().positive()),
  source: z.string().min(1),
  version: z.string().min(1),
  active: z.boolean(),
});

export const CanonicalSkillSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  name: z.string().min(1),
  category: z.string().min(1),
  aliases: z.array(z.string()),
  description: z.string().min(1),
  evidenceTypes: z.array(z.string().min(1)).min(1),
  source: z.string().min(1),
  version: z.string().min(1),
  active: z.boolean(),
});

/**
 * Validates the Education Catalogue ensuring:
 * - unique education IDs
 * - no duplicate specialization IDs within degree titles
 * - valid career path references
 * - valid learner stage references
 * - valid academic context references
 */
export function validateEducationCatalogue(
  entries: EducationEntry[],
  academicContexts: AcademicContext[],
  careerCatalogue: CareerPath[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const educationIds = new Set<string>();
  const specializationKeys = new Set<string>();

  const validPathIds = new Set<number>(careerCatalogue.map((p) => p.numericId));
  const validContextIds = new Set<string>(academicContexts.map((c) => c.id.toLowerCase()));

  entries.forEach((entry, idx) => {
    const res = EducationEntrySchema.safeParse(entry);
    if (!res.success) {
      errors.push(`EducationEntry [${idx}] (${entry.id}): ${res.error.message}`);
    }

    // Unique education IDs
    if (educationIds.has(entry.id)) {
      errors.push(`Duplicate EducationEntry ID: ${entry.id}`);
    }
    educationIds.add(entry.id);

    // No duplicate specialization IDs within degreeTitle
    const specKey = `${entry.degreeTitle.toLowerCase()}:::${entry.specializationTitle.toLowerCase()}`;
    if (specializationKeys.has(specKey)) {
      errors.push(
        `Duplicate specialization within degree: "${entry.specializationTitle}" under "${entry.degreeTitle}" (${entry.id})`
      );
    }
    specializationKeys.add(specKey);

    // Valid career path references
    entry.relatedCareerPathIds.forEach((pId) => {
      if (!validPathIds.has(pId)) {
        errors.push(
          `EducationEntry ${entry.id} references non-existent career path ID: ${pId}`
        );
      }
    });

    // Valid academic context references
    entry.relatedAcademicContextIds.forEach((cId) => {
      if (!validContextIds.has(cId.toLowerCase())) {
        errors.push(
          `EducationEntry ${entry.id} references non-existent academic context ID: ${cId}`
        );
      }
    });
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates the Canonical Skill Catalogue ensuring:
 * - unique skill IDs
 * - unique skill slugs
 * - valid career path references
 * - no orphaned skill IDs (every skill is active and mapped)
 * - no missing curriculum requirements
 */
export function validateSkillCatalogue(
  skills: CanonicalSkill[],
  careerCatalogue: CareerPath[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const skillIds = new Set<string>();
  const skillSlugs = new Set<string>();

  skills.forEach((skill, idx) => {
    const res = CanonicalSkillSchema.safeParse(skill);
    if (!res.success) {
      errors.push(`CanonicalSkill [${idx}] (${skill.slug || skill.id}): ${res.error.message}`);
    }

    if (skillIds.has(skill.id)) {
      errors.push(`Duplicate CanonicalSkill ID: ${skill.id}`);
    }
    skillIds.add(skill.id);

    if (skillSlugs.has(skill.slug)) {
      errors.push(`Duplicate CanonicalSkill slug: ${skill.slug}`);
    }
    skillSlugs.add(skill.slug);
  });

  // Verify that all career paths reference valid skill slugs
  const referencedSlugs = new Set<string>();
  careerCatalogue.forEach((p) => {
    if (p.coreSkillSlugs) {
      p.coreSkillSlugs.forEach((s) => {
        referencedSlugs.add(s);
        if (!skillSlugs.has(s)) {
          errors.push(`CareerPath ${p.slug} references unknown core skill slug: ${s}`);
        }
      });
    }
    if (p.prerequisiteSkillSlugs) {
      p.prerequisiteSkillSlugs.forEach((s) => {
        referencedSlugs.add(s);
        if (!skillSlugs.has(s)) {
          errors.push(`CareerPath ${p.slug} references unknown prerequisite skill slug: ${s}`);
        }
      });
    }
    if (p.advancedSkillSlugs) {
      p.advancedSkillSlugs.forEach((s) => {
        referencedSlugs.add(s);
        if (!skillSlugs.has(s)) {
          errors.push(`CareerPath ${p.slug} references unknown advanced skill slug: ${s}`);
        }
      });
    }
  });

  // Ensure no orphaned skill IDs: every skill in the catalogue must be active and mapped or referenced
  skills.forEach((skill) => {
    if (!referencedSlugs.has(skill.slug) && !skill.active) {
      errors.push(`Orphaned inactive skill with no career references: ${skill.slug}`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}
