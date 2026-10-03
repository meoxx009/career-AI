import { describe, it, expect } from 'vitest';
import { validateSeedData, validateEducationCatalogue, validateSkillCatalogue } from './validator';
import {
  SEED_SKILLS,
  SEED_ROLES,
  SEED_ROLE_SKILL_REQUIREMENTS,
  SEED_ASSESSMENT_QUESTIONS,
  SEED_ROADMAP_TEMPLATES,
  SEED_INTERVIEW_QUESTIONS,
} from './seedData';
import { EDUCATION_CATALOGUE } from './educationCatalogue';
import { SKILLS_CATALOGUE } from './skillCatalogue';
import { CAREER_CATALOGUE, ACADEMIC_CONTEXTS } from './careerCatalogue';

describe('Seed Data Validator', () => {
  it('passes cleanly for the canonical seed dataset', () => {
    const result = validateSeedData({
      skills: SEED_SKILLS,
      roles: SEED_ROLES,
      requirements: SEED_ROLE_SKILL_REQUIREMENTS,
      assessmentQuestions: SEED_ASSESSMENT_QUESTIONS,
      roadmapTemplates: SEED_ROADMAP_TEMPLATES,
      interviewQuestions: SEED_INTERVIEW_QUESTIONS,
    });

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('detects duplicate skill IDs', () => {
    const corruptedSkills = [
      ...SEED_SKILLS,
      { ...SEED_SKILLS[0], name: 'Duplicate Skill' },
    ];

    const result = validateSeedData({
      skills: corruptedSkills,
      roles: SEED_ROLES,
      requirements: SEED_ROLE_SKILL_REQUIREMENTS,
      assessmentQuestions: SEED_ASSESSMENT_QUESTIONS,
      roadmapTemplates: SEED_ROADMAP_TEMPLATES,
      interviewQuestions: SEED_INTERVIEW_QUESTIONS,
    });

    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('Duplicate skill ID: 1'))).toBe(true);
  });

  it('detects invalid target level (< 1 or > 4)', () => {
    const corruptedReqs = [
      ...SEED_ROLE_SKILL_REQUIREMENTS.slice(1),
      { ...SEED_ROLE_SKILL_REQUIREMENTS[0], target_level: 5 },
    ];

    const result = validateSeedData({
      skills: SEED_SKILLS,
      roles: SEED_ROLES,
      requirements: corruptedReqs,
      assessmentQuestions: SEED_ASSESSMENT_QUESTIONS,
      roadmapTemplates: SEED_ROADMAP_TEMPLATES,
      interviewQuestions: SEED_INTERVIEW_QUESTIONS,
    });

    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('Requirement'))).toBe(true);
  });

  it('detects non-existent foreign reference role_id', () => {
    const corruptedReqs = [
      ...SEED_ROLE_SKILL_REQUIREMENTS.slice(1),
      { ...SEED_ROLE_SKILL_REQUIREMENTS[0], role_id: 999 },
    ];

    const result = validateSeedData({
      skills: SEED_SKILLS,
      roles: SEED_ROLES,
      requirements: corruptedReqs,
      assessmentQuestions: SEED_ASSESSMENT_QUESTIONS,
      roadmapTemplates: SEED_ROADMAP_TEMPLATES,
      interviewQuestions: SEED_INTERVIEW_QUESTIONS,
    });

    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('non-existent role_id: 999'))).toBe(true);
  });

  it('detects prerequisite cycles in roadmap templates', () => {
    const cyclicTemplates = SEED_ROADMAP_TEMPLATES.map(t => {
      if (t.id === 'rb01') {
        return { ...t, prerequisite_id: 'rb02' }; // rb01 -> rb02 -> rb01
      }
      return t;
    });

    const result = validateSeedData({
      skills: SEED_SKILLS,
      roles: SEED_ROLES,
      requirements: SEED_ROLE_SKILL_REQUIREMENTS,
      assessmentQuestions: SEED_ASSESSMENT_QUESTIONS,
      roadmapTemplates: cyclicTemplates,
      interviewQuestions: SEED_INTERVIEW_QUESTIONS,
    });

    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('Cycle detected'))).toBe(true);
  });

  it('detects invalid answer options in assessment questions', () => {
    const corruptedQuestions = [
      ...SEED_ASSESSMENT_QUESTIONS.slice(1),
      { ...SEED_ASSESSMENT_QUESTIONS[0], option_a: '' },
    ];

    const result = validateSeedData({
      skills: SEED_SKILLS,
      roles: SEED_ROLES,
      requirements: SEED_ROLE_SKILL_REQUIREMENTS,
      assessmentQuestions: corruptedQuestions,
      roadmapTemplates: SEED_ROADMAP_TEMPLATES,
      interviewQuestions: SEED_INTERVIEW_QUESTIONS,
    });

    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('empty answer option'))).toBe(true);
  });
});

