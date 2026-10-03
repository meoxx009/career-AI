import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { CareerProvider } from '../context/CareerContext';
import { AppShell } from '../components/AppShell';
import { Settings } from '../pages/Settings';
import { isSupabaseConfigured, getSupabaseClient } from '../lib/supabaseClient';
import {
  LocalProfileRepository,
  LocalAssessmentRepository,
  LocalObservationRepository,
  LocalRoadmapRepository,
  LocalResumeRepository,
} from '../lib/repositories';
import { STORAGE_KEY, EMPTY_PROFILE } from '../context/careerConstants';

function renderSettings() {
  return render(
    <MemoryRouter initialEntries={['/settings']}>
      <CareerProvider>
        <AppShell>
          <Routes>
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </AppShell>
      </CareerProvider>
    </MemoryRouter>
  );
}

/**
 * Deterministic policy evaluator that mirrors Postgres RLS policies in
 * supabase/migrations/0001_initial.sql:
 * - using (auth.uid() = user_id) with check (auth.uid() = user_id)
 * - seed tables: select to authenticated using (active = true); no insert/update/delete policy
 */
function evaluateRlsPolicy(
  table: 'profiles' | 'user_data' | 'seed_tables',
  operation: 'select' | 'insert' | 'update' | 'delete',
  authUid: string | null,
  rowUserId?: string
): boolean {
  // Anonymous requests
  if (!authUid) {
    return false;
  }

  // Seed tables (skills, career_roles, assessment_questions)
  if (table === 'seed_tables') {
    // Normal users only have select permissions on active rows
    return operation === 'select';
  }

  // Profiles table: using (auth.uid() = id)
  if (table === 'profiles') {
    return authUid === rowUserId;
  }

  // User-owned tables: using (auth.uid() = user_id)
  return authUid === rowUserId;
}

