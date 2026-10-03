import { z } from 'zod';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { evaluateInterviewAnswer as evaluateDeterministicInterview } from './interviewEvaluator';
import { SEED_INTERVIEW_QUESTIONS } from '../data/seedData';

// ----------------------------------------------------------------------------
// 1. Zod Schemas & Domain Types
// ----------------------------------------------------------------------------

export const RoleExplanationInputSchema = z.object({
  roleId: z.string(),
  roleName: z.string(),
  assessedAlignment: z.number().min(0).max(100).nullable(),
  coverage: z.number().min(0).max(1),
  evidence: z.array(
    z.object({
      skill: z.string(),
      observed: z.number().min(0).max(4).nullable(),
      target: z.number().min(1).max(4),
      source: z.string(),
    })
  ),
  gaps: z.array(
    z.object({
      skill: z.string(),
      gap: z.number(),
      importance: z.number(),
      prerequisiteOrder: z.number(),
    })
  ),
  timeBudgetHours: z.number().min(1).max(168),
  consent: z.literal(true),
});

export type RoleExplanationInput = z.infer<typeof RoleExplanationInputSchema>;

export const RoleExplanationOutputSchema = z.object({
  roleId: z.string(),
  whyItMayFit: z.array(z.string()).max(3),
  knownGaps: z.array(z.string()).max(3),
  unknowns: z.array(z.string()).max(2),
  firstAction: z.string().optional(),
  nextAction: z.string().optional(),
  confidence: z.enum(['high', 'medium', 'needs_more_evidence']),
  caveat: z.string(),
  abstained: z.boolean().default(false),
});

export type RoleExplanationOutput = z.infer<typeof RoleExplanationOutputSchema>;

export const ResumeReviewInputSchema = z.object({
  resumeText: z.string().min(10, 'Resume text must be at least 10 characters').max(10000),
  jobDescription: z.string().min(10, 'Job description must be at least 10 characters').max(5000),
  targetRoleId: z.union([z.string(), z.number()]).optional(),
  roleId: z.union([z.string(), z.number()]).optional(),
  roleName: z.string().optional(),
  factIds: z.array(z.string()).optional(),
  facts: z.array(z.any()).optional(),
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
      id: z.string().optional(),
      original: z.string(),
      rewrite: z.string(),
      sourceFactIds: z.array(z.string()),
      needsConfirmation: z.boolean(),
      explanation: z.string().optional(),
      note: z.string().optional(),
      confidence: z.enum(['high', 'medium', 'needs_more_evidence']).optional(),
      caveat: z.string().optional(),
    })
  ),
  confidence: z.enum(['high', 'medium', 'needs_more_evidence']).default('high'),
  caveat: z.string(),
  abstained: z.boolean().default(false),
});

export type ResumeReviewOutput = z.infer<typeof ResumeReviewOutputSchema>;

export const InterviewFeedbackInputSchema = z.object({
  questionId: z.string(),
  questionPrompt: z.string(),
  answerText: z.string().max(2500),
  rubricVersion: z.string().default('v1'),
  rubricKeys: z.array(z.string()).optional(),
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
  confidence: z.enum(['high', 'medium', 'needs_more_evidence']).default('high'),
  caveat: z.string().default('Practice feedback is not an interview decision.'),
});

export type InterviewFeedbackOutput = z.infer<typeof InterviewFeedbackOutputSchema>;

// Keyword alias mappings for reviewed terminology (backward compatible export)
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

// ----------------------------------------------------------------------------
// 2. Error Categories & Result Interfaces
// ----------------------------------------------------------------------------

export type AIErrorCode =
  | 'disabled'
  | 'timeout'
  | 'rate_limit_or_quota'
  | 'invalid_response_schema'
  | 'network_error'
  | 'client_error'
  | 'abstained';

export interface AIError {
  code: AIErrorCode;
  message: string;
  userNotice: string;
  canRetry: boolean;
}

export interface AIProviderMeta {
  provider: 'deterministic-fallback' | 'supabase-edge' | 'fake-test-provider';
  model: string;
  promptVersion: string;
  latencyMs?: number;
}

