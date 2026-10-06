import type {
  UserProfile,
  RoadmapTask,
  ResumeSourceFact,
  CareerRole,
  CareerPath,
} from '../types';
import { FABRICATED_CLAIM_PATTERNS } from './resumeAnalyzer';

export interface ComposeResumeParams {
  profile: Partial<UserProfile>;
  roadmapTasks?: RoadmapTask[];
  targetRole?: (CareerRole | CareerPath | { id?: number | string | null; title?: string; name?: string; level?: string; slug?: string }) | null;
  existingFacts?: ResumeSourceFact[];
}

export interface ComposedResumeResult {
  rawText: string;
  facts: ResumeSourceFact[];
  hasEducation: boolean;
  hasProjects: boolean;
  hasSkills: boolean;
}

/**
 * Validates that a string does not contain dummy placeholders, unknown values,
 * or raw internal database/account IDs.
 */
export function isCleanValue(val?: string | null): boolean {
  if (!val) return false;
  const trimmed = val.trim();
  if (!trimmed) return false;
  const lower = trimmed.toLowerCase();
  const placeholders = ['n/a', 'na', 'none', 'null', 'undefined', 'unknown', 'not applicable', 'unspecified'];
  if (placeholders.includes(lower)) return false;
  // Account IDs or internal UUID patterns
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed)) return false;
  if (/^(usr-|fact-|rm-|user_)[\w-]+$/i.test(trimmed)) return false;
  return true;
}

/**
 * Cleans the candidate's display name, ensuring it does not print internal account IDs.
 */
export function cleanDisplayName(name?: string, fallback: string = 'Candidate Name'): string {
  if (!name || !isCleanValue(name)) return fallback;
  return name.trim();
}

/**
 * Detects and strips ungrounded quantitative claims from candidate-supplied text
 * (e.g. "40% reduction", "10,000 users", "99.9% uptime").
 */
export function sanitizeUnsupportedMetrics(text: string): { sanitized: string; stripped: string[] } {
  let sanitized = text;
  const stripped: string[] = [];

  for (const { regex, label } of FABRICATED_CLAIM_PATTERNS) {
    if (regex.test(sanitized)) {
      sanitized = sanitized.replace(regex, (match) => {
        stripped.push(`${label}: ${match}`);
        return '';
      });
    }
  }

  // Clean up any double spaces or dangling punctuation left over from removal
  sanitized = sanitized
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([,.])/g, '$1')
    .replace(/,\s*,/g, ',')
    .trim();

  return { sanitized, stripped };
}

/**
 * Normalizes input text into a concise, professional action-led bullet:
 * Action verb -> actual work -> technology/method -> supported outcome or limitation.
 * Strips casual prefixes ("I built", "I created", "I have worked on").
 * Strictly prohibits fabricating unverified metrics or scale claims.
 */
export function formatActionLedBullet(
  task: RoadmapTask,
  roleName?: string
): string {
  const roleTag = roleName ? ` (${roleName})` : '';

  // 1. Learner provided explicit actual work facts
  if (task.actualWork && task.actualWork.whatLearnerDid?.trim()) {
    let work = task.actualWork.whatLearnerDid.trim();
    // Normalize leading personal pronouns into clean professional action verbs
    work = work
      .replace(/^(I built|I developed|I implemented|I created|I have built|I engineered)\s+/i, '')
      .replace(/^(I worked on|I designed|I wrote|I configured)\s+/i, '');

    // Capitalize first letter
    const capitalizedWork = work.charAt(0).toUpperCase() + work.slice(1);

    // Sanitize any unsupported metric claims inside work and outcome
    const { sanitized: cleanWork } = sanitizeUnsupportedMetrics(capitalizedWork);

    const tech = task.actualWork.technologiesUsed?.trim()
      ? ` using ${task.actualWork.technologiesUsed.trim()}`
      : '';

    let outcome = '';
    if (task.actualWork.outcomeOrLimitation?.trim()) {
      const { sanitized: cleanOutcome } = sanitizeUnsupportedMetrics(task.actualWork.outcomeOrLimitation.trim());
      if (cleanOutcome) {
        outcome = ` (${cleanOutcome})`;
      }
    }

    const link = task.actualWork.projectUrl?.trim()
      ? ` [Code/Demo: ${task.actualWork.projectUrl.trim()}]`
      : '';

    return `• ${task.title}${roleTag}: ${cleanWork}${tech}${outcome}${link}`;
  }

  // 2. Fallback: Self-reported milestone completion (strictly truthful educational record)
  // NEVER fabricates "Built X" or enterprise production metrics from a planned goal
  return `• ${task.title}${roleTag}: Completed hands-on curriculum implementation and exercises for ${task.deliverable || task.title}. (Self-reported learning milestone)`;
}

/**
 * Pure and deterministic composition of a recruiter-readable, ATS-friendly resume/CV
 * from verified learner profile and roadmap accomplishment facts.
 *
 * Sections:
 * 1. Name & supplied contact links.
 * 2. Short target-role summary (grounded in current stage).
 * 3. Education (only if formal institution/degree supplied; omitted for self-taught).
 * 4. Relevant skills (user-supplied only, never copied from JD).
 * 5. Projects & Accomplishments (actual work bullets from roadmap and profile).
 * 6. Experience / Additional (only if explicitly supplied).
 *
 * Empty sections and internal placeholders/IDs are omitted cleanly.
 */
