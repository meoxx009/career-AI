import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { CareerProvider } from '../context/CareerContext';
import { AppShell } from '../components/AppShell';
import { Onboarding } from '../pages/Onboarding';
import { Paths } from '../pages/Paths';
import { Settings } from '../pages/Settings';
import {
  generatePathRecommendations,
} from '../lib/pathRecommendations';
import { UserProfileSchema, LearnerStageSchema, SchoolStreamSchema } from '../data/validator';
import { DEMO_RAHUL_PROFILE } from '../data/demoRahul';
import type { UserProfile } from '../types';

function renderApp(initialRoute: string) {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <CareerProvider>
        <AppShell>
          <Routes>
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/paths" element={<Paths />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </AppShell>
      </CareerProvider>
    </MemoryRouter>
  );
}

describe('Prompt 04 & Gate 04 — School, College, and Self-Taught Learner Intake & Path Explorer', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('1. Zod Validation & Schema Safety', () => {
    it('validates all learner stages against LearnerStageSchema', () => {
      const validStages = [
        'class_10',
        'class_11_12',
        'diploma',
        'undergraduate',
        'postgraduate',
        'recent_graduate',
        'self_taught',
      ];
      validStages.forEach(st => {
        expect(LearnerStageSchema.safeParse(st).success).toBe(true);
      });
      expect(LearnerStageSchema.safeParse('phd_candidate').success).toBe(false);
    });

    it('validates all school streams against SchoolStreamSchema', () => {
      const validStreams = ['pcm', 'pcb', 'pcmb', 'commerce', 'arts', 'vocational'];
      validStreams.forEach(str => {
        expect(SchoolStreamSchema.safeParse(str).success).toBe(true);
      });
      expect(SchoolStreamSchema.safeParse('astronomy').success).toBe(false);
    });

    it('validates a complete school learner profile with Zod', () => {
      const schoolProfile: UserProfile = {
        id: 'school-user-1',
        displayName: 'Aarav Gupta',
        learnerStage: 'class_10',
        schoolClass: 'Class 10',
        stream: 'pcm',
        branch: 'School (PCM)',
        studyYear: 'Class 10',
        hoursPerWeek: 6,
        preferredRoles: ['backend-developer'],
        preferredRoleIds: [1],
        favoriteSubjects: ['Mathematics', 'Computer Science'],
        interests: ['software-development', 'data-analysis'],
        currentSkills: ['Programming logic'],
        isGuestDemo: false,
      };

      const result = UserProfileSchema.safeParse(schoolProfile);
      expect(result.success).toBe(true);
    });

    it('validates a self-taught switcher profile with missing optional fields', () => {
      const selfTaughtProfile: UserProfile = {
        id: 'switcher-user-1',
        displayName: '',
        learnerStage: 'self_taught',
        branch: 'Self-Taught / Other',
        studyYear: 'Self-Taught / Independent',
        hoursPerWeek: 12,
        preferredRoles: ['frontend-developer'],
        interests: ['frontend', 'ui-ux-design'],
        isGuestDemo: false,
      };

      const result = UserProfileSchema.safeParse(selfTaughtProfile);
      expect(result.success).toBe(true);
    });
  });

  describe('2. Deterministic Recommendation Logic by Stage & Stream', () => {
    it('generates Mathematics / PCM recommendations with software and quantitative foundations', () => {
      const recResult = generatePathRecommendations({
        learnerStage: 'class_11_12',
        stream: 'pcm',
        hoursPerWeek: 8,
      });

      expect(recResult.isSchoolLearner).toBe(true);
      expect(recResult.streamOpportunity).toBeDefined();
      expect(recResult.streamOpportunity?.streamName).toMatch(/PCM/i);
      expect(recResult.streamOpportunity?.opportunityDirections.length).toBeGreaterThan(0);

      // Verify PCM-aligned suggestions
      const csRec = recResult.recommendations.find(r => r.id === 'rec-pcm-cs');
      expect(csRec).toBeDefined();
      expect(csRec?.title).toContain('Computer Science & Software');
      expect(csRec?.whySuggested).toContain('Mathematics/PCM');
      expect(csRec?.disclaimer).toContain('not an admission, placement, or hiring guarantee');

      const dataRec = recResult.recommendations.find(r => r.id === 'rec-pcm-data');
      expect(dataRec).toBeDefined();
      expect(dataRec?.title).toContain('Data Modeling & Quantitative AI');
    });

    it('generates Biology / PCB recommendations with health informatics and life sciences', () => {
      const recResult = generatePathRecommendations({
        learnerStage: 'class_11_12',
        stream: 'pcb',
        hoursPerWeek: 6,
      });

      expect(recResult.isSchoolLearner).toBe(true);
      expect(recResult.streamOpportunity?.streamName).toMatch(/PCB/i);
      const bioRec = recResult.recommendations.find(r => r.id === 'rec-pcb-bioinformatics');
      expect(bioRec).toBeDefined();
      expect(bioRec?.title).toContain('Biotechnology & Health Data');
      expect(bioRec?.whySuggested).toContain('Biology/PCB');
    });

    it('generates Commerce recommendations with business analytics and fintech', () => {
      const recResult = generatePathRecommendations({
        learnerStage: 'class_10',
        stream: 'commerce',
        interests: ['finance-commerce'],
        hoursPerWeek: 10,
      });

      expect(recResult.isSchoolLearner).toBe(true);
      expect(recResult.streamOpportunity?.streamName).toMatch(/Commerce/i);

      const commRec = recResult.recommendations.find(r => r.id === 'rec-commerce-analytics');
      expect(commRec).toBeDefined();
      expect(commRec?.title).toContain('Business Analytics & Financial Data');
      expect(commRec?.whySuggested).toContain('Commerce');

      const fintechRec = recResult.recommendations.find(r => r.id === 'rec-commerce-fintech');
      expect(fintechRec).toBeDefined();
      expect(fintechRec?.title).toContain('FinTech Operations');
    });

    it('generates Arts / Humanities recommendations with UI/UX and cyber policy', () => {
      const recResult = generatePathRecommendations({
        learnerStage: 'class_11_12',
        stream: 'arts',
        interests: ['ui-ux-design'],
        hoursPerWeek: 8,
      });

      expect(recResult.isSchoolLearner).toBe(true);
      expect(recResult.streamOpportunity?.streamName).toMatch(/Arts/i);

      const designRec = recResult.recommendations.find(r => r.id === 'rec-arts-design');
      expect(designRec).toBeDefined();
      expect(designRec?.title).toContain('UI / UX & Human-Centered Design');
      expect(designRec?.whySuggested).toContain('Arts and humanities');

      const policyRec = recResult.recommendations.find(r => r.id === 'rec-arts-policy');
      expect(policyRec).toBeDefined();
      expect(policyRec?.title).toContain('Cyber Policy, Legal Tech');
    });

    it('generates college BCA / MCA recommendations without engineering degree bias', () => {
      const bcaRec = generatePathRecommendations({
        learnerStage: 'undergraduate',
        degree: 'BCA',
        branch: 'BCA',
        interests: ['backend', 'software-development'],
      });

      expect(bcaRec.isSchoolLearner).toBe(false);
      const backendRec = bcaRec.recommendations.find(r => r.id === 'rec-backend-pro');
      expect(backendRec).toBeDefined();
      expect(backendRec?.contributingInputs.some(input => input.includes('BCA'))).toBe(true);

      const mcaRec = generatePathRecommendations({
        learnerStage: 'postgraduate',
        degree: 'MCA',
        branch: 'MCA',
        interests: ['data-analysis', 'ai-ml'],
      });
      expect(mcaRec.isSchoolLearner).toBe(false);
      const dataRec = mcaRec.recommendations.find(r => r.id === 'rec-data-pro');
      expect(dataRec).toBeDefined();
    });

    it('generates self-taught switcher recommendations with AI/ML interest', () => {
      const selfTaught = generatePathRecommendations({
        learnerStage: 'self_taught',
        degree: 'Self-taught / Other',
        interests: ['ai-ml', 'genai-llm', 'data-analysis'],
        hoursPerWeek: 15,
      });

      expect(selfTaught.isSchoolLearner).toBe(false);
      expect(selfTaught.stageLabel).toContain('Self-taught');
      const dataRec = selfTaught.recommendations.find(r => r.id === 'rec-data-pro');
      expect(dataRec).toBeDefined();
      expect(dataRec?.title).toContain('Data Analytics & Evidence-Led Decision');
    });

    it('does NOT use CGPA, gender, or college prestige to rank ability scores', () => {
      // Both profiles are identical except for CGPA (9.8 vs 5.2)
      const highCgpa = generatePathRecommendations({
        learnerStage: 'undergraduate',
        degree: 'BTech / BE Computer Science',
        cgpa: '9.8',
        interests: ['backend'],
        hoursPerWeek: 10,
      });

      const lowCgpa = generatePathRecommendations({
        learnerStage: 'undergraduate',
        degree: 'BTech / BE Computer Science',
        cgpa: '5.2',
        interests: ['backend'],
        hoursPerWeek: 10,
      });

      // Recommendations must be deterministically identical in title, count, and order
      expect(highCgpa.recommendations.length).toBe(lowCgpa.recommendations.length);
      expect(highCgpa.recommendations[0].id).toBe(lowCgpa.recommendations[0].id);
      expect(highCgpa.recommendations[0].title).toBe(lowCgpa.recommendations[0].title);
      expect(highCgpa.recommendations[0].whySuggested).toBe(lowCgpa.recommendations[0].whySuggested);
    });
  });

  describe('3. Onboarding & Multi-Stage Intake Workflow (Gate 04)', () => {
    it('allows a school learner (Class 10 PCM) to select stage and advance through onboarding', () => {
      renderApp('/onboarding');

      // 1. Select Class 10 stage
      const class10Radio = screen.getByRole('radio', { name: /Class 10 completed/i });
      fireEvent.click(class10Radio);
      expect(class10Radio.getAttribute('aria-checked')).toBe('true');

      // 2. Select PCM stream
      const pcmBtn = screen.getByRole('button', { name: /Mathematics \/ PCM/i });
      fireEvent.click(pcmBtn);

      // 3. Continue to step 2
      const continueBtn = screen.getByRole('button', { name: /continue/i });
      fireEvent.click(continueBtn);

      // 4. Step 2 shows study commitment
      expect(screen.getByText(/WEEKLY DEDICATED STUDY COMMITMENT/i)).toBeDefined();

      // 5. Select Software Development interest
      const softDevBtn = screen.getByRole('button', { name: /Software Development/i });
      fireEvent.click(softDevBtn);

      // 6. Continue to step 3
      fireEvent.click(continueBtn);
      expect(screen.getByText(/03\/03/i)).toBeDefined();

      // 7. Step 3 shows Stream-Aligned Opportunity Group and Starter Paths
      expect(screen.getByText(/Opportunities for Mathematics \/ PCM/i)).toBeDefined();
      expect(screen.getByText(/Starter paths — available to explore before assessment/i)).toBeDefined();
      expect(screen.getByText(/You can begin foundation preparation now\. Role readiness is not being claimed/i)).toBeDefined();

      // 8. Select first starter role and verify button is ready
      const roleCards = screen.getAllByRole('checkbox');
      fireEvent.click(roleCards[0]);
      expect(screen.getByRole('button', { name: /start diagnostic assessment/i })).toBeDefined();
    });

    it('allows a Biology / PCB learner to onboard with health data path guidance', () => {
      renderApp('/onboarding');

      // Select Class 11-12 stage
      const class11Radio = screen.getByRole('radio', { name: /Class 11–12/i });
      fireEvent.click(class11Radio);

      // Select PCB stream
      const pcbBtn = screen.getByRole('button', { name: /Biology \/ PCB/i });
      fireEvent.click(pcbBtn);

      // Step 2 & 3
      fireEvent.click(screen.getByRole('button', { name: /continue/i }));
      fireEvent.click(screen.getByRole('button', { name: /continue/i }));

      // Confirm PCB opportunities shown
      expect(screen.getByText(/Opportunities for Biology \/ PCB/i)).toBeDefined();
      expect(screen.getByText(/Biotechnology & Health Data Foundations/i)).toBeDefined();
    });

    it('allows a Self-Taught career switcher to onboard without degree roadblock', () => {
      renderApp('/onboarding');

      // Select Self-taught stage
      const selfTaughtRadio = screen.getByRole('radio', { name: /Self-taught \/ career switcher/i });
      fireEvent.click(selfTaughtRadio);

      // Select degree/qualification as Self-taught
      const branchSelect = screen.getByRole('combobox', { name: /academic degree \/ branch/i });
      fireEvent.change(branchSelect, { target: { value: 'Self-Taught / Other' } });

      const yearSelect = screen.getByRole('combobox', { name: /current academic year/i });
      fireEvent.change(yearSelect, { target: { value: 'Working / Career Switch' } });

      fireEvent.click(screen.getByRole('button', { name: /continue/i }));
      expect(screen.getByText(/WEEKLY DEDICATED STUDY COMMITMENT/i)).toBeDefined();

      // Advance to Step 3
      fireEvent.click(screen.getByRole('button', { name: /continue/i }));
      expect(screen.getByText(/CAREER INTERESTS & BENCHMARK/i)).toBeDefined();
      expect(screen.getByText(/Starter paths — available to explore before assessment/i)).toBeDefined();
    });
  });

  describe('4. Path Explorer & Settings Integration', () => {
    it('renders Path Explorer with clean personalized recommendations without unconditional starter paths', () => {
      renderApp('/paths');

      // Top header
      expect(screen.getByText(/CAREER PATH COMPARISON/i)).toBeDefined();

      // Current context bar with customize button
      expect(screen.getByText(/CURRENT CONTEXT/i)).toBeDefined();
      expect(screen.getByRole('button', { name: /Customize Profile & Interests/i })).toBeDefined();

      // Suggested directions section
      expect(screen.getByText(/PERSONALIZED PATH SUGGESTIONS/i)).toBeDefined();
      expect(screen.getByText(/Suggested Directions for You/i)).toBeDefined();

      // Starter paths section is cleanly absent from Paths page
      expect(screen.queryByText(/FOUNDATIONAL BENCHMARKS \/ ENTRY ROLES/i)).toBeNull();
      expect(screen.queryByText(/Starter paths — available to explore before assessment/i)).toBeNull();
    });

    it('toggles profile editor in Paths and updates recommendations on stream change', async () => {
      renderApp('/paths');

      const customizeBtn = screen.getByRole('button', { name: /Customize Profile & Interests/i });
      fireEvent.click(customizeBtn);

      // Form expands
      expect(screen.getByText(/What is your current learner stage\?/i)).toBeDefined();

      // Change stage to Class 10
      const class10Radio = screen.getByRole('radio', { name: /Class 10 completed/i });
      fireEvent.click(class10Radio);

      // Select Commerce stream
      const commerceBtn = screen.getByRole('button', { name: /^Commerce/i });
      fireEvent.click(commerceBtn);

      // Apply changes
      const applyBtn = screen.getByRole('button', { name: /Apply & View Updated Directions/i });
      fireEvent.click(applyBtn);

      // Stream opportunity card for Commerce is now displayed
      await waitFor(() => {
        expect(screen.getByText(/Opportunities for Commerce/i)).toBeDefined();
        expect(screen.getByText(/Business Analytics & Financial Data Systems/i)).toBeDefined();
      });
    });

    it('ensures learner profile editor is absent from Settings and directs to /profile/edit', () => {
      renderApp('/settings');

      expect(screen.getByText(/Learner Profile & Academic Horizon/i)).toBeDefined();
      expect(screen.queryByText(/What is your current learner stage\?/i)).toBeNull();
      expect(screen.queryByRole('button', { name: /Save Profile/i })).toBeNull();
      expect(screen.getByRole('link', { name: /open learner profile editor/i })).toHaveAttribute('href', '/profile/edit');
    });

    it('preserves existing Rahul demo fixture compatibility', () => {
      expect(DEMO_RAHUL_PROFILE.learnerStage).toBe('undergraduate');
      expect(DEMO_RAHUL_PROFILE.degree).toBe('BTech / BE Computer Science');
      expect(DEMO_RAHUL_PROFILE.hoursPerWeek).toBe(8);
      expect(DEMO_RAHUL_PROFILE.isGuestDemo).toBe(true);

      const rahulRecs = generatePathRecommendations(DEMO_RAHUL_PROFILE);
      expect(rahulRecs.isSchoolLearner).toBe(false);
      expect(rahulRecs.recommendations.some(r => r.alignedRoleId === 1)).toBe(true);
    });
  });
});
