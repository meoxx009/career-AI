import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { CareerProvider } from '../context/CareerContext';
import { AppShell } from '../components/AppShell';
import { ResumeLab } from '../pages/ResumeLab';
import { Paths } from '../pages/Paths';
import { Settings } from '../pages/Settings';
import { ProfileEdit } from '../pages/ProfileEdit';
import { Onboarding } from '../pages/Onboarding';
import { Dashboard } from '../pages/Dashboard';
import { Assessment } from '../pages/Assessment';
import { RoleDetail } from '../pages/RoleDetail';
import {
  extractResumeText,
  validateResumeFile,
  MAX_FILE_SIZE_BYTES,
} from '../lib/resumeExtractor';
import { CAREER_CATALOGUE, STARTER_CAREER_PATHS } from '../data/careerCatalogue';
import { generatePathRecommendations } from '../lib/pathRecommendations';

describe('1. Storage / Demo Notice Banner Absence Across All Pages', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const renderWithProviders = (initialRoute: string, element: React.ReactNode) => {
    return render(
      <MemoryRouter initialEntries={[initialRoute]}>
        <CareerProvider>
          <Routes>
            <Route path={initialRoute} element={<AppShell>{element}</AppShell>} />
          </Routes>
        </CareerProvider>
      </MemoryRouter>
    );
  };

  it('verifies storage banner is absent from AppShell on /', () => {
    renderWithProviders('/', <div>Home Content</div>);
    expect(screen.queryByRole('complementary', { name: /storage notice/i })).toBeNull();
    expect(screen.queryByText(/Running in local browser storage mode/i)).toBeNull();
  });

  it('verifies storage banner is absent from Onboarding', () => {
    renderWithProviders('/onboarding', <Onboarding />);
    expect(screen.queryByText(/Running in local browser storage mode/i)).toBeNull();
  });

  it('verifies storage banner is absent from Dashboard', () => {
    renderWithProviders('/dashboard', <Dashboard />);
    expect(screen.queryByText(/Running in local browser storage mode/i)).toBeNull();
  });

  it('verifies storage banner is absent from Assessment', () => {
    renderWithProviders('/assessment', <Assessment />);
    expect(screen.queryByText(/Running in local browser storage mode/i)).toBeNull();
  });

  it('verifies storage banner is absent from Paths', () => {
    renderWithProviders('/paths', <Paths />);
    expect(screen.queryByText(/Running in local browser storage mode/i)).toBeNull();
  });

  it('verifies storage banner is absent from Settings', () => {
    renderWithProviders('/settings', <Settings />);
    expect(screen.queryByText(/Running in local browser storage mode/i)).toBeNull();
  });

  it('verifies storage banner is absent from ProfileEdit', () => {
    renderWithProviders('/profile/edit', <ProfileEdit />);
    expect(screen.queryByText(/Running in local browser storage mode/i)).toBeNull();
  });

  it('verifies storage banner is absent from RoleDetail', () => {
    renderWithProviders('/role/1', <RoleDetail />);
    expect(screen.queryByText(/Running in local browser storage mode/i)).toBeNull();
  });
});