export function composeStructuredResume({
  profile,
  roadmapTasks = [],
  targetRole,
  existingFacts = [],
}: ComposeResumeParams): ComposedResumeResult {
  const sections: string[] = [];
  const generatedFacts: ResumeSourceFact[] = [];
  const roleTitle = targetRole ? ('title' in targetRole ? targetRole.title : targetRole.name) : (profile.targetRoleSlug || 'Software Development');

  // -------------------------------------------------------------
  // SECTION 1: Name and Supplied Contact Links
  // -------------------------------------------------------------
  const candidateName = cleanDisplayName(profile.displayName);
  const contactLinks: string[] = [];

  if (isCleanValue(profile.contactEmail)) {
    contactLinks.push(profile.contactEmail!.trim());
  }
  if (isCleanValue(profile.githubUrl)) {
    contactLinks.push(`GitHub: ${profile.githubUrl!.trim()}`);
  }
  if (isCleanValue(profile.linkedinUrl)) {
    contactLinks.push(`LinkedIn: ${profile.linkedinUrl!.trim()}`);
  }
  if (isCleanValue(profile.portfolioUrl)) {
    contactLinks.push(`Portfolio: ${profile.portfolioUrl!.trim()}`);
  }

  const headerBlock = contactLinks.length > 0
    ? `${candidateName.toUpperCase()}\n${contactLinks.join(' | ')}`
    : candidateName.toUpperCase();
  sections.push(headerBlock);

  // -------------------------------------------------------------
  // SECTION 2: Short Target-Role Summary
  // -------------------------------------------------------------
  if (roleTitle) {
    let stageContext = 'Motivated learner';
    if (profile.learnerStage === 'undergraduate') {
      stageContext = `${isCleanValue(profile.degree) ? profile.degree!.trim() : 'Undergraduate'} student`;
    } else if (profile.learnerStage === 'postgraduate') {
      stageContext = `${isCleanValue(profile.degree) ? profile.degree!.trim() : 'Postgraduate'} student`;
    } else if (profile.learnerStage === 'class_10' || profile.learnerStage === 'class_11_12') {
      stageContext = 'Foundational school student';
    } else if (profile.learnerStage === 'self_taught') {
      stageContext = 'Independent software developer';
    } else if (profile.learnerStage === 'recent_graduate') {
      stageContext = 'Recent graduate';
    }

    const cleanSkills = (profile.currentSkills || []).filter(s => isCleanValue(s));
    const skillsBrief = cleanSkills.length > 0
      ? ` with hands-on practice in ${cleanSkills.slice(0, 4).join(', ')}`
      : '';

    const summaryText = `${stageContext} focused on entry-level ${roleTitle} opportunities${skillsBrief}. Grounded in hands-on technical deliverables, verifiable code repositories, and continuous skill evaluation.`;

    sections.push(`PROFESSIONAL SUMMARY\n${summaryText}`);
  }

  // -------------------------------------------------------------
  // SECTION 3: Education (Omitted completely for self-taught or when empty)
  // -------------------------------------------------------------
  const isSelfTaught = profile.learnerStage === 'self_taught';
  const hasInstitution = isCleanValue(profile.institution);
  const hasDegree = isCleanValue(profile.degree);
  const hasBranch = isCleanValue(profile.branch);
  const hasFormalEdu = !isSelfTaught && (hasInstitution || hasDegree || hasBranch);

  if (hasFormalEdu) {
    const eduLines: string[] = ['EDUCATION'];
    if (hasInstitution) {
      eduLines.push(profile.institution!.trim());
    }

    const degreeParts = [
      hasDegree ? profile.degree!.trim() : '',
      hasBranch ? `in ${profile.branch!.trim()}` : '',
      isCleanValue(profile.specialization) ? `(${profile.specialization!.trim()})` : '',
    ].filter(Boolean);

    if (degreeParts.length > 0) {
      eduLines.push(degreeParts.join(' '));
    }

    const dateParts = [
      isCleanValue(profile.studyYear) ? `Status: ${profile.studyYear!.trim()}` : '',
      isCleanValue(profile.expectedGraduationYear) ? `Expected Graduation: ${profile.expectedGraduationYear!.trim()}` : '',
    ].filter(Boolean);

    if (dateParts.length > 0) {
      eduLines.push(dateParts.join(' · '));
    }

    sections.push(eduLines.join('\n'));

    generatedFacts.push({
      id: 'fact-profile-education',
      category: 'education',
      text: eduLines.slice(1).join(' '),
      claim: 'Academic background & institutional context',
      evidenceSnippet: eduLines.slice(1).join(' · '),
      verified: true,
      source: 'profile',
    });
  }

  // -------------------------------------------------------------
  // SECTION 4: Relevant Technical Skills (User-supplied only)
  // -------------------------------------------------------------
  const validSkills = (profile.currentSkills || []).filter(s => isCleanValue(s));
  const hasSkills = validSkills.length > 0;
  if (hasSkills) {
    const skillList = validSkills.join(', ');
    sections.push(`TECHNICAL SKILLS\nCore Competencies: ${skillList}`);

    generatedFacts.push({
      id: 'fact-profile-skills',
      category: 'skill',
      text: skillList,
      claim: 'Self-reported technical competencies',
      evidenceSnippet: skillList,
      verified: false,
      source: 'profile',
    });
  }

  // -------------------------------------------------------------
  // SECTION 5: Projects & Practical Accomplishments
  // -------------------------------------------------------------
  const projectBullets: string[] = [];

  // A. Completed roadmap tasks
  const completedTasks = roadmapTasks.filter(t => t.status === 'completed');
  completedTasks.forEach(task => {
    const bullet = formatActionLedBullet(task, roleTitle);
    projectBullets.push(bullet);

    // Also register fact
    const factId = `fact-rm-${task.parentTaskId || task.templateId || task.id}`;
    const existing = existingFacts.find(f => f.id === factId);
    if (existing) {
      generatedFacts.push(existing);
    } else {
      generatedFacts.push({
        id: factId,
        category: 'project',
        text: bullet.replace(/^•\s*/, ''),
        claim: `Completed milestone: ${task.title}`,
        deliverable: task.title,
        evidenceSnippet: task.deliverable,
        verified: true,
        source: 'roadmap',
        actualWork: task.actualWork,
        sourceStatus: 'self_reported',
        inclusionStatus: 'included',
      });
    }
  });

  // B. User-supplied profile project facts
  if (profile.projectFacts && profile.projectFacts.trim()) {
    const customProjectLines = profile.projectFacts
      .split('\n')
      .map(l => l.trim())
      .filter(l => isCleanValue(l));

    customProjectLines.forEach(line => {
      const { sanitized: cleanLine } = sanitizeUnsupportedMetrics(line);
      if (cleanLine) {
        const bullet = cleanLine.startsWith('•') ? cleanLine : `• ${cleanLine}`;
        projectBullets.push(bullet);
      }
    });

    generatedFacts.push({
      id: 'fact-profile-projects',
      category: 'project',
      text: profile.projectFacts.trim(),
      claim: 'Verified technical project facts from profile',
      evidenceSnippet: profile.projectFacts.trim(),
      verified: true,
      source: 'profile',
    });
  }

  const hasProjects = projectBullets.length > 0;
  if (hasProjects) {
    sections.push(`PROJECTS & PRACTICAL ACCOMPLISHMENTS\n${projectBullets.join('\n')}`);
  }

  // -------------------------------------------------------------
  // SECTION 6: Experience & Additional (Only if supplied)
  // -------------------------------------------------------------
  const experienceFacts = existingFacts.filter(f => f.category === 'experience' && f.source !== 'profile');
  if (experienceFacts.length > 0) {
    const expBullets = experienceFacts.map(f => (f.text.startsWith('•') ? f.text : `• ${f.text}`));
    sections.push(`EXPERIENCE & VERIFIED CERTIFICATIONS\n${expBullets.join('\n')}`);
    generatedFacts.push(...experienceFacts);
  }

  const rawText = sections.join('\n\n');

  return {
    rawText,
    facts: generatedFacts,
    hasEducation: hasFormalEdu,
    hasProjects,
    hasSkills,
  };
}

