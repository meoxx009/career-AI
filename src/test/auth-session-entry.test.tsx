import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CareerProvider, useCareer } from '../context/CareerContext';

type TestWindow = Window & typeof globalThis & {
  __TEST_ENABLE_AUTH_PROMPT__?: boolean;
};

describe('Prompt 1 — Session-Aware Login Priority & Authentication Contract', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
    delete (window as TestWindow).__TEST_ENABLE_AUTH_PROMPT__;
    window.location.hash = '';
  });

  it('promptly opens the dismissible auth modal on entry when visitor is signed out and prompt enabled', async () => {
    (window as TestWindow).__TEST_ENABLE_AUTH_PROMPT__ = true;

    render(
      <CareerProvider>
        <div>App Content</div>
      </CareerProvider>
    );

    // Modal dialog is opened
    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: /sign in/i })).toBeInTheDocument();
    });

    // Contains dismiss button
    const closeBtn = screen.getByRole('button', { name: /close/i });
    expect(closeBtn).toBeInTheDocument();

    // Dismissing sets dismissal flag and closes modal
    fireEvent.click(closeBtn);
    expect(sessionStorage.getItem('career_ai_auth_prompt_dismissed')).toBe('true');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('does NOT open auth modal on entry if already dismissed in session storage', async () => {
    (window as TestWindow).__TEST_ENABLE_AUTH_PROMPT__ = true;
    sessionStorage.setItem('career_ai_auth_prompt_dismissed', 'true');

    render(
      <CareerProvider>
        <div>App Content</div>
      </CareerProvider>
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByText('App Content')).toBeInTheDocument();
  });

  it('restores valid user and does not show prompt modal', async () => {
    (window as TestWindow).__TEST_ENABLE_AUTH_PROMPT__ = true;

    const TestAuthConsumer = () => {
      const { user, signInAsLocalGuest, isAuthModalOpen } = useCareer();
      return (
        <div>
          <button onClick={() => signInAsLocalGuest('Test User')}>Login</button>
          <span data-testid="user-id">{user?.id || 'none'}</span>
          <span data-testid="modal-state">{isAuthModalOpen ? 'open' : 'closed'}</span>
        </div>
      );
    };

    render(
      <CareerProvider>
        <TestAuthConsumer />
      </CareerProvider>
    );

    // Initial state before sign in
    expect(screen.getByTestId('user-id').textContent).toBe('none');

    // Simulate signing in as local guest
    fireEvent.click(screen.getByText('Login'));

    // Signed in user
    expect(screen.getByTestId('user-id').textContent).toContain('google-guest-user-');
    expect(screen.getByTestId('modal-state').textContent).toBe('closed');
  });

  it('suppresses auto-opening sign-in modal during OAuth return, recovery, or callback flows', async () => {
    (window as TestWindow).__TEST_ENABLE_AUTH_PROMPT__ = true;
    window.location.hash = '#access_token=mock-token&refresh_token=mock-refresh&type=recovery';

    render(
      <CareerProvider>
        <div>OAuth Callback Screen</div>
      </CareerProvider>
    );

    // Modal should NOT be open because callback flow is active
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByText('OAuth Callback Screen')).toBeInTheDocument();
  });

  it('sign-out clears private state and prevents immediate repetitive popup loop', async () => {
    (window as TestWindow).__TEST_ENABLE_AUTH_PROMPT__ = true;

    const SignOutConsumer = () => {
      const { user, signInAsLocalGuest, signOut, isAuthModalOpen } = useCareer();
      return (
        <div>
          <button onClick={() => signInAsLocalGuest('Alice')}>Sign In Alice</button>
          <button onClick={() => signOut()}>Sign Out Alice</button>
          <span data-testid="active-user">{user?.id || 'anonymous'}</span>
          <span data-testid="modal-open">{isAuthModalOpen ? 'open' : 'closed'}</span>
        </div>
      );
    };

    render(
      <CareerProvider>
        <SignOutConsumer />
      </CareerProvider>
    );

    // Sign in
    fireEvent.click(screen.getByText('Sign In Alice'));
    expect(screen.getByTestId('active-user').textContent).toContain('google-guest-user-');
    expect(screen.getByTestId('modal-open').textContent).toBe('closed');

    // Sign out
    fireEvent.click(screen.getByText('Sign Out Alice'));
    expect(screen.getByTestId('active-user').textContent).toBe('anonymous');
    // Crucial requirement: no repetitive popup loop immediately on sign out
    expect(screen.getByTestId('modal-open').textContent).toBe('closed');
    expect(sessionStorage.getItem('career_ai_auth_prompt_dismissed')).toBe('true');
  });

  it('does not treat synthetic/local guest identity as a real cloud authenticated account', async () => {
    const GuestConsumer = () => {
      const { user, isAuthenticated, isDemoMode, signInAsLocalGuest, loadRahulDemo } = useCareer();
      return (
        <div>
          <button onClick={() => signInAsLocalGuest('Local Learner')}>Guest Sign In</button>
          <button onClick={() => loadRahulDemo()}>Load Demo</button>
          <span data-testid="is-authenticated">{isAuthenticated ? 'true' : 'false'}</span>
          <span data-testid="is-demo">{isDemoMode ? 'true' : 'false'}</span>
          <span data-testid="guest-user-id">{user?.id || 'none'}</span>
        </div>
      );
    };

    render(
      <CareerProvider>
        <GuestConsumer />
      </CareerProvider>
    );

    expect(screen.getByTestId('is-authenticated').textContent).toBe('false');

    // Guest sign in
    fireEvent.click(screen.getByText('Guest Sign In'));
    expect(screen.getByTestId('guest-user-id').textContent).toContain('google-guest-user-');
    // Local guest must NOT be treated as a real authenticated account
    expect(screen.getByTestId('is-authenticated').textContent).toBe('false');

    // Load Rahul demo
    fireEvent.click(screen.getByText('Load Demo'));
    expect(screen.getByTestId('is-demo').textContent).toBe('true');
    expect(screen.getByTestId('is-authenticated').textContent).toBe('false');
  });

  it('provides accessible keyboard navigation with Escape key dismissal', async () => {
    (window as TestWindow).__TEST_ENABLE_AUTH_PROMPT__ = true;

    render(
      <CareerProvider>
        <div>Content</div>
      </CareerProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: /sign in/i })).toBeInTheDocument();
    });

    // Press Escape key to dismiss
    fireEvent.keyDown(window, { key: 'Escape' });

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    expect(sessionStorage.getItem('career_ai_auth_prompt_dismissed')).toBe('true');
  });
});
