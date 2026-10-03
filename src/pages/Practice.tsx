import React, { useState, useMemo } from 'react';
import { useCareer } from '../context/CareerContext';
import { CAREER_CATALOGUE, getCareerPathById } from '../data/careerCatalogue';
import {
  evaluateInterviewAnswer,
  getQuestionsForRole,
  getQuestionContext,
} from '../lib/interviewEvaluator';
import { RoleSelector } from '../components/RoleSelector';
import type { InterviewFeedbackResult } from '../types';
import {
  DisplayHeading,
  Eyebrow,
  PrimaryButton,
  SecondaryButton,
  DarkCard,
  LinenCard,
  CottonCard,
  ScoreRing,
} from '../components/DesignSystem';
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  History,
  Sparkles,
  Trash2,
  Save,
  Check,
  RotateCcw,
} from 'lucide-react';

const RAHUL_SAMPLE_ANSWERS: Record<string, string> = {
  ib01: 'In my Python task organizer project, I encountered corrupted JSON files whenever the program was abruptly interrupted. I wrote a pytest suite to reproduce and isolate the crash, then implemented atomic file writes using temporary files and safe rename operations. This ensured corrupted data was never written to the primary store, and verified error codes were returned cleanly. It reinforced that input sanitization and transactional writes are essential even in small CLI tools.',
  ib02: 'First, I would clarify key requirements: expected user scale, whether authentication is JWT or session-based, and whether tasks belong to individual users or shared teams. For resources, I would model /tasks with id, user_id, title, status, and due_date. Standard REST endpoints would be GET /tasks (with pagination query params), POST /tasks, GET /tasks/:id, PATCH /tasks/:id, and DELETE /tasks/:id. Incoming payloads would be validated against a JSON schema to reject empty titles, returning 400 Bad Request. Missing tasks would return 404 Not Found, and successful creation returns 201 Created. For trade-offs, I would implement cursor pagination over offset pagination for large task lists and choose soft deletes to allow task recovery.',
  if01: 'While building a multi-step filter panel for our course catalog, peer usability testing revealed that mobile users failed to apply filters because the submit button was pushed below the viewport. I refactored the layout into a sticky bottom action bar with visible touch targets and aria-expanded indicators. Usability testing confirmed that all participants were able to apply filters on mobile screens without scrolling back up. This taught me to always test responsive forms with keyboard navigation and small-screen viewport constraints before finalizing UI components.',
  if02: 'To make a form accessible and mobile-friendly, I start with semantic HTML by pairing every input with an explicit <label htmlFor="id"> rather than relying on placeholders. For keyboard navigation, I retain visible :focus-visible outlines and ensure a logical sequential tab order. For mobile touch usability, I use a single-column layout with minimum 44x44px touch targets and specify inputmode="numeric" or type="email" to trigger appropriate virtual keyboards. Error messages are announced accessibly using aria-invalid="true" and aria-describedby pointing to the error text. Finally, I test the form using screen readers and keyboard-only navigation.',
  id01: 'During an exploratory project on student course completion, my initial hypothesis was that video watch time directly predicted exam scores. When I checked the data distribution using box plots, I uncovered duplicate records and test accounts that heavily skewed the mean watch time. I modified my SQL queries to deduplicate user sessions using DISTINCT and filtered out staff test accounts. The revised finding showed that quiz attempts had a much higher correlation with completion than passive video time. A key limitation was the lack of tracking for mobile offline downloads. This formed a habit to always audit distributions and duplicate keys before drawing conclusions.',
  id02: 'Before visualizing a dataset with missing values, I first investigate what null represents in the domain context—for instance, whether a null end_date indicates an active employment status rather than missing data. Next, I quantify missingness per column using percentage counts and check correlation patterns to see if nulls cluster by device or region (MCAR vs MAR). For numerical values like salary that are right-skewed, I justify using median imputation rather than mean, or create a separate "unreported" category indicator. I validate that the imputation did not distort variance by comparing pre- and post-imputation distributions. Finally, I disclose missing rates and assumptions in the visualization footnote.',
  iai01: 'In my customer intent classifier project, the model achieved 92% validation accuracy but failed repeatedly on customer cancellations during real batch runs. I inspected the misclassified subset and discovered class imbalance: cancellations represented under 4% of training rows. I re-framed the metric from overall accuracy to precision-recall curves and stratified the dataset. I then compared a lightweight DistilBERT baseline with logistic regression on TF-IDF. Error analysis showed semantic overlap with complaints. I deployed the calibrated model with an uncertainty threshold that flags ambiguous cases for manual review, documenting the latency trade-off of 45ms per inference.',
  iai02: 'To deploy a fraud detection model under a 50ms p95 latency budget, I first clarify the input payload size and expected peak request rate. I would choose a lightweight gradient boosted tree (LightGBM) or quantized neural model over an oversized ensemble. For pipeline bottlenecks, preprocessing such as categorical encoding and scaling must occur in-memory without blocking remote database queries. For safety and degradation, if inference times out or service fails, the system safely falls back to a deterministic rules engine. I monitor prediction drift using Kolmogorov-Smirnov statistical tests on input distributions and log inference latencies with Prometheus metrics.',
  igenai01: 'When building an automated release note generator with an LLM, the model occasionally hallucinated closed issue IDs that did not exist in the pull request. I wrote an automated evaluation script that compared output issue numbers against the input git log. I solved this by decomposing the prompt: first asking the model to extract and cite raw commit hashes, and second using structured JSON schema output with strict temperature=0.0. I tested prompt variants across 50 real PRs, measuring hallucination rate down to 0% and verified reproducible outputs across runs.',
  igenai02: 'To prevent prompt injections in a customer-facing support assistant, I implement defensive layered architecture. First, user inputs are strictly separated from system instructions using structural message roles rather than string interpolation. Second, an input classification check screens for jailbreak patterns like "ignore previous instructions". Third, system instructions clearly define rigid scope boundaries. Fourth, tool execution requires programmatic schema validation so that no arbitrary SQL or shell commands can be executed. Finally, LLM outputs pass through an output filter that redacts accidental system prompt leakage.',
  irag01: 'In a technical documentation assistant, retrieval accuracy degraded because large code blocks were fragmented across arbitrary 500-token boundaries. I implemented a synthetic test suite of 40 technical queries with ground-truth source documents. I evaluated retrieval using Hit Rate@5 and MRR. I changed the chunking strategy to AST-aware Markdown header chunking with 100-token overlap, and added a cross-encoder reranker after vector similarity search. This raised Hit Rate@5 from 58% to 89% while keeping end-to-end retrieval latency under 120ms.',
  irag02: 'When building a legal compliance RAG pipeline, the greatest risk is hallucinated or stale citations. To address this, every chunk in the vector database includes cryptographically verified document hash, effective date, and section URI metadata. In the system prompt, the LLM is instructed to answer strictly using the provided context passages and emit verbatim citation tags for every factual assertion. If the similarity score of the top retrieved passages falls below our calibrated relevance threshold (0.75 cosine similarity), the pipeline returns an explicit refusal: "No verified compliance text found for this query", preventing hallucinated advice.',
  iece01: 'While building an SPI sensor logging device on an STM32 microcontroller, the device intermittently hung after several hours of operation. I connected a logic analyzer to probe the SPI bus clock and chip-select lines, which revealed clock stretching lockups caused by an unhandled sensor interrupt. I isolated the bug by writing a minimal reproducible firmware loop. I refactored the driver to use non-blocking DMA with hardware timeout counters and watchdog resets rather than busy-wait loops, verifying uninterrupted 48-hour continuous logging.',
  iece02: 'For a low-power environmental monitoring node running on a coin-cell battery, every milliamp-second is critical. I architect the firmware around event-driven sleep modes: the microcontroller remains in Deep Sleep consuming under 3uA, waking only via RTC timer or GPIO interrupt. The ADC sensor sampling routine is non-blocking, reading sensor values over I2C in under 15ms before immediately returning to sleep. For memory safety, all buffers are statically allocated to avoid heap fragmentation, and a hardware watchdog timer guarantees self-recovery if a bus hangs.',
  iux01: 'During usability testing of an internal dashboard with five dispatch operators, three failed to notice high-priority emergency alerts because they were styled with the same low-contrast gray pill as routine status updates. I conducted contextual inquiries to understand their lighting conditions and workflow pressure. I redesigned the notification hierarchy using high-contrast warning tokens, bold typography, and an audible non-blocking toast, adhering to WCAG 2.1 AA standards. Subsequent testing with the same cohort achieved 100% detection within 2 seconds.',
  iux02: 'When establishing a design token system, I separate tokens into three distinct tiers: Global (raw palette hex values and base scales), Semantic (purpose-driven tokens like surface-primary, text-muted, border-interactive), and Component-level. To ensure WCAG 2.1 AA compliance, every text-on-surface token pairing is programmatically tested to guarantee at least 4.5:1 contrast for regular text and 3:1 for large text. For responsive ergonomics, I define minimum 44x44px interactive tap target tokens and use fluid typography scales with rem units to support user-configured browser font zoom without layout clipping.',
};

