import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { CareerProvider } from '../context/CareerContext';
import { AppShell } from '../components/AppShell';

import { Landing } from '../pages/Landing';
import { Onboarding } from '../pages/Onboarding';
import { Assessment } from '../pages/Assessment';
import { Paths } from '../pages/Paths';
import { RoleDetail } from '../pages/RoleDetail';
import { Dashboard } from '../pages/Dashboard';
import { Roadmap } from '../pages/Roadmap';
import { ResumeLab } from '../pages/ResumeLab';
import { Practice } from '../pages/Practice';
import { Settings } from '../pages/Settings';
import { NotFound } from '../pages/NotFound';

function renderWithRouter(initialEntry: string) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <CareerProvider>
        <AppShell>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/assessment" element={<Assessment />} />
            <Route path="/paths" element={<Paths />} />
            <Route path="/paths/:roleSlug" element={<RoleDetail />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/roadmap" element={<Roadmap />} />
            <Route path="/resume" element={<ResumeLab />} />
            <Route path="/practice" element={<Practice />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppShell>
      </CareerProvider>
    </MemoryRouter>
  );
}

describe('CareerAI Full Route Shell Architecture (Prompt 03)', () => {
  it('renders Landing route (/)', () => {
    renderWithRouter('/');
    expect(screen.getByText(/FIND YOUR/i)).toBeDefined();
    // On landing, "Find my direction" is a header-button link, not a button element
    expect(screen.getAllByText(/find my direction/i).length).toBeGreaterThan(0);
  });

  it('renders Onboarding route (/onboarding)', () => {
    renderWithRouter('/onboarding');
    expect(screen.getByText(/ACADEMIC CONTEXT/i)).toBeDefined();
    expect(screen.getByLabelText(/your name or preferred handle/i)).toBeDefined();
  });

  it('renders Assessment route (/assessment)', () => {
    renderWithRouter('/assessment');
    expect(screen.getByText(/CHOOSE WHAT YOU WANT TO ASSESS/i)).toBeDefined();
    const startBtn = screen.getByRole('button', { name: /start diagnostic assessment/i });
    expect(startBtn).toBeDefined();
    fireEvent.click(startBtn);
    expect(screen.getByText(/DIAGNOSTIC \/ QUESTION 1/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /next question/i })).toBeDefined();
  });

  it('renders Paths role comparison route (/paths)', () => {
    renderWithRouter('/paths');
    expect(screen.getByText(/CAREER PATH COMPARISON/i)).toBeDefined();
    expect(screen.getByText(/Backend Developer/i)).toBeDefined();
  });

  it('renders RoleDetail route (/paths/:roleSlug)', () => {
    renderWithRouter('/paths/backend-developer');
    expect(screen.getByText(/PATH SPECIFICATION \/ ENTRY LEVEL/i)).toBeDefined();
    expect(screen.getAllByText(/Backend Developer/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Prerequisite Competencies & Gaps/i)).toBeDefined();
  });

  it('renders Dashboard route (/dashboard)', () => {
    renderWithRouter('/dashboard');
    expect(screen.getByText(/NEXT BEST ACTION/i)).toBeDefined();
    expect(screen.getByText(/ROLE ALIGNMENT METRICS/i)).toBeDefined();
  });

  it('renders Roadmap route (/roadmap)', () => {
    renderWithRouter('/roadmap');
    expect(screen.getByText(/Small steps./i)).toBeDefined();
    expect(screen.getByText(/WEEK 01/i)).toBeDefined();
  });

  it('renders Resume Lab route (/resume)', () => {
    renderWithRouter('/resume');
    expect(screen.getByText(/RESUME INTEGRITY LAB/i)).toBeDefined();
    expect(screen.getByText(/Resume Text Draft/i)).toBeDefined();
  });

  it('renders Practice Room route (/practice)', () => {
    renderWithRouter('/practice');
    expect(screen.getByText(/PRACTICE ROOM/i)).toBeDefined();
    expect(screen.getByText(/Evaluate with Deterministic Rubric/i)).toBeDefined();
  });

  it('renders Settings route (/settings)', () => {
    renderWithRouter('/settings');
    expect(screen.getByText(/SETTINGS & PRIVACY/i)).toBeDefined();
    expect(screen.getByText(/Scoring Engine Runtime/i)).toBeDefined();
  });

  it('renders NotFound route on unmatched path (*)', () => {
    renderWithRouter('/unknown/random/path');
    expect(screen.getByText(/PAGE NOT FOUND/i)).toBeDefined();
    expect(screen.getByText(/Looking for a career direction/i)).toBeDefined();
  });

  it('supports mobile menu open and close interaction', () => {
    renderWithRouter('/');
    const menuBtn = screen.getByLabelText(/open navigation menu/i);
    expect(menuBtn).toBeDefined();

    // Open mobile menu
    fireEvent.click(menuBtn);
    const dialog = screen.getByRole('dialog', { name: /mobile navigation/i });
    expect(dialog).toBeDefined();

    // Close with close button
    const closeBtn = screen.getByLabelText(/close menu/i);
    fireEvent.click(closeBtn);
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