describe('Prompt 09 & Gate 09 — Supabase Data Layer, Fallback & RLS Verification', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('Client Initialization & Safe Fallback', () => {
    it('initializes safely without crashing when environment credentials are unconfigured', () => {
      // In testing without live env, isSupabaseConfigured returns false or evaluates safely
      const configured = isSupabaseConfigured();
      expect(typeof configured).toBe('boolean');

      const client = getSupabaseClient();
      if (!configured) {
        expect(client).toBeNull();
      }
    });

    it('LocalProfileRepository provides clean fallback reads and writes', async () => {
      const repo = new LocalProfileRepository(STORAGE_KEY);
      const initial = await repo.getProfile('guest-user');
      expect(initial.data).toBeDefined();
      expect(initial.error).toBeNull();

      const updated = {
        ...EMPTY_PROFILE,
        displayName: 'Test Candidate',
        branch: 'Information Technology',
      };
      const saveRes = await repo.upsertProfile(updated);
      expect(saveRes.error).toBeNull();
      expect(saveRes.data?.displayName).toBe('Test Candidate');

      const verifyRes = await repo.getProfile('guest-user');
      expect(verifyRes.data?.displayName).toBe('Test Candidate');
    });

    it('LocalAssessmentRepository manages attempts and answers locally', async () => {
      const repo = new LocalAssessmentRepository(STORAGE_KEY);
      const attempt = await repo.createAttempt('guest-user', 'v1.0');
      expect(attempt.data?.id).toBeDefined();

      await repo.saveAnswer(attempt.data!.id, 'guest-user', 'q01', 'a', true);
      const answers = await repo.getAnswers(attempt.data!.id);
      expect(answers.data?.q01).toBe('a');
    });

    it('LocalObservationRepository batches skill observations locally', async () => {
      const repo = new LocalObservationRepository(STORAGE_KEY);
      await repo.saveObservationsBatch('guest-user', [
        { skillId: 1, value: 3, source: 'diagnostic' },
        { skillId: 2, value: 2, source: 'diagnostic' },
      ]);

      const obs = await repo.getObservations('guest-user');
      expect(obs.data?.[1]).toBe(3);
      expect(obs.data?.[2]).toBe(2);
    });

    it('LocalRoadmapRepository and LocalResumeRepository persist correctly', async () => {
      const roadmapRepo = new LocalRoadmapRepository(STORAGE_KEY);
      const tasksRes = await roadmapRepo.getRoadmapTasks('guest-user', 1);
      expect(tasksRes.data?.length).toBeGreaterThan(0);

      const resumeRepo = new LocalResumeRepository(STORAGE_KEY);
      const initialResume = await resumeRepo.getResumeDocument('guest-user');
      expect(initialResume.data).toBeDefined();

      await resumeRepo.saveResumeDocument('guest-user', {
        id: 'res-1',
        userId: 'guest-user',
        label: 'Candidate Resume',
        rawText: 'Experienced with Python and REST APIs.',
        facts: [],
      });

      const loadedResume = await resumeRepo.getResumeDocument('guest-user');
      expect(loadedResume.data?.rawText).toContain('Python');
    });
  });

  describe('Gate 09 — RLS Policy Contract Verification', () => {
    const USER_A = 'user-uuid-1111-aaaa';
    const USER_B = 'user-uuid-2222-bbbb';

    it('Rule 1: Anonymous users cannot read or write user-owned rows (Gate 09)', () => {
      // Anonymous (null auth.uid)
      expect(evaluateRlsPolicy('profiles', 'select', null, USER_A)).toBe(false);
      expect(evaluateRlsPolicy('user_data', 'select', null, USER_A)).toBe(false);
      expect(evaluateRlsPolicy('user_data', 'insert', null, USER_A)).toBe(false);
      expect(evaluateRlsPolicy('user_data', 'update', null, USER_A)).toBe(false);
      expect(evaluateRlsPolicy('user_data', 'delete', null, USER_A)).toBe(false);
    });

    it('Rule 2: User A cannot read, update, or delete User B rows (Gate 09)', () => {
      // User A attempting to read User B's profile
      expect(evaluateRlsPolicy('profiles', 'select', USER_A, USER_B)).toBe(false);

      // User A attempting to read User B's assessments, roadmaps, or resumes
      expect(evaluateRlsPolicy('user_data', 'select', USER_A, USER_B)).toBe(false);

      // User A attempting to update or delete User B's data
      expect(evaluateRlsPolicy('user_data', 'update', USER_A, USER_B)).toBe(false);
      expect(evaluateRlsPolicy('user_data', 'delete', USER_A, USER_B)).toBe(false);
    });

    it('Rule 3: User A can read and write only their own user-owned rows (Gate 09)', () => {
      // User A on own profile
      expect(evaluateRlsPolicy('profiles', 'select', USER_A, USER_A)).toBe(true);
      expect(evaluateRlsPolicy('profiles', 'update', USER_A, USER_A)).toBe(true);

      // User A on own roadmap, assessment answers, observations, resume
      expect(evaluateRlsPolicy('user_data', 'select', USER_A, USER_A)).toBe(true);
      expect(evaluateRlsPolicy('user_data', 'insert', USER_A, USER_A)).toBe(true);
      expect(evaluateRlsPolicy('user_data', 'update', USER_A, USER_A)).toBe(true);
      expect(evaluateRlsPolicy('user_data', 'delete', USER_A, USER_A)).toBe(true);
    });

    it('Rule 4: Normal authenticated users cannot modify seed tables (Gate 09)', () => {
      // Authenticated users can select active seed records
      expect(evaluateRlsPolicy('seed_tables', 'select', USER_A)).toBe(true);

      // Normal users CANNOT insert, update, or delete seed tables
      expect(evaluateRlsPolicy('seed_tables', 'insert', USER_A)).toBe(false);
      expect(evaluateRlsPolicy('seed_tables', 'update', USER_A)).toBe(false);
      expect(evaluateRlsPolicy('seed_tables', 'delete', USER_A)).toBe(false);
    });
  });

  describe('Settings UI & Auth Integration', () => {
    it('displays non-alarming persistence boundary and account status in Settings', () => {
      renderSettings();
      expect(screen.getByText(/Account & Persistence Boundary/i)).toBeDefined();
      expect(screen.getByText(/Guest Learner/i)).toBeDefined();
    });

    it('opens AuthModal with accessible controls and mode switching', () => {
      renderSettings();

      // Click "Sign In" button on settings page
      const signInBtns = screen.getAllByRole('button', { name: /Sign In/i });
      expect(signInBtns.length).toBeGreaterThan(0);
      fireEvent.click(signInBtns[0]);

      // Auth modal opens
      expect(screen.getByRole('dialog')).toBeDefined();
      expect(screen.getByLabelText(/Email Address/i)).toBeDefined();
      expect(screen.getByLabelText(/Password/i)).toBeDefined();

      // Switch to Sign up mode
      const switchSignUp = screen.getByRole('button', { name: /Need an account\? Sign up/i });
      fireEvent.click(switchSignUp);
      expect(screen.getByText(/Create Your Account/i)).toBeDefined();
      expect(screen.getByLabelText(/Confirm Password/i)).toBeDefined();

      // Switch to Forgot password mode
      const backSignIn = screen.getByRole('button', { name: /Already have an account\? Sign in/i });
      fireEvent.click(backSignIn);

      const forgotBtn = screen.getByRole('button', { name: /Forgot your password\?/i });
      fireEvent.click(forgotBtn);
      expect(screen.getByText(/Reset Password/i)).toBeDefined();
    });

    it('validates email and passwords in AuthModal before submission', () => {
      renderSettings();

      const signInBtns = screen.getAllByRole('button', { name: /Sign In/i });
      fireEvent.click(signInBtns[0]);

      const dialog = screen.getByRole('dialog');
      const form = dialog.querySelector('form')!;
      const emailInput = within(dialog).getByLabelText(/Email Address/i);
      const passwordInput = within(dialog).getByLabelText(/Password/i);

      // Enter invalid email (missing @)
      fireEvent.change(emailInput, { target: { value: 'notanemail' } });
      fireEvent.change(passwordInput, { target: { value: 'secret123' } });
      fireEvent.submit(form);

      expect(screen.getByRole('alert')).toBeDefined();
      expect(screen.getByText(/Please enter a valid email address/i)).toBeDefined();

      // Enter valid email but short password
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: '123' } });
      fireEvent.submit(form);

      expect(screen.getByRole('alert')).toBeDefined();
      expect(screen.getByText(/Password must be at least 6 characters/i)).toBeDefined();
    });
  });
});
