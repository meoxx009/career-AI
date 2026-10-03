import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { CareerProvider } from '../context/CareerContext';
import { STORAGE_KEY, EMPTY_PROFILE } from '../context/careerConstants';
import { Onboarding } from '../pages/Onboarding';
import { Assessment } from '../pages/Assessment';
import {
  SEED_ASSESSMENT_QUESTIONS,
  SEED_ROLE_SKILL_REQUIREMENTS,
} from '../data/seedData';
import {
  scoreAssessmentAnswers,
  buildSkillObservations,
  calculateRoleCoverage,
  calculateAssessedAlignment,
} from '../lib/scoring';
import { DEMO_RAHUL_PROFILE } from '../data/demoRahul';

function renderFlow(initialEntry: string) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <CareerProvider>
        <Routes>
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/assessment" element={<Assessment />} />
          <Route path="/dashboard" element={<div>Dashboard Page</div>} />
          <Route path="/paths" element={<div>Paths Page</div>} />
          <Route path="/" element={<div>Home Overview</div>} />
        </Routes>
      </CareerProvider>
    </MemoryRouter>
  );
}

describe('Prompt 06: Onboarding and Assessment User Flow Tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('1. Empty Start & Rahul Independence', () => {
    it('starts fresh with empty profile and null observations when localStorage is clear', () => {
      renderFlow('/onboarding');

      // Does not show Rahul's profile data
      expect(screen.queryByDisplayValue(DEMO_RAHUL_PROFILE.displayName)).toBeNull();
      // Branch and study year start unselected
      expect(screen.getByRole('combobox', { name: /academic degree \/ branch/i })).toHaveProperty('value', '');
      expect(screen.getByRole('combobox', { name: /current academic year/i })).toHaveProperty('value', '');

      // Check default empty state constant
      expect(EMPTY_PROFILE.displayName).toBe('');
      expect(EMPTY_PROFILE.isGuestDemo).toBe(false);
    });

    it('does not inherit Rahul observations for a fresh session', () => {
      const scores = scoreAssessmentAnswers(SEED_ASSESSMENT_QUESTIONS, {});
      const observations = buildSkillObservations(scores);

      // Every single skill must be null (unassessed)
      observations.forEach(obs => {
        expect(obs.value).toBeNull();
      });
    });
  });

  describe('2. Onboarding Form Validation & Controls', () => {
    it('validates required fields on step 1 and blocks continue until valid', async () => {
      renderFlow('/onboarding');

      const continueBtn = screen.getByRole('button', { name: /continue/i });
      fireEvent.click(continueBtn);

      // Inline validation errors appear
      expect(screen.getByText(/please select your academic branch/i)).toBeDefined();
      expect(screen.getByText(/please select your current academic year/i)).toBeDefined();

      // Select valid branch and year
      const branchSelect = screen.getByRole('combobox', { name: /academic degree \/ branch/i });
      fireEvent.change(branchSelect, { target: { value: 'Computer Science & Engineering' } });

      const yearSelect = screen.getByRole('combobox', { name: /current academic year/i });
      fireEvent.change(yearSelect, { target: { value: '3rd Year' } });

      // Click continue to advance to Step 2
      fireEvent.click(continueBtn);
      expect(screen.getByText(/WEEKLY DEDICATED STUDY COMMITMENT/i)).toBeDefined();
      expect(screen.getByText(/02\/03/i)).toBeDefined();
    });

    it('validates study hours on step 2 (must be between 1 and 40)', async () => {
      renderFlow('/onboarding');

      // Complete step 1
      fireEvent.change(screen.getByRole('combobox', { name: /academic degree \/ branch/i }), {
        target: { value: 'Information Technology' },
      });
      fireEvent.change(screen.getByRole('combobox', { name: /current academic year/i }), {
        target: { value: '2nd Year' },
      });
      fireEvent.click(screen.getByRole('button', { name: /continue/i }));

      // Test invalid hours (e.g. 50 or 0)
      const hoursInput = screen.getByRole('spinbutton', { name: /weekly dedicated study commitment/i });
      fireEvent.change(hoursInput, { target: { value: '55' } });

      const continueBtn = screen.getByRole('button', { name: /continue/i });
      fireEvent.click(continueBtn);
      expect(screen.getByText(/between 1 and 40 hours/i)).toBeDefined();

      // Enter valid hours (16)
      fireEvent.change(hoursInput, { target: { value: '16' } });
      fireEvent.click(continueBtn);

      // Successfully advances to Step 3
      expect(screen.getByText(/CAREER INTERESTS/i)).toBeDefined();
      expect(screen.getByText(/03\/03/i)).toBeDefined();
    });

    it('requires at least one role selected on step 3 before starting assessment', async () => {
      renderFlow('/onboarding');

      // Fast forward through step 1 & 2
      fireEvent.change(screen.getByRole('combobox', { name: /academic degree \/ branch/i }), {
        target: { value: 'Computer Science & Engineering' },
      });
      fireEvent.change(screen.getByRole('combobox', { name: /current academic year/i }), {
        target: { value: '4th Year' },
      });
      fireEvent.click(screen.getByRole('button', { name: /continue/i }));
      fireEvent.click(screen.getByRole('button', { name: /continue/i }));

      // Step 3 with no role selected
      const startAssessmentBtn = screen.getByRole('button', { name: /start diagnostic assessment/i });
      fireEvent.click(startAssessmentBtn);
      expect(screen.getByText(/please select at least one entry role/i)).toBeDefined();

      // Toggle first role (Backend Developer)
      const roleCards = screen.getAllByRole('checkbox');
      fireEvent.click(roleCards[0]);

      // Submits successfully and navigates to assessment
      fireEvent.click(startAssessmentBtn);
      await waitFor(() => {
        expect(screen.getByText(/CHOOSE WHAT YOU WANT TO ASSESS/i)).toBeDefined();
      });
      fireEvent.click(screen.getByRole('button', { name: /start diagnostic assessment/i }));
      expect(screen.getByText(/DIAGNOSTIC \/ QUESTION 1/i)).toBeDefined();
    });

    it('treats CGPA as optional academic record and shows explicit fairness disclaimer', () => {
      renderFlow('/onboarding');

      expect(screen.getByText(/never uses cgpa as an ability signal/i)).toBeDefined();
      const cgpaInput = screen.getByLabelText(/cgpa \/ grade percentage/i);
      expect(cgpaInput).toBeDefined();
    });
  });

  describe('3. Save and Resume Functionality', () => {
    it('persists entered values to localStorage when save draft is clicked', () => {
      renderFlow('/onboarding');

      const nameInput = screen.getByLabelText(/your name or preferred handle/i);
      fireEvent.change(nameInput, { target: { value: 'Aarav Gupta' } });

      const saveDraftBtn = screen.getByRole('button', { name: /save draft/i });
      fireEvent.click(saveDraftBtn);

      const stored = localStorage.getItem(STORAGE_KEY);
      expect(stored).not.toBeNull();
      const parsed = JSON.parse(stored!);
      expect(parsed.profile.displayName).toBe('Aarav Gupta');
    });

    it('saves assessment progress and allows resuming later without losing answers', () => {
      renderFlow('/assessment');

      const startBtn = screen.getByRole('button', { name: /start diagnostic assessment/i });
      fireEvent.click(startBtn);

      // Answer Question 1 (option A)
      const optionA = screen.getByLabelText(/loop once and track seen values/i);
      fireEvent.click(optionA);

      // Save and resume later
      const saveExitBtn = screen.getByRole('button', { name: /save & resume later/i });
      fireEvent.click(saveExitBtn);

      // Verifies answer was persisted to localStorage
      const stored = localStorage.getItem(STORAGE_KEY);
      expect(stored).not.toBeNull();
      const parsed = JSON.parse(stored!);
      expect(parsed.diagnosticAnswers['q01']).toBe('a');
    });
  });

  describe('4. Unanswered vs Incorrect Answers', () => {
    it('keeps unanswered questions as unassessed (null) and does not penalize as 0', () => {
      const answers: Record<string, 'a' | 'b' | 'c' | 'd'> = {
        q01: 'a', // Correct (Skill 1)
        q02: 'd', // Incorrect (Skill 1)
        // q03 and q04 (Skill 2) left unanswered
      };

      const scoreResults = scoreAssessmentAnswers(SEED_ASSESSMENT_QUESTIONS, answers);

      const skill1Result = scoreResults.find(s => s.skillId === 1);
      const skill2Result = scoreResults.find(s => s.skillId === 2);

      // Skill 1 was attempted: diagnostic estimate is calculated
      expect(skill1Result).toBeDefined();
      expect(skill1Result?.diagnosticEstimate).not.toBeNull();

      // Skill 2 was completely unanswered: must be strictly null, NEVER 0
      expect(skill2Result).toBeDefined();
      expect(skill2Result?.unansweredCount).toBe(2);
      expect(skill2Result?.diagnosticEstimate).toBeNull();
      expect(skill2Result?.diagnosticEstimate).not.toBe(0);
    });

    it('grades all incorrect answers as measured 0, not null', () => {
      const answers: Record<string, 'a' | 'b' | 'c' | 'd'> = {
        q01: 'c', // Incorrect
        q02: 'd', // Incorrect
      };

      const scoreResults = scoreAssessmentAnswers(SEED_ASSESSMENT_QUESTIONS, answers);
      const skill1Result = scoreResults.find(s => s.skillId === 1);

      expect(skill1Result?.correctCount).toBe(0);
      expect(skill1Result?.diagnosticEstimate).toBe(0);
      expect(skill1Result?.diagnosticEstimate).not.toBeNull();
    });
  });

  describe('5. Completed Assessment Results & Required Copy', () => {
    it('displays the exact required disclaimer: "This is a short diagnostic estimate, not a certificate."', async () => {
      renderFlow('/assessment');

      const startBtn = screen.getByRole('button', { name: /start diagnostic assessment/i });
      fireEvent.click(startBtn);

      // Answer question 1 and finish via question jumper
      const optionA = screen.getByLabelText(/loop once and track seen values/i);
      fireEvent.click(optionA);

      const finishBtn = screen.getByRole('button', { name: /finish now with current answers/i });
      fireEvent.click(finishBtn);

      // Check required copy
      expect(
        screen.getByText('This is a short diagnostic estimate, not a certificate.')
      ).toBeDefined();

      // Check diagnostic estimate header
      expect(screen.getByRole('heading', { level: 1, name: /DIAGNOSTIC ESTIMATE/i })).toBeDefined();

      // Check evidence vs gaps sections
      expect(screen.getByText(/Evidence Gathered/i)).toBeDefined();
      expect(screen.getByText(/Prioritized Gaps/i)).toBeDefined();
    });

    it('generates different deterministic alignments for different answer profiles', () => {
      const reqs = SEED_ROLE_SKILL_REQUIREMENTS.filter(r => r.role_id === 1);

      // Profile 1: All correct answers for backend skills
      const allCorrectAnswers: Record<string, 'a' | 'b' | 'c' | 'd'> = {};
      SEED_ASSESSMENT_QUESTIONS.forEach(q => {
        allCorrectAnswers[q.id] = q.correct_key;
      });

      const scores1 = scoreAssessmentAnswers(SEED_ASSESSMENT_QUESTIONS, allCorrectAnswers);
      const obsMap1 = new Map<number | string, number | null>();
      buildSkillObservations(scores1).forEach(o => obsMap1.set(o.skill_id, o.value));

      const cov1 = calculateRoleCoverage(reqs, obsMap1);
      const align1 = calculateAssessedAlignment(reqs, obsMap1);

      // Profile 2: Only 3 answers correct
      const sparseAnswers: Record<string, 'a' | 'b' | 'c' | 'd'> = {
        q01: 'a',
        q02: 'b',
        q03: 'a',
      };

      const scores2 = scoreAssessmentAnswers(SEED_ASSESSMENT_QUESTIONS, sparseAnswers);
      const obsMap2 = new Map<number | string, number | null>();
      buildSkillObservations(scores2).forEach(o => obsMap2.set(o.skill_id, o.value));

      const cov2 = calculateRoleCoverage(reqs, obsMap2);
      const align2 = calculateAssessedAlignment(reqs, obsMap2);

      // Coverage and alignment must differ
      expect(cov1.coveragePercent).toBeGreaterThan(cov2.coveragePercent);
      expect(cov1.isSufficient).toBe(true);
      expect(align1.alignmentPercent).not.toBeNull();
      expect(align1.alignmentPercent).toBeGreaterThan(50);

      // Sparse answers have low coverage (< 60%), thus more-evidence-needed
      expect(cov2.isSufficient).toBe(false);
      expect(align2.state).toBe('more-evidence-needed');
      expect(align2.alignmentPercent).toBeNull();
    });
  });
});