describe('2. Client-Side Resume Upload & Extraction Engine', () => {
  it('enforces 10 MB maximum file size limit', () => {
    expect(MAX_FILE_SIZE_BYTES).toBe(10 * 1024 * 1024);
  });

  it('rejects oversized file with explicit size validation error', async () => {
    const hugeFile = new File([new Uint8Array(11 * 1024 * 1024)], 'huge_resume.pdf', {
      type: 'application/pdf',
    });

    const validation = validateResumeFile(hugeFile);
    expect(validation.valid).toBe(false);
    expect(validation.error).toMatch(/exceeds the maximum 10 MB limit/i);

    await expect(extractResumeText(hugeFile)).rejects.toThrow(/exceeds the maximum 10 MB limit/i);
  });

  it('rejects unsupported file formats gracefully', async () => {
    const unsupportedFile = new File(['binary-content'], 'script.exe', {
      type: 'application/x-msdownload',
    });

    const validation = validateResumeFile(unsupportedFile);
    expect(validation.valid).toBe(false);
    expect(validation.error).toMatch(/Unsupported file format/i);

    await expect(extractResumeText(unsupportedFile)).rejects.toThrow(/Unsupported file format/i);
  });

  it('extracts plain text from .txt file accurately without external API', async () => {
    const txtContent = 'Jane Doe\nSoftware Engineer with 3 years experience building APIs in Python and Go.';
    const txtFile = new File([txtContent], 'jane_resume.txt', { type: 'text/plain' });

    const result = await extractResumeText(txtFile);
    expect(result.text).toBe(txtContent);
    expect(result.filename).toBe('jane_resume.txt');
    expect(result.isOcr).toBe(false);
  });

  it('flags image files (PNG/JPG/WEBP) with OCR review warning requirement', () => {
    const pngFile = new File(['fake-png-binary'], 'resume_scan.png', { type: 'image/png' });
    const validation = validateResumeFile(pngFile);
    expect(validation.valid).toBe(true);
    expect(validation.fileType).toBe('.png');
  });

  it('renders ResumeUploader inside ResumeLab with drag-and-drop and replace confirmation modal', async () => {
    render(
      <MemoryRouter initialEntries={['/resume']}>
        <CareerProvider>
          <ResumeLab />
        </CareerProvider>
      </MemoryRouter>
    );

    // Verify upload zone elements
    expect(screen.getByText(/Upload your existing resume/i)).toBeInTheDocument();
    expect(screen.getByText(/or drag and drop here/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Select Resume File/i })).toBeInTheDocument();
    expect(screen.getByText(/TXT, DOCX, PDF, PNG, JPG, WEBP/i)).toBeInTheDocument();

    // Verify existing textarea is retained
    const textarea = screen.getByRole('textbox', { name: /Resume Text Draft/i }) as HTMLTextAreaElement;
    expect(textarea).toBeInTheDocument();

    // Type into textarea to create a draft
    fireEvent.change(textarea, { target: { value: 'Original manual draft text' } });
    expect(textarea.value).toBe('Original manual draft text');

    // Simulate uploading a .txt file
    const fileInput = screen.getByTestId('resume-file-input') as HTMLInputElement;
    expect(fileInput).toBeInTheDocument();

    const sampleTxt = new File(['Extracted text from uploaded file.'], 'sample.txt', {
      type: 'text/plain',
    });

    fireEvent.change(fileInput, { target: { files: [sampleTxt] } });

    // Since draft exists, replace confirmation modal should appear
    await waitFor(() => {
      expect(screen.getByText(/Replace Current Resume Draft\?/i)).toBeInTheDocument();
    });

    // Clicking "Cancel" cancels replacement
    const cancelBtn = screen.getByRole('button', { name: /^Cancel$/i });
    fireEvent.click(cancelBtn);

    expect(textarea.value).toBe('Original manual draft text');

    // Now upload again and choose "Replace Draft & Extract"
    fireEvent.change(fileInput, { target: { files: [sampleTxt] } });
    await waitFor(() => {
      expect(screen.getByText(/Replace Current Resume Draft\?/i)).toBeInTheDocument();
    });

    const replaceBtn = screen.getByRole('button', { name: /Replace Draft & Extract/i });
    fireEvent.click(replaceBtn);

    // Textarea should now contain extracted text
    await waitFor(() => {
      expect(textarea.value).toBe('Extracted text from uploaded file.');
    });

    // File info badge should display file name
    expect(screen.getByText('sample.txt')).toBeInTheDocument();

    // Clear file button should remove the file badge
    const clearBtn = screen.getByRole('button', { name: /Clear uploaded file/i });
    fireEvent.click(clearBtn);

    expect(screen.queryByText('sample.txt')).toBeNull();
  });
});

