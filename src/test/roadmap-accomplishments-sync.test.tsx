import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { CareerProvider } from '../context/CareerContext';
import { Roadmap } from '../pages/Roadmap';
import { ResumeLab } from '../pages/ResumeLab';
import { STORAGE_KEY } from '../context/careerConstants';
import {
  syncRoadmapTaskToResumeDoc,
  formatResumeMilestoneBullet,
} from '../lib/roadmapResumeSync';
import type { RoadmapTask, ResumeDocument } from '../types';

function TestNavBar() {
  const navigate = useNavigate();
  return (
    <nav data-testid="test-nav" style={{ display: 'none' }}>
      <button type="button" onClick={() => navigate('/roadmap')} data-testid="nav-roadmap">
        Roadmap
      </button>
      <button type="button" onClick={() => navigate('/resume')} data-testid="nav-resume">
        Resume
      </button>
    </nav>
  );
}

function TestSyncApp({ initialRoute = '/roadmap' }: { initialRoute?: string }) {
  return (
    <MemoryRouter initialEntries={[initialRoute]}>
      <CareerProvider>
        <TestNavBar />
        <Routes>
          <Route path="/roadmap" element={<Roadmap />} />
          <Route path="/resume" element={<ResumeLab />} />
        </Routes>
      </CareerProvider>
    </MemoryRouter>
  );
}

