import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCareer } from '../context/CareerContext';
import { PrimaryButton, TextButton, ProgressPill } from '../components/UIComponents';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { SEED_ROLES } from '../data/seed';

export const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const { profile, updateProfile } = useCareer();
  const [step, setStep] = useState<number>(1);

  const [displayName, setDisplayName] = useState(profile.displayName || '');
  const [branch, setBranch] = useState(profile.branch || 'Computer Science & Engineering');
  const [studyYear, setStudyYear] = useState(profile.studyYear || '3rd Year');
  const [hoursPerWeek, setHoursPerWeek] = useState(profile.hoursPerWeek || 8);
  const [selectedRoles, setSelectedRoles] = useState<string[]>(profile.preferredRoles || ['role-backend']);

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      updateProfile({
        displayName: displayName.trim() || 'Learner',
        branch,
        studyYear,
        hoursPerWeek,
        preferredRoles: selectedRoles,
        isGuestDemo: false,
      });
      navigate('/assessment');
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      navigate('/');
    }
  };

  const toggleRole = (roleId: string) => {
    if (selectedRoles.includes(roleId)) {
      if (selectedRoles.length > 1) {
        setSelectedRoles(selectedRoles.filter(id => id !== roleId));
      }
    } else {
      setSelectedRoles([...selectedRoles, roleId]);
    }
  };

  return (
    <div className="min-h-screen bg-linen text-ink flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* Top Header */}
      <div className="max-w-xl mx-auto w-full flex items-center justify-between pb-6">
        <button
          onClick={handleBack}
          className="flex items-center gap-1.5 text-xs font-medium text-ink-muted hover:text-ink transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <ProgressPill current={step} total={3} label="Profile Setup" />
      </div>

      {/* Main Interactive Step Card */}
      <div className="max-w-xl mx-auto w-full my-auto">
        <div className="bg-white rounded-2xl border border-[#deceaa] p-6 sm:p-8 shadow-sm">
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-mono uppercase text-ink-muted">Step 01</span>
                <h2 className="text-2xl font-bold text-ink mt-1">Tell us about your academic stage</h2>
                <p className="text-sm text-ink-muted mt-1">
                  Name is optional. Your information stays private in your browser.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="displayName" className="block text-xs font-semibold uppercase text-ink-muted mb-1.5">
                    Your Name <span className="text-neutral-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    id="displayName"
                    type="text"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 text-ink focus:border-tangerine focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="studyYear" className="block text-xs font-semibold uppercase text-ink-muted mb-1.5">
                    Current Study Year
                  </label>
                  <select
                    id="studyYear"
                    value={studyYear}
                    onChange={e => setStudyYear(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 text-ink focus:border-tangerine focus:outline-none"
                  >
                    <option value="1st Year">1st Year (Foundations)</option>
                    <option value="2nd Year">2nd Year (Core CS)</option>
                    <option value="3rd Year">3rd Year (Internship Prep)</option>
                    <option value="4th Year">4th Year (Placement Ready)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="branch" className="block text-xs font-semibold uppercase text-ink-muted mb-1.5">
                    Academic Branch
                  </label>
                  <input
                    id="branch"
                    type="text"
                    value={branch}
                    onChange={e => setBranch(e.target.value)}
                    placeholder="e.g. Computer Science, Information Technology, ECE"
                    className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 text-ink focus:border-tangerine focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-mono uppercase text-ink-muted">Step 02</span>
                <h2 className="text-2xl font-bold text-ink mt-1">Roles of Interest & Weekly Budget</h2>
                <p className="text-sm text-ink-muted mt-1">
                  We size your study roadmap to your real available time, avoiding burnout.
                </p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold uppercase text-ink-muted mb-2">
                    Explore Roles (Select one or more)
                  </label>
                  <div className="space-y-2">
                    {SEED_ROLES.map(role => {
                      const isSelected = selectedRoles.includes(role.id);
                      return (
                        <div
                          key={role.id}
                          onClick={() => toggleRole(role.id)}
                          className={`flex items-start justify-between p-3.5 rounded-xl border cursor-pointer transition ${
                            isSelected
                              ? 'border-tangerine bg-orange-50/60 text-ink'
                              : 'border-neutral-200 hover:border-neutral-300 text-ink'
                          }`}
                        >
                          <div>
                            <h4 className="font-semibold text-sm">{role.name}</h4>
                            <p className="text-xs text-ink-muted mt-0.5">{role.description}</p>
                          </div>
                          <div
                            className={`w-5 h-5 rounded flex items-center justify-center border mt-0.5 ${
                              isSelected ? 'bg-tangerine border-tangerine text-void' : 'border-neutral-300'
                            }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label htmlFor="hoursRange" className="text-xs font-semibold uppercase text-ink-muted">
                      Available Study Hours Per Week
                    </label>
                    <span className="font-bold text-tangerine text-sm">{hoursPerWeek} hours/week</span>
                  </div>
                  <input
                    id="hoursRange"
                    type="range"
                    min="4"
                    max="20"
                    step="1"
                    value={hoursPerWeek}
                    onChange={e => setHoursPerWeek(Number(e.target.value))}
                    className="w-full accent-tangerine cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] text-ink-muted font-mono mt-1">
                    <span>4 hrs (Light)</span>
                    <span>8 hrs (Recommended)</span>
                    <span>20 hrs (Intense)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-mono uppercase text-ink-muted">Step 03</span>
                <h2 className="text-2xl font-bold text-ink mt-1">Ready for the Skill Diagnostic?</h2>
                <p className="text-sm text-ink-muted mt-1">
                  18 focused questions across 6 core skills. It takes 8–10 minutes.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-cotton border border-[#deceaa] space-y-3 text-xs">
                <div className="font-semibold text-ink">What happens during the diagnostic?</div>
                <ul className="space-y-2 text-ink-muted">
                  <li>• Untimed mode is accessible at any time.</li>
                  <li>• Answers are scored deterministically by verified keys.</li>
                  <li>• Unanswered questions are marked as unassessed, not zero skill.</li>
                  <li>• You can pause, save, and return whenever you want.</li>
                </ul>
              </div>

              <div className="text-xs text-ink-muted font-mono">
                Preferences saved: {selectedRoles.length} role(s) selected · {hoursPerWeek} hrs/week
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Controls (fixed / sticky on mobile) */}
      <div className="max-w-xl mx-auto w-full pt-6 flex items-center justify-between border-t border-[#deceaa]/60">
        <TextButton onClick={handleBack}>
          {step === 1 ? 'Cancel' : 'Previous Step'}
        </TextButton>

        <PrimaryButton onClick={handleNext} icon={<ArrowRight className="w-4 h-4" />}>
          {step === 3 ? 'Start Diagnostic' : 'Continue'}
        </PrimaryButton>
      </div>
    </div>
  );
};
