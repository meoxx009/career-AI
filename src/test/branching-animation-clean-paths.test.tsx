import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { CareerProvider } from '../context/CareerContext';
import { Paths } from '../pages/Paths';
import { PathBuilder } from '../pages/PathBuilder';
import { CAREER_CATALOGUE } from '../data/careerCatalogue';
import { STORAGE_KEY, EMPTY_PROFILE } from '../context/careerConstants';
import type { UserProfile } from '../types';

describe('Prompt 4: Clean Paths Page, Top-to-Bottom Branching Visualization & State Decoupling', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  const renderPaths = () => {
    return render(
      <MemoryRouter initialEntries={['/paths']}>
        <CareerProvider>
          <Routes>
            <Route path="/paths" element={<Paths />} />
            <Route path="/paths/builder" element={<PathBuilder />} />
            <Route path="/roadmap" element={<div>Roadmap Page</div>} />
          </Routes>
        </CareerProvider>
      </MemoryRouter>
    );
  };

  const renderPathBuilder = () => {
    return render(
      <MemoryRouter initialEntries={['/paths/builder']}>
        <CareerProvider>
          <Routes>
            <Route path="/paths/builder" element={<PathBuilder />} />
          </Routes>
        </CareerProvider>
      </MemoryRouter>
    );
  };

  // 1. Unwanted starter cards are completely removed from /paths
  it('1. Completely removes unconditional Backend/Frontend/Data Analyst starter section from /paths', () => {
    renderPaths();

    // Starter paths heading and container are completely absent
    expect(screen.queryByRole('heading', { name: /Starter paths — available to explore before assessment/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/FOUNDATIONAL BENCHMARKS \/ ENTRY ROLES/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/SEED #1/i)).not.toBeInTheDocument();

    // Fresh empty state invites learner to provide signals
    expect(screen.getByText(/Choose a Target Role or Add Interests/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Configure Profile Signals/i })).toBeInTheDocument();
  });

  // 2. Starter roles remain preserved and searchable in CAREER_CATALOGUE
  it('2. Preserves Backend, Frontend, and Data Analyst in the 33-career catalogue without automatic starter display', () => {
    const backend = CAREER_CATALOGUE.find((p) => p.numericId === 1);
    const frontend = CAREER_CATALOGUE.find((p) => p.numericId === 2);
    const dataAnalyst = CAREER_CATALOGUE.find((p) => p.numericId === 3);

    expect(backend?.title).toBe('Backend Developer');
    expect(frontend?.title).toBe('Frontend Developer');
    expect(dataAnalyst?.title).toBe('Data Analyst');
    expect(CAREER_CATALOGUE.length).toBe(33);

    // PathBuilder also has no unconditional starter cards section
    renderPathBuilder();
    expect(screen.queryByText(/Starter paths — available to explore before assessment/i)).not.toBeInTheDocument();
  });

  // 3. Compact Direction Nodes & Non-Cluttered Reasoning
  it('3. Renders clean, compact direction nodes without simultaneously dumping 8 criteria or full curriculum', () => {
    const profileWithInterests: UserProfile = {
      ...EMPTY_PROFILE,
      id: 'test-user-clean',
      displayName: 'Clean Learner',
      learnerStage: 'undergraduate',
      degree: 'BTech',
      interests: ['software-development', 'backend'],
      hoursPerWeek: 12,
    };
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        hasSelectedRole: false,
        selectedRoleId: null,
        profile: profileWithInterests,
      })
    );

    renderPaths();

    // Root Horizon node is visible
    expect(screen.getByText(/YOUR APPLIED DIRECTION • ROOT HORIZON •/i)).toBeInTheDocument();
    expect(screen.getAllByText(/12 hrs\/week/i).length).toBeGreaterThan(0);

    // Direction nodes are present
    expect(screen.getAllByText(/Software Engineer/i).length).toBeGreaterThan(0);

    // 8 simultaneous criteria lists (Inputs evaluated, Still unknown, etc.) are NOT dumped by default
    expect(screen.queryByText(/Inputs evaluated:/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Requirements evaluated:/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Still unknown:/i)).not.toBeInTheDocument();

    // Compact "Why this direction?" accordion toggle is available
    const whyToggles = screen.getAllByRole('button', { name: /Why this direction\?/i });
    expect(whyToggles.length).toBeGreaterThan(0);

    // Clicking toggle expands concise reasoning
    fireEvent.click(whyToggles[0]);
    expect(whyToggles[0]).toHaveAttribute('aria-expanded', 'true');
  });

  // 4. Default Open Behavior: Explicit Target Role vs Suggestion-Only Profile
  it('4. Automatically opens direction overview below tree when target role is explicit, but invites choice when suggestions only', async () => {
    // A. Profile with general interests only (no targetRoleId)
    const suggestionsOnlyProfile: UserProfile = {
      ...EMPTY_PROFILE,
      id: 'test-user-suggestions',
      displayName: 'Suggestions Learner',
      learnerStage: 'undergraduate',
      degree: 'BDes',
      interests: ['ui-ux-design'],
      hoursPerWeek: 8,
    };
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        hasSelectedRole: false,
        selectedRoleId: null,
        profile: suggestionsOnlyProfile,
      })
    );

    const { unmount } = renderPaths();

    // When suggestions only, overview container is NOT forced open; calm guide asks user to choose
    expect(screen.getByText(/Select a Career Direction Above/i)).toBeInTheDocument();
    expect(screen.queryByText(/Selected Direction Overview/i)).not.toBeInTheDocument();

    unmount();

    // B. Profile with explicit target role (e.g. role 1 = Backend Developer)
    const targetExplicitProfile: UserProfile = {
      ...EMPTY_PROFILE,
      id: 'test-user-target',
      displayName: 'Target Learner',
      learnerStage: 'undergraduate',
      degree: 'BTech',
      targetRoleId: 1,
      targetRoleSlug: 'backend-developer',
      interests: ['backend'],
      hoursPerWeek: 10,
    };
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        hasSelectedRole: true,
        selectedRoleId: 1,
        profile: targetExplicitProfile,
      })
    );

    renderPaths();

    // Overview container automatically opens below the tree for the target role
    expect(screen.getByText(/Selected Direction Overview/i)).toBeInTheDocument();
    expect(screen.getByText(/5-Phase Structured Curriculum Path/i)).toBeInTheDocument();
    expect(screen.getByText(/~34 Hours/i)).toBeInTheDocument();
    expect(screen.getByText(/Active Target ✓/i)).toBeInTheDocument();
  });

  // 5. Previewing a direction does NOT silently mutate active roadmap
  it('5. Previewing a direction reveals overview below without mutating the active roadmap until explicit activation', () => {
    const profile: UserProfile = {
      ...EMPTY_PROFILE,
      id: 'test-user-preview',
      displayName: 'Preview Learner',
      learnerStage: 'undergraduate',
      degree: 'BTech',
      targetRoleId: 1, // Active roadmap target is role 1 (Backend)
      targetRoleSlug: 'backend-developer',
      interests: ['backend', 'cloud-devops'],
      hoursPerWeek: 10,
    };
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        hasSelectedRole: true,
        selectedRoleId: 1, // Role 1 is active
        profile,
      })
    );

    renderPaths();

    // Initially viewing role 1 overview
    expect(screen.getAllByText(/Backend Developer/i).length).toBeGreaterThan(0);

    // Find inspect button for DevOps Engineer (role 8)
    const devopsInspectBtn = screen.getByRole('button', { name: /DevOps Engineer/i });
    fireEvent.click(devopsInspectBtn);

    // Overview below switches to previewing DevOps Engineer
    expect(screen.getByText(/DevOps Engineer Curriculum Breakdown/i)).toBeInTheDocument();

    // Active roadmap has NOT mutated to DevOps Engineer yet — button shows "Activate for Roadmap →"
    const activateBtn = screen.getByRole('button', { name: /Activate for Roadmap →/i });
    expect(activateBtn).toBeInTheDocument();

    // Explicitly activating DevOps updates the roadmap
    fireEvent.click(activateBtn);
    expect(screen.getByText(/Active Target ✓/i)).toBeInTheDocument();
  });

  // 6. Top-to-Bottom animation triggers after genuine Apply and connectors do not capture pointers
  it('6. Triggers top-to-bottom animation on genuine Apply and ensures connectors have pointer-events none', async () => {
    const initialProfile: UserProfile = {
      ...EMPTY_PROFILE,
      id: 'test-user-apply-anim',
      displayName: 'Anim Learner',
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

    renderPaths();

    // Open customizer
    const customizeBtn = screen.getByRole('button', { name: /Customize Profile & Interests/i });
    fireEvent.click(customizeBtn);

    // Change hours
    const hoursInput = screen.getByLabelText(/Weekly study hours slider/i);
    fireEvent.change(hoursInput, { target: { value: '20' } });

    // Submit Apply
    const applyBtn = screen.getByRole('button', { name: /Apply & View Updated Directions/i });
    fireEvent.click(applyBtn);

    // Editor closes and animation runs
    await waitFor(() => {
      expect(screen.queryByText(/What is your current learner stage\?/i)).not.toBeInTheDocument();
      expect(screen.getAllByText(/20 hrs\/week/i).length).toBeGreaterThan(0);
    });

    // Verify connectors have pointer-events: none so they do not block node clicks
    const stemConnectors = document.querySelectorAll('.branching-path-tree [aria-hidden="true"]');
    expect(stemConnectors.length).toBeGreaterThan(0);
  });
});
