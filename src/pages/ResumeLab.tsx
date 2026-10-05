import React, { useState, useMemo } from 'react';
import { useCareer } from '../context/CareerContext';
import { CAREER_CATALOGUE, getCareerPathById } from '../data/careerCatalogue';
import { DEMO_RAHUL_RESUME } from '../data/demoRahul';
import {
  analyzeResume,
  validateResumeInputLengths,
  type ResumeAnalysisResult,
} from '../lib/resumeAnalyzer';
import { RoleSelector } from '../components/RoleSelector';
import { ResumeUploader } from '../components/ResumeUploader';
import {
  DisplayHeading,
  Eyebrow,
  PrimaryButton,
  SecondaryButton,
  DarkCard,
  LinenCard,
  CottonCard,
  ScoreRing,
  StatusBadge,
  SourceLabel,
  LoadingState,
} from '../components/DesignSystem';
import {
  ShieldAlert,
  FileText,
  Check,
  X,
  Edit3,
  Printer,
  Copy,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

const DEFAULT_JDS: Record<number, string> = {
  1: 'Entry-level Junior Backend Developer. Key requirements: Python programming, SQL relational queries, REST API endpoints, Git version control, and unit testing with pytest.',
  2: 'Entry-level Junior Frontend Developer. Key requirements: HTML5, CSS3, modern JavaScript, React components and hooks, responsive design, Git, and web accessibility basics.',
  3: 'Entry-level Junior Data Analyst. Key requirements: SQL queries, joins, aggregations, Python with Pandas, Excel pivot tables, exploratory data analysis (EDA), and basic data visualization.',
  4: 'Entry-level Software Engineer. Key requirements: Object-oriented programming, data structures, algorithms, system design basics, Git, and unit testing.',
  13: 'Junior Embedded Systems Engineer. Key requirements: Embedded C/C++, microcontrollers (STM32/ESP32), GPIO, I2C, SPI, UART, real-time debugging with oscilloscopes, and hardware safety.',
  19: 'Junior AI Engineer. Key requirements: Python, foundation model APIs, prompt engineering, model evaluation, vector search, error analysis, and AI safety boundaries.',
  20: 'Junior Generative AI Engineer. Key requirements: Python, prompt engineering, structured outputs, LLM APIs, prompt testing, evaluation frameworks, and guardrails.',
  21: 'Junior LLM & RAG Application Engineer. Key requirements: Python, LangChain/LlamaIndex, vector databases, chunking strategies, embeddings, retrieval evaluation, and reranking.',
  22: 'Junior RAG Engineer. Key requirements: Dense retrieval, hybrid search, BM25, cross-encoder rerankers, vector databases, and evaluation frameworks.',
  27: 'Junior UI/UX Designer. Key requirements: Figma, user research, wireframing, component design systems, WCAG 2.1 AA accessibility, usability testing, and design tokens.',
};

export const ResumeLab: React.FC = () => {
  const {
    resumeDoc,
    updateResumeText,
    resumeSuggestions,
    setResumeSuggestions,
    updateSuggestionStatus,
    selectedRoleId,
    setSelectedRoleId,
    showToast,
    aiMode,
    setAiMode,
    reviewResumeWithAI,
    consentGiven,
  } = useCareer();

  const activeRole = useMemo(() => {
    return (typeof selectedRoleId === 'number' ? getCareerPathById(selectedRoleId) : undefined) || CAREER_CATALOGUE[0];
  }, [selectedRoleId]);

  const getRoleJd = (roleId?: number | null) => {
    const id = (roleId !== undefined && roleId !== null) ? roleId : 1;
    if (DEFAULT_JDS[id]) return DEFAULT_JDS[id];
    const p = getCareerPathById(id);
    if (p) {
      const skills = (p.coreSkills || []).join(', ');
      const deliverable = p.firstProjectDeliverable ? ` Deliverables: ${p.firstProjectDeliverable}.` : '';
      return `${p.title} (${p.level} level). Key requirements: ${skills}.${deliverable}`;
    }
    return DEFAULT_JDS[1];
  };

  const [jobDescription, setJobDescription] = useState(
    getRoleJd(selectedRoleId)
  );

  const [analysisResult, setAnalysisResult] = useState<ResumeAnalysisResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [aiNotice, setAiNotice] = useState<{ message: string; canRetry: boolean } | null>(null);
  const [uploadedFilename, setUploadedFilename] = useState<string | null>(null);
  const [ocrWarning, setOcrWarning] = useState<string | null>(null);

  const handleRunAnalysis = async () => {
    setValidationError(null);
    setAiNotice(null);
    const lengthCheck = validateResumeInputLengths(resumeDoc.rawText, jobDescription);
    if (!lengthCheck.valid) {
      setValidationError(lengthCheck.error || 'Invalid input');
      return;
    }

    setAnalyzing(true);
    try {
      if (aiMode === 'ai') {
        if (!consentGiven) {
          showToast('External AI requires privacy consent in Settings. Switched to deterministic mode.');
          const result = analyzeResume({
            resumeText: resumeDoc.rawText,
            jobDescription,
            roleId: selectedRoleId || 1,
            facts: resumeDoc.facts,
          });
          setAnalysisResult(result);
          setResumeSuggestions(result.suggestions);
          return;
        }

        const aiRes = await reviewResumeWithAI({
          resumeText: resumeDoc.rawText,
          jobDescription,
          targetRoleId: String(selectedRoleId || 1),
          roleId: String(selectedRoleId || 1),
          roleName: activeRole.title,
          facts: resumeDoc.facts,
          factIds: (resumeDoc.facts || []).map(f => f.id),
          consent: true,
        });

        // Always calculate deterministic baseline for keyword metrics & grounding
        const detResult = analyzeResume({
          resumeText: resumeDoc.rawText,
          jobDescription,
          roleId: selectedRoleId || 1,
          facts: resumeDoc.facts,
        });

        const mappedAiSuggestions = aiRes.data.suggestions.map((s, idx) => ({
          id: s.id || `ai_sug_${idx}`,
          original: s.original,
          rewrite: s.rewrite,
          reason: s.explanation || s.note,
          type: s.needsConfirmation ? 'missing_metric' : 'bullet_rewrite',
          status: 'pending' as const,
          sourceFactIds: s.sourceFactIds,
          needsConfirmation: s.needsConfirmation,
          explanation: s.explanation || s.note,
          isAiGenerated: true,
          confidence: s.confidence || (s.needsConfirmation ? 'needs_more_evidence' : 'high'),
          caveat: s.caveat,
        }));

        setAnalysisResult({
          ...detResult,
          suggestions: mappedAiSuggestions.length > 0 ? mappedAiSuggestions : detResult.suggestions,
        });
        setResumeSuggestions(mappedAiSuggestions.length > 0 ? mappedAiSuggestions : detResult.suggestions);

        if (aiRes.error) {
          setAiNotice({
            message: aiRes.error.userNotice,
            canRetry: aiRes.error.canRetry,
          });
          showToast(aiRes.error.userNotice);
        } else {
          showToast('AI resume suggestions ready — review before using.');
        }
      } else {
        const result = analyzeResume({
          resumeText: resumeDoc.rawText,
          jobDescription,
          roleId: selectedRoleId || 1,
          facts: resumeDoc.facts,
        });

        setAnalysisResult(result);
        setResumeSuggestions(result.suggestions);
        showToast('Deterministic resume audit complete.');
      }
    } catch {
      // In case of any unhandled provider crash, ensure draft is 100% preserved
      setAiNotice({
        message: 'AI assistant service encountered an issue. Switched to deterministic mode. Your draft text is preserved.',
        canRetry: true,
      });
      const result = analyzeResume({
        resumeText: resumeDoc.rawText,
        jobDescription,
        roleId: selectedRoleId,
        facts: resumeDoc.facts,
      });
      setAnalysisResult(result);
      setResumeSuggestions(result.suggestions);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAcceptSuggestion = (index: number) => {
    const sug = resumeSuggestions[index];
    if (!sug) return;
    const updated = resumeDoc.rawText.replace(sug.original, sug.rewrite);
    updateResumeText(updated);
    updateSuggestionStatus(index, 'accepted');
    showToast('Suggestion applied to resume draft.');
  };

  const handleRejectSuggestion = (index: number) => {
    updateSuggestionStatus(index, 'rejected');
    showToast('Suggestion dismissed. Original wording preserved.');
  };

  const handleSaveEdit = (index: number) => {
    const sug = resumeSuggestions[index];
    if (sug && editText.trim()) {
      const updated = resumeDoc.rawText.replace(sug.original, editText.trim());
      updateResumeText(updated);
      updateSuggestionStatus(index, 'edited', editText.trim());
      setEditingIndex(null);
      showToast('Custom edit applied to resume draft.');
    }
  };

  const handleCopyResume = async () => {
    try {
      await navigator.clipboard.writeText(resumeDoc.rawText);
      showToast('Formatted resume text copied to clipboard!');
    } catch {
      showToast('Clipboard access unavailable.');
    }
  };

  const handlePrintResume = () => {
    window.print();
  };

  const handleLoadRahulDemo = () => {
    updateResumeText(DEMO_RAHUL_RESUME.rawText);
    showToast('Loaded synthetic Rahul demo resume.');
  };

  const handleLoadGate11Sample = () => {
    updateResumeText('Built a chat application using Python.');
    showToast('Loaded Gate 11 test sample.');
  };

  const handleClearDraft = () => {
    updateResumeText('');
    setAnalysisResult(null);
    setResumeSuggestions([]);
    setUploadedFilename(null);
    setOcrWarning(null);
    showToast('Cleared resume draft.');
  };

  const resumeLength = resumeDoc.rawText.length;
  const jdLength = jobDescription.length;

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
      {/* On-screen Header */}
      <header className="no-print" style={{ marginBottom: '32px' }}>
        <Eyebrow text={`TRUTHFUL RESUME LAB / TARGET: ${activeRole.title.toUpperCase()}`} />
        <DisplayHeading level={1}>RESUME INTEGRITY LAB</DisplayHeading>
        <p className="muted-light" style={{ maxWidth: '680px', marginTop: '14px', fontSize: '1.02rem', lineHeight: 1.6 }}>
          Audit your technical statements against grounded project evidence. CareerAI never invents metrics,
          unverified user scales, fictional uptimes, or buzzwords. Every suggestion protects your credibility during technical interviews.
        </p>

        {/* Unified 33-Role Selector */}
        <div style={{ marginTop: '24px' }}>
          <RoleSelector
            selectedRoleId={selectedRoleId}
            onSelectRole={(id) => {
              setSelectedRoleId(id);
              setJobDescription(getRoleJd(id));
              setAnalysisResult(null);
            }}
            label="Target Benchmark Career Path"
            helperText="Cross-reference resume claims against verified career path keywords and grounded evidence"
          />
        </div>

        {/* Selected Benchmark Role Overview Banner */}
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
                {activeRole.category.replace('_', ' ')}
              </span>
              <span style={{ color: 'var(--color-line-dark)' }}>·</span>
              <span style={{ fontSize: '0.74rem', color: 'var(--color-linen)', fontWeight: 600 }}>
                {activeRole.level.toUpperCase()} LEVEL
              </span>
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--color-muted-light)' }}>
              Target Benchmark #{activeRole.numericId}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--color-muted-light)', lineHeight: 1.5 }}>
            {activeRole.description}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '2px' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--color-muted-light)', alignSelf: 'center', marginRight: '4px' }}>
              Core Technical Keywords:
            </span>
            {activeRole.coreSkills.map((skill) => (
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

      {/* Non-Negotiable Integrity Pledge Banner */}
      <div className="no-print" style={{ marginBottom: '28px' }}>
        <CottonCard style={{ padding: '16px 20px', display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
          <ShieldAlert size={22} color="var(--color-tangerine-deep)" style={{ flexShrink: 0, marginTop: '2px' }} aria-hidden="true" />
          <div style={{ fontSize: '0.84rem', color: 'var(--color-ink)', lineHeight: 1.55 }}>
            <strong style={{ color: 'var(--color-ink)' }}>Non-Negotiable Integrity Contract: </strong>
            Rewrites are anchored strictly in your verified code and project evidence. We never generate fictional metrics
            (such as &ldquo;1000 users&rdquo;, &ldquo;99.9% uptime&rdquo;, or &ldquo;40% reduction&rdquo;) or unearned tools.
            Rejecting any suggestion preserves your original wording.
          </div>
        </CottonCard>
      </div>

      {/* Main 2-Column Work Area (collapses sequentially on mobile) */}
      <div className="no-print responsive-two-col">
        {/* Left Column: Draft Editor & JD Inputs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Resume Document File Uploader (Local, Non-third-party) */}
          <ResumeUploader
            currentDraftText={resumeDoc.rawText}
            onExtractedText={(text, filename, isOcr, warning) => {
              updateResumeText(text);
              setUploadedFilename(filename);
              setOcrWarning(isOcr ? (warning || 'OCR was used to extract this text. Please review carefully.') : null);
              setAnalysisResult(null);
              showToast(`Extracted resume text from ${filename}.`);
            }}
            onClearUploadedFile={() => {
              setUploadedFilename(null);
              setOcrWarning(null);
            }}
            uploadedFilename={uploadedFilename}
            ocrWarning={ocrWarning}
          />

          {/* Resume Text Area */}
          <DarkCard>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={18} color="var(--color-tangerine)" aria-hidden="true" />
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--color-linen)' }}>
                  Resume Text Draft
                </h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.72rem', color: resumeLength > 10000 ? '#ef4444' : 'var(--color-muted-light)' }}>
                  {resumeLength} / 10,000 chars
                </span>
                <span className="source-label" style={{ fontSize: '0.68rem' }}>
                  {resumeDoc.facts.length} Verified Facts Grounded
                </span>
              </div>
            </div>

            <textarea
              rows={13}
              value={resumeDoc.rawText}
              onChange={e => updateResumeText(e.target.value)}
              placeholder="Paste your plain-text resume here... (minimum 10 characters)"
              style={{
                width: '100%',
                background: 'var(--color-black-soft)',
                border: '1px solid var(--color-line-dark)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-linen)',
                padding: '14px',
                fontSize: '0.86rem',
                fontFamily: 'var(--font-mono), monospace',
                lineHeight: 1.6,
                resize: 'vertical',
                boxSizing: 'border-box',
              }}
              aria-label="Resume Text Draft"
            />

            {/* Quick helper buttons & character count guidance */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--color-muted-light)' }}>
                Recommended: 200–5,000 characters
              </span>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handleLoadRahulDemo}
                  className="button-text"
                  style={{ fontSize: '0.72rem', color: 'var(--color-cotton)' }}
                >
                  <Sparkles size={11} aria-hidden="true" />
                  Load Rahul Sample
                </button>
                <button
                  type="button"
                  onClick={handleLoadGate11Sample}
                  className="button-text"
                  style={{ fontSize: '0.72rem', color: 'var(--color-tangerine)' }}
                >
                  Gate 11 Sample
                </button>
                <button
                  type="button"
                  onClick={handleClearDraft}
                  className="button-text"
                  style={{ fontSize: '0.72rem' }}
                >
                  Clear
                </button>
              </div>
            </div>
          </DarkCard>

          {/* Job Description Input */}
          <DarkCard>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--color-linen)' }}>
                Target Job Description
              </h3>
              <span style={{ fontSize: '0.72rem', color: jdLength > 5000 ? '#ef4444' : 'var(--color-muted-light)' }}>
                {jdLength} / 5,000 chars
              </span>
            </div>
            <textarea
              rows={4}
              value={jobDescription}
              onChange={e => setJobDescription(e.target.value)}
              placeholder="Paste the target job description requirements here..."
              style={{
                width: '100%',
                background: 'var(--color-black-soft)',
                border: '1px solid var(--color-line-dark)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-linen)',
                padding: '12px',
                fontSize: '0.84rem',
                lineHeight: 1.5,
                resize: 'vertical',
                boxSizing: 'border-box',
              }}
              aria-label="Target Job Description"
            />

            {validationError && (
              <div
                style={{
                  marginTop: '12px',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid #ef4444',
                  color: '#ef4444',
                  fontSize: '0.78rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
                role="alert"
              >
                <AlertCircle size={14} />
                <span>{validationError}</span>
              </div>
            )}

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
                Deterministic Audit (Default)
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
                AI Enhancement (Optional)
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
                    onClick={handleRunAnalysis}
                    className="button-text"
                    style={{ fontSize: '0.74rem', color: 'var(--color-tangerine)', fontWeight: 700, flexShrink: 0 }}
                  >
                    Retry ↺
                  </button>
                )}
              </div>
            )}

            <div style={{ marginTop: '12px' }}>
              <PrimaryButton onClick={handleRunAnalysis} disabled={analyzing} style={{ width: '100%' }}>
                {analyzing
                  ? 'Auditing Technical Claims...'
                  : aiMode === 'ai'
                  ? 'Run AI Grounded Safety Audit ↗'
                  : 'Run Grounded Safety Audit ↗'}
              </PrimaryButton>
            </div>
          </DarkCard>

          {/* Real Browser Export Controls */}
          <DarkCard style={{ padding: '18px 22px' }}>
            <h4 style={{ margin: '0 0 8px', fontSize: '0.95rem', color: 'var(--color-linen)' }}>
              Export Formatted Resume
            </h4>
            <p style={{ margin: '0 0 14px', fontSize: '0.78rem', color: 'var(--color-muted-light)', lineHeight: 1.5 }}>
              Generates 100% selectable, standard text with clean printer styling. We do not generate unreadable or locked PDFs.
            </p>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <SecondaryButton onClick={handlePrintResume} icon={<Printer size={14} />}>
                Print / Save as PDF ↗
              </SecondaryButton>
              <SecondaryButton onClick={handleCopyResume} icon={<Copy size={14} />}>
                Copy Plaintext
              </SecondaryButton>
            </div>
          </DarkCard>
        </div>

        {/* Right Column: Safety Audit Results & Actionable Suggestions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {analyzing && (
            <LoadingState
              title="Auditing Resume Statements"
              message="Cross-referencing project claims against canonical alias taxonomy and detecting ungrounded metric patterns."
            />
          )}

          {!analyzing && analysisResult && (
            <LinenCard>
              {/* Fallback Notice for Unreviewed Roles */}
              {!analysisResult.hasReviewedAliases && (
                <div
                  style={{
                    background: 'rgba(235, 137, 50, 0.12)',
                    border: '1px solid rgba(235, 137, 50, 0.4)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '12px 16px',
                    marginBottom: '16px',
                    color: 'var(--color-ink)',
                    fontSize: '0.82rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                  role="status"
                >
                  <AlertCircle size={18} color="var(--color-tangerine)" style={{ flexShrink: 0 }} />
                  <div>
                    <strong>Role Review Status: </strong>
                    {analysisResult.unreviewedNotice ||
                      'Role-specific keyword review is not available yet. You can still run the general evidence safety audit.'}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <Eyebrow
                    text={
                      analysisResult.hasReviewedAliases
                        ? 'KEYWORD ALIGNMENT HEURISTIC'
                        : 'EVIDENCE SAFETY AUDIT'
                    }
                  />
                  <h3 style={{ margin: 0, color: 'var(--color-ink)', fontSize: '1.35rem' }}>
                    {analysisResult.hasReviewedAliases && analysisResult.alignmentPercentage !== null
                      ? `${analysisResult.alignmentPercentage}% Demonstrated Alignment`
                      : 'Evidence Grounding & Metric Safety Audit'}
                  </h3>
                </div>
                {analysisResult.hasReviewedAliases && analysisResult.alignmentPercentage !== null && (
                  <ScoreRing score={analysisResult.alignmentPercentage} size={54} strokeWidth={6} />
                )}
              </div>

              {/* Mandatory Caveat */}
              <div
                style={{
                  background: 'rgba(34, 34, 34, 0.06)',
                  border: '1px solid rgba(34, 34, 34, 0.15)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '10px 14px',
                  fontSize: '0.74rem',
                  color: 'var(--color-muted-dark)',
                  marginBottom: '16px',
                  lineHeight: 1.5,
                }}
              >
                <strong>Explicit Caveat: </strong>
                {analysisResult.caveat}
              </div>

              {/* Matched Keywords */}
              <div style={{ marginBottom: '14px' }}>
                <div style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--color-muted-dark)', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Demonstrated Keywords ({analysisResult.matchedTerms.length})
                </div>
                {!analysisResult.hasReviewedAliases ? (
                  <span style={{ fontSize: '0.78rem', color: 'var(--color-muted-dark)', fontStyle: 'italic' }}>
                    Role-specific keyword taxonomy is pending domain review. General claim grounding checks are active below.
                  </span>
                ) : analysisResult.matchedTerms.length === 0 ? (
                  <span style={{ fontSize: '0.78rem', color: 'var(--color-muted-dark)' }}>None matched yet.</span>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {analysisResult.matchedTerms.map(term => (
                      <span
                        key={term}
                        style={{
                          background: 'rgba(74, 122, 60, 0.16)',
                          border: '1px solid rgba(74, 122, 60, 0.4)',
                          color: '#1e3a12',
                          padding: '3px 10px',
                          borderRadius: 'var(--radius-pill)',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                        }}
                      >
                        ✓ {term}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Missing Keywords (Learning Gaps) */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--color-muted-dark)', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Missing Role Keywords ({analysisResult.missingTerms.length})
                </div>
                {!analysisResult.hasReviewedAliases ? (
                  <span style={{ fontSize: '0.78rem', color: 'var(--color-muted-dark)', fontStyle: 'italic' }}>
                    Keyword gaps will be evaluated when role taxonomy review is published.
                  </span>
                ) : (
                  <>
                    <p style={{ margin: '0 0 8px', fontSize: '0.72rem', color: 'var(--color-muted-dark)' }}>
                      Potential learning or project opportunities. Do not insert unearned skills without hands-on work.
                    </p>
                    {analysisResult.missingTerms.length === 0 ? (
                      <span style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: 600 }}>All target keywords demonstrated!</span>
                    ) : (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {analysisResult.missingTerms.map(term => (
                          <span
                            key={term}
                            style={{
                              background: 'rgba(235, 137, 50, 0.14)',
                              border: '1px solid rgba(235, 137, 50, 0.35)',
                              color: '#843e06',
                              padding: '3px 10px',
                              borderRadius: 'var(--radius-pill)',
                              fontSize: '0.74rem',
                              fontWeight: 600,
                            }}
                          >
                            ○ {term}
                          </span>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Evidence Coverage */}
              <div style={{ fontSize: '0.74rem', color: 'var(--color-muted-dark)', marginBottom: '16px' }}>
                <strong>Evidence Grounding: </strong>
                {analysisResult.evidenceCoverage}% of project claims backed by verified facts.
              </div>

              {/* Unsupported Claims Warnings */}
              {analysisResult.unsupportedClaims.length > 0 && (
                <div
                  style={{
                    background: 'rgba(201, 78, 20, 0.12)',
                    border: '1px solid rgba(201, 78, 20, 0.45)',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-sm)',
                    marginBottom: '16px',
                  }}
                  role="alert"
                >
                  <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--color-tangerine-deep)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ShieldAlert size={15} /> Ungrounded Metric or Scale Claim Detected
                  </div>
                  <ul style={{ margin: '8px 0 0', paddingLeft: '18px', fontSize: '0.76rem', color: 'var(--color-ink)', lineHeight: 1.5 }}>
                    {analysisResult.unsupportedClaims.map((claim, cIdx) => (
                      <li key={cIdx} style={{ marginBottom: '4px' }}>
                        <strong>&ldquo;{claim.text}&rdquo;</strong>: {claim.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <SourceLabel source="Deterministic Match Engine" date="October 2026" />
            </LinenCard>
          )}

          {/* Actionable Rewrites Section */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '1.18rem', color: 'var(--color-linen)', margin: 0 }}>
                Actionable Rewrites ({resumeSuggestions.length})
              </h3>
              {resumeSuggestions.length > 0 && (
                <button
                  type="button"
                  onClick={() => setResumeSuggestions([])}
                  className="button-text"
                  style={{ fontSize: '0.72rem' }}
                >
                  Clear Suggestions
                </button>
              )}
            </div>

            {resumeSuggestions.length === 0 ? (
              <DarkCard style={{ textAlign: 'center', padding: '36px 20px' }}>
                <p className="muted-light" style={{ margin: 0, fontSize: '0.88rem' }}>
                  No pending rewrite suggestions. Click &ldquo;Run Grounded Safety Audit&rdquo; to analyze your draft.
                </p>
              </DarkCard>
            ) : (
              <div style={{ display: 'grid', gap: '14px' }}>
                {resumeSuggestions.map((sug, idx) => (
                  <DarkCard key={sug.id || idx} style={{ padding: '18px 20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <StatusBadge
                          variant={sug.status === 'accepted' ? 'success' : sug.status === 'rejected' ? 'danger' : 'cotton'}
                          label={sug.status}
                        />
                        {sug.isAiGenerated ? (
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
                        ) : (
                          <span
                            style={{
                              background: 'rgba(250, 243, 225, 0.08)',
                              color: 'var(--color-cotton)',
                              border: '1px solid var(--color-line-dark)',
                              fontSize: '0.70rem',
                              fontWeight: 600,
                              padding: '2px 8px',
                              borderRadius: 'var(--radius-pill)',
                            }}
                          >
                            Deterministic audit
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {sug.confidence && (
                          <span style={{ fontSize: '0.70rem', color: sug.confidence === 'high' ? '#10b981' : 'var(--color-cotton)' }}>
                            Confidence: {sug.confidence === 'high' ? 'High' : sug.confidence === 'medium' ? 'Medium' : 'Needs verification'}
                          </span>
                        )}
                        {sug.needsConfirmation && (
                          <span style={{ fontSize: '0.72rem', color: 'var(--color-tangerine)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <AlertCircle size={12} />
                            Requires Confirmation
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ fontSize: '0.8rem', color: 'var(--color-muted-light)', marginBottom: '8px', lineHeight: 1.5 }}>
                      <em style={{ color: 'var(--color-cotton)' }}>Original:</em> &ldquo;{sug.original}&rdquo;
                    </div>

                    {editingIndex === idx ? (
                      <div style={{ marginTop: '8px' }}>
                        <textarea
                          rows={3}
                          value={editText}
                          onChange={e => setEditText(e.target.value)}
                          style={{
                            width: '100%',
                            background: 'var(--color-black-soft)',
                            border: '1px solid var(--color-tangerine)',
                            color: 'var(--color-linen)',
                            padding: '10px',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.84rem',
                            boxSizing: 'border-box',
                          }}
                        />
                        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                          <PrimaryButton onClick={() => handleSaveEdit(idx)} style={{ minHeight: '30px', padding: '4px 12px', fontSize: '0.74rem' }}>
                            Apply Edit
                          </PrimaryButton>
                          <SecondaryButton onClick={() => setEditingIndex(null)} style={{ minHeight: '30px', padding: '4px 12px', fontSize: '0.74rem' }}>
                            Cancel
                          </SecondaryButton>
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.88rem', color: 'var(--color-linen)', fontWeight: 600, marginTop: '6px', lineHeight: 1.5 }}>
                        <em style={{ color: 'var(--color-tangerine)' }}>Suggested:</em> &ldquo;{sug.rewrite}&rdquo;
                      </div>
                    )}

                    {sug.explanation && (
                      <div style={{ fontSize: '0.74rem', color: 'var(--color-muted-light)', marginTop: '8px', lineHeight: 1.4 }}>
                        <span style={{ color: 'var(--color-cotton)' }}>Rationale: </span>
                        {sug.explanation}
                      </div>
                    )}

                    {sug.sourceFactIds && sug.sourceFactIds.length > 0 && (
                      <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                        {sug.sourceFactIds.map(fId => (
                          <span key={fId} className="source-label" style={{ fontSize: '0.66rem' }}>
                            Fact: {fId}
                          </span>
                        ))}
                      </div>
                    )}

                    {sug.status === 'pending' && editingIndex !== idx && (
                      <div style={{ display: 'flex', gap: '8px', marginTop: '14px', alignItems: 'center' }}>
                        <PrimaryButton
                          onClick={() => handleAcceptSuggestion(idx)}
                          style={{ minHeight: '32px', padding: '6px 14px', fontSize: '0.74rem' }}
                        >
                          <Check size={13} aria-hidden="true" />
                          Accept
                        </PrimaryButton>

                        <SecondaryButton
                          onClick={() => {
                            setEditingIndex(idx);
                            setEditText(sug.rewrite);
                          }}
                          style={{ minHeight: '32px', padding: '6px 14px', fontSize: '0.74rem' }}
                        >
                          <Edit3 size={13} aria-hidden="true" />
                          Edit
                        </SecondaryButton>

                        <button
                          type="button"
                          onClick={() => handleRejectSuggestion(idx)}
                          className="button-text"
                          style={{ fontSize: '0.74rem', marginLeft: 'auto', color: 'var(--color-muted-light)' }}
                        >
                          <X size={13} aria-hidden="true" />
                          Dismiss
                        </button>
                      </div>
                    )}
                  </DarkCard>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Printable Resume Document View (Hidden on screen, rendered on window.print()) */}
      <div className="resume-print-container" style={{ display: 'none' }}>
        <h2 style={{ fontSize: '1.4rem', borderBottom: '2px solid #333', paddingBottom: '6px', marginBottom: '14px' }}>
          Resume Document — Verified Technical Draft
        </h2>
        <div style={{ whiteSpace: 'pre-wrap', fontSize: '11pt', lineHeight: 1.6, color: '#111' }}>
          {resumeDoc.rawText}
        </div>
      </div>
    </div>
  );
};
