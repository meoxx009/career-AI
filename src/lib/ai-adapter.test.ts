import { describe, it, expect } from 'vitest';
import { DeterministicFallbackAdapter } from './ai-adapter';

describe('Deterministic AI Fallback Adapter', () => {
  it('identifies matched and missing keyword aliases from JD and resume', () => {
    const result = DeterministicFallbackAdapter.reviewResume({
      resumeText: 'Built Python backend using SQLite database and pytest for testing.',
      jobDescription: 'Seeking backend developer with Python, PostgreSQL, and Docker container knowledge.',
      targetRoleId: 'role-backend',
      consent: true,
    });

    expect(result.mode).toBe('deterministic-fallback');
    // 'python' and 'sql' (via sqlite/postgresql aliases) should match
    expect(result.matchedTerms).toContain('python');
    expect(result.matchedTerms).toContain('sql');
    // 'docker' is in JD but not resume
    expect(result.missingTerms).toContain('docker');
  });

  it('flags unverified metrics when source facts are absent', () => {
    const result = DeterministicFallbackAdapter.reviewResume({
      resumeText: 'Optimized API response time by 45% across all endpoints.',
      jobDescription: 'Python developer with REST experience.',
      targetRoleId: 'role-backend',
      factIds: [], // no source facts linked
      consent: true,
    });

    expect(result.unsupportedClaims.length).toBeGreaterThan(0);
    expect(result.unsupportedClaims[0].text).toBe('45%');
    expect(result.unsupportedClaims[0].reason).toContain('without verified source fact');
  });

  it('abstains from interview evaluation if answer has insufficient depth', () => {
    const result = DeterministicFallbackAdapter.evaluateInterviewAnswer({
      questionId: 'q-1',
      questionPrompt: 'Explain how you design a REST API endpoint.',
      answerText: 'I just write code.',
      rubricVersion: '1.2.0',
      consent: true,
    });

    expect(result.abstained).toBe(true);
    expect(result.citedCriteria).toContain('Minimum substantive depth');
  });

  it('evaluates STAR structure when detailed answer is provided', () => {
    const result = DeterministicFallbackAdapter.evaluateInterviewAnswer({
      questionId: 'q-1',
      questionPrompt: 'Describe a time you resolved an unexpected bug.',
      answerText:
        'When building our college project, our team hit a database timeout bug. I implemented indexing on the user ID column and created automated tests, which resolved the latency issue.',
      rubricVersion: '1.2.0',
      consent: true,
    });

    expect(result.abstained).toBe(false);
    expect(result.strengths.length).toBeGreaterThan(0);
    expect(result.citedCriteria).toContain('Structure: Action-oriented response');
  });
});
