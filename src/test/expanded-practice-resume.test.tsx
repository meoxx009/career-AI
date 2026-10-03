import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { CareerProvider } from '../context/CareerContext';
import { Practice } from '../pages/Practice';
import { ResumeLab } from '../pages/ResumeLab';
import { RoleSelector } from '../components/RoleSelector';
import {
  evaluateInterviewAnswer,
  getQuestionsForRole,
} from '../lib/interviewEvaluator';
import {
  analyzeResume,
  detectUnsupportedClaims,
} from '../lib/resumeAnalyzer';

describe('Prompt 7 & Gate 07 — Expanded Practice Session & Resume Builder Roles', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('1. RoleSelector Component Contract', () => {
    it('renders trigger button with target role and allows searching all 33 catalogue paths', () => {
      const handleSelect = vi.fn();
      render(
        <RoleSelector
          selectedRoleId={1}
          onSelectRole={handleSelect}
          label="Test Role Selector"
        />
      );

      // Label and current role button displayed
      expect(screen.getByText('Test Role Selector')).toBeInTheDocument();
      expect(screen.getByText('33 validated paths')).toBeInTheDocument();
      const triggerBtn = screen.getByRole('button', { name: /Current role: Backend Developer/i });
      expect(triggerBtn).toBeInTheDocument();

      // Open dropdown
      fireEvent.click(triggerBtn);
      const searchInput = screen.getByLabelText(/Search career roles/i);
      expect(searchInput).toBeInTheDocument();

      // Filter by typing 'AI Engineer'
      fireEvent.change(searchInput, { target: { value: 'AI Engineer' } });

      // Match specifically AI Engineer option (exact title start)
      const aiOption = screen.getByRole('option', { name: /^AI Engineer/i });
      expect(aiOption).toBeInTheDocument();

      // Selecting role triggers callback with numericId 19
      fireEvent.click(aiOption);
      expect(handleSelect).toHaveBeenCalledWith(19);
    });

    it('filters roles using category filter tabs (Software, Data & AI, Design & Product)', () => {
      const handleSelect = vi.fn();
      render(
        <RoleSelector
          selectedRoleId={1}
          onSelectRole={handleSelect}
        />
      );

      // Open dropdown
      fireEvent.click(screen.getByRole('button', { name: /Current role: Backend Developer/i }));

      // Switch to Design & Product button
      const designTab = screen.getByRole('button', { name: /Design & Product/i });
      fireEvent.click(designTab);

      // UI/UX Designer should be present
      expect(screen.getByRole('option', { name: /UI\/UX Designer/i })).toBeInTheDocument();
      // Backend Developer should be filtered out
      expect(screen.queryByRole('option', { name: /^Backend Developer/i })).not.toBeInTheDocument();
    });
  });

  describe('2. Expanded Interview Practice Questions & Engineering Rubrics', () => {
    it('provides specialized question pairs for AI Engineer (role 19)', () => {
      const questions = getQuestionsForRole(19, 'AI Engineer');
      expect(questions.length).toBe(2);
      expect(questions[0].id).toBe('iai01');
      expect(questions[0].type).toBe('behavioural');
      expect(questions[1].id).toBe('iai02');
      expect(questions[1].type).toBe('technical');

      // Evaluates behavioural response against AI engineering rubrics
      const aiAnswer = `
        In our customer intent classification pipeline project, validation accuracy was 92% but cancellation requests failed in production.
        I inspected the false negatives and discovered severe class imbalance where cancellations represented under 4% of the dataset.
        I reframed our evaluation from overall accuracy to precision-recall curves and stratified the dataset.
        I compared a fine-tuned DistilBERT baseline with TF-IDF and logistic regression, running error analysis on confusing edge cases.
        I calibrated the decision threshold and implemented safety guardrails with an uncertainty boundary for manual review, accepting a 45ms latency cost.
        This taught me to always audit minority class distributions rather than trusting aggregate validation accuracy.
      `;
      const result = evaluateInterviewAnswer(questions[0], aiAnswer);
      expect(result.metCount).toBeGreaterThanOrEqual(4);
      expect(result.criteriaResults.some(c => c.id === 'error_analysis' && c.met)).toBe(true);
      expect(result.criteriaResults.some(c => c.id === 'safety_limitations' && c.met)).toBe(true);
      expect(result.criteriaResults.some(c => c.id === 'reflection' && c.met)).toBe(true);
    });

    it('provides specialized question pairs for Generative AI Engineer (role 20)', () => {
      const questions = getQuestionsForRole(20, 'Generative AI Engineer');
      expect(questions.length).toBe(2);
      expect(questions[0].id).toBe('igenai01');
      expect(questions[1].id).toBe('igenai02');

      // Evaluates technical answer for prompt injection defense
      const genaiAnswer = `
        To secure an enterprise customer support assistant against prompt injections, I implement layered defense.
        First, user inputs are strictly separated from system instructions using structured message roles rather than string formatting.
        Second, an input screening classifier checks for jailbreak indicators before execution.
        Third, tool execution requires strict programmatic JSON schema validation with least-privilege API tokens.
        Finally, LLM outputs pass through an output validation filter to prevent accidental prompt leaks.
      `;
      const result = evaluateInterviewAnswer(questions[1], genaiAnswer);
      expect(result.metCount).toBeGreaterThanOrEqual(4);
      expect(result.criteriaResults.some(c => c.id === 'safety_limitations' && c.met)).toBe(true);
    });

    it('provides specialized question pairs for LLM & RAG Application Engineer (role 21 & 22)', () => {
      const questions = getQuestionsForRole(21, 'LLM Application Engineer');
      expect(questions.length).toBe(2);
      expect(questions[0].id).toBe('irag01');
      expect(questions[1].id).toBe('irag02');

      const ragAnswer = `
        In our technical documentation assistant project, retrieval precision degraded when code blocks were split across arbitrary boundaries.
        I wrote an automated evaluation suite of 50 technical queries with ground-truth docs and evaluated Hit Rate@5 and MRR.
        I refactored the chunking to AST-aware markdown chunking with 100-token overlap and added a cross-encoder reranker.
        This boosted Hit Rate@5 from 58% to 89% while keeping retrieval latency under 110ms.
        This taught me that semantic chunking boundaries are critical for grounded retrieval.
      `;
      const result = evaluateInterviewAnswer(questions[0], ragAnswer);
      expect(result.metCount).toBeGreaterThanOrEqual(4);
      expect(result.criteriaResults.some(c => c.id === 'retrieval_evaluation' && c.met)).toBe(true);
      expect(result.criteriaResults.some(c => c.id === 'latency_cost' && c.met)).toBe(true);
      expect(result.criteriaResults.some(c => c.id === 'reflection' && c.met)).toBe(true);
    });

    it('provides specialized question pairs for Embedded Systems Engineer (role 13)', () => {
      const questions = getQuestionsForRole(13, 'Embedded Systems Engineer');
      expect(questions.length).toBe(2);
      expect(questions[0].id).toBe('iece01');
      expect(questions[1].id).toBe('iece02');

      const embeddedAnswer = `
        In an STM32 SPI sensor node project, the device hung intermittently after several hours of operation.
        I hooked up a logic analyzer to probe SPI bus lines, revealing clock stretching lockups from an unhandled interrupt.
        I refactored the driver to use non-blocking DMA with hardware timeout counters and watchdog timers.
        I verified stability through 48-hour continuous sensor logging.
        This taught me that embedded firmware must avoid busy-wait loops on external hardware peripherals.
      `;
      const result = evaluateInterviewAnswer(questions[0], embeddedAnswer);
      expect(result.metCount).toBeGreaterThanOrEqual(4);
      expect(result.criteriaResults.some(c => c.id === 'debugging_approach' && c.met)).toBe(true);
      expect(result.criteriaResults.some(c => c.id === 'reflection' && c.met)).toBe(true);
    });

    it('provides specialized question pairs for UI/UX Designer (role 27)', () => {
      const questions = getQuestionsForRole(27, 'UI/UX Designer');
      expect(questions.length).toBe(2);
      expect(questions[0].id).toBe('iux01');
      expect(questions[1].id).toBe('iux02');

      const designAnswer = `
        In our dispatch operator dashboard project, usability testing with 5 operators showed that 3 missed critical emergency alerts because they lacked contrast.
        I redesigned the alert hierarchy using high-contrast design tokens, bold typography, and audible notifications conforming to WCAG 2.1 AA.
        Subsequent usability testing confirmed 100% detection within 2 seconds.
        This reinforced that accessible visual contrast must be validated under realistic task stress.
      `;
      const result = evaluateInterviewAnswer(questions[0], designAnswer);
      expect(result.metCount).toBeGreaterThanOrEqual(4);
      expect(result.criteriaResults.some(c => c.id === 'user_research' && c.met)).toBe(true);
      expect(result.criteriaResults.some(c => c.id === 'design_iteration' && c.met)).toBe(true);
      expect(result.criteriaResults.some(c => c.id === 'usability_validation' && c.met)).toBe(true);
      expect(result.criteriaResults.some(c => c.id === 'reflection' && c.met)).toBe(true);
    });

    it('generates safe fallback questions with isFallback=true when a role is unreviewed', () => {
      const unreviewed = getQuestionsForRole(999, 'Quantum Computing Engineer');
      expect(unreviewed.length).toBe(2);
      expect(unreviewed[0].isFallback).toBe(true);
      expect(unreviewed[0].prompt).toContain('Quantum Computing Engineer');
      expect(unreviewed[0].rubric_points).toEqual([
        'context',
        'contribution',
        'decision',
        'result_or_limitation',
        'reflection',
      ]);
    });
  });

  describe('3. Expanded Resume Lab & Keyword Alias Alignment', () => {
    it('accurately evaluates demonstrated keywords for AI Engineer (role 19)', () => {
      const resume = `
        Machine Learning Engineer with experience in Python.
        Built model evaluation pipelines using ground truth benchmarks to assess accuracy and precision.
        Implemented input validation guardrails and error fallbacks for safe production inference.
      `;
      const result = analyzeResume({
        resumeText: resume,
        jobDescription: 'Junior AI Engineer with Python and model evaluation experience.',
        roleId: 19,
        facts: [],
      });

      expect(result.hasReviewedAliases).toBe(true);
      expect(result.alignmentPercentage).toBeGreaterThanOrEqual(40);
      expect(result.matchedTerms).toContain('Python');
      expect(result.matchedTerms).toContain('Evaluation');
      expect(result.matchedTerms).toContain('Safety & Guardrails');
    });

    it('accurately evaluates demonstrated keywords for UI/UX Designer (role 27)', () => {
      const resume = `
        UI Designer with portfolio in Figma and user research.
        Created design systems with reusable components and verified WCAG color contrast standards.
        Conducted usability testing sessions with prototype iterations.
      `;
      const result = analyzeResume({
        resumeText: resume,
        jobDescription: 'Junior UI/UX Designer with Figma and accessibility skills.',
        roleId: 27,
        facts: [],
      });

      expect(result.hasReviewedAliases).toBe(true);
      expect(result.matchedTerms).toContain('Design Tools');
      expect(result.matchedTerms).toContain('UX Research');
      expect(result.matchedTerms).toContain('Accessibility');
      expect(result.matchedTerms).toContain('Design Systems');
    });

    it('handles unreviewed role (Technical Writer role 33) with safe audit fallback and exact notice', () => {
      const resume = 'Documented REST APIs and wrote developer tutorials using Markdown and Git.';
      const result = analyzeResume({
        resumeText: resume,
        jobDescription: 'Junior Technical Writer.',
        roleId: 33, // Technical Writer has no reviewed keyword alias map
        facts: [],
      });

      // Must explicitly flag unreviewed status
      expect(result.hasReviewedAliases).toBe(false);
      // Alignment percentage must be null (no fake score)
      expect(result.alignmentPercentage).toBeNull();
      // Must contain exact required notice string
      expect(result.unreviewedNotice).toBe(
        'Role-specific keyword review is not available yet. You can still run the general evidence safety audit.'
      );
    });

    it('blocks unsupported hallucinated metrics across all roles (1000 users, 99.9% uptime, 40% reduction)', () => {
      const resumeWithFictionalMetrics = `
        Built an AI recommendation service in Python using PyTorch.
        Scaled the system to 1000 users with 99.9% uptime and achieved a 40% reduction in processing time.
      `;

      const claims = detectUnsupportedClaims(resumeWithFictionalMetrics, []);
      expect(claims.length).toBeGreaterThanOrEqual(3);

      const claimTexts = claims.map(c => c.text);
      expect(claimTexts.some(t => t.includes('1000 users'))).toBe(true);
      expect(claimTexts.some(t => t.includes('99.9% uptime'))).toBe(true);
      expect(claimTexts.some(t => t.includes('40% reduction'))).toBe(true);

      // Runs in analyzeResume for role 19 (AI Engineer)
      const result = analyzeResume({
        resumeText: resumeWithFictionalMetrics,
        jobDescription: 'AI Engineer.',
        roleId: 19,
        facts: [],
      });
      expect(result.unsupportedClaims.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('4. Full UI Integration in Practice and ResumeLab', () => {
    it('Practice Room displays RoleSelector, updates questions, and evaluates deterministically', async () => {
      render(
        <BrowserRouter>
          <CareerProvider>
            <Practice />
          </CareerProvider>
        </BrowserRouter>
      );

      // Initial role is Backend Developer
      expect(screen.getByText(/TEXT PRACTICE ROOM/i)).toBeInTheDocument();
      expect(screen.getByText(/TARGET: BACKEND DEVELOPER/i)).toBeInTheDocument();

      // Open RoleSelector
      const roleSelectorBtn = screen.getByRole('button', { name: /Current role: Backend Developer/i });
      fireEvent.click(roleSelectorBtn);

      // Search for AI Engineer
      const searchInput = screen.getByLabelText(/Search career roles/i);
      fireEvent.change(searchInput, { target: { value: 'AI Engineer' } });

      // Click AI Engineer option (specifically the one starting with AI Engineer)
      const aiOption = screen.getByRole('option', { name: /^AI Engineer/i });
      fireEvent.click(aiOption);

      // Target role updates in header
      expect(screen.getByText(/TARGET: AI ENGINEER/i)).toBeInTheDocument();
      expect(screen.getByText(/DATA AI/i)).toBeInTheDocument();

      // Load synthetic demo answer
      fireEvent.click(screen.getByRole('button', { name: /Sample Answer/i }));

      // Click evaluate
      fireEvent.click(screen.getByRole('button', { name: /Evaluate with Deterministic Rubric/i }));

      // Check results
      await waitFor(() => {
        expect(screen.getByText(/Criteria Demonstrated/i)).toBeInTheDocument();
        expect(screen.getByText(/Criteria Breakdown/i)).toBeInTheDocument();
      });
    });

    it('ResumeLab displays RoleSelector and shows unreviewed notice banner for Role 33 without fake score', async () => {
      render(
        <BrowserRouter>
          <CareerProvider>
            <ResumeLab />
          </CareerProvider>
        </BrowserRouter>
      );

      // Switch to Technical Writer (Role 33)
      const selectorBtn = screen.getByRole('button', { name: /Current role: Backend Developer/i });
      fireEvent.click(selectorBtn);

      const searchInput = screen.getByLabelText(/Search career roles/i);
      fireEvent.change(searchInput, { target: { value: 'Technical Writer' } });

      fireEvent.click(screen.getByRole('option', { name: /^Technical Writer/i }));

      // Header updates to Technical Writer
      expect(screen.getByText(/TARGET: TECHNICAL WRITER/i)).toBeInTheDocument();

      // Enter valid draft
      const textarea = screen.getByPlaceholderText(/Paste your plain-text resume here/i);
      fireEvent.change(textarea, {
        target: { value: 'Authored technical documentation for REST APIs and cloud services.' },
      });

      // Run Grounded Safety Audit
      fireEvent.click(screen.getByRole('button', { name: /Run Grounded Safety Audit/i }));

      // Result should show required unreviewed banner
      await waitFor(() => {
        expect(
          screen.getAllByText(/Role-specific keyword review is not available yet\. You can still run the general evidence safety audit\./i).length
        ).toBeGreaterThanOrEqual(1);
        expect(screen.getByText(/Evidence Grounding & Metric Safety Audit/i)).toBeInTheDocument();
        // Make sure no fake percentage is displayed
        expect(screen.queryByText(/% Demonstrated Alignment/i)).not.toBeInTheDocument();
      });
    });
  });
});
