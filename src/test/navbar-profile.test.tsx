import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { CareerProvider, useCareer } from '../context/CareerContext';
import { AppShell } from '../components/AppShell';

// Helper component to sign in a test user from within tests
const AuthController: React.FC = () => {
  const { signIn, signOut, isAuthenticated } = useCareer();
  return (
    <div style={{ padding: '10px' }}>
      <span data-testid="auth-state">{isAuthenticated ? 'authenticated' : 'unauthenticated'}</span>
      <button
        data-testid="test-signin-btn"
        onClick={() => signIn('priya.sharma@test.edu', 'password123')}
      >
        Test Sign In
      </button>
      <button data-testid="test-signout-btn" onClick={() => signOut()}>
        Test Sign Out
      </button>
    </div>
  );
};

function renderAppWithShell(initialRoute: string = '/') {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <CareerProvider>
        <AppShell>
          <Routes>
            <Route
              path="/"
              element={
                <div>
                  <h1>Landing Page</h1>
                  <AuthController />
                </div>
              }
            />
            <Route
              path="/dashboard"
              element={
                <div>
                  <h1>Dashboard</h1>
                  <AuthController />
                </div>
              }
            />
            <Route path="/onboarding" element={<h1>Onboarding Flow</h1>} />
            <Route path="/profile/edit" element={<h1>Full Profile Edit Page</h1>} />
          </Routes>
        </AppShell>
      </CareerProvider>
    </MemoryRouter>
  );
}

