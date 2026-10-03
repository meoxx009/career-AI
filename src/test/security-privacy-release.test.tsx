import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import fs from 'fs';
import path from 'path';
import { CareerProvider } from '../context/CareerContext';
import { Settings } from '../pages/Settings';
import { sanitizeEventPayload } from '../lib/analytics';
import { calculateRoleCoverage, calculateAssessedAlignment } from '../lib/scoring';
import { analyzeResume } from '../lib/resumeAnalyzer';
import { evaluateInterviewAnswer } from '../lib/interviewEvaluator';
import { SEED_INTERVIEW_QUESTIONS } from '../data/seedData';
import { LocalProfileRepository } from '../lib/repositories/profileRepository';

describe('Prompt 15 & Gate 15 — Security, Privacy, Data Deletion & Release Audit', () => {
  describe('1. Secret & Key Audit (Zero Secrets in Client Source)', () => {
    it('verifies no hardcoded service-role secrets or private AI API keys exist in client source', () => {
      const srcDir = path.resolve(process.cwd(), 'src');
      const files: string[] = [];

      function getFilesRecursively(dir: string) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            if (entry.name === 'test') continue; // Skip test fixtures
            getFilesRecursively(fullPath);
          } else if (/\.(ts|tsx|js|css)$/.test(entry.name)) {
            files.push(fullPath);
          }
        }
      }
      getFilesRecursively(srcDir);

      const secretPatterns = [
        /AIzaSy[A-Za-z0-9_-]{33}/, // Google Gemini live API key pattern
        /sk-[A-Za-z0-9]{20,}/,     // Standard bearer secret key pattern
        /service_role_key\s*=\s*['"][^'"]+['"]/i,
        /sbp_[a-zA-Z0-9]{20,}/,    // Supabase service key pattern
      ];

      for (const file of files) {
        const content = fs.readFileSync(file, 'utf-8');
        for (const pattern of secretPatterns) {
          expect(content).not.toMatch(pattern);
        }
      }
    });

    it('verifies that only VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are used in client', () => {
      const clientFile = path.resolve(process.cwd(), 'src/lib/supabaseClient.ts');
      const content = fs.readFileSync(clientFile, 'utf-8');

      // Check all VITE_ usages
      const matches = content.match(/import\.meta\.env\.(VITE_[A-Z_]+)/g) || [];
      const envVars = matches.map(m => m.replace('import.meta.env.', ''));

      for (const envVar of envVars) {
        expect(['VITE_SUPABASE_URL', 'VITE_SUPABASE_PUBLISHABLE_KEY', 'VITE_SUPABASE_ANON_KEY']).toContain(envVar);
      }
    });
  });

  describe('2. Safe Boundary, No Unsafe HTML, and Safe External Links', () => {
    it('verifies dangerouslySetInnerHTML is not used anywhere in product application code', () => {
      const srcDir = path.resolve(process.cwd(), 'src');
      let found = false;

      function checkDir(dir: string) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            if (entry.name === 'test') continue;
            checkDir(fullPath);
          } else if (/\.(ts|tsx)$/.test(entry.name)) {
            const content = fs.readFileSync(fullPath, 'utf-8');
            if (content.includes('dangerouslySetInnerHTML')) {
              found = true;
            }
          }
        }
      }
      checkDir(srcDir);
      expect(found).toBe(false);
    });

    it('verifies external links include rel="noopener noreferrer"', () => {
      const roadmapCode = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/Roadmap.tsx'), 'utf-8');
      const homeCode = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/Home.tsx'), 'utf-8');

      expect(roadmapCode).toContain('rel="noopener noreferrer"');
      expect(homeCode).toContain('rel="noopener noreferrer"');
    });
  });

  describe('3. Telemetry & Privacy Sanitization', () => {
    it('strips raw resume text, interview answers, AI payloads and private keys from analytics payloads', () => {
      const dirtyPayload = {
        eventName: 'interview_session_saved',
        rawText: 'My secret resume text with private company info',
        answerText: 'My confidential interview answer about internal infrastructure',
        resumeText: 'Private resume details',
        facts: [{ id: 'f1', text: 'Private project fact' }],
        aiPayload: { prompt: 'System prompt with private candidate data' },
        password: 'secret_user_password_123',
        jobDescription: 'Confidential client internal job spec',
        safeMetric: 42,
        roleId: 1,
      };

      const sanitized = sanitizeEventPayload(dirtyPayload);

      expect(sanitized).not.toHaveProperty('rawText');
      expect(sanitized).not.toHaveProperty('answerText');
      expect(sanitized).not.toHaveProperty('resumeText');
      expect(sanitized).not.toHaveProperty('facts');
      expect(sanitized).not.toHaveProperty('aiPayload');
      expect(sanitized).not.toHaveProperty('password');
      expect(sanitized).not.toHaveProperty('jobDescription');

      expect(sanitized).toHaveProperty('safeMetric', 42);
      expect(sanitized).toHaveProperty('roleId', 1);
    });

    it('truncates oversized payload strings to prevent document leakage into event tables', () => {
      const longString = 'a'.repeat(300);
      const payload = { details: longString, shortNote: 'hello' };
      const sanitized = sanitizeEventPayload(payload);

      expect(sanitized.details).toBe('[TRUNCATED_FOR_PRIVACY]');
      expect(sanitized.shortNote).toBe('hello');
    });
  });

  describe('4. Data Deletion, Export Boundary & P1 Known Gap Notice', () => {
    it('renders the Data Export and Account Erasure boundary in Settings with P1 notice', () => {
      render(
        <MemoryRouter>
          <CareerProvider>
            <Settings />
          </CareerProvider>
        </MemoryRouter>
      );

      // Verify Export button is visible
      expect(screen.getByRole('button', { name: /download my data \(json\)/i })).toBeInTheDocument();

      // Verify Erasure button is visible
      expect(screen.getByRole('button', { name: /erase all my data & reset/i })).toBeInTheDocument();

      // Verify P1 Known Gap notice is honestly and visibly declared
      expect(screen.getByText(/known p1 boundary notice/i)).toBeInTheDocument();
      expect(screen.getByText(/full purge of supabase auth login credentials/i)).toBeInTheDocument();

      // Verify Non-Guarantee Trust Contract is visible
      expect(screen.getByText(/guidance & trust contract/i)).toBeInTheDocument();
      expect(screen.getByText(/does not guarantee employment, salary, job offers, or ats screening passes/i)).toBeInTheDocument();
    });

    it('verifies LocalProfileRepository deleteProfile purges user-scoped data', async () => {
      const repo = new LocalProfileRepository('test_storage_key');
      const testProfile = {
        id: 'test-user-xyz',
        displayName: 'Test User',
        branch: 'CS',
        studyYear: '3',
        hoursPerWeek: 10,
        preferredRoles: ['Backend Developer'],
        preferredRoleIds: [1],
        cgpa: '8.5',
        locationPreference: 'Bangalore',
        currentSkills: [],
        projectFacts: '',
        isGuestDemo: false,
        targetRoleId: 1,
      };

      await repo.upsertProfile(testProfile);
      const saved = await repo.getProfile('test-user-xyz');
      expect(saved.data?.displayName).toBe('Test User');

      // Perform deletion
      await repo.deleteProfile('test-user-xyz');
      const afterDelete = await repo.getProfile('test-user-xyz');
      expect(afterDelete.data?.displayName).toBe('');
    });
  });

  describe('5. Safety Guardrails: Hallucination Prevention & Coverage Boundaries', () => {
    it('prevents hallucinated claims in deterministic resume evaluation (Gate 11 Contract)', () => {
      const input = 'Built a chat application using Python.';
      const res = analyzeResume({
        resumeText: input,
        jobDescription: 'Entry-level Python developer wanted. Must have 99.9% uptime, 1000 users, 40% speedup, AWS.',
        roleId: 1,
        facts: [],
      });

      for (const s of res.suggestions) {
        expect(s.rewrite).not.toMatch(/1000 users/i);
        expect(s.rewrite).not.toMatch(/99\.9%/);
        expect(s.rewrite).not.toMatch(/40%/);
        expect(s.rewrite).not.toMatch(/AWS/i);
      }
    });

    it('marks alignment as unranked when coverage is below 60%', () => {
      const requirements = [
        { skill_id: 1, target_level: 2, importance: 3 },
        { skill_id: 2, target_level: 2, importance: 3 },
      ];
      // Zero observations = 0% coverage
      const coverage = calculateRoleCoverage(requirements, new Map());
      expect(coverage.isSufficient).toBe(false);
      expect(coverage.coverageRatio).toBe(0);

      const alignment = calculateAssessedAlignment(requirements, new Map());
      expect(alignment.state).toBe('unassessed');
      expect(alignment.alignmentPercent).toBeNull();

      // Partial observation giving 50% coverage (< 60%)
      const partialObs = new Map<number, number | null>([[1, 2]]);
      const partialCoverage = calculateRoleCoverage(requirements, partialObs);
      expect(partialCoverage.isSufficient).toBe(false);
      expect(partialCoverage.coverageRatio).toBe(0.5);

      const partialAlignment = calculateAssessedAlignment(requirements, partialObs);
      expect(partialAlignment.state).toBe('more-evidence-needed');
      expect(partialAlignment.alignmentPercent).toBeNull();
    });

    it('interview evaluation rubric does not produce hire/no-hire decisions or emotional inferences', () => {
      const q = SEED_INTERVIEW_QUESTIONS[0];
      const feedback = evaluateInterviewAnswer(q, 'I built a python CLI app and used pytest for unit testing.');

      expect(feedback.caveat).toContain('Not a hiring decision');
      expect(feedback.caveat).toContain('CareerAI never evaluates video, facial expressions, tone, accent, or emotion');
    });
  });
});
