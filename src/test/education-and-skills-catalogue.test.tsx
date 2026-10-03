import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { EDUCATION_CATALOGUE } from '../data/educationCatalogue';
import { SKILLS_CATALOGUE, getSkillBySlug } from '../data/skillCatalogue';
import { LearnerContextIntake } from '../components/LearnerContextIntake';
import type { UserProfile } from '../types';

function TestIntakeWrapper({ initialProfile = {} }: { initialProfile?: Partial<UserProfile> }) {
  const [profile, setProfile] = useState<Partial<UserProfile>>({
    displayName: 'Test Learner',
    learnerStage: 'undergraduate',
    degree: 'BTech / BE',
    branch: 'Computer Science & Engineering',
    studyYear: '3rd Year',
    currentSkills: ['Python', 'SQL'],
    interests: ['backend', 'software-development'],
    ...initialProfile,
  });

  return (
    <MemoryRouter>
      <LearnerContextIntake
        profile={profile}
        onChange={(updates) => setProfile((prev) => ({ ...prev, ...updates }))}
      />
    </MemoryRouter>
  );
}

describe('Prompt 4 — Degree, Specialization & Unified Skill Catalogue', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('A & B. Education Catalogue Coverage & Data Contract', () => {
    it('contains all required fields in every education catalogue entry', () => {
      expect(EDUCATION_CATALOGUE.length).toBeGreaterThanOrEqual(80);

      EDUCATION_CATALOGUE.forEach((entry) => {
        expect(entry.id).toBeDefined();
        expect(entry.id.length).toBeGreaterThan(0);
        expect(['school', 'diploma', 'undergraduate', 'postgraduate', 'professional']).toContain(entry.level);
        expect(entry.degreeTitle).toBeDefined();
        expect(entry.specializationTitle).toBeDefined();
        expect(entry.label).toBeDefined();
        expect(Array.isArray(entry.aliases)).toBe(true);
        expect(Array.isArray(entry.compatibleLearnerStages)).toBe(true);
        expect(entry.compatibleLearnerStages.length).toBeGreaterThan(0);
        expect(Array.isArray(entry.relatedAcademicContextIds)).toBe(true);
        expect(Array.isArray(entry.relatedCareerPathIds)).toBe(true);
        expect(entry.source).toBeDefined();
        expect(entry.version).toBeDefined();
        expect(typeof entry.active).toBe('boolean');
      });
    });

    it('covers School streams including PCM, PCB, PCMB, Commerce, Arts, Vocational and CS elective', () => {
      const schoolEntries = EDUCATION_CATALOGUE.filter((e) => e.level === 'school');
      const specs = schoolEntries.map((e) => e.specializationTitle.toLowerCase());

      expect(specs.some((s) => s.includes('pcm') && s.includes('computer science'))).toBe(true);
      expect(specs.some((s) => s.includes('pcm') && !s.includes('computer science'))).toBe(true);
      expect(specs.some((s) => s.includes('pcb'))).toBe(true);
      expect(specs.some((s) => s.includes('pcmb'))).toBe(true);
      expect(specs.some((s) => s.includes('commerce'))).toBe(true);
      expect(specs.some((s) => s.includes('arts'))).toBe(true);
      expect(specs.some((s) => s.includes('vocational'))).toBe(true);
    });

    it('covers Diploma and vocational engineering disciplines', () => {
      const diplomaEntries = EDUCATION_CATALOGUE.filter((e) => e.level === 'diploma');
      const specs = diplomaEntries.map((e) => e.specializationTitle.toLowerCase());

      expect(specs.some((s) => s.includes('computer engineering'))).toBe(true);
      expect(specs.some((s) => s.includes('information technology'))).toBe(true);
      expect(specs.some((s) => s.includes('electronics'))).toBe(true);
      expect(specs.some((s) => s.includes('electrical'))).toBe(true);
      expect(specs.some((s) => s.includes('mechanical'))).toBe(true);
      expect(specs.some((s) => s.includes('civil'))).toBe(true);
      expect(specs.some((s) => s.includes('business applications') || s.includes('data'))).toBe(true);
    });

    it('covers Computer Science and software degrees (BTech, BCA, BSc, MCA, MSc, MTech)', () => {
      const csEntries = EDUCATION_CATALOGUE.filter(
        (e) =>
          e.degreeTitle.includes('BTech') ||
          e.degreeTitle === 'BCA' ||
          e.degreeTitle === 'BSc' ||
          e.degreeTitle === 'MCA' ||
          e.degreeTitle === 'MSc' ||
          e.degreeTitle.includes('MTech')
      );
      const labels = csEntries.map((e) => e.label.toLowerCase());

      expect(labels.some((l) => l.includes('btech') && l.includes('computer science'))).toBe(true);
      expect(labels.some((l) => l.includes('btech') && l.includes('artificial intelligence'))).toBe(true);
      expect(labels.some((l) => l.includes('btech') && l.includes('machine learning'))).toBe(true);
      expect(labels.some((l) => l.includes('btech') && l.includes('data science'))).toBe(true);
      expect(labels.some((l) => l.includes('btech') && l.includes('cybersecurity'))).toBe(true);
      expect(labels.some((l) => l.includes('btech') && l.includes('software engineering'))).toBe(true);
      expect(labels.some((l) => l.includes('bca') && l.includes('data analytics'))).toBe(true);
      expect(labels.some((l) => l.includes('bca') && l.includes('cloud'))).toBe(true);
      expect(labels.some((l) => l.includes('bca') && l.includes('ai/ml'))).toBe(true);
      expect(labels.some((l) => l.includes('bsc') && l.includes('computer science'))).toBe(true);
      expect(labels.some((l) => l.includes('bsc') && l.includes('data science'))).toBe(true);
      expect(labels.some((l) => l.includes('bsc') && l.includes('statistics'))).toBe(true);
      expect(labels.some((l) => l.includes('mca'))).toBe(true);
      expect(labels.some((l) => l.includes('msc') && l.includes('computer science'))).toBe(true);
      expect(labels.some((l) => l.includes('mtech') && l.includes('ai/ml'))).toBe(true);
    });

    it('covers Electronics, Core Engineering, Commerce, Arts and Generic Options', () => {
      const labels = EDUCATION_CATALOGUE.map((e) => e.label.toLowerCase());

      // Electronics
      expect(labels.some((l) => l.includes('ece') || l.includes('electronics'))).toBe(true);
      expect(labels.some((l) => l.includes('embedded systems'))).toBe(true);
      expect(labels.some((l) => l.includes('vlsi'))).toBe(true);
      expect(labels.some((l) => l.includes('robotics'))).toBe(true);
      expect(labels.some((l) => l.includes('iot'))).toBe(true);

      // Core Engineering
      expect(labels.some((l) => l.includes('mechanical engineering'))).toBe(true);
      expect(labels.some((l) => l.includes('civil engineering'))).toBe(true);
      expect(labels.some((l) => l.includes('chemical engineering'))).toBe(true);
      expect(labels.some((l) => l.includes('automobile engineering'))).toBe(true);
      expect(labels.some((l) => l.includes('architecture'))).toBe(true);

      // Commerce & Business
      expect(labels.some((l) => l.includes('bcom') && l.includes('fintech'))).toBe(true);
      expect(labels.some((l) => l.includes('bba') && l.includes('business analytics'))).toBe(true);
      expect(labels.some((l) => l.includes('mba') && l.includes('product management'))).toBe(true);
      expect(labels.some((l) => l.includes('mba') && l.includes('business analytics'))).toBe(true);

      // Arts & Design
      expect(labels.some((l) => l.includes('bdes') && l.includes('ui/ux'))).toBe(true);
      expect(labels.some((l) => l.includes('ba') && l.includes('economics'))).toBe(true);
      expect(labels.some((l) => l.includes('ba') && l.includes('psychology'))).toBe(true);

      // Generic
      expect(labels.some((l) => l.includes('self-taught'))).toBe(true);
      expect(labels.some((l) => l.includes('career switcher'))).toBe(true);
      expect(labels.some((l) => l.includes('other degree') || l.includes('not listed'))).toBe(true);
    });
  });

  describe('C. Canonical Skill Catalogue Coverage', () => {
    it('covers all 48 required skill domains with exact slug matching and evidence types', () => {
      expect(SKILLS_CATALOGUE.length).toBeGreaterThanOrEqual(48);

      const requiredSlugs = [
        'programming',
        'data-structures',
        'algorithms',
        'python',
        'javascript',
        'typescript',
        'java',
        'cpp',
        'sql',
        'rest-apis',
        'databases',
        'frontend',
        'react',
        'accessibility',
        'testing',
        'git',
        'linux',
        'docker',
        'cloud',
        'devops',
        'cybersecurity',
        'networking',
        'embedded',
        'microcontrollers',
        'electronics-protocols',
        'data-cleaning',
        'statistics',
        'visualization',
        'excel',
        'bi',
        'machine-learning',
        'deep-learning',
        'nlp',
        'computer-vision',
        'genai',
        'llm-application-development',
        'prompt-testing',
        'embeddings',
        'vector-search',
        'rag',
        'evaluation',
        'ai-safety',
        'ui-ux',
        'figma',
        'user-research',
        'product-management',
        'business-analysis',
        'technical-writing',
        'communication',
        'portfolio-project-evidence',
      ];

      requiredSlugs.forEach((slug) => {
        const skill = getSkillBySlug(slug);
        expect(skill, `Missing canonical skill for slug '${slug}'`).toBeDefined();
        expect(skill?.name.length).toBeGreaterThan(0);
        expect(skill?.description.length).toBeGreaterThan(15);
        expect(skill?.evidenceTypes.length).toBeGreaterThan(0);
      });
    });
  });

  describe('D. UI Behavior in LearnerContextIntake', () => {
    it('renders the EducationSelector for undergraduate learners', () => {
      render(<TestIntakeWrapper initialProfile={{ learnerStage: 'undergraduate' }} />);

      expect(screen.getByRole('combobox', { name: /Academic Degree & Specialization/i })).toBeInTheDocument();
      expect(screen.getByText(/88 Catalogue Specializations/i)).toBeInTheDocument();
    });

    it('opens dropdown, supports search, and filters degree entries', async () => {
      render(<TestIntakeWrapper initialProfile={{ learnerStage: 'undergraduate' }} />);

      const combobox = screen.getByRole('combobox', { name: /Academic Degree & Specialization/i });
      fireEvent.click(combobox);

      const searchInput = screen.getByPlaceholderText(/Search degree or specialization/i);
      expect(searchInput).toBeInTheDocument();

      // Search for Data Science
      fireEvent.change(searchInput, { target: { value: 'Data Science' } });

      await waitFor(() => {
        expect(screen.getAllByText('Data Science').length).toBeGreaterThan(0);
        expect(screen.getByText('BTech / BE')).toBeInTheDocument();
        expect(screen.getByText('BSc')).toBeInTheDocument();
      });
    });

    it('shows school stream controls and hides degree dropdown for school learners', () => {
      render(<TestIntakeWrapper initialProfile={{ learnerStage: 'class_11_12' }} />);

      expect(screen.getByText(/School Academic Context/i)).toBeInTheDocument();
      expect(screen.getByText(/Mathematics \/ PCM/i)).toBeInTheDocument();
      expect(screen.queryByRole('combobox', { name: /Academic Degree & Specialization/i })).not.toBeInTheDocument();
    });

    it('does not force a formal degree on self-taught learners', () => {
      render(<TestIntakeWrapper initialProfile={{ learnerStage: 'self_taught' }} />);

      expect(screen.getByText(/Self-Taught & Independent Learning Horizon/i)).toBeInTheDocument();
      expect(screen.getByText(/Formal college degrees are/i)).toBeInTheDocument();
      // Optional background selector available without mandatory asterisks
      expect(screen.getByText(/Prior Degree or Academic Discipline \(optional\)/i)).toBeInTheDocument();
    });

    it('allows entering a custom/unlisted degree when not found in catalogue', async () => {
      render(<TestIntakeWrapper initialProfile={{ learnerStage: 'undergraduate' }} />);

      const combobox = screen.getByRole('combobox', { name: /Academic Degree & Specialization/i });
      fireEvent.click(combobox);

      const searchInput = screen.getByPlaceholderText(/Search degree or specialization/i);
      fireEvent.change(searchInput, { target: { value: 'Nonexistent Degree 12345' } });

      await waitFor(() => {
        expect(screen.getByText(/Add as Custom \/ Unlisted Degree/i)).toBeInTheDocument();
      });

      const addBtn = screen.getByText(/Add as Custom \/ Unlisted Degree/i);
      fireEvent.click(addBtn);

      const confirmBtn = screen.getByRole('button', { name: /Confirm Custom Degree/i });
      expect(confirmBtn).toBeInTheDocument();
    });

    it('renders skills from SKILLS_CATALOGUE with search filtering', async () => {
      render(<TestIntakeWrapper initialProfile={{ learnerStage: 'undergraduate' }} />);

      const skillSearchInput = screen.getByPlaceholderText(/Search canonical skill catalogue/i);
      expect(skillSearchInput).toBeInTheDocument();

      // Search for 'Figma'
      fireEvent.change(skillSearchInput, { target: { value: 'Figma' } });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Figma/i })).toBeInTheDocument();
      });

      // Search for 'RAG'
      fireEvent.change(skillSearchInput, { target: { value: 'RAG' } });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /RAG/i })).toBeInTheDocument();
      });
    });
  });
});