export interface AIResult<T> {
  data: T;
  error: AIError | null;
  providerMeta: AIProviderMeta;
  usedFallback: boolean;
}

export interface IAIProvider {
  readonly providerName: 'deterministic-fallback' | 'supabase-edge' | 'fake-test-provider';
  readonly modelName: string;
  explainRoleAlignment(input: RoleExplanationInput): Promise<AIResult<RoleExplanationOutput>>;
  suggestResumeReview(input: ResumeReviewInput): Promise<AIResult<ResumeReviewOutput>>;
  evaluateInterviewAnswer(input: InterviewFeedbackInput): Promise<AIResult<InterviewFeedbackOutput>>;
}

// ----------------------------------------------------------------------------
// 3. Deterministic Fallback Adapter (Default Provider)
// ----------------------------------------------------------------------------

export class DeterministicFallbackAdapter implements IAIProvider {
  readonly providerName = 'deterministic-fallback' as const;
  readonly modelName = 'local-rules-engine';
  readonly promptVersion = '2026-10-02.1';

  async explainRoleAlignment(input: RoleExplanationInput): Promise<AIResult<RoleExplanationOutput>> {
    RoleExplanationInputSchema.parse(input);

    const whyItMayFit: string[] = [];
    const knownGaps: string[] = [];
    const unknowns: string[] = [];

    // Analyze assessed evidence
    const assessedSkills = input.evidence.filter(e => e.observed !== null);
    const unassessedSkills = input.evidence.filter(e => e.observed === null);

    for (const e of assessedSkills.slice(0, 3)) {
      if (e.observed !== null && e.observed >= e.target) {
        whyItMayFit.push(`Demonstrated level ${e.observed} in ${e.skill} (meets target level ${e.target}).`);
      } else if (e.observed !== null && e.observed > 0) {
        whyItMayFit.push(`Foundational level ${e.observed} in ${e.skill}.`);
      }
    }

    if (whyItMayFit.length === 0) {
      whyItMayFit.push(`Aligns with your chosen target role (${input.roleName}).`);
    }

    // Identify top gaps by prerequisite order
    const sortedGaps = [...input.gaps].sort((a, b) => a.prerequisiteOrder - b.prerequisiteOrder);
    for (const g of sortedGaps.slice(0, 3)) {
      knownGaps.push(`Need level progression in ${g.skill} (prerequisite order ${g.prerequisiteOrder}).`);
    }

    // List unassessed skills as unknowns
    for (const u of unassessedSkills.slice(0, 2)) {
      unknowns.push(`${u.skill}: not assessed yet.`);
    }

    const firstAction =
      sortedGaps.length > 0
        ? `Focus ${Math.min(input.timeBudgetHours, 6)} hrs this week on foundational exercises for ${sortedGaps[0].skill}.`
        : `Continue regular practice with ${input.timeBudgetHours} hrs/week study budget.`;

    const data: RoleExplanationOutput = {
      roleId: input.roleId,
      whyItMayFit: whyItMayFit.slice(0, 3),
      knownGaps: knownGaps.slice(0, 3),
      unknowns: unknowns.slice(0, 2),
      firstAction,
      confidence: input.coverage >= 0.6 ? 'high' : 'needs_more_evidence',
      caveat: 'Guidance estimate only, not a placement guarantee. Grounded in deterministic assessment data.',
      abstained: false,
    };

    return {
      data,
      error: null,
      providerMeta: {
        provider: this.providerName,
        model: this.modelName,
        promptVersion: this.promptVersion,
        latencyMs: 1,
      },
      usedFallback: false,
    };
  }

  async suggestResumeReview(input: ResumeReviewInput): Promise<AIResult<ResumeReviewOutput>> {
    const data = DeterministicFallbackAdapter.reviewResume(input);
    return {
      data,
      error: null,
      providerMeta: {
        provider: this.providerName,
        model: this.modelName,
        promptVersion: this.promptVersion,
        latencyMs: 1,
      },
      usedFallback: false,
    };
  }

