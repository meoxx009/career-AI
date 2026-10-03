import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { CareerProvider, useCareer } from '../context/CareerContext';
import { LocalProfileRepository } from '../lib/repositories/profileRepository';
import { logProductEvent } from '../lib/analytics';

// Test consumer component exposing persistence methods & states
const TestConsumer = () => {
  const {
    profile,
    user,
    isAuthenticated,
    persistenceStatus,
    lastPersistenceError,
    isSaving,
    saveProfile,
    saveDiagnosticAnswer,
    saveSkillObservation,
    toggleTaskCompletion,
    retryLastSave,
    refetchUserData,
    signIn,
    signOut,
    diagnosticAnswers,
    skillObservations,
    roadmapTasks,
    loadRahulDemo,
  } = useCareer();

  return (
    <div>
      <div data-testid="auth-status">{isAuthenticated ? `authenticated:${user?.id}` : 'guest'}</div>
      <div data-testid="persistence-status">{persistenceStatus}</div>
      <div data-testid="is-saving">{isSaving ? 'true' : 'false'}</div>
      <div data-testid="persistence-error">{lastPersistenceError || 'none'}</div>
      <div data-testid="user-display-name">{profile.displayName}</div>
      <div data-testid="user-target-role">{profile.targetRoleId || 'none'}</div>
      <div data-testid="answers-count">{Object.keys(diagnosticAnswers).length}</div>
      <div data-testid="answer-q01">{diagnosticAnswers['q01'] || 'none'}</div>
      <div data-testid="obs-skill-1">{skillObservations[1] !== null ? skillObservations[1] : 'null'}</div>
      <div data-testid="task-0-status">{roadmapTasks[0]?.status || 'none'}</div>

      <button
        onClick={() => signIn('userA@test.com', 'password123')}
        data-testid="signin-user-a"
      >
        Sign In User A
      </button>

      <button
        onClick={() => signIn('userB@test.com', 'password123')}
        data-testid="signin-user-b"
      >
        Sign In User B
      </button>

      <button onClick={() => signOut()} data-testid="signout-btn">
        Sign Out
      </button>

      <button
        onClick={() =>
          saveProfile({
            displayName: 'Alice Engineer',
            branch: 'Computer Science',
            targetRoleId: 1,
            targetRoleSlug: 'junior-frontend-developer',
            hoursPerWeek: 12,
          })
        }
        data-testid="save-profile-btn"
      >
        Save Profile
      </button>

      <button
        onClick={() => saveDiagnosticAnswer('q01', 'a')}
        data-testid="save-answer-q01-btn"
      >
        Answer Q1
      </button>

      <button
        onClick={() => saveDiagnosticAnswer('q02', 'b')}
        data-testid="save-answer-q02-btn"
      >
        Answer Q2
      </button>

      <button
        onClick={() => saveSkillObservation(1, 3)}
        data-testid="save-obs-btn"
      >
        Save Observation
      </button>

      <button
        onClick={() => toggleTaskCompletion(roadmapTasks[0]?.id || 'fe-01')}
        data-testid="toggle-task-btn"
      >
        Toggle Task 0
      </button>

      <button onClick={() => retryLastSave()} data-testid="retry-btn">
        Retry Last Save
      </button>

      <button onClick={() => refetchUserData()} data-testid="refetch-btn">
        Refetch Data
      </button>

      <button onClick={() => loadRahulDemo()} data-testid="load-rahul-btn">
        Load Rahul Demo
      </button>
    </div>
  );
};

