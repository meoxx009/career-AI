import { useCareer } from '../context/CareerContext';
import { SEED_ROLES } from '../data/seed';
import { CheckCircle2, Circle, ExternalLink, Clock } from 'lucide-react';

export const Roadmap: React.FC = () => {
  const { profile, selectedRoleId, roadmapTasks, toggleTaskCompletion } = useCareer();
  const currentRole = SEED_ROLES.find(r => r.id === selectedRoleId) || SEED_ROLES[0];

  const completedCount = roadmapTasks.filter(t => t.status === 'completed').length;
  const totalHours = roadmapTasks.reduce((acc, t) => acc + t.estimatedHours, 0);
  const completedHours = roadmapTasks
    .filter(t => t.status === 'completed')
    .reduce((acc, t) => acc + t.estimatedHours, 0);

  const planCompletion = Math.round((completedCount / roadmapTasks.length) * 100);

  // Group tasks by week number
  const tasksByWeek: Record<number, typeof roadmapTasks> = {};
  roadmapTasks.forEach(task => {
    if (!tasksByWeek[task.weekNumber]) {
      tasksByWeek[task.weekNumber] = [];
    }
    tasksByWeek[task.weekNumber].push(task);
  });

  const weekNumbers = Object.keys(tasksByWeek).map(Number).sort((a, b) => a - b);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Top Header */}
      <div className="border-b border-neutral-800 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-cotton uppercase">
              Target: {currentRole.name}
            </span>
          </div>
          <h1 className="text-3xl font-bold text-linen">Preparation Roadmap</h1>
          <p className="text-xs text-neutral-400 mt-1">
            Budgeted at {profile.hoursPerWeek} hours/week · Foundational tasks ordered before framework applications.
          </p>
        </div>

        {/* Progress pill */}
        <div className="p-4 rounded-xl bg-void-subtle border border-neutral-800 flex items-center gap-4">
          <div>
            <div className="text-[11px] font-mono text-neutral-400 uppercase">Plan completion</div>
            <div className="text-2xl font-bold text-linen">{planCompletion}%</div>
            <div className="text-[10px] text-cotton font-mono">Last checked: 02 Oct 2026</div>
          </div>
          <div className="w-12 h-12 rounded-full border-2 border-neutral-700 flex items-center justify-center font-mono text-xs font-bold text-tangerine">
            {completedHours}/{totalHours}h
          </div>
        </div>
      </div>

      {/* Editorial Timeline: Week cards alternating surfaces */}
      <div className="space-y-8">
        {weekNumbers.map((weekNum, index) => {
          const weekTasks = tasksByWeek[weekNum];
          const weekHours = weekTasks.reduce((acc, t) => acc + t.estimatedHours, 0);

          // Alternating surface style: 0 -> dark void, 1 -> warm linen, 2 -> cotton
          const surface = index % 3 === 0 ? 'void' : index % 3 === 1 ? 'linen' : 'cotton';

          const cardClass =
            surface === 'void'
              ? 'bg-void-subtle border-neutral-800 text-linen'
              : surface === 'linen'
              ? 'bg-linen border-[#e4dcbe] text-ink'
              : 'bg-cotton border-[#deceaa] text-ink';

          return (
            <div key={weekNum} className={`rounded-2xl border p-6 transition-all ${cardClass}`}>
              {/* Week header */}
              <div className="flex items-center justify-between border-b pb-4 mb-4 border-current/15">
                <div className="flex items-center gap-3">
                  <span
                    className={`font-mono text-xs font-bold px-2.5 py-1 rounded-md ${
                      surface === 'void'
                        ? 'bg-neutral-900 border border-neutral-800 text-cotton'
                        : 'bg-white/80 border border-[#deceaa] text-ink'
                    }`}
                  >
                    WEEK {String(weekNum).padStart(2, '0')}
                  </span>
                  <h2 className="text-lg font-bold">
                    {weekNum === 1
                      ? 'Core Logic & Database Foundations'
                      : weekNum === 2
                      ? 'API Design & Relational Modeling'
                      : 'Security, Verification & Error Resiliency'}
                  </h2>
                </div>

                <div className="flex items-center gap-3 text-xs font-mono opacity-80">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{weekHours} hrs allocated</span>
                </div>
              </div>

              {/* Week Tasks */}
              <div className="space-y-3">
                {weekTasks.map(task => {
                  const isDone = task.status === 'completed';

                  return (
                    <div
                      key={task.id}
                      className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-4 ${
                        surface === 'void'
                          ? isDone
                            ? 'bg-neutral-900/60 border-neutral-800 text-neutral-400'
                            : 'bg-neutral-900 border-neutral-700/80 text-linen'
                          : isDone
                          ? 'bg-white/50 border-[#deceaa]/60 text-neutral-500'
                          : 'bg-white border-[#deceaa] text-ink shadow-sm'
                      }`}
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleTaskCompletion(task.id)}
                            className="cursor-pointer transition hover:scale-105 shrink-0"
                            title="Toggle completion"
                          >
                            {isDone ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                            ) : (
                              <Circle className="w-5 h-5 opacity-40 hover:opacity-100" />
                            )}
                          </button>
                          <h4
                            className={`font-semibold text-sm ${
                              isDone ? 'line-through opacity-70' : ''
                            }`}
                          >
                            {task.title}
                          </h4>
                        </div>

                        <p className="text-xs opacity-80 ml-7 leading-relaxed">
                          {task.description}
                        </p>

                        <div className="ml-7 pt-1 flex flex-wrap items-center gap-3 text-[11px] font-mono opacity-75">
                          <span className="font-semibold">Deliverable: {task.deliverable}</span>
                          <span>·</span>
                          <span>{task.estimatedHours} hrs</span>
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0">
                        <a
                          href={task.resourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs underline opacity-80 hover:opacity-100 cursor-pointer"
                        >
                          Official resource <ExternalLink className="w-3 h-3" />
                        </a>

                        <button
                          onClick={() => toggleTaskCompletion(task.id)}
                          className={`text-xs px-3 py-1.5 rounded font-semibold transition cursor-pointer ${
                            isDone
                              ? 'bg-neutral-700/40 opacity-70 hover:opacity-100'
                              : 'bg-tangerine text-void hover:bg-orange-500'
                          }`}
                        >
                          {isDone ? 'Completed' : 'Mark done'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
