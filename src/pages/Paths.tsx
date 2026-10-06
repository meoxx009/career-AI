import React, { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCareer } from '../context/CareerContext';
import {
  DisplayHeading,
  Eyebrow,
  PrimaryButton,
  SecondaryButton,
  DarkCard,
  CottonCard,
  StatusBadge,
} from '../components/DesignSystem';
import {
  Info,
  SlidersHorizontal,
  BookOpen,
  AlertTriangle,
} from 'lucide-react';
import { LearnerContextIntake } from '../components/LearnerContextIntake';
import { generatePathRecommendations } from '../lib/pathRecommendations';
import { BranchingPathTree } from '../components/BranchingPathTree';
import type { UserProfile } from '../types';

export const Paths: React.FC = () => {
  const navigate = useNavigate();
  const {
    profile,
    updateProfile,
    saveProfile,
    skillObservations,
    selectedRoleId,
    setSelectedRoleId,
    showToast,
  } = useCareer();

  // State Model:
  // 1. Draft profile being edited
  const [draftProfile, setDraftProfile] = useState<UserProfile>(profile);
  // 2. Last successfully applied context
  const [appliedProfile, setAppliedProfile] = useState<UserProfile>(profile);
  const [applyKey, setApplyKey] = useState<number>(0);
  // Editor visibility and submission state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);

  const branchingSectionRef = useRef<HTMLDivElement>(null);

  const [prevProfile, setPrevProfile] = useState(profile);
  // Protect open draft: external profile updates only sync if editor is closed
  if (profile !== prevProfile) {
    setPrevProfile(profile);
    if (!isEditorOpen) {
      setAppliedProfile(profile);
      setDraftProfile(profile);
    }
  }

  const handleToggleEditor = () => {
    if (!isEditorOpen) {
      // Initialize draft from last applied context
      setDraftProfile({ ...appliedProfile });
      setApplyError(null);
    }
    setIsEditorOpen(!isEditorOpen);
  };

  const handleDraftChange = (updates: Partial<UserProfile>) => {
    // Field changes update draft only — no save on keystroke, no recalculation of applied results
    setDraftProfile(prev => ({ ...prev, ...updates }));
    setApplyError(null);
  };

  const handleCancelDraft = () => {
    // Cancel restores last applied values
    setDraftProfile({ ...appliedProfile });
    setApplyError(null);
    setIsEditorOpen(false);
  };

  const handleApplyDraft = async () => {
    if (isSubmitting) return;
    setApplyError(null);

    // 1. Validate complete draft
    let hours = Number(draftProfile.hoursPerWeek) || 8;
    if (hours < 1) hours = 1;
    if (hours > 40) hours = 40;

    // 2. Capture one immutable snapshot of submitted values
    const snapshot: UserProfile = {
      ...draftProfile,
      hoursPerWeek: hours,
    };

    setIsSubmitting(true);
    setApplyError(null);

    try {
      // 3. Save once through the corrected repository
      const success = await saveProfile(snapshot);

      if (!success) {
        // If saving fails, keep draft open and show error. Do not display "Applied successfully"
        setApplyError('Failed to save updated profile. Please check your connection and retry.');
        setIsSubmitting(false);
        return;
      }

      // 4. On successful save, commit the applied results from that snapshot
      setAppliedProfile(snapshot);
      updateProfile(snapshot);
      setApplyKey(prev => prev + 1);

      // 5. Close editor
      setIsEditorOpen(false);
      setIsSubmitting(false);
      setApplyError(null);

      // 6. Reveal/focus branching result area below
      showToast('Applied updated profile & interests. Directions recalculated.');
      setTimeout(() => {
        if (branchingSectionRef.current) {
          branchingSectionRef.current.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
          branchingSectionRef.current.focus?.();
        }
      }, 50);
    } catch (err) {
      setApplyError(String(err) || 'Unexpected error while applying profile.');
      setIsSubmitting(false);
    }
  };

  // Generate deterministic directions strictly from applied context snapshot
  const recResult = useMemo(() => generatePathRecommendations(appliedProfile), [appliedProfile]);
  const isSchool = recResult.isSchoolLearner;

  return (
    <div style={{ maxWidth: '1120px', margin: '0 auto' }}>
      {/* Page Header */}
      <header style={{ marginBottom: '32px' }}>
        <Eyebrow text="ROLE BENCHMARKING / DETERMINISTIC COMPARISON" />
        <DisplayHeading level={1}>CAREER PATH COMPARISON</DisplayHeading>
        <p className="muted-light" style={{ maxWidth: '760px', marginTop: '14px', fontSize: '1rem', lineHeight: 1.5 }}>
          Explore paths tailored for Class 10/12 school streams, college degrees, and self-taught learners.
          We provide transparent curriculum guidance without degree bias or job guarantees.
        </p>
        <div style={{ marginTop: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => navigate('/paths/builder')}
            className="button button-primary"
            style={{ fontSize: '0.85rem', padding: '10px 18px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <BookOpen size={16} aria-hidden="true" />
            <span>Launch Unified Path Builder (33 Careers) →</span>
          </button>
        </div>
      </header>

      {/* Learner Context & Personalization Banner */}
      <DarkCard style={{ marginBottom: '36px', padding: '24px 28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-cotton)' }}>
                CURRENT CONTEXT
              </span>
              <StatusBadge variant="tangerine" label={recResult.stageLabel} />
              {isSchool && appliedProfile.stream && (
                <StatusBadge variant="dark" label={`Stream: ${appliedProfile.stream.toUpperCase()}`} />
              )}
              {!isSchool && appliedProfile.degree && (
                <StatusBadge variant="dark" label={appliedProfile.degree} />
              )}
              <span style={{ fontSize: '0.78rem', color: 'var(--color-muted-light)' }}>
                ~{appliedProfile.hoursPerWeek || 8} hrs/week
              </span>
            </div>
            <p className="muted-light" style={{ margin: 0, fontSize: '0.86rem' }}>
              Suggestions below are calibrated to this profile. You can adjust your stage, stream, or interests at any time.
            </p>
          </div>

          <button
            type="button"
            onClick={handleToggleEditor}
            className="button button-secondary"
            style={{ fontSize: '0.8rem', padding: '8px 16px', minHeight: '36px' }}
          >
            <SlidersHorizontal size={14} aria-hidden="true" style={{ marginRight: '6px' }} />
            <span>{isEditorOpen ? 'Close Profile Editor' : 'Customize Profile & Interests'}</span>
          </button>
        </div>

        {/* Expandable Reusable Intake Component with Local Draft State */}
        {isEditorOpen && (
          <div
            id="profile-editor"
            style={{
              marginTop: '24px',
              paddingTop: '24px',
              borderTop: '1px solid var(--color-line-dark)',
            }}
          >
            <LearnerContextIntake
              profile={draftProfile}
              onChange={handleDraftChange}
              mode="all"
            />
            {applyError && (
              <div
                role="alert"
                style={{
                  marginTop: '16px',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#F87171',
                  fontSize: '0.84rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <AlertTriangle size={15} style={{ flexShrink: 0 }} />
                <span>{applyError}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <SecondaryButton
                onClick={handleCancelDraft}
                disabled={isSubmitting}
                style={{ fontSize: '0.8rem', padding: '8px 16px' }}
              >
                Cancel
              </SecondaryButton>
              <PrimaryButton
                onClick={handleApplyDraft}
                disabled={isSubmitting}
                style={{ fontSize: '0.8rem', padding: '8px 18px', opacity: isSubmitting ? 0.7 : 1 }}
              >
                {isSubmitting ? 'Applying...' : 'Apply & View Updated Directions ↗'}
              </PrimaryButton>
            </div>
          </div>
        )}
      </DarkCard>

      {/* Stream-Aligned Opportunities (for School Learners) */}
      {recResult.streamOpportunity && (
        <CottonCard style={{ marginBottom: '36px', padding: '28px 32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <BookOpen size={18} color="var(--color-ink)" aria-hidden="true" />
            <Eyebrow text={`STREAM-ALIGNED OPPORTUNITY GROUPS / ${recResult.streamOpportunity.streamName.toUpperCase()}`} />
          </div>

          <h2 style={{ margin: '0 0 10px', fontSize: '1.4rem', color: 'var(--color-ink)' }}>
            Future Opportunities for {recResult.streamOpportunity.streamName}
          </h2>

          <p style={{ margin: '0 0 16px', fontSize: '0.88rem', color: 'var(--color-muted-dark)', lineHeight: 1.5, maxWidth: '800px' }}>
            {recResult.streamOpportunity.description}
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
            {recResult.streamOpportunity.opportunityDirections?.map((dir, idx) => (
              <span
                key={idx}
                style={{
                  padding: '6px 14px',
                  background: 'rgba(34, 34, 34, 0.08)',
                  border: '1px solid rgba(34, 34, 34, 0.15)',
                  borderRadius: 'var(--radius-pill)',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: 'var(--color-ink)',
                }}
              >
                {dir}
              </span>
            ))}
          </div>

          <div
            style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(34, 34, 34, 0.04)',
              fontSize: '0.78rem',
              color: 'var(--color-muted-dark)',
              lineHeight: 1.45,
            }}
          >
            <strong>Official Verification Note: </strong>
            {recResult.streamOpportunity.verificationNote}
          </div>
        </CottonCard>
      )}

      {/* Concise Top-to-Bottom Animated Branching Path Visualization */}
      <div ref={branchingSectionRef} tabIndex={-1} style={{ outline: 'none' }}>
        <BranchingPathTree
          profile={appliedProfile}
          recommendations={recResult.recommendations}
          selectedRoleId={selectedRoleId}
          skillObservations={skillObservations}
          applyKey={applyKey}
          onActivateRole={(roleId, roleTitle) => {
            setSelectedRoleId(roleId);
            updateProfile({ targetRoleId: roleId });
            saveProfile({ targetRoleId: roleId });
            showToast(`Active roadmap direction set to ${roleTitle}.`);
          }}
          onOpenCustomizer={() => setIsEditorOpen(true)}
        />
      </div>

      {/* Bottom Trust Contract & Transparency Note */}
      <CottonCard style={{ padding: '24px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
          <Info size={18} style={{ color: 'var(--color-tangerine-deep)', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <h3 style={{ margin: '0 0 6px', fontSize: '0.96rem', color: 'var(--color-ink)' }}>
              Transparent Scoring Boundary &amp; Privacy Rule
            </h3>
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--color-ink)', lineHeight: 1.45 }}>
              All recommendations are guidance suggestions and structured exploration plans, never guaranteed admissions or hiring outcomes.
              Missing diagnostic answers are recorded as unassessed unknowns, never penalized as 0%.
              We do not scrape live job postings, predict hiring probabilities, or invent salary figures.
            </p>
          </div>
        </div>
      </CottonCard>
    </div>
  );
};
