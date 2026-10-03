import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCareer } from '../context/CareerContext';
import { ProfileEdit } from './ProfileEdit';
import { SEED_ROLES } from '../data/seedData';
import {
  DisplayHeading,
  Eyebrow,
  PrimaryButton,
  SecondaryButton,
  DarkCard,
  CottonCard,
  ProgressPill,
  ScoreMeter,
  StatusBadge,
} from '../components/DesignSystem';
import { ArrowLeft, ArrowRight, Check, Save, AlertCircle, Info, Sparkles, BookOpen } from 'lucide-react';
import { LearnerContextIntake } from '../components/LearnerContextIntake';
import { generatePathRecommendations } from '../lib/pathRecommendations';
import type { UserProfile } from '../types';

export const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const { profile, updateProfile, saveProfile, isSaving, setSelectedRoleId, showToast } = useCareer();
  const [searchParams] = useSearchParams();

  const [step, setStep] = useState<number>(1);

  // Form state initialized directly from profile
  const [profileState, setProfileState] = useState<Partial<UserProfile>>({
    displayName: profile.displayName || '',
    learnerStage: profile.learnerStage || 'undergraduate',
    schoolClass: profile.schoolClass,
    stream: profile.stream,
    degree: profile.degree || profile.branch || '',
    branch: profile.branch || '',
    studyYear: profile.studyYear || '',
    cgpa: profile.cgpa || '',
    hoursPerWeek: profile.hoursPerWeek || 10,
    locationPreference: profile.locationPreference || '',
    currentSkills: profile.currentSkills || [],
    interests: profile.interests || [],
    favoriteSubjects: profile.favoriteSubjects || [],
    preferredWorkDirection: profile.preferredWorkDirection || '',
    projectFacts: profile.projectFacts || '',
    preferredRoleIds: profile.preferredRoleIds && profile.preferredRoleIds.length > 0
      ? profile.preferredRoleIds
      : [],
  });

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateState = (updates: Partial<UserProfile>) => {
    setProfileState(prev => ({ ...prev, ...updates }));
    setErrors(prev => {
      const next = { ...prev };
      Object.keys(updates).forEach(k => delete next[k]);
      return next;
    });
  };

  // Persist current state values to draft
  const saveDraft = (notify = true) => {
    const draft: Partial<UserProfile> = {
      ...profileState,
      displayName: (profileState.displayName || '').trim(),
      isGuestDemo: false,
    };
    updateProfile(draft);
    saveProfile(draft);
    if (notify) {
      showToast('Draft saved.');
    }
  };

  const toggleRole = (roleId: number) => {
    const current = profileState.preferredRoleIds || [];
    const next = current.includes(roleId)
      ? current.filter(id => id !== roleId)
      : [...current, roleId];
    updateState({ preferredRoleIds: next });
    setErrors(prev => ({ ...prev, roles: '' }));
  };

  // Validate Step 1
  const validateStep1 = (): boolean => {
    const errs: Record<string, string> = {};
    const isSchool = profileState.learnerStage === 'class_10' || profileState.learnerStage === 'class_11_12';

    if (isSchool) {
      if (!profileState.stream) {
        updateState({ stream: 'pcm' });
      }
    } else {
      if (!profileState.branch && !profileState.degree) {
        errs.branch = 'Please select your academic branch / degree.';
      }
      if (!profileState.studyYear) {
        errs.studyYear = 'Please select your current academic year.';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Validate Step 2
  const validateStep2 = (): boolean => {
    const errs: Record<string, string> = {};
    const hours = profileState.hoursPerWeek;
    if (hours === undefined || isNaN(hours) || hours < 1 || hours > 40) {
      errs.hours = 'Weekly study commitment must be between 1 and 40 hours.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Validate Step 3
  const validateStep3 = (): boolean => {
    const errs: Record<string, string> = {};
    if (!profileState.preferredRoleIds || profileState.preferredRoleIds.length === 0) {
      errs.roles = 'Please select at least one entry role to benchmark.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleContinue = async () => {
    if (isSaving) return;
    if (step === 1) {
      if (validateStep1()) {
        saveDraft(false);
        setStep(2);
      }
    } else if (step === 2) {
      if (validateStep2()) {
        saveDraft(false);
        setStep(3);
      }
    } else if (step === 3) {
      if (validateStep3()) {
        const primaryRoleId = profileState.preferredRoleIds![0] || 1;
        const profilePayload: Partial<UserProfile> = {
          ...profileState,
          displayName: (profileState.displayName || '').trim() || 'Learner',
          targetRoleId: primaryRoleId,
          isGuestDemo: false,
        };
        updateProfile(profilePayload);
        await saveProfile(profilePayload);
        setSelectedRoleId(primaryRoleId);
        showToast('Profile created! Opening diagnostic assessment.');
        navigate('/assessment');
      }
    }
  };

  const handleBack = () => {
    setErrors({});
    if (step > 1) {
      saveDraft(false);
      setStep(step - 1);
    } else {
      navigate('/');
    }
  };

  const stepProgress = Math.round((step / 3) * 100);
  const recResult = generatePathRecommendations(profileState);
  const isSchoolStudent = recResult.isSchoolLearner;

  if (searchParams.get('mode') === 'edit') {
    return <ProfileEdit />;
  }

  return (
    <div style={{ maxWidth: '780px', margin: '0 auto' }}>
      {/* Top Controls & Browser Persistence Notice */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <button
          type="button"
          onClick={handleBack}
          className="button-text"
          style={{ fontSize: '0.8rem' }}
          aria-label={step === 1 ? 'Back to Overview' : 'Previous Step'}
        >
          <ArrowLeft size={14} aria-hidden="true" />
          <span>{step === 1 ? 'Back to Overview' : 'Previous Step'}</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>

          <button
            type="button"
            onClick={() => saveDraft(true)}
            className="button-text"
            style={{ fontSize: '0.78rem', color: 'var(--color-cotton)' }}
            title="Save your current progress to local browser storage"
          >
            <Save size={13} aria-hidden="true" />
            <span>Save Draft</span>
          </button>
        </div>
      </div>

      {/* Page Header */}
      <header style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
          <Eyebrow text={`LEARNER ONBOARDING / STEP 0${step} OF 03`} />
          <span
            style={{
              fontSize: '0.82rem',
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              color: 'var(--color-cotton)',
            }}
          >
            0{step}/03
          </span>
        </div>

        <DisplayHeading level={1}>
          {step === 1 && 'LEARNER STAGE & ACADEMIC CONTEXT'}
          {step === 2 && 'COMMITMENT & BACKGROUND'}
          {step === 3 && 'CAREER INTERESTS & BENCHMARK'}
        </DisplayHeading>

        <p className="muted-light" style={{ marginTop: '10px', fontSize: '0.94rem', lineHeight: 1.5 }}>
          {step === 1 &&
            'Tell us your learner horizon. We support Class 10/12 school students, college learners, recent graduates, and self-taught switchers without degree bias.'}
          {step === 2 &&
            'Select your genuine interests and current skills. Set an achievable study hours commitment to generate realistic milestone schedules.'}
          {step === 3 &&
            'Review personalized direction suggestions based on your background, then choose entry roles to benchmark.'}
        </p>

        <div style={{ marginTop: '16px' }}>
          <ScoreMeter score={stepProgress} />
        </div>
      </header>

      {/* Step Card */}
      <DarkCard style={{ marginBottom: '28px', padding: '32px' }}>
        {/* ================= STEP 1: LEARNER STAGE & ACADEMIC CONTEXT ================= */}
        {step === 1 && (
          <div style={{ display: 'grid', gap: '24px' }}>
            {/* Preferred Name (Optional) */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
                <label
                  htmlFor="onboarding-display-name"
                  style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--color-linen)' }}
                >
                  Your Name or Preferred Handle
                </label>
                <span style={{ fontSize: '0.74rem', color: 'var(--color-muted-light)' }}>(optional)</span>
              </div>
              <input
                id="onboarding-display-name"
                type="text"
                value={profileState.displayName || ''}
                onChange={e => updateState({ displayName: e.target.value })}
                placeholder="e.g. Rahul Sharma, Ananya, or Anonymous"
                style={{
                  width: '100%',
                  background: 'var(--color-black-soft)',
                  border: '1px solid var(--color-line-dark)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--color-linen)',
                  padding: '12px 16px',
                  fontSize: '0.9rem',
                }}
              />
            </div>

            {/* Reusable Stage & Academic Intake Component */}
            <LearnerContextIntake
              profile={profileState}
              onChange={updateState}
              errors={errors}
              mode="stage_academic"
            />

            {/* Optional CGPA (Explicitly NOT an ability signal) */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
                <label
                  htmlFor="onboarding-cgpa"
                  style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--color-linen)' }}
                >
                  CGPA / Grade Percentage
                </label>
                <span style={{ fontSize: '0.74rem', color: 'var(--color-muted-light)' }}>(optional)</span>
              </div>
              <input
                id="onboarding-cgpa"
                type="text"
                value={profileState.cgpa || ''}
                onChange={e => updateState({ cgpa: e.target.value })}
                placeholder="e.g. 7.8 / 10 or 75%"
                style={{
                  width: '100%',
                  background: 'var(--color-black-soft)',
                  border: '1px solid var(--color-line-dark)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--color-linen)',
                  padding: '12px 16px',
                  fontSize: '0.9rem',
                }}
              />
              <div
                style={{
                  marginTop: '8px',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--color-line-dark)',
                  fontSize: '0.72rem',
                  color: 'var(--color-cotton)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '6px',
                }}
              >
                <Info size={13} style={{ flexShrink: 0, marginTop: '2px', color: 'var(--color-tangerine)' }} />
                <span>
                  <strong>Strict Privacy & Fairness Rule:</strong> CGPA is an academic record only.
                  CareerAI never uses CGPA as an ability signal, skill score, or placement prediction filter.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 2: INTERESTS, SKILLS & COMMITMENT ================= */}
        {step === 2 && (
          <div style={{ display: 'grid', gap: '26px' }}>
            <LearnerContextIntake
              profile={profileState}
              onChange={updateState}
              errors={errors}
              mode="interests_skills"
            />

            {/* Location / Work Arrangement (Optional) */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
                <label
                  htmlFor="onboarding-location"
                  style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--color-linen)' }}
                >
                  Work Arrangement Preference
                </label>
                <span style={{ fontSize: '0.74rem', color: 'var(--color-muted-light)' }}>(optional)</span>
              </div>
              <select
                id="onboarding-location"
                value={profileState.locationPreference || ''}
                onChange={e => updateState({ locationPreference: e.target.value })}
                style={{
                  width: '100%',
                  background: 'var(--color-black-soft)',
                  border: '1px solid var(--color-line-dark)',
                  borderRadius: 'var(--radius-sm)',
                  color: profileState.locationPreference ? 'var(--color-linen)' : 'var(--color-muted-dark)',
                  padding: '12px 16px',
                  fontSize: '0.9rem',
                }}
              >
                <option value="">Flexible / Open to any arrangement</option>
                <option value="Remote-first">Remote-first</option>
                <option value="Hybrid">Hybrid (2-3 days office)</option>
                <option value="In-office">In-office (Tech Hubs: Bengaluru / NCR / Hyderabad / Pune)</option>
                <option value="Relocation-ready">Open to relocation anywhere</option>
              </select>
            </div>

            {/* Project Facts (Optional) */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
                <label
                  htmlFor="onboarding-project-facts"
                  style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--color-linen)' }}
                >
                  Key Coursework or Project Facts
                </label>
                <span style={{ fontSize: '0.74rem', color: 'var(--color-muted-light)' }}>(optional)</span>
              </div>
              <textarea
                id="onboarding-project-facts"
                rows={3}
                value={profileState.projectFacts || ''}
                onChange={e => updateState({ projectFacts: e.target.value })}
                placeholder="e.g. Completed Class 10 logic puzzle project in Python; or semester 4 DBMS lab repository."
                style={{
                  width: '100%',
                  background: 'var(--color-black-soft)',
                  border: '1px solid var(--color-line-dark)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--color-linen)',
                  padding: '12px 16px',
                  fontSize: '0.85rem',
                  lineHeight: 1.45,
                  resize: 'vertical',
                }}
              />
              <p style={{ margin: '6px 0 0', fontSize: '0.72rem', color: 'var(--color-muted-light)' }}>
                Factual statements about what you have worked on. Never fabricate user counts or production metrics.
              </p>
            </div>
          </div>
        )}

        {/* ================= STEP 3: PATH RECOMMENDATIONS & STARTER ROLES ================= */}
        {step === 3 && (
          <div style={{ display: 'grid', gap: '28px' }}>
            {/* Stream Opportunities for School Students */}
            {recResult.streamOpportunity && (
              <CottonCard>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <BookOpen size={16} color="var(--color-ink)" aria-hidden="true" />
                  <Eyebrow text={`STREAM-ALIGNED HORIZON / ${recResult.streamOpportunity.streamName.toUpperCase()}`} />
                </div>
                <h3 style={{ margin: '0 0 8px', fontSize: '1.1rem', color: 'var(--color-ink)' }}>
                  Opportunities for {recResult.streamOpportunity.streamName}
                </h3>
                <p style={{ margin: '0 0 12px', fontSize: '0.84rem', color: 'var(--color-muted-dark)', lineHeight: 1.45 }}>
                  {recResult.streamOpportunity.description}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                  {recResult.streamOpportunity.opportunityDirections.map((dir, idx) => (
                    <span
                      key={idx}
                      style={{
                        padding: '4px 10px',
                        background: 'rgba(34, 34, 34, 0.08)',
                        borderRadius: 'var(--radius-pill)',
                        fontSize: '0.76rem',
                        fontWeight: 600,
                        color: 'var(--color-ink)',
                      }}
                    >
                      {dir}
                    </span>
                  ))}
                </div>
                <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--color-muted-dark)', fontStyle: 'italic' }}>
                  {recResult.streamOpportunity.verificationNote}
                </p>
              </CottonCard>
            )}

            {/* Personalized Recommendations Section */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Sparkles size={16} color="var(--color-tangerine)" aria-hidden="true" />
                <h3 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--color-linen)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Suggested Directions for You
                </h3>
              </div>
              <p className="muted-light" style={{ fontSize: '0.82rem', margin: '0 0 16px' }}>
                Generated deterministically from your stage, stream, interests, and stated hours.
              </p>

              <div style={{ display: 'grid', gap: '14px', marginBottom: '24px' }}>
                {recResult.recommendations.map(rec => (
                  <div
                    key={rec.id}
                    style={{
                      background: 'var(--color-black-soft)',
                      border: '1px solid var(--color-line-dark)',
                      borderRadius: 'var(--radius-md)',
                      padding: '18px 20px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                      <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--color-linen)' }}>
                        {rec.title}
                      </h4>
                      <StatusBadge variant="tangerine" label={rec.badge} />
                    </div>

                    <p style={{ margin: '0 0 10px', fontSize: '0.82rem', color: 'var(--color-muted-light)', lineHeight: 1.45 }}>
                      <strong>Why suggested:</strong> {rec.whySuggested}
                    </p>

                    <div style={{ display: 'grid', gap: '6px', fontSize: '0.76rem', color: 'var(--color-cotton)' }}>
                      <div><strong>Inputs evaluated:</strong> {rec.contributingInputs.join(' · ')}</div>
                      <div><strong>Still unknown:</strong> {rec.unknowns.join(' · ')}</div>
                      <div><strong>Recommended next step:</strong> {rec.nextAction}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Preloaded Starter Paths (Always Present) */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--color-linen)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Starter paths — available to explore before assessment.
                </span>
                <span style={{ fontSize: '0.74rem', color: 'var(--color-tangerine)', fontWeight: 600 }}>
                  (select at least 1)
                </span>
              </div>

              {isSchoolStudent && (
                <div
                  style={{
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255, 109, 31, 0.08)',
                    border: '1px solid rgba(255, 109, 31, 0.25)',
                    fontSize: '0.78rem',
                    color: 'var(--color-cotton)',
                    marginBottom: '14px',
                  }}
                >
                  <strong>School Learner Guidance:</strong> You can begin foundation preparation now. Role readiness is not being claimed.
                </div>
              )}

              {errors.roles && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(235, 87, 87, 0.1)',
                    border: '1px solid var(--color-danger)',
                    color: 'var(--color-danger)',
                    fontSize: '0.78rem',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <AlertCircle size={14} />
                  <span>{errors.roles}</span>
                </div>
              )}

              <div style={{ display: 'grid', gap: '12px' }}>
                {SEED_ROLES.map(role => {
                  const isSelected = (profileState.preferredRoleIds || []).includes(role.id);

                  return (
                    <div
                      key={role.id}
                      role="checkbox"
                      aria-checked={isSelected}
                      tabIndex={0}
                      onClick={() => toggleRole(role.id)}
                      onKeyDown={e => {
                        if (e.key === ' ' || e.key === 'Enter') {
                          e.preventDefault();
                          toggleRole(role.id);
                        }
                      }}
                      style={{
                        padding: '18px 20px',
                        borderRadius: 'var(--radius-md)',
                        background: isSelected ? 'rgba(255, 109, 31, 0.12)' : 'var(--color-black-soft)',
                        border: isSelected ? '1px solid var(--color-tangerine)' : '1px solid var(--color-line-dark)',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ paddingRight: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                          <h3 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--color-linen)' }}>
                            {role.name}
                          </h3>
                          <ProgressPill label={role.level} />
                          <span className="source-label">{role.source_label}</span>
                        </div>
                        <p className="muted-light" style={{ margin: '6px 0 0', fontSize: '0.82rem', lineHeight: 1.45 }}>
                          {role.description}
                        </p>
                      </div>

                      <div
                        aria-hidden="true"
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          border: isSelected ? '2px solid var(--color-tangerine)' : '2px solid var(--color-line-dark)',
                          background: isSelected ? 'var(--color-tangerine)' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--color-ink)',
                          flexShrink: 0,
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {isSelected && <Check size={14} strokeWidth={3} />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </DarkCard>

      {/* Primary Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
        <SecondaryButton onClick={handleBack} icon={<ArrowLeft size={14} />}>
          {step === 1 ? 'Cancel' : 'Previous'}
        </SecondaryButton>

        <PrimaryButton onClick={handleContinue} icon={<ArrowRight size={16} />} disabled={isSaving}>
          {isSaving ? 'Saving...' : step === 3 ? 'Start Diagnostic Assessment ↗' : 'Continue ↗'}
        </PrimaryButton>
      </div>
    </div>
  );
};
