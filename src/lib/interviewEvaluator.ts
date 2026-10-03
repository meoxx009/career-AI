import type {
  InterviewQuestion,
  InterviewFeedbackResult,
  RubricCheckItem,
} from '../types';
import rawExpandedQuestions from '../../data/interview-questions.json';

export const EXPANDED_INTERVIEW_QUESTIONS: InterviewQuestion[] =
  rawExpandedQuestions as InterviewQuestion[];

/**
 * Question Context metadata providing candidates with the engineering purpose
 * behind each interview question.
 */
export interface QuestionContextMeta {
  purpose: string;
  interviewerListeningFor: string[];
  keyPitfalls: string[];
}

export const QUESTION_CONTEXTS: Record<string, QuestionContextMeta> = {
  ib01: {
    purpose: 'Evaluates problem decomposition, personal ownership in real projects, and self-awareness beyond team or tutorial work.',
    interviewerListeningFor: [
      'Specific technical obstacles faced rather than generic descriptions',
      'Clear personal code and debugging contributions',
      'Objective rationale for the technical approach chosen',
      'Realistic results or constraints, followed by honest engineering takeaways',
    ],
    keyPitfalls: [
      'Speaking solely in "we" without specifying your personal code',
      'Claiming 100% perfection without mentioning trade-offs or constraints',
      'Omitting what you learned or would do differently',
    ],
  },
  ib02: {
    purpose: 'Assesses REST architectural principles, requirement clarification instincts, and API contract design prior to coding.',
    interviewerListeningFor: [
      'Asking clarifying questions regarding scale, auth, or requirements first',
      'Resource-oriented naming with proper plural nouns and standard HTTP verbs',
      'Input validation rules and structured error responses (4xx/5xx)',
      'Practical trade-offs such as pagination, data consistency, or soft deletes',
    ],
    keyPitfalls: [
      'Jumping into writing endpoints without clarifying requirements',
      'Using verbs in URLs (e.g. /getTasks, /deleteTask) instead of standard HTTP methods',
      'Ignoring error states, payload validation, or pagination',
    ],
  },
  if01: {
    purpose: 'Evaluates user empathy, openness to constructive critique, and willingness to iterate based on real feedback.',
    interviewerListeningFor: [
      'Concrete description of the initial UI state or component',
      'Feedback source (user testing, peer review, accessibility audit) and specific issue',
      'Direct frontend code and design modifications implemented',
      'Measurable outcome or improved usability, with a lesson on user assumptions',
    ],
    keyPitfalls: [
      'Being defensive about initial designs',
      'Vague descriptions of what actually changed in the code',
      'Not verifying whether the change actually solved the user problem',
    ],
  },
  if02: {
    purpose: 'Evaluates frontend accessibility fundamentals (WCAG), responsive mobile design, keyboard navigation, and touch-target sizing.',
    interviewerListeningFor: [
      'Semantic HTML with explicit <label for="id"> associations',
      'Visible focus states (:focus-visible) and logical keyboard tab order',
      'Screen-reader accessible error announcements (aria-describedby, aria-invalid)',
      'Single-column responsive layouts with minimum 44×44px touch targets',
      'Testing with screen readers, keyboard-only navigation, or viewport throttling',
    ],
    keyPitfalls: [
      'Using placeholders instead of persistent <label> elements',
      'Relying solely on color to convey error states',
      'Ignoring keyboard focus or removing outline without a visible replacement',
    ],
  },
  id01: {
    purpose: 'Evaluates analytical skepticism, methodological rigor, and intellectual honesty when data disproves initial assumptions.',
    interviewerListeningFor: [
      'Initial hypothesis or business question clearly stated',
      'Systematic data verification or sanity check that revealed anomalies',
      'Explicit correction made to the SQL query, filter, or calculation logic',
      'Verified revised findings and acknowledgement of data limitations',
    ],
    keyPitfalls: [
      'Forcing data to fit a preconceived narrative',
      'Failing to verify distributions, null rates, or duplicate rows',
      'Omitting sample-size or data recency limitations',
    ],
  },
  id02: {
    purpose: 'Evaluates exploratory data analysis (EDA) rigor, missingness mechanism understanding (MCAR/MAR), and disciplined imputation.',
    interviewerListeningFor: [
      'Investigating what null actually signifies in the business domain',
      'Quantifying missing rates per column and identifying pattern correlations',
      'Justifying treatment (drop vs median/mode imputation vs categorical indicator)',
      'Checking post-treatment distribution distortion or skewness',
      'Disclosing missingness or imputation in chart captions or footnotes',
    ],
    keyPitfalls: [
      'Blindly dropping all null rows without checking impact',
      'Naive mean-imputation on skewed distributions without justification',
      'Presenting visualizations without disclosing missing data rates',
    ],
  },
};

/**
 * Returns structured question context (purpose, listening points, pitfalls).
 */
export function getQuestionContext(question: InterviewQuestion): QuestionContextMeta {
  if (question.purpose && question.interviewerListeningFor && question.keyPitfalls) {
    return {
      purpose: question.purpose,
      interviewerListeningFor: question.interviewerListeningFor,
      keyPitfalls: question.keyPitfalls,
    };
  }
  if (QUESTION_CONTEXTS[question.id]) {
    return QUESTION_CONTEXTS[question.id];
  }
  return {
    purpose: 'Evaluates structured problem decomposition, technical communication, and trade-off evaluation.',
    interviewerListeningFor: [
      'Concrete technical obstacles and personal code/design contributions',
      'Clear engineering decisions grounded in trade-offs',
      'Realistic results and verification',
    ],
    keyPitfalls: [
      'Vague descriptions without technical specifics',
      'Inventing unverifiable metrics',
    ],
  };
}

/**
 * Returns all interview questions for a given role ID.
 * If no specific questions are reviewed yet, returns a safe fallback question pair
 * with explicit fallback indicators.
 */