describe('Prompt 5 — Automatic Sync of Actual Accomplishments from Roadmap to Resume Lab', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  describe('1. Pure Engine Contracts & Grounding', () => {
    const sampleTask: RoadmapTask = {
      id: 'task-test-01',
      weekNumber: 1,
      title: 'Python Core & Relational Data',
      description: 'Setup virtual environment and build CLI database tools',
      deliverable: 'CLI Database Manager with SQLite',
      estimatedHours: 8,
      resourceUrl: 'https://docs.python.org/3/',
      status: 'completed',
      completedAt: '2026-10-07',
    };

    const emptyDoc: ResumeDocument = {
      id: 'res-1',
      userId: 'user-test',
      label: 'Draft',
      rawText: 'Experienced student eager to learn.',
      facts: [],
    };

    it('planned goal alone cannot generate an invented project accomplishment (never claims Built X)', () => {
      const synced = syncRoadmapTaskToResumeDoc({
        currentResumeDoc: emptyDoc,
        task: sampleTask,
        allRoadmapTasks: [sampleTask],
        roleId: 1,
        roleName: 'Backend Developer',
        userId: 'user-test',
        action: 'complete',
      });

      expect(synced.facts.length).toBe(1);
      const fact = synced.facts[0];
      expect(fact.sourceStatus).toBe('self_reported');
      expect(fact.verified).toBe(true);
      expect(fact.id).toBe('fact-rm-task-test-01');

      // Check text in bullet: must be truthful learning progress, NOT an invented "Built X"
      const bullet = formatResumeMilestoneBullet(fact);
      expect(bullet).toContain('Self-reported completion');
      expect(bullet).not.toMatch(/Built a production|Engineered an enterprise|1000 users/i);
      expect(synced.rawText).toContain(bullet);
    });

    it('actual work facts produce an accurate, grounded accomplishment draft', () => {
      const taskWithWork: RoadmapTask = {
        ...sampleTask,
        actualWork: {
          whatLearnerDid: 'Built an interactive SQLite command line book tracker with search and CSV export',
          ownContribution: 'Sole developer; designed SQLite schema and wrote unit tests',
          technologiesUsed: 'Python 3.12, SQLite, pytest',
          outcomeOrLimitation: 'All 15 tests passed; no web UI included',
          projectUrl: 'https://github.com/learner/cli-tracker',
        },
      };

      const synced = syncRoadmapTaskToResumeDoc({
        currentResumeDoc: emptyDoc,
        task: taskWithWork,
        allRoadmapTasks: [taskWithWork],
        roleId: 1,
        roleName: 'Backend Developer',
        userId: 'user-test',
        action: 'complete',
      });

      const fact = synced.facts[0];
      expect(fact.actualWork?.whatLearnerDid).toBe(taskWithWork.actualWork?.whatLearnerDid);

      const bullet = formatResumeMilestoneBullet(fact);
      expect(bullet).toContain('Built an interactive SQLite command line book tracker');
      expect(bullet).toContain('using Python 3.12, SQLite, pytest');
      expect(bullet).toContain('(All 15 tests passed; no web UI included)');
      expect(bullet).toContain('[Demo/Code: https://github.com/learner/cli-tracker]');
      expect(synced.rawText).toContain(bullet);
    });

    it('repeated saves and refreshes do not duplicate bullets', () => {
      let doc = emptyDoc;
      for (let i = 0; i < 4; i++) {
        doc = syncRoadmapTaskToResumeDoc({
          currentResumeDoc: doc,
          task: sampleTask,
          allRoadmapTasks: [sampleTask],
          roleId: 1,
          roleName: 'Backend Developer',
          userId: 'user-test',
          action: 'complete',
        });
      }

      // Exactly 1 fact
      expect(doc.facts.length).toBe(1);
      // Exactly 1 occurrence of milestone in rawText
      const occurrences = (doc.rawText.match(/Python Core & Relational Data/g) || []).length;
      expect(occurrences).toBe(1);
    });

    it('split milestone segments are grouped by parent and partial segment completion does not claim whole completion', () => {
      const segment1: RoadmapTask = {
        id: 'task-split-01__s0',
        parentTaskId: 'task-split-01',
        templateId: 'task-split-01',
        segmentIndex: 0,
        segmentCount: 2,
        weekNumber: 1,
        title: 'Full Stack Integration',
        description: 'Frontend part',
        deliverable: 'Frontend API client',
        estimatedHours: 8,
        scheduledHours: 4,
        resourceUrl: 'https://example.org',
        status: 'completed',
      };

      const segment2: RoadmapTask = {
        id: 'task-split-01__s1',
        parentTaskId: 'task-split-01',
        templateId: 'task-split-01',
        segmentIndex: 1,
        segmentCount: 2,
        weekNumber: 2,
        title: 'Full Stack Integration',
        description: 'Backend part',
        deliverable: 'Backend endpoints',
        estimatedHours: 8,
        scheduledHours: 4,
        resourceUrl: 'https://example.org',
        status: 'todo', // not yet complete!
      };

      const allTasks = [segment1, segment2];

      const partialSync = syncRoadmapTaskToResumeDoc({
        currentResumeDoc: emptyDoc,
        task: segment1,
        allRoadmapTasks: allTasks,
        roleId: 1,
        roleName: 'Full Stack',
        userId: 'user-test',
        action: 'complete',
      });

      expect(partialSync.facts.length).toBe(1);
      const fact = partialSync.facts[0];
      expect(fact.isSegmentPartial).toBe(true);
      expect(formatResumeMilestoneBullet(fact)).toContain('Completed partial milestone segment');
    });

    it('manual edits in resume survive work description updates', () => {
      const initialSync = syncRoadmapTaskToResumeDoc({
        currentResumeDoc: emptyDoc,
        task: sampleTask,
        allRoadmapTasks: [sampleTask],
        roleId: 1,
        roleName: 'Backend Developer',
        userId: 'user-test',
        action: 'complete',
      });

      // User manually customizes the bullet in Resume Lab
      const manualBullet = '• Custom manual phrasing crafted by the learner.';
      const editedDoc: ResumeDocument = {
        ...initialSync,
        facts: initialSync.facts.map(f => ({ ...f, manualEdit: manualBullet })),
        rawText: initialSync.rawText.replace(formatResumeMilestoneBullet(initialSync.facts[0]), manualBullet),
      };

      // Now learner updates work description in Roadmap
      const updatedTask: RoadmapTask = {
        ...sampleTask,
        actualWork: {
          whatLearnerDid: 'New work description updated later',
        },
      };

      const reSynced = syncRoadmapTaskToResumeDoc({
        currentResumeDoc: editedDoc,
        task: updatedTask,
        allRoadmapTasks: [updatedTask],
        roleId: 1,
        roleName: 'Backend Developer',
        userId: 'user-test',
        action: 'update_work',
      });

      // The fact records the updated actual work but preserves manual edit!
      expect(reSynced.facts[0].actualWork?.whatLearnerDid).toBe('New work description updated later');
      expect(reSynced.facts[0].manualEdit).toBe(manualBullet);
      expect(formatResumeMilestoneBullet(reSynced.facts[0])).toBe(manualBullet);
    });
  });

  describe('2. UI End-to-End Workflow & Low-Friction Work Capture', () => {
    it('captures actual work in Roadmap, syncs to Resume Lab, and supports review/edit/dismiss', async () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          profile: {
            id: 'sync-learner-1',
            displayName: 'Sync Student',
            targetRoleId: 1,
            isGuestDemo: false,
          },
          hasSelectedRole: true,
          selectedRoleId: 1,
        })
      );

      render(<TestSyncApp initialRoute="/roadmap" />);

      // Verify roadmap is rendered
      expect(screen.getByText(/TARGET PATH \/ BACKEND DEVELOPER/i)).toBeInTheDocument();

      // Click "Mark Complete" on first milestone
      const completeBtn = screen.getByRole('button', { name: /Mark ".*" as completed/i });
      fireEvent.click(completeBtn);

      // Low friction accomplishment area appears
      await waitFor(() => {
        expect(screen.getByText(/Accomplishment Evidence \(Resume Lab Draft\)/i)).toBeInTheDocument();
      });

      // Input actual work details
      const whatLearnerDidInput = screen.getByPlaceholderText(/e\.g\. Implemented REST user endpoints/i);
      fireEvent.change(whatLearnerDidInput, {
        target: { value: 'Engineered SQLite data persistence layer with automated unit test suite' },
      });

      const techInput = screen.getByPlaceholderText(/e\.g\. Python, FastAPI, SQLite, pytest/i);
      fireEvent.change(techInput, { target: { value: 'Python 3.12, SQLite, pytest' } });

      // Save accomplishment
      const saveWorkBtn = screen.getByRole('button', { name: /Save & Sync to Resume Lab ↗/i });
      fireEvent.click(saveWorkBtn);

      // Navigate to Resume Lab
      fireEvent.click(screen.getByTestId('nav-resume'));

      // Verify source linked achievements section contains the accomplishment draft
      expect(screen.getByText(/Source-Linked Roadmap Achievements/i)).toBeInTheDocument();
      expect(screen.getByText(/Accomplishment Draft/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Engineered SQLite data persistence layer/i).length).toBeGreaterThan(0);

      // Verify bullet is included in the draft text
      const textarea = screen.getByLabelText(/Resume Text Draft/i) as HTMLTextAreaElement;
      expect(textarea.value).toContain('Engineered SQLite data persistence layer');
      expect(textarea.value).toContain('using Python 3.12, SQLite, pytest');

      // Test Dismiss action in Resume Lab
      const dismissBtn = screen.getByRole('button', { name: /Dismiss ✕/i });
      fireEvent.click(dismissBtn);

      // After dismissal, button switches to "+ Include in Draft"
      expect(screen.getByRole('button', { name: /\+ Include in Draft/i })).toBeInTheDocument();
    });

    it('clicking curated resource link opens in new tab and never changes completion status', () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          profile: {
            id: 'sync-learner-1',
            displayName: 'Sync Student',
            targetRoleId: 1,
            isGuestDemo: false,
          },
          hasSelectedRole: true,
          selectedRoleId: 1,
        })
      );

      render(<TestSyncApp initialRoute="/roadmap" />);

      const resourceLinks = screen.getAllByRole('link', { name: /Curated Resource/i });
      expect(resourceLinks.length).toBeGreaterThan(0);

      const firstLink = resourceLinks[0];
      expect(firstLink).toHaveAttribute('target', '_blank');
      expect(firstLink).toHaveAttribute('rel', 'noopener noreferrer');

      // Click link
      fireEvent.click(firstLink);

      // Button must still be uncompleted ("Mark Complete")
      const completeBtn = screen.getAllByRole('button', { name: /Mark ".*" as completed/i })[0];
      expect(completeBtn).toBeInTheDocument();
      expect(completeBtn).not.toHaveTextContent(/Completed/);
    });

    it('undoing completion marks entry outdated and excludes unreviewed generated bullet from draft', async () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          profile: {
            id: 'sync-learner-1',
            displayName: 'Sync Student',
            targetRoleId: 1,
            isGuestDemo: false,
          },
          hasSelectedRole: true,
          selectedRoleId: 1,
        })
      );

      render(<TestSyncApp initialRoute="/roadmap" />);

      // Complete
      const completeBtn = screen.getByRole('button', { name: /Mark ".*" as completed/i });
      fireEvent.click(completeBtn);

      // Uncomplete
      const uncompleteBtn = screen.getByRole('button', { name: /Mark ".*" as incomplete/i });
      fireEvent.click(uncompleteBtn);

      // Navigate to Resume Lab
      fireEvent.click(screen.getByTestId('nav-resume'));

      // Unreviewed generated entry was cleanly removed
      expect(screen.getByText(/0 Verified Milestones/i)).toBeInTheDocument();
      expect(screen.getByText(/No roadmap milestones marked complete yet/i)).toBeInTheDocument();
    });
  });
});
