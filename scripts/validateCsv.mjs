import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const dataDir = path.join(rootDir, 'data');

/**
 * Robust CSV parser that handles quotes, escaped quotes, and commas.
 */
function parseCsv(content) {
  const lines = [];
  let currentField = '';
  let currentLine = [];
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const nextChar = content[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"';
        i++; // Skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentLine.push(currentField.trim());
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++; // Skip \n in \r\n
      }
      currentLine.push(currentField.trim());
      currentField = '';
      if (currentLine.length > 0 && currentLine.some(f => f.length > 0)) {
        lines.push(currentLine);
      }
      currentLine = [];
    } else {
      currentField += char;
    }
  }

  if (currentField.length > 0 || currentLine.length > 0) {
    currentLine.push(currentField.trim());
    if (currentLine.some(f => f.length > 0)) {
      lines.push(currentLine);
    }
  }

  if (lines.length === 0) return [];

  const headers = lines[0];
  const rows = [];

  for (let r = 1; r < lines.length; r++) {
    const values = lines[r];
    const rowObj = {};
    for (let c = 0; c < headers.length; c++) {
      rowObj[headers[c]] = values[c] !== undefined ? values[c] : '';
    }
    rows.push(rowObj);
  }

  return rows;
}

function loadAndParse(filename) {
  const filePath = path.join(dataDir, filename);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Data file not found: ${filePath}`);
  }
  const raw = fs.readFileSync(filePath, 'utf-8');
  return parseCsv(raw);
}

export function validateCsvDataset() {
  console.log('--- Validating CareerAI CSV seed files from data/ ---');

  const rawSkills = loadAndParse('skills.csv');
  const rawRoles = loadAndParse('roles.csv');
  const rawRequirements = loadAndParse('role-skill-requirements.csv');
  const rawQuestions = loadAndParse('assessment-questions.csv');
  const rawRoadmaps = loadAndParse('roadmap-templates.csv');
  const rawInterviews = loadAndParse('interview-questions.csv');

  const errors = [];

  // 1. Validate Skills
  const skillIds = new Set();
  rawSkills.forEach((row, idx) => {
    const id = Number(row.id);
    if (!row.id || isNaN(id) || id <= 0) errors.push(`skills.csv row ${idx + 2}: Invalid or missing id (${row.id})`);
    if (skillIds.has(id)) errors.push(`skills.csv row ${idx + 2}: Duplicate skill ID (${id})`);
    skillIds.add(id);
    if (!row.slug) errors.push(`skills.csv row ${idx + 2}: Missing slug`);
    if (!row.name) errors.push(`skills.csv row ${idx + 2}: Missing name`);
    if (!row.category) errors.push(`skills.csv row ${idx + 2}: Missing category`);
  });

  // 2. Validate Roles
  const roleIds = new Set();
  rawRoles.forEach((row, idx) => {
    const id = Number(row.id);
    if (!row.id || isNaN(id) || id <= 0) errors.push(`roles.csv row ${idx + 2}: Invalid or missing id (${row.id})`);
    if (roleIds.has(id)) errors.push(`roles.csv row ${idx + 2}: Duplicate role ID (${id})`);
    roleIds.add(id);
    if (!row.slug) errors.push(`roles.csv row ${idx + 2}: Missing slug`);
    if (!row.name) errors.push(`roles.csv row ${idx + 2}: Missing name`);
    if (!row.source_label) errors.push(`roles.csv row ${idx + 2}: Missing source_label`);
    if (!row.version) errors.push(`roles.csv row ${idx + 2}: Missing version`);
  });

  // 3. Validate Role Skill Requirements
  rawRequirements.forEach((row, idx) => {
    const roleId = Number(row.role_id);
    const skillId = Number(row.skill_id);
    const targetLevel = Number(row.target_level);
    const importance = Number(row.importance);
    const prereqOrder = Number(row.prerequisite_order);

    if (!roleIds.has(roleId)) errors.push(`role-skill-requirements.csv row ${idx + 2}: Unknown role_id (${roleId})`);
    if (!skillIds.has(skillId)) errors.push(`role-skill-requirements.csv row ${idx + 2}: Unknown skill_id (${skillId})`);

    if (isNaN(targetLevel) || targetLevel < 1 || targetLevel > 4) {
      errors.push(`role-skill-requirements.csv row ${idx + 2}: target_level must be between 1 and 4, found ${row.target_level}`);
    }
    if (isNaN(importance) || importance < 1 || importance > 3) {
      errors.push(`role-skill-requirements.csv row ${idx + 2}: importance must be between 1 and 3, found ${row.importance}`);
    }
    if (isNaN(prereqOrder) || prereqOrder < 1) {
      errors.push(`role-skill-requirements.csv row ${idx + 2}: prerequisite_order must be positive, found ${row.prerequisite_order}`);
    }
    if (!row.rationale) errors.push(`role-skill-requirements.csv row ${idx + 2}: Missing rationale`);
    if (!row.version) errors.push(`role-skill-requirements.csv row ${idx + 2}: Missing version`);
  });

  // 4. Validate Assessment Questions
  const questionIds = new Set();
  rawQuestions.forEach((row, idx) => {
    if (!row.id) errors.push(`assessment-questions.csv row ${idx + 2}: Missing id`);
    if (questionIds.has(row.id)) errors.push(`assessment-questions.csv row ${idx + 2}: Duplicate question ID (${row.id})`);
    questionIds.add(row.id);

    const skillId = Number(row.skill_id);
    if (!skillIds.has(skillId)) errors.push(`assessment-questions.csv row ${idx + 2}: Unknown skill_id (${skillId})`);

    if (!['a', 'b', 'c', 'd'].includes(row.correct_key)) {
      errors.push(`assessment-questions.csv row ${idx + 2}: correct_key must be a, b, c, or d, found '${row.correct_key}'`);
    }
    if (!row.option_a || !row.option_b || !row.option_c || !row.option_d) {
      errors.push(`assessment-questions.csv row ${idx + 2}: Options a-d must all be present`);
    }
    if (!row.explanation) errors.push(`assessment-questions.csv row ${idx + 2}: Missing explanation`);
    if (!row.version) errors.push(`assessment-questions.csv row ${idx + 2}: Missing version`);
  });

  // 5. Validate Roadmap Templates & Prerequisites
  const roadmapIds = new Set();
  rawRoadmaps.forEach((row, idx) => {
    if (!row.id) errors.push(`roadmap-templates.csv row ${idx + 2}: Missing id`);
    if (roadmapIds.has(row.id)) errors.push(`roadmap-templates.csv row ${idx + 2}: Duplicate task ID (${row.id})`);
    roadmapIds.add(row.id);

    const roleId = Number(row.role_id);
    if (!roleIds.has(roleId)) errors.push(`roadmap-templates.csv row ${idx + 2}: Unknown role_id (${roleId})`);

    const weekNum = Number(row.week_number);
    if (isNaN(weekNum) || weekNum < 1) errors.push(`roadmap-templates.csv row ${idx + 2}: Invalid week_number (${row.week_number})`);

    const hours = Number(row.estimated_hours);
    if (isNaN(hours) || hours <= 0) errors.push(`roadmap-templates.csv row ${idx + 2}: Invalid estimated_hours (${row.estimated_hours})`);

    if (!row.title) errors.push(`roadmap-templates.csv row ${idx + 2}: Missing title`);
    if (!row.deliverable) errors.push(`roadmap-templates.csv row ${idx + 2}: Missing deliverable`);
  });

  // Check prerequisite references
  rawRoadmaps.forEach((row, idx) => {
    const prereq = row.prerequisite_id ? row.prerequisite_id.trim() : '';
    if (prereq && prereq !== 'null' && prereq !== '') {
      if (!roadmapIds.has(prereq)) {
        errors.push(`roadmap-templates.csv row ${idx + 2}: prerequisite_id refers to non-existent task '${prereq}'`);
      }
      if (prereq === row.id) {
        errors.push(`roadmap-templates.csv row ${idx + 2}: task '${row.id}' cannot depend on itself`);
      }
    }
  });

  // 6. Validate Interview Questions
  const interviewIds = new Set();
  rawInterviews.forEach((row, idx) => {
    if (!row.id) errors.push(`interview-questions.csv row ${idx + 2}: Missing id`);
    if (interviewIds.has(row.id)) errors.push(`interview-questions.csv row ${idx + 2}: Duplicate interview ID (${row.id})`);
    interviewIds.add(row.id);

    const roleId = Number(row.role_id);
    if (!roleIds.has(roleId)) errors.push(`interview-questions.csv row ${idx + 2}: Unknown role_id (${roleId})`);

    if (!['behavioural', 'technical'].includes(row.type)) {
      errors.push(`interview-questions.csv row ${idx + 2}: Invalid type '${row.type}', must be behavioural or technical`);
    }
    if (!row.prompt) errors.push(`interview-questions.csv row ${idx + 2}: Missing prompt`);
    if (!row.version) errors.push(`interview-questions.csv row ${idx + 2}: Missing version`);
  });

  // 7. Validate Education Catalogue
  const educationPath = path.join(dataDir, 'education-catalogue.json');
  const careerCataloguePath = path.join(dataDir, 'career-catalogue.json');
  const academicContextsPath = path.join(dataDir, 'academic-contexts.json');
  const skillsCataloguePath = path.join(dataDir, 'skills-catalogue.json');

  let rawEducation = [];
  let rawCareerCatalogue = [];
  let rawAcademicContexts = [];
  let rawSkillsCatalogue = [];

  if (fs.existsSync(educationPath)) {
    rawEducation = JSON.parse(fs.readFileSync(educationPath, 'utf8'));
  }
  if (fs.existsSync(careerCataloguePath)) {
    rawCareerCatalogue = JSON.parse(fs.readFileSync(careerCataloguePath, 'utf8'));
  }
  if (fs.existsSync(academicContextsPath)) {
    rawAcademicContexts = JSON.parse(fs.readFileSync(academicContextsPath, 'utf8'));
  }
  if (fs.existsSync(skillsCataloguePath)) {
    rawSkillsCatalogue = JSON.parse(fs.readFileSync(skillsCataloguePath, 'utf8'));
  }

  const validCareerIds = new Set(rawCareerCatalogue.map(c => c.numericId));
  const validContextIds = new Set(rawAcademicContexts.map(a => a.id.toLowerCase()));

  const educationIds = new Set();
  const specializationKeys = new Set();
  const validLevels = ['school', 'diploma', 'undergraduate', 'postgraduate', 'professional'];

  rawEducation.forEach((entry, idx) => {
    if (!entry.id) errors.push(`education-catalogue.json [${idx}]: missing id`);
    if (educationIds.has(entry.id)) errors.push(`education-catalogue.json: Duplicate education ID (${entry.id})`);
    educationIds.add(entry.id);

    if (!validLevels.includes(entry.level)) {
      errors.push(`education-catalogue.json (${entry.id}): invalid level '${entry.level}'`);
    }
    if (!entry.degreeTitle) errors.push(`education-catalogue.json (${entry.id}): missing degreeTitle`);
    if (!entry.specializationTitle) errors.push(`education-catalogue.json (${entry.id}): missing specializationTitle`);

    const specKey = `${(entry.degreeTitle || '').toLowerCase()}:::${(entry.specializationTitle || '').toLowerCase()}`;
    if (specializationKeys.has(specKey)) {
      errors.push(`education-catalogue.json: Duplicate specialization '${entry.specializationTitle}' under '${entry.degreeTitle}'`);
    }
    specializationKeys.add(specKey);

    (entry.relatedCareerPathIds || []).forEach(pId => {
      if (!validCareerIds.has(pId)) {
        errors.push(`education-catalogue.json (${entry.id}): unknown relatedCareerPathId '${pId}'`);
      }
    });

    (entry.relatedAcademicContextIds || []).forEach(cId => {
      if (!validContextIds.has(cId.toLowerCase())) {
        errors.push(`education-catalogue.json (${entry.id}): unknown relatedAcademicContextId '${cId}'`);
      }
    });
  });

  // 8. Validate Canonical Skills Catalogue
  const canonicalSkillIds = new Set();
  const canonicalSkillSlugs = new Set();
  rawSkillsCatalogue.forEach((skill, idx) => {
    if (!skill.id) errors.push(`skills-catalogue.json [${idx}]: missing id`);
    if (canonicalSkillIds.has(skill.id)) errors.push(`skills-catalogue.json: duplicate skill ID (${skill.id})`);
    canonicalSkillIds.add(skill.id);

    if (!skill.slug) errors.push(`skills-catalogue.json [${idx}]: missing slug`);
    if (canonicalSkillSlugs.has(skill.slug)) errors.push(`skills-catalogue.json: duplicate skill slug (${skill.slug})`);
    canonicalSkillSlugs.add(skill.slug);

    if (!skill.name) errors.push(`skills-catalogue.json [${idx}]: missing name`);
    if (!skill.description) errors.push(`skills-catalogue.json [${idx}]: missing description`);
    if (!skill.evidenceTypes || skill.evidenceTypes.length === 0) {
      errors.push(`skills-catalogue.json [${idx}]: missing evidenceTypes`);
    }
  });

  // 9. Validate Path-Skill Requirements
  const pathRequirementsPath = path.join(dataDir, 'path-skill-requirements.json');
  let rawPathRequirements = [];
  if (fs.existsSync(pathRequirementsPath)) {
    rawPathRequirements = JSON.parse(fs.readFileSync(pathRequirementsPath, 'utf8'));
  }
  rawPathRequirements.forEach((req, idx) => {
    if (!req.pathId || !validCareerIds.has(req.pathId)) {
      errors.push(`path-skill-requirements.json [${idx}]: invalid or unknown pathId ${req.pathId}`);
    }
    if (!req.skillId || !canonicalSkillSlugs.has(req.skillId)) {
      errors.push(`path-skill-requirements.json [${idx}]: unknown skillId '${req.skillId}'`);
    }
    if (!req.targetLevel || req.targetLevel < 1 || req.targetLevel > 4) {
      errors.push(`path-skill-requirements.json [${idx}]: invalid targetLevel ${req.targetLevel} (must be 1-4)`);
    }
    if (!req.importance || req.importance < 1 || req.importance > 3) {
      errors.push(`path-skill-requirements.json [${idx}]: invalid importance ${req.importance} (must be 1-3)`);
    }
    if (!req.prerequisiteOrder || req.prerequisiteOrder < 1) {
      errors.push(`path-skill-requirements.json [${idx}]: invalid prerequisiteOrder ${req.prerequisiteOrder}`);
    }
    if (!req.rationale || typeof req.rationale !== 'string') {
      errors.push(`path-skill-requirements.json [${idx}]: missing rationale`);
    }
    if (!req.evidenceSources || !Array.isArray(req.evidenceSources) || req.evidenceSources.length === 0) {
      errors.push(`path-skill-requirements.json [${idx}]: missing evidenceSources`);
    }
  });

  // Check career catalogue references to skill slugs and curriculum contract
  const expectedCurriculumPhases = [
    'Foundations',
    'Core skills',
    'Guided project',
    'Portfolio/proof',
    'Practice and review',
  ];

  const referencedSkillSlugs = new Set();
  rawCareerCatalogue.forEach(p => {
    (p.coreSkillSlugs || []).forEach(s => {
      referencedSkillSlugs.add(s);
      if (!canonicalSkillSlugs.has(s)) {
        errors.push(`career-catalogue.json (${p.slug}): unknown coreSkillSlug '${s}'`);
      }
    });
    (p.prerequisiteSkillSlugs || []).forEach(s => {
      referencedSkillSlugs.add(s);
      if (!canonicalSkillSlugs.has(s)) {
        errors.push(`career-catalogue.json (${p.slug}): unknown prerequisiteSkillSlug '${s}'`);
      }
    });
    (p.advancedSkillSlugs || []).forEach(s => {
      referencedSkillSlugs.add(s);
      if (!canonicalSkillSlugs.has(s)) {
        errors.push(`career-catalogue.json (${p.slug}): unknown advancedSkillSlug '${s}'`);
      }
    });

    if (!p.curriculum || p.curriculum.length !== 5) {
      errors.push(`career-catalogue.json (${p.slug}): curriculum must contain exactly 5 phases`);
    } else {
      p.curriculum.forEach((item, cIdx) => {
        if (item.phase !== expectedCurriculumPhases[cIdx]) {
          errors.push(`career-catalogue.json (${p.slug}) step ${cIdx}: expected phase ${expectedCurriculumPhases[cIdx]}, got ${item.phase}`);
        }
        if (!item.id) errors.push(`career-catalogue.json (${p.slug}) step ${cIdx}: missing id`);
        if (!item.title) errors.push(`career-catalogue.json (${p.slug}) step ${cIdx}: missing title`);
        if (!item.deliverable) errors.push(`career-catalogue.json (${p.slug}) step ${cIdx}: missing deliverable`);
        if (!item.whyItMatters) errors.push(`career-catalogue.json (${p.slug}) step ${cIdx}: missing whyItMatters`);
        if (!item.resourceUrl || typeof item.resourceUrl !== 'string') {
          errors.push(`career-catalogue.json (${p.slug}) step ${cIdx}: missing or invalid resourceUrl`);
        } else if (
          !item.resourceUrl.startsWith('http://') &&
          !item.resourceUrl.startsWith('https://')
        ) {
          errors.push(`career-catalogue.json (${p.slug}) step ${cIdx}: resourceUrl must start with http:// or https://`);
        } else if (item.resourceUrl.includes('.local') || item.resourceUrl.includes('careerai.local')) {
          errors.push(`career-catalogue.json (${p.slug}) step ${cIdx}: resourceUrl must not point to .local or placeholder domain (${item.resourceUrl})`);
        }
      });
    }
  });

  console.log(`- skills.csv: ${rawSkills.length} rows loaded`);
  console.log(`- roles.csv: ${rawRoles.length} rows loaded`);
  console.log(`- role-skill-requirements.csv: ${rawRequirements.length} rows loaded`);
  console.log(`- assessment-questions.csv: ${rawQuestions.length} rows loaded`);
  console.log(`- roadmap-templates.csv: ${rawRoadmaps.length} rows loaded`);
  console.log(`- interview-questions.csv: ${rawInterviews.length} rows loaded`);
  console.log(`- education-catalogue.json: ${rawEducation.length} entries loaded`);
  console.log(`- skills-catalogue.json: ${rawSkillsCatalogue.length} canonical skills loaded`);
  console.log(`- path-skill-requirements.json: ${rawPathRequirements.length} validated requirements loaded`);

  if (errors.length > 0) {
    console.error(`\n❌ VALIDATION FAILED with ${errors.length} error(s):`);
    errors.forEach(e => console.error(`  - ${e}`));
    return { valid: false, errors };
  }

  console.log('\n✅ ALL CSV AND JSON DATA FILES PASSED VALIDATION WITH ZERO ERRORS.');
  return { valid: true, errors: [] };
}

// Run directly if invoked via node
const result = validateCsvDataset();
if (!result.valid) {
  process.exit(1);
}
