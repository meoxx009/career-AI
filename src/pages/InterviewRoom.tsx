import { useState } from 'react';
import { DeterministicFallbackAdapter } from '../lib/ai-adapter';
import type { InterviewFeedbackOutput } from '../lib/ai-adapter';
import { PrimaryButton, StatusBadge } from '../components/UIComponents';
import { Sparkles, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';

interface InterviewQuestion {
  id: string;
  type: 'behavioral' | 'technical';
  prompt: string;
  expectedRubric: string[];
}

const SAMPLE_QUESTIONS: InterviewQuestion[] = [
  {
    id: 'int-1',
    type: 'technical',
    prompt:
      'Explain how you would design a REST API endpoint that allows a client to filter and sort paginated records without exhausting database memory.',
    expectedRubric: [
      'Identified database indexing on filter/sort columns',
      'Discussed cursor-based pagination vs offset limits',
      'Structured response with error handling for invalid query parameters',
    ],
  },
  {
    id: 'int-2',
    type: 'behavioral',
    prompt:
      'Describe a scenario in a project where an unexpected bug or edge case broke your system. How did you diagnose and resolve it?',
    expectedRubric: [
      'STAR structure: Context, Task, Action, Result',
      'Personal technical ownership explained',
      'Concrete lesson learned or automated test added',
    ],
  },
];

export const InterviewRoom: React.FC = () => {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answerText, setAnswerText] = useState(
    'In my Python CLI project, I encountered an issue where invalid JSON keys crashed the task parser. I diagnosed it using pytest by adding an edge case with corrupted files. Then I wrapped the loader with a try-except block to gracefully emit an error without terminating the application. This taught me to always test corrupted inputs.'
  );
  const [feedback, setFeedback] = useState<InterviewFeedbackOutput | null>(null);
  const [evaluating, setEvaluating] = useState(false);

  const currentQ = SAMPLE_QUESTIONS[questionIndex];

  const handleEvaluate = () => {
    setEvaluating(true);
    setTimeout(() => {
      try {
        const res = DeterministicFallbackAdapter.evaluateInterviewAnswer({
          questionId: currentQ.id,
          questionPrompt: currentQ.prompt,
          answerText,
          rubricVersion: '1.2.0',
          consent: true,
        });
        setFeedback(res);
      } catch (err) {
        console.error(err);
      } finally {
        setEvaluating(false);
      }
    }, 300);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="border-b border-neutral-800 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-cotton uppercase">
              Text Practice Mode · No Camera/Microphone Required
            </span>
          </div>
          <h1 className="text-3xl font-bold text-linen">Mock Interview Room</h1>
          <p className="text-xs text-neutral-400 mt-1">
            Build confidence explaining technical decisions using structured rubric checklists.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {SAMPLE_QUESTIONS.map((q, idx) => (
            <button
              key={q.id}
              onClick={() => {
                setQuestionIndex(idx);
                setFeedback(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition cursor-pointer ${
                questionIndex === idx
                  ? 'bg-tangerine text-void font-bold'
                  : 'bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-linen'
              }`}
            >
              Q{idx + 1}: {q.type}
            </button>
          ))}
        </div>
      </div>

      {/* Main Question Focus Card */}
      <div className="rounded-2xl bg-void-subtle border border-neutral-800 p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <StatusBadge variant="linen">
            {currentQ.type.toUpperCase()} CHALLENGE
          </StatusBadge>
          <span className="text-xs font-mono text-neutral-500">
            Checked Rubric: Oct 2026
          </span>
        </div>

        <h2 className="text-lg sm:text-xl font-medium text-linen leading-relaxed">
          {currentQ.prompt}
        </h2>

        {/* Expected Rubric Chips */}
        <div className="space-y-2">
          <span className="text-xs font-mono text-cotton block">Expected Criteria Checklist:</span>
          <div className="flex flex-wrap gap-2">
            {currentQ.expectedRubric.map((item, i) => (
              <span
                key={i}
                className="text-xs px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-300"
              >
                • {item}
              </span>
            ))}
          </div>
        </div>

        {/* Answer Editor */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <label htmlFor="answerInput" className="font-semibold text-cotton">Your Answer (Text Practice)</label>
            <span className="font-mono">{answerText.trim().split(/\s+/).filter(Boolean).length} words</span>
          </div>
          <textarea
            id="answerInput"
            value={answerText}
            onChange={e => setAnswerText(e.target.value)}
            rows={7}
            className="w-full text-xs sm:text-sm p-4 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-200 focus:outline-none focus:border-tangerine leading-relaxed"
            placeholder="Type your response here..."
          />
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2 text-xs text-neutral-500 font-mono">
            <ShieldCheck className="w-4 h-4 text-cotton" />
            <span>Deterministic rubric · Zero personality/facial bias</span>
          </div>

          <PrimaryButton
            onClick={handleEvaluate}
            disabled={evaluating || answerText.trim().length < 10}
            icon={<Sparkles className="w-4 h-4" />}
          >
            {evaluating ? 'Analyzing...' : 'Evaluate Answer'}
          </PrimaryButton>
        </div>
      </div>

      {/* Feedback Card */}
      {feedback && (
        <div className="rounded-2xl bg-linen border border-[#e4dcbe] text-ink p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-[#deceaa] pb-4">
            <div>
              <span className="text-xs font-mono uppercase text-ink-muted">
                Evaluation Mode: {feedback.mode}
              </span>
              <h3 className="text-xl font-bold text-ink mt-0.5">
                Rubric Performance Analysis
              </h3>
            </div>
            <span className="text-xs font-mono px-2.5 py-1 rounded bg-cotton text-ink border border-[#deceaa]">
              {feedback.abstained ? 'Abstained' : 'Scored'}
            </span>
          </div>

          {feedback.strengths.length > 0 && (
            <div>
              <h4 className="text-xs font-mono uppercase font-bold text-emerald-800 mb-2">
                Demonstrated Strengths
              </h4>
              <ul className="space-y-1.5 text-xs text-ink">
                {feedback.strengths.map((str, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {feedback.gaps.length > 0 && (
            <div>
              <h4 className="text-xs font-mono uppercase font-bold text-amber-900 mb-2">
                Areas to Strengthen
              </h4>
              <ul className="space-y-1.5 text-xs text-ink-muted">
                {feedback.gaps.map((gap, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>{gap}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="p-4 rounded-xl bg-cotton border border-[#deceaa]">
            <span className="text-xs font-mono uppercase font-semibold text-ink-muted block mb-1">
              Next Action Recommendation
            </span>
            <p className="text-sm font-medium text-ink">{feedback.nextAction}</p>
          </div>

          <div className="text-[11px] font-mono text-ink-muted pt-2 border-t border-[#deceaa]">
            Cited Rubric Criteria: {feedback.citedCriteria.join(' · ')}
          </div>
        </div>
      )}
    </div>
  );
};
