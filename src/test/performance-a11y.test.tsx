import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import fs from 'fs';
import path from 'path';
import { CareerProvider } from '../context/CareerContext';
import { AppShell } from '../components/AppShell';
import { AuthModal } from '../components/AuthModal';
import { RouteLoadingFallback } from '../App';

import appCode from '../App.tsx?raw';
import resumeLabCode from '../pages/ResumeLab.tsx?raw';
import practiceCode from '../pages/Practice.tsx?raw';
import assessmentCode from '../pages/Assessment.tsx?raw';
import dashboardCode from '../pages/Dashboard.tsx?raw';
import pathsCode from '../pages/Paths.tsx?raw';
import roadmapCode from '../pages/Roadmap.tsx?raw';

function renderWithContext(ui: React.ReactElement, initialRoute = '/') {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <CareerProvider>
        {ui}
      </CareerProvider>
    </MemoryRouter>
  );
}

describe('Prompt 14 — Performance, responsive UX and accessibility pass', () => {
  describe('Accessibility Landmarks, Skip Links and Focus Management', () => {
    it('provides a functional "Skip to main content" link linking to #main-content', () => {
      renderWithContext(
        <AppShell>
          <div>Main Body Content</div>
        </AppShell>
      );

      const skipLink = screen.getByRole('link', { name: /skip to main content/i });
      expect(skipLink).toBeInTheDocument();
      expect(skipLink).toHaveAttribute('href', '#main-content');

      const mainContent = document.getElementById('main-content');
      expect(mainContent).toBeInTheDocument();
      expect(mainContent).toHaveAttribute('role', 'main');
      expect(mainContent).toHaveAttribute('tabindex', '-1');
    });

    it('renders landmark roles for banner, main, and contentinfo with storage banner absent', () => {
      renderWithContext(
        <AppShell>
          <div>Page content</div>
        </AppShell>,
        '/settings'
      );

      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.queryByRole('complementary', { name: /storage mode/i })).toBeNull();
      expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    });

    it('closes the AuthModal when the Escape key is pressed', () => {
      const handleClose = vi.fn();
      renderWithContext(
        <AuthModal isOpen={true} onClose={handleClose} initialMode="signin" />
      );

      expect(screen.getByRole('dialog', { name: /sign in/i })).toBeInTheDocument();

      // Trigger Escape keydown on window
      fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('closes the mobile navigation drawer when Escape key is pressed', () => {
      renderWithContext(
        <AppShell>
          <div>Body</div>
        </AppShell>
      );

      const menuToggle = screen.getByRole('button', { name: /open navigation menu/i });
      fireEvent.click(menuToggle);

      // Mobile dialog should now be open
      const mobileDialog = screen.getByRole('dialog', { name: /mobile navigation/i });
      expect(mobileDialog).toBeInTheDocument();

      // Trigger Escape key
      fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });

      // Mobile dialog should be closed
      expect(screen.queryByRole('dialog', { name: /mobile navigation/i })).not.toBeInTheDocument();
    });
  });

  describe('Readable Async Loading Fallback & Code Splitting', () => {
    it('RouteLoadingFallback provides an accessible polite status with readable copy and reserved height', () => {
      const { container } = render(<RouteLoadingFallback />);

      const statusEl = screen.getByRole('status', { name: /loading page content/i });
      expect(statusEl).toBeInTheDocument();
      expect(statusEl).toHaveAttribute('aria-live', 'polite');
      expect(screen.getByText(/loading page\.\.\./i)).toBeInTheDocument();
      expect(screen.getByText(/preparing deterministic tools/i)).toBeInTheDocument();

      // Ensure space reservation to prevent layout shift
      const el = container.firstChild as HTMLElement;
      expect(el.style.minHeight).toBe('440px');
    });

    it('verifies App.tsx implements lazy-loading for downstream routes and eager landing', () => {
      // Eager landing import
      expect(appCode).toMatch(/import \{ Landing \} from '\.\/pages\/Landing'/);

      // Lazy loaded pages
      expect(appCode).toContain('lazy(() => import(\'./pages/Onboarding\')');
      expect(appCode).toContain('lazy(() => import(\'./pages/Assessment\')');
      expect(appCode).toContain('lazy(() => import(\'./pages/Paths\')');
      expect(appCode).toContain('lazy(() => import(\'./pages/Dashboard\')');
      expect(appCode).toContain('lazy(() => import(\'./pages/Roadmap\')');
      expect(appCode).toContain('lazy(() => import(\'./pages/ResumeLab\')');
      expect(appCode).toContain('lazy(() => import(\'./pages/Practice\')');

      // Suspense boundary with RouteLoadingFallback
      expect(appCode).toContain('<Suspense fallback={<RouteLoadingFallback />}>');
    });
  });

  describe('Responsive Architecture & Viewport Safety', () => {
    it('verifies responsive 2-column class is used in ResumeLab and Practice', () => {
      expect(resumeLabCode).toContain('responsive-two-col');
      expect(practiceCode).toContain('responsive-two-col');
    });

    it('verifies globals.css defines responsive-two-col, skip-to-content, and 360px overflow protections', () => {
      const globalsCss = fs.readFileSync(path.resolve(process.cwd(), 'src/styles/globals.css'), 'utf-8');

      // Skip link styles
      expect(globalsCss).toContain('.skip-to-content');
      expect(globalsCss).toContain('.skip-to-content:focus');

      // Responsive two-column collapsing rule
      expect(globalsCss).toContain('.responsive-two-col');
      expect(globalsCss).toContain('@media (max-width: 768px)');

      // Reduced motion media query
      expect(globalsCss).toContain('@media (prefers-reduced-motion: reduce)');

      // Focus visible outline styles
      expect(globalsCss).toContain('*:focus-visible');
      expect(globalsCss).toContain('input:focus-visible');

      // 44px min-height for touch targets
      expect(globalsCss).toMatch(/\.button[^{]*\{[^}]*min-height:\s*44px/s);
    });

    it('verifies responsive grid columns do not hardcode fixed widths > 300px without min(100%, ...)', () => {
      const pageSources = [assessmentCode, dashboardCode, pathsCode, roadmapCode];
      pageSources.forEach(src => {
        expect(src).not.toMatch(/minmax\(\s*3\d\dpx\s*,/);
      });
    });
  });
});