export function getQuestionsForRole(roleId: number, roleTitle = 'Engineering Role'): InterviewQuestion[] {
  let matching = EXPANDED_INTERVIEW_QUESTIONS.filter((q) => q.role_id === roleId);

  // Roles 21 (LLM Application Engineer) and 22 (RAG Engineer) share the RAG/LLM questions
  if (roleId === 21 || roleId === 22) {
    matching = EXPANDED_INTERVIEW_QUESTIONS.filter((q) => q.role_id === 21 || q.role_id === 22);
  }

  if (matching.length > 0) {
    return matching;
  }

  // Safe fallback question pair with clear indicator
  return [
    {
      id: `fallback_b_${roleId}`,
      role_id: roleId,
      type: 'behavioural',
      prompt: `Tell me about a technical project problem you solved related to ${roleTitle}. What was your personal contribution, how did you verify the solution, and what did you learn?`,
      rubric_points: ['context', 'contribution', 'decision', 'result_or_limitation', 'reflection'],
      version: 'v2.0-fallback',
      purpose: `Evaluates problem decomposition, technical ownership, and engineering takeaways in ${roleTitle}.`,
      interviewerListeningFor: [
        'Specific technical obstacles faced rather than generic descriptions',
        'Clear personal code, testing, or architectural contributions',
        'Objective rationale for the technical approach chosen',
        'Realistic results or constraints, followed by honest engineering takeaways',
      ],
      keyPitfalls: [
        'Speaking solely in "we" without specifying your personal technical action',
        'Claiming 100% perfection without mentioning trade-offs or constraints',
        'Omitting what you learned or would do differently',
      ],
      isFallback: true,
    },
    {
      id: `fallback_t_${roleId}`,
      role_id: roleId,
      type: 'technical',
      prompt: `Walk me through how you would architect and test a reliable component or workflow for ${roleTitle}. What requirements, constraints, and trade-offs would you evaluate first?`,
      rubric_points: ['clarifying_questions', 'problem_framing', 'decision', 'safety_limitations', 'testing'],
      version: 'v2.0-fallback',
      purpose: `Assesses systematic architecture design, requirement clarification, and trade-off evaluation in ${roleTitle}.`,
      interviewerListeningFor: [
        'Asking clarifying questions regarding scale, auth, or requirements first',
        'Resource and architecture modeling with clear separation of concerns',
        'Validation rules, error handling, and trade-offs',
        'Testing strategy covering happy paths and failure modes',
      ],
      keyPitfalls: [
        'Jumping into implementation details without clarifying requirements',
        'Ignoring failure modes, latency, or error states',
        'Failing to mention automated verification or testing',
      ],
      isFallback: true,
    },
  ];
}

/**
 * Human-readable Rubric Point Definitions per question.
 */
interface RubricCriterionMeta {
  label: string;
  description: string;
  guidance: string;
  detector: (text: string, lower: string) => { met: boolean; quote?: string };
}

/**
 * Universal rubric criteria detectors covering standard engineering,
 * AI/ML, Generative AI, LLM/RAG, ECE, UX, and QA topics.
 */
