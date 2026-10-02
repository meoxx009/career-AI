import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { App } from '../App';

describe('CareerAI Phase 1 Smoke Test', () => {
  it('renders the accessible AppShell at root /', () => {
    render(<App />);

    // Checks header brand
    expect(screen.getByRole('banner')).toBeDefined();
    expect(screen.getByText('career')).toBeDefined();

    // Checks main landmark and initial content
    expect(screen.getByRole('main')).toBeDefined();
    expect(screen.getByText(/Phase 1 Complete/i)).toBeDefined();

    // Checks footer landmark
    expect(screen.getByRole('contentinfo')).toBeDefined();
  });
});
