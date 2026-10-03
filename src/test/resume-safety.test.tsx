import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { CareerProvider } from '../context/CareerContext';
import { ResumeLab } from '../pages/ResumeLab';
import {
  analyzeResume,
  detectUnsupportedClaims,
  validateResumeInputLengths,
  ROLE_KEYWORD_ALIASES,
} from '../lib/resumeAnalyzer';

describe('Prompt 11 & Gate 11 — Truthful Resume Lab & Safety Engine', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('Gate 11 — Synthetic Single-Line Resume Contract', () => {
    it('analyzes "Built a chat application using Python." without inventing users, uptime, latency, AWS or percentages (Gate 11)', () => {
      const gate11Input = 'Built a chat application using Python.';
      const result = analyzeResume({
        resumeText: gate11Input,
        jobDescription: 'Entry-level Python backend developer with socket programming experience.',
        roleId: 1, // Backend Developer
        facts: [],
      });

      // 1. Must produce at least one suggestion
      expect(result.suggestions.length).toBeGreaterThan(0);
      const sug = result.suggestions[0];
      expect(sug.original).toBe(gate11Input);

      // 2. Safe rewrite must NOT claim users, uptime, latency, AWS or percentage improvements
      const rewriteLower = sug.rewrite.toLowerCase();
      expect(rewriteLower).not.toMatch(/\b\d+\s*users?\b/);
      expect(rewriteLower).not.toMatch(/uptime|availability|sla/);
      expect(rewriteLower).not.toMatch(/\d+\s*(?:ms|milliseconds?|seconds?)\s*latency/);
      expect(rewriteLower).not.toMatch(/\baws\b|\bazure\b|\bgcp\b/);
      expect(rewriteLower).not.toMatch(/\b\d+%\b/);
      expect(rewriteLower).not.toMatch(/\b\d+x\b/);

      // 3. Must be anchored in Python and chat application context
      expect(rewriteLower).toContain('python');
      expect(rewriteLower).toContain('chat');
    });

    it('Gate 11 UI: accepting replaces draft without hallucinations; rejecting preserves original text (Gate 11)', async () => {
      render(
        <BrowserRouter>
          <CareerProvider>
            <ResumeLab />
          </CareerProvider>
        </BrowserRouter>
      );

      // Click "Gate 11 Sample" button to load: "Built a chat application using Python."
      fireEvent.click(screen.getByRole('button', { name: /Gate 11 Sample/i }));

      const resumeTextarea = screen.getByLabelText(/Resume Text Draft/i) as HTMLTextAreaElement;
      expect(resumeTextarea.value).toBe('Built a chat application using Python.');

      // Click "Run Grounded Safety Audit"
      fireEvent.click(screen.getByRole('button', { name: /Run Grounded Safety Audit/i }));

      // Wait for audit result to render
      await waitFor(() => {
        expect(screen.getAllByText(/Keyword Alignment Heuristic/i).length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText(/Actionable Rewrites/i)).toBeInTheDocument();
      });

      // Check the suggested rewrite
      const acceptBtn = screen.getByRole('button', { name: /^Accept$/i });
      expect(acceptBtn).toBeInTheDocument();

      // Click "Accept"
      fireEvent.click(acceptBtn);

      // Check that resume draft is updated with the rewrite and contains NO fabricated metrics
      await waitFor(() => {
        const updatedText = resumeTextarea.value.toLowerCase();
        expect(updatedText).not.toBe('built a chat application using python.');
        expect(updatedText).toContain('python');
        expect(updatedText).toContain('chat');
        expect(updatedText).not.toMatch(/\b\d+\s*users?\b/);
        expect(updatedText).not.toMatch(/uptime|sla/);
        expect(updatedText).not.toMatch(/%/);
      });

      // Reset to Gate 11 input to test rejection
      fireEvent.click(screen.getByRole('button', { name: /Gate 11 Sample/i }));
      expect(resumeTextarea.value).toBe('Built a chat application using Python.');

      fireEvent.click(screen.getByRole('button', { name: /Run Grounded Safety Audit/i }));
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /^Dismiss$/i })).toBeInTheDocument();
      });

      // Click "Dismiss / Reject"
      fireEvent.click(screen.getByRole('button', { name: /^Dismiss$/i }));

      // Rejecting MUST preserve the original text exactly!
      expect(resumeTextarea.value).toBe('Built a chat application using Python.');
    });
  });

  describe('Fabricated Metric & Claim Detection', () => {
    it('detects and flags "1000 concurrent users", "99.9% uptime", "40% reduction", and "<50ms latency" when unverified', () => {
      const fabricatedResume = `
        Built a chat microservice serving 1000 concurrent users with 99.9% uptime.
        Achieved a 40% reduction in database query latency to under 50ms.
        Deployed AWS Kubernetes cluster to scale throughput by 3x.
      `;

      const claims = detectUnsupportedClaims(fabricatedResume, []);

      expect(claims.length).toBeGreaterThanOrEqual(4);

      const claimTexts = claims.map(c => c.text.toLowerCase());
      expect(claimTexts.some(t => t.includes('1000') && t.includes('user'))).toBe(true);
      expect(claimTexts.some(t => t.includes('99.9%'))).toBe(true);
      expect(claimTexts.some(t => t.includes('40%'))).toBe(true);
      expect(claimTexts.some(t => t.includes('50ms') || t.includes('latency'))).toBe(true);
    });

    it('generates non-numeric safe rewrites for lines with unverified numbers', () => {
      const result = analyzeResume({
        resumeText: 'Built a chat microservice serving 1000 concurrent users with 99.9% uptime.',
        jobDescription: 'Backend developer with Python and API skills.',
        roleId: 1,
        facts: [],
      });

      expect(result.unsupportedClaims.length).toBeGreaterThan(0);
      expect(result.suggestions.length).toBeGreaterThan(0);

      const rewrite = result.suggestions[0].rewrite;
      // The rewrite must have stripped "1000 concurrent users" and "99.9% uptime"
      expect(rewrite).not.toContain('1000');
      expect(rewrite).not.toContain('99.9%');
      expect(result.suggestions[0].needsConfirmation).toBe(true);
    });
  });

  describe('Keyword Alignment Heuristics & Role Taxonomy', () => {
    it('evaluates role keywords using reviewed alias dictionary for Backend Developer', () => {
      const result = analyzeResume({
        resumeText: 'Developed REST endpoints in Python using FastAPI and PostgreSQL relational database with pytest tests.',
        jobDescription: 'Seeking backend developer with Python, SQL, REST APIs, Git, and Unit Testing experience.',
        roleId: 1, // Backend Developer
        facts: [],
      });

      // Python, SQL (via PostgreSQL), REST APIs (via FastAPI/endpoints), Unit Testing (via pytest)
      expect(result.matchedTerms).toContain('Python');
      expect(result.matchedTerms).toContain('SQL');
      expect(result.matchedTerms).toContain('REST APIs');
      expect(result.matchedTerms).toContain('Unit Testing');
      // Git is missing
      expect(result.missingTerms).toContain('Git');

      expect(result.alignmentPercentage).toBeGreaterThan(50);
      expect(result.caveat).toContain('Keyword alignment heuristic only');
      expect(result.caveat).not.toContain('ATS pass');
    });

    it('provides reviewed alias taxonomy across all 3 seed roles', () => {
      expect(ROLE_KEYWORD_ALIASES[1]).toHaveProperty('Python');
      expect(ROLE_KEYWORD_ALIASES[1]).toHaveProperty('SQL');
      expect(ROLE_KEYWORD_ALIASES[2]).toHaveProperty('React');
      expect(ROLE_KEYWORD_ALIASES[2]).toHaveProperty('JavaScript');
      expect(ROLE_KEYWORD_ALIASES[3]).toHaveProperty('Excel');
      expect(ROLE_KEYWORD_ALIASES[3]).toHaveProperty('EDA');
    });
  });

  describe('Input Validation & Length Safeguards', () => {
    it('rejects resume text that is too short or too long', () => {
      const tooShort = validateResumeInputLengths('Hi', 'Valid job description here.');
      expect(tooShort.valid).toBe(false);
      expect(tooShort.error).toContain('too short');

      const valid = validateResumeInputLengths('Built a small web scraper in Python.', 'Valid job description.');
      expect(valid.valid).toBe(true);

      const tooLongResume = 'a'.repeat(10001);
      const lengthFail = validateResumeInputLengths(tooLongResume, 'Valid JD.');
      expect(lengthFail.valid).toBe(false);
      expect(lengthFail.error).toContain('exceeds maximum limit');
    });
  });

  describe('Print & Plaintext Export', () => {
    it('renders selectable print container with raw resume text for browser print', () => {
      const { container } = render(
        <BrowserRouter>
          <CareerProvider>
            <ResumeLab />
          </CareerProvider>
        </BrowserRouter>
      );

      const printContainer = container.querySelector('.resume-print-container');
      expect(printContainer).toBeInTheDocument();
      expect(printContainer?.textContent).toContain('Resume Document — Verified Technical Draft');
    });
  });
});