describe('Navbar Profile Experience & Authentication States', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('A. Unauthenticated State', () => {
    it('renders original Sign In button and Find my direction link on landing page', () => {
      renderAppWithShell('/');

      const signInBtn = screen.getByRole('button', { name: /sign in to careerai/i });
      expect(signInBtn).toBeInTheDocument();

      const findDirectionLink = screen.getByRole('link', { name: /find my direction/i });
      expect(findDirectionLink).toBeInTheDocument();
      expect(findDirectionLink.getAttribute('href')).toBe('/onboarding');
    });
  });

  describe('B. Authenticated State & Profile Trigger', () => {
    it('replaces only Sign In with the profile trigger and keeps Find my direction intact', async () => {
      renderAppWithShell('/');

      // Initially unauthenticated
      expect(screen.getByRole('button', { name: /sign in to careerai/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /find my direction/i })).toBeInTheDocument();

      // Sign in user
      fireEvent.click(screen.getByTestId('test-signin-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('auth-state').textContent).toBe('authenticated');
      });

      // "Sign In" button is replaced by profile trigger
      expect(screen.queryByRole('button', { name: /sign in to careerai/i })).not.toBeInTheDocument();

      const profileTrigger = screen.getByRole('button', { name: /user profile menu/i });
      expect(profileTrigger).toBeInTheDocument();

      // "Find my direction →" link remains present and unaltered
      const findDirectionLink = screen.getByRole('link', { name: /find my direction/i });
      expect(findDirectionLink).toBeInTheDocument();
      expect(findDirectionLink.getAttribute('href')).toBe('/onboarding');
    });

    it('opens profile popover on clicking profile trigger and displays view mode details', async () => {
      renderAppWithShell('/');

      fireEvent.click(screen.getByTestId('test-signin-btn'));
      await waitFor(() => {
        expect(screen.getByTestId('auth-state').textContent).toBe('authenticated');
      });

      const profileTrigger = screen.getByTestId('navbar-profile-trigger');

      // Popover is closed initially
      expect(screen.queryByTestId('navbar-profile-popover')).not.toBeInTheDocument();

      // Click to open popover
      fireEvent.click(profileTrigger);

      const popover = screen.getByTestId('navbar-profile-popover');
      expect(popover).toBeInTheDocument();

      // Verifies view mode elements
      expect(screen.getByText(/Active Account · Synced/i)).toBeInTheDocument();
      expect(screen.getByText(/Target Career:/i)).toBeInTheDocument();
      expect(screen.getByTestId('navbar-edit-btn')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /full profile & curriculum settings/i })).toBeInTheDocument();
      expect(screen.getByTestId('navbar-signout-btn')).toBeInTheDocument();
    });
  });

  describe('C. Edit Mode & Inline Validation', () => {
    it('switches to edit mode, validates required fields, and prevents saving empty name', async () => {
      renderAppWithShell('/');

      fireEvent.click(screen.getByTestId('test-signin-btn'));
      await waitFor(() => {
        expect(screen.getByTestId('auth-state').textContent).toBe('authenticated');
      });

      // Open profile popover
      fireEvent.click(screen.getByTestId('navbar-profile-trigger'));

      // Click Edit
      fireEvent.click(screen.getByTestId('navbar-edit-btn'));

      // Header indicates edit mode
      expect(screen.getByText(/EDIT DETAILS/i)).toBeInTheDocument();

      const nameInput = screen.getByLabelText(/FULL NAME \*/i) as HTMLInputElement;
      expect(nameInput).toBeInTheDocument();

      const emailInput = screen.getByLabelText(/EMAIL ADDRESS \(ACCOUNT ID\)/i) as HTMLInputElement;
      expect(emailInput).toBeDisabled();

      // Clear name to test validation
      fireEvent.change(nameInput, { target: { value: '   ' } });
      fireEvent.click(screen.getByTestId('navbar-save-btn'));

      expect(screen.getByText(/full name is required/i)).toBeInTheDocument();
    });

    it('cancels edit mode and discards uncommitted changes', async () => {
      renderAppWithShell('/');

      fireEvent.click(screen.getByTestId('test-signin-btn'));
      await waitFor(() => {
        expect(screen.getByTestId('auth-state').textContent).toBe('authenticated');
      });

      fireEvent.click(screen.getByTestId('navbar-profile-trigger'));
      fireEvent.click(screen.getByTestId('navbar-edit-btn'));

      const nameInput = screen.getByLabelText(/FULL NAME \*/i) as HTMLInputElement;
      fireEvent.change(nameInput, { target: { value: 'Draft Temporary Name' } });

      // Click Cancel
      fireEvent.click(screen.getByTestId('navbar-cancel-btn'));

      // Switched back to view mode without saving
      expect(screen.queryByText(/EDIT DETAILS/i)).not.toBeInTheDocument();
      expect(screen.getByTestId('navbar-edit-btn')).toBeInTheDocument();
    });

    it('saves updated details, updates trigger label, and switches back to view mode', async () => {
      renderAppWithShell('/');

      fireEvent.click(screen.getByTestId('test-signin-btn'));
      await waitFor(() => {
        expect(screen.getByTestId('auth-state').textContent).toBe('authenticated');
      });

      fireEvent.click(screen.getByTestId('navbar-profile-trigger'));
      fireEvent.click(screen.getByTestId('navbar-edit-btn'));

      const nameInput = screen.getByLabelText(/FULL NAME \*/i) as HTMLInputElement;
      fireEvent.change(nameInput, { target: { value: 'Priya Verma' } });

      const locationInput = screen.getByLabelText(/LOCATION PREFERENCE/i) as HTMLInputElement;
      fireEvent.change(locationInput, { target: { value: 'Bengaluru, India' } });

      fireEvent.click(screen.getByTestId('navbar-save-btn'));

      await waitFor(() => {
        // Back to view mode
        expect(screen.queryByText(/EDIT DETAILS/i)).not.toBeInTheDocument();
        expect(screen.getByText('Bengaluru, India')).toBeInTheDocument();
      });

      // Profile trigger button reflects new name
      const profileTrigger = screen.getByTestId('navbar-profile-trigger');
      expect(profileTrigger.textContent).toContain('Priya Verma');
    });
  });

  describe('D. Sign-Out Behavior & Keyboard Accessibility', () => {
    it('signing out from the profile popover clears session and restores original Sign In option', async () => {
      renderAppWithShell('/');

      fireEvent.click(screen.getByTestId('test-signin-btn'));
      await waitFor(() => {
        expect(screen.getByTestId('auth-state').textContent).toBe('authenticated');
      });

      // Open popover
      fireEvent.click(screen.getByTestId('navbar-profile-trigger'));

      // Click Sign Out inside popover
      const signOutBtn = screen.getByTestId('navbar-signout-btn');
      fireEvent.click(signOutBtn);

      await waitFor(() => {
        expect(screen.getByTestId('auth-state').textContent).toBe('unauthenticated');
      });

      // Profile popover is closed
      expect(screen.queryByRole('dialog', { name: /account details and settings/i })).not.toBeInTheDocument();

      // Original Sign In button is restored
      expect(screen.getByRole('button', { name: /sign in to careerai/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /find my direction/i })).toBeInTheDocument();
    });

    it('pressing Escape key closes the profile popover', async () => {
      renderAppWithShell('/');

      fireEvent.click(screen.getByTestId('test-signin-btn'));
      await waitFor(() => {
        expect(screen.getByTestId('auth-state').textContent).toBe('authenticated');
      });

      fireEvent.click(screen.getByRole('button', { name: /user profile menu/i }));
      expect(screen.getByRole('dialog', { name: /account details and settings/i })).toBeInTheDocument();

      // Press Escape
      fireEvent.keyDown(window, { key: 'Escape' });

      expect(screen.queryByRole('dialog', { name: /account details and settings/i })).not.toBeInTheDocument();
    });
  });
});
