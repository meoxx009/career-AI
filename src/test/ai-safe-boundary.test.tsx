import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { CareerProvider } from '../context/CareerContext';
import { ResumeLab } from '../pages/ResumeLab';
import { Practice } from '../pages/Practice';
import { RoleDetail } from '../pages/RoleDetail';
import {
  setAIProviderForTesting,
  resetAIProvider,
  FakeTestAIProvider,
  DeterministicFallbackAdapter,
  type RoleExplanationInput,
  type ResumeReviewInput,
  type InterviewFeedbackInput,
} from '../lib/ai-adapter';

describe('Prompt 13 & Gate 13 — Safe AI Server Boundary & Fallback Engine', () => {
  beforeEach(() => {
    localStorage.clear();
    resetAIProvider();
  });

  afterEach(() => {
    resetAIProvider();
  });

  describe('Gate 13: Error Categories & Fallback Resilience', () => {
    it('handles AI_PROVIDER=disabled cleanly without throwing, returning fallback data and notice', async () => {
      const disabledProvider = new FakeTestAIProvider({ simulateDisabled: true });
      setAIProviderForTesting(disabledProvider);

      const input: ResumeReviewInput = {
        resumeText: 'Built Python backend using SQLite and pytest.',
        jobDescription: 'Python developer with SQL experience.',
        targetRoleId: '1',
        consent: true,
      };

      const result = await disabledProvider.suggestResumeReview(input);

      expect(result.usedFallback).toBe(true);
      expect(result.error).not.toBeNull();
      expect(result.error?.code).toBe('disabled');
      expect(result.error?.canRetry).toBe(false);
      expect(result.error?.userNotice).toContain('AI provider is disabled');
      expect(result.data.mode).toBe('deterministic-fallback');
      expect(result.data.matchedTerms).toContain('python');
    });

    it('simulates network timeout and recovers immediately with deterministic verification', async () => {
      const timeoutProvider = new FakeTestAIProvider({ simulateTimeout: true });
      setAIProviderForTesting(timeoutProvider);

      const input: InterviewFeedbackInput = {
        questionId: 'ib01',
        questionPrompt: 'Describe a technical challenge.',
        answerText:
          'When building our college project, our team hit a database timeout bug. I implemented indexing on the user ID column and created automated tests, which resolved the latency issue.',
        rubricVersion: '1.0',
        consent: true,
      };

      const result = await timeoutProvider.evaluateInterviewAnswer(input);

      expect(result.usedFallback).toBe(true);
      expect(result.error?.code).toBe('timeout');
      expect(result.error?.canRetry).toBe(true);
      expect(result.error?.userNotice).toContain('timed out');
      expect(result.data.mode).toBe('deterministic-fallback');
      expect(result.data.strengths.length).toBeGreaterThan(0);
    });

    it('simulates 429 quota exhaustion and switches seamlessly to deterministic mode', async () => {
      const quotaProvider = new FakeTestAIProvider({ simulateQuota: true });
      setAIProviderForTesting(quotaProvider);

      const input: RoleExplanationInput = {
        roleId: '1',
        roleName: 'Junior Backend Developer',
        assessedAlignment: 78,
        coverage: 0.8,
        evidence: [
          { skill: '1', observed: 2, target: 2, source: 'assessment' },
        ],
        gaps: [
          { skill: '5', gap: 1, importance: 3, prerequisiteOrder: 2 },
        ],
        timeBudgetHours: 8,
        consent: true,
      };

      const result = await quotaProvider.explainRoleAlignment(input);

      expect(result.usedFallback).toBe(true);
      expect(result.error?.code).toBe('rate_limit_or_quota');
      expect(result.error?.canRetry).toBe(true);
      expect(result.error?.userNotice).toContain('over quota');
      expect(result.data.whyItMayFit.length).toBeGreaterThan(0);
      expect(result.data.whyItMayFit.length).toBeLessThanOrEqual(3);
    });

    it('simulates invalid JSON response schema and recovers safely using fallback', async () => {
      const invalidJsonProvider = new FakeTestAIProvider({ simulateInvalidJson: true });
      setAIProviderForTesting(invalidJsonProvider);

      const input: ResumeReviewInput = {
        resumeText: 'Built Python backend using SQLite database.',
        jobDescription: 'Backend developer with Python skills.',
        targetRoleId: '1',
        consent: true,
      };

      const result = await invalidJsonProvider.suggestResumeReview(input);

      expect(result.usedFallback).toBe(true);
      expect(result.error?.code).toBe('invalid_response_schema');
      expect(result.error?.canRetry).toBe(true);
      expect(result.error?.userNotice).toContain('failed schema validation');
      expect(result.data.matchedTerms).toContain('python');
    });
  });

  describe('UI Draft Preservation & AI Review Labels (Gate 13 UI)', () => {
    it('preserves user resume draft on AI failure and displays calm inline notification with retry', async () => {
      // Simulate quota failure
      const quotaProvider = new FakeTestAIProvider({ simulateQuota: true });
      setAIProviderForTesting(quotaProvider);

      render(
        <MemoryRouter>
          <CareerProvider>
            <ResumeLab />
          </CareerProvider>
        </MemoryRouter>
      );

      // Type unique candidate text into resume draft
      const textarea = screen.getByLabelText(/Resume Text Draft/i) as HTMLTextAreaElement;
      const uniqueDraft = 'Unique student resume draft: Built an automated API caching system in Python.';
      fireEvent.change(textarea, { target: { value: uniqueDraft } });
      expect(textarea.value).toBe(uniqueDraft);

      // Switch to AI Enhancement mode
      const aiModeButton = screen.getByRole('button', { name: /AI Enhancement/i });
      fireEvent.click(aiModeButton);

      // Trigger audit
      const auditButton = screen.getByRole('button', { name: /Run AI Grounded Safety Audit/i });
      fireEvent.click(auditButton);

      // Verify draft text is 100% preserved in place
      await waitFor(() => {
        expect(textarea.value).toBe(uniqueDraft);
      });

      // Verify calm inline notice is displayed with retry button
      const alert = await screen.findByRole('status');
      expect(alert.textContent).toContain('over quota');
      expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
    });

    it('renders "AI suggestion — review before using" badge when AI suggestions are active', async () => {
      // Use fake AI provider with custom suggestions
      const aiProvider = new FakeTestAIProvider({
        customResumeReview: {
          mode: 'ai',
          matchedTerms: ['python'],
          missingTerms: ['docker'],
          unsupportedClaims: [],
          suggestions: [
            {
              original: 'Helped with database optimizations.',
              rewrite: 'Optimized PostgreSQL query indexes based on verified project schema.',
              sourceFactIds: ['fact-101'],
              needsConfirmation: false,
              note: 'Anchored in verified database schema fact.',
              confidence: 'high',
              caveat: 'AI suggestion — verify against your actual codebase commit.',
            },
          ],
          confidence: 'high',
          caveat: 'AI suggestion — review before using.',
          abstained: false,
        },
      });
      setAIProviderForTesting(aiProvider);

      render(
        <MemoryRouter>
          <CareerProvider>
            <ResumeLab />
          </CareerProvider>
        </MemoryRouter>
      );

      // Switch to AI Enhancement mode
      fireEvent.click(screen.getByRole('button', { name: /AI Enhancement/i }));

      // Load sample draft containing the targeted sentence
      const textarea = screen.getByLabelText(/Resume Text Draft/i) as HTMLTextAreaElement;
      fireEvent.change(textarea, {
        target: { value: 'Helped with database optimizations in our backend system.' },
      });

      // Run audit
      fireEvent.click(screen.getByRole('button', { name: /Run AI Grounded Safety Audit/i }));

      // Verify AI suggestion badge is rendered
      const badge = await screen.findByText(/AI suggestion — review before using/i);
      expect(badge).toBeInTheDocument();

      // Verify cited source fact is rendered
      expect(screen.getByText(/Fact: fact-101/i)).toBeInTheDocument();

      // Verify confidence is rendered
      expect(screen.getByText(/Confidence:\s*High/i)).toBeInTheDocument();

      // Test dismissing/rejecting preserves original text
      const dismissBtn = screen.getByRole('button', { name: /Dismiss/i });
      fireEvent.click(dismissBtn);

      expect(textarea.value).toBe('Helped with database optimizations in our backend system.');
    });

    it('preserves answer text in Practice room when AI evaluation times out', async () => {
      const timeoutProvider = new FakeTestAIProvider({ simulateTimeout: true });
      setAIProviderForTesting(timeoutProvider);

      render(
        <MemoryRouter>
          <CareerProvider>
            <Practice />
          </CareerProvider>
        </MemoryRouter>
      );

      // Select AI practice mode
      fireEvent.click(screen.getByRole('button', { name: /AI Practice Feedback/i }));

      // Type answer
      const answerInput = screen.getByPlaceholderText(/Structure your answer clearly/i) as HTMLTextAreaElement;
      const testAnswer =
        'In my Python task organizer project, I encountered corrupted JSON files whenever the program was abruptly interrupted. I wrote a pytest suite to reproduce and isolate the crash, then implemented atomic file writes using temporary files and safe rename operations.';
      fireEvent.change(answerInput, { target: { value: testAnswer } });

      // Click evaluate
      fireEvent.click(screen.getByRole('button', { name: /Evaluate with AI Rubric/i }));

      // Wait for evaluation and verify draft answer is preserved in textarea
      await waitFor(() => {
        expect(answerInput.value).toBe(testAnswer);
      });

      // Verify inline notice with retry is shown
      const statusNotice = await screen.findByRole('status');
      expect(statusNotice.textContent).toContain('timed out');
      expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
    });

    it('does not calculate or override deterministic role fit scores when explaining alignment', async () => {
      const deterministicAdapter = new DeterministicFallbackAdapter();
      setAIProviderForTesting(deterministicAdapter);

      render(
        <MemoryRouter initialEntries={['/paths/backend-developer']}>
          <CareerProvider>
            <Routes>
              <Route path="/paths/:roleSlug" element={<RoleDetail />} />
            </Routes>
          </CareerProvider>
        </MemoryRouter>
      );

      // Click Explain Alignment with AI
      const explainBtn = screen.getByRole('button', { name: /Explain Alignment with AI/i });
      fireEvent.click(explainBtn);

      // Verify AI explanation card appears with review-before-using badge
      const explanationCard = await screen.findByText(/AI suggestion — review before using/i);
      expect(explanationCard).toBeInTheDocument();

      // Verify deterministic score is explicitly preserved
      expect(screen.getByText(/Deterministic score preserved/i)).toBeInTheDocument();
    });
  });
});