/**
 * Regenerates the resume draft while protecting any custom/imported text sections
 * that were manually edited by the candidate.
 */
export function regenerateResumePreservingManualEdits(params: {
  existingRawText: string;
  inputs: ComposeResumeParams;
  mode?: 'overwrite' | 'merge_accomplishments';
}): string {
  const fresh = composeStructuredResume(params.inputs).rawText;

  // If draft is empty or mode is explicitly overwrite, return fresh composition directly
  if (!params.existingRawText?.trim() || params.mode === 'overwrite') {
    return fresh;
  }

  // If candidate chose to merge accomplishments while keeping manual text:
  // Extract new project bullets from fresh that are missing from existing text
  const freshBullets = fresh
    .split('\n')
    .filter(line => line.startsWith('• '));

  const missingBullets = freshBullets.filter(b => !params.existingRawText.includes(b));

  if (missingBullets.length > 0) {
    // If PROJECTS & PRACTICAL ACCOMPLISHMENTS section exists, insert bullets under it
    if (params.existingRawText.includes('PROJECTS & PRACTICAL ACCOMPLISHMENTS')) {
      return params.existingRawText.replace(
        'PROJECTS & PRACTICAL ACCOMPLISHMENTS',
        `PROJECTS & PRACTICAL ACCOMPLISHMENTS\n${missingBullets.join('\n')}`
      );
    }
    // Otherwise append section to bottom of existing draft
    return `${params.existingRawText.trim()}\n\nPROJECTS & PRACTICAL ACCOMPLISHMENTS\n${missingBullets.join('\n')}`;
  }

  return params.existingRawText;
}