  async evaluateInterviewAnswer(input: InterviewFeedbackInput): Promise<AIResult<InterviewFeedbackOutput>> {
    const data = DeterministicFallbackAdapter.evaluateInterviewAnswer(input);
    return {
      data,
      error: null,
      providerMeta: {
        provider: this.providerName,
        model: this.modelName,
        promptVersion: this.promptVersion,
        latencyMs: 1,
      },
      usedFallback: false,
    };
  }

  // Static helpers for backwards compatibility
  static reviewResume(input: ResumeReviewInput): ResumeReviewOutput {
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

    const effectiveFactIds =
      input.factIds || (input.facts || []).map((f: { id?: string } | string) => (typeof f === 'string' ? f : f?.id)).filter(Boolean) as string[];

    // Heuristic detection of unsupported claims (e.g. invented metrics or inflated statements)
    const unsupportedClaims: Array<{ text: string; reason: string }> = [];
    const metricMatches = input.resumeText.match(/\b\d{1,3}%|\b\d+x\b|\$\d+/g);
    if (metricMatches) {
      for (const m of metricMatches) {
        if (!effectiveFactIds || effectiveFactIds.length === 0) {
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
          sourceFactIds: effectiveFactIds.length > 0 ? effectiveFactIds : ['fact-synthetic-1'],
          needsConfirmation: true,
          explanation: 'Replaced passive phrasing with active technical ownership grounded in project evidence.',
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
      confidence: unsupportedClaims.length === 0 ? 'high' : 'needs_more_evidence',
      abstained: false,
    };
  }

  static evaluateInterviewAnswer(input: InterviewFeedbackInput): InterviewFeedbackOutput {
    InterviewFeedbackInputSchema.parse(input);

    const text = input.answerText.trim();
    const words = text ? text.split(/\s+/).length : 0;

    // Boundary abstention if answer is too brief or evasive (< 15 words)
    if (words < 15) {
      return {
        abstained: true,
        mode: 'deterministic-fallback',
        strengths: [],
        gaps: ['Answer provides insufficient detail to evaluate technical structure.'],
        nextAction: 'Provide an answer with specific technical context (problem, approach, outcome).',
        citedCriteria: ['Minimum substantive depth'],
        confidence: 'needs_more_evidence',
        caveat: 'Practice feedback is not an interview decision.',
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

    const question =
      SEED_INTERVIEW_QUESTIONS.find(q => q.id === input.questionId) || {
        id: input.questionId,
        role_id: 1,
        type: 'behavioural' as const,
        prompt: input.questionPrompt,
        rubric_points: input.rubricKeys || ['context', 'contribution', 'decision', 'result_or_limitation', 'reflection'],
        version: input.rubricVersion || 'v1',
      };

    const res = evaluateDeterministicInterview(question, input.answerText);
    for (const s of res.strengths) {
      if (!strengths.includes(s)) strengths.push(s);
    }
    for (const m of res.missingPoints) {
      if (!gaps.includes(m)) gaps.push(m);
    }
    for (const c of res.criteriaResults) {
      citedCriteria.push(`${c.label}: ${c.met ? 'Met' : 'Unaddressed'}`);
    }

    return {
      abstained: false,
      mode: 'deterministic-fallback',
      strengths,
      gaps,
      nextAction: res.nextAction || 'Refine your answer by anchoring it with one verified takeaway from your project.',
      citedCriteria,
      confidence: res.percentage >= 60 ? 'high' : 'medium',
      caveat: res.caveat || 'Practice feedback is not an interview decision.',
    };
  }
}

// ----------------------------------------------------------------------------
// 4. Server-Side Edge Function AI Provider (With Timeout & Auto-Fallback)
// ----------------------------------------------------------------------------

export interface ServerFunctionConfig {
  timeoutMs?: number;
  maxRetries?: number;
}

export class ServerFunctionAIProvider implements IAIProvider {
  readonly providerName = 'supabase-edge' as const;
  readonly modelName = 'gemini-1.5-flash';
  readonly promptVersion = '2026-10-02.1';
  private timeoutMs: number;
  private maxRetries: number;
  private fallbackAdapter = new DeterministicFallbackAdapter();

  constructor(config: ServerFunctionConfig = {}) {
    this.timeoutMs = config.timeoutMs ?? 5000;
    this.maxRetries = config.maxRetries ?? 1;
  }

  private async invokeWithTimeout<T>(
    task: string,
    payload: Record<string, unknown>,
    schema: z.ZodSchema<T>
  ): Promise<{ data: T | null; error: AIError | null }> {
    // If Supabase is unconfigured, return disabled immediately
    if (!supabase || !isSupabaseConfigured()) {
      return {
        data: null,
        error: {
          code: 'disabled',
          message: 'Supabase functions unconfigured. Defaulting to deterministic mode.',
          userNotice: 'AI server boundary is offline or unconfigured. Pure deterministic mode is active.',
          canRetry: false,
        },
      };
    }

    let attempt = 0;
    while (attempt <= this.maxRetries) {
      attempt++;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

        const { data: responseData, error: functionError } = await supabase.functions.invoke('ai-assistant', {
          body: { task, payload, consent: true },
        });

        clearTimeout(timeoutId);

        if (functionError) {
          if (functionError.message?.includes('429') || functionError.message?.includes('quota')) {
            return {
              data: null,
              error: {
                code: 'rate_limit_or_quota',
                message: functionError.message,
                userNotice: 'AI provider is temporarily over quota. Switched to deterministic checklist mode.',
                canRetry: true,
              },
            };
          }
          if (functionError.message?.includes('disabled')) {
            return {
              data: null,
              error: {
                code: 'disabled',
                message: functionError.message,
                userNotice: 'AI provider is currently disabled. Switched to deterministic mode.',
                canRetry: false,
              },
            };
          }
          return {
            data: null,
            error: {
              code: 'network_error',
              message: functionError.message,
              userNotice: 'Server connection failed. Switched to deterministic checklist mode.',
              canRetry: true,
            },
          };
        }

        // Validate server response with Zod
        const parsed = schema.safeParse(responseData?.data || responseData);
        if (!parsed.success) {
          return {
            data: null,
            error: {
              code: 'invalid_response_schema',
              message: parsed.error.message,
              userNotice: 'AI response failed schema validation. Used deterministic verification instead.',
              canRetry: true,
            },
          };
        }

        return { data: parsed.data, error: null };
      } catch (err: unknown) {
        const isAbort = (err as { name?: string })?.name === 'AbortError';
        if (isAbort) {
          return {
            data: null,
            error: {
              code: 'timeout',
              message: `AI request exceeded ${this.timeoutMs}ms timeout limit.`,
              userNotice: 'AI request timed out. Used deterministic verification to keep your workflow fast.',
              canRetry: true,
            },
          };
        }

        if (attempt > this.maxRetries) {
          return {
            data: null,
            error: {
              code: 'network_error',
              message: String(err),
              userNotice: 'Network error communicating with AI server. Used deterministic fallback.',
              canRetry: true,
            },
          };
        }
      }
    }

    return {
      data: null,
      error: {
        code: 'network_error',
        message: 'Max retries exhausted',
        userNotice: 'AI service unavailable after retries. Switched to deterministic mode.',
        canRetry: true,
      },
    };
  }

  async explainRoleAlignment(input: RoleExplanationInput): Promise<AIResult<RoleExplanationOutput>> {
    const { data, error } = await this.invokeWithTimeout('role-explanation', input, RoleExplanationOutputSchema);
    if (error || !data) {
      const fallback = await this.fallbackAdapter.explainRoleAlignment(input);
      return {
        data: fallback.data,
        error,
        providerMeta: {
          provider: this.providerName,
          model: this.modelName,
          promptVersion: this.promptVersion,
        },
        usedFallback: true,
      };
    }

    return {
      data,
      error: null,
      providerMeta: {
        provider: this.providerName,
        model: this.modelName,
        promptVersion: this.promptVersion,
      },
      usedFallback: false,
    };
  }

  async suggestResumeReview(input: ResumeReviewInput): Promise<AIResult<ResumeReviewOutput>> {
    const { data, error } = await this.invokeWithTimeout('resume-review', input, ResumeReviewOutputSchema);
    if (error || !data) {
      const fallback = await this.fallbackAdapter.suggestResumeReview(input);
      return {
        data: fallback.data,
        error,
        providerMeta: {
          provider: this.providerName,
          model: this.modelName,
          promptVersion: this.promptVersion,
        },
        usedFallback: true,
      };
    }

    return {
      data,
      error: null,
      providerMeta: {
        provider: this.providerName,
        model: this.modelName,
        promptVersion: this.promptVersion,
      },
      usedFallback: false,
    };
  }

  async evaluateInterviewAnswer(input: InterviewFeedbackInput): Promise<AIResult<InterviewFeedbackOutput>> {
    const { data, error } = await this.invokeWithTimeout('interview-feedback', input, InterviewFeedbackOutputSchema);
    if (error || !data) {
      const fallback = await this.fallbackAdapter.evaluateInterviewAnswer(input);
      return {
        data: fallback.data,
        error,
        providerMeta: {
          provider: this.providerName,
          model: this.modelName,
          promptVersion: this.promptVersion,
        },
        usedFallback: true,
      };
    }

    return {
      data,
      error: null,
      providerMeta: {
        provider: this.providerName,
        model: this.modelName,
        promptVersion: this.promptVersion,
      },
      usedFallback: false,
    };
  }
}

// ----------------------------------------------------------------------------
// 5. Fake Test AI Provider (For Vitest edge-case testing)
// ----------------------------------------------------------------------------

export class FakeTestAIProvider implements IAIProvider {
  readonly providerName = 'fake-test-provider' as const;
  readonly modelName = 'fake-gemini-test';
  readonly promptVersion = '2026-10-02.test';
  private fallbackAdapter = new DeterministicFallbackAdapter();

  public simulateTimeout = false;
  public simulateQuota = false;
  public simulateInvalidJson = false;
  public simulateDisabled = false;
  public customResumeReview?: ResumeReviewOutput;
  public customRoleExplanation?: RoleExplanationOutput;
  public customInterviewFeedback?: InterviewFeedbackOutput;

  constructor(options?: {
    simulateTimeout?: boolean;
    simulateQuota?: boolean;
    simulateInvalidJson?: boolean;
    simulateDisabled?: boolean;
    customResumeReview?: ResumeReviewOutput;
    customRoleExplanation?: RoleExplanationOutput;
    customInterviewFeedback?: InterviewFeedbackOutput;
  }) {
    if (options) {
      this.simulateTimeout = Boolean(options.simulateTimeout);
      this.simulateQuota = Boolean(options.simulateQuota);
      this.simulateInvalidJson = Boolean(options.simulateInvalidJson);
      this.simulateDisabled = Boolean(options.simulateDisabled);
      this.customResumeReview = options.customResumeReview;
      this.customRoleExplanation = options.customRoleExplanation;
      this.customInterviewFeedback = options.customInterviewFeedback;
    }
  }

  async explainRoleAlignment(input: RoleExplanationInput): Promise<AIResult<RoleExplanationOutput>> {
    const simulatedError = this.checkSimulatedErrors();
    if (simulatedError) {
      const fallback = await this.fallbackAdapter.explainRoleAlignment(input);
      return {
        data: fallback.data,
        error: simulatedError,
        providerMeta: { provider: this.providerName, model: this.modelName, promptVersion: this.promptVersion },
        usedFallback: true,
      };
    }

    if (this.customRoleExplanation) {
      return {
        data: this.customRoleExplanation,
        error: null,
        providerMeta: { provider: this.providerName, model: this.modelName, promptVersion: this.promptVersion },
        usedFallback: false,
      };
    }

    const fallback = await this.fallbackAdapter.explainRoleAlignment(input);
    return {
      data: {
        ...fallback.data,
        whyItMayFit: ['[AI] Candidate demonstrated key backend principles.'],
      },
      error: null,
      providerMeta: { provider: this.providerName, model: this.modelName, promptVersion: this.promptVersion },
      usedFallback: false,
    };
  }

  async suggestResumeReview(input: ResumeReviewInput): Promise<AIResult<ResumeReviewOutput>> {
    const simulatedError = this.checkSimulatedErrors();
    if (simulatedError) {
      const fallback = await this.fallbackAdapter.suggestResumeReview(input);
      return {
        data: fallback.data,
        error: simulatedError,
        providerMeta: { provider: this.providerName, model: this.modelName, promptVersion: this.promptVersion },
        usedFallback: true,
      };
    }

    if (this.customResumeReview) {
      return {
        data: this.customResumeReview,
        error: null,
        providerMeta: { provider: this.providerName, model: this.modelName, promptVersion: this.promptVersion },
        usedFallback: false,
      };
    }

    const fallback = await this.fallbackAdapter.suggestResumeReview(input);
    return {
      data: {
        ...fallback.data,
        mode: 'ai',
        caveat: 'AI suggestion — review before using. Never invent unverified claims.',
      },
      error: null,
      providerMeta: { provider: this.providerName, model: this.modelName, promptVersion: this.promptVersion },
      usedFallback: false,
    };
  }

  async evaluateInterviewAnswer(input: InterviewFeedbackInput): Promise<AIResult<InterviewFeedbackOutput>> {
    const simulatedError = this.checkSimulatedErrors();
    if (simulatedError) {
      const fallback = await this.fallbackAdapter.evaluateInterviewAnswer(input);
      return {
        data: fallback.data,
        error: simulatedError,
        providerMeta: { provider: this.providerName, model: this.modelName, promptVersion: this.promptVersion },
        usedFallback: true,
      };
    }

    if (this.customInterviewFeedback) {
      return {
        data: this.customInterviewFeedback,
        error: null,
        providerMeta: { provider: this.providerName, model: this.modelName, promptVersion: this.promptVersion },
        usedFallback: false,
      };
    }

    const fallback = await this.fallbackAdapter.evaluateInterviewAnswer(input);
    return {
      data: {
        ...fallback.data,
        mode: 'ai',
        caveat: 'Practice feedback is not an interview decision.',
      },
      error: null,
      providerMeta: { provider: this.providerName, model: this.modelName, promptVersion: this.promptVersion },
      usedFallback: false,
    };
  }

  private checkSimulatedErrors(): AIError | null {
    if (this.simulateDisabled) {
      return {
        code: 'disabled',
        message: 'AI provider is disabled via configuration.',
        userNotice: 'AI provider is disabled. Deterministic mode active.',
        canRetry: false,
      };
    }
    if (this.simulateTimeout) {
      return {
        code: 'timeout',
        message: 'Simulated network timeout exceeded 5000ms limit.',
        userNotice: 'AI request timed out. Used deterministic verification to keep your workflow fast.',
        canRetry: true,
      };
    }
    if (this.simulateQuota) {
      return {
        code: 'rate_limit_or_quota',
        message: 'Simulated 429 quota exhaustion.',
        userNotice: 'AI provider is temporarily over quota. Switched to deterministic checklist mode.',
        canRetry: true,
      };
    }
    if (this.simulateInvalidJson) {
      return {
        code: 'invalid_response_schema',
        message: 'Simulated invalid JSON response schema.',
        userNotice: 'AI response failed schema validation. Used deterministic verification instead.',
        canRetry: true,
      };
    }
    return null;
  }
}

// ----------------------------------------------------------------------------
// 6. Provider Manager & Active Instance Accessor
// ----------------------------------------------------------------------------

let activeAIProvider: IAIProvider | null = null;

export function getAIProvider(): IAIProvider {
  if (activeAIProvider) {
    return activeAIProvider;
  }
  if (isSupabaseConfigured()) {
    return new ServerFunctionAIProvider();
  }
  return new DeterministicFallbackAdapter();
}

export function setAIProviderForTesting(provider: IAIProvider | null): void {
  activeAIProvider = provider;
}

export function resetAIProvider(): void {
  activeAIProvider = null;
}
