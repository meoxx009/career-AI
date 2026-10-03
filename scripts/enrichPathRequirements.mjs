import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const dataDir = path.join(rootDir, 'data');

const careerCataloguePath = path.join(dataDir, 'career-catalogue.json');
const skillsCataloguePath = path.join(dataDir, 'skills-catalogue.json');
const pathSkillRequirementsPath = path.join(dataDir, 'path-skill-requirements.json');

const rawCareerCatalogue = JSON.parse(fs.readFileSync(careerCataloguePath, 'utf-8'));
const rawSkillsCatalogue = JSON.parse(fs.readFileSync(skillsCataloguePath, 'utf-8'));

const skillMap = new Map(rawSkillsCatalogue.map(s => [s.slug, s]));

// Standard phase sequence
const STANDARD_PHASES = [
  'Foundations',
  'Core skills',
  'Guided project',
  'Portfolio/proof',
  'Practice and review',
];

const allPathRequirements = [];

const enrichedPaths = rawCareerCatalogue.map(p => {
  const pathId = p.numericId;
  const prereqSlugs = p.prerequisiteSkillSlugs || [];
  const coreSlugs = p.coreSkillSlugs || [];
  const advSlugs = p.advancedSkillSlugs || [];

  // Build requirements for this path
  const requirements = [];

  // Prerequisite skills: targetLevel 2, importance 2, order 1
  prereqSlugs.forEach(slug => {
    const skill = skillMap.get(slug);
    const skillName = skill ? skill.name : slug;
    requirements.push({
      pathId,
      skillId: slug,
      targetLevel: 2,
      importance: 2,
      prerequisiteOrder: 1,
      rationale: `Foundational competence in ${skillName} is required before building ${p.title} capabilities.`,
      evidenceSources: ['diagnostic', 'assessment', 'project fact', 'reviewed project', 'resume', 'practice'],
      version: 'catalogue-v2.0',
    });
  });

  // Core skills: targetLevel 3, importance 3, order 2
  coreSlugs.forEach(slug => {
    const skill = skillMap.get(slug);
    const skillName = skill ? skill.name : slug;
    requirements.push({
      pathId,
      skillId: slug,
      targetLevel: 3,
      importance: 3,
      prerequisiteOrder: 2,
      rationale: `Core execution of ${p.title} deliverables directly depends on verified proficiency in ${skillName}.`,
      evidenceSources: ['diagnostic', 'assessment', 'project fact', 'reviewed project', 'resume', 'practice'],
      version: 'catalogue-v2.0',
    });
  });

  // Advanced skills: targetLevel 3 or 4, importance 2, order 3
  advSlugs.forEach(slug => {
    const skill = skillMap.get(slug);
    const skillName = skill ? skill.name : slug;
    requirements.push({
      pathId,
      skillId: slug,
      targetLevel: 3,
      importance: 2,
      prerequisiteOrder: 3,
      rationale: `Advanced engineering in ${p.title} requires applied knowledge of ${skillName} in production environments.`,
      evidenceSources: ['diagnostic', 'assessment', 'project fact', 'reviewed project', 'resume', 'practice'],
      version: 'catalogue-v2.0',
    });
  });

  allPathRequirements.push(...requirements);

  // Enrich curriculum items
  const enrichedCurriculum = (p.curriculum || []).map((item, idx) => {
    // Map relevant skillIds from the path's skills
    let skillIds = [];
    if (idx === 0) {
      skillIds = prereqSlugs.slice(0, 2);
      if (skillIds.length === 0 && coreSlugs.length > 0) skillIds = [coreSlugs[0]];
    } else if (idx === 1) {
      skillIds = coreSlugs.slice(0, 2);
    } else if (idx === 2) {
      skillIds = coreSlugs.slice(1, 3);
    } else if (idx === 3) {
      skillIds = advSlugs.length > 0 ? [coreSlugs[0], advSlugs[0]] : coreSlugs.slice(0, 2);
    } else {
      skillIds = ['communication', 'portfolio-evidence'];
      if (!skillMap.has('communication')) skillIds = coreSlugs.slice(0, 1);
    }

    // Filter to ensure only valid canonical skill slugs
    skillIds = skillIds.filter(s => skillMap.has(s));
    if (skillIds.length === 0 && coreSlugs.length > 0) {
      skillIds = [coreSlugs[0]];
    }

    const prereqId = item.prerequisite || null;
    const prereqItemIds = prereqId ? [prereqId] : [];

    return {
      id: item.id,
      pathId,
      skillIds,
      title: item.title,
      phase: STANDARD_PHASES[idx] || item.phase,
      whyItMatters: item.whyItMatters,
      estimatedHours: item.estimatedHours || 8,
      deliverable: item.deliverable,
      prerequisiteItemIds: prereqItemIds,
      resourceUrl: item.optionalVerifiedResource || undefined,
      status: item.completionState || 'todo',
      // Maintain backwards-compatibility fields:
      prerequisite: prereqId,
      optionalVerifiedResource: item.optionalVerifiedResource || null,
      completionState: item.completionState || 'todo',
    };
  });

  return {
    ...p,
    requirements,
    curriculum: enrichedCurriculum,
  };
});

fs.writeFileSync(careerCataloguePath, JSON.stringify(enrichedPaths, null, 2) + '\n', 'utf-8');
fs.writeFileSync(pathSkillRequirementsPath, JSON.stringify(allPathRequirements, null, 2) + '\n', 'utf-8');

console.log(`Successfully enriched ${enrichedPaths.length} career paths with requirements and curriculum contracts.`);
console.log(`Total path skill requirements created: ${allPathRequirements.length}`);
