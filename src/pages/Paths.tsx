import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCareer } from '../context/CareerContext';
import { SEED_ROLES, SEED_SKILLS } from '../data/seed';
import { evaluateRoleFit } from '../lib/scoring';
import { StatusBadge } from '../components/UIComponents';
import { CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';

export const Paths: React.FC = () => {
  const navigate = useNavigate();
  const { skillObservations, selectedRoleId, setSelectedRoleId } = useCareer();

  const obsMap = new Map<string, number | null>();
  Object.entries(skillObservations).forEach(([id, val]) => obsMap.set(id, val));

  // Score each role deterministically
  const scoredRoles = SEED_ROLES.map(role => {
    const score = evaluateRoleFit(role.id, role.requirements, obsMap);
    return {
      role,
      score,
    };
  });

  // Sort adequately covered roles by alignment descending; tie-break by role.id
  scoredRoles.sort((a, b) => {
    if (a.score.isSufficientCoverage && b.score.isSufficientCoverage) {
      if (a.score.alignment !== null && b.score.alignment !== null) {
        return b.score.alignment - a.score.alignment;
      }
    }
    return a.role.id.localeCompare(b.role.id);
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="border-b border-neutral-800 pb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-mono text-cotton uppercase">Curated Industry Rubrics v1.2</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-linen">Career Direction Comparison</h1>
        <p className="text-sm text-neutral-400 mt-1 max-w-2xl">
          Evaluate entry-level roles against your demonstrated evidence. Scores are deterministic estimates—never guarantees or placement odds.
        </p>
      </div>

      {/* Role Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {scoredRoles.map(({ role, score }) => {
          const isSelected = selectedRoleId === role.id;
          const knownGaps = score.gaps.filter(g => g.gap > 0).slice(0, 2);

          return (
            <div
              key={role.id}
              className={`rounded-2xl border transition-all flex flex-col justify-between p-6 ${
                isSelected
                  ? 'bg-neutral-900 border-tangerine shadow-lg shadow-orange-950/20'
                  : 'bg-void-subtle border-neutral-800 hover:border-neutral-700'
              }`}
            >
              <div>
                {/* Header & Badges */}
                <div className="flex items-center justify-between gap-2 mb-4">
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-cotton">
                    {role.level}
                  </span>
                  <StatusBadge variant={score.isSufficientCoverage ? 'tangerine' : 'neutral'}>
                    {score.coveragePercent}% Coverage
                  </StatusBadge>
                </div>

                <h2 className="text-xl font-bold text-linen mb-2">{role.name}</h2>
                <p className="text-xs text-neutral-400 mb-4 leading-relaxed">{role.description}</p>

                {/* Score / Fit Metric */}
                <div className="p-4 rounded-xl bg-neutral-950/80 border border-neutral-800/80 mb-5">
                  <div className="text-xs font-mono text-neutral-400 mb-1">Assessed Alignment</div>
                  {score.isSufficientCoverage && score.alignment !== null ? (
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold text-linen">{score.alignment}%</span>
                      <span className="text-xs text-cotton font-mono">evidence match</span>
                    </div>
                  ) : (
                    <div className="text-sm font-semibold text-cotton flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-tangerine" />
                      More evidence needed
                    </div>
                  )}
                  <p className="text-[11px] text-neutral-500 mt-1">
                    {score.statusMessage}
                  </p>
                </div>

                {/* Top Gaps */}
                <div className="space-y-2 mb-4">
                  <span className="text-xs font-semibold text-neutral-300 block">Identified Gaps:</span>
                  {knownGaps.length > 0 ? (
                    knownGaps.map(gap => {
                      const skill = SEED_SKILLS.find(s => s.id === gap.skillId);
                      return (
                        <div
                          key={gap.skillId}
                          className="text-xs p-2 rounded-lg bg-neutral-900/60 border border-neutral-800 flex items-center justify-between text-neutral-300"
                        >
                          <span>{skill?.name || gap.skillId}</span>
                          <span className="text-cotton font-mono text-[11px]">
                            {gap.isAssessed ? `Gap: -${gap.gap}` : 'Not assessed'}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-xs text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> All core prerequisites met!
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-neutral-800/80 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-neutral-500 font-mono mb-2">
                  <span>Checked: {role.sourceCheckedAt}</span>
                  <a
                    href={role.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 hover:text-neutral-300"
                  >
                    Canonical rubric <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setSelectedRoleId(role.id);
                      navigate(`/paths/${role.id}/gaps`);
                    }}
                    className="w-full py-2.5 px-3 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-xs font-medium text-neutral-300 hover:text-linen text-center transition cursor-pointer"
                  >
                    View gaps
                  </button>

                  <button
                    onClick={() => {
                      setSelectedRoleId(role.id);
                      navigate('/roadmap');
                    }}
                    className={`w-full py-2.5 px-3 rounded-lg text-xs font-semibold text-center transition cursor-pointer ${
                      isSelected
                        ? 'bg-tangerine text-void hover:bg-orange-500'
                        : 'bg-neutral-800 text-linen hover:bg-neutral-700'
                    }`}
                  >
                    {isSelected ? 'Active Path →' : 'Select role'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
