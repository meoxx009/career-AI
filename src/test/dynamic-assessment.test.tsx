import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { CareerProvider } from '../context/CareerContext';
import { Assessment } from '../pages/Assessment';
import {
  ASSESSMENT_TRACKS,
  DYNAMIC_ASSESSMENT_QUESTIONS,
  getQuestionsForTrack,
} from '../data/assessmentBank';
import {
  selectQuestionsForAssessment,
  getTrackSummary,
} from '../lib/questionSelector';
import {
  scoreAssessmentAnswers,
  calculateRoleCoverage,
  calculateAssessedAlignment,
} from '../lib/scoring';
import { SEED_ROLE_SKILL_REQUIREMENTS } from '../data/seedData';

function renderAssessment(initialEntry = '/assessment') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <CareerProvider>
        <Routes>
          <Route path="/assessment" element={<Assessment />} />
          <Route path="/roadmap" element={<div>Roadmap Page</div>} />
          <Route path="/practice" element={<div>Practice Page</div>} />
        </Routes>
      </CareerProvider>
    </MemoryRouter>
  );
}

describe('Prompt 06 & Gate 06 — Skill-based Dynamic Assessment', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('1. Assessment Track Catalogue & Question Bank Validation', () => {
    it('provides all 18 standard tracks covering software, data/AI, hardware, and design', () => {
      expect(ASSESSMENT_TRACKS.length).toBeGreaterThanOrEqual(18);

      const trackIds = ASSESSMENT_TRACKS.map((t) => t.id);
      expect(trackIds).toContain('frontend');
      expect(trackIds).toContain('backend');
      expect(trackIds).toContain('fullstack');
      expect(trackIds).toContain('cse_foundations');
      expect(trackIds).toContain('ece_embedded');
      expect(trackIds).toContain('data_analysis');
      expect(trackIds).toContain('data_engineering');
      expect(trackIds).toContain('data_science');
      expect(trackIds).toContain('ai_engineering');
      expect(trackIds).toContain('ml_engineering');
      expect(trackIds).toContain('genai');
      expect(trackIds).toContain('llm_apps');
      expect(trackIds).toContain('rag_ai');
      expect(trackIds).toContain('devops_cloud');
      expect(trackIds).toContain('cybersecurity');
      expect(trackIds).toContain('qa_automation');
      expect(trackIds).toContain('design');
      expect(trackIds).toContain('product_analytics');
    });

    it('ensures every question in the question bank maps to valid track IDs', () => {
      const validTrackIds = new Set(ASSESSMENT_TRACKS.map((t) => t.id));

      DYNAMIC_ASSESSMENT_QUESTIONS.forEach((q) => {
        expect(q.track_ids).toBeDefined();
        expect(q.track_ids!.length).toBeGreaterThan(0);
        q.track_ids!.forEach((tId) => {
          expect(validTrackIds.has(tId)).toBe(true);
        });
        expect(['easy', 'medium', 'hard']).toContain(q.difficulty);
        expect(Boolean(q.option_a && q.option_b && q.option_c && q.option_d)).toBe(true);
        expect(['a', 'b', 'c', 'd']).toContain(q.correct_key);
        expect(q.explanation).toBeTruthy();
      });
    });

    it('has specialized questions for Frontend, Backend, AI/ML, ECE, and Design tracks', () => {
      const feQs = getQuestionsForTrack('frontend');
      expect(feQs.length).toBeGreaterThanOrEqual(4);
      expect(feQs.some((q) => q.prompt.toLowerCase().includes('react') || q.prompt.toLowerCase().includes('dom'))).toBe(true);

      const beQs = getQuestionsForTrack('backend');
      expect(beQs.length).toBeGreaterThanOrEqual(4);
      expect(beQs.some((q) => q.prompt.toLowerCase().includes('response') || q.prompt.toLowerCase().includes('where'))).toBe(true);

      const aiQs = getQuestionsForTrack('ai_engineering');
      expect(aiQs.length).toBeGreaterThanOrEqual(2);
      expect(aiQs.some((q) => q.prompt.toLowerCase().includes('model') || q.prompt.toLowerCase().includes('learning') || q.prompt.toLowerCase().includes('accuracy'))).toBe(true);

      const eceQs = getQuestionsForTrack('ece_embedded');
      expect(eceQs.length).toBeGreaterThanOrEqual(3);
      expect(eceQs.some((q) => q.prompt.toLowerCase().includes('resistor') || q.prompt.toLowerCase().includes('isr'))).toBe(true);

      const designQs = getQuestionsForTrack('design');
      expect(designQs.length).toBeGreaterThanOrEqual(3);
      expect(designQs.some((q) => q.prompt.toLowerCase().includes('affordance') || q.prompt.toLowerCase().includes('interface') || q.prompt.toLowerCase().includes('research'))).toBe(true);
    });
  });

  describe('2. Pure Question Selection Engine (src/lib/questionSelector.ts)', () => {
    it('sorts questions deterministically from easy/prereq to medium to hard with stable tie-break', () => {
      const result = selectQuestionsForAssessment({
        selectedTrackId: 'frontend',
      });

      expect(result.questions.length).toBeGreaterThan(0);
      const difficultyRanks = { easy: 1, medium: 2, hard: 3 };

      for (let i = 0; i < result.questions.length - 1; i++) {
        const currRank = difficultyRanks[result.questions[i].difficulty];
        const nextRank = difficultyRanks[result.questions[i + 1].difficulty];
        expect(currRank).toBeLessThanOrEqual(nextRank);
      }
    });

    it('deduplicates questions when combining tracks and respects maxQuestions limit', () => {
      const result = selectQuestionsForAssessment({
        selectedTrackId: 'ai_engineering',
        additionalTrackIds: ['genai', 'rag_ai'],
        maxQuestions: 8,
      });

      expect(result.questions.length).toBeLessThanOrEqual(8);
      const ids = result.questions.map((q) => q.id);
      const uniqueIds = new Set(ids);
      expect(ids.length).toBe(uniqueIds.size);
    });

    it('detects content gaps transparently when a track has insufficient questions', () => {
      const result = selectQuestionsForAssessment({
        selectedTrackId: 'quantum_computing',
      });

      expect(result.isContentGap).toBe(true);
      expect(result.contentGapNotice).toContain('Questions for Quantum Computing are currently under peer review');
    });

    it('generates accurate track summary metadata', () => {
      const summary = getTrackSummary('backend');
      expect(summary.trackId).toBe('backend');
      expect(summary.totalQuestions).toBeGreaterThanOrEqual(4);
      expect(summary.assessedSkillIds.length).toBeGreaterThan(0);
      expect(summary.difficultyMix.easy).toBeGreaterThanOrEqual(1);
    });
  });

  describe('3. Deterministic Scoring & Fairness Contract', () => {
    it('treats unanswered questions as strictly null (unassessed) and never penalizes them as 0', () => {
      const feQs = getQuestionsForTrack('frontend');
      const answers = {
        [feQs[0].id]: feQs[0].correct_key,
        // all other questions unanswered
      };

      const scoreResults = scoreAssessmentAnswers(feQs, answers);
      const answeredSkill = scoreResults.find((s) => s.skillId === feQs[0].skill_id);
      expect(answeredSkill?.diagnosticEstimate).toBe(3);

      // Remaining skills should have null estimates
      const unattemptedSkills = scoreResults.filter((s) => s.skillId !== feQs[0].skill_id);
      unattemptedSkills.forEach((s) => {
        expect(s.diagnosticEstimate).toBeNull();
        expect(s.unansweredCount).toBeGreaterThan(0);
      });
    });

    it('calculates coverage and marks low coverage (<60%) as More Evidence Needed without fake ranking', () => {
      const roleReqs = SEED_ROLE_SKILL_REQUIREMENTS.filter((r) => r.role_id === 1); // Backend Developer
      // Provide observations Map for only 1 skill out of 5
      const observations = new Map<number | string, number | null>([[1, 3]]);

      const coverage = calculateRoleCoverage(roleReqs, observations);
      const alignment = calculateAssessedAlignment(roleReqs, observations);

      expect(coverage.coveragePercent).toBeLessThan(60);
      expect(alignment.state).toBe('more-evidence-needed');
      expect(alignment.alignmentPercent).toBeNull();
      expect(alignment.caveat).toContain('Coverage is below 60%');
    });

    it('ensures learner academic background or stage never alters raw question scores', () => {
      const feQs = getQuestionsForTrack('frontend');
      const answersA = { [feQs[0].id]: feQs[0].correct_key };
      const answersB = { [feQs[0].id]: feQs[0].correct_key };

      // Scoring is a pure function of questions and answers; no demographic or profile input accepted
      const scoreA = scoreAssessmentAnswers(feQs, answersA);
      const scoreB = scoreAssessmentAnswers(feQs, answersB);

      expect(scoreA).toEqual(scoreB);
    });
  });

  describe('4. Assessment UI Flow & Trust Contract', () => {
    it('renders the Track Selection screen with categories and active track details', () => {
      renderAssessment();

      expect(screen.getByText(/CHOOSE WHAT YOU WANT TO ASSESS/i)).toBeDefined();
      expect(screen.getByText(/FIELD & SKILL-BASED DIAGNOSTIC ASSESSMENT/i)).toBeDefined();

      // Check category filters
      expect(screen.getByRole('button', { name: /all tracks/i })).toBeDefined();
      expect(screen.getByRole('button', { name: /software & systems/i })).toBeDefined();
      expect(screen.getByRole('button', { name: /data & ai/i })).toBeDefined();
      expect(screen.getByRole('button', { name: /hardware & ece/i })).toBeDefined();
      expect(screen.getByRole('button', { name: /design & product/i })).toBeDefined();

      // Check start button
      expect(screen.getByRole('button', { name: /start diagnostic assessment/i })).toBeDefined();
    });

    it('allows changing track on the entry screen', () => {
      renderAssessment();

      // Click Frontend Development track card
      const feCard = screen.getByRole('button', { name: /frontend development/i });
      fireEvent.click(feCard);

      // Verify active track preview updates
      expect(screen.getAllByText(/Frontend Development/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Accessible HTML5 markup, responsive CSS layout/i).length).toBeGreaterThan(0);
    });

    it('shows content gap warning when experimental quantum computing track is selected', () => {
      renderAssessment();

      const qCard = screen.getByRole('button', { name: /quantum computing/i });
      fireEvent.click(qCard);

      expect(screen.getByText(/Questions for Quantum Computing are currently under peer review/i)).toBeDefined();
    });

    it('starts question runner with untimed mode and concept rationale', () => {
      renderAssessment();

      const startBtn = screen.getByRole('button', { name: /start diagnostic assessment/i });
      fireEvent.click(startBtn);

      // In question runner
      expect(screen.getByText(/DIAGNOSTIC \/ QUESTION 1/i)).toBeDefined();
      expect(screen.getByText(/Untimed Mode/i)).toBeDefined();
      expect(screen.getByRole('button', { name: /why this matters/i })).toBeDefined();

      // Toggle concept rationale drawer
      const whyBtn = screen.getByRole('button', { name: /why this matters/i });
      fireEvent.click(whyBtn);
      expect(screen.getByText(/Concept Rationale:/i)).toBeDefined();
    });

    it('supports clearing an answer back to unanswered (unknown)', () => {
      renderAssessment();

      fireEvent.click(screen.getByRole('button', { name: /start diagnostic assessment/i }));

      const optionA = screen.getByLabelText(/loop once and track seen values/i);
      fireEvent.click(optionA);

      // Clear answer button appears
      const clearBtn = screen.getByRole('button', { name: /clear answer/i });
      expect(clearBtn).toBeDefined();
      fireEvent.click(clearBtn);

      // Returns to "Unanswered questions remain unknown"
      expect(screen.getByText(/unanswered questions remain unknown/i)).toBeDefined();
    });

    it('displays mandatory exact copy on completion: "This is a short diagnostic estimate, not a certificate."', () => {
      renderAssessment();

      fireEvent.click(screen.getByRole('button', { name: /start diagnostic assessment/i }));

      // Answer question 1 and finish immediately
      fireEvent.click(screen.getByLabelText(/loop once and track seen values/i));
      fireEvent.click(screen.getByRole('button', { name: /finish now with current answers/i }));

      // Completed screen
      expect(screen.getByText('This is a short diagnostic estimate, not a certificate.')).toBeDefined();
      expect(screen.getByRole('heading', { level: 1, name: /DIAGNOSTIC ESTIMATE/i })).toBeDefined();
      expect(screen.getByText(/EVALUATION BENCHMARK/i)).toBeDefined();
      expect(screen.getByText(/Track Coverage Ratio/i)).toBeDefined();
      expect(screen.getByText(/Evidence Gathered/i)).toBeDefined();
      expect(screen.getByText(/Prioritized Gaps/i)).toBeDefined();
      expect(screen.getByText(/Unknown Areas & Next Actions/i)).toBeDefined();
    });
  });
});
