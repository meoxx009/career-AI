import { useParams, useNavigate } from 'react-router-dom';
import { useCareer } from '../context/CareerContext';
import { SEED_ROLES, SEED_SKILLS } from '../data/seed';
import { calculateSkillGaps } from '../lib/scoring';
import { PrimaryButton, StatusBadge } from '../components/UIComponents';
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';

export const SkillGaps: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { skillObservations, setSelectedRoleId } = useCareer();

  const role = SEED_ROLES.find(r => r.id === id) || SEED_ROLES[0];

  const obsMap = new Map<string, number | null>();
  Object.entries(skillObservations).forEach(([sId, val]) => obsMap.set(sId, val));

  const gaps = calculateSkillGaps(role.requirements, obsMap);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Top Header */}
      <div className="border-b border-neutral-800 pb-6">
        <button
          onClick={() => navigate('/paths')}
          className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-linen transition mb-4 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to role comparison</span>
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-mono text-cotton uppercase">
              Prerequisite Gap Analysis
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-linen mt-1">{role.name}</h1>
            <p className="text-xs text-neutral-400 mt-1">
              Gaps are ordered strictly by foundational prerequisites first.
            </p>
          </div>

          <PrimaryButton
            onClick={() => {
              setSelectedRoleId(role.id);
              navigate('/roadmap');
            }}
            icon={<ArrowRight className="w-4 h-4" />}
          >
            Open tailored roadmap
          </PrimaryButton>
        </div>
      </div>

      {/* Vertical Gap List */}
      <div className="space-y-4">
        {gaps.map((item, index) => {
          const isFirstAction = index === 0 && item.gap > 0;
          const skill = SEED_SKILLS.find(s => s.id === item.skillId);
          const req = role.requirements.find(r => r.skillId === item.skillId);

          return (
            <div
              key={item.skillId}
              className={`rounded-2xl border p-5 sm:p-6 transition-all ${
                isFirstAction
                  ? 'bg-neutral-900 border-tangerine ring-1 ring-tangerine/30'
                  : 'bg-void-subtle border-neutral-800'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs px-2.5 py-1 rounded-md bg-neutral-950 border border-neutral-800 text-cotton">
                    Prerequisite #{item.prerequisiteOrder}
                  </span>

                  <div>
                    <h2 className="font-bold text-base text-linen">
                      {skill?.name || item.skillId}
                    </h2>
                    <span className="text-xs text-neutral-400">
                      Importance: Level {item.importance} of 3
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {item.isAssessed ? (
                    <span className="text-xs font-mono px-2.5 py-1 rounded bg-neutral-900 border border-neutral-800 text-cotton">
                      Observed: {item.observedLevel}/4 · Target: {item.targetLevel}/4
                    </span>
                  ) : (
                    <StatusBadge variant="neutral">Not assessed</StatusBadge>
                  )}

                  {isFirstAction && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-orange-950/60 text-tangerine border border-orange-800/60">
                      <Sparkles className="w-3.5 h-3.5" />
                      Priority 1 Focus
                    </span>
                  )}
                </div>
              </div>

              {/* Rationale explanation */}
              <div className="p-3.5 rounded-xl bg-neutral-950/60 border border-neutral-800/80 text-xs text-neutral-300 mb-4">
                <span className="font-semibold text-cotton block mb-0.5">Why it matters for this role:</span>
                <p className="leading-relaxed">{req?.rationale || skill?.description}</p>
              </div>

              {/* Evidence source & action */}
              <div className="flex items-center justify-between text-xs pt-2 border-t border-neutral-800/80">
                <span className="text-neutral-500 font-mono">
                  Source: {item.isAssessed ? 'Diagnostic · Oct 2026' : 'Awaiting diagnostic'}
                </span>

                <button
                  onClick={() => navigate('/roadmap')}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    isFirstAction
                      ? 'bg-tangerine text-void hover:bg-orange-500'
                      : 'bg-neutral-800 text-linen hover:bg-neutral-700'
                  }`}
                >
                  Practise this skill →
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
