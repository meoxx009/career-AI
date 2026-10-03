import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { CareerProvider } from '../context/CareerContext';
import { AppShell } from '../components/AppShell';
import { ProfileEdit } from '../pages/ProfileEdit';
import { Settings } from '../pages/Settings';
import { STORAGE_KEY } from '../context/careerConstants';
import type { UserProfile } from '../types';

function renderProfileApp(
  initialProfile: Partial<UserProfile> = {},
  initialRoute = '/profile/edit'
) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      profile: {
        id: 'test-user-id',
        displayName: 'Alex Patel',
        username: 'alex_patel',
        contactEmail: 'alex@example.com',
        branch: 'Computer Science',
        studyYear: '3rd Year',
        hoursPerWeek: 10,
        preferredRoles: [],
        isGuestDemo: false,
        ...initialProfile,
      },
    })
  );

  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <CareerProvider>
        <AppShell>
          <Routes>
            <Route path="/profile/edit" element={<ProfileEdit />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </AppShell>
      </CareerProvider>
    </MemoryRouter>
  );
}

class MockFileReader {
  result: string | ArrayBuffer | null = null;
  onload: ((e: ProgressEvent<FileReader>) => void) | null = null;
  onerror: ((e: ProgressEvent<FileReader>) => void) | null = null;
  static mockResultData = 'data:image/png;base64,mockPngBase64Data';

  readAsDataURL() {
    this.result = MockFileReader.mockResultData;
    if (this.onload) {
      this.onload({
        target: { result: MockFileReader.mockResultData },
      } as unknown as ProgressEvent<FileReader>);
    }
  }
}