export const UNIVERSAL_RUBRIC_DETECTORS: Record<string, RubricCriterionMeta> = {
  context: {
    label: 'Specific Technical Context',
    description: 'Identifies the project, system component, or technical bug being addressed.',
    guidance: 'Name the specific feature, repository, or bug (e.g. "corrupted JSON loading in CLI", "slow SQL join query").',
    detector: (text, lower) => {
      const matches = text.match(/(?:in my|when working on|while developing|during|in a|project|feature|bug|issue|task)\s+([^.]{10,80})/i);
      const hasContext = /(?:project|application|service|database|api|cli|module|endpoint|frontend|backend|pipeline|table|model|system)/i.test(lower);
      return {
        met: Boolean(hasContext && (matches || lower.length > 25)),
        quote: matches ? matches[0].trim() : undefined,
      };
    },
  },
  contribution: {
    label: 'Personal Technical Contribution',
    description: 'Specifies what code, tests, scripts, or architectures you personally authored.',
    guidance: 'Use active first-person technical verbs: "I implemented", "I wrote unit tests", "I refactored".',
    detector: (text, lower) => {
      const matches = text.match(/\b(?:I implemented|I wrote|I built|I refactored|I designed|I created|I added|I debugged|I optimized|I analyzed|I inspected|I instrumented|I deployed|I calibrated|my contribution was)\s+([^.]{10,80})/i);
      const hasPersonalAction = /\b(?:I implemented|I wrote|I built|I created|I added|I debugged|I fixed|I isolated|I tested|I designed|I refactored|I analyzed|I inspected|I instrumented|I deployed|I calibrated|I re-framed|I reframed)\b/i.test(lower);
      return {
        met: hasPersonalAction,
        quote: matches ? matches[0].trim() : undefined,
      };
    },
  },
  decision: {
    label: 'Technical Decision & Rationale',
    description: 'Explains why a specific technical approach was chosen over alternatives.',
    guidance: 'Detail why you chose your solution (e.g. "chose error handling middleware to avoid unhandled rejections", "used indexing over subqueries").',
    detector: (text, lower) => {
      const matches = text.match(/\b(?:because|in order to|chose to|decided to|instead of|rather than|to prevent|to ensure|approach was)\s+([^.]{10,80})/i);
      const hasDecision = /(?:because|in order to|decided to|chose to|instead of|to ensure|to prevent|approach|trade-off|rationale)/i.test(lower);
      return {
        met: hasDecision,
        quote: matches ? matches[0].trim() : undefined,
      };
    },
  },
  result_or_limitation: {
    label: 'Concrete Result or Constraint',
    description: 'Mentions the verifiable outcome or an engineering limitation/trade-off.',
    guidance: 'State the resolution (e.g. "tests passed with clean error exit", "prevented server crash"), without inventing fake metrics.',
    detector: (text, lower) => {
      const matches = text.match(/\b(?:as a result|resolved the|tests passed|prevented|successfully|outcome was|limitation|handled)\s+([^.]{10,80})/i);
      const hasOutcome = /(?:result|resolved|fixed|prevented|passed|improved|success|outcome|handled|limitation|constraint)/i.test(lower);
      return {
        met: hasOutcome,
        quote: matches ? matches[0].trim() : undefined,
      };
    },
  },
  reflection: {
    label: 'Engineering Reflection / Takeaway',
    description: 'Shares an honest insight, lesson learned, or what you would do differently.',
    guidance: 'Conclude with what this taught you about engineering habits (e.g. "taught me the value of unit testing edge cases early").',
    detector: (text, lower) => {
      const matches = text.match(/\b(?:learned that|taught me|in hindsight|next time|takeaway was|would do differently|reinforced)\s+([^.]{10,80})/i);
      const hasReflection = /(?:learned|taught me|takeaway|reflecting|in the future|in hindsight|better practice|habit|reinforced|reinforce)/i.test(lower);
      return {
        met: hasReflection,
        quote: matches ? matches[0].trim() : undefined,
      };
    },
  },
  clarifying_questions: {
    label: 'Clarifying Requirements First',
    description: 'Asks or clarifies scope, authentication, expected scale, or user permissions before designing.',
    guidance: 'Mention clarifying questions: e.g. "First, I would clarify authentication requirements, user roles, and expected volume."',
    detector: (text, lower) => {
      const matches = text.match(/\b(?:clarify|first ask|questions? to ask|before designing|assumptions?|requirements?)\s+([^.]{10,80})/i);
      const hasClarify = /(?:clarif|first ask|before designing|requirements|scope|auth|user roles|scale)/i.test(lower);
      return {
        met: hasClarify,
        quote: matches ? matches[0].trim() : undefined,
      };
    },
  },
  problem_framing: {
    label: 'Problem Framing & System Boundary',
    description: 'Frames the engineering problem, defines input/output boundaries, and identifies constraints.',
    guidance: 'Define the system goal, inputs, expected outputs, and scope before jumping to solution details.',
    detector: (text, lower) => {
      const match = text.match(/\b(?:problem is|goal is|objective is|framing|scope|requirements?|input(?:s)? and output(?:s)?|constraints?|use case)\s+([^.]{10,80})/i);
      const met = /(?:problem|goal|scope|requirements|objective|constraints|input|output|use case|framing|boundary)/i.test(lower);
      return { met, quote: match ? match[0].trim() : undefined };
    },
  },
  data_quality: {
    label: 'Data Quality & Distribution',
    description: 'Considers data cleaning, distribution auditing, class imbalance, or ground-truth verification.',
    guidance: 'Discuss data preprocessing, outlier/missingness checks, validation sets, or class distribution.',
    detector: (text, lower) => {
      const match = text.match(/\b(?:data quality|distribution|imbalance|preprocessing|ground truth|validation set|cleaning|duplicate)\s+([^.]{10,80})/i);
      const met = /(?:data quality|distribution|imbalance|clean|ground truth|dataset|outlier|imputation|sampling|split)/i.test(lower);
      return { met, quote: match ? match[0].trim() : undefined };
    },
  },
  model_selection: {
    label: 'Model / Approach Selection',
    description: 'Justifies the choice of architecture, baseline, or algorithmic approach over alternatives.',
    guidance: 'Explain why you chose this model or approach over simpler baselines or alternatives.',
    detector: (text, lower) => {
      const match = text.match(/\b(?:chose|selected|architecture|model|approach|baseline|algorithm|instead of|compared to)\s+([^.]{10,80})/i);
      const met = /(?:chose|selected|model|approach|baseline|architecture|algorithm|transformer|embedding|classifier|regression)/i.test(lower);
      return { met, quote: match ? match[0].trim() : undefined };
    },
  },
  evaluation: {
    label: 'Evaluation & Benchmarking',
    description: 'Uses quantitative evaluation metrics (e.g. F1, Recall, Precision, accuracy, semantic similarity) on held-out test sets.',
    guidance: 'Cite specific evaluation metrics (precision, recall, F1, exact match, loss) on a test benchmark.',
    detector: (text, lower) => {
      const match = text.match(/\b(?:evaluat|metric|recall|precision|f1|accuracy|benchmark|loss|score|test set)\s+([^.]{10,80})/i);
      const met = /(?:evaluat|metric|recall|precision|f1|accuracy|benchmark|loss|bleu|rouge|ragas|trulens|test set|held-out)/i.test(lower);
      return { met, quote: match ? match[0].trim() : undefined };
    },
  },
  error_analysis: {
    label: 'Error Analysis & Edge Cases',
    description: 'Systematically examines failure modes, false positives/negatives, or hallucination edge cases.',
    guidance: 'Analyze specific failure modes, edge cases, false positive rates, or systematic hallucinations.',
    detector: (text, lower) => {
      const match = text.match(/\b(?:error analysis|failure mode|edge case|false positive|hallucinat|drift|degrad|mismatch)\s+([^.]{10,80})/i);
      const met = /(?:error analysis|failure mode|edge case|false positive|false negative|hallucinat|drift|degrad|breakdown|confusion matrix)/i.test(lower);
      return { met, quote: match ? match[0].trim() : undefined };
    },
  },
  reproducibility: {
    label: 'Reproducibility & Versioning',
    description: 'Ensures experiments, prompts, seeds, or datasets are deterministic and version-controlled.',
    guidance: 'Mention random seeds, temperature settings, prompt versioning, or reproducible test fixtures.',
    detector: (text, lower) => {
      const match = text.match(/\b(?:reproducib|version|seed|deterministic|golden set|checkpoint|artifact|git)\s+([^.]{10,80})/i);
      const met = /(?:reproducib|version|seed|deterministic|golden set|fixture|checkpoint|artifact|logged)/i.test(lower);
      return { met, quote: match ? match[0].trim() : undefined };
    },
  },
  safety_limitations: {
    label: 'Safety, Guardrails & Limitations',
    description: 'Implements guardrails against prompt injection, toxic outputs, or unsafe fallbacks.',
    guidance: 'Describe safety guardrails (e.g. input sanitization, injection defense, content filtering, fallback paths).',
    detector: (text, lower) => {
      const match = text.match(/\b(?:safety|guardrail|limitation|prompt injection|defense|fallback|sanitiz|toxic|refusal)\s+([^.]{10,80})/i);
      const met = /(?:safety|guardrail|limitation|injection|defense|fallback|sanitiz|filter|adversarial|constraint|boundary)/i.test(lower);
      return { met, quote: match ? match[0].trim() : undefined };
    },
  },
  latency_cost: {
    label: 'Latency & Cost Trade-Offs',
    description: 'Evaluates inference latency, token expenditure, caching, or compute budget trade-offs.',
    guidance: 'Discuss latency budgets (ms/p95), token costs, caching strategies, or small vs large model trade-offs.',
    detector: (text, lower) => {
      const match = text.match(/\b(?:latency|cost|token|budget|throughput|cache|caching|trade-off|overhead)\s+([^.]{10,80})/i);
      const met = /(?:latency|cost|token|budget|throughput|cache|caching|trade-off|overhead|p95|ms\b|pruning)/i.test(lower);
      return { met, quote: match ? match[0].trim() : undefined };
    },
  },
  retrieval_evaluation: {
    label: 'Retrieval Evaluation & RAG Quality',
    description: 'Evaluates chunking strategy, vector search precision/recall, context relevance, or reranking.',
    guidance: 'Detail chunk size/overlap, embedding model, vector indexing, hybrid search, or context relevance scoring.',
    detector: (text, lower) => {
      const match = text.match(/\b(?:retriev|chunk|embedding|vector|similarity|rerank|rag|context relevance|hybrid search)\s+([^.]{10,80})/i);
      const met = /(?:retriev|chunk|embedding|vector|similarity|rerank|rag|context relevance|hybrid search|top-k|hit rate)/i.test(lower);
      return { met, quote: match ? match[0].trim() : undefined };
    },
  },
  prompt_testing: {
    label: 'Prompt Engineering & Version Testing',
    description: 'Applies structured prompt iterations, role segregation, few-shot examples, and regression testing.',
    guidance: 'Explain prompt structure (system/user separation, few-shot reasoning, schema constraints, temperature 0).',
    detector: (text, lower) => {
      const match = text.match(/\b(?:prompt|few-shot|system prompt|temperature|schema|json mode|instruction|testing)\s+([^.]{10,80})/i);
      const met = /(?:prompt|few-shot|system prompt|temperature|schema|json mode|instruction|testing|iteration|diff)/i.test(lower);
      return { met, quote: match ? match[0].trim() : undefined };
    },
  },
  debugging_approach: {
    label: 'Structured Debugging & Root Cause',
    description: 'Uses instrumentation tools (oscilloscope, breakpoints, logs) to isolate hardware/firmware timing anomalies.',
    guidance: 'Detail your diagnostic method: logic analyzer, oscilloscope, hardware breakpoints, or state machine isolation.',
    detector: (text, lower) => {
      const match = text.match(/\b(?:debug|oscilloscope|logic analyzer|isolate|root cause|instrument|breakpoint|timing)\s+([^.]{10,80})/i);
      const met = /(?:debug|oscilloscope|logic analyzer|isolate|root cause|instrument|breakpoint|timing|jitter|bounce|signal)/i.test(lower);
      return { met, quote: match ? match[0].trim() : undefined };
    },
  },
  resource_constraints: {
    label: 'Resource & Hardware Constraints',
    description: 'Considers microcontroller memory limits (SRAM/Flash), CPU cycles, and low-power sleep modes.',
    guidance: 'Address memory layout, SRAM conservation, peripheral duty cycles, and power consumption.',
    detector: (text, lower) => {
      const match = text.match(/\b(?:memory|sram|flash|power|consumption|constraint|resource|clock|sleep mode)\s+([^.]{10,80})/i);
      const met = /(?:memory|sram|flash|power|consumption|constraint|resource|clock|sleep mode|dma|register|byte)/i.test(lower);
      return { met, quote: match ? match[0].trim() : undefined };
    },
  },
  non_blocking_architecture: {
    label: 'Non-Blocking Execution Architecture',
    description: 'Avoids busy-waits and delays using state machines, interrupt flags, DMA, or ring buffers.',
    guidance: 'Explain how you avoid blocking delays: interrupt service routines, ring buffers, DMA, or event loops.',
    detector: (text, lower) => {
      const match = text.match(/\b(?:non-blocking|state machine|interrupt|isr|ring buffer|dma|event loop|async)\s+([^.]{10,80})/i);
      const met = /(?:non-blocking|state machine|interrupt|isr|ring buffer|dma|event loop|timer|asynchronous|polling)/i.test(lower);
      return { met, quote: match ? match[0].trim() : undefined };
    },
  },
  user_research: {
    label: 'User Research & Discovery',
    description: 'Gathers qualitative user insights through interviews, usability testing, or heuristic evaluations.',
    guidance: 'Discuss usability testing findings, user confusion observations, or interviews that challenged assumptions.',
    detector: (text, lower) => {
      const match = text.match(/\b(?:user research|usability test|interview|feedback|critique|participant|observation)\s+([^.]{10,80})/i);
      const met = /(?:user research|usability test|interview|feedback|critique|participant|observation|user journey|persona)/i.test(lower);
      return { met, quote: match ? match[0].trim() : undefined };
    },
  },
  design_iteration: {
    label: 'Design Iteration & Structural Rework',
    description: 'Refactors UI layout, visual hierarchy, or interaction affordances based on discovered friction.',
    guidance: 'Explain specific UI changes made: visual hierarchy, simplified form layout, progressive disclosure.',
    detector: (text, lower) => {
      const match = text.match(/\b(?:redesign|iterat|hierarchy|layout|refactor|wireframe|prototype|affordance)\s+([^.]{10,80})/i);
      const met = /(?:redesign|iterat|hierarchy|layout|refactor|wireframe|prototype|affordance|simplified|component)/i.test(lower);
      return { met, quote: match ? match[0].trim() : undefined };
    },
  },
  usability_validation: {
    label: 'Usability Validation & Outcomes',
    description: 'Verifies the revised interface improved user completion rates or reduced interaction friction.',
    guidance: 'Confirm whether the revision succeeded: task success rate, reduced drop-off, or peer critique validation.',
    detector: (text, lower) => {
      const match = text.match(/\b(?:validation|success rate|completion|improved|friction|drop-off|confirmed)\s+([^.]{10,80})/i);
      const met = /(?:validation|success rate|completion|improved|friction|drop-off|confirmed|verified|easier)/i.test(lower);
      return { met, quote: match ? match[0].trim() : undefined };
    },
  },
  wcag_accessibility: {
    label: 'WCAG Accessibility Standards',
    description: 'Adheres to WCAG 2.1 AA contrast ratios, keyboard navigation, visible focus, and screen reader labels.',
    guidance: 'Mention color contrast ratios (4.5:1), keyboard tab sequence, focus-visible indicators, and screen reader labels.',
    detector: (text, lower) => {
      const match = text.match(/\b(?:wcag|contrast|accessibility|a11y|screen reader|aria|focus-visible|keyboard)\s+([^.]{10,80})/i);
      const met = /(?:wcag|contrast|accessibility|a11y|screen reader|aria|focus-visible|keyboard|color ratio)/i.test(lower);
      return { met, quote: match ? match[0].trim() : undefined };
    },
  },
  design_tokens: {
    label: 'Design Tokens & Scalability',
    description: 'Structures reusable design tokens for color, spacing, typography, and component states.',
    guidance: 'Describe your design token system: global primitives, semantic aliases, and component-specific tokens.',
    detector: (text, lower) => {
      const match = text.match(/\b(?:design token|token|spacing|palette|typography|component state|semantic token)\s+([^.]{10,80})/i);
      const met = /(?:design token|token|spacing|palette|typography|component state|semantic token|variable|css variable)/i.test(lower);
      return { met, quote: match ? match[0].trim() : undefined };
    },
  },
  responsive_hierarchy: {
    label: 'Responsive Visual Hierarchy',
    description: 'Designs clear component states across desktop and small-screen mobile viewports.',
    guidance: 'Address responsive layout breakpoints, minimum touch targets, and visual scanning flow.',
    detector: (text, lower) => {
      const match = text.match(/\b(?:responsive|viewport|mobile|touch target|breakpoint|hierarchy|grid)\s+([^.]{10,80})/i);
      const met = /(?:responsive|viewport|mobile|touch target|breakpoint|hierarchy|grid|flexbox|layout)/i.test(lower);
      return { met, quote: match ? match[0].trim() : undefined };
    },
  },
  testing_validation: {
    label: 'Design Handoff & Implementation Verification',
    description: 'Provides detailed component specs and verifies fidelity with frontend engineering implementations.',
    guidance: 'Explain how you test and verify fidelity: design review with developers, component storybooks, or spec sheets.',
    detector: (text, lower) => {
      const match = text.match(/\b(?:handoff|storybook|spec|developer|engineering|fidelity|qa|verify)\s+([^.]{10,80})/i);
      const met = /(?:handoff|storybook|spec|developer|engineering|fidelity|qa|verify|implementation|inspect)/i.test(lower);
      return { met, quote: match ? match[0].trim() : undefined };
    },
  },
  testing: {
    label: 'Automated Testing Strategy',
    description: 'Specifies unit, integration, or contract tests to ensure stability and detect regressions.',
    guidance: 'Detail your testing strategy: unit tests, mocks, test fixtures, integration verification.',
    detector: (text, lower) => {
      const match = text.match(/\b(?:test|unit test|mock|fixture|integration test|regression|pytest|vitest)\s+([^.]{10,80})/i);
      const met = /(?:test|unit test|mock|fixture|integration test|regression|pytest|vitest|tdd)/i.test(lower);
      return { met, quote: match ? match[0].trim() : undefined };
    },
  },
  error_handling: {
    label: 'Error Handling & Fault Tolerance',
    description: 'Handles exceptions, invalid payloads, timeouts, or disconnects gracefully.',
    guidance: 'Address failure recovery: error codes, timeouts, exception handling, fallback logic.',
    detector: (text, lower) => {
      const match = text.match(/\b(?:error|exception|timeout|fallback|retry|failure|fault|crash)\s+([^.]{10,80})/i);
      const met = /(?:error|exception|timeout|fallback|retry|failure|fault|crash|disconnect)/i.test(lower);
      return { met, quote: match ? match[0].trim() : undefined };
    },
  },
};

