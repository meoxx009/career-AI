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

    // Checks header brand
    expect(screen.getByRole('banner')).toBeDefined();
    expect(screen.getByText('career')).toBeDefined();

    // Checks main landmark and initial content
    expect(screen.getByRole('main')).toBeDefined();
    expect(screen.getByText(/Production Design System/i)).toBeDefined();

    // Checks footer landmark
    expect(screen.getByRole('contentinfo')).toBeDefined();
  });

  it('renders design system primitives with expected roles and attributes', () => {
    const { container } = render(
      <div>
        <PrimaryButton>Find my direction</PrimaryButton>
        <StatusBadge variant="tangerine">Coverage 78%</StatusBadge>
        <LinenCard>Linen Surface</LinenCard>
        <DarkCard>Dark Surface</DarkCard>
        <CottonCard>Cotton Surface</CottonCard>
        <ScoreMeter percentage={82} />
      </div>
    );

    // Primary button
    const btn = screen.getByRole('button', { name: /find my direction/i });
    expect(btn).toBeDefined();
    expect(btn.className).toContain('button-primary');

    // Status badge
    expect(screen.getByText(/coverage 78%/i)).toBeDefined();

    // Meter progressbar
    const meter = screen.getByRole('progressbar');
    expect(meter.getAttribute('aria-valuenow')).toBe('82');

    // Surface classes
    expect(container.querySelector('.linen-card')).toBeDefined();
    expect(container.querySelector('.dark-card')).toBeDefined();
    expect(container.querySelector('.cotton-card')).toBeDefined();
  });
});
