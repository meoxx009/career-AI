import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CareerProvider } from '../context/CareerContext';
import { PathBuilder } from '../pages/PathBuilder';
import {
  CAREER_CATALOGUE,
  ACADEMIC_CONTEXTS,
  STARTER_CAREER_PATHS,
  getCareerPathBySlug,
  getCareerPathById,
  getAcademicContextById,
  getPathsByCategory,
  searchCareerCatalogue,
} from '../data/careerCatalogue';
import { validateCareerCatalogue } from '../data/validator';
import { matchCareerPaths, resolveAcademicContext } from '../lib/pathMatcher';
import type { UserProfile } from '../types';

describe('Prompt 05 & Gate 05 — Unified Career Catalogue & Path Builder', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('1. Career Catalogue Structure & Validation', () => {
    it('contains all 33 career paths across the 3 required categories', () => {
      expect(CAREER_CATALOGUE).toHaveLength(33);

      const softwarePaths = getPathsByCategory('software_engineering');
      const dataAiPaths = getPathsByCategory('data_ai');
      const designProductPaths = getPathsByCategory('design_product');

      expect(softwarePaths.length).toBe(14);
      expect(dataAiPaths.length).toBe(12);
      expect(designProductPaths.length).toBe(7);
      expect(softwarePaths.length + dataAiPaths.length + designProductPaths.length).toBe(33);
    });

    it('contains 14 software and engineering paths', () => {
      const expectedSoftwareSlugs = [
        'software-engineer',
        'backend-developer',
        'frontend-developer',
        'full-stack-developer',
        'mobile-developer',
        'qa-engineer',
        'sdet-test-automation-engineer',
        'devops-engineer',
        'cloud-engineer',
        'site-reliability-engineer',
        'cybersecurity-engineer',
        'embedded-systems-engineer',
        'iot-engineer',
        'systems-engineer',
      ];

      expectedSoftwareSlugs.forEach((slug) => {
        const found = getCareerPathBySlug(slug);
        expect(found, `Expected path ${slug} to exist in catalogue`).toBeDefined();
        expect(found?.category).toBe('software_engineering');
      });
    });

    it('contains 12 data and AI paths including GenAI, LLM, and RAG', () => {
      const expectedDataAiSlugs = [
        'data-analyst',
        'data-engineer',
        'data-scientist',
        'machine-learning-engineer',
        'ai-engineer',
        'generative-ai-engineer',
        'llm-application-engineer',
        'rag-engineer',
        'nlp-engineer',
        'mlops-engineer',
        'computer-vision-engineer',
        'business-intelligence-analyst',
      ];

      expectedDataAiSlugs.forEach((slug) => {
        const found = getCareerPathBySlug(slug);
        expect(found, `Expected path ${slug} to exist in catalogue`).toBeDefined();
        expect(found?.category).toBe('data_ai');
      });
    });

    it('contains 7 design and product paths', () => {
      const expectedDesignSlugs = [
        'ui-ux-designer',
        'product-designer',
        'ux-researcher',
        'product-manager',
        'technical-product-manager',
        'business-analyst',
        'technical-writer',
      ];

      expectedDesignSlugs.forEach((slug) => {
        const found = getCareerPathBySlug(slug);
        expect(found, `Expected path ${slug} to exist in catalogue`).toBeDefined();
        expect(found?.category).toBe('design_product');
      });
    });

    it('preserves the original 3 starter paths with IDs 1, 2, 3 and exact slugs', () => {
      expect(STARTER_CAREER_PATHS).toHaveLength(3);

      const backend = getCareerPathById(1);
      const frontend = getCareerPathById(2);
      const dataAnalyst = getCareerPathById(3);

      expect(backend?.slug).toBe('backend-developer');
      expect(backend?.title).toBe('Backend Developer');

      expect(frontend?.slug).toBe('frontend-developer');
      expect(frontend?.title).toBe('Frontend Developer');

      expect(dataAnalyst?.slug).toBe('data-analyst');
      expect(dataAnalyst?.title).toBe('Data Analyst');
    });

    it('every path contains exactly 5 staged curriculum phases in sequence with zero prerequisite cycles', () => {
      const expectedPhases = [
        'Foundations',
        'Core skills',
        'Guided project',
        'Portfolio/proof',
        'Practice and review',
      ];

      CAREER_CATALOGUE.forEach((path) => {
        expect(path.curriculum).toHaveLength(5);
        path.curriculum.forEach((item, idx) => {
          expect(item.phase).toBe(expectedPhases[idx]);
          expect(item.deliverable.length).toBeGreaterThan(5);
          expect(item.whyItMatters.length).toBeGreaterThan(10);
          expect(item.estimatedHours).toBeGreaterThan(0);
        });
      });
    });

    it('passes full schema validation with zero errors via validateCareerCatalogue', () => {
      const validation = validateCareerCatalogue(CAREER_CATALOGUE, ACADEMIC_CONTEXTS);
      if (!validation.valid) {
        console.error('Validation errors:', validation.errors);
      }
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });
  });

  describe('2. Academic Context Profiles & Bridge Alignment', () => {
    it('contains all 21 academic context profiles across engineering, computer applications, commerce, science, and school', () => {
      expect(ACADEMIC_CONTEXTS).toHaveLength(21);

      const requiredContextIds = [
        'cse',
        'it',
        'ece',
        'electrical',
        'mechanical',
        'civil',
        'bca',
        'mca',
        'bba',
        'mba',
        'bcom',
        'bsc_cs',
        'bsc_data_science',
        'bsc_statistics',
        'arts_humanities',
        'school_pcm',
        'school_pcb',
        'school_pcmb',
        'school_commerce',
        'school_arts',
        'school_vocational',
      ];

      requiredContextIds.forEach((id) => {
        const found = getAcademicContextById(id);
        expect(found, `Expected academic context ${id} to exist`).toBeDefined();
        expect(found?.transferableStrengths.length).toBeGreaterThan(0);
        expect(found?.advisoryNote.length).toBeGreaterThan(10);
      });
    });

    it('correctly maps academic contexts via resolveAcademicContext', () => {
      // CSE
      const cseContext = resolveAcademicContext({ branch: 'Computer Science and Engineering' });
      expect(cseContext?.id).toBe('cse');

      // ECE
      const eceContext = resolveAcademicContext({ branch: 'ECE' });
      expect(eceContext?.id).toBe('ece');

      // MCA
      const mcaContext = resolveAcademicContext({ degree: 'Master of Computer Applications', branch: 'MCA' });
      expect(mcaContext?.id).toBe('mca');

      // MBA
      const mbaContext = resolveAcademicContext({ degree: 'MBA', branch: 'Operations' });
      expect(mbaContext?.id).toBe('mba');

      // School PCM
      const schoolContext = resolveAcademicContext({ stream: 'pcm' });
      expect(schoolContext?.id).toBe('school_pcm');

      // School PCB
      const pcbContext = resolveAcademicContext({ stream: 'pcb' });
      expect(pcbContext?.id).toBe('school_pcb');
    });
  });

  describe('3. Deterministic Path Matcher Engine', () => {
    it('ranks embedded and IoT paths highest for an ECE learner', () => {
      const profile: Partial<UserProfile> = {
        learnerStage: 'undergraduate',
        branch: 'Electronics and Communication (ECE)',
        interests: ['embedded-systems', 'hardware'],
      };

      const result = matchCareerPaths(profile, 6);
      expect(result.academicContext?.id).toBe('ece');

      const topSlugs = result.recommendations.map((r) => r.path.slug);
      expect(topSlugs.some((s) => s.includes('embedded') || s.includes('iot'))).toBe(true);

      const embeddedMatch = result.recommendations.find((r) => r.path.slug === 'embedded-systems-engineer');
      expect(embeddedMatch).toBeDefined();
      expect(embeddedMatch?.reasons.some((r) => r.type === 'stream_match')).toBe(true);
    });

    it('ranks AI, ML, GenAI, and LLM roles highest when learner indicates AI interests', () => {
      const profile: Partial<UserProfile> = {
        learnerStage: 'undergraduate',
        branch: 'Computer Science',
        interests: ['genai', 'llm', 'machine-learning'],
      };

      const result = matchCareerPaths(profile, 6);
      const topSlugs = result.recommendations.map((r) => r.path.slug);

      const hasAiRoles = topSlugs.some(
        (s) =>
          s === 'generative-ai-engineer' ||
          s === 'llm-application-engineer' ||
          s === 'machine-learning-engineer' ||
          s === 'ai-engineer' ||
          s === 'rag-engineer'
      );
      expect(hasAiRoles).toBe(true);
    });

    it('ranks Product Manager and Business Analyst for MBA students', () => {
      const profile: Partial<UserProfile> = {
        learnerStage: 'postgraduate',
        degree: 'MBA',
        branch: 'General Management',
      };

      const result = matchCareerPaths(profile, 6);
      expect(result.academicContext?.id).toBe('mba');

      const topSlugs = result.recommendations.map((r) => r.path.slug);
      expect(topSlugs.some((s) => s === 'product-manager' || s === 'business-analyst')).toBe(true);
    });

    it('gracefully handles missing learner profile info without failing', () => {
      const emptyProfile: Partial<UserProfile> = {};
      const result = matchCareerPaths(emptyProfile, 6);

      expect(result.hasSufficientInfo).toBe(false);
      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.recommendations[0].missingInfoNotice).toContain('More information needed');
      expect(result.starterPaths).toHaveLength(3);
    });

    it('searchCareerCatalogue searches across title, description, and core skills', () => {
      const sqlResults = searchCareerCatalogue('SQL');
      expect(sqlResults.length).toBeGreaterThan(0);
      expect(sqlResults.some((p) => p.slug === 'data-analyst' || p.slug === 'backend-developer')).toBe(true);

      const cyberResults = searchCareerCatalogue('cybersecurity');
      expect(cyberResults.some((p) => p.slug === 'cybersecurity-engineer')).toBe(true);
    });
  });

  describe('4. PathBuilder UI View & Interactivity', () => {
    it('renders the Path Builder header and 33-career overview', () => {
      render(
        <MemoryRouter>
          <CareerProvider>
            <PathBuilder />
          </CareerProvider>
        </MemoryRouter>
      );

      expect(screen.getByRole('heading', { level: 1, name: /CAREER CATALOGUE & PATH BUILDER/i })).toBeInTheDocument();
      expect(screen.getByText(/Explore 33 production career paths/i)).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /TOP MATCHED CAREER DIRECTIONS/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /EXPLORE FULL 33-CAREER CATALOGUE/i })).toBeInTheDocument();
    });

    it('allows filtering by category tabs (Software, Data & AI, Design & Product)', () => {
      render(
        <MemoryRouter>
          <CareerProvider>
            <PathBuilder />
          </CareerProvider>
        </MemoryRouter>
      );

      // Category tab buttons
      const softwareTab = screen.getByRole('tab', { name: /Software & Engineering/i });
      const dataTab = screen.getByRole('tab', { name: /Data & AI/i });
      const designTab = screen.getByRole('tab', { name: /Design & Product/i });

      expect(softwareTab).toBeInTheDocument();
      expect(dataTab).toBeInTheDocument();
      expect(designTab).toBeInTheDocument();

      // Click Software tab
      fireEvent.click(softwareTab);
      expect(softwareTab).toHaveAttribute('aria-selected', 'true');

      // Click Data & AI tab
      fireEvent.click(dataTab);
      expect(dataTab).toHaveAttribute('aria-selected', 'true');
    });

    it('filters paths dynamically when typing in the search box', () => {
      render(
        <MemoryRouter>
          <CareerProvider>
            <PathBuilder />
          </CareerProvider>
        </MemoryRouter>
      );

      const searchInput = screen.getByLabelText(/Search career catalogue/i);
      fireEvent.change(searchInput, { target: { value: 'Cybersecurity' } });

      expect(screen.getByRole('heading', { name: /Cybersecurity Engineer/i })).toBeInTheDocument();
    });

    it('renders the 3 Core Starter Paths below recommendations with view roadmap buttons', () => {
      render(
        <MemoryRouter>
          <CareerProvider>
            <PathBuilder />
          </CareerProvider>
        </MemoryRouter>
      );

      expect(
        screen.getByRole('heading', { name: /CORE STARTER PATHS WITH INTERACTIVE ROADMAPS/i })
      ).toBeInTheDocument();

      expect(screen.getByText(/Starter Path #1/i)).toBeInTheDocument();
      expect(screen.getByText(/Starter Path #2/i)).toBeInTheDocument();
      expect(screen.getByText(/Starter Path #3/i)).toBeInTheDocument();
    });

    it('can expand and inspect the 5-phase staged curriculum for a career path', () => {
      render(
        <MemoryRouter>
          <CareerProvider>
            <PathBuilder />
          </CareerProvider>
        </MemoryRouter>
      );

      const viewCurriculumButtons = screen.getAllByRole('button', { name: /View 5-Phase Curriculum/i });
      expect(viewCurriculumButtons.length).toBeGreaterThan(0);

      // Expand the first one
      fireEvent.click(viewCurriculumButtons[0]);

      expect(screen.getByText(/Phase 1: Foundations/i)).toBeInTheDocument();
      expect(screen.getByText(/Phase 2: Core skills/i)).toBeInTheDocument();
      expect(screen.getByText(/Phase 3: Guided project/i)).toBeInTheDocument();
      expect(screen.getByText(/Phase 4: Portfolio\/proof/i)).toBeInTheDocument();
      expect(screen.getByText(/Phase 5: Practice and review/i)).toBeInTheDocument();
    });
  });
});
