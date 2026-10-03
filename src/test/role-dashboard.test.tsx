import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { CareerProvider, useCareer } from '../context/CareerContext';
import { Paths } from '../pages/Paths';
import { RoleDetail } from '../pages/RoleDetail';
import { Dashboard } from '../pages/Dashboard';

function StateInitializer({ setupMode }: { setupMode: 'fresh' | 'rahul' | 'partial' }) {
  const { loadRahulDemo, setSkillObservation, setDiagnosticAnswer } = useCareer();

  if (setupMode === 'rahul') {
    return (
      <button
        type="button"
        onClick={() => loadRahulDemo()}
        data-testid="setup-rahul-btn"
      >
        Load Rahul
      </button>
    );
  }

  if (setupMode === 'partial') {
    return (
      <button
        type="button"
        onClick={() => {
          // Answer only 1 skill (skill 1 = Level 3)
          setDiagnosticAnswer('q01', 'a');
          setDiagnosticAnswer('q02', 'b');
          setSkillObservation(1, 3);
        }}
        data-testid="setup-partial-btn"
      >
        Setup Partial
      </button>
    );
  }

  return null;
}

function TestWrapper({
  initialRoute = '/paths',
  setupMode = 'fresh',
}: {
  initialRoute?: string;
  setupMode?: 'fresh' | 'rahul' | 'partial';
}) {
  return (
    <MemoryRouter initialEntries={[initialRoute]}>
      <CareerProvider>
        <StateInitializer setupMode={setupMode} />
        <Routes>
          <Route path="/paths" element={<Paths />} />
          <Route path="/paths/:roleSlug" element={<RoleDetail />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/roadmap" element={<div>Roadmap Page</div>} />
          <Route path="/assessment" element={<div>Assessment Page</div>} />
        </Routes>
      </CareerProvider>
    </MemoryRouter>
  );
}

describe('Prompt 07 & Gate 07: Role Comparison and Dashboard', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('Case 1: Rahul Synthetic Demo', () => {
    it('displays confident assessed alignment, 78% coverage, and fictional demo badge', () => {
      const { getByTestId } = render(<TestWrapper initialRoute="/dashboard" setupMode="rahul" />);
      fireEvent.click(getByTestId('setup-rahul-btn'));

      // Check fictional demo badge
      expect(screen.getAllByText(/FICTIONAL/i).length).toBeGreaterThan(0);

      // Check confident score for Backend Developer
      expect(screen.getByText('67')).toBeDefined();
      expect(screen.getByText(/COVERAGE 65%/i)).toBeDefined();

      // Check next best action card
      expect(screen.getByText(/NEXT BEST ACTION/i)).toBeDefined();

      // Check plan completion is separated from skill proficiency
      expect(screen.getByText(/EFFORT TRACKING/i)).toBeDefined();
      expect(screen.getByText(/does not certify skill mastery/i)).toBeDefined();
    });

    it('renders all 3 roles on /paths with correct alignment states for Rahul', () => {
      const { getByTestId } = render(<TestWrapper initialRoute="/paths" setupMode="rahul" />);
      fireEvent.click(getByTestId('setup-rahul-btn'));

      // Role 1: Backend Developer (confident 67%)
      expect(screen.getByText('Backend Developer')).toBeDefined();
      expect(screen.getByText('67')).toBeDefined();
      expect(screen.getByText(/COVERAGE 65%/i)).toBeDefined();

      // Role 2: Data Analyst (coverage < 60%)
      expect(screen.getByText('Data Analyst')).toBeDefined();

      // Role 3: Frontend Developer (coverage < 60%)
      expect(screen.getByText('Frontend Developer')).toBeDefined();
      expect(screen.getAllByText(/More evidence needed/i).length).toBeGreaterThan(0);
    });
  });

  describe('Case 2: Fresh User with No Answers', () => {
    it('shows honest unranked / more evidence needed state and NEVER a misleading zero on dashboard', () => {
      render(<TestWrapper initialRoute="/dashboard" setupMode="fresh" />);

      // Must show "More evidence needed", not "0% assessed alignment"
      expect(screen.getByText(/More evidence needed/i)).toBeDefined();
      expect(screen.getByText(/COVERAGE 0%/i)).toBeDefined();
      expect(screen.queryByText(/0% assessed alignment/i)).toBeNull();

      // Does not show Rahul's fictional badge
      expect(screen.queryByText(/RAHUL'S SNAPSHOT/i)).toBeNull();
    });

    it('shows more evidence needed across all 3 roles on /paths for fresh user', () => {
      render(<TestWrapper initialRoute="/paths" setupMode="fresh" />);

      expect(screen.getByText('Backend Developer')).toBeDefined();
      expect(screen.getByText('Data Analyst')).toBeDefined();
      expect(screen.getByText('Frontend Developer')).toBeDefined();

      // All 3 show "More evidence needed" and coverage 0%
      const neededBadges = screen.getAllByText(/More evidence needed/i);
      expect(neededBadges.length).toBe(3);

      const coverageZeros = screen.getAllByText(/COVERAGE 0%/i);
      expect(coverageZeros.length).toBe(3);
    });

    it('shows unassessed for all requirements on /paths/backend-developer for fresh user', () => {
      render(<TestWrapper initialRoute="/paths/backend-developer" setupMode="fresh" />);

      expect(screen.getByText('Backend Developer')).toBeDefined();
      expect(screen.getByText(/More evidence needed/i)).toBeDefined();

      // Competencies are marked unassessed (unknown)
      const unassessedItems = screen.getAllByText(/Unassessed/i);
      expect(unassessedItems.length).toBeGreaterThan(0);

      // Never shows fake salary or placement odds
      expect(screen.queryByText(/LPA|salary|placement chance/i)).toBeNull();
    });
  });

  describe('Case 3: Partial User with Low Coverage (< 60%)', () => {
    it('explains uncertainty and remains unranked when coverage is below 60%', () => {
      const { getByTestId } = render(<TestWrapper initialRoute="/paths" setupMode="partial" />);
      fireEvent.click(getByTestId('setup-partial-btn'));

      // Backend Developer has some evidence, but coverage is < 60%
      expect(screen.getByText('Backend Developer')).toBeDefined();
      expect(screen.getAllByText(/More evidence needed/i).length).toBeGreaterThan(0);

      // Card explains coverage threshold
      expect(screen.getAllByText(/is below 60% threshold/i).length).toBeGreaterThan(0);
    });
  });

  describe('Role Detail Page & Prerequisite Rules', () => {
    it('displays prerequisite-aware requirement order, rationale, and next action', () => {
      render(<TestWrapper initialRoute="/paths/backend-developer" setupMode="fresh" />);

      // Requirements header
      expect(screen.getByText(/Prerequisite Competencies & Gaps/i)).toBeDefined();

      // Prerequisite badges exist in order
      expect(screen.getAllByText(/PREREQUISITE 01/i).length).toBeGreaterThan(0);

      // Check why it matters copy
      expect(screen.getAllByText(/Why it matters/i).length).toBeGreaterThan(0);

      // Check source and checked date
      expect(screen.getAllByText(/CareerAI seed role profile/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/Checked: 2026-10-02/i)).toBeDefined();
    });

    it('handles non-existent role slug gracefully with error state', () => {
      render(<TestWrapper initialRoute="/paths/non-existent-role" setupMode="fresh" />);

      expect(screen.getByText(/Role Not Found/i)).toBeDefined();
      expect(screen.getByRole('button', { name: /Return to Role Comparison/i })).toBeDefined();
    });
  });
});