const RUBRIC_CRITERIA_REGISTRY: Record<string, Record<string, RubricCriterionMeta>> = {
  ib01: {
    context: UNIVERSAL_RUBRIC_DETECTORS.context,
    contribution: UNIVERSAL_RUBRIC_DETECTORS.contribution,
    decision: UNIVERSAL_RUBRIC_DETECTORS.decision,
    result_or_limitation: UNIVERSAL_RUBRIC_DETECTORS.result_or_limitation,
    reflection: UNIVERSAL_RUBRIC_DETECTORS.reflection,
  },

  ib02: {
    clarifying_questions: UNIVERSAL_RUBRIC_DETECTORS.clarifying_questions,
    resources: {
      label: 'Resource Modeling (Domain Entities)',
      description: 'Identifies nouns as resources (e.g. /tasks) rather than procedural actions (/getTasks).',
      guidance: 'Model domain entities as nouns: e.g. "Create a /tasks resource with fields like id, title, and status."',
      detector: (text, lower) => {
        const matches = text.match(/\b(?:\/tasks?|\/users?|resource|model|entity|schema|json payload)\s+([^.]{10,80})/i);
        const hasResource = /(?:\/tasks|\/users|resource|entity|schema|model|data structure)/i.test(lower);
        return {
          met: hasResource,
          quote: matches ? matches[0].trim() : undefined,
        };
      },
    },
    endpoints: {
      label: 'Standard HTTP Endpoints & Verbs',
      description: 'Specifies standard CRUD operations using GET, POST, PUT/PATCH, and DELETE.',
      guidance: 'List standard endpoints with methods: GET /tasks, POST /tasks, PATCH /tasks/:id, DELETE /tasks/:id.',
      detector: (text, lower) => {
        const matches = text.match(/\b(?:get|post|patch|put|delete)\s+(?:\/tasks?|\/api|\/[a-z]+)/i);
        const count = ['get', 'post', 'patch', 'put', 'delete'].filter(v => lower.includes(v)).length;
        return {
          met: count >= 2 || Boolean(matches),
          quote: matches ? matches[0].trim() : undefined,
        };
      },
    },
    validation: {
      label: 'Input Validation & Payload Sanitization',
      description: 'Rejects invalid or missing fields before processing, preventing bad data entry.',
      guidance: 'Mention input validation: "Validate incoming payloads to reject empty titles or invalid due dates."',
      detector: (text, lower) => {
        const matches = text.match(/\b(?:validate|validation|schema|reject|sanitize|required fields?)\s+([^.]{10,80})/i);
        const hasValidation = /(?:validat|schema|reject|sanitiz|required field|payload check)/i.test(lower);
        return {
          met: hasValidation,
          quote: matches ? matches[0].trim() : undefined,
        };
      },
    },
    errors: {
      label: 'Standard HTTP Error Codes (4xx/5xx)',
      description: 'Uses predictable status codes: 400 Bad Request, 404 Not Found, 201 Created.',
      guidance: 'Cite explicit status codes: 200 OK, 201 Created, 400 Bad Request, 404 Not Found.',
      detector: (text, lower) => {
        const matches = text.match(/\b(?:200|201|400|401|403|404|500)\b/);
        const hasCodes = /(?:200|201|400|404|bad request|not found|created)/i.test(lower);
        return {
          met: hasCodes,
          quote: matches ? matches[0] : undefined,
        };
      },
    },
    trade_off: {
      label: 'Engineering Trade-off Considered',
      description: 'Discusses practical design decisions like pagination, soft deletes, or DB index selection.',
      guidance: 'Mention a practical trade-off: "I would use pagination to avoid returning huge arrays, and soft deletes for recovery."',
      detector: (text, lower) => {
        const matches = text.match(/\b(?:trade-off|pagination|soft delete|indexing|caching|scale|rate limit)\s+([^.]{10,80})/i);
        const hasTradeOff = /(?:trade-off|pagination|soft delete|index|caching|cursor|limit|offset|scale)/i.test(lower);
        return {
          met: hasTradeOff,
          quote: matches ? matches[0].trim() : undefined,
        };
      },
    },
  },

  if01: {
    context: UNIVERSAL_RUBRIC_DETECTORS.context,
    feedback: {
      label: 'Feedback Source & Specific Issue',
      description: 'Identifies who gave feedback (peer, user, test) and the exact usability flaw raised.',
      guidance: 'Specify who provided feedback: "A usability test with mobile users revealed the button was below the fold."',
      detector: (text, lower) => {
        const matches = text.match(/\b(?:feedback|user testing|peer review|critique|pointed out|auditor|customer)\s+([^.]{10,80})/i);
        const hasFeedback = /(?:feedback|testing|critique|review|pointed out|audit|participant)/i.test(lower);
        return {
          met: hasFeedback,
          quote: matches ? matches[0].trim() : undefined,
        };
      },
    },
    change: {
      label: 'Concrete Frontend Code / UI Change',
      description: 'Specifies the CSS layout, DOM structure, or component refactor executed.',
      guidance: 'Detail the concrete UI code change: "Refactored the modal into a sticky bottom drawer with a visible touch target."',
      detector: (text, lower) => {
        const matches = text.match(/\b(?:refactored|redesigned|modified|changed the|updated the|css|component|layout)\s+([^.]{10,80})/i);
        const hasChange = /(?:refactor|redesign|change|layout|css|drawer|component|button|spacing|touch target|responsive)/i.test(lower);
        return {
          met: hasChange,
          quote: matches ? matches[0].trim() : undefined,
        };
      },
    },
    result_or_limitation: UNIVERSAL_RUBRIC_DETECTORS.result_or_limitation,
    reflection: UNIVERSAL_RUBRIC_DETECTORS.reflection,
  },

  if02: {
    labels: {
      label: 'Semantic HTML & Explicit Labels',
      description: 'Pairs form inputs with explicit <label htmlFor="id"> rather than bare placeholders.',
      guidance: 'Mention persistent labels: "Use semantic <label for="id"> tags instead of disappearing placeholders."',
      detector: (text, lower) => {
        const matches = text.match(/\b(?:label|htmlFor|placeholder|semantic html|fieldset|legend)\s+([^.]{10,80})/i);
        const hasLabel = /(?:label|htmlfor|placeholder|semantic html)/i.test(lower);
        return {
          met: hasLabel,
          quote: matches ? matches[0].trim() : undefined,
        };
      },
    },
    focus: {
      label: 'Visible Keyboard Focus States',
      description: 'Preserves :focus-visible outlines to allow keyboard navigability without mouse reliance.',
      guidance: 'Emphasize focus: "Keep visible :focus-visible indicators with a 2px high-contrast outline."',
      detector: (text, lower) => {
        const matches = text.match(/\b(?:focus|:focus-visible|outline|tab order|keyboard navigat)\s+([^.]{10,80})/i);
        const hasFocus = /(?:focus|:focus-visible|outline|tabindex|keyboard navigation)/i.test(lower);
        return {
          met: hasFocus,
          quote: matches ? matches[0].trim() : undefined,
        };
      },
    },
    errors: {
      label: 'Accessible Error Announcements',
      description: 'Connects error text to inputs using aria-invalid and aria-describedby for assistive tech.',
      guidance: 'Mention ARIA error attributes: "Use aria-invalid="true" and aria-describedby pointing to the error message."',
      detector: (text, lower) => {
        const matches = text.match(/\b(?:aria-invalid|aria-describedby|error message|screen reader|announced)\s+([^.]{10,80})/i);
        const hasAria = /(?:aria-invalid|aria-describedby|aria-live|screen reader|announce|accessible error)/i.test(lower);
        return {
          met: hasAria,
          quote: matches ? matches[0].trim() : undefined,
        };
      },
    },
    keyboard: {
      label: 'Logical Keyboard Navigation & Tab Order',
      description: 'Ensures the user can complete the entire form sequentially using Tab and Enter keys.',
      guidance: 'State keyboard accessibility: "Verify that all controls are reachable and actionable via keyboard only."',
      detector: (text, lower) => {
        const matches = text.match(/\b(?:keyboard|tab order|sequential|tab key|enter key|shortcuts)\s+([^.]{10,80})/i);
        const hasKeyboard = /(?:keyboard|tab order|sequential|tabbing|arrow keys)/i.test(lower);
        return {
          met: hasKeyboard,
          quote: matches ? matches[0].trim() : undefined,
        };
      },
    },
    responsive_layout: {
      label: 'Mobile Layout & Minimum Touch Targets',
      description: 'Uses single-column responsive flow with 44×44px minimum interactive targets.',
      guidance: 'Address mobile ergonomics: "Use a single-column layout with 44x44px minimum touch targets and mobile input types."',
      detector: (text, lower) => {
        const matches = text.match(/\b(?:responsive|touch target|44px|single-column|mobile-friendly|viewport)\s+([^.]{10,80})/i);
        const hasMobile = /(?:responsive|touch target|44px|single-column|mobile|small screen|viewport)/i.test(lower);
        return {
          met: hasMobile,
          quote: matches ? matches[0].trim() : undefined,
        };
      },
    },
    testing: {
      label: 'Accessibility Verification & Testing',
      description: 'Tests with screen readers (NVDA/VoiceOver), keyboard walkthroughs, or Axe linter tools.',
      guidance: 'Mention verification tools: "Test with VoiceOver/NVDA, keyboard-only tab walkthroughs, and automated axe audits."',
      detector: (text, lower) => {
        const matches = text.match(/\b(?:screen reader|voiceover|nvda|axe|lighthouse|keyboard-only|manual testing)\s+([^.]{10,80})/i);
        const hasTesting = /(?:screen reader|voiceover|nvda|axe|lighthouse|keyboard-only|test)/i.test(lower);
        return {
          met: hasTesting,
          quote: matches ? matches[0].trim() : undefined,
        };
      },
    },
  },

  id01: {
    context: UNIVERSAL_RUBRIC_DETECTORS.context,
    check: {
      label: 'Systematic Sanity Check / Anomaly Discovery',
      description: 'Checks summary statistics, duplicates, or distributions rather than accepting data blindly.',
      guidance: 'Detail your verification step: "I checked the distributions with boxplots and found duplicate test accounts."',
      detector: (text, lower) => {
        const matches = text.match(/\b(?:check|distribution|duplicate|anomaly|sanity check|outlier|verified)\s+([^.]{10,80})/i);
        const hasCheck = /(?:check|distribution|duplicate|anomaly|sanity|outlier|box plot|histogram|audited)/i.test(lower);
        return {
          met: hasCheck,
          quote: matches ? matches[0].trim() : undefined,
        };
      },
    },
    change: {
      label: 'Concrete Methodological / SQL Correction',
      description: 'Specifies the exact correction made to SQL queries, joins, filters, or formula calculations.',
      guidance: 'Explain the change: "Filtered out internal staff user IDs using NOT IN and deduplicated rows using DISTINCT."',
      detector: (text, lower) => {
        const matches = text.match(/\b(?:modified the query|filtered out|deduplicated|sql|joined|recalculated)\s+([^.]{10,80})/i);
        const hasChange = /(?:filter|dedup|distinct|sql|query|correction|revised calculation|modified)/i.test(lower);
        return {
          met: hasChange,
          quote: matches ? matches[0].trim() : undefined,
        };
      },
    },
    finding: {
      label: 'Verified Revised Finding',
      description: 'Explains what the true pattern or finding was after the correction was applied.',
      guidance: 'Report the revised finding: "The corrected finding showed that completion correlated with quiz attempts, not watch time."',
      detector: (text, lower) => {
        const matches = text.match(/\b(?:revised finding|true pattern|revealed that|showed that|actual result)\s+([^.]{10,80})/i);
        const hasFinding = /(?:finding|revealed|showed|result|pattern|correlation|actual)/i.test(lower);
        return {
          met: hasFinding,
          quote: matches ? matches[0].trim() : undefined,
        };
      },
    },
    limitation: {
      label: 'Acknowledged Data Limitation',
      description: 'Transparently notes gaps (e.g. sample size, lack of mobile offline tracking, date range constraints).',
      guidance: 'Note limitations: "A key limitation was that offline downloads were not captured in this telemetry pipeline."',
      detector: (text, lower) => {
        const matches = text.match(/\b(?:limitation|constraint|missing data|untracked|caveat|assumption)\s+([^.]{10,80})/i);
        const hasLimitation = /(?:limitation|constraint|untracked|caveat|gap|assumption|missing)/i.test(lower);
        return {
          met: hasLimitation,
          quote: matches ? matches[0].trim() : undefined,
        };
      },
    },
    reflection: UNIVERSAL_RUBRIC_DETECTORS.reflection,
  },

  id02: {
    meaning: {
      label: 'Domain Meaning of Null Values',
      description: 'Investigates what missing values actually signify in the real-world business process.',
      guidance: 'Clarify domain meaning: "Investigate whether null end_date represents active employment or an incomplete record."',
      detector: (text, lower) => {
        const matches = text.match(/\b(?:meaning|signif|represents?|domain context|active|why it is missing)\s+([^.]{10,80})/i);
        const hasMeaning = /(?:meaning|signif|represent|domain|why missing|business context)/i.test(lower);
        return {
          met: hasMeaning,
          quote: matches ? matches[0].trim() : undefined,
        };
      },
    },
    pattern: {
      label: 'Missingness Pattern Analysis (MCAR vs MAR)',
      description: 'Checks whether missingness is random or correlated with specific devices, dates, or regions.',
      guidance: 'Analyze missingness: "Quantify missing rates per column and check if nulls cluster by browser or geographical region."',
      detector: (text, lower) => {
        const matches = text.match(/\b(?:pattern|correlation|mcar|mar|cluster|percentage|per column)\s+([^.]{10,80})/i);
        const hasPattern = /(?:pattern|correlat|mcar|mar|cluster|rate|percentage|column)/i.test(lower);
        return {
          met: hasPattern,
          quote: matches ? matches[0].trim() : undefined,
        };
      },
    },
    missingness: {
      label: 'Missingness Quantification',
      description: 'Computes exact missing value counts or percentages before deciding on a strategy.',
      guidance: 'State quantification: "Calculate the exact percentage of nulls in each feature before proceeding."',
      detector: (_text, lower) => {
        const hasQuant = /(?:quantif|percentage|count|rate|percent|proportion|\b\d+%\b)/i.test(lower);
        return { met: hasQuant };
      },
    },
    decision: {
      label: 'Justified Treatment Strategy',
      description: 'Explains why dropping, imputing with median/mode, or creating an indicator was chosen.',
      guidance: 'Justify the decision: "Chose median imputation for right-skewed numerical fields to avoid distorting variance."',
      detector: (text, lower) => {
        const matches = text.match(/\b(?:imput|drop|median|mode|indicator|strategy|treatment)\s+([^.]{10,80})/i);
        const hasDecision = /(?:imput|drop|median|mode|indicator|treatment|strategy|chose)/i.test(lower);
        return {
          met: hasDecision,
          quote: matches ? matches[0].trim() : undefined,
        };
      },
    },
    validation: {
      label: 'Post-Imputation Variance Validation',
      description: 'Compares pre- and post-treatment distributions to verify variance was not distorted.',
      guidance: 'Verify distributions: "Compare pre- and post-imputation histograms to confirm distribution shape was preserved."',
      detector: (text, lower) => {
        const matches = text.match(/\b(?:compare|distribution|pre-|post-|distort|variance|histogram)\s+([^.]{10,80})/i);
        const hasValidation = /(?:compare|distribution|pre-|post-|distort|variance|histogram|verify)/i.test(lower);
        return {
          met: hasValidation,
          quote: matches ? matches[0].trim() : undefined,
        };
      },
    },
    limitation: {
      label: 'Chart Caption & Disclosure Note',
      description: 'Discloses missing data rates and assumptions in visualization footnotes.',
      guidance: 'Disclose in the chart: "Added a footnote noting that 8% of records were excluded due to unverified timestamps."',
      detector: (_text, lower) => {
        const hasLimitation = /(?:footnote|caption|disclose|note on chart|transparent|disclaimer|disclosed)/i.test(lower);
        return { met: hasLimitation };
      },
    },
  },
};

