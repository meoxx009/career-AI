import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCareer } from '../context/CareerContext';
import { SEED_ROLES, SEED_SKILLS } from '../data/seed';
import { evaluateRoleFit } from '../lib/scoring';
import { PrimaryButton, StatusBadge, SourceLabel } from '../components/UIComponents';
import { ArrowRight, CheckCircle2, ChevronRight, Compass, Sparkles, BookOpen } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { profile, skillObservations, selectedRoleId, roadmapTasks, toggleTaskCompletion } = useCareer();

  const currentRole = SEED_ROLES.find(r => r.id === selectedRoleId) || SEED_ROLES[0];

  // Convert skillObservations map for pure scoring engine
  const obsMap = new Map<string, number | null>();
  Object.entries(skillObservations).forEach(([id, val]) => obsMap.set(id, val));

  const scoringResult = evaluateRoleFit(currentRole.id, currentRole.requirements, obsMap);

  // Top pending task
  const nextTask = roadmapTasks.find(t => t.status === 'pending') || roadmapTasks[0];
  const completedTaskCount = roadmapTasks.filter(t => t.status === 'completed').length;
  const progressPercent = Math.round((completedTaskCount / roadmapTasks.length) * 100);

  // Top gap
  const topGap = scoringResult.gaps.find(g => g.gap > 0) || scoringResult.gaps[0];
  const topGapSkill = SEED_SKILLS.find(s => s.id === topGap?.skillId);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header Greeting & Context */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-cotton uppercase tracking-wider">
              {profile.branch} · {profile.studyYear}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-linen">
            Welcome back, {profile.displayName || 'Rahul'}
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Track your verified progress toward {currentRole.name}.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/paths')}
            className="px-3.5 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-neutral-300 hover:text-linen hover:border-neutral-700 transition cursor-pointer flex items-center gap-1.5"
          >
            <Compass className="w-3.5 h-3.5 text-tangerine" />
            <span>Switch target role</span>
          </button>
          <PrimaryButton
            onClick={() => navigate('/roadmap')}
            icon={<ArrowRight className="w-4 h-4" />}
          >
            Continue learning plan
          </PrimaryButton>
        </div>
      </div>

      {/* "Next Best Action" Tangerine Focal Card */}
      <div className="rounded-2xl bg-orange-950/30 border border-orange-700/50 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-lg">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono font-semibold text-tangerine">
            <span className="w-2 h-2 rounded-full bg-tangerine"></span>
            NEXT BEST ACTION
          </div>
          <h2 className="text-xl font-bold text-linen">
            {nextTask ? nextTask.title : 'All initial tasks completed!'}
          </h2>
          <p className="text-sm text-neutral-300 max-w-2xl">
            {nextTask ? nextTask.description : 'Explore interview practice or review your resume.'}
          </p>
          <div className="flex items-center gap-4 text-xs text-neutral-400 font-mono pt-1">
            <span>Est. effort: {nextTask?.estimatedHours || 0} hours</span>
            <span>·</span>
            <span>Deliverable: {nextTask?.deliverable || 'N/A'}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {nextTask && (
            <button
              onClick={() => toggleTaskCompletion(nextTask.id)}
              className="px-4 py-2.5 rounded-lg bg-neutral-900 border border-neutral-700 text-xs font-medium text-cotton hover:text-linen hover:border-neutral-600 transition cursor-pointer flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Mark completed</span>
            </button>
          )}
          <PrimaryButton onClick={() => navigate('/roadmap')}>
            Open task
          </PrimaryButton>
        </div>
      </div>

      {/* 3 Primary Panels: Assessed Alignment, Top Gap, Current Milestone */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Panel 1: Assessed Alignment (Dark canvas) */}
        <div className="rounded-2xl bg-void-subtle border border-neutral-800 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono uppercase text-neutral-400">Assessed Alignment</span>
              <StatusBadge variant={scoringResult.isSufficientCoverage ? 'tangerine' : 'neutral'}>
                {scoringResult.coveragePercent}% Coverage
              </StatusBadge>
            </div>

            <div className="my-3">
              {scoringResult.isSufficientCoverage && scoringResult.alignment !== null ? (
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-extrabold text-linen tracking-tight">
                    {scoringResult.alignment}%
                  </span>
                  <span className="text-xs text-neutral-400 font-mono">fit estimate</span>
                </div>
              ) : (
                <div>
                  <div className="text-xl font-semibold text-cotton">More evidence needed</div>
                  <p className="text-xs text-neutral-400 mt-1">
                    Coverage is below 60%. Complete the diagnostic to unlock a calibrated role estimate.
                  </p>
                </div>
              )}
            </div>

            <p className="text-xs text-neutral-400 mt-2">
              Based on {scoringResult.gaps.filter(g => g.isAssessed).length} of{' '}
              {currentRole.requirements.length} required skills for {currentRole.name}.
            </p>
          </div>

          <div className="pt-4 border-t border-neutral-800/80 mt-4 flex items-center justify-between text-xs">
            <SourceLabel source="Diagnostic" attempt={1} />
            <button
              onClick={() => navigate('/assessment')}
              className="text-tangerine hover:underline font-medium cursor-pointer"
            >
              Take diagnostic →
            </button>
          </div>
        </div>

        {/* Panel 2: Warm Linen Plan Card (Reflection & Roadmap) */}
        <div className="rounded-2xl bg-linen border border-[#e4dcbe] text-ink p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono uppercase text-ink-muted">Active Milestone</span>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-cotton text-ink border border-[#deceaa]">
                Week 1 of 3
              </span>
            </div>

            <h3 className="font-bold text-lg text-ink">
              Plan Completion: {progressPercent}%
            </h3>
            <div className="w-full bg-[#deceaa] h-2 rounded-full overflow-hidden my-3">
              <div
                className="bg-tangerine h-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>

            <p className="text-xs text-ink-muted leading-relaxed">
              Budgeted at {profile.hoursPerWeek} hrs/week. {completedTaskCount} of {roadmapTasks.length} tasks completed with verifiable deliverables.
            </p>
          </div>

          <div className="pt-4 border-t border-[#deceaa] mt-4 flex items-center justify-between text-xs font-mono text-ink-muted">
            <span>Last checked: Today</span>
            <button
              onClick={() => navigate('/roadmap')}
              className="font-bold text-ink underline hover:text-tangerine cursor-pointer"
            >
              Full schedule →
            </button>
          </div>
        </div>

        {/* Panel 3: Cotton Evidence Card (Top Skill Gap) */}
        <div className="rounded-2xl bg-cotton border border-[#deceaa] text-ink p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono uppercase text-ink-muted">Top Prerequisite Gap</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-linen text-ink border border-[#deceaa]">
                Order #{topGap?.prerequisiteOrder || 1}
              </span>
            </div>

            <h3 className="font-bold text-lg text-ink">
              {topGapSkill?.name || 'Skill Gap'}
            </h3>
            <p className="text-xs text-ink-muted mt-1 leading-relaxed">
              Target Level: {topGap?.targetLevel} · Observed:{' '}
              {topGap?.observedLevel !== null && topGap?.observedLevel !== undefined
                ? topGap.observedLevel
                : 'Not assessed'}
            </p>

            <div className="mt-3 p-3 rounded-lg bg-linen/90 border border-[#deceaa] text-xs">
              <span className="font-semibold text-ink block mb-0.5">Why it matters:</span>
              <p className="text-ink-muted">
                {currentRole.requirements.find(r => r.skillId === topGap?.skillId)?.rationale ||
                  'Critical foundational skill for daily role duties.'}
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-[#deceaa] mt-4 flex items-center justify-between text-xs font-mono text-ink-muted">
            <span>Priority: High</span>
            <button
              onClick={() => navigate(`/paths/${currentRole.id}/gaps`)}
              className="font-bold text-ink underline hover:text-tangerine cursor-pointer"
            >
              Examine all gaps →
            </button>
          </div>
        </div>
      </div>

      {/* Additional Quick Action Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
        <div
          onClick={() => navigate('/resume')}
          className="p-5 rounded-xl bg-void-subtle border border-neutral-800 hover:border-neutral-700 transition flex items-center justify-between cursor-pointer group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-neutral-900 flex items-center justify-center text-cotton">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-linen group-hover:text-tangerine transition-colors">
                Resume Lab
              </h4>
              <p className="text-xs text-neutral-400">
                Ground your bullet points in verified facts. No fabricated claims.
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:text-linen transition" />
        </div>

        <div
          onClick={() => navigate('/practice')}
          className="p-5 rounded-xl bg-void-subtle border border-neutral-800 hover:border-neutral-700 transition flex items-center justify-between cursor-pointer group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-neutral-900 flex items-center justify-center text-cotton">
              <Sparkles className="w-5 h-5 text-tangerine" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-linen group-hover:text-tangerine transition-colors">
                Mock Interview Room
              </h4>
              <p className="text-xs text-neutral-400">
                Practice text answers evaluated against structured technical rubrics.
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:text-linen transition" />
        </div>
      </div>
    </div>
  );
};
