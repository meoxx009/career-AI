import rawEducationCatalogue from '../../data/education-catalogue.json';
import type { EducationEntry, EducationLevel, LearnerStage } from '../types';

export const EDUCATION_CATALOGUE: EducationEntry[] = rawEducationCatalogue as EducationEntry[];

/**
 * Find education entry by exact ID
 */
export function getEducationEntryById(id: string): EducationEntry | undefined {
  const normalized = id.trim().toLowerCase();
  return EDUCATION_CATALOGUE.find(e => e.id.toLowerCase() === normalized);
}

/**
 * Filter education entries by education level
 */
export function getEducationEntriesByLevel(level: EducationLevel): EducationEntry[] {
  return EDUCATION_CATALOGUE.filter(e => e.level === level && e.active);
}

/**
 * Filter education entries compatible with a given learner stage
 */
export function getEducationEntriesForStage(stage: LearnerStage): EducationEntry[] {
  return EDUCATION_CATALOGUE.filter(
    e => e.active && (e.compatibleLearnerStages.includes(stage) || e.compatibleLearnerStages.includes('all'))
  );
}

/**
 * Search the education catalogue across titles, specializations, aliases, and labels
 */
export function searchEducationCatalogue(
  query: string,
  stage?: LearnerStage
): EducationEntry[] {
  const q = query.trim().toLowerCase();
  const baseList = stage ? getEducationEntriesForStage(stage) : EDUCATION_CATALOGUE.filter(e => e.active);

  if (!q) return baseList;

  return baseList.filter(e =>
    e.degreeTitle.toLowerCase().includes(q) ||
    e.specializationTitle.toLowerCase().includes(q) ||
    e.label.toLowerCase().includes(q) ||
    e.aliases.some(a => a.toLowerCase().includes(q))
  );
}

/**
 * Get unique degree titles for a stage or all stages
 */
export function getDegreeTitles(stage?: LearnerStage): string[] {
  const entries = stage ? getEducationEntriesForStage(stage) : EDUCATION_CATALOGUE.filter(e => e.active);
  const titles = new Set<string>();
  entries.forEach(e => titles.add(e.degreeTitle));
  return Array.from(titles);
}

/**
 * Get specializations for a given degree title
 */
export function getSpecializationsForDegree(degreeTitle: string): EducationEntry[] {
  const normalized = degreeTitle.trim().toLowerCase();
  return EDUCATION_CATALOGUE.filter(
    e => e.active && e.degreeTitle.toLowerCase() === normalized
  );
}

/**
 * Groups entries by education family/category
 */
export interface EducationFamilyGroup {
  id: string;
  name: string;
  entries: EducationEntry[];
}

export function getEducationFamilyGroups(stage?: LearnerStage): EducationFamilyGroup[] {
  const entries = stage ? getEducationEntriesForStage(stage) : EDUCATION_CATALOGUE.filter(e => e.active);

  const groups: Record<string, { name: string; entries: EducationEntry[] }> = {
    school: { name: 'School Streams (Class 10-12)', entries: [] },
    diploma: { name: 'Diploma & Vocational Programs', entries: [] },
    cs_software: { name: 'Computer Science & Software', entries: [] },
    electronics: { name: 'Electronics, Hardware & IoT', entries: [] },
    core_engineering: { name: 'Core Engineering (Mechanical, Civil, etc.)', entries: [] },
    commerce_business: { name: 'Commerce, Management & Business', entries: [] },
    arts_design: { name: 'Arts, Design, Media & Humanities', entries: [] },
    generic: { name: 'Self-Taught & Other / Unlisted', entries: [] },
  };

  entries.forEach(entry => {
    const id = entry.id;
    if (entry.level === 'school') {
      groups.school.entries.push(entry);
    } else if (entry.level === 'diploma') {
      groups.diploma.entries.push(entry);
    } else if (
      id.includes('btech-cs') || id.includes('btech-it') || id.includes('btech-ai') ||
      id.includes('btech-ml') || id.includes('btech-ds') || id.includes('btech-cybersecurity') ||
      id.includes('btech-se') || id.startsWith('edu-bca') || id.startsWith('edu-bsc-cs') ||
      id.startsWith('edu-bsc-it') || id.startsWith('edu-bsc-ds') || id.startsWith('edu-bsc-stats') ||
      id.startsWith('edu-bsc-ai') || id.startsWith('edu-mca') || id.startsWith('edu-msc-cs') ||
      id.startsWith('edu-msc-ds') || id.startsWith('edu-msc-ai') || id.startsWith('edu-msc-stats') ||
      id.startsWith('edu-mtech-cs') || id.startsWith('edu-mtech-aiml') || id.startsWith('edu-mtech-ds') ||
      id.startsWith('edu-mtech-cybersecurity')
    ) {
      groups.cs_software.entries.push(entry);
    } else if (
      id.includes('btech-ece') || id.includes('btech-electronics') || id.includes('btech-embedded') ||
      id.includes('btech-vlsi') || id.includes('btech-instrumentation') || id.includes('btech-electrical') ||
      id.includes('btech-robotics') || id.includes('btech-mechatronics') || id.includes('btech-iot') ||
      id.includes('btech-biomedical')
    ) {
      groups.electronics.entries.push(entry);
    } else if (
      id.includes('mechanical') || id.includes('civil') || id.includes('chemical') ||
      id.includes('production') || id.includes('industrial') || id.includes('automobile') ||
      id.includes('environmental') || id.includes('barch')
    ) {
      groups.core_engineering.entries.push(entry);
    } else if (
      id.startsWith('edu-bcom') || id.startsWith('edu-bba') || id.startsWith('edu-mba')
    ) {
      groups.commerce_business.entries.push(entry);
    } else if (
      id.startsWith('edu-ba') || id.startsWith('edu-bdes') || id.startsWith('edu-ma') ||
      id.startsWith('edu-des')
    ) {
      groups.arts_design.entries.push(entry);
    } else {
      groups.generic.entries.push(entry);
    }
  });

  return Object.entries(groups)
    .filter(([_, grp]) => grp.entries.length > 0)
    .map(([key, grp]) => ({
      id: key,
      name: grp.name,
      entries: grp.entries,
    }));
}