export const INTERVIEW_EVALUATION_CAVEAT =
  'Deterministic rubric evaluation only. Not a hiring decision, pass/fail grading, or interview guarantee. Technical correctness in interviews depends on interactive problem-solving, not checklist keywords. CareerAI never evaluates video, facial expressions, tone, accent, or emotion.';

/**
 * Pure deterministic interview answer evaluation.
 * Evaluates against structured rubric points without hallucinations or external APIs.
 */
export function evaluateInterviewAnswer(
  question: InterviewQuestion,
  answerText: string
): InterviewFeedbackResult {
  const trimmed = answerText.trim();
  const lower = trimmed.toLowerCase();
  const words = trimmed.split(/\s+/).filter(Boolean);

  const questionMeta = RUBRIC_CRITERIA_REGISTRY[question.id] || {};
  const rubricKeys = question.rubric_points;

  // Case 1: Empty or extremely short answer (< 10 characters or < 3 words)
  if (trimmed.length < 10 || words.length < 3) {
    const criteriaResults: RubricCheckItem[] = rubricKeys.map((key) => {
      const meta =
        questionMeta[key] ||
        UNIVERSAL_RUBRIC_DETECTORS[key] || {
          label: key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
          description: `Covers ${key.replace(/_/g, ' ')}`,
          guidance: `Include details addressing ${key.replace(/_/g, ' ')}.`,
        };
      return {
        id: key,
        label: meta.label,
        description: meta.description,
        met: false,
        guidance: meta.guidance,
      };
    });

    return {
      questionId: question.id,
      criteriaResults,
      metCount: 0,
      totalCount: rubricKeys.length,
      percentage: 0,
      strengths: [],
      missingPoints: [
        'Answer is empty or insufficient. Please provide an answer describing your technical context, approach, and outcome.',
        ...criteriaResults.map((c) => `${c.label}: ${c.description}`),
      ],
      nextAction:
        'Write 2–3 sentences describing the specific project or scenario you worked on and your concrete technical contribution.',
      caveat: INTERVIEW_EVALUATION_CAVEAT,
      evaluatedAt: new Date().toISOString(),
    };
  }

  // Case 2: Substantive or Partial Answer
  const criteriaResults: RubricCheckItem[] = [];
  const strengths: string[] = [];
  const missingPoints: string[] = [];

  for (const key of rubricKeys) {
    const meta =
      questionMeta[key] ||
      UNIVERSAL_RUBRIC_DETECTORS[key] || {
        label: key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        description: `Addresses ${key.replace(/_/g, ' ')}`,
        guidance: `Include information on ${key.replace(/_/g, ' ')}.`,
        detector: (_text: string, lwr: string) => {
          const matchKey = key.replace(/_/g, ' ').toLowerCase();
          return { met: lwr.includes(matchKey) };
        },
      };

    const result = meta.detector(trimmed, lower);

    if (result.met) {
      criteriaResults.push({
        id: key,
        label: meta.label,
        description: meta.description,
        met: true,
        evidenceQuote: result.quote,
        guidance: meta.guidance,
      });
      strengths.push(
        result.quote
          ? `${meta.label}: Demonstrated with evidence ("${result.quote}")`
          : `${meta.label}: Clear coverage of ${meta.description.toLowerCase()}`
      );
    } else {
      criteriaResults.push({
        id: key,
        label: meta.label,
        description: meta.description,
        met: false,
        guidance: meta.guidance,
      });
      missingPoints.push(`${meta.label}: ${meta.guidance}`);
    }
  }

  const metCount = criteriaResults.filter((c) => c.met).length;
  const totalCount = rubricKeys.length;
  const percentage = totalCount > 0 ? Math.round((metCount / totalCount) * 100) : 0;

  // Determine ONE focused next action
  let nextAction = 'Review your answer out loud to ensure conversational clarity and pacing.';
  if (missingPoints.length > 0) {
    const firstMissing = criteriaResults.find((c) => !c.met);
    if (firstMissing) {
      nextAction = `Incorporate ${firstMissing.label.toLowerCase()}: ${firstMissing.guidance}`;
    }
  } else {
    nextAction =
      'Excellent coverage across all rubric criteria. Practice articulating this answer concisely in under 2 minutes.';
  }

  return {
    questionId: question.id,
    criteriaResults,
    metCount,
    totalCount,
    percentage,
    strengths,
    missingPoints,
    nextAction,
    caveat: INTERVIEW_EVALUATION_CAVEAT,
    evaluatedAt: new Date().toISOString(),
  };
}
