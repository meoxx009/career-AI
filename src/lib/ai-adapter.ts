import { z } from 'zod';

// AI Resume Review schemas
export const ResumeReviewInputSchema = z.object({
  resumeText: z.string().min(1, 'Resume text cannot be empty'),
  jobDescription: z.string().min(1, 'Job description cannot be empty'),
  targetRoleId: z.string(),
  factIds: z.array(z.string()).optional(),
  consent: z.literal(true),
});

export type ResumeReviewInput = z.infer<typeof ResumeReviewInputSchema>;

export const ResumeReviewOutputSchema = z.object({
  mode: z.enum(['ai', 'deterministic-fallback']),
  matchedTerms: z.array(z.string()),
  missingTerms: z.array(z.string()),
  unsupportedClaims: z.array(
    z.object({
      text: z.string(),
      reason: z.string(),
    })
  ),
  suggestions: z.array(
    z.object({
      original: z.string(),
      rewrite: z.string(),
      sourceFactIds: z.array(z.string()),
      needsConfirmation: boolean(),
    })
  ),
  caveat: z.string(),
});

function boolean() {
  return z.boolean();
}

export type ResumeReviewOutput = z.infer<typeof ResumeReviewOutputSchema>;

// AI Interview Feedback schemas
export const InterviewFeedbackInputSchema = z.object({
  questionId: z.string(),
  questionPrompt: z.string(),
  answerText: z.string().min(10, 'Answer must be at least 10 characters'),
  rubricVersion: z.string(),
  consent: z.literal(true),
});

export type InterviewFeedbackInput = z.infer<typeof InterviewFeedbackInputSchema>;

export const InterviewFeedbackOutputSchema = z.object({
  abstained: z.boolean(),
  mode: z.enum(['ai', 'deterministic-fallback']),
  strengths: z.array(z.string()),
  gaps: z.array(z.string()),
  nextAction: z.string(),
  citedCriteria: z.array(z.string()),
});

export type InterviewFeedbackOutput = z.infer<typeof InterviewFeedbackOutputSchema>;

// Keyword alias mappings for reviewed terminology
export const KEYWORD_ALIASES: Record<string, string[]> = {
  python: ['python', 'py', 'django', 'flask', 'fastapi'],
  sql: ['sql', 'postgres', 'postgresql', 'mysql', 'sqlite', 'rdbms'],
  apis: ['api', 'rest', 'restful', 'endpoints', 'json', 'http'],
  git: ['git', 'github', 'version control'],
  testing: ['pytest', 'unittest', 'vitest', 'unit testing', 'test'],
  docker: ['docker', 'container', 'containers'],
  react: ['react', 'react.js', 'reactjs', 'components', 'frontend'],
  data_analysis: ['pandas', 'numpy', 'eda', 'data cleaning', 'visualization'],
};

/**
 * Deterministic Fallback Adapter
 * Runs entirely locally without sending data to external APIs, preserving privacy
 * and ensuring zero downtime.
 */
export class DeterministicFallbackAdapter {
  static reviewResume(input: ResumeReviewInput): ResumeReviewOutput {
    // Validate boundary input
    ResumeReviewInputSchema.parse(input);

    const resumeLower = input.resumeText.toLowerCase();
    const jdLower = input.jobDescription.toLowerCase();

    const matchedTerms: string[] = [];
    const missingTerms: string[] = [];

    // Evaluate keywords using reviewed alias dictionary
    for (const [canonical, aliases] of Object.entries(KEYWORD_ALIASES)) {
      const jdHasIt = aliases.some(alias => jdLower.includes(alias));
      if (jdHasIt) {
        const resumeHasIt = aliases.some(alias => resumeLower.includes(alias));
        if (resumeHasIt) {
          matchedTerms.push(canonical);
        } else {
          missingTerms.push(canonical);
        }
      }
    }

    // Heuristic detection of unsupported claims (e.g. invented metrics or inflated statements)
    const unsupportedClaims: Array<{ text: string; reason: string }> = [];
    const metricMatches = input.resumeText.match(/\b\d{1,3}%|\b\d+x\b|\$\d+/g);
    if (metricMatches) {
      for (const m of metricMatches) {
        if (!input.factIds || input.factIds.length === 0) {
          unsupportedClaims.push({
            text: m,
            reason: 'Metric cited without verified source fact in user profile.',
          });
        }
      }
    }

    // Deterministic safe suggestions citing facts
    const suggestions: ResumeReviewOutput['suggestions'] = [];
    const lines = input.resumeText.split('\n').filter(l => l.trim().length > 10);

    for (const line of lines.slice(0, 3)) {
      if (line.toLowerCase().includes('worked on') || line.toLowerCase().includes('helped with')) {
        suggestions.push({
          original: line.trim(),
          rewrite: `Engineered ${line.replace(/worked on|helped with/gi, '').trim()} adhering to modular REST patterns.`,
          sourceFactIds: input.factIds || ['fact-synthetic-1'],
          needsConfirmation: true,
        });
      }
    }

    return {
      mode: 'deterministic-fallback',
      matchedTerms,
      missingTerms,
      unsupportedClaims,
      suggestions,
      caveat: 'Generated using reviewed deterministic keyword and fact matching. Review all changes before using.',
    };
  }

  static evaluateInterviewAnswer(input: InterviewFeedbackInput): InterviewFeedbackOutput {
    InterviewFeedbackInputSchema.parse(input);

    const text = input.answerText.trim();
    const words = text.split(/\s+/).length;

    // Boundary abstention if answer is too brief or evasive
    if (words < 15) {
      return {
        abstained: true,
        mode: 'deterministic-fallback',
        strengths: [],
        gaps: ['Answer provides insufficient detail to evaluate technical structure.'],
        nextAction: 'Provide an answer with specific technical context (problem, approach, outcome).',
        citedCriteria: ['Minimum substantive depth'],
      };
    }

    const strengths: string[] = [];
    const gaps: string[] = [];
    const citedCriteria: string[] = [];

    // Check for structure (STAR method indicators)
    const hasSituation = /when|project|built|task|context|while/i.test(text);
    const hasAction = /implemented|created|wrote|designed|optimized|used/i.test(text);
    const hasResult = /result|learned|improved|resolved|success|outcome/i.test(text);

    if (hasSituation && hasAction) {
      strengths.push('Identified context and concrete technical actions taken.');
      citedCriteria.push('Structure: Action-oriented response');
    } else {
      gaps.push('Could be more direct about the specific action you personally owned.');
      citedCriteria.push('Structure: Personal ownership');
    }

    if (hasResult) {
      strengths.push('Included an explanation of the outcome or lesson learned.');
      citedCriteria.push('Evidence: Outcome reflection');
    } else {
      gaps.push('Did not explicitly state the final result or technical takeaway.');
      citedCriteria.push('Evidence: Measurable impact');
    }

    return {
      abstained: false,
      mode: 'deterministic-fallback',
      strengths,
      gaps,
      nextAction: 'Refine your answer by anchoring it with one verified takeaway from your project.',
      citedCriteria,
    };
  }
}
