import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { CareerProvider } from '../context/CareerContext';
import { ResumeLab } from '../pages/ResumeLab';
import {
  composeStructuredResume,
  formatActionLedBullet,
  sanitizeUnsupportedMetrics,
  cleanDisplayName,
  isCleanValue,
  regenerateResumePreservingManualEdits,
} from '../lib/resumeComposer';
import type { UserProfile, RoadmapTask } from '../types';

describe('Prompt 6: Profile + Roadmap Work Structured Resume Composer', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  const renderWithProviders = (ui: React.ReactElement) => {
    return render(
      <BrowserRouter>
        <CareerProvider>{ui}</CareerProvider>
      </BrowserRouter>
    );
  };

  it('1. formats completed profile and roadmap accomplishments accurately into structured ATS document', () => {
    const profile: Partial<UserProfile> = {
      displayName: 'Aarav Patel',
      contactEmail: 'aarav.patel@example.com',
      githubUrl: 'https://github.com/aarav',
      linkedinUrl: 'https://linkedin.com/in/aarav',
      portfolioUrl: 'https://aarav.dev',
      learnerStage: 'undergraduate',
      degree: 'B.Tech',
      branch: 'Computer Science',
      specialization: 'Artificial Intelligence',
      institution: 'National Institute of Technology',
      studyYear: '3rd Year',
      expectedGraduationYear: '2026',
      currentSkills: ['Python', 'PostgreSQL', 'FastAPI', 'Docker'],
      projectFacts: 'Created an automated database migration script for relational databases.',
    };

    const tasks: RoadmapTask[] = [
      {
        id: 'task-1',
        weekNumber: 1,
        title: 'RESTful API Service',
        description: 'Build backend API',
        deliverable: 'FastAPI CRUD API with test suite',
        estimatedHours: 20,
        resourceUrl: 'https://example.com/api',
        status: 'completed',
        completedAt: '2026-03-15',
        actualWork: {
          whatLearnerDid: 'Implemented secure JWT authentication and query optimization',
          technologiesUsed: 'FastAPI, PostgreSQL, SQLAlchemy',
          outcomeOrLimitation: 'Passed all 25 unit tests locally',
          projectUrl: 'https://github.com/aarav/fastapi-crud',
        },
      },
    ];

    const result = composeStructuredResume({
      profile,
      roadmapTasks: tasks,
      targetRole: { id: 1, title: 'Junior Backend Developer', level: 'Junior', slug: 'junior-backend-developer' },
    });

    expect(result.hasEducation).toBe(true);
    expect(result.hasSkills).toBe(true);
    expect(result.hasProjects).toBe(true);

    const text = result.rawText;
    // Section 1: Candidate name & contact links
    expect(text).toContain('AARAV PATEL');
    expect(text).toContain('aarav.patel@example.com | GitHub: https://github.com/aarav | LinkedIn: https://linkedin.com/in/aarav | Portfolio: https://aarav.dev');

    // Section 2: Professional summary
    expect(text).toContain('PROFESSIONAL SUMMARY');
    expect(text).toContain('B.Tech student focused on entry-level Junior Backend Developer opportunities with hands-on practice in Python, PostgreSQL, FastAPI, Docker');

    // Section 3: Education
    expect(text).toContain('EDUCATION');
    expect(text).toContain('National Institute of Technology');
    expect(text).toContain('B.Tech in Computer Science (Artificial Intelligence)');
    expect(text).toContain('Status: 3rd Year · Expected Graduation: 2026');

    // Section 4: Technical Skills
    expect(text).toContain('TECHNICAL SKILLS');
    expect(text).toContain('Core Competencies: Python, PostgreSQL, FastAPI, Docker');

    // Section 5: Projects & Practical Accomplishments
    expect(text).toContain('PROJECTS & PRACTICAL ACCOMPLISHMENTS');
    expect(text).toContain('• RESTful API Service (Junior Backend Developer): Implemented secure JWT authentication and query optimization using FastAPI, PostgreSQL, SQLAlchemy (Passed all 25 unit tests locally) [Code/Demo: https://github.com/aarav/fastapi-crud]');
    expect(text).toContain('• Created an automated database migration script for relational databases.');

    // Zero internal fact or account IDs in output
    expect(text).not.toContain('fact-rm-');
    expect(text).not.toContain('fact-profile-');
    expect(text).not.toContain('usr-');
  });

  it('2. cleanly omits education section for self-taught learners without fake degrees or placeholder colleges', () => {
    const selfTaughtProfile: Partial<UserProfile> = {
      displayName: 'Devika Sharma',
      contactEmail: 'devika@example.com',
      learnerStage: 'self_taught',
      // Self-taught candidate might have empty or no formal institution
      institution: '',
      degree: '',
      branch: '',
      studyYear: '',
      currentSkills: ['JavaScript', 'React', 'CSS'],
    };

    const result = composeStructuredResume({
      profile: selfTaughtProfile,
      roadmapTasks: [],
      targetRole: { id: 2, title: 'Junior Frontend Developer', level: 'Junior', slug: 'junior-frontend-developer' },
    });

    expect(result.hasEducation).toBe(false);
    expect(result.rawText).not.toContain('EDUCATION');
    expect(result.rawText).not.toContain('College');
    expect(result.rawText).not.toContain('University');
    expect(result.rawText).not.toContain('N/A');
    expect(result.rawText).not.toContain('Unknown');
    expect(result.rawText).toContain('DEVIKA SHARMA');
    expect(result.rawText).toContain('Independent software developer');
    expect(result.rawText).toContain('TECHNICAL SKILLS');
  });

  it('3. generates a valid usable draft from an incomplete profile without placeholders or crashes', () => {
    const minimalProfile: Partial<UserProfile> = {
      displayName: 'Karan',
    };

    const result = composeStructuredResume({
      profile: minimalProfile,
      roadmapTasks: [],
    });

    expect(result.rawText).toContain('KARAN');
    expect(result.rawText).not.toContain('undefined');
    expect(result.rawText).not.toContain('null');
    expect(result.rawText).not.toContain('N/A');
    expect(result.hasEducation).toBe(false);
    expect(result.hasSkills).toBe(false);
    expect(result.hasProjects).toBe(false);
  });

  it('4. produces action-led bullets and strictly rejects unsupported metrics and user scale claims', () => {
    // Test helper directly
    const taskWithMetrics: RoadmapTask = {
      id: 'task-test',
      weekNumber: 1,
      title: 'Microservices Scaler',
      description: 'Scale microservices',
      deliverable: 'Scalable service',
      estimatedHours: 15,
      resourceUrl: 'https://example.com/scale',
      status: 'completed',
      actualWork: {
        whatLearnerDid: 'I built an API that reduced latency by 40% and served 10,000 active users with 99.9% uptime',
        technologiesUsed: 'Go, Redis',
        outcomeOrLimitation: 'Achieved 5x faster response time',
      },
    };

    const bullet = formatActionLedBullet(taskWithMetrics, 'Backend Developer');

    // Normalized personal pronoun "I built" into action verb
    expect(bullet).toMatch(/^• Microservices Scaler \(Backend Developer\):/);

    // Unsupported metrics must be sanitized/rejected
    expect(bullet).not.toMatch(/40%\s*reduction/i);
    expect(bullet).not.toMatch(/10,000\s*active users/i);
    expect(bullet).not.toMatch(/99\.9%\s*uptime/i);
    expect(bullet).not.toMatch(/5x\s*faster/i);

    // Tech is preserved
    expect(bullet).toContain('using Go, Redis');
  });

  it('5. helper functions cleanDisplayName, isCleanValue, and sanitizeUnsupportedMetrics behave correctly', () => {
    expect(isCleanValue('N/A')).toBe(false);
    expect(isCleanValue('None')).toBe(false);
    expect(isCleanValue('unknown')).toBe(false);
    expect(isCleanValue('usr-492934-abc')).toBe(false);
    expect(isCleanValue('12345678-1234-1234-1234-123456789abc')).toBe(false);
    expect(isCleanValue('Stanford University')).toBe(true);

    expect(cleanDisplayName('usr-8392193-uuid')).toBe('Candidate Name');
    expect(cleanDisplayName('Priya Nair')).toBe('Priya Nair');

    const sanitized = sanitizeUnsupportedMetrics('Scaled to 5000 concurrent users with 99.9% uptime');
    expect(sanitized.stripped.length).toBeGreaterThanOrEqual(2);
    expect(sanitized.sanitized).not.toContain('5000 concurrent users');
    expect(sanitized.sanitized).not.toContain('99.9% uptime');
  });

  it('6. regenerateResumePreservingManualEdits safely protects custom edits and merges new accomplishments', () => {
    const existingCustomText = `KAVITA VERMA\nkavita@example.com\n\nPROFESSIONAL SUMMARY\nMy custom hand-crafted summary that I spent hours editing.\n\nPROJECTS & PRACTICAL ACCOMPLISHMENTS\n• Existing Project: Hand-tuned bullet point.`;

    const inputs = {
      profile: {
        displayName: 'Kavita Verma',
        contactEmail: 'kavita@example.com',
      },
      roadmapTasks: [
        {
          id: 'task-new',
          weekNumber: 1,
          title: 'New Distributed Queue',
          description: 'Queue worker service',
          deliverable: 'Queue worker',
          estimatedHours: 10,
          resourceUrl: 'https://example.com/queue',
          status: 'completed' as const,
          actualWork: {
            whatLearnerDid: 'Built message consumer for background jobs',
            technologiesUsed: 'RabbitMQ',
          },
        },
      ],
    };

    // Merging accomplishments while preserving custom text
    const merged = regenerateResumePreservingManualEdits({
      existingRawText: existingCustomText,
      inputs,
      mode: 'merge_accomplishments',
    });

    // Custom edits remain untouched!
    expect(merged).toContain('My custom hand-crafted summary that I spent hours editing.');
    expect(merged).toContain('• Existing Project: Hand-tuned bullet point.');
    // Newly completed roadmap accomplishment was merged!
    expect(merged).toContain('New Distributed Queue');
  });

  it('7. ResumeLab UI exposes "Compose from Profile & Work", view toggling, and clean recruiter document', async () => {
    renderWithProviders(<ResumeLab />);

    // Check compose button exists
    const composeBtn = screen.getByRole('button', { name: /Compose from Profile & Work/i });
    expect(composeBtn).toBeInTheDocument();

    // Check view switcher buttons exist
    const editorTab = screen.getByRole('button', { name: /Plaintext Editor/i });
    const previewTab = screen.getByRole('button', { name: /ATS Recruiter Preview/i });
    expect(editorTab).toBeInTheDocument();
    expect(previewTab).toBeInTheDocument();

    // Click ATS Recruiter Preview
    fireEvent.click(previewTab);
    expect(screen.getByTestId('ats-recruiter-preview')).toBeInTheDocument();

    // Switch back to editor
    fireEvent.click(editorTab);
    expect(screen.getByLabelText(/Resume Text Draft/i)).toBeInTheDocument();
  });

  it('8. clicking "Compose from Profile & Work" when draft exists prompts confirmation modal with options', async () => {
    renderWithProviders(<ResumeLab />);

    // Load sample first so editor has text
    const sampleBtn = screen.getByRole('button', { name: /Gate 11 Sample/i });
    fireEvent.click(sampleBtn);

    // Click compose button
    const composeBtn = screen.getByRole('button', { name: /Compose from Profile & Work/i });
    fireEvent.click(composeBtn);

    // Confirmation modal should appear
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/Update Resume from Profile & Work/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Merge New Accomplishments \(Keep Custom Edits\)/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Replace with Fresh Composition/i })).toBeInTheDocument();

    // Clicking cancel closes the modal
    const cancelBtn = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelBtn);
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('9. print view container renders selectable resume text without application buttons or navigation chrome', () => {
    const { container } = renderWithProviders(<ResumeLab />);
    const printContainer = container.querySelector('.resume-print-container');
    expect(printContainer).toBeInTheDocument();

    // Verify print container does not include interactive buttons or form inputs
    expect(printContainer?.querySelector('button')).toBeNull();
    expect(printContainer?.querySelector('textarea')).toBeNull();
  });

  it('10. multi-tenant isolation: different candidate profiles generate isolated resume documents', () => {
    const userAProfile: Partial<UserProfile> = {
      displayName: 'Alice Engineer',
      contactEmail: 'alice@company-a.com',
      currentSkills: ['Rust', 'WebAssembly'],
    };

    const userBProfile: Partial<UserProfile> = {
      displayName: 'Bob Designer',
      contactEmail: 'bob@studio-b.com',
      currentSkills: ['Figma', 'CSS'],
    };

    const docA = composeStructuredResume({ profile: userAProfile });
    const docB = composeStructuredResume({ profile: userBProfile });

    expect(docA.rawText).toContain('ALICE ENGINEER');
    expect(docA.rawText).toContain('alice@company-a.com');
    expect(docA.rawText).toContain('Rust, WebAssembly');
    expect(docA.rawText).not.toContain('Bob Designer');

    expect(docB.rawText).toContain('BOB DESIGNER');
    expect(docB.rawText).toContain('bob@studio-b.com');
    expect(docB.rawText).toContain('Figma, CSS');
    expect(docB.rawText).not.toContain('Alice Engineer');
  });
});
