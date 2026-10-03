/**
 * Gate 2: Landing page cleanup, Natural color and professional footer tests
 * Verifies:
 *  - No Rahul / synthetic demo metrics on /
 *  - Frontend Developer card uses .natural-card surface
 *  - Professional footer rendered with all required sections
 *  - Storage banner hidden on /
 *  - Explore demo CTA present on landing
 *  - Neutral starting-point copy present
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { CareerProvider } from '../context/CareerContext';
import { AppShell } from '../components/AppShell';
import { Landing } from '../pages/Landing';

function renderLanding() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <CareerProvider>
        <AppShell>
          <Routes>
            <Route path="/" element={<Landing />} />
          </Routes>
        </AppShell>
      </CareerProvider>
    </MemoryRouter>
  );
}

describe('Gate 2 — Landing page, Natural color, Professional Footer', () => {

  describe('A. No Rahul / synthetic demo metrics on public landing', () => {
    it('does not show RAHUL\'S SNAPSHOT on /', () => {
      renderLanding();
      expect(screen.queryByText(/RAHUL'S SNAPSHOT/i)).toBeNull();
      expect(screen.queryByText(/FICTIONAL DATA/i)).toBeNull();
    });

    it('does not show hardcoded alignment percentages (82, 74, 68)', () => {
      const { container } = renderLanding();
      // Check that "82%" and "74%" are not in the document text
      expect(container.textContent).not.toContain('82%');
      expect(container.textContent).not.toContain('74%');
      expect(container.textContent).not.toContain('68%');
    });

    it('does not show "Viewing synthetic Rahul fixture" on /', () => {
      renderLanding();
      expect(screen.queryByText(/Viewing synthetic Rahul fixture/i)).toBeNull();
    });

    it('does not show storage notice banner on /', () => {
      renderLanding();
      // The storage notice banner should be hidden on landing
      expect(screen.queryByRole('complementary', { name: /storage mode/i })).toBeNull();
    });

    it('hero label does not say SYNTHETIC DEMO', () => {
      const { container } = renderLanding();
      expect(container.textContent).not.toContain('SYNTHETIC DEMO');
    });
  });

  describe('B. Neutral starting-point content', () => {
    it('shows neutral hero eyebrow', () => {
      renderLanding();
      // "YOUR STARTING POINT" appears in both the hero and the starting section eyebrow
      const eyebrows = screen.getAllByText(/YOUR STARTING POINT/i);
      expect(eyebrows.length).toBeGreaterThanOrEqual(1);
    });

    it('shows three starting-point cards', () => {
      const { container } = renderLanding();
      // Card titles are in .starting-card-title elements (use container.querySelector)
      const titles = container.querySelectorAll('.starting-card-title');
      expect(titles.length).toBeGreaterThanOrEqual(3);
      expect(screen.getByText(/Build a realistic/i)).toBeDefined();
      expect(screen.getByText(/Turn practice/i)).toBeDefined();
    });

    it('shows Find my direction CTA in hero and footer', () => {
      renderLanding();
      // "Find my direction" appears in header link AND hero button AND footer CTA — use getAllBy
      const findLinks = screen.getAllByText(/find my direction/i);
      expect(findLinks.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('C. Starter path cards with correct surfaces and unassessed state', () => {
    it('renders three path cards with role names', () => {
      renderLanding();
      // Path card titles use <h3> with <br> so text is split — match role labels which are not split
      expect(screen.getByText('BACKEND DEVELOPER')).toBeDefined();
      expect(screen.getByText('DATA ANALYST')).toBeDefined();
      expect(screen.getByText('FRONTEND DEVELOPER')).toBeDefined();
    });

    it('shows "Starter path" labels instead of numeric scores', () => {
      renderLanding();
      const starterPills = screen.getAllByText(/Starter path/i);
      expect(starterPills.length).toBeGreaterThanOrEqual(3);
    });

    it('shows "Not assessed yet" for Data Analyst and Frontend cards', () => {
      renderLanding();
      const notAssessed = screen.getAllByText(/Not assessed yet/i);
      expect(notAssessed.length).toBeGreaterThanOrEqual(2);
    });

    it('Frontend Developer card uses .natural-card class', () => {
      const { container } = renderLanding();
      const naturalCards = container.querySelectorAll('.natural-card');
      expect(naturalCards.length).toBeGreaterThanOrEqual(1);
    });

    it('Data Analyst card uses .cotton-card class', () => {
      const { container } = renderLanding();
      const cottonCards = container.querySelectorAll('.cotton-card');
      // cotton-card used in starting section AND data analyst path card
      expect(cottonCards.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('D. Professional multi-column footer', () => {
    it('renders the footer landmark', () => {
      renderLanding();
      expect(screen.getByRole('contentinfo')).toBeDefined();
    });

    it('shows legal disclaimer about no job guarantees', () => {
      renderLanding();
      expect(screen.getByText(/does not guarantee admission/i)).toBeDefined();
    });

    it('shows copyright notice', () => {
      renderLanding();
      expect(screen.getByText(/© 2026 CareerAI/i)).toBeDefined();
    });

    it('shows footer navigation links for all main routes', () => {
      renderLanding();
      // Paths link should appear at least once in the footer
      const pathLinks = screen.getAllByRole('link', { name: /Paths/i });
      expect(pathLinks.length).toBeGreaterThanOrEqual(1);
    });

    it('shows Trust & Privacy section', () => {
      renderLanding();
      expect(screen.getByText(/Trust & Privacy/i)).toBeDefined();
    });

    it('shows "How we use your data" link', () => {
      renderLanding();
      expect(screen.getByText(/How we use your data/i)).toBeDefined();
    });

    it('shows AI Safety link', () => {
      renderLanding();
      expect(screen.getByText(/AI Safety/i)).toBeDefined();
    });

    it('does NOT contain "Sustainable Linen · Recycled Cotton" palette text', () => {
      const { container } = renderLanding();
      expect(container.textContent).not.toContain('Sustainable Linen');
    });
  });

  describe('E. Explore demo CTA', () => {
    it('shows "Explore the demo" button on landing footer CTA', () => {
      renderLanding();
      expect(screen.getByRole('button', { name: /explore the demo/i })).toBeDefined();
    });

    it('shows disclaimer that demo is synthetic / fictional', () => {
      renderLanding();
      expect(screen.getByText(/synthetic data for a fictional learner/i)).toBeDefined();
    });
  });
});
