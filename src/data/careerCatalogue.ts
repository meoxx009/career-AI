import rawCatalogue from '../../data/career-catalogue.json';
import rawAcademicContexts from '../../data/academic-contexts.json';
import type { CareerPath, AcademicContext, PathCategory, CareerRole } from '../types';

export const CAREER_CATALOGUE: CareerPath[] = rawCatalogue as CareerPath[];
export const ACADEMIC_CONTEXTS: AcademicContext[] = rawAcademicContexts as AcademicContext[];

// Original 3 starter paths (IDs 1, 2, 3) preserved for continuity and backward compatibility
export const STARTER_CAREER_PATHS: CareerPath[] = CAREER_CATALOGUE.filter((p) =>
  [1, 2, 3].includes(p.numericId)
);

const SLUG_ALIASES: Record<string, string> = {
  'sdet-test-automation-engineer': 'sdet-engineer',
  'site-reliability-engineer': 'sre-engineer',
  'business-intelligence-analyst': 'bi-analyst',
};

const CONTEXT_ALIASES: Record<string, string> = {
  'bsc_data_science': 'bsc_ds',
  'bsc_statistics': 'bsc_stats',
};

export function getCareerPathBySlug(slug: string): CareerPath | undefined {
  const raw = slug.trim().toLowerCase();
  const normalized = SLUG_ALIASES[raw] || raw;
  return CAREER_CATALOGUE.find(
    (p) => p.slug.toLowerCase() === normalized || p.id.toLowerCase() === normalized
  );
}

export function getCareerPathById(numericId: number): CareerPath | undefined {
  return CAREER_CATALOGUE.find((p) => p.numericId === numericId);
}

export function getAcademicContextById(id: string): AcademicContext | undefined {
  const raw = id.trim().toLowerCase();
  const normalized = CONTEXT_ALIASES[raw] || raw;
  return ACADEMIC_CONTEXTS.find((a) => a.id.toLowerCase() === normalized);
}

export function getPathsByCategory(category: PathCategory): CareerPath[] {
  return CAREER_CATALOGUE.filter((p) => p.category === category);
}

export function searchCareerCatalogue(query: string): CareerPath[] {
  const q = query.trim().toLowerCase();
  if (!q) return CAREER_CATALOGUE;
  return CAREER_CATALOGUE.filter(
    (p) =>
      p.title.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.coreSkills.some((s) => s.toLowerCase().includes(q)) ||
      p.category.toLowerCase().includes(q) ||
      p.interests.some((i) => i.toLowerCase().includes(q))
  );
}

/**
 * Converts a rich CareerPath into a lightweight CareerRole
 * for use in components that consume CareerRole interfaces.
 */
export function asCareerRole(path: CareerPath): CareerRole {
  return {
    id: path.numericId,
    slug: path.slug,
    name: path.title,
    level: path.level,
    description: path.description,
    source_label: path.source,
    source_url: 'https://careerai.local/roles/' + path.slug,
    source_checked_at: '2026-03-01',
    version: path.version,
  };
}

/**
 * Returns all 33 paths as CareerRole objects.
 */
export function getAllCareerRoles(): CareerRole[] {
  return CAREER_CATALOGUE.map(asCareerRole);
}
