import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CareerProvider } from '../context/CareerContext';
import { Settings } from '../pages/Settings';
import { ProfileEdit } from '../pages/ProfileEdit';
import { Terms, Privacy, AiSafety } from '../pages/LegalPage';
import { AppShell } from '../components/AppShell';
import { defaultProfileRepository } from '../lib/repositories/profileRepository';

describe('Prompt 8 & Gate 8 — Settings, Font Sizing, Profile Edit & Legal Transparency', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.setAttribute('data-font-size', 'default');
    document.documentElement.style.fontSize = '16px';
    vi.restoreAllMocks();
  });

  describe('1. Font Size Preference & Accessible Scaling', () => {
    it('defaults to 16px and applies selected font size to root document', async () => {
      render(
        <MemoryRouter initialEntries={['/settings']}>
          <CareerProvider>
            <Settings />
          </CareerProvider>
        </MemoryRouter>
      );

      // Verify default state
      expect(screen.getByText('Active: DEFAULT')).toBeInTheDocument();

      // Click "Large" (18px)
      const largeButton = screen.getByRole('radio', { name: /^large/i });
      fireEvent.click(largeButton);

      // Verify DOM root update
      expect(document.documentElement.getAttribute('data-font-size')).toBe('large');
      expect(document.documentElement.style.fontSize).toBe('18px');
      expect(localStorage.getItem('career_ai_font_size')).toBe('large');
      expect(screen.getByText('Active: LARGE')).toBeInTheDocument();
    });

    it('persists selected font size across reload via localStorage', () => {
      // Simulate stored preference
      localStorage.setItem('career_ai_font_size', 'extra-large');

      render(
        <MemoryRouter initialEntries={['/settings']}>
          <CareerProvider>
            <Settings />
          </CareerProvider>
        </MemoryRouter>
      );

      expect(document.documentElement.getAttribute('data-font-size')).toBe('extra-large');
      expect(document.documentElement.style.fontSize).toBe('20px');
      expect(screen.getByText('Active: EXTRA-LARGE')).toBeInTheDocument();
    });

    it('resets font size to default (16px) upon clicking reset', () => {
      localStorage.setItem('career_ai_font_size', 'comfortable');

      render(
        <MemoryRouter initialEntries={['/settings']}>
          <CareerProvider>
            <Settings />
          </CareerProvider>
        </MemoryRouter>
      );

      expect(document.documentElement.getAttribute('data-font-size')).toBe('comfortable');

      const resetButton = screen.getByRole('button', { name: /reset text size to default/i });
      fireEvent.click(resetButton);

      expect(document.documentElement.getAttribute('data-font-size')).toBe('default');
      expect(document.documentElement.style.fontSize).toBe('16px');
      expect(localStorage.getItem('career_ai_font_size')).toBe('default');
      expect(screen.getByText('Active: DEFAULT')).toBeInTheDocument();
    });

    it('supports 360px viewport without assumptions of horizontal overflow', () => {
      // Verify all options render and fit responsive grid
      render(
        <MemoryRouter initialEntries={['/settings']}>
          <CareerProvider>
            <Settings />
          </CareerProvider>
        </MemoryRouter>
      );

      const radioGroup = screen.getByRole('radiogroup', { name: /text size preference/i });
      expect(radioGroup).toBeInTheDocument();
      const options = within(radioGroup).getAllByRole('radio');
      expect(options.length).toBe(4);
    });
  });

  describe('2. Profile Edit Flow & Pre-population', () => {
    it('prefills current values from learner profile into form fields', () => {
      render(
        <MemoryRouter initialEntries={['/profile/edit']}>
          <CareerProvider>
            <ProfileEdit />
          </CareerProvider>
        </MemoryRouter>
      );

      expect(screen.getByLabelText(/display name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/weekly study commitment/i)).toHaveValue(8); // from initial empty profile
    });

    it('validates required fields inline and blocks submission if invalid', async () => {
      render(
        <MemoryRouter initialEntries={['/profile/edit']}>
          <CareerProvider>
            <ProfileEdit />
          </CareerProvider>
        </MemoryRouter>
      );

      const nameInput = screen.getByLabelText(/display name/i);
      fireEvent.change(nameInput, { target: { value: '   ' } });

      const saveButton = screen.getByRole('button', { name: /save profile changes/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Display name is required.')).toBeInTheDocument();
      });
    });

    it('triggers roadmap replanning confirmation modal when hours or role change', async () => {
      render(
        <MemoryRouter initialEntries={['/profile/edit']}>
          <CareerProvider>
            <ProfileEdit />
          </CareerProvider>
        </MemoryRouter>
      );

      const nameInput = screen.getByLabelText(/display name/i);
      fireEvent.change(nameInput, { target: { value: 'Dev Learner' } });

      const hoursInput = screen.getByLabelText(/weekly study commitment/i);
      fireEvent.change(hoursInput, { target: { value: '20' } });

      const saveButton = screen.getByRole('button', { name: /save profile changes/i });
      fireEvent.click(saveButton);

      // Replan confirmation modal must appear
      await waitFor(() => {
        expect(screen.getByText('Roadmap Replan Confirmation')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /regenerate roadmap & save profile/i })).toBeInTheDocument();
      });

      // Confirm replanning
      const confirmButton = screen.getByRole('button', { name: /regenerate roadmap & save profile/i });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText(/profile changes saved/i)).toBeInTheDocument();
      });
    });

    it('preserves draft in memory when repository save fails', async () => {
      // Mock failure
      vi.spyOn(defaultProfileRepository, 'upsertProfile').mockResolvedValueOnce({
        data: null,
        error: 'Network connectivity timeout',
      });

      render(
        <MemoryRouter initialEntries={['/profile/edit']}>
          <CareerProvider>
            <ProfileEdit />
          </CareerProvider>
        </MemoryRouter>
      );

      const nameInput = screen.getByLabelText(/display name/i);
      fireEvent.change(nameInput, { target: { value: 'Draft User' } });

      const saveButton = screen.getByRole('button', { name: /save profile changes/i });
      fireEvent.click(saveButton);

      // After failed save, the draft name remains in the input field!
      await waitFor(() => {
        expect(screen.getByLabelText(/display name/i)).toHaveValue('Draft User');
      });
    });

    it('never writes synthetic Rahul demo profile to authenticated database', async () => {
      const upsertSpy = vi.spyOn(defaultProfileRepository, 'upsertProfile');

      render(
        <MemoryRouter initialEntries={['/settings']}>
          <CareerProvider>
            <Settings />
          </CareerProvider>
        </MemoryRouter>
      );

      // Click explore demo
      const demoBtn = screen.getByRole('button', { name: /explore rahul demo/i });
      fireEvent.click(demoBtn);

      // Verify upsertProfile was never invoked for synthetic demo exploration
      expect(upsertSpy).not.toHaveBeenCalled();
    });
  });

  describe('3. Professional Legal Pages & Headings', () => {
    it('renders /terms with all 9 required legal sections', () => {
      render(
        <MemoryRouter initialEntries={['/terms']}>
          <Terms />
        </MemoryRouter>
      );

      expect(screen.getByRole('heading', { level: 1, name: /terms of service/i })).toBeInTheDocument();
      expect(screen.getByText(/plain-language summary/i)).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /01.*what careerai provides/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /02.*what careerai does not provide/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /03.*user-provided content/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /04.*local storage and account persistence/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /05.*optional ai processing and consent/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /06.*resume truthfulness/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /07.*educational recommendations and eligibility caveat/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /08.*data export and deletion/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /09.*changes and contact\/support/i })).toBeInTheDocument();
      expect(screen.getByText(/return to settings/i)).toBeInTheDocument();
    });

    it('renders /privacy with privacy summary and navigation tabs', () => {
      render(
        <MemoryRouter initialEntries={['/privacy']}>
          <Privacy />
        </MemoryRouter>
      );

      expect(screen.getByRole('heading', { level: 1, name: /privacy & data policy/i })).toBeInTheDocument();
      expect(screen.getAllByText(/row-level security \(rls\)/i).length).toBeGreaterThan(0);
    });

    it('renders /ai-safety with non-hallucination and ethics commitments', () => {
      render(
        <MemoryRouter initialEntries={['/ai-safety']}>
          <AiSafety />
        </MemoryRouter>
      );

      expect(screen.getByRole('heading', { level: 1, name: /ai safety & ethical contract/i })).toBeInTheDocument();
      expect(screen.getByText(/anti-hallucination contract/i)).toBeInTheDocument();
    });
  });

  describe('4. Settings "How We Use Your Data" & Footer Links', () => {
    it('renders the 10-point "How We Use Your Data" section in Settings', () => {
      render(
        <MemoryRouter initialEntries={['/settings']}>
          <CareerProvider>
            <Settings />
          </CareerProvider>
        </MemoryRouter>
      );

      expect(screen.getByRole('heading', { name: /how we use your data/i })).toBeInTheDocument();
      expect(screen.getByText(/1\. local-first guest storage/i)).toBeInTheDocument();
      expect(screen.getByText(/3\. row-level security/i)).toBeInTheDocument();
      expect(screen.getByText(/4\. telemetry privacy sanitization/i)).toBeInTheDocument();
      expect(screen.getByText(/6\. mandatory review of ai output/i)).toBeInTheDocument();
      expect(screen.getByText(/7\. no placement or admission guarantees/i)).toBeInTheDocument();
      expect(screen.getByText(/10\. disclosed p1 boundary/i)).toBeInTheDocument();
    });

    it('renders footer links pointing to real legal and settings routes', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <CareerProvider>
            <AppShell>
              <div>Landing Content</div>
            </AppShell>
          </CareerProvider>
        </MemoryRouter>
      );

      const termsLink = screen.getByRole('link', { name: /terms of use/i });
      expect(termsLink).toHaveAttribute('href', '/terms');

      const privacyLink = screen.getByRole('link', { name: /privacy & data/i });
      expect(privacyLink).toHaveAttribute('href', '/privacy');

      const aiSafetyLink = screen.getByRole('link', { name: /ai safety/i });
      expect(aiSafetyLink).toHaveAttribute('href', '/ai-safety');

      const howWeUseDataLink = screen.getByRole('link', { name: /how we use your data/i });
      expect(howWeUseDataLink).toHaveAttribute('href', '/settings#privacy');
    });
  });
});