describe('Prompt 10 & Gate 10 — Dual-Mode Persistence & Isolation', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('Gate 10 — End-to-End User Isolation & Flow', () => {
    it('executes full Gate 10 flow: User A saves data -> signOut -> User B sees empty data -> guest demo unaffected', async () => {
      const { unmount } = render(
        <BrowserRouter>
          <CareerProvider>
            <TestConsumer />
          </CareerProvider>
        </BrowserRouter>
      );

      // Step 1: Sign in as User A
      fireEvent.click(screen.getByTestId('signin-user-a'));
      await waitFor(() => {
        expect(screen.getByTestId('auth-status').textContent).toContain('local-user-usera_test_com');
      });

      // Step 2: Complete onboarding profile and partial assessment
      fireEvent.click(screen.getByTestId('save-profile-btn'));
      await waitFor(() => {
        expect(screen.getByTestId('persistence-status').textContent).toBe('saved');
        expect(screen.getByTestId('user-display-name').textContent).toBe('Alice Engineer');
      });

      fireEvent.click(screen.getByTestId('save-answer-q01-btn'));
      fireEvent.click(screen.getByTestId('save-answer-q02-btn'));
      await waitFor(() => {
        expect(screen.getByTestId('answers-count').textContent).toBe('2');
        expect(screen.getByTestId('answer-q01').textContent).toBe('a');
      });

      // Step 3: Refresh simulation (unmount and remount with same user storage)
      unmount();

      const remount = render(
        <BrowserRouter>
          <CareerProvider>
            <TestConsumer />
          </CareerProvider>
        </BrowserRouter>
      );

      // Verify User A data reloads on sign-in
      fireEvent.click(remount.getByTestId('signin-user-a'));
      await waitFor(() => {
        expect(remount.getByTestId('user-display-name').textContent).toBe('Alice Engineer');
        expect(remount.getByTestId('answers-count').textContent).toBe('2');
        expect(remount.getByTestId('answer-q01').textContent).toBe('a');
      });

      // Step 4: Sign out User A
      fireEvent.click(remount.getByTestId('signout-btn'));
      await waitFor(() => {
        expect(remount.getByTestId('auth-status').textContent).toBe('guest');
        expect(remount.getByTestId('user-display-name').textContent).toBe('');
        expect(remount.getByTestId('answers-count').textContent).toBe('0');
      });

      // Step 5: Sign in as User B and confirm data is isolated / empty
      fireEvent.click(remount.getByTestId('signin-user-b'));
      await waitFor(() => {
        expect(remount.getByTestId('auth-status').textContent).toContain('local-user-userb_test_com');
        // User B must NOT see Alice's profile or answers
        expect(remount.getByTestId('user-display-name').textContent).toBe('');
        expect(remount.getByTestId('answers-count').textContent).toBe('0');
        expect(remount.getByTestId('answer-q01').textContent).toBe('none');
      });

      // Step 6: Sign out and confirm guest demo continues working independently
      fireEvent.click(remount.getByTestId('signout-btn'));
      await waitFor(() => {
        expect(remount.getByTestId('auth-status').textContent).toBe('guest');
      });

      fireEvent.click(remount.getByTestId('load-rahul-btn'));
      await waitFor(() => {
        expect(remount.getByTestId('user-display-name').textContent).toBe('Rahul Sharma (Demo)');
      });

      remount.unmount();
    });
  });

  describe('Draft Preservation on Network Failure & Retry', () => {
    it('preserves draft in memory when remote persistence fails, and allows retry', async () => {
      render(
        <BrowserRouter>
          <CareerProvider>
            <TestConsumer />
          </CareerProvider>
        </BrowserRouter>
      );

      // Sign in as user
      fireEvent.click(screen.getByTestId('signin-user-a'));
      await waitFor(() => {
        expect(screen.getByTestId('auth-status').textContent).toContain('local-user');
      });

      // Spy on LocalProfileRepository.prototype.upsertProfile to simulate network failure
      const upsertSpy = vi
        .spyOn(LocalProfileRepository.prototype, 'upsertProfile')
        .mockRejectedValueOnce(new Error('Network error: 503 Service Unavailable'));

      fireEvent.click(screen.getByTestId('save-profile-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('persistence-status').textContent).toBe('failed');
        expect(screen.getByTestId('persistence-error').textContent).toContain('503');
        // Draft must be preserved in state even if network write failed!
        expect(screen.getByTestId('user-display-name').textContent).toBe('Alice Engineer');
      });

      // Now network recovers: restore mock and retry
      upsertSpy.mockRestore();

      fireEvent.click(screen.getByTestId('retry-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('persistence-status').textContent).toBe('saved');
        expect(screen.getByTestId('persistence-error').textContent).toBe('none');
        expect(screen.getByTestId('user-display-name').textContent).toBe('Alice Engineer');
      });
    });
  });

  describe('Synthetic Rahul Guard', () => {
    it('never writes synthetic Rahul demo profile into real user tables', async () => {
      const upsertSpy = vi.spyOn(LocalProfileRepository.prototype, 'upsertProfile');

      render(
        <BrowserRouter>
          <CareerProvider>
            <TestConsumer />
          </CareerProvider>
        </BrowserRouter>
      );

      // Sign in as User A
      fireEvent.click(screen.getByTestId('signin-user-a'));
      await waitFor(() => {
        expect(screen.getByTestId('auth-status').textContent).toContain('local-user');
      });

      // Load Rahul demo
      fireEvent.click(screen.getByTestId('load-rahul-btn'));
      await waitFor(() => {
        expect(screen.getByTestId('user-display-name').textContent).toBe('Rahul Sharma (Demo)');
      });

      // Attempt to save
      fireEvent.click(screen.getByTestId('save-profile-btn'));

      // Repository upsertProfile must NOT have been called with Rahul's demo data!
      expect(upsertSpy).not.toHaveBeenCalled();
      upsertSpy.mockRestore();
    });
  });

  describe('Analytics Privacy Guarantees', () => {
    it('strips raw answer text, resume document, and PII from analytics payloads', () => {
      const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

      logProductEvent('profile_saved', {
        roleTarget: 'Frontend Engineer',
        hoursPerWeek: 15,
        rawText: 'Candidate full confidential resume with phone +91-9876543210',
        answerText: 'Secret answer to diagnostic assessment question',
        password: 'SuperSecretPassword123',
      });

      expect(consoleSpy).toHaveBeenCalled();
      const emittedPayload = consoleSpy.mock.calls[0][1] as Record<string, unknown>;

      // Privacy verification: raw text, answer text, and sensitive keys are stripped
      expect(emittedPayload.roleTarget).toBe('Frontend Engineer');
      expect(emittedPayload.hoursPerWeek).toBe(15);
      expect(emittedPayload.rawText).toBeUndefined();
      expect(emittedPayload.answerText).toBeUndefined();
      expect(emittedPayload.password).toBeUndefined();

      consoleSpy.mockRestore();
    });
  });
});
