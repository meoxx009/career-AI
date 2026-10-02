import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PrimaryButton, TextButton, BentoCard } from '../components/UIComponents';
import { ArrowRight, Compass, ShieldCheck, Target, Award } from 'lucide-react';

export const Landing: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="relative overflow-hidden hero-glow">
      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-20 lg:pt-24 lg:pb-28">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Hero Left Column */}
          <div className="lg:col-span-7 flex flex-col items-start gap-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-xs font-mono text-cotton">
              <span className="w-2 h-2 rounded-full bg-tangerine"></span>
              <span>Transparent Preparation · Indian CS/IT Students</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-linen leading-[1.1]">
              Your next chapter starts with a{' '}
              <span className="text-tangerine underline decoration-neutral-800 decoration-wavy underline-offset-8">
                clear next step
              </span>
              .
            </h1>

            <p className="text-lg text-neutral-300 max-w-xl leading-relaxed">
              Find a direction, practise the skills that matter, and tell your story with confidence.
              No fake ATS scores, no placement probability myths, and no AI hallucinations.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <PrimaryButton
                onClick={() => navigate('/assessment')}
                icon={<ArrowRight className="w-4 h-4" />}
              >
                Find my direction
              </PrimaryButton>

              <TextButton onClick={() => navigate('/dashboard')}>
                Explore fictional demo (Rahul)
              </TextButton>
            </div>

            <div className="flex items-center gap-6 pt-4 text-xs text-neutral-400 font-mono">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-cotton" />
                <span>Private by default</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Target className="w-4 h-4 text-cotton" />
                <span>Deterministic scoring</span>
              </div>
            </div>
          </div>

          {/* Hero Right Column: Warm Linen Snapshot Card */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl bg-linen border border-[#e4dcbe] text-ink p-6 shadow-2xl relative">
              <div className="flex items-center justify-between border-b border-[#deceaa] pb-3 mb-4">
                <div>
                  <span className="text-xs uppercase font-mono tracking-wider text-ink-muted">
                    Readiness Snapshot
                  </span>
                  <h3 className="font-bold text-lg text-ink">Rahul Sharma · 3rd Year</h3>
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cotton text-ink border border-[#deceaa]">
                  Fictional Sample
                </span>
              </div>

              <div className="space-y-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-ink-muted">Target Path</span>
                  <span className="font-semibold text-ink">Backend Developer</span>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="font-medium text-ink-muted">Assessed Skill Alignment</span>
                    <span className="font-bold text-ink">74% · 63% Coverage</span>
                  </div>
                  <div className="w-full bg-[#deceaa] h-2.5 rounded-full overflow-hidden">
                    <div className="bg-tangerine h-full rounded-full" style={{ width: '74%' }}></div>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-cotton border border-[#deceaa] text-xs">
                  <div className="font-semibold text-ink mb-1 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-tangerine inline-block"></span>
                    Next Best Action
                  </div>
                  <p className="text-ink-muted">
                    Practise SQL aggregation & join indexing (3 hrs budget this week).
                  </p>
                </div>

                <div className="pt-2 border-t border-[#deceaa] flex items-center justify-between text-xs text-ink-muted font-mono">
                  <span>Source: Diagnostic · Oct 2026</span>
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="text-ink font-semibold underline hover:text-tangerine"
                  >
                    Open Rahul's Desk →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bento Grid: 3 Pillars */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 border-t border-neutral-800">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-linen">The Transparent Preparation Loop</h2>
          <p className="text-sm text-neutral-400 mt-2">
            Every step explains where you are, what evidence exists, and what to practise next.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <BentoCard surface="void" className="flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center text-tangerine mb-4">
                <Compass className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg text-linen mb-2">1. Choose a Direction</h3>
              <p className="text-sm text-neutral-400 leading-relaxed">
                Compare entry-level roles (Backend, Frontend, Data Analyst) based on verified requirements. Unknown skills are labelled as unassessed—never zero.
              </p>
            </div>
            <div className="pt-6 border-t border-neutral-800/60 mt-6 text-xs text-cotton font-mono">
              Role requirements v1.2
            </div>
          </BentoCard>

          <BentoCard surface="linen" className="flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-cotton border border-[#deceaa] flex items-center justify-center text-tangerine mb-4">
                <Target className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg text-ink mb-2">2. Build a Plan</h3>
              <p className="text-sm text-ink-muted leading-relaxed">
                Prerequisite-aware roadmap fitted to your exact weekly hours. Foundational fundamentals are prioritized before complex frameworks.
              </p>
            </div>
            <div className="pt-6 border-t border-[#deceaa] mt-6 text-xs text-ink-muted font-mono">
              Priced in 6–8 hrs / week
            </div>
          </BentoCard>

          <BentoCard surface="cotton" className="flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-linen border border-[#deceaa] flex items-center justify-center text-tangerine mb-4">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg text-ink mb-2">3. Practise with Proof</h3>
              <p className="text-sm text-ink-muted leading-relaxed">
                Resume review and interview practice anchored strictly to facts you actually completed. Zero fabricated metrics or hallucinated experience.
              </p>
            </div>
            <div className="pt-6 border-t border-[#deceaa] mt-6 text-xs text-ink-muted font-mono">
              Truthful Evidence Engine
            </div>
          </BentoCard>
        </div>
      </section>

      {/* Trust Banner */}
      <section className="bg-void-subtle border-t border-b border-neutral-800 py-12 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h4 className="text-lg font-bold text-linen">Our Engineering Guarantee</h4>
            <p className="text-xs text-neutral-400 mt-1 max-w-xl">
              CareerAI is deterministic by design. We run offline fallback rules if AI is unavailable, and never use psychometric tests, protected traits, or false decimal precision.
            </p>
          </div>
          <PrimaryButton onClick={() => navigate('/assessment')}>
            Start Diagnostic
          </PrimaryButton>
        </div>
      </section>
    </div>
  );
};
