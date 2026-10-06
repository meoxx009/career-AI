import type { UserProfile, ResumeDocument } from '../types';

/**
 * Pure and deterministic synchronization of verified learner profile fields
 * into grounded resume facts, ensuring zero hallucinations and preserving existing
 * verified roadmap milestones.
 */
export function syncProfileFactsToResume(prof: UserProfile, currentResume: ResumeDocument): ResumeDocument {
  let facts = [...(currentResume.facts || [])];
  // Remove prior profile-derived facts while preserving roadmap and other facts
  facts = facts.filter(f => !f.id.startsWith('fact-profile-'));

  if (prof.projectFacts && prof.projectFacts.trim()) {
    facts.push({
      id: 'fact-profile-projects',
      category: 'project',
      text: prof.projectFacts.trim(),
      claim: 'Verified technical project facts from profile',
      evidenceSnippet: prof.projectFacts.trim(),
      verified: true,
      source: 'profile',
    });
  }

  if (prof.degree || prof.branch || prof.institution) {
    const eduParts = [
      prof.degree,
      prof.branch ? `in ${prof.branch}` : '',
      prof.institution ? `at ${prof.institution}` : '',
      prof.studyYear ? `(${prof.studyYear})` : '',
      prof.expectedGraduationYear ? `Expected graduation: ${prof.expectedGraduationYear}` : '',
    ].filter(Boolean);
    const eduText = eduParts.join(' ');
    if (eduText.trim()) {
      facts.push({
        id: 'fact-profile-education',
        category: 'education',
        text: eduText.trim(),
        claim: 'Academic background & institutional context',
        evidenceSnippet: eduText.trim(),
        verified: true,
        source: 'profile',
      });
    }
  }

  if (prof.currentSkills && prof.currentSkills.length > 0) {
    const skillsText = prof.currentSkills.join(', ');
    facts.push({
      id: 'fact-profile-skills',
      category: 'skill',
      text: skillsText,
      claim: 'Self-reported technical competencies',
      evidenceSnippet: skillsText,
      verified: false,
      source: 'profile',
    });
  }

  if (prof.portfolioUrl || prof.githubUrl || prof.linkedinUrl) {
    const links = [prof.portfolioUrl, prof.githubUrl, prof.linkedinUrl].filter(Boolean).join(' | ');
    facts.push({
      id: 'fact-profile-links',
      category: 'experience',
      text: links,
      claim: 'Professional links & public portfolios',
      evidenceSnippet: links,
      verified: true,
      source: 'profile',
    });
  }

  return {
    ...currentResume,
    facts,
  };
}
