import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CareerProvider, useCareer } from '../context/CareerContext';
import { PathBuilder } from '../pages/PathBuilder';
import { Roadmap } from '../pages/Roadmap';
import { Paths } from '../pages/Paths';
import { CAREER_CATALOGUE, getCareerPathBySlug } from '../data/careerCatalogue';
import { getRelatedCareerPaths } from '../lib/pathMatcher';
import { STORAGE_KEY } from '../context/careerConstants';

describe('Universal Role Selection, Dynamic Preview, & Deterministic Related Paths', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('1. Fresh State & Removal of Default Core Paths', () => {
    it('fresh learner starts with hasSelectedRole as false and no default active path', () => {
      let contextValues: ReturnType<typeof useCareer> | undefined;
      const TestConsumer = () => {
        contextValues = useCareer();
        return <div>Consumer</div>;
      };

      render(
        <CareerProvider>
          <TestConsumer />
        </CareerProvider>
      );

      expect(contextValues!.hasSelectedRole).toBe(false);
      expect(contextValues!.selectedRoleId).toBeNull();
    });

    it('PathBuilder renders calm prompt instead of default core starter paths for fresh learner', () => {
      render(
        <MemoryRouter initialEntries={['/paths/builder']}>
          <CareerProvider>
            <PathBuilder />
          </CareerProvider>
        </MemoryRouter>
      );

      // Verify calm prompt
      expect(screen.getByRole('heading', { name: /CHOOSE A CAREER DIRECTION TO SEE YOUR PATH/i })).toBeInTheDocument();
      expect(screen.getAllByText(/Choose a career direction to see your path/i).length).toBeGreaterThanOrEqual(1);

      // Verify 3 default core starter paths are NOT displayed
      expect(screen.queryByRole('heading', { name: /CORE STARTER PATHS/i })).not.toBeInTheDocument();
      expect(screen.queryByText(/Starter Path #1/i)).not.toBeInTheDocument();
    });

    it('Paths page renders launcher to PathBuilder and clean state without unconditional starter paths', () => {
      render(
        <MemoryRouter initialEntries={['/paths']}>
          <CareerProvider>
            <Paths />
          </CareerProvider>
        </MemoryRouter>
      );

      expect(screen.getAllByRole('button', { name: /Launch Unified Path Builder/i }).length).toBeGreaterThanOrEqual(1);
      expect(screen.queryByText(/Starter paths — available to explore before assessment/i)).not.toBeInTheDocument();
      expect(screen.getByText(/Choose a Target Role or Add Interests/i)).toBeInTheDocument();
    });

    it('Roadmap page renders calm empty state with CTA to PathBuilder when no role is selected', () => {
      render(
        <MemoryRouter initialEntries={['/roadmap']}>
          <CareerProvider>
            <Roadmap />
          </CareerProvider>
        </MemoryRouter>
      );

      expect(screen.getByRole('heading', { name: /Choose a career direction to see your path/i })).toBeInTheDocument();
      expect(screen.getByText(/Select a role in the Path Builder to generate your personalized step-by-step roadmap/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Go to Path Builder →/i })).toBeInTheDocument();

      // Ensure no default Backend Developer roadmap tasks are rendered
      expect(screen.queryByText(/Target Budget/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Reschedule Plan/i)).not.toBeInTheDocument();
    });
  });

  describe('2. Deterministic Related Roles Engine (Universal Across All Roles)', () => {
    it('returns at most 3 related career paths for any role in the catalogue', () => {
      CAREER_CATALOGUE.forEach((path) => {
        const related = getRelatedCareerPaths(path, CAREER_CATALOGUE, 3);
        expect(related.length).toBeLessThanOrEqual(3);
        expect(related.length).toBeGreaterThan(0);
        // Does not include itself
        expect(related.some((r) => r.id === path.id)).toBe(false);
      });
    });

    it('is completely deterministic and repeatable across multiple runs', () => {
      const frontend = getCareerPathBySlug('frontend-developer')!;
      const run1 = getRelatedCareerPaths(frontend, CAREER_CATALOGUE, 3).map((r) => r.id);
      const run2 = getRelatedCareerPaths(frontend, CAREER_CATALOGUE, 3).map((r) => r.id);
      expect(run1).toEqual(run2);
    });

    it('produces valid related roles for Frontend Developer', () => {
      const frontend = getCareerPathBySlug('frontend-developer')!;
      const related = getRelatedCareerPaths(frontend, CAREER_CATALOGUE, 3);
      expect(related.length).toBe(3);
      const slugs = related.map((r) => r.slug);
      expect(slugs.some((s) => s === 'full-stack-developer' || s === 'ui-ux-designer' || s === 'mobile-developer')).toBe(true);
    });

    it('produces valid related roles for AI Engineer', () => {
      const aiEng = getCareerPathBySlug('ai-engineer')!;
      const related = getRelatedCareerPaths(aiEng, CAREER_CATALOGUE, 3);
      expect(related.length).toBe(3);
      const slugs = related.map((r) => r.slug);
      const hasAiOverlap = slugs.some((s) =>
        ['generative-ai-engineer', 'llm-application-engineer', 'rag-engineer', 'machine-learning-engineer', 'mlops-engineer'].includes(s)
      );
      expect(hasAiOverlap).toBe(true);
    });

    it('produces valid related roles for UI/UX Designer', () => {
      const uiUx = getCareerPathBySlug('ui-ux-designer')!;
      const related = getRelatedCareerPaths(uiUx, CAREER_CATALOGUE, 3);
      expect(related.length).toBe(3);
      const slugs = related.map((r) => r.slug);
      expect(slugs.some((s) => ['product-designer', 'ux-researcher', 'frontend-developer'].includes(s))).toBe(true);
    });

    it('produces valid related roles for Data Analyst', () => {
      const dataAnalyst = getCareerPathBySlug('data-analyst')!;
      const related = getRelatedCareerPaths(dataAnalyst, CAREER_CATALOGUE, 3);
      expect(related.length).toBe(3);
      const slugs = related.map((r) => r.slug);
      expect(slugs.some((s) => ['business-intelligence-analyst', 'data-engineer', 'data-scientist'].includes(s))).toBe(true);
    });
  });

  describe('3. Dynamic Role Preview Hero & PathBuilder Active State', () => {
    it('renders the active role preview hero and 3 related roles when a role is selected', () => {
      const frontend = getCareerPathBySlug('frontend-developer')!;
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          selectedRoleId: frontend.numericId,
          hasSelectedRole: true,
          profile: { displayName: 'Tester', targetRoleId: frontend.numericId, targetRoleSlug: frontend.slug },
        })
      );

      render(
        <MemoryRouter initialEntries={['/paths/builder']}>
          <CareerProvider>
            <PathBuilder />
          </CareerProvider>
        </MemoryRouter>
      );

      // Role Preview Hero
      expect(screen.getByRole('heading', { level: 1, name: /Frontend Developer/i })).toBeInTheDocument();
      expect(screen.getByText(/ACTIVE TARGET ROLE/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /View Custom Roadmap/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Take Diagnostic Assessment/i })).toBeInTheDocument();

      // Related roles heading
      expect(screen.getByRole('heading', { name: /RELATED CAREER DIRECTIONS FOR FRONTEND DEVELOPER/i })).toBeInTheDocument();

      // 5-phase staged curriculum below hero
      expect(screen.getByRole('heading', { name: /5-Phase Path for Frontend Developer/i })).toBeInTheDocument();
      expect(screen.getByText(/PHASE 01: FOUNDATIONS/i)).toBeInTheDocument();
    });

    it('renders active role for non-seed role such as Generative AI Engineer (numericId: 20)', () => {
      const genAi = getCareerPathBySlug('generative-ai-engineer')!;
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          selectedRoleId: genAi.numericId,
          hasSelectedRole: true,
          profile: { displayName: 'Tester', targetRoleId: genAi.numericId, targetRoleSlug: genAi.slug },
        })
      );

      render(
        <MemoryRouter initialEntries={['/paths/builder']}>
          <CareerProvider>
            <PathBuilder />
          </CareerProvider>
        </MemoryRouter>
      );

      expect(screen.getByRole('heading', { level: 1, name: /Generative AI Engineer/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /RELATED CAREER DIRECTIONS FOR GENERATIVE AI ENGINEER/i })).toBeInTheDocument();
    });

    it('allows toggling open the secondary 33-career catalogue without losing active role focus', () => {
      const frontend = getCareerPathBySlug('frontend-developer')!;
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          selectedRoleId: frontend.numericId,
          hasSelectedRole: true,
          profile: { displayName: 'Tester', targetRoleId: frontend.numericId, targetRoleSlug: frontend.slug },
        })
      );

      render(
        <MemoryRouter initialEntries={['/paths/builder']}>
          <CareerProvider>
            <PathBuilder />
          </CareerProvider>
        </MemoryRouter>
      );

      const toggleCatalogueBtn = screen.getByRole('button', { name: /Explore All 33 Careers/i });
      fireEvent.click(toggleCatalogueBtn);

      expect(screen.getByRole('tab', { name: /Software & Engineering/i })).toBeInTheDocument();
    });
  });

  describe('4. Active State Roadmap Execution', () => {
    it('renders target path header, effort summary, and current milestone when role is selected', () => {
      const frontend = getCareerPathBySlug('frontend-developer')!;
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          selectedRoleId: frontend.numericId,
          hasSelectedRole: true,
          profile: { displayName: 'Tester', targetRoleId: frontend.numericId, hoursPerWeek: 10 },
        })
      );

      render(
        <MemoryRouter initialEntries={['/roadmap']}>
          <CareerProvider>
            <Roadmap />
          </CareerProvider>
        </MemoryRouter>
      );

      expect(screen.getByText(/TARGET PATH \/ FRONTEND DEVELOPER/i)).toBeInTheDocument();
      expect(screen.getByText(/10 HRS \/ WEEK/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /reschedule or re-budget study plan/i })).toBeInTheDocument();
      expect(screen.getByText(/Estimated Plan Completion/i)).toBeInTheDocument();
    });
  });

  describe('5. Accessibility & Touch Targets', () => {
    it('renders role selector options with min-height >= 44px and role="option"', () => {
      render(
        <MemoryRouter initialEntries={['/paths/builder']}>
          <CareerProvider>
            <PathBuilder />
          </CareerProvider>
        </MemoryRouter>
      );

      // Open selector dropdown via trigger button
      const trigger = screen.getByRole('button', { name: /No role selected/i });
      expect(trigger).toHaveAttribute('aria-haspopup', 'listbox');
      fireEvent.click(trigger);

      const options = screen.getAllByRole('option');
      expect(options.length).toBe(CAREER_CATALOGUE.length);

      // Verify touch target min-height inline style
      expect(options[0].style.minHeight).toBe('44px');
    });
  });
});
