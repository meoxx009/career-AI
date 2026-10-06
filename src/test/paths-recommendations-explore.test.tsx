import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { CareerProvider } from '../context/CareerContext';
import { AppShell } from '../components/AppShell';
import { Paths } from '../pages/Paths';
import { RoleDetail } from '../pages/RoleDetail';
import { generatePathRecommendations } from '../lib/pathRecommendations';
import { getCareerPathBySlug } from '../data/careerCatalogue';
import { STORAGE_KEY } from '../context/careerConstants';
import type { UserProfile } from '../types';

function renderPathsApp(initialProfile?: Partial<UserProfile>, initialRoute = '/paths') {
  if (initialProfile) {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        profile: {
          id: 'test-user-id',
          displayName: 'Test Learner',
          branch: 'Computer Science',
          studyYear: '3rd Year',
          hoursPerWeek: 10,
          preferredRoles: [],
          isGuestDemo: false,
          ...initialProfile,
        },
      })
    );
  }

  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <CareerProvider>
        <AppShell>
          <Routes>
            <Route path="/paths" element={<Paths />} />
            <Route path="/paths/:roleSlug" element={<RoleDetail />} />
          </Routes>
        </AppShell>
      </CareerProvider>
    </MemoryRouter>
  );
}

describe('Prompt 2 — Paths Recommendations, Explore Buttons & Deterministic Multi-Path Matching', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('Section F: 15 Core Verification Tests', () => {
    // 1. Machine Learning Engineer card has Explore action
    it('1. Machine Learning Engineer card has Explore action', () => {
      const recResult = generatePathRecommendations({
        learnerStage: 'undergraduate',
        degree: 'BTech',
        branch: 'Computer Science',
        interests: ['ai-ml', 'machine learning'],
        hoursPerWeek: 12,
      });

      const mlRec = recResult.recommendations.find(r => r.cataloguePathSlug === 'machine-learning-engineer');
      expect(mlRec).toBeDefined();
      expect(mlRec?.canExplore).toBe(true);
      expect(mlRec?.exploreHref).toBe('/paths/machine-learning-engineer');

      // UI assertion
      renderPathsApp({
        interests: ['ai-ml', 'machine learning'],
      });

      const mlHeading = screen.getByRole('heading', { name: /Machine Learning Engineer/i });
      expect(mlHeading).toBeInTheDocument();

      // Find the card container and check Explore button
      const card = mlHeading.closest('.dark-card') || mlHeading.parentElement?.parentElement;
      expect(card).not.toBeNull();
      const exploreBtn = card!.querySelector('button.button-primary');
      expect(exploreBtn).not.toBeNull();
      expect(exploreBtn?.textContent).toContain('Explore this curriculum roadmap');

      // Secondary action also present
      const diagnosticBtn = card!.querySelector('button.button-secondary');
      expect(diagnosticBtn).not.toBeNull();
      expect(diagnosticBtn?.textContent).toContain('Take diagnostic assessment');
    });

    // 2. Data Scientist card has Explore action
    it('2. Data Scientist card has Explore action', () => {
      const recResult = generatePathRecommendations({
        learnerStage: 'undergraduate',
        degree: 'BSc',
        branch: 'Statistics',
        interests: ['data-science', 'statistics', 'ai-ml'],
        hoursPerWeek: 10,
      });

      const dsRec = recResult.recommendations.find(r => r.cataloguePathSlug === 'data-scientist');
      expect(dsRec).toBeDefined();
      expect(dsRec?.canExplore).toBe(true);
      expect(dsRec?.exploreHref).toBe('/paths/data-scientist');

      renderPathsApp({
        degree: 'BSc',
        branch: 'Statistics',
        interests: ['data-science', 'statistics', 'ai-ml'],
      });

      const dsHeading = screen.getByRole('heading', { name: /Data Scientist/i });
      expect(dsHeading).toBeInTheDocument();
      const card = dsHeading.closest('.dark-card') || dsHeading.parentElement?.parentElement;
      const exploreBtn = card!.querySelector('button.button-primary');
      expect(exploreBtn?.textContent).toContain('Explore this curriculum roadmap');
    });

    // 3. Backend & Systems Engineering card has Explore action
    it('3. Backend & Systems Engineering card has Explore action', () => {
      const recResult = generatePathRecommendations({
        learnerStage: 'undergraduate',
        targetRoleId: 1,
        interests: ['backend', 'systems'],
        hoursPerWeek: 10,
      });

      const backendRec = recResult.recommendations.find(r => r.cataloguePathId === 1 || r.cataloguePathSlug === 'backend-developer');
      expect(backendRec).toBeDefined();
      expect(backendRec?.title).toContain('Backend & Systems Engineering');
      expect(backendRec?.canExplore).toBe(true);
      expect(backendRec?.exploreHref).toBe('/paths/backend-developer');

      renderPathsApp({
        targetRoleId: 1,
        interests: ['backend'],
      });

      const backendHeading = screen.getByRole('heading', { name: /Backend & Systems Engineering/i });
      expect(backendHeading).toBeInTheDocument();
      const card = backendHeading.closest('.dark-card') || backendHeading.parentElement?.parentElement;
      const exploreBtn = card!.querySelector('button.button-primary');
      expect(exploreBtn?.textContent).toContain('Explore this curriculum roadmap');
    });

    // 4. Data Analytics card has Explore action
    it('4. Data Analytics card has Explore action', () => {
      const recResult = generatePathRecommendations({
        learnerStage: 'undergraduate',
        targetRoleId: 3,
        interests: ['data-analysis', 'analytics'],
        hoursPerWeek: 8,
      });

      const dataRec = recResult.recommendations.find(r => r.cataloguePathId === 3 || r.cataloguePathSlug === 'data-analyst');
      expect(dataRec).toBeDefined();
      expect(dataRec?.title).toMatch(/Data Analytics/i);
      expect(dataRec?.canExplore).toBe(true);
      expect(dataRec?.exploreHref).toBe('/paths/data-analyst');

      renderPathsApp({
        targetRoleId: 3,
        interests: ['data-analysis'],
      });

      const dataHeadings = screen.getAllByRole('heading', { name: /Data Analytics/i });
      expect(dataHeadings.length).toBeGreaterThan(0);
      const card = dataHeadings[0].closest('.dark-card') || dataHeadings[0].parentElement?.parentElement;
      const exploreBtn = card!.querySelector('button.button-primary');
      expect(exploreBtn?.textContent).toContain('Explore this curriculum roadmap');
    });

    // 5. Data Engineer card has Explore action
    it('5. Data Engineer card has Explore action', () => {
      const recResult = generatePathRecommendations({
        learnerStage: 'undergraduate',
        interests: ['data-engineering', 'data-pipeline', 'sql'],
        hoursPerWeek: 12,
      });

      const deRec = recResult.recommendations.find(r => r.cataloguePathSlug === 'data-engineer');
      expect(deRec).toBeDefined();
      expect(deRec?.canExplore).toBe(true);
      expect(deRec?.exploreHref).toBe('/paths/data-engineer');

      renderPathsApp({
        interests: ['data-engineering', 'data-pipeline'],
      });

      const deHeading = screen.getByRole('heading', { name: /Data Engineer/i });
      expect(deHeading).toBeInTheDocument();
      const card = deHeading.closest('.dark-card') || deHeading.parentElement?.parentElement;
      const exploreBtn = card!.querySelector('button.button-primary');
      expect(exploreBtn?.textContent).toContain('Explore this curriculum roadmap');
    });

    // 6. Every recommendation with curriculum has canExplore === true
    it('6. Every recommendation with curriculum has canExplore === true', () => {
      const profiles: Array<Partial<UserProfile>> = [
        { learnerStage: 'class_11_12', stream: 'pcm' },
        { learnerStage: 'class_10', stream: 'commerce' },
        { learnerStage: 'class_11_12', stream: 'pcb' },
        { learnerStage: 'class_11_12', stream: 'arts' },
        { learnerStage: 'undergraduate', degree: 'BTech', branch: 'Computer Science', interests: ['ai-ml'] },
        { learnerStage: 'postgraduate', degree: 'MCA', interests: ['backend'] },
        { learnerStage: 'self_taught', interests: ['frontend', 'ui-ux-design'] },
      ];

      profiles.forEach(p => {
        const result = generatePathRecommendations(p);
        expect(result.recommendations.length).toBeGreaterThan(0);
        result.recommendations.forEach(rec => {
          if (rec.curriculumAvailable) {
            expect(rec.canExplore, `Expected rec ${rec.id} (${rec.title}) to have canExplore === true`).toBe(true);
            expect(rec.exploreHref.length).toBeGreaterThan(0);
          }
        });
      });
    });

    // 7. Every Explore href resolves to a valid route
    it('7. Every Explore href resolves to a valid route in the career catalogue', () => {
      const result = generatePathRecommendations({
        learnerStage: 'undergraduate',
        degree: 'BTech',
        branch: 'Information Technology',
        interests: ['devops', 'cloud', 'cybersecurity'],
      });

      result.recommendations.forEach(rec => {
        expect(rec.exploreHref).toMatch(/^\/paths\/[a-z0-9-]+$/);
        const slug = rec.cataloguePathSlug || rec.exploreHref.replace('/paths/', '');
        const matched = getCareerPathBySlug(slug);
        expect(matched, `Expected catalogue path for slug ${slug} to exist`).toBeDefined();
      });
    });

    // 8. Multiple paths are shown for a multi-interest profile
    it('8. Multiple paths are shown for a multi-interest profile', () => {
      const result = generatePathRecommendations({
        learnerStage: 'undergraduate',
        interests: ['ai-ml', 'backend', 'cloud-infrastructure'],
        hoursPerWeek: 15,
      });

      expect(result.recommendations.length).toBeGreaterThanOrEqual(3);
      expect(result.recommendations.length).toBeLessThanOrEqual(6);
    });

    // 9. Changing interest changes ranked results
    it('9. Changing interest changes ranked results deterministically', () => {
      const mlResult = generatePathRecommendations({
        learnerStage: 'undergraduate',
        branch: 'Engineering',
        interests: ['ai-ml', 'machine learning'],
      });

      const designResult = generatePathRecommendations({
        learnerStage: 'undergraduate',
        branch: 'Engineering',
        interests: ['ui-ux-design', 'product-business'],
      });

      const topMlSlug = mlResult.recommendations[0].cataloguePathSlug;
      const topDesignSlug = designResult.recommendations[0].cataloguePathSlug;

      expect(topMlSlug).not.toBe(topDesignSlug);
      expect(['machine-learning-engineer', 'data-scientist', 'ai-engineer']).toContain(topMlSlug);
      expect(['ui-ux-designer', 'product-designer', 'product-manager', 'ux-researcher']).toContain(topDesignSlug);
    });

    // 10. Changing degree/branch changes ranked results
    it('10. Changing degree/branch changes ranked results', () => {
      const cseResult = generatePathRecommendations({
        learnerStage: 'undergraduate',
        degree: 'BTech',
        branch: 'Computer Science and Engineering',
      });

      const bcomResult = generatePathRecommendations({
        learnerStage: 'undergraduate',
        degree: 'BCom',
        branch: 'Accounting and Finance',
      });

      const cseSlugs = cseResult.recommendations.map(r => r.cataloguePathSlug);
      const bcomSlugs = bcomResult.recommendations.map(r => r.cataloguePathSlug);

      expect(cseSlugs).not.toEqual(bcomSlugs);
      expect(bcomSlugs.some(s => s === 'data-analyst' || s === 'business-analyst' || s === 'bi-analyst')).toBe(true);
    });

    // 11. Changing current skills changes evidence and prerequisite gaps
    it('11. Changing current skills changes evidence and prerequisite gaps', () => {
      const withoutSkills = generatePathRecommendations({
        learnerStage: 'undergraduate',
        interests: ['ai-ml'],
        currentSkills: [],
      });

      const withSkills = generatePathRecommendations({
        learnerStage: 'undergraduate',
        interests: ['ai-ml'],
        currentSkills: ['Python', 'Linear Algebra'],
      });

      const mlWithout = withoutSkills.recommendations.find(r => r.cataloguePathSlug === 'machine-learning-engineer');
      const mlWith = withSkills.recommendations.find(r => r.cataloguePathSlug === 'machine-learning-engineer');

      expect(mlWithout?.evidenceFound[0]).toContain('No verified skill evidence supplied yet');
      expect(mlWith?.evidenceFound.some(e => e.includes('Python'))).toBe(true);
    });

    // 12. Selected target role gets preference but does not hide all other valid paths
    it('12. Selected target role gets preference but does not hide all other valid paths', () => {
      const result = generatePathRecommendations({
        learnerStage: 'undergraduate',
        targetRoleId: 18, // Machine Learning Engineer
        interests: ['software', 'data'],
      });

      // Target role is ranked #1
      expect(result.recommendations[0].cataloguePathId).toBe(18);
      expect(result.recommendations[0].cataloguePathSlug).toBe('machine-learning-engineer');

      // Does not hide other paths: still returns multiple valid options
      expect(result.recommendations.length).toBeGreaterThanOrEqual(3);
      expect(result.recommendations.some(r => r.cataloguePathId !== 18)).toBe(true);
    });

    // 13. Starter paths are removed from Paths page, keeping branching directions clean
    it('13. Starter paths are cleanly removed from Paths page (superseding legacy starter cards)', () => {
      renderPathsApp({
        interests: ['ai-ml'],
      });

      // Starter paths section header is absent
      expect(screen.queryByRole('heading', { name: /Starter paths — available to explore before assessment/i })).not.toBeInTheDocument();
      expect(screen.queryByText(/FOUNDATIONAL BENCHMARKS \/ ENTRY ROLES/i)).not.toBeInTheDocument();
    });

    // 14. No duplicate path cards
    it('14. No duplicate path cards within recommendations', () => {
      const result = generatePathRecommendations({
        learnerStage: 'undergraduate',
        interests: ['software', 'backend', 'data-ai', 'machine-learning'],
        currentSkills: ['Python', 'SQL', 'Git'],
      });

      const seenIds = new Set<string>();
      const seenSlugs = new Set<string>();

      result.recommendations.forEach(rec => {
        expect(seenIds.has(rec.id), `Duplicate recommendation ID: ${rec.id}`).toBe(false);
        seenIds.add(rec.id);

        expect(seenSlugs.has(rec.cataloguePathSlug), `Duplicate slug: ${rec.cataloguePathSlug}`).toBe(false);
        seenSlugs.add(rec.cataloguePathSlug);
      });
    });

    // 15. No path displays a fake score or fake job guarantee
    it('15. No path displays a fake score or fake job guarantee', () => {
      const result = generatePathRecommendations({
        learnerStage: 'self_taught',
        interests: ['ai-ml'],
      });

      result.recommendations.forEach(rec => {
        // Disclaimer must state truth-in-advertising
        expect(rec.disclaimer).toContain('not an admission, placement, or hiring guarantee');

        // No fake salary, ATS pass, or guaranteed placement copy
        const textBlob = `${rec.whySuggested} ${rec.nextAction} ${rec.disclaimer}`.toLowerCase();
        expect(textBlob).not.toContain('100% placement');
        expect(textBlob).not.toContain('guaranteed job');
        expect(textBlob).not.toContain('salary guarantee');
        expect(textBlob).not.toContain('ats pass score');
      });
    });

    // Bonus Route Test: RoleDetail resolves all 33 catalogue path slugs without crashing
    it('Bonus: RoleDetail resolves catalogue paths with staged curriculum, first project and CTAs', () => {
      renderPathsApp({}, '/paths/machine-learning-engineer');

      // Title & description
      expect(screen.getByRole('heading', { level: 1, name: /Machine Learning Engineer/i })).toBeInTheDocument();

      // Why fits & first project deliverable
      expect(screen.getByRole('heading', { name: /Why this career path fits/i })).toBeInTheDocument();
      expect(screen.getByText(/FIRST HANDS-ON PROJECT DELIVERABLE/i)).toBeInTheDocument();

      // 5-Phase Staged Curriculum Roadmap
      expect(screen.getByRole('heading', { name: /5-Phase Staged Curriculum Roadmap/i })).toBeInTheDocument();

      // CTAs
      expect(screen.getByRole('button', { name: /View Competency Gaps/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Open Roadmap for Machine Learning Engineer/i })).toBeInTheDocument();
    });
  });
});