export const Practice: React.FC = () => {
  const {
    selectedRoleId,
    setSelectedRoleId,
    interviewHistory,
    saveInterviewAttempt,
    deleteInterviewAttempt,
    showToast,
    aiMode,
    setAiMode,
    evaluateInterviewWithAI,
    consentGiven,
  } = useCareer();

  // Active career path from the shared 33-role catalogue
  const activePath = useMemo(() => {
    return getCareerPathById(selectedRoleId) || CAREER_CATALOGUE[0];
  }, [selectedRoleId]);

  // Questions for the active path (specific or safe fallback)
  const roleQuestions = useMemo(() => {
    return getQuestionsForRole(activePath.numericId, activePath.title);
  }, [activePath.numericId, activePath.title]);

  const [selectedQuestionId, setSelectedQuestionId] = useState<string>('');

  // Synchronize current question when role changes
  const currentQ = useMemo(() => {
    const match = roleQuestions.find(q => q.id === selectedQuestionId);
    return match || roleQuestions[0];
  }, [roleQuestions, selectedQuestionId]);

  const contextMeta = useMemo(() => getQuestionContext(currentQ), [currentQ]);

  const [answerText, setAnswerText] = useState('');
  const [feedback, setFeedback] = useState<InterviewFeedbackResult | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [aiNotice, setAiNotice] = useState<{ message: string; canRetry: boolean } | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSavedTimestamp, setLastSavedTimestamp] = useState<string | null>(null);
  const [lastSavedText, setLastSavedText] = useState<string>('');
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const isDraftDirty = answerText !== lastSavedText && answerText.trim().length > 0;
  const wordCount = answerText.trim() ? answerText.trim().split(/\s+/).length : 0;
  const charCount = answerText.length;

  // Relevant past sessions for the current question
  const questionSessions = useMemo(() => {
    return interviewHistory.filter(s => s.questionId === currentQ.id);
  }, [interviewHistory, currentQ.id]);

  const handleEvaluate = async () => {
    setIsEvaluating(true);
    setAiNotice(null);
    try {
      if (aiMode === 'ai') {
        if (!consentGiven) {
          showToast('External AI requires privacy consent in Settings. Switched to deterministic mode.');
          const result = evaluateInterviewAnswer(currentQ, answerText);
          setFeedback(result);
          return;
        }

        const aiRes = await evaluateInterviewWithAI({
          questionId: currentQ.id,
          questionPrompt: currentQ.prompt,
          answerText,
          rubricKeys: currentQ.rubric_points,
          rubricVersion: currentQ.version || '1.0',
          consent: true,
        });

        const detResult = evaluateInterviewAnswer(currentQ, answerText);

        const mergedResult: InterviewFeedbackResult = {
          ...detResult,
          strengths: aiRes.data.strengths.length > 0 ? aiRes.data.strengths : detResult.strengths,
          missingPoints: aiRes.data.gaps.length > 0 ? aiRes.data.gaps : detResult.missingPoints,
          nextAction: aiRes.data.nextAction || detResult.nextAction,
          isAiGenerated: true,
          confidence: aiRes.data.confidence,
          caveat: aiRes.data.caveat || detResult.caveat,
        };

        setFeedback(mergedResult);

        if (aiRes.error) {
          setAiNotice({
            message: aiRes.error.userNotice,
            canRetry: aiRes.error.canRetry,
          });
          showToast(aiRes.error.userNotice);
        } else {
          showToast('AI rubric evaluation complete — review before using.');
        }
      } else {
        const result = evaluateInterviewAnswer(currentQ, answerText);
        setFeedback(result);
        if (answerText.trim().length === 0) {
          showToast('Empty answer evaluated against rubric criteria.');
        } else {
          showToast('Deterministic rubric check complete.');
        }
      }
    } catch {
      setAiNotice({
        message: 'AI assistant service encountered an issue. Switched to deterministic mode. Your draft text is preserved.',
        canRetry: true,
      });
      const result = evaluateInterviewAnswer(currentQ, answerText);
      setFeedback(result);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleSaveToHistory = async () => {
    if (!answerText.trim()) {
      showToast('Cannot save an empty answer to history.');
      return;
    }

    setSaveStatus('saving');
    // Ensure current evaluation exists or generate it
    const evalResult = feedback || evaluateInterviewAnswer(currentQ, answerText);
    setFeedback(evalResult);

    const res = await saveInterviewAttempt({
      roleId: activePath.numericId,
      questionId: currentQ.id,
      mode: currentQ.type,
      questionPrompt: currentQ.prompt,
      answerText,
      feedback: evalResult,
      userId: 'guest-learner',
    });

    if (res.success) {
      setSaveStatus('saved');
      setLastSavedText(answerText);
      setLastSavedTimestamp(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      showToast('Practice answer saved to history.');
      setTimeout(() => setSaveStatus('idle'), 3500);
    } else {
      setSaveStatus('error');
      showToast(`Failed to save: ${res.error || 'Unknown error'}`);
    }
  };

  const handleLoadRahulSample = () => {
    const sample =
      RAHUL_SAMPLE_ANSWERS[currentQ.id] ||
      `In my ${activePath.title} project, I identified an architectural bottleneck during testing. I isolated the issue by writing automated tests, systematically evaluated implementation trade-offs against performance and maintainability, and implemented the solution with structured error handling. This improved stability and taught me to prioritize clear boundaries and automated verification.`;
    setAnswerText(sample);
    setFeedback(null);
    showToast(`Loaded synthetic demo answer for ${activePath.title}.`);
  };

  const handleClearDraft = () => {
    setAnswerText('');
    setFeedback(null);
    setSaveStatus('idle');
    showToast('Cleared answer draft.');
  };

  const handleLoadSession = (sessionText: string, sessionFeedback: InterviewFeedbackResult) => {
    setAnswerText(sessionText);
    setLastSavedText(sessionText);
    setFeedback(sessionFeedback);
    setShowHistoryModal(false);
    showToast('Loaded past answer into editor.');
  };

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
      {/* Editorial Header */}
      <header className="no-print" style={{ marginBottom: '32px' }}>
        <Eyebrow text={`INTERVIEW PRACTICE / TARGET: ${activePath.title.toUpperCase()}`} />
        <DisplayHeading level={1}>TEXT PRACTICE ROOM</DisplayHeading>
        <p className="muted-light" style={{ maxWidth: '720px', marginTop: '14px', fontSize: '1.02rem', lineHeight: 1.6 }}>
          Structured practice for technical discussions and behavioural STAR-method questions. Evaluated against transparent engineering rubrics without invasive video analysis, facial recognition, or ungrounded hiring claims.
        </p>

        {/* Unified 33-Role Selector */}
        <div style={{ marginTop: '24px' }}>
          <RoleSelector
            selectedRoleId={activePath.numericId}
            onSelectRole={(id) => {
              setSelectedRoleId(id);
              setSelectedQuestionId('');
              setFeedback(null);
              setAnswerText('');
            }}
            label="Target Career Role"
            helperText="Search across 33 career paths with role-specific questions and evaluation rubrics"
          />
        </div>

        {/* Selected Role Overview Banner */}
        <div
          style={{
            marginTop: '16px',
            padding: '14px 18px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--color-black-soft)',
            border: '1px solid var(--color-line-dark)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--color-tangerine)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {activePath.category.replace('_', ' ')}
              </span>
              <span style={{ color: 'var(--color-line-dark)' }}>·</span>
              <span style={{ fontSize: '0.74rem', color: 'var(--color-linen)', fontWeight: 600 }}>
                {activePath.level.toUpperCase()} LEVEL
              </span>
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--color-muted-light)' }}>
              First Deliverable: {activePath.firstProjectDeliverable}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--color-muted-light)', lineHeight: 1.5 }}>
            {activePath.description}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '2px' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--color-muted-light)', alignSelf: 'center', marginRight: '4px' }}>
              Core Skills:
            </span>
            {activePath.coreSkills.slice(0, 6).map((skill) => (
              <span
                key={skill}
                style={{
                  fontSize: '0.70rem',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-pill)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--color-line-dark)',
                  color: 'var(--color-cotton)',
                }}
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      </header>

      {/* Non-Negotiable Privacy & Integrity Contract */}
      <div style={{ marginBottom: '28px' }}>
        <CottonCard style={{ padding: '16px 20px', display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
          <ShieldCheck size={22} color="var(--color-ink)" style={{ flexShrink: 0, marginTop: '2px' }} aria-hidden="true" />
          <div style={{ fontSize: '0.84rem', color: 'var(--color-ink)', lineHeight: 1.55 }}>
            <strong style={{ color: 'var(--color-ink)' }}>First-Class Text Practice Contract: </strong>
            CareerAI practices engineering communication in pure text. We deliberately never request microphone or camera permissions, and never infer facial expression, eye contact, tone, accent, confidence, or emotion. We do not produce hire/no-hire decisions.
          </div>
        </CottonCard>
      </div>

      {/* Main Work Area: 2-Column Responsive Layout (collapses sequentially on mobile) */}
      <div className="responsive-two-col">
        {/* Left Column: Question Card & Answer Editor */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Question Selector & Prompt (Dark Card) */}
          <DarkCard>
            {/* Fallback Question Notice if applicable */}
            {currentQ.isFallback && (
              <div
                style={{
                  background: 'rgba(235, 137, 50, 0.12)',
                  border: '1px solid rgba(235, 137, 50, 0.4)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '10px 14px',
                  marginBottom: '16px',
                  fontSize: '0.78rem',
                  color: 'var(--color-linen)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
                role="status"
              >
                <AlertCircle size={15} color="var(--color-tangerine)" style={{ flexShrink: 0 }} />
                <span>
                  <strong>Peer-Reviewed Questions Pending:</strong> Showing a foundational engineering question pair for {activePath.title}. Full rubric check runs deterministically.
                </span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {roleQuestions.map((q, idx) => {
                  const isQActive = q.id === currentQ.id;
                  const label =
                    q.type === 'behavioural'
                      ? `${idx + 1}. Behavioural (STAR)`
                      : `${idx + 1}. Technical System`;
                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => {
                        setSelectedQuestionId(q.id);
                        setFeedback(null);
                        setAnswerText('');
                      }}
                      style={{
                        padding: '6px 14px',
                        borderRadius: 'var(--radius-pill)',
                        border: isQActive ? '1px solid var(--color-tangerine)' : '1px solid var(--color-line-dark)',
                        background: isQActive ? 'var(--color-tangerine)' : 'var(--color-black-soft)',
                        color: isQActive ? '#ffffff' : 'var(--color-muted-light)',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              {questionSessions.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowHistoryModal(!showHistoryModal)}
                  className="button-text"
                  style={{ fontSize: '0.74rem', color: 'var(--color-cotton)' }}
                >
                  <History size={13} aria-hidden="true" />
                  History ({questionSessions.length})
                </button>
              )}
            </div>

            {/* Question Prompt */}
            <div style={{ marginBottom: '20px' }}>
              <span className="source-label" style={{ marginBottom: '8px', display: 'inline-block' }}>
                Question {currentQ.id.toUpperCase()} · {currentQ.type === 'behavioural' ? 'STAR Methodology' : 'System Design'}
              </span>
              <h3 style={{ margin: '6px 0 0', color: 'var(--color-linen)', fontSize: '1.2rem', lineHeight: 1.45 }}>
                &ldquo;{currentQ.prompt}&rdquo;
              </h3>
            </div>

            {/* Question Context & What Interviewers Listen For */}
            {contextMeta && (
              <div
                style={{
                  background: 'var(--color-black-soft)',
                  border: '1px solid var(--color-line-dark)',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px 18px',
                  marginBottom: '18px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <HelpCircle size={14} color="var(--color-tangerine)" aria-hidden="true" />
                  <span style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--color-linen)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Why Interviewers Ask This
                  </span>
                </div>
                <p style={{ margin: '0 0 10px', fontSize: '0.8rem', color: 'var(--color-muted-light)', lineHeight: 1.5 }}>
                  {contextMeta.purpose}
                </p>
                <div style={{ fontSize: '0.74rem', color: 'var(--color-muted-light)' }}>
                  <strong style={{ color: 'var(--color-linen)' }}>Key signals:</strong>
                  <ul style={{ margin: '6px 0 0', paddingLeft: '18px', lineHeight: 1.55 }}>
                    {contextMeta.interviewerListeningFor.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Expected Rubric Criteria Preview */}
            <div style={{ marginBottom: '6px' }}>
              <div style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--color-muted-light)', textTransform: 'uppercase', marginBottom: '8px' }}>
                Target Rubric Criteria ({currentQ.rubric_points.length})
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {currentQ.rubric_points.map(pt => (
                  <span
                    key={pt}
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--color-line-dark)',
                      color: 'var(--color-muted-light)',
                      padding: '3px 10px',
                      borderRadius: 'var(--radius-pill)',
                      fontSize: '0.72rem',
                    }}
                  >
                    • {pt.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          </DarkCard>

          {/* Answer Editor Area (Dark Card) */}
          <DarkCard>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
              <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--color-linen)' }}>
                Your Practice Response
              </h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {isDraftDirty && (
                  <span style={{ fontSize: '0.7rem', color: 'var(--color-tangerine)', background: 'rgba(255, 109, 31, 0.14)', padding: '2px 8px', borderRadius: 'var(--radius-pill)' }}>
                    Unsaved edit
                  </span>
                )}
                <span style={{ fontSize: '0.72rem', color: 'var(--color-muted-light)' }}>
                  {wordCount} words · {charCount} chars
                </span>
              </div>
            </div>

            <textarea
              rows={11}
              value={answerText}
              onChange={e => {
                setAnswerText(e.target.value);
                if (saveStatus === 'saved') setSaveStatus('idle');
              }}
              placeholder="Structure your answer clearly. For behavioural questions, outline the situation, your individual action, technical rationale, and final takeaway. For technical design, ask clarifying questions, model resources, and detail endpoints..."
              style={{
                width: '100%',
                background: 'var(--color-black-soft)',
                border: '1px solid var(--color-line-dark)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-linen)',
                padding: '14px',
                fontSize: '0.88rem',
                lineHeight: 1.6,
                resize: 'vertical',
                boxSizing: 'border-box',
              }}
              aria-label="Practice Answer Input"
            />

            {/* Quick helper buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--color-muted-light)' }}>
                Recommended: 60–250 words
              </span>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handleLoadRahulSample}
                  className="button-text"
                  style={{ fontSize: '0.72rem', color: 'var(--color-cotton)' }}
                >
                  <Sparkles size={11} aria-hidden="true" />
                  Load Rahul Sample Answer
                </button>
                <button
                  type="button"
                  onClick={handleClearDraft}
                  className="button-text"
                  style={{ fontSize: '0.72rem' }}
                >
                  <RotateCcw size={11} aria-hidden="true" />
                  Clear
                </button>
              </div>
            </div>

            {/* Mode Selector */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '16px', marginBottom: '8px' }}>
              <button
                type="button"
                onClick={() => setAiMode('deterministic-fallback')}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-pill)',
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  border: aiMode === 'deterministic-fallback' ? '1px solid var(--color-cotton)' : '1px solid var(--color-line-dark)',
                  background: aiMode === 'deterministic-fallback' ? 'rgba(250, 243, 225, 0.12)' : 'transparent',
                  color: aiMode === 'deterministic-fallback' ? 'var(--color-cotton)' : 'var(--color-muted-light)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                Deterministic Checklist (Default)
              </button>
              <button
                type="button"
                onClick={() => setAiMode('ai')}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-pill)',
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  border: aiMode === 'ai' ? '1px solid var(--color-tangerine)' : '1px solid var(--color-line-dark)',
                  background: aiMode === 'ai' ? 'rgba(255, 109, 31, 0.15)' : 'transparent',
                  color: aiMode === 'ai' ? 'var(--color-tangerine)' : 'var(--color-muted-light)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  transition: 'all 0.15s ease',
                }}
              >
                <Sparkles size={12} />
                AI Practice Feedback (Optional)
              </button>
            </div>

            {/* Inline AI notice with calm message and retry */}
            {aiNotice && (
              <div
                style={{
                  marginTop: '10px',
                  marginBottom: '10px',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255, 109, 31, 0.12)',
                  border: '1px solid var(--color-tangerine)',
                  color: 'var(--color-linen)',
                  fontSize: '0.78rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                }}
                role="status"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle size={14} color="var(--color-tangerine)" style={{ flexShrink: 0 }} />
                  <span>{aiNotice.message}</span>
                </div>
                {aiNotice.canRetry && (
                  <button
                    type="button"
                    onClick={handleEvaluate}
                    className="button-text"
                    style={{ fontSize: '0.74rem', color: 'var(--color-tangerine)', fontWeight: 700, flexShrink: 0 }}
                  >
                    Retry ↺
                  </button>
                )}
              </div>
            )}

            {/* Evaluation & Save Buttons */}
            <div style={{ marginTop: '14px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <PrimaryButton
                onClick={handleEvaluate}
                disabled={isEvaluating}
                style={{ flex: 1, minWidth: '180px' }}
              >
                {isEvaluating
                  ? 'Evaluating Rubric...'
                  : aiMode === 'ai'
                  ? 'Evaluate with AI Rubric ↗'
                  : 'Evaluate with Deterministic Rubric ↗'}
              </PrimaryButton>
              <SecondaryButton
                onClick={handleSaveToHistory}
                disabled={!answerText.trim() || saveStatus === 'saving'}
                icon={saveStatus === 'saved' ? <Check size={14} color="#10b981" /> : <Save size={14} />}
              >
                {saveStatus === 'saving'
                  ? 'Saving...'
                  : saveStatus === 'saved'
                  ? `Saved (${lastSavedTimestamp})`
                  : 'Save to History'}
              </SecondaryButton>
            </div>
          </DarkCard>

          {/* Past History Modal / Drawer for this question */}
          {showHistoryModal && (
            <DarkCard style={{ border: '1px solid var(--color-tangerine)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-linen)' }}>
                  Saved Practice Attempts for {currentQ.id.toUpperCase()} ({questionSessions.length})
                </h4>
                <button
                  type="button"
                  onClick={() => setShowHistoryModal(false)}
                  className="button-text"
                  style={{ fontSize: '0.74rem' }}
                >
                  Close
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '280px', overflowY: 'auto' }}>
                {questionSessions.map(session => (
                  <div
                    key={session.id}
                    style={{
                      background: 'var(--color-black-soft)',
                      border: '1px solid var(--color-line-dark)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '10px 14px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '0.74rem', color: 'var(--color-tangerine)', fontWeight: 700 }}>
                        {session.feedback.metCount} / {session.feedback.totalCount} criteria demonstrated ({session.feedback.percentage}%)
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--color-muted-light)' }}>
                        {new Date(session.savedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p style={{ margin: '0 0 8px', fontSize: '0.76rem', color: 'var(--color-linen)', fontStyle: 'italic', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      &ldquo;{session.answerText}&rdquo;
                    </p>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        onClick={() => handleLoadSession(session.answerText, session.feedback)}
                        className="button-text"
                        style={{ fontSize: '0.72rem', color: 'var(--color-cotton)' }}
                      >
                        Load this answer
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteInterviewAttempt(session.id)}
                        className="button-text"
                        style={{ fontSize: '0.72rem', color: '#ef4444' }}
                      >
                        <Trash2 size={11} aria-hidden="true" />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </DarkCard>
          )}
        </div>

        {/* Right Column: Deterministic Rubric Feedback (Linen Card) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {!feedback && (
            <LinenCard style={{ minHeight: '360px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '40px 24px' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: 'rgba(255, 109, 31, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px',
                }}
              >
                <CheckCircle2 size={28} color="var(--color-tangerine)" aria-hidden="true" />
              </div>
              <h3 style={{ margin: '0 0 8px', color: 'var(--color-ink)', fontSize: '1.2rem' }}>
                Deterministic Rubric Checklist
              </h3>
              <p style={{ margin: 0, maxWidth: '340px', fontSize: '0.84rem', color: 'var(--color-muted-dark)', lineHeight: 1.55 }}>
                Type your answer and click <strong>Evaluate Answer ↗</strong> to view structured coverage across the {currentQ.rubric_points.length} rubric criteria.
              </p>
            </LinenCard>
          )}

          {feedback && (
            <LinenCard>
              {/* Checklist Alignment Score Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                    <Eyebrow text="RUBRIC CHECKLIST EVALUATION" />
                    {feedback.isAiGenerated && (
                      <span
                        style={{
                          background: 'rgba(255, 109, 31, 0.15)',
                          color: 'var(--color-tangerine)',
                          border: '1px solid var(--color-tangerine)',
                          fontSize: '0.70rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-pill)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Sparkles size={11} aria-hidden="true" />
                        AI suggestion — review before using
                      </span>
                    )}
                  </div>
                  <h3 style={{ margin: 0, color: 'var(--color-ink)', fontSize: '1.35rem' }}>
                    {feedback.metCount} of {feedback.totalCount} Criteria Demonstrated
                  </h3>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {feedback.confidence && (
                    <span style={{ fontSize: '0.72rem', color: 'var(--color-muted-dark)' }}>
                      Confidence: <strong>{feedback.confidence === 'high' ? 'High' : 'Needs more evidence'}</strong>
                    </span>
                  )}
                  <ScoreRing score={feedback.percentage} size={54} strokeWidth={6} />
                </div>
              </div>

              {/* Mandatory Caveat Banner */}
              <div
                style={{
                  background: 'rgba(34, 34, 34, 0.06)',
                  border: '1px solid rgba(34, 34, 34, 0.15)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '10px 14px',
                  fontSize: '0.74rem',
                  color: 'var(--color-muted-dark)',
                  marginBottom: '20px',
                  lineHeight: 1.5,
                }}
              >
                <strong>Evaluation Notice: </strong>
                {feedback.caveat}
              </div>

              {/* Structured Rubric Checklist */}
              <div style={{ marginBottom: '22px' }}>
                <div style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--color-muted-dark)', textTransform: 'uppercase', marginBottom: '10px' }}>
                  Criteria Breakdown ({feedback.metCount}/{feedback.totalCount})
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {feedback.criteriaResults.map(item => (
                    <div
                      key={item.id}
                      style={{
                        background: item.met ? 'rgba(74, 122, 60, 0.08)' : 'rgba(235, 137, 50, 0.08)',
                        border: item.met ? '1px solid rgba(74, 122, 60, 0.35)' : '1px solid rgba(235, 137, 50, 0.35)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '12px 14px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        {item.met ? (
                          <span style={{ color: '#2d6a1f', fontWeight: 800, fontSize: '0.9rem' }}>✓</span>
                        ) : (
                          <span style={{ color: '#c2580a', fontWeight: 800, fontSize: '0.9rem' }}>○</span>
                        )}
                        <strong style={{ fontSize: '0.82rem', color: item.met ? '#1e3a12' : '#843e06' }}>
                          {item.label}
                        </strong>
                      </div>
                      <p style={{ margin: '0 0 6px', fontSize: '0.76rem', color: 'var(--color-ink)', lineHeight: 1.45 }}>
                        {item.description}
                      </p>
                      {item.met && item.evidenceQuote && (
                        <div style={{ fontSize: '0.72rem', color: '#2d6a1f', fontStyle: 'italic', background: 'rgba(255, 255, 255, 0.5)', padding: '4px 8px', borderRadius: '4px' }}>
                          Detected cue: &ldquo;{item.evidenceQuote}&rdquo;
                        </div>
                      )}
                      {!item.met && (
                        <div style={{ fontSize: '0.72rem', color: '#843e06', background: 'rgba(255, 255, 255, 0.5)', padding: '4px 8px', borderRadius: '4px' }}>
                          Guidance: {item.guidance}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Strengths Summary (Cotton Surface) */}
              {feedback.strengths.length > 0 && (
                <div style={{ marginBottom: '18px' }}>
                  <div style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--color-muted-dark)', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Demonstrated Strengths ({feedback.strengths.length})
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.78rem', color: 'var(--color-ink)', lineHeight: 1.55 }}>
                    {feedback.strengths.map((str, idx) => (
                      <li key={idx}>{str}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Missing Rubric Points */}
              {feedback.missingPoints.length > 0 && (
                <div style={{ marginBottom: '18px' }}>
                  <div style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--color-muted-dark)', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Unaddressed Rubric Points ({feedback.missingPoints.length})
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.78rem', color: '#843e06', lineHeight: 1.55 }}>
                    {feedback.missingPoints.map((gap, idx) => (
                      <li key={idx}>{gap}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* ONE Next Action Card */}
              <div
                style={{
                  background: 'var(--color-cotton)',
                  border: '1px solid rgba(255, 109, 31, 0.4)',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px 16px',
                  marginTop: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <AlertCircle size={14} color="var(--color-tangerine)" aria-hidden="true" />
                  <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--color-ink)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    One Next Action
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--color-ink)', fontWeight: 600, lineHeight: 1.5 }}>
                  {feedback.nextAction}
                </p>
              </div>
            </LinenCard>
          )}
        </div>
      </div>
    </div>
  );
};
