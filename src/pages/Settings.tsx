import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCareer } from '../context/CareerContext';
import {
  DisplayHeading,
  Eyebrow,
  PrimaryButton,
  SecondaryButton,
  DarkCard,
  CottonCard,
  StatusBadge,
  SourceLabel,
} from '../components/DesignSystem';
import {
  HardDrive,
  Database,
  UserCheck,
  User,
  LogIn,
  LogOut,
  KeyRound,
  ShieldCheck,
  Sparkles,
  Download,
  Trash2,
  Type,
  FileEdit,
  Lock,
  FileText,
  Cpu,
  ExternalLink,
} from 'lucide-react';
import type { FontSizePreference } from '../types';

const FONT_SIZE_OPTIONS: Array<{
  id: FontSizePreference;
  label: string;
  sublabel: string;
  px: string;
}> = [
  { id: 'default', label: 'Default', sublabel: '16px base font', px: '16px' },
  { id: 'comfortable', label: 'Comfortable', sublabel: '17px base font', px: '17px' },
  { id: 'large', label: 'Large', sublabel: '18px base font', px: '18px' },
  { id: 'extra-large', label: 'Extra Large', sublabel: '20px base font', px: '20px' },
];

export const Settings: React.FC = () => {
  const {
    saveProfile,
    fontSizePreference,
    setFontSizePreference,
    resetFontSizePreference,
    aiMode,
    setAiMode,
    consentGiven,
    setConsentGiven,
    resetToDemo,
    loadRahulDemo,
    showToast,
    isDemoMode,
    user,
    isAuthenticated,
    isSupabaseAvailable,
    openAuthModal,
    signOut,
    exportUserData,
    eraseUserData,
  } = useCareer();

  const [saving, setSaving] = useState(false);
  const [cleared, setCleared] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveProfile({ fontSizePreference });
      showToast('Settings, reading preferences, and runtime modes saved.');
    } catch {
      showToast('Preferences saved locally in your browser.');
    } finally {
      setSaving(false);
    }
  };

  const handleClearAll = () => {
    try {
      localStorage.clear();
      setCleared(true);
      resetToDemo();
      showToast('All local storage cleared. State reset to deterministic demo.');
    } catch {
      showToast('Could not clear local storage.');
    }
  };

  const getPreviewFontSize = (pref: FontSizePreference) => {
    switch (pref) {
      case 'comfortable': return '17px';
      case 'large': return '18px';
      case 'extra-large': return '20px';
      default: return '16px';
    }
  };

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', paddingBottom: '60px' }}>
      {/* Page Context */}
      <header style={{ marginBottom: '40px' }}>
        <Eyebrow text="SYSTEM / PRIVACY, FONT SIZE & DATA BOUNDARIES" />
        <DisplayHeading level={1}>SETTINGS &amp; PRIVACY</DisplayHeading>
        <p className="muted-light" style={{ maxWidth: '580px', marginTop: '16px', fontSize: '0.94rem', lineHeight: 1.6 }}>
          Configure accessible reading scales, edit your learner horizon, review zero-retention privacy contracts, and manage account persistence.
        </p>
      </header>

      <div style={{ display: 'grid', gap: '28px' }}>
        {/* A. Font Size Preference Card */}
        <DarkCard>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Type size={20} color="var(--color-tangerine)" aria-hidden="true" />
              <div>
                <h2 style={{ margin: 0, color: 'var(--color-linen)', fontSize: '1.25rem' }}>
                  Text Size &amp; Reading Comfort
                </h2>
                <p className="muted-light" style={{ margin: '4px 0 0', fontSize: '0.84rem' }}>
                  Adjust interface text scaling for comfortable reading. Preserves display typography, body typefaces, and layout boundaries.
                </p>
              </div>
            </div>
            <StatusBadge
              variant="tangerine"
              label={`Active: ${fontSizePreference.toUpperCase()}`}
            />
          </div>

          {/* Sizing Radio Group */}
          <div
            role="radiogroup"
            aria-label="Text size preference"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))',
              gap: '12px',
              marginTop: '16px',
            }}
          >
            {FONT_SIZE_OPTIONS.map((opt) => {
              const isSelected = fontSizePreference === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => setFontSizePreference(opt.id)}
                  style={{
                    minHeight: '48px',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-sm)',
                    border: isSelected ? '2px solid var(--color-tangerine)' : '1px solid var(--color-line-dark)',
                    background: isSelected ? 'rgba(255, 109, 31, 0.14)' : 'var(--color-black-soft)',
                    color: isSelected ? 'var(--color-linen)' : 'var(--color-cotton)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    justifyContent: 'center',
                    transition: 'border-color 0.2s ease, background 0.2s ease',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{opt.label}</span>
                    {isSelected && (
                      <span style={{ color: 'var(--color-tangerine)', fontSize: '0.8rem', fontWeight: 800 }}>✓</span>
                    )}
                  </div>
                  <span style={{ fontSize: '0.74rem', color: 'var(--color-muted-light)', marginTop: '2px' }}>
                    {opt.sublabel}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Live Preview Box */}
          <div
            style={{
              marginTop: '20px',
              padding: '18px 20px',
              background: 'var(--color-black-soft)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-line-dark)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-muted-light)', fontWeight: 700 }}>
                Live Reading Scale Preview
              </span>
              <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--color-tangerine)' }}>
                {getPreviewFontSize(fontSizePreference)} root scale
              </span>
            </div>

            <div style={{ fontSize: getPreviewFontSize(fontSizePreference) }}>
              <h4 style={{ margin: '0 0 6px', fontFamily: 'var(--font-display)', fontSize: '1.25em', letterSpacing: '0.04em', color: 'var(--color-linen)' }}>
                PREVIEW: BACKEND API DEVELOPMENT &amp; ARCHITECTURE
              </h4>
              <p style={{ margin: '0 0 12px', color: 'var(--color-cotton)', fontSize: '0.9em', lineHeight: 1.55 }}>
                Designing reliable relational schemas, writing unit tests for edge cases, and building reproducible project proof.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontSize: '0.75em',
                    padding: '3px 8px',
                    borderRadius: 'var(--radius-pill)',
                    background: 'rgba(255, 109, 31, 0.15)',
                    color: 'var(--color-tangerine)',
                    fontWeight: 700,
                  }}
                >
                  CORE SKILL: SQL RELATIONAL QUERIES
                </span>
                <button
                  type="button"
                  className="button button-secondary"
                  style={{ fontSize: '0.8em', minHeight: '44px', padding: '6px 14px' }}
                  tabIndex={-1}
                >
                  Sample Action (44px) →
                </button>
              </div>
            </div>
          </div>

          {/* Reset to Default Button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '14px' }}>
            <button
              type="button"
              onClick={resetFontSizePreference}
              className="button button-quiet"
              style={{ fontSize: '0.78rem', minHeight: '44px', color: 'var(--color-muted-light)' }}
              disabled={fontSizePreference === 'default'}
              aria-label="Reset text size to default 16px"
            >
              Reset to Default (16px)
            </button>
          </div>
        </DarkCard>

        {/* B. Learner Profile & Academic Horizon Card */}
        {/* B. Learner Profile & Identity Navigation Card (Full Profile decoupled to /profile/edit) */}
        <DarkCard>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <User size={22} color="var(--color-tangerine)" aria-hidden="true" />
              <div>
                <h2 style={{ margin: 0, color: 'var(--color-linen)', fontSize: '1.25rem' }}>
                  Learner Profile &amp; Academic Horizon
                </h2>
                <p className="muted-light" style={{ margin: '4px 0 0', fontSize: '0.84rem' }}>
                  Manage your full learner profile, profile image, contact details, username, academic context, and target career path in the dedicated Profile section.
                </p>
              </div>
            </div>

            <Link
              to="/profile/edit"
              className="button button-primary"
              style={{
                textDecoration: 'none',
                minHeight: '44px',
                padding: '10px 20px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.84rem',
              }}
              aria-label="Open learner profile editor"
            >
              <FileEdit size={15} aria-hidden="true" />
              <span>Edit Profile →</span>
            </Link>
          </div>
        </DarkCard>

        {/* Account & Persistence Boundary Card */}
        <DarkCard>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Database size={20} color="var(--color-tangerine)" aria-hidden="true" />
              <div>
                <h2 style={{ margin: 0, color: 'var(--color-linen)', fontSize: '1.25rem' }}>
                  Account &amp; Persistence Boundary
                </h2>
                <p className="muted-light" style={{ margin: '4px 0 0', fontSize: '0.84rem' }}>
                  Row-Level Security (RLS) guarantees user isolation. Anonymous mode keeps data on your device.
                </p>
              </div>
            </div>
            <StatusBadge
              variant={isSupabaseAvailable ? 'success' : 'dark'}
              label={isSupabaseAvailable ? 'Supabase Backend Ready' : 'Local Storage Mode'}
            />
          </div>

          <div
            style={{
              background: 'var(--color-black-soft)',
              padding: '16px 20px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-line-dark)',
              marginTop: '14px',
            }}
          >
            {isAuthenticated ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <UserCheck size={18} color="var(--color-success)" aria-hidden="true" />
                  <div>
                    <div style={{ fontSize: '0.92rem', color: 'var(--color-linen)', fontWeight: 700 }}>
                      Signed in as {user?.email}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--color-muted-light)' }}>
                      Authenticated user · RLS policy scoped to auth.uid()
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => openAuthModal('reset')}
                    className="button button-secondary"
                    style={{ fontSize: '0.76rem', padding: '6px 12px', minHeight: '44px' }}
                  >
                    <KeyRound size={13} aria-hidden="true" />
                    Reset Password
                  </button>
                  <button
                    type="button"
                    onClick={signOut}
                    className="button button-quiet"
                    style={{ fontSize: '0.76rem', padding: '6px 12px', minHeight: '44px' }}
                  >
                    <LogOut size={13} aria-hidden="true" />
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
                <div>
                  <div style={{ fontSize: '0.92rem', color: 'var(--color-linen)', fontWeight: 700 }}>
                    Guest Learner (Unauthenticated)
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-muted-light)' }}>
                    Your assessment, preferences, and roadmap are saved locally on this browser.
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <PrimaryButton
                    onClick={() => openAuthModal('signin')}
                    style={{ fontSize: '0.78rem', padding: '8px 16px', minHeight: '44px' }}
                    icon={<LogIn size={13} />}
                  >
                    Sign In ↗
                  </PrimaryButton>
                  <SecondaryButton
                    onClick={() => openAuthModal('signup')}
                    style={{ fontSize: '0.78rem', padding: '8px 16px', minHeight: '44px' }}
                  >
                    Register
                  </SecondaryButton>
                  <button
                    type="button"
                    onClick={loadRahulDemo}
                    className="button-text"
                    style={{ fontSize: '0.78rem', color: 'var(--color-cotton)', minHeight: '44px' }}
                  >
                    <Sparkles size={13} aria-hidden="true" style={{ marginRight: '4px' }} />
                    Explore Rahul Demo
                  </button>
                </div>
              </div>
            )}
          </div>
        </DarkCard>

        {/* Runtime Mode Card */}
        <DarkCard>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 style={{ margin: '0 0 8px', color: 'var(--color-linen)', fontSize: '1.25rem' }}>
                Scoring Engine Runtime
              </h2>
              <p className="muted-light" style={{ margin: 0, fontSize: '0.85rem', maxWidth: '480px' }}>
                CareerAI functions entirely offline and deterministically without external API calls.
              </p>
            </div>
            <StatusBadge
              variant={aiMode === 'deterministic-fallback' ? 'success' : 'tangerine'}
              label={aiMode === 'deterministic-fallback' ? 'Deterministic Engine' : 'AI Enhanced'}
            />
          </div>

          <div style={{ marginTop: '20px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.88rem', minHeight: '44px' }}>
              <input
                type="radio"
                name="aiMode"
                checked={aiMode === 'deterministic-fallback'}
                onChange={() => {
                  setAiMode('deterministic-fallback');
                  showToast('Runtime switched to Pure Deterministic Engine.');
                }}
              />
              <span>Pure Deterministic (Default, Zero Network AI)</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.88rem', minHeight: '44px' }}>
              <input
                type="radio"
                name="aiMode"
                checked={aiMode === 'ai'}
                onChange={() => {
                  setAiMode('ai');
                  showToast('AI feature flag enabled for interview & resume assistance.');
                }}
              />
              <span>AI Assisted (Subject to API key configuration)</span>
            </label>
          </div>
        </DarkCard>

        {/* Data Consent Card */}
        <DarkCard>
          <h2 style={{ margin: '0 0 8px', color: 'var(--color-linen)', fontSize: '1.25rem' }}>
            Privacy &amp; Telemetry Consent
          </h2>
          <p className="muted-light" style={{ margin: '0 0 16px', fontSize: '0.85rem' }}>
            We do not sell personal data, profile students to external employers without consent, or train shared models on private resume drafts.
          </p>

          <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontSize: '0.88rem', minHeight: '44px' }}>
            <input
              type="checkbox"
              checked={consentGiven}
              onChange={e => setConsentGiven(e.target.checked)}
            />
            <span>I consent to client-side storage of my assessment progress and roadmap checklist.</span>
          </label>
        </DarkCard>

        {/* Local Storage & Guest Demo Boundary */}
        <CottonCard>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
            <HardDrive size={20} color="var(--color-ink)" aria-hidden="true" />
            <h2 style={{ margin: 0, color: 'var(--color-ink)', fontSize: '1.2rem' }}>
              Browser Storage Boundary
            </h2>
          </div>
          <p style={{ margin: '0 0 20px', fontSize: '0.85rem', color: 'var(--color-muted-dark)' }}>
            {isDemoMode
              ? 'You are running in Guest Demo mode with synthetic Rahul Sharma data. No remote backend session exists.'
              : 'Your session data is saved in browser localStorage (career_ai_state_v3).'}
          </p>

          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
            <SecondaryButton onClick={handleClearAll} style={{ minHeight: '44px' }}>
              Clear Local Data &amp; Re-seed
            </SecondaryButton>
          </div>

          {cleared && (
            <p style={{ color: 'var(--color-tangerine-deep)', fontSize: '0.8rem', marginTop: '12px', fontWeight: 600 }}>
              ✓ Storage cleared. Local storage has been reset to canonical seed data.
            </p>
          )}
        </CottonCard>

        {/* Data Export & Account Erasure Boundary */}
        <DarkCard>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
            <Trash2 size={20} color="var(--color-danger)" aria-hidden="true" />
            <h2 style={{ margin: 0, color: 'var(--color-linen)', fontSize: '1.25rem' }}>
              Data Export &amp; Account Erasure Boundary
            </h2>
          </div>
          <p className="muted-light" style={{ margin: '0 0 16px', fontSize: '0.85rem', lineHeight: 1.5 }}>
            You have full ownership of your data. You can download a complete JSON archive of your profile, assessment observations, roadmap checkpoints, and interview transcripts at any time.
          </p>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '18px' }}>
            <SecondaryButton onClick={exportUserData} icon={<Download size={14} />} style={{ minHeight: '44px' }}>
              Download My Data (JSON)
            </SecondaryButton>

            <button
              type="button"
              onClick={async () => {
                if (window.confirm('Are you sure you want to erase all your data? This will clear your profile, observations, roadmap progress, and session history.')) {
                  await eraseUserData();
                }
              }}
              className="button button-quiet"
              style={{ color: 'var(--color-danger)', borderColor: 'rgba(255, 139, 125, 0.4)', minHeight: '44px' }}
            >
              <Trash2 size={14} aria-hidden="true" />
              <span>Erase All My Data &amp; Reset</span>
            </button>
          </div>

          <div
            style={{
              padding: '14px 18px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(255, 109, 31, 0.08)',
              border: '1px solid rgba(255, 109, 31, 0.25)',
              fontSize: '0.78rem',
              color: 'var(--color-linen)',
              lineHeight: 1.5,
            }}
          >
            <strong style={{ color: 'var(--color-tangerine)' }}>Known P1 Boundary Notice: </strong>
            Full purge of Supabase Auth login credentials (auth.users identity record) requires an administrative service-role edge function that is intentionally omitted from the client for security. Clicking &ldquo;Erase All My Data&rdquo; immediately wipes all user-owned profile, observation, roadmap, and interview records in accordance with Row-Level Security.
          </div>
        </DarkCard>

        {/* C. Professional "How We Use Your Data" Section */}
        <section id="privacy" aria-labelledby="how-we-use-data-heading">
          <DarkCard style={{ border: '1px solid rgba(250, 243, 225, 0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <Lock size={20} color="var(--color-tangerine)" aria-hidden="true" />
              <h2 id="how-we-use-data-heading" style={{ margin: 0, color: 'var(--color-linen)', fontSize: '1.25rem' }}>
                How We Use Your Data
              </h2>
            </div>
            <p className="muted-light" style={{ margin: '0 0 20px', fontSize: '0.86rem', lineHeight: 1.6 }}>
              CareerAI is built around a non-negotiable trust contract. We do not monetize user data, sell student lead lists to recruiters, or expose private learning records.
            </p>

            <div style={{ display: 'grid', gap: '14px' }}>
              {/* Point 1 */}
              <div style={{ padding: '12px 16px', background: 'var(--color-black-soft)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--color-tangerine)' }}>
                <strong style={{ color: 'var(--color-linen)', fontSize: '0.88rem' }}>1. Local-First Guest Storage: </strong>
                <span style={{ color: 'var(--color-muted-light)', fontSize: '0.84rem' }}>
                  In unauthenticated guest mode, all diagnostic answers, roadmap tasks, and resume drafts are stored strictly in local browser storage (<code style={{ color: 'var(--color-tangerine)' }}>career_ai_state_v3</code>). No remote server session is initiated.
                </span>
              </div>

              {/* Point 2 */}
              <div style={{ padding: '12px 16px', background: 'var(--color-black-soft)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--color-tangerine)' }}>
                <strong style={{ color: 'var(--color-linen)', fontSize: '0.88rem' }}>2. User-Scoped Persistence: </strong>
                <span style={{ color: 'var(--color-muted-light)', fontSize: '0.84rem' }}>
                  For signed-in accounts, records are persisted into user-isolated tables. Your progress is tied strictly to your authenticated session.
                </span>
              </div>

              {/* Point 3 */}
              <div style={{ padding: '12px 16px', background: 'var(--color-black-soft)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--color-tangerine)' }}>
                <strong style={{ color: 'var(--color-linen)', fontSize: '0.88rem' }}>3. Row-Level Security (RLS): </strong>
                <span style={{ color: 'var(--color-muted-light)', fontSize: '0.84rem' }}>
                  Supabase database policies guarantee that each row can only be queried or mutated by its authenticated owner (<code style={{ color: 'var(--color-tangerine)' }}>auth.uid()</code>). Anonymous requests are denied access to user-owned tables.
                </span>
              </div>

              {/* Point 4 */}
              <div style={{ padding: '12px 16px', background: 'var(--color-black-soft)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--color-tangerine)' }}>
                <strong style={{ color: 'var(--color-linen)', fontSize: '0.88rem' }}>4. Telemetry Privacy Sanitization: </strong>
                <span style={{ color: 'var(--color-muted-light)', fontSize: '0.84rem' }}>
                  Product analytics capture only coarse feature interaction timestamps. Raw resume text, interview answer bodies, and private payload data are explicitly stripped before event logging.
                </span>
              </div>

              {/* Point 5 */}
              <div style={{ padding: '12px 16px', background: 'var(--color-black-soft)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--color-tangerine)' }}>
                <strong style={{ color: 'var(--color-linen)', fontSize: '0.88rem' }}>5. Optional AI &amp; Explicit Consent: </strong>
                <span style={{ color: 'var(--color-muted-light)', fontSize: '0.84rem' }}>
                  External AI assistance is strictly opt-in and requires prior user consent. When disabled or disconnected, CareerAI operates seamlessly via pure deterministic engines.
                </span>
              </div>

              {/* Point 6 */}
              <div style={{ padding: '12px 16px', background: 'var(--color-black-soft)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--color-tangerine)' }}>
                <strong style={{ color: 'var(--color-linen)', fontSize: '0.88rem' }}>6. Mandatory Review of AI Output: </strong>
                <span style={{ color: 'var(--color-muted-light)', fontSize: '0.84rem' }}>
                  Every AI-assisted recommendation is tagged with &ldquo;AI suggestion — review before using&rdquo; and requires candidate confirmation. We never auto-apply unverified metrics.
                </span>
              </div>

              {/* Point 7 */}
              <div style={{ padding: '12px 16px', background: 'var(--color-black-soft)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--color-tangerine)' }}>
                <strong style={{ color: 'var(--color-linen)', fontSize: '0.88rem' }}>7. No Placement or Admission Guarantees: </strong>
                <span style={{ color: 'var(--color-muted-light)', fontSize: '0.84rem' }}>
                  CareerAI provides structured educational diagnostic guidance. We do not promise employment, salaries, university admission, or job placement.
                </span>
              </div>

              {/* Point 8 */}
              <div style={{ padding: '12px 16px', background: 'var(--color-black-soft)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--color-tangerine)' }}>
                <strong style={{ color: 'var(--color-linen)', fontSize: '0.88rem' }}>8. Data Portability &amp; Export: </strong>
                <span style={{ color: 'var(--color-muted-light)', fontSize: '0.84rem' }}>
                  You have the right to download your entire learning history, observations, and resume drafts in machine-readable JSON format at any time.
                </span>
              </div>

              {/* Point 9 */}
              <div style={{ padding: '12px 16px', background: 'var(--color-black-soft)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--color-tangerine)' }}>
                <strong style={{ color: 'var(--color-linen)', fontSize: '0.88rem' }}>9. Self-Serve Data Erasure: </strong>
                <span style={{ color: 'var(--color-muted-light)', fontSize: '0.84rem' }}>
                  You can immediately wipe all your profile, assessment, roadmap, and interview records with a single click in this Settings console.
                </span>
              </div>

              {/* Point 10 */}
              <div style={{ padding: '12px 16px', background: 'var(--color-black-soft)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--color-tangerine)' }}>
                <strong style={{ color: 'var(--color-linen)', fontSize: '0.88rem' }}>10. Disclosed P1 Boundary: </strong>
                <span style={{ color: 'var(--color-muted-light)', fontSize: '0.84rem' }}>
                  Complete administrative erasure of the Supabase <code style={{ color: 'var(--color-tangerine)' }}>auth.users</code> authentication credential record requires a service-role function that is intentionally withheld from the client for security.
                </span>
              </div>
            </div>
          </DarkCard>
        </section>

        {/* D. Terms, Privacy & AI Safety Route Links */}
        <DarkCard>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <FileText size={20} color="var(--color-tangerine)" aria-hidden="true" />
            <h2 style={{ margin: 0, color: 'var(--color-linen)', fontSize: '1.25rem' }}>
              Terms &amp; Ethical AI Information
            </h2>
          </div>
          <p className="muted-light" style={{ margin: '0 0 16px', fontSize: '0.85rem' }}>
            Review our complete policies covering algorithmic transparency, intellectual property, and user privacy rights:
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
              gap: '12px',
            }}
          >
            <Link
              to="/terms"
              style={{
                padding: '14px 16px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-line-dark)',
                background: 'var(--color-black-soft)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                textDecoration: 'none',
                color: 'var(--color-linen)',
                minHeight: '44px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FileText size={16} color="var(--color-tangerine)" aria-hidden="true" />
                <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>Terms of Use</span>
              </div>
              <ExternalLink size={14} color="var(--color-muted-light)" aria-hidden="true" />
            </Link>

            <Link
              to="/privacy"
              style={{
                padding: '14px 16px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-line-dark)',
                background: 'var(--color-black-soft)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                textDecoration: 'none',
                color: 'var(--color-linen)',
                minHeight: '44px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Lock size={16} color="var(--color-tangerine)" aria-hidden="true" />
                <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>Privacy &amp; Data Policy</span>
              </div>
              <ExternalLink size={14} color="var(--color-muted-light)" aria-hidden="true" />
            </Link>

            <Link
              to="/ai-safety"
              style={{
                padding: '14px 16px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-line-dark)',
                background: 'var(--color-black-soft)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                textDecoration: 'none',
                color: 'var(--color-linen)',
                minHeight: '44px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Cpu size={16} color="var(--color-tangerine)" aria-hidden="true" />
                <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>AI Safety &amp; Ethics</span>
              </div>
              <ExternalLink size={14} color="var(--color-muted-light)" aria-hidden="true" />
            </Link>
          </div>
        </DarkCard>

        {/* Guidance & Non-Guarantee Trust Contract */}
        <CottonCard>
          <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--color-ink)', lineHeight: 1.5 }}>
            <strong>Guidance &amp; Trust Contract: </strong>
            CareerAI provides diagnostic guidance and verifiable preparation roadmaps based on canonical syllabus benchmarks.
            It does not guarantee employment, salary, job offers, or ATS screening passes.
          </p>
        </CottonCard>

        {/* Compliance Footer Card */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', paddingTop: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={16} color="var(--color-success)" aria-hidden="true" />
            <SourceLabel source="Security & RLS Boundary" date="October 2026" />
          </div>
          <PrimaryButton onClick={handleSave} disabled={saving} style={{ minHeight: '44px' }}>
            {saving ? 'Saving...' : 'Save Preferences ↗'}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
};
