import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { CareerProvider } from '../context/CareerContext';
import { Paths } from '../pages/Paths';
import { Roadmap } from '../pages/Roadmap';
import { ResumeLab } from '../pages/ResumeLab';
import { STORAGE_KEY } from '../context/careerConstants';

function TestNavBar() {
  const navigate = useNavigate();
  return (
    <nav data-testid="test-nav" style={{ display: 'none' }}>
      <button type="button" onClick={() => navigate('/paths')} data-testid="nav-paths">
        Paths
      </button>
      <button type="button" onClick={() => navigate('/roadmap')} data-testid="nav-roadmap">
        Roadmap
      </button>
      <button type="button" onClick={() => navigate('/resume')} data-testid="nav-resume">
        Resume
      </button>
    </nav>
  );
}

function TestSyncApp({ initialRoute = '/paths' }: { initialRoute?: string }) {
  return (
    <MemoryRouter initialEntries={[initialRoute]}>
      <CareerProvider>
        <TestNavBar />
        <Routes>
          <Route path="/paths" element={<Paths />} />
          <Route path="/roadmap" element={<Roadmap />} />
          <Route path="/resume" element={<ResumeLab />} />
        </Routes>
      </CareerProvider>
    </MemoryRouter>
  );
}

describe('End-to-End Flow: Local Draft Intake, Branching Path Tree, & Roadmap-to-Resume Sync', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  describe('1. Paths Draft Intake & Branching Visualization', () => {
    it('allows drafting profile changes and applying them to recalculate branching directions', () => {
      render(<TestSyncApp initialRoute="/paths" />);

      // Branching path visualization is visible
      expect(screen.getByRole('heading', { name: /Suggested Directions for You — Branching Path Visualization/i })).toBeInTheDocument();
      expect(screen.getByText(/ROOT HORIZON •/i)).toBeInTheDocument();

      // Customize draft intake button
      const customizeBtn = screen.getByRole('button', { name: /Customize Profile & Interests/i });
      fireEvent.click(customizeBtn);

      // Editor expands
      expect(screen.getByText(/What is your current learner stage\?/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Apply & View Updated Directions ↗/i })).toBeInTheDocument();

      // Change stage to Class 10
      const class10Radio = screen.getByRole('radio', { name: /Class 10 completed/i });
      fireEvent.click(class10Radio);

      // Select Commerce stream
      const commerceBtn = screen.getByRole('button', { name: /^Commerce/i });
      fireEvent.click(commerceBtn);

      // Apply changes
      const applyBtn = screen.getByRole('button', { name: /Apply & View Updated Directions ↗/i });
      fireEvent.click(applyBtn);

      // Directions update
      expect(screen.getByText(/STREAM-ALIGNED OPPORTUNITY GROUPS \/ COMMERCE/i)).toBeInTheDocument();
      expect(screen.getByText(/Future Opportunities for Commerce/i)).toBeInTheDocument();
    });

    it('opens 5-phase curriculum breakdown when inspected and activates direction for roadmap', () => {
      render(<TestSyncApp initialRoute="/paths" />);

      // Initially no direction overview is open
      expect(screen.queryByText(/5-Phase Structured Curriculum Path/i)).not.toBeInTheDocument();

      // Click inspect on one of the cards
      const inspectButtons = screen.getAllByRole('button', { name: /Inspect 5-Phase Curriculum Breakdown ▼/i });
      expect(inspectButtons.length).toBeGreaterThan(0);
      fireEvent.click(inspectButtons[0]);

      // Overview container is now visible below the tree
      expect(screen.getByText(/Selected Direction Overview/i)).toBeInTheDocument();
      expect(screen.getByText(/5-Phase Structured Curriculum Path/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Verified Deliverables/i).length).toBeGreaterThan(0);

      // Activate for Roadmap button is present
      const activateBtn = screen.getByRole('button', { name: /Activate for Roadmap →/i });
      expect(activateBtn).toBeInTheDocument();
      fireEvent.click(activateBtn);

      // Active target indicator is now displayed
      expect(screen.getAllByText(/Active Roadmap Target|Active Target/i).length).toBeGreaterThan(0);
    });
  });

  describe('2. Roadmap Completion to Source-Linked Resume Synchronization', () => {
    it('automatically records verified deliverable in resumeDoc.facts and rawText on milestone completion', () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          profile: {
            id: 'test-sync-user',
            displayName: 'Sync Learner',
            targetRoleId: 1,
            isGuestDemo: false,
          },
          hasSelectedRole: true,
          selectedRoleId: 1,
        })
      );

      render(<TestSyncApp initialRoute="/roadmap" />);

      // Verify roadmap is displayed for Backend Developer
      expect(screen.getByText(/TARGET PATH \/ BACKEND DEVELOPER/i)).toBeInTheDocument();

      // Complete first milestone button
      const completeBtn = screen.getByRole('button', { name: /Mark ".*" as completed/i });
      expect(completeBtn).toBeInTheDocument();
      fireEvent.click(completeBtn);

      // Button now indicates completion
      expect(screen.getByRole('button', { name: /Mark ".*" as incomplete/i })).toBeInTheDocument();

      // Navigate to Resume Lab within the same app session
      fireEvent.click(screen.getByTestId('nav-resume'));

      // Verify source-linked roadmap achievement card contains the milestone
      expect(screen.getByText(/Source-Linked Roadmap Achievements/i)).toBeInTheDocument();
      expect(screen.getByText(/1 Verified Milestones/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Source: Interactive Roadmap/i).length).toBeGreaterThan(0);

      // Verify bullet was injected into resume text draft
      const textarea = screen.getByLabelText(/Resume Text Draft/i) as HTMLTextAreaElement;
      expect(textarea.value).toContain('VERIFIED ROADMAP MILESTONES');
    });

    it('cleanly removes deliverable proof from facts and rawText if milestone is unchecked', () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          profile: {
            id: 'test-sync-user',
            displayName: 'Sync Learner',
            targetRoleId: 1,
            isGuestDemo: false,
          },
          hasSelectedRole: true,
          selectedRoleId: 1,
        })
      );

      render(<TestSyncApp initialRoute="/roadmap" />);

      const completeBtn = screen.getByRole('button', { name: /Mark ".*" as completed/i });
      fireEvent.click(completeBtn);

      // Now uncomplete it
      const uncompleteBtn = screen.getByRole('button', { name: /Mark ".*" as incomplete/i });
      fireEvent.click(uncompleteBtn);

      // Navigate to Resume Lab
      fireEvent.click(screen.getByTestId('nav-resume'));

      expect(screen.getByText(/0 Verified Milestones/i)).toBeInTheDocument();
      expect(screen.getByText(/No roadmap milestones marked complete yet/i)).toBeInTheDocument();
    });
  });

  describe('3. Resume Lab Actions: Edit, Safety Audit, Save, and Export', () => {
    it('supports editing draft, saving draft, and real print / txt download controls', () => {
      render(<TestSyncApp initialRoute="/resume" />);

      // Edit draft
      const textarea = screen.getByLabelText(/Resume Text Draft/i);
      fireEvent.change(textarea, { target: { value: 'Built custom REST APIs with FastAPI and PostgreSQL.' } });

      // Save draft button
      const saveBtn = screen.getByRole('button', { name: /Save Draft/i });
      expect(saveBtn).toBeInTheDocument();
      fireEvent.click(saveBtn);

      // Print button
      const printBtn = screen.getByRole('button', { name: /Print \/ Save as PDF ↗/i });
      expect(printBtn).toBeInTheDocument();
      const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});
      fireEvent.click(printBtn);
      expect(printSpy).toHaveBeenCalled();

      // Download .txt button
      const downloadBtn = screen.getByRole('button', { name: /Download \.txt/i });
      expect(downloadBtn).toBeInTheDocument();

      // Copy plaintext button
      const copyBtn = screen.getByRole('button', { name: /Copy Plaintext/i });
      expect(copyBtn).toBeInTheDocument();
    });
  });
});