describe('Prompt 3 — Professional Profile Page, Avatar, Email, Name & Username', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    MockFileReader.mockResultData = 'data:image/png;base64,mockPngBase64Data';
    vi.stubGlobal('FileReader', MockFileReader);
  });

  describe('Section A & B: Profile Header & Image Upload / Validation', () => {
    it('renders the professional profile header with display name, username, email, and badges', () => {
      renderProfileApp({
        displayName: 'Dr. Jane Roe',
        username: 'jane_roe',
        contactEmail: 'jane@example.org',
        learnerStage: 'postgraduate',
      });

      // Display name in header
      expect(screen.getByRole('heading', { level: 2, name: /Dr. Jane Roe/i })).toBeInTheDocument();

      // Username tag
      expect(screen.getByText('@jane_roe')).toBeInTheDocument();

      // Contact email & Guest badge
      expect(screen.getByText('jane@example.org')).toBeInTheDocument();
      expect(screen.getByText('Guest Contact')).toBeInTheDocument();

      // Stage badge
      expect(screen.getByText('POSTGRADUATE')).toBeInTheDocument();
    });

    it('rejects unsupported file types (SVG, GIF, PDF) with inline error', async () => {
      renderProfileApp();

      const fileInput = screen.getByLabelText(/upload profile image/i) as HTMLInputElement;

      // Create dummy PDF file
      const fakePdf = new File(['%PDF-1.4 dummy'], 'resume.pdf', { type: 'application/pdf' });
      fireEvent.change(fileInput, { target: { files: [fakePdf] } });

      await waitFor(() => {
        expect(screen.getByText(/Unsupported file type. Please upload a PNG, JPG, or WEBP image/i)).toBeInTheDocument();
      });
    });

    it('rejects image files exceeding the 2 MB limit with inline error', async () => {
      renderProfileApp();

      const fileInput = screen.getByLabelText(/upload profile image/i) as HTMLInputElement;

      // Create dummy large file (2.5 MB)
      const largeContent = new Uint8Array(2.5 * 1024 * 1024);
      const largeFile = new File([largeContent], 'avatar-large.png', { type: 'image/png' });
      fireEvent.change(fileInput, { target: { files: [largeFile] } });

      await waitFor(() => {
        expect(screen.getByText(/File exceeds 2 MB limit \(selected: 2.5 MB\)/i)).toBeInTheDocument();
      });
    });

    it('renders image preview and removes photo cleanly', async () => {
      renderProfileApp();

      const fileInput = screen.getByLabelText(/upload profile image/i) as HTMLInputElement;

      // Create a valid small PNG file
      const validFile = new File(['valid-png-data'], 'avatar.png', { type: 'image/png' });

      // Mock FileReader
      MockFileReader.mockResultData = 'data:image/png;base64,mockPngBase64Data';

      fireEvent.change(fileInput, { target: { files: [validFile] } });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /remove photo/i })).toBeInTheDocument();
      });

      // Remove photo
      const removeBtn = screen.getByRole('button', { name: /remove photo/i });
      fireEvent.click(removeBtn);

      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /remove photo/i })).not.toBeInTheDocument();
      });
    });

    it('persists profile image in local storage upon saving in guest mode', async () => {
      renderProfileApp();

      const fileInput = screen.getByLabelText(/upload profile image/i) as HTMLInputElement;
      const validFile = new File(['valid-png-data'], 'avatar.png', { type: 'image/png' });
      const mockResult = 'data:image/png;base64,persistedAvatarData';
      MockFileReader.mockResultData = mockResult;

      fireEvent.change(fileInput, { target: { files: [validFile] } });

      const saveBtn = screen.getByRole('button', { name: /save profile changes/i });
      fireEvent.click(saveBtn);

      await waitFor(() => {
        const raw = localStorage.getItem(STORAGE_KEY);
        expect(raw).not.toBeNull();
        const state = JSON.parse(raw!);
        expect(state.profile.profileImageUrl).toBe(mockResult);
      });
    });
  });

  describe('Section C & D: Name, Username & Email Validation', () => {
    it('validates full name / display name (required, min 2 chars)', async () => {
      renderProfileApp();

      const nameInput = screen.getByLabelText(/full name \/ display name/i);
      fireEvent.change(nameInput, { target: { value: '   ' } });

      const saveBtn = screen.getByRole('button', { name: /save profile changes/i });
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(screen.getByText('Display name is required.')).toBeInTheDocument();
      });
    });

    it('accepts valid username (3-30 chars, alphanumeric + _ -)', async () => {
      renderProfileApp();

      const userInput = screen.getByLabelText(/username/i);
      fireEvent.change(userInput, { target: { value: 'coder_dev-99' } });

      const saveBtn = screen.getByRole('button', { name: /save profile changes/i });
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(screen.queryByText(/Username must be 3–30 characters/i)).not.toBeInTheDocument();
      });
    });

    it('rejects invalid username (too short or special characters)', async () => {
      renderProfileApp();

      const userInput = screen.getByLabelText(/username/i);
      fireEvent.change(userInput, { target: { value: 'ab' } }); // < 3 chars

      const saveBtn = screen.getByRole('button', { name: /save profile changes/i });
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(screen.getByText(/Username must be 3–30 characters and contain only letters, numbers, underscores, or hyphens/i)).toBeInTheDocument();
      });

      // Special characters
      fireEvent.change(userInput, { target: { value: 'user@name!' } });
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(screen.getByText(/Username must be 3–30 characters and contain only letters, numbers, underscores, or hyphens/i)).toBeInTheDocument();
      });
    });

    it('displays contact email in guest mode and validates email format', async () => {
      renderProfileApp();

      const emailInput = screen.getByLabelText(/contact email \(guest\)/i);
      expect(emailInput).toBeInTheDocument();

      // Invalid email
      fireEvent.change(emailInput, { target: { value: 'not-an-email' } });
      const saveBtn = screen.getByRole('button', { name: /save profile changes/i });
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(screen.getByText(/Please enter a valid contact email address/i)).toBeInTheDocument();
      });
    });
  });

  describe('Section E, F & General: Save, Cancel, Reset, and Separation', () => {
    it('cancelling restores original saved values and discards uncommitted changes', async () => {
      renderProfileApp({
        displayName: 'Original Name',
        username: 'original_user',
      });

      const nameInput = screen.getByLabelText(/full name \/ display name/i);
      fireEvent.change(nameInput, { target: { value: 'Temporary Draft Name' } });

      const cancelBtn = screen.getByRole('button', { name: /^cancel$/i });
      fireEvent.click(cancelBtn);

      // Value restored back to Original Name
      expect(nameInput).toHaveValue('Original Name');
    });

    it('Reset unsaved changes button resets form to saved profile state', () => {
      renderProfileApp({
        displayName: 'Initial Stored Name',
        hoursPerWeek: 12,
      });

      const nameInput = screen.getByLabelText(/full name \/ display name/i);
      fireEvent.change(nameInput, { target: { value: 'Changed Name' } });

      const resetBtn = screen.getByRole('button', { name: /reset unsaved changes/i });
      fireEvent.click(resetBtn);

      expect(nameInput).toHaveValue('Initial Stored Name');
    });

    it('Settings page does NOT render profile editor inputs, but provides link to /profile/edit', () => {
      renderProfileApp({}, '/settings');

      // Header on settings exists
      expect(screen.getByRole('heading', { level: 1, name: /SETTINGS & PRIVACY/i })).toBeInTheDocument();

      // Does NOT render profile editor inputs
      expect(screen.queryByLabelText(/upload profile image/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/full name \/ display name/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/weekly study commitment/i)).not.toBeInTheDocument();

      // Renders clean link to /profile/edit
      const editProfileLink = screen.getByRole('link', { name: /open learner profile editor/i });
      expect(editProfileLink).toBeInTheDocument();
      expect(editProfileLink.getAttribute('href')).toBe('/profile/edit');
    });

    it('AppShell navigation renders Profile button linking to /profile/edit', () => {
      renderProfileApp();

      const profileLinks = screen.getAllByRole('link', { name: /^profile$/i });
      const navProfileLink = profileLinks.find(l => l.getAttribute('href') === '/profile/edit');
      expect(navProfileLink).toBeDefined();
    });

    it('preserves synthetic Rahul demo profile flag without remote pollution', async () => {
      renderProfileApp({
        isGuestDemo: true,
        displayName: 'Rahul Sharma (Demo)',
      });

      expect(screen.getByText(/Guest Demo Profile \(Synthetic Rahul Sharma\)/i)).toBeInTheDocument();

      const saveBtn = screen.getByRole('button', { name: /save profile changes/i });
      fireEvent.click(saveBtn);

      await waitFor(() => {
        const raw = localStorage.getItem(STORAGE_KEY);
        expect(raw).not.toBeNull();
        const state = JSON.parse(raw!);
        expect(state.profile.isGuestDemo).toBe(true);
      });
    });
  });
});