describe('Education Catalogue Validator (Prompt 4)', () => {
  it('passes cleanly for the canonical education catalogue', () => {
    const result = validateEducationCatalogue(
      EDUCATION_CATALOGUE,
      ACADEMIC_CONTEXTS,
      CAREER_CATALOGUE
    );

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(EDUCATION_CATALOGUE.length).toBeGreaterThanOrEqual(50);
  });

  it('detects duplicate education entry IDs', () => {
    const corrupted = [
      ...EDUCATION_CATALOGUE,
      { ...EDUCATION_CATALOGUE[0], specializationTitle: 'Different Spec' },
    ];

    const result = validateEducationCatalogue(
      corrupted,
      ACADEMIC_CONTEXTS,
      CAREER_CATALOGUE
    );

    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes(`Duplicate EducationEntry ID: ${EDUCATION_CATALOGUE[0].id}`))).toBe(true);
  });

  it('detects duplicate specialization under the same degree title', () => {
    const corrupted = [
      ...EDUCATION_CATALOGUE,
      {
        ...EDUCATION_CATALOGUE[0],
        id: 'edu-new-unique-id',
        // same degreeTitle and specializationTitle as entry 0
      },
    ];

    const result = validateEducationCatalogue(
      corrupted,
      ACADEMIC_CONTEXTS,
      CAREER_CATALOGUE
    );

    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('Duplicate specialization within degree'))).toBe(true);
  });

  it('detects invalid career path references', () => {
    const corrupted = [
      ...EDUCATION_CATALOGUE.slice(1),
      {
        ...EDUCATION_CATALOGUE[0],
        relatedCareerPathIds: [9999], // non-existent career
      },
    ];

    const result = validateEducationCatalogue(
      corrupted,
      ACADEMIC_CONTEXTS,
      CAREER_CATALOGUE
    );

    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('references non-existent career path ID: 9999'))).toBe(true);
  });

  it('detects invalid academic context references', () => {
    const corrupted = [
      ...EDUCATION_CATALOGUE.slice(1),
      {
        ...EDUCATION_CATALOGUE[0],
        relatedAcademicContextIds: ['non-existent-context-id'],
      },
    ];

    const result = validateEducationCatalogue(
      corrupted,
      ACADEMIC_CONTEXTS,
      CAREER_CATALOGUE
    );

    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('references non-existent academic context ID: non-existent-context-id'))).toBe(true);
  });
});

describe('Canonical Skills Catalogue Validator (Prompt 4)', () => {
  it('passes cleanly for the canonical skills catalogue', () => {
    const result = validateSkillCatalogue(
      SKILLS_CATALOGUE,
      CAREER_CATALOGUE
    );

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(SKILLS_CATALOGUE.length).toBeGreaterThanOrEqual(48);
  });

  it('detects duplicate skill slugs', () => {
    const corrupted = [
      ...SKILLS_CATALOGUE,
      { ...SKILLS_CATALOGUE[0], id: 'skill-new-unique' },
    ];

    const result = validateSkillCatalogue(
      corrupted,
      CAREER_CATALOGUE
    );

    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes(`Duplicate CanonicalSkill slug: ${SKILLS_CATALOGUE[0].slug}`))).toBe(true);
  });

  it('detects unknown skill slugs referenced by career paths', () => {
    const corruptedPaths = [
      ...CAREER_CATALOGUE.slice(1),
      {
        ...CAREER_CATALOGUE[0],
        coreSkillSlugs: ['unknown-quantum-skill-slug'],
      },
    ];

    const result = validateSkillCatalogue(
      SKILLS_CATALOGUE,
      corruptedPaths
    );

    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('unknown core skill slug: unknown-quantum-skill-slug'))).toBe(true);
  });
});
