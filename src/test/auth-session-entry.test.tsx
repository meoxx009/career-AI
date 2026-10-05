import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CareerProvider, useCareer } from '../context/CareerContext';

type TestWindow = Window & typeof globalThis & {
  __TEST_ENABLE_AUTH_PROMPT__?: boolean;
};

describe('Auth Session Resolution & Dismissible Sign-In Prompt on Entry', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
    delete (window as TestWindow).__TEST_ENABLE_AUTH_PROMPT__;
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

  it('restores valid authenticated user and does not show prompt modal', async () => {
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

    // Simulate signing in
    fireEvent.click(screen.getByText('Login'));

    // Signed in user
    expect(screen.getByTestId('user-id').textContent).toContain('google-guest-user-');
    expect(screen.getByTestId('modal-state').textContent).toBe('closed');
  });
});
