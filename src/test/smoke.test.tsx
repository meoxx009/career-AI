import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { App } from '../App';
import {
  PrimaryButton,
  StatusBadge,
  LinenCard,
  DarkCard,
  CottonCard,
  ScoreMeter,
} from '../components/DesignSystem';

describe('CareerAI Phase 1 & 2 Design System Tests', () => {
  it('renders the accessible AppShell at root /', () => {
    render(<App />);

    // Checks header brand (may appear in header and footer)
    expect(screen.getByRole('banner')).toBeDefined();
    expect(screen.getAllByText('career').length).toBeGreaterThan(0);

    // Checks main landmark and initial landing headline
    expect(screen.getByRole('main')).toBeDefined();
    expect(screen.getByText(/FIND YOUR/i)).toBeDefined();

    // Checks footer landmark
    expect(screen.getByRole('contentinfo')).toBeDefined();

    // Storage notice banner must NOT be visible on the public landing page
    expect(screen.queryByText(/Demo progress stored on this browser/i)).toBeNull();

    // Professional footer disclaimer must be present
    expect(screen.getByText(/does not guarantee admission/i)).toBeDefined();

    // No hardcoded Rahul snapshot text on /
    expect(screen.queryByText(/RAHUL'S SNAPSHOT/i)).toBeNull();
    expect(screen.queryByText(/Viewing synthetic Rahul fixture/i)).toBeNull();
  });

  it('renders design system primitives with expected roles and attributes', () => {
    const { container } = render(
      <div>
        <PrimaryButton>Find my direction</PrimaryButton>
        <StatusBadge variant="tangerine" label="Coverage 78%" />
        <LinenCard>Linen Surface</LinenCard>
        <DarkCard>Dark Surface</DarkCard>
        <CottonCard>Cotton Surface</CottonCard>
        <ScoreMeter score={82} />
      </div>
    );

    // Primary button
    const btn = screen.getByRole('button', { name: /find my direction/i });
    expect(btn).toBeDefined();
    expect(btn.className).toContain('button-primary');

    // Status badge
    expect(screen.getByText(/Coverage 78%/i)).toBeDefined();

    // Meter progressbar
    const meter = screen.getByRole('progressbar');
    expect(meter.getAttribute('aria-valuenow')).toBe('82');

    // Surface classes
    expect(container.querySelector('.linen-card')).toBeDefined();
    expect(container.querySelector('.dark-card')).toBeDefined();
    expect(container.querySelector('.cotton-card')).toBeDefined();
  });
});
