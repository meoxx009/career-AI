import rawSkillsCatalogue from '../../data/skills-catalogue.json';
import type { CanonicalSkill } from '../types';

export const SKILLS_CATALOGUE: CanonicalSkill[] = rawSkillsCatalogue as CanonicalSkill[];

/**
 * Get skill by exact slug
 */
export function getSkillBySlug(slug: string): CanonicalSkill | undefined {
  const normalized = slug.trim().toLowerCase();
  return SKILLS_CATALOGUE.find(s => s.slug.toLowerCase() === normalized);
}

/**
 * Get skill by exact ID
 */
export function getSkillById(id: string): CanonicalSkill | undefined {
  const normalized = id.trim().toLowerCase();
  return SKILLS_CATALOGUE.find(s => s.id.toLowerCase() === normalized);
}

/**
 * Filter skills by category
 */
export function getSkillsByCategory(category: string): CanonicalSkill[] {
  const normalized = category.trim().toLowerCase();
  return SKILLS_CATALOGUE.filter(s => s.category.toLowerCase() === normalized && s.active);
}

/**
 * Search skills catalogue by name, slug, description, or aliases
 */
export function searchSkillCatalogue(query: string): CanonicalSkill[] {
  const q = query.trim().toLowerCase();
  if (!q) return SKILLS_CATALOGUE.filter(s => s.active);

  return SKILLS_CATALOGUE.filter(s =>
    s.active && (
      s.name.toLowerCase().includes(q) ||
      s.slug.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.aliases.some(a => a.toLowerCase().includes(q))
    )
  );
}

/**
 * Get all active canonical skill slugs
 */
export function getAllSkillSlugs(): string[] {
  return SKILLS_CATALOGUE.filter(s => s.active).map(s => s.slug);
}
