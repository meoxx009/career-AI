import { useState } from 'react';
import { useCareer } from '../context/CareerContext';
import { DeterministicFallbackAdapter } from '../lib/ai-adapter';
import type { ResumeReviewOutput } from '../lib/ai-adapter';
import { SafeSuggestionCard, PrimaryButton } from '../components/UIComponents';
import { Sparkles, AlertTriangle, FileText } from 'lucide-react';

export const ResumeLab: React.FC = () => {
  const { resumeDoc, updateResumeText, resumeSuggestions, setResumeSuggestions, updateSuggestionStatus } =
    useCareer();

  const [jobDescription, setJobDescription] = useState(
    'Entry-level Backend Developer. Requirements: Solid Python programming, SQLite or Postgres schema querying, familiarity with REST API endpoints, Git version control, and unit testing.'
  );

  const [reviewResult, setReviewResult] = useState<ResumeReviewOutput | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const handleRunAnalysis = () => {
    setAnalyzing(true);
    setTimeout(() => {
      try {
        const factIds = resumeDoc.facts.map(f => f.id);
        const result = DeterministicFallbackAdapter.reviewResume({
          resumeText: resumeDoc.rawText,
          jobDescription,
          targetRoleId: 'role-backend',
          factIds,
          consent: true,
        });

        setReviewResult(result);
        setResumeSuggestions(
          result.suggestions.map(s => ({
            ...s,
            status: 'pending',
          }))
        );
      } catch (err) {
        console.error(err);
      } finally {
        setAnalyzing(false);
      }
    }, 300);
  };

  const handleAcceptSuggestion = (index: number) => {
    const sug = resumeSuggestions[index];
    if (!sug) return;

    // Apply rewrite into resume text
    const updated = resumeDoc.rawText.replace(sug.original, sug.rewrite);
    updateResumeText(updated);
    updateSuggestionStatus(index, 'accepted');
  };

  const handleEditSuggestion = (index: number, newText: string) => {
    updateSuggestionStatus(index, 'edited', newText);
    const sug = resumeSuggestions[index];
    if (sug) {
      const updated = resumeDoc.rawText.replace(sug.original, newText);
      updateResumeText(updated);
    }
  };

  const handleRejectSuggestion = (index: number) => {
    updateSuggestionStatus(index, 'rejected');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="border-b border-neutral-800 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-cotton uppercase">
              Truthful Fact Extraction Engine
            </span>
          </div>
          <h1 className="text-3xl font-bold text-linen">Resume Laboratory</h1>
          <p className="text-xs text-neutral-400 mt-1 max-w-2xl">
            Edit your verified facts without inventing unearned claims. Every rewrite strictly links back to evidence you actually completed.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <PrimaryButton
            onClick={handleRunAnalysis}
            disabled={analyzing}
            icon={<Sparkles className="w-4 h-4 text-void" />}
          >
            {analyzing ? 'Evaluating...' : 'Review with JD'}
          </PrimaryButton>
        </div>
      </div>

      {/* Target JD Prompt */}
      <div className="p-4 rounded-xl bg-void-subtle border border-neutral-800">
        <label className="block text-xs font-semibold text-cotton uppercase mb-1.5">
          Target Job Description (Paste requirement snippet)
        </label>
        <textarea
          value={jobDescription}
          onChange={e => setJobDescription(e.target.value)}
          rows={2}
          className="w-full text-xs p-3 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-200 focus:outline-none focus:border-tangerine"
          placeholder="Paste job posting here..."
        />
      </div>

      {/* Split on desktop, stacked on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left / Top: Verified Facts & Editable Text */}
        <div className="lg:col-span-6 space-y-6">
          <div className="p-5 rounded-2xl bg-void-subtle border border-neutral-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-cotton" />
                <h3 className="font-semibold text-sm text-linen">Your Resume Text</h3>
              </div>
              <span className="text-xs font-mono text-neutral-500">Plain text / Editable</span>
            </div>

            <textarea
              value={resumeDoc.rawText}
              onChange={e => updateResumeText(e.target.value)}
              rows={16}
              className="w-full font-mono text-xs p-4 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-200 focus:outline-none focus:border-tangerine leading-relaxed"
            />
          </div>

          {/* Verified Source Facts Anchor */}
          <div className="p-5 rounded-2xl bg-linen text-ink border border-[#e4dcbe]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono uppercase font-semibold text-ink-muted">
                Source Facts Linked ({resumeDoc.facts.length})
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cotton text-ink border border-[#deceaa]">
                User Verified
              </span>
            </div>

            <p className="text-xs text-ink-muted mb-3">
              Only claims backed by these verified source facts can be included in suggestions.
            </p>

            <div className="space-y-2">
              {resumeDoc.facts.map(fact => (
                <div
                  key={fact.id}
                  className="p-2.5 rounded-lg bg-white border border-[#deceaa] text-xs flex items-center justify-between"
                >
                  <span className="text-ink font-medium">{fact.text}</span>
                  <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                    Verified
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right / Bottom: Feedback, Keyword Alignment & Suggestions */}
        <div className="lg:col-span-6 space-y-6">
          {/* Keyword Match Bar */}
          {reviewResult && (
            <div className="p-5 rounded-2xl bg-void-subtle border border-neutral-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm text-linen">Term & Alias Coverage</h3>
                <span className="text-xs font-mono text-cotton">
                  Mode: {reviewResult.mode}
                </span>
              </div>

              <div>
                <span className="text-[11px] font-mono text-neutral-400 block mb-1">
                  Matched in Resume ({reviewResult.matchedTerms.length}):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {reviewResult.matchedTerms.map(term => (
                    <span
                      key={term}
                      className="px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-400 border border-emerald-800/40 text-xs font-mono"
                    >
                      ✓ {term}
                    </span>
                  ))}
                </div>
              </div>

              {reviewResult.missingTerms.length > 0 && (
                <div>
                  <span className="text-[11px] font-mono text-neutral-400 block mb-1">
                    Missing from Target JD ({reviewResult.missingTerms.length}):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {reviewResult.missingTerms.map(term => (
                      <span
                        key={term}
                        className="px-2 py-0.5 rounded bg-neutral-900 text-neutral-400 border border-neutral-800 text-xs font-mono"
                      >
                        ? {term} (Learning gap)
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {reviewResult.unsupportedClaims.length > 0 && (
                <div className="p-3 rounded-lg bg-red-950/30 border border-red-800/40 text-xs text-red-300 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block">Unsupported metric detected:</span>
                    {reviewResult.unsupportedClaims.map((uc, i) => (
                      <p key={i} className="text-[11px] text-red-400 mt-0.5">
                        "{uc.text}" — {uc.reason}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Suggestions List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm text-linen">Truthful Suggestions</h3>
              <span className="text-xs text-neutral-400 font-mono">
                {resumeSuggestions.length} found
              </span>
            </div>

            {resumeSuggestions.length === 0 ? (
              <div className="p-8 rounded-2xl bg-void-subtle border border-neutral-800 text-center text-neutral-400 text-xs space-y-2">
                <FileText className="w-8 h-8 text-neutral-600 mx-auto" />
                <p className="text-neutral-300 font-medium">No active suggestions.</p>
                <p>Click "Review with JD" above to scan your resume against job criteria.</p>
              </div>
            ) : (
              resumeSuggestions.map((sug, idx) => (
                <SafeSuggestionCard
                  key={idx}
                  original={sug.original}
                  rewrite={sug.rewrite}
                  sourceFactIds={sug.sourceFactIds}
                  needsConfirmation={sug.needsConfirmation}
                  status={sug.status}
                  onAccept={() => handleAcceptSuggestion(idx)}
                  onEdit={newText => handleEditSuggestion(idx, newText)}
                  onReject={() => handleRejectSuggestion(idx)}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
