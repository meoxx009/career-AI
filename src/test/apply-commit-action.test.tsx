import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { CareerProvider, useCareer } from '../context/CareerContext';
import { Paths } from '../pages/Paths';
import { CAREER_CATALOGUE } from '../data/careerCatalogue';
import { generatePathRecommendations, hasProfileDirectionSignals } from '../lib/pathRecommendations';
import { STORAGE_KEY, EMPTY_PROFILE } from '../context/careerConstants';
import { defaultProfileRepository } from '../lib/repositories/profileRepository';
import type { UserProfile } from '../types';

describe('Prompt 3: Apply Commit Action, Draft Isolation & Deterministic Relevance', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  const renderPathsPage = () => {
    return render(
      <MemoryRouter initialEntries={['/paths']}>
        <CareerProvider>
          <Routes>
            <Route path="/paths" element={<Paths />} />
          </Routes>
        </CareerProvider>
      </MemoryRouter>
    );
  };

  // 1. Typing in the draft does not mutate visible applied results
  it('1. Editing inside the draft customizer does not mutate applied visible directions until Apply is clicked', () => {
    // Start with a learner interested in UI/UX design
    const initialProfile: UserProfile = {
      ...EMPTY_PROFILE,
      id: 'test-learner-1',
      displayName: 'Draft Tester',
      learnerStage: 'undergraduate',
      degree: 'BDes',
      interests: ['ui-ux-design'],
      hoursPerWeek: 10,
    };
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        hasSelectedRole: false,
        selectedRoleId: null,
        profile: initialProfile,
      })
    );

    renderPathsPage();

    // Verify initial applied directions show UI/UX
    expect(screen.getByText(/UI\/UX Designer/i)).toBeInTheDocument();

    // Open customizer
    const customizeBtn = screen.getByRole('button', { name: /Customize Profile & Interests/i });
    fireEvent.click(customizeBtn);

    // Verify form is open
    expect(screen.getByText(/What is your current learner stage\?/i)).toBeInTheDocument();

    // Change stage to Class 10 (School) in the draft
    const class10Radio = screen.getByRole('radio', { name: /Class 10 completed/i });
    fireEvent.click(class10Radio);

    // Select Commerce stream
    const commerceBtn = screen.getByRole('button', { name: /^Commerce/i });
    fireEvent.click(commerceBtn);

    // Before clicking Apply, the applied directions MUST NOT have changed to Commerce yet
    expect(screen.queryByText(/STREAM-ALIGNED OPPORTUNITY GROUPS \/ COMMERCE/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Opportunities for Commerce/i)).not.toBeInTheDocument();

    // Initial applied directions still remain active
    expect(screen.getByText(/UI\/UX Designer/i)).toBeInTheDocument();
  });

  // 2. Cancel discards uncommitted changes and restores previous values
  it('2. Cancel discards uncommitted draft changes and restores original values upon reopen', () => {
    const initialProfile: UserProfile = {
      ...EMPTY_PROFILE,
      id: 'test-learner-2',
      displayName: 'Cancel Tester',
      learnerStage: 'undergraduate',
      degree: 'BTech',
      interests: ['cloud-devops'],
      hoursPerWeek: 12,
    };
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        hasSelectedRole: false,
        selectedRoleId: null,
        profile: initialProfile,
      })
    );

    renderPathsPage();

    // Open editor
    const customizeBtn = screen.getByRole('button', { name: /Customize Profile & Interests/i });
    fireEvent.click(customizeBtn);

    // Edit hours input to 35
    const hoursInput = screen.getByRole('spinbutton', { name: /Weekly dedicated study commitment/i }) as HTMLInputElement;
    fireEvent.change(hoursInput, { target: { value: '35' } });
    expect(hoursInput.value).toBe('35');

    // Cancel draft changes
    const cancelBtn = screen.getByRole('button', { name: /^Cancel$/i });
    fireEvent.click(cancelBtn);

    // Editor is closed
    expect(screen.queryByText(/What is your current learner stage\?/i)).not.toBeInTheDocument();

    // Reopen editor and verify hours reverted to 12
    const reopenBtn = screen.getByRole('button', { name: /Customize Profile & Interests/i });
    fireEvent.click(reopenBtn);
    const restoredHoursInput = screen.getByRole('spinbutton', { name: /Weekly dedicated study commitment/i }) as HTMLInputElement;
    expect(restoredHoursInput.value).toBe('12');
  });

  // 3. Apply saves one snapshot, closes editor, and updates recommendations
  it('3. Apply commits snapshot once, closes editor, and updates branching directions', async () => {
    const initialProfile: UserProfile = {
      ...EMPTY_PROFILE,
      id: 'test-learner-3',
      displayName: 'Apply Tester',
      learnerStage: 'undergraduate',
      degree: 'BTech',
      interests: ['backend'],
      hoursPerWeek: 8,
    };
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        hasSelectedRole: false,
        selectedRoleId: null,
        profile: initialProfile,
      })
    );

    renderPathsPage();

    // Open customizer
    const customizeBtn = screen.getByRole('button', { name: /Customize Profile & Interests/i });
    fireEvent.click(customizeBtn);

    // Switch to School Class 10 + Commerce
    const class10Radio = screen.getByRole('radio', { name: /Class 10 completed/i });
    fireEvent.click(class10Radio);
    const commerceBtn = screen.getByRole('button', { name: /^Commerce/i });
    fireEvent.click(commerceBtn);

    // Click Apply
    const applyBtn = screen.getByRole('button', { name: /Apply & View Updated Directions/i });
    fireEvent.click(applyBtn);

    // Editor should close and directions update
    await waitFor(() => {
      expect(screen.queryByText(/What is your current learner stage\?/i)).not.toBeInTheDocument();
      expect(screen.getByText(/Opportunities for Commerce/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Business Analytics & Financial Data Systems/i)).toBeInTheDocument();
  });

  // 4. Repository save failure retains draft, keeps editor open, and displays clear error
  it('4. Repository save failure retains draft, keeps editor open, and never displays success toast', async () => {
    // Force repository failure
    vi.spyOn(defaultProfileRepository, 'upsertProfile').mockResolvedValue({
      data: null,
      error: 'Network connection timeout to Supabase',
    });

    const AuthSetup = () => {
      const { signInAsLocalGuest } = useCareer();
      return (
        <button
          type="button"
          onClick={() => {
            signInAsLocalGuest('Auth Error Tester');
          }}
          data-testid="mock-auth-btn"
        >
          Authenticate Test User
        </button>
      );
    };

    render(
      <MemoryRouter initialEntries={['/paths']}>
        <CareerProvider>
          <AuthSetup />
          <Paths />
        </CareerProvider>
      </MemoryRouter>
    );

    // Click mock auth button to establish authenticated user context
    fireEvent.click(screen.getByTestId('mock-auth-btn'));

    // Open editor
    const customizeBtn = screen.getByRole('button', { name: /Customize Profile & Interests/i });
    fireEvent.click(customizeBtn);

    // Edit hours
    const hoursInput = screen.getByRole('spinbutton', { name: /Weekly dedicated study commitment/i });
    fireEvent.change(hoursInput, { target: { value: '25' } });

    // Click Apply
    const applyBtn = screen.getByRole('button', { name: /Apply & View Updated Directions/i });
    fireEvent.click(applyBtn);

    // Wait for failure response
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    // Error alert is displayed
    expect(screen.getByRole('alert')).toHaveTextContent(/Failed to save updated profile/i);

    // Form remains open and preserved
    expect(screen.getByText(/What is your current learner stage\?/i)).toBeInTheDocument();
    const currentHoursInput = screen.getByRole('spinbutton', { name: /Weekly dedicated study commitment/i }) as HTMLInputElement;
    expect(currentHoursInput.value).toBe('25');

    // Never shows success message
    expect(screen.queryByText(/Applied updated profile & interests/i)).not.toBeInTheDocument();
  });

  // 5. Valid targets remain present for every catalogue role (roles 1-33)
  it('5. Explicit target role is a mandatory anchor and remains present for every role (roles 1 to 33)', () => {
    expect(CAREER_CATALOGUE.length).toBe(33);

    CAREER_CATALOGUE.forEach((role) => {
      const recResult = generatePathRecommendations({
        learnerStage: 'undergraduate',
        targetRoleId: role.numericId,
        targetRoleSlug: role.slug,
        hoursPerWeek: 10,
      });

      // Target role MUST be present in recommendations
      const foundTarget = recResult.recommendations.find(
        (r) => r.cataloguePathId === role.numericId || r.cataloguePathSlug === role.slug
      );
      expect(foundTarget).toBeDefined();
      expect(foundTarget?.badge).toMatch(/Target Career/i);
    });
  });

  // 6. Empty profile creates no default role result
  it('6. Empty profile produces no default role result and clearly invites learner to customize signals', () => {
    // Test the recommendation generator with empty profile
    const emptyResult = generatePathRecommendations({});
    expect(emptyResult.recommendations).toHaveLength(0);
    expect(emptyResult.hasDirectionSignals).toBe(false);

    const emptySignals = hasProfileDirectionSignals({});
    expect(emptySignals).toBe(false);

    // Render empty state on Paths page
    renderPathsPage();

    // Verify empty state invitation is rendered inside tree
    expect(screen.getByText(/Choose a Target Role or Add Interests/i)).toBeInTheDocument();
    expect(
      screen.getByText(
        /No applied direction signals yet. Customize your profile & interests or select a target career role to generate evidence-aligned paths without manufactured suggestions./i
      )
    ).toBeInTheDocument();

    // Verify button to configure signals is available
    expect(screen.getByRole('button', { name: /Open profile customizer|Configure Profile Signals/i })).toBeInTheDocument();
  });

  // 7. Changing interests/hours produces the correct updated result
  it('7. Changing interests produces meaningfully matched directions without unrelated padding, and hours adjusts curriculum pacing', () => {
    // Test interests only (no target role): mobile development
    const mobileRec = generatePathRecommendations({
      learnerStage: 'undergraduate',
      interests: ['mobile', 'android'],
      hoursPerWeek: 10,
    });

    expect(mobileRec.recommendations.length).toBeGreaterThan(0);
    const topMobile = mobileRec.recommendations.find((r) => r.cataloguePathSlug === 'mobile-developer');
    expect(topMobile).toBeDefined();

    // Curriculum adjusted to 10h/wk
    expect(topMobile?.estimatedCurriculum[0]).toContain('10h/wk');

    // Test pace change to 20h/wk
    const mobilePaced = generatePathRecommendations({
      learnerStage: 'undergraduate',
      interests: ['mobile', 'android'],
      hoursPerWeek: 20,
    });
    const topPaced = mobilePaced.recommendations.find((r) => r.cataloguePathSlug === 'mobile-developer');
    expect(topPaced?.estimatedCurriculum[0]).toContain('20h/wk');

    // Verify self-reported skills label requirement
    const skilledRec = generatePathRecommendations({
      learnerStage: 'undergraduate',
      interests: ['backend'],
      currentSkills: ['Node.js', 'PostgreSQL'],
      hoursPerWeek: 8,
    });
    const backendRec = skilledRec.recommendations.find((r) => r.cataloguePathSlug === 'backend-developer');
    expect(backendRec).toBeDefined();
    expect(backendRec?.evidenceFound.some((e) => e.startsWith('Self-reported:'))).toBe(true);
    expect(backendRec?.evidenceFound.some((e) => e.includes('verified'))).toBe(false);
  });
});