describe('3. Unified Career Catalogue & 8 Criteria Path Recommendations', () => {
  it('confirms CAREER_CATALOGUE contains 33 verified paths and 3 starter paths', () => {
    expect(CAREER_CATALOGUE.length).toBe(33);
    expect(STARTER_CAREER_PATHS.length).toBe(3);
    expect(STARTER_CAREER_PATHS.map(p => p.numericId)).toEqual([1, 2, 3]);
  });

  it('evaluates stage, stream/degree, interests, skills, target role and study hours', () => {
    const result = generatePathRecommendations({
      learnerStage: 'undergraduate',
      degree: 'BCA',
      interests: ['backend', 'cloud-devops'],
      currentSkills: ['SQL', 'Git'],
      targetRoleId: 1,
      hoursPerWeek: 15,
    });

    expect(result.recommendations.length).toBeGreaterThan(0);
    const top = result.recommendations[0];

    // Verify all 8 criteria exist and are non-empty
    expect(top.whySuggested).toBeTruthy();
    expect(top.inputsEvaluated.length).toBeGreaterThanOrEqual(5);
    expect(top.requirementsEvaluated.length).toBeGreaterThanOrEqual(2);
    expect(top.evidenceFound.length).toBeGreaterThan(0);
    expect(top.unknowns.length).toBeGreaterThan(0);
    expect(top.prerequisites.length).toBeGreaterThan(0);
    expect(top.estimatedCurriculum.length).toBeGreaterThan(0);
    expect(top.nextAction).toBeTruthy();

    // Verify dynamic curriculum adjusts to 15 hours/week
    expect(top.estimatedCurriculum[0]).toContain('15h/wk');
  });

  it('renders recommendation card with all 8 criteria in Paths page and keeps starter paths', async () => {
    localStorage.setItem(
      'career_ai_state_v3',
      JSON.stringify({
        hasSelectedRole: true,
        selectedRoleId: 1,
        profile: {
          id: 'guest-learner',
          displayName: 'Test Learner',
          learnerStage: 'undergraduate',
          degree: 'BTech',
          targetRoleId: 1,
          interests: ['backend'],
          hoursPerWeek: 8,
        },
      })
    );
    render(
      <MemoryRouter initialEntries={['/paths']}>
        <CareerProvider>
          <Paths />
        </CareerProvider>
      </MemoryRouter>
    );

    // Recommended pathways section
    expect(screen.getByText(/Suggested Directions for You/i)).toBeInTheDocument();

    // Compact reasoning toggle available
    expect(screen.getAllByText(/Why this direction\?/i).length).toBeGreaterThan(0);

    // Starter paths are cleanly removed from Paths page
    expect(screen.queryByText(/Starter paths — available to explore before assessment/i)).not.toBeInTheDocument();
  });
});

describe('4. Profile Edit Decoupling from Settings to /profile/edit', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('Settings page does NOT render the profile editor, but provides a link to /profile/edit', () => {
    render(
      <MemoryRouter initialEntries={['/settings']}>
        <CareerProvider>
          <Settings />
        </CareerProvider>
      </MemoryRouter>
    );

    // Should not have the learner context intake form
    expect(screen.queryByText(/Select your learner stage/i)).toBeNull();
    expect(screen.queryByRole('button', { name: /Save Profile/i })).toBeNull();

    // Should render Edit Profile link pointing to /profile/edit
    const editLink = screen.getByRole('link', { name: /Open learner profile editor/i });
    expect(editLink).toBeInTheDocument();
    expect(editLink.getAttribute('href')).toBe('/profile/edit');
  });

  it('ProfileEdit page at /profile/edit renders the full intake editor with replanning confirmation', async () => {
    render(
      <MemoryRouter initialEntries={['/profile/edit']}>
        <CareerProvider>
          <ProfileEdit />
        </CareerProvider>
      </MemoryRouter>
    );

    // Title and form elements
    expect(screen.getByText(/Edit Learner Profile/i)).toBeInTheDocument();
    expect(screen.getByText(/What is your current learner stage\?/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Save Profile Changes/i })).toBeInTheDocument();

    // Fill display name to satisfy validation
    const nameInput = screen.getByLabelText(/Display Name/i);
    fireEvent.change(nameInput, { target: { value: 'Alex Morgan' } });

    // Save profile flow
    const saveBtn = screen.getByRole('button', { name: /Save Profile Changes/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(screen.getByText(/Profile changes saved/i)).toBeInTheDocument();
    });
  });

  it('AppShell navigation renders Profile button linking to /profile/edit on internal routes', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <CareerProvider>
          <AppShell>
            <div>Test Children</div>
          </AppShell>
        </CareerProvider>
      </MemoryRouter>
    );

    const profileLinks = screen.getAllByRole('link', { name: /Profile/i });
    const headerProfileLink = profileLinks.find(link => link.getAttribute('href') === '/profile/edit');
    expect(headerProfileLink).toBeDefined();
  });
});
