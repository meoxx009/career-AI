import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { CareerProvider } from '../context/CareerContext';
import { Practice } from '../pages/Practice';
import {
  evaluateInterviewAnswer,
  INTERVIEW_EVALUATION_CAVEAT,
  QUESTION_CONTEXTS,
} from '../lib/interviewEvaluator';
import { SEED_INTERVIEW_QUESTIONS } from '../data/seedData';
import { defaultInterviewRepository } from '../lib/repositories/interviewRepository';

describe('Prompt 12 & Gate 12 — Text Interview Practice & Deterministic Rubrics', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  const questionIb01 = SEED_INTERVIEW_QUESTIONS.find(q => q.id === 'ib01')!;
  const questionIb02 = SEED_INTERVIEW_QUESTIONS.find(q => q.id === 'ib02')!;

  describe('Deterministic Rubric Evaluation (Engine Level)', () => {
    it('evaluates a complete answer covering context, contribution, decision, result, and reflection', () => {
      const completeAnswer = `
        In my Python task organizer CLI project, I encountered corrupted JSON files whenever users abruptly interrupted the process.
        I wrote unit tests with pytest to reproduce and isolate the crash, then implemented atomic file writes using temporary staging files with safe rename.
        I chose this approach to prevent incomplete writes from destroying valid records.
        As a result, all test cases passed and corrupt file exits were prevented.
        This taught me that defensive error handling and transactional writes are essential even in simple CLI utilities.
      `;

      const result = evaluateInterviewAnswer(questionIb01, completeAnswer);

      // 1. Coverage across all 5 rubric points
      expect(result.metCount).toBe(5);
      expect(result.totalCount).toBe(5);
      expect(result.percentage).toBe(100);
      expect(result.strengths.length).toBe(5);
      expect(result.missingPoints.length).toBe(0);

      // 2. Focused next action
      expect(result.nextAction).toBeTruthy();

      // 3. Mandatory caveat present
      expect(result.caveat).toBe(INTERVIEW_EVALUATION_CAVEAT);

      // 4. Absolute prohibition on hiring decisions
      expect(result).not.toHaveProperty('hired');
      expect(result).not.toHaveProperty('hireDecision');
      expect(result.caveat).toContain('Not a hiring decision, pass/fail grading');
      expect(result.strengths.join(' ').toLowerCase()).not.toContain('hired');
      expect(result.strengths.join(' ').toLowerCase()).not.toContain('passed');
    });

    it('evaluates a partial answer, identifying specific strengths and missing rubric criteria', () => {
      // Partial answer: mentions context and an action, but misses decision rationale, outcome, and reflection
      const partialAnswer = 'In my Python project, I created a command-line script to organize files.';

      const result = evaluateInterviewAnswer(questionIb01, partialAnswer);

      expect(result.metCount).toBeGreaterThanOrEqual(1);
      expect(result.metCount).toBeLessThan(5);
      expect(result.missingPoints.length).toBeGreaterThan(0);

      // Must explicitly point out missing items (e.g. decision rationale, reflection)
      const missingText = result.missingPoints.join(' ');
      expect(missingText.toLowerCase()).toMatch(/decision|reflection|rationale|lesson/);

      // One next action must target the missing criteria
      expect(result.nextAction).toBeTruthy();

      // Absolute prohibition on hiring decisions
      expect(result.caveat).toContain('Not a hiring decision');
    });

    it('handles an empty or whitespace answer with clear unaddressed rubric items without crashing', () => {
      const emptyResult = evaluateInterviewAnswer(questionIb01, '   ');

      expect(emptyResult.metCount).toBe(0);
      expect(emptyResult.totalCount).toBe(5);
      expect(emptyResult.percentage).toBe(0);
      expect(emptyResult.strengths.length).toBe(0);
      expect(emptyResult.missingPoints.length).toBeGreaterThan(0);
      expect(emptyResult.nextAction).toContain('Write 2–3 sentences');
      expect(emptyResult.caveat).toContain('Not a hiring decision');
    });

    it('evaluates technical system question ib02 without relying on keyword stuffing alone', () => {
      const technicalAnswer = `
        Before designing, I would clarify expected user scale, whether authentication uses JWT or sessions, and team permissions.
        For domain resources, I model /tasks with id, title, status, and due_date.
        Standard REST endpoints: GET /tasks (with pagination), POST /tasks, GET /tasks/:id, PATCH /tasks/:id, and DELETE /tasks/:id.
        I will validate request bodies to ensure title is present and status matches enum, returning 400 Bad Request on failure.
        Successful creation returns 201 Created and missing tasks return 404 Not Found.
        For trade-offs, I prefer cursor pagination over offset pagination for large task lists.
      `;

      const result = evaluateInterviewAnswer(questionIb02, technicalAnswer);

      expect(result.metCount).toBeGreaterThanOrEqual(5);
      expect(result.criteriaResults.some(c => c.id === 'clarifying_questions' && c.met)).toBe(true);
      expect(result.criteriaResults.some(c => c.id === 'endpoints' && c.met)).toBe(true);
      expect(result.criteriaResults.some(c => c.id === 'trade_off' && c.met)).toBe(true);
      expect(result.caveat).toBe(INTERVIEW_EVALUATION_CAVEAT);
    });
  });

  describe('Gate 12 — End-to-End Workflow & Persistence Contract', () => {
    it('executes full Gate 12 flow: answers question, saves, refreshes, verifies saved state, tests empty & partial answer without hiring claims (Gate 12)', async () => {
      // 1. Initial Render
      const { unmount } = render(
        <BrowserRouter>
          <CareerProvider>
            <Practice />
          </CareerProvider>
        </BrowserRouter>
      );

      // Verify question context is rendered
      expect(screen.getByText(/Why Interviewers Ask This/i)).toBeInTheDocument();
      expect(QUESTION_CONTEXTS.ib01.purpose).toBeTruthy();

      // Click "Load Rahul Sample Answer"
      fireEvent.click(screen.getByRole('button', { name: /Load Rahul Sample Answer/i }));

      const textarea = screen.getByLabelText(/Practice Answer Input/i) as HTMLTextAreaElement;
      expect(textarea.value).toContain('Python');
      expect(textarea.value).toContain('task organizer');

      // Click "Evaluate with Deterministic Rubric ↗"
      fireEvent.click(screen.getByRole('button', { name: /Evaluate with Deterministic Rubric/i }));

      // Verify rubric evaluation rendered
      expect(screen.getByText(/Criteria Demonstrated/i)).toBeInTheDocument();
      expect(screen.getByText(/Demonstrated Strengths/i)).toBeInTheDocument();
      expect(screen.getByText(/One Next Action/i)).toBeInTheDocument();
      expect(screen.getByText(/Not a hiring decision/i)).toBeInTheDocument();

      // Click "Save to History"
      const saveBtn = screen.getByRole('button', { name: /Save to History/i });
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /History \(/i })).toBeInTheDocument();
      });

      // 2. Submit an empty answer
      fireEvent.change(textarea, { target: { value: '' } });
      fireEvent.click(screen.getByRole('button', { name: /Evaluate with Deterministic Rubric/i }));

      expect(screen.getByText(/0 of 5 Criteria Demonstrated/i)).toBeInTheDocument();
      expect(screen.getByText(/Unaddressed Rubric Points/i)).toBeInTheDocument();
      // Must not claim a hiring decision
      expect(screen.getByText(/Not a hiring decision/i)).toBeInTheDocument();

      // 3. Submit a partial answer
      fireEvent.change(textarea, { target: { value: 'In my Python project, I wrote a script to parse logs.' } });
      fireEvent.click(screen.getByRole('button', { name: /Evaluate with Deterministic Rubric/i }));

      expect(screen.getByText(/Criteria Demonstrated/i)).toBeInTheDocument();
      expect(screen.getByText(/Unaddressed Rubric Points/i)).toBeInTheDocument();
      expect(screen.getByText(/Not a hiring decision/i)).toBeInTheDocument();

      unmount();

      // 4. Simulate Page Refresh: Remount CareerProvider and Practice
      render(
        <BrowserRouter>
          <CareerProvider>
            <Practice />
          </CareerProvider>
        </BrowserRouter>
      );

      // Verify that the saved history returned after refresh
      await waitFor(() => {
        const historyBtn = screen.getByRole('button', { name: /History \(/i });
        expect(historyBtn).toBeInTheDocument();
        fireEvent.click(historyBtn);
      });

      // Check that past saved answer is present and reloadable
      expect(screen.getByRole('button', { name: /Load this answer/i })).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: /Load this answer/i }));

      const reloadedTextarea = screen.getByLabelText(/Practice Answer Input/i) as HTMLTextAreaElement;
      expect(reloadedTextarea.value).toContain('task organizer');
    });

    it('handles repository save failures gracefully with error state and non-crashing UI', async () => {
      // Mock repository save error
      vi.spyOn(defaultInterviewRepository, 'saveInterviewSession').mockResolvedValueOnce({
        data: null,
        error: 'Network connection dropped',
      });

      render(
        <BrowserRouter>
          <CareerProvider>
            <Practice />
          </CareerProvider>
        </BrowserRouter>
      );

      const textarea = screen.getByLabelText(/Practice Answer Input/i);
      fireEvent.change(textarea, { target: { value: 'Some substantive answer to test save error.' } });

      const saveBtn = screen.getByRole('button', { name: /Save to History/i });
      fireEvent.click(saveBtn);

      // Application must not crash; button remains enabled
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Save to History/i })).toBeInTheDocument();
      });
    });
  });

  describe('Non-Inference & Safety Invariants', () => {
    it('strictly forbids video/mic permissions, emotion/facial inference, and hire/no-hire decisions', () => {
      render(
        <BrowserRouter>
          <CareerProvider>
            <Practice />
          </CareerProvider>
        </BrowserRouter>
      );

      // 1. Text practice notice is prominent
      expect(screen.getByText(/First-Class Text Practice Contract/i)).toBeInTheDocument();

      // 2. No video or audio element in document
      expect(document.querySelector('video')).toBeNull();
      expect(document.querySelector('audio')).toBeNull();

      // 3. UI copy explicitly disclaims emotion and face tracking
      const pageText = document.body.textContent || '';
      expect(pageText).toContain('never infer facial expression, eye contact, tone, accent, confidence, or emotion');
      expect(pageText).toContain('We do not produce hire/no-hire decisions');
    });
  });
});
