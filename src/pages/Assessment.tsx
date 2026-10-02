import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCareer } from '../context/CareerContext';
import { SEED_QUESTIONS, SEED_SKILLS } from '../data/seed';
import { PrimaryButton, TextButton, StatusBadge } from '../components/UIComponents';
import { Check, Info, ArrowLeft, ArrowRight, Save, Clock } from 'lucide-react';

export const Assessment: React.FC = () => {
  const navigate = useNavigate();
  const { diagnosticAnswers, setDiagnosticAnswer, setSkillObservation } = useCareer();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [untimedMode, setUntimedMode] = useState(true);
  const [showExplanation, setShowExplanation] = useState(false);

  const currentQ = SEED_QUESTIONS[currentIndex];
  const skill = SEED_SKILLS.find(s => s.id === currentQ.skillId);
  const selectedKey = diagnosticAnswers[currentQ.id];

  const handleSelectOption = (key: string) => {
    setDiagnosticAnswer(currentQ.id, key);
  };

  const handleNext = () => {
    setShowExplanation(false);
    if (currentIndex < SEED_QUESTIONS.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      finalizeAssessment();
    }
  };

  const handlePrev = () => {
    setShowExplanation(false);
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const finalizeAssessment = () => {
    // Grade questions per skill deterministically
    const skillScores: Record<string, { correct: number; total: number }> = {};

    SEED_QUESTIONS.forEach(q => {
      if (!skillScores[q.skillId]) {
        skillScores[q.skillId] = { correct: 0, total: 0 };
      }
      const answer = diagnosticAnswers[q.id];
      if (answer) {
        skillScores[q.skillId].total += 1;
        if (answer === q.answerKey) {
          skillScores[q.skillId].correct += 1;
        }
      }
    });

    // Map correct ratio to coarse 0-4 estimate for assessed skills
    Object.entries(skillScores).forEach(([skillId, data]) => {
      if (data.total > 0) {
        const ratio = data.correct / 3; // 3 questions per skill
        let level = 0;
        if (ratio >= 0.9) level = 4;
        else if (ratio >= 0.6) level = 3;
        else if (ratio >= 0.3) level = 2;
        else level = 1;

        setSkillObservation(skillId, level);
      }
    });

    navigate('/dashboard');
  };

  const progressPercentage = Math.round(((currentIndex + 1) / SEED_QUESTIONS.length) * 100);
  const answeredCount = Object.keys(diagnosticAnswers).length;

  return (
    <div className="min-h-screen bg-void text-linen flex flex-col justify-between py-6 px-4 sm:px-6 lg:px-8">
      {/* Top Header & Progress */}
      <div className="max-w-2xl mx-auto w-full">
        <div className="flex items-center justify-between text-xs text-neutral-400 mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-1 hover:text-linen transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Exit to dashboard</span>
            </button>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setUntimedMode(!untimedMode)}
              className="flex items-center gap-1.5 px-2 py-1 rounded bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition cursor-pointer"
            >
              <Clock className="w-3.5 h-3.5 text-tangerine" />
              <span>{untimedMode ? 'Untimed (Accessible)' : 'Timed (10m)'}</span>
            </button>
            <span className="font-mono text-cotton">
              {currentIndex + 1} of {SEED_QUESTIONS.length}
            </span>
          </div>
        </div>

        {/* Linear Progress Bar */}
        <div className="w-full bg-neutral-900 h-1.5 rounded-full overflow-hidden mb-6">
          <div
            className="bg-tangerine h-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>

        {/* Notice Banner */}
        <div className="mb-6 p-3 rounded-xl bg-void-subtle border border-neutral-800 flex items-start gap-2.5 text-xs text-neutral-300">
          <Info className="w-4 h-4 text-cotton shrink-0 mt-0.5" />
          <span>
            This is a short diagnostic estimate, not a certified benchmark or placement test.
            Unanswered questions are marked as unassessed—never zero.
          </span>
        </div>
      </div>

      {/* Main Question Card (Black-Hole focus card) */}
      <div className="max-w-2xl mx-auto w-full my-auto">
        <div className="rounded-2xl bg-void-subtle border border-neutral-800 p-6 sm:p-8 shadow-2xl relative">
          {/* Category & Difficulty */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-neutral-900 border border-neutral-800 text-cotton">
                {skill?.name || currentQ.skillId}
              </span>
              <StatusBadge variant="neutral">
                {currentQ.difficulty.toUpperCase()}
              </StatusBadge>
            </div>
            <span className="text-xs font-mono text-neutral-500">v{currentQ.version}</span>
          </div>

          {/* Question Text */}
          <h2 className="text-lg sm:text-xl font-medium text-linen leading-relaxed mb-6">
            {currentQ.prompt}
          </h2>

          {/* Options */}
          <div className="space-y-3 mb-6">
            {currentQ.options.map(option => {
              const isSelected = selectedKey === option.key;
              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => handleSelectOption(option.key)}
                  className={`w-full text-left p-4 rounded-xl border transition-all flex items-start justify-between gap-3 cursor-pointer ${
                    isSelected
                      ? 'border-tangerine bg-neutral-900/90 text-linen shadow-inner'
                      : 'border-neutral-800 bg-neutral-900/40 text-neutral-300 hover:border-neutral-700 hover:text-linen'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`w-6 h-6 rounded-md flex items-center justify-center font-mono text-xs font-bold shrink-0 mt-0.5 ${
                        isSelected
                          ? 'bg-tangerine text-void'
                          : 'bg-neutral-800 text-neutral-400'
                      }`}
                    >
                      {option.key}
                    </span>
                    <span className="text-sm leading-relaxed">{option.text}</span>
                  </div>
                  {isSelected && <Check className="w-5 h-5 text-tangerine shrink-0 mt-0.5" />}
                </button>
              );
            })}
          </div>

          {/* Optional explanation toggle */}
          {selectedKey && (
            <div className="pt-2 border-t border-neutral-800/60">
              <button
                onClick={() => setShowExplanation(!showExplanation)}
                className="text-xs text-cotton hover:underline cursor-pointer flex items-center gap-1"
              >
                {showExplanation ? 'Hide rationale' : 'View verified rationale'}
              </button>
              {showExplanation && (
                <p className="mt-2 text-xs text-neutral-400 p-3 rounded-lg bg-neutral-900 border border-neutral-800">
                  {currentQ.explanation}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="max-w-2xl mx-auto w-full pt-6 flex items-center justify-between border-t border-neutral-800/80">
        <div className="flex items-center gap-2">
          <TextButton onClick={handlePrev} disabled={currentIndex === 0}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Previous
          </TextButton>

          <button
            onClick={() => {
              finalizeAssessment();
            }}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-neutral-400 hover:text-linen hover:bg-neutral-900 transition cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            Save & Exit ({answeredCount} answered)
          </button>
        </div>

        <PrimaryButton
          onClick={handleNext}
          icon={currentIndex === SEED_QUESTIONS.length - 1 ? undefined : <ArrowRight className="w-4 h-4" />}
        >
          {currentIndex === SEED_QUESTIONS.length - 1 ? 'Finish Diagnostic' : 'Next Question'}
        </PrimaryButton>
      </div>
    </div>
  );
};
