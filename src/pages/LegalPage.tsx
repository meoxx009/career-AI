import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  DisplayHeading,
  Eyebrow,
  DarkCard,
  CottonCard,
} from '../components/DesignSystem';
import {
  FileText,
  Lock,
  Cpu,
  ArrowLeft,
  Info,
} from 'lucide-react';

export type LegalTab = 'terms' | 'privacy' | 'ai-safety';

interface LegalPageProps {
  initialTab?: LegalTab;
}

export const LegalPage: React.FC<LegalPageProps> = ({ initialTab }) => {
  const location = useLocation();

  const activeTab: LegalTab = initialTab || (() => {
    if (location.pathname.includes('/privacy')) return 'privacy';
    if (location.pathname.includes('/ai-safety') || location.pathname.includes('/safety')) return 'ai-safety';
    return 'terms';
  })();

  const lastUpdated = 'October 2026';

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', paddingBottom: '60px' }}>
      {/* Navigation Header & Back Link */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <Link
          to="/settings"
          className="button-text"
          style={{ fontSize: '0.84rem', color: 'var(--color-cotton)' }}
        >
          <ArrowLeft size={15} aria-hidden="true" style={{ marginRight: '6px' }} />
          Return to Settings
        </Link>
        <span style={{ fontSize: '0.78rem', color: 'var(--color-muted-light)' }}>
          Last updated: {lastUpdated} · Version 1.0 (MVP)
        </span>
      </div>

      <header style={{ marginBottom: '32px' }}>
        <Eyebrow text="TRUST, TRANSPARENCY & ETHICAL AI BOUNDARIES" />
        <DisplayHeading level={1}>
          {activeTab === 'terms' && 'TERMS OF SERVICE'}
          {activeTab === 'privacy' && 'PRIVACY & DATA POLICY'}
          {activeTab === 'ai-safety' && 'AI SAFETY & ETHICAL CONTRACT'}
        </DisplayHeading>
        <p className="muted-light" style={{ maxWidth: '640px', marginTop: '12px', fontSize: '0.94rem', lineHeight: 1.6 }}>
          CareerAI is an evidence-first, open-syllabus career preparation assistant. We operate under explicit trust, user data ownership, and strict non-fabrication rules.
        </p>

        {/* Tab Navigation */}
        <nav
          aria-label="Legal sections navigation"
          style={{
            display: 'flex',
            gap: '8px',
            marginTop: '24px',
            borderBottom: '1px solid var(--color-line-dark)',
            paddingBottom: '12px',
            flexWrap: 'wrap',
          }}
        >
          <Link
            to="/terms"
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-pill)',
              background: activeTab === 'terms' ? 'rgba(255, 109, 31, 0.16)' : 'transparent',
              color: activeTab === 'terms' ? 'var(--color-tangerine)' : 'var(--color-muted-light)',
              border: activeTab === 'terms' ? '1px solid var(--color-tangerine)' : '1px solid transparent',
              fontWeight: activeTab === 'terms' ? 700 : 500,
              fontSize: '0.82rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              textDecoration: 'none',
              minHeight: '44px',
            }}
          >
            <FileText size={15} aria-hidden="true" />
            Terms of Use
          </Link>

          <Link
            to="/privacy"
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-pill)',
              background: activeTab === 'privacy' ? 'rgba(255, 109, 31, 0.16)' : 'transparent',
              color: activeTab === 'privacy' ? 'var(--color-tangerine)' : 'var(--color-muted-light)',
              border: activeTab === 'privacy' ? '1px solid var(--color-tangerine)' : '1px solid transparent',
              fontWeight: activeTab === 'privacy' ? 700 : 500,
              fontSize: '0.82rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              textDecoration: 'none',
              minHeight: '44px',
            }}
          >
            <Lock size={15} aria-hidden="true" />
            Privacy &amp; Data
          </Link>

          <Link
            to="/ai-safety"
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-pill)',
              background: activeTab === 'ai-safety' ? 'rgba(255, 109, 31, 0.16)' : 'transparent',
              color: activeTab === 'ai-safety' ? 'var(--color-tangerine)' : 'var(--color-muted-light)',
              border: activeTab === 'ai-safety' ? '1px solid var(--color-tangerine)' : '1px solid transparent',
              fontWeight: activeTab === 'ai-safety' ? 700 : 500,
              fontSize: '0.82rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              textDecoration: 'none',
              minHeight: '44px',
            }}
          >
            <Cpu size={15} aria-hidden="true" />
            AI Safety &amp; Ethics
          </Link>
        </nav>
      </header>

      {/* Plain-Language Summary Box */}
      <CottonCard style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <Info size={20} color="var(--color-ink)" style={{ flexShrink: 0, marginTop: '2px' }} aria-hidden="true" />
          <div>
            <h2 style={{ margin: '0 0 6px', fontSize: '1.05rem', color: 'var(--color-ink)', fontWeight: 700 }}>
              Plain-Language Summary
            </h2>
            <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--color-muted-dark)', lineHeight: 1.55 }}>
              {activeTab === 'terms' && (
                <>
                  CareerAI provides educational diagnostics and self-paced career roadmaps. It does not promise jobs, salaries, admission, or certification. You own your resume drafts and answers. We never sell your data or fabricate resume achievements.
                </>
              )}
              {activeTab === 'privacy' && (
                <>
                  By default, all your answers and progress remain entirely in your browser&apos;s local storage. When you sign in, your data is isolated using PostgreSQL Row-Level Security (RLS). We never include private resume text or interview recordings in telemetry analytics.
                </>
              )}
              {activeTab === 'ai-safety' && (
                <>
                  All core features function completely offline using pure deterministic algorithms. AI features are optional, require prior explicit consent, use secure server-side keys (never in client bundles), and strictly prohibit hallucinating metrics or claims.
                </>
              )}
            </p>
          </div>
        </div>
      </CottonCard>

      {/* 9 Professional Sections */}
      <div style={{ display: 'grid', gap: '24px' }}>
        {/* Section 1 */}
        <DarkCard>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <h2 style={{ margin: 0, fontSize: '1.18rem', color: 'var(--color-linen)' }}>
              <span style={{ color: 'var(--color-tangerine)', fontWeight: 800, fontSize: '0.9rem', fontFamily: 'var(--font-mono)', marginRight: '8px' }}>01.</span>
              What CareerAI Provides
            </h2>
          </div>
          <p className="muted-light" style={{ margin: 0, fontSize: '0.86rem', lineHeight: 1.6 }}>
            CareerAI provides diagnostic skill assessment, benchmark career curricula, time-budgeted study roadmaps, text-based technical and behavioural interview practice, and grounded resume keyword alignment feedback. All benchmarks are derived from public technical syllabi and standard industry job descriptions.
          </p>
        </DarkCard>

        {/* Section 2 */}
        <DarkCard>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <h2 style={{ margin: 0, fontSize: '1.18rem', color: 'var(--color-linen)' }}>
              <span style={{ color: 'var(--color-tangerine)', fontWeight: 800, fontSize: '0.9rem', fontFamily: 'var(--font-mono)', marginRight: '8px' }}>02.</span>
              What CareerAI Does Not Provide
            </h2>
          </div>
          <p className="muted-light" style={{ margin: '0 0 10px', fontSize: '0.86rem', lineHeight: 1.6 }}>
            CareerAI is strictly an educational preparation tool. CareerAI does <strong>not</strong> provide:
          </p>
          <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--color-muted-light)', fontSize: '0.84rem', lineHeight: 1.6 }}>
            <li>Guaranteed employment, job placement, campus recruitment offers, or interview invitations;</li>
            <li>Salary predictions, compensation promises, or economic guarantees;</li>
            <li>Accredited academic degrees, formal certificates of competency, or government exam credentials;</li>
            <li>Proprietary Applicant Tracking System (ATS) bypass mechanisms or pass rate promises;</li>
            <li>Automated hiring decisions, candidate ranking for recruiters, or pass/fail determinations.</li>
          </ul>
        </DarkCard>

        {/* Section 3 */}
        <DarkCard>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <h2 style={{ margin: 0, fontSize: '1.18rem', color: 'var(--color-linen)' }}>
              <span style={{ color: 'var(--color-tangerine)', fontWeight: 800, fontSize: '0.9rem', fontFamily: 'var(--font-mono)', marginRight: '8px' }}>03.</span>
              User-Provided Content
            </h2>
          </div>
          <p className="muted-light" style={{ margin: 0, fontSize: '0.86rem', lineHeight: 1.6 }}>
            You retain 100% intellectual property ownership of your resume drafts, project notes, and interview answers. CareerAI does not license, resell, or distribute your private content to recruitment agencies, data brokers, or third-party foundation model trainers.
          </p>
        </DarkCard>

        {/* Section 4 */}
        <DarkCard>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <h2 style={{ margin: 0, fontSize: '1.18rem', color: 'var(--color-linen)' }}>
              <span style={{ color: 'var(--color-tangerine)', fontWeight: 800, fontSize: '0.9rem', fontFamily: 'var(--font-mono)', marginRight: '8px' }}>04.</span>
              Local Storage and Account Persistence
            </h2>
          </div>
          <p className="muted-light" style={{ margin: 0, fontSize: '0.86rem', lineHeight: 1.6 }}>
            In Guest Mode, all application state (diagnostic answers, study roadmap, and resume edits) is stored solely in your client browser via HTML5 localStorage (<code style={{ color: 'var(--color-tangerine)' }}>career_ai_state_v3</code>). When you choose to create an authenticated account, records are synchronized to Supabase with PostgreSQL Row-Level Security (RLS) policies scoped strictly to <code style={{ color: 'var(--color-tangerine)' }}>auth.uid()</code>. Anonymous callers cannot access authenticated user tables.
          </p>
        </DarkCard>

        {/* Section 5 */}
        <DarkCard>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <h2 style={{ margin: 0, fontSize: '1.18rem', color: 'var(--color-linen)' }}>
              <span style={{ color: 'var(--color-tangerine)', fontWeight: 800, fontSize: '0.9rem', fontFamily: 'var(--font-mono)', marginRight: '8px' }}>05.</span>
              Optional AI Processing and Consent
            </h2>
          </div>
          <p className="muted-light" style={{ margin: '0 0 10px', fontSize: '0.86rem', lineHeight: 1.6 }}>
            External AI processing is entirely optional. When disabled or when network connectivity is lost, the platform falls back seamlessly to offline, deterministic keyword rubrics and math scoring.
          </p>
          <p className="muted-light" style={{ margin: 0, fontSize: '0.86rem', lineHeight: 1.6 }}>
            External AI calls require your explicit consent in Settings. AI API keys are never stored in client code or browser storage. All AI responses undergo strict schema validation and carry mandatory &ldquo;AI suggestion — review before using&rdquo; warning tags.
          </p>
        </DarkCard>

        {/* Section 6 */}
        <DarkCard>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <h2 style={{ margin: 0, fontSize: '1.18rem', color: 'var(--color-linen)' }}>
              <span style={{ color: 'var(--color-tangerine)', fontWeight: 800, fontSize: '0.9rem', fontFamily: 'var(--font-mono)', marginRight: '8px' }}>06.</span>
              Resume Truthfulness
            </h2>
          </div>
          <p className="muted-light" style={{ margin: 0, fontSize: '0.86rem', lineHeight: 1.6 }}>
            CareerAI enforces a strict non-negotiable anti-hallucination contract. The Resume Lab will never invent employers, degrees, dates, responsibilities, or unverified quantitative claims (such as &ldquo;1,000 concurrent users&rdquo; or &ldquo;99.9% uptime&rdquo;). Rewrites transform passive wording into active technical action statements, anchored solely to candidate-attested facts.
          </p>
        </DarkCard>

        {/* Section 7 */}
        <DarkCard>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <h2 style={{ margin: 0, fontSize: '1.18rem', color: 'var(--color-linen)' }}>
              <span style={{ color: 'var(--color-tangerine)', fontWeight: 800, fontSize: '0.9rem', fontFamily: 'var(--font-mono)', marginRight: '8px' }}>07.</span>
              Educational Recommendations and Eligibility Caveat
            </h2>
          </div>
          <p className="muted-light" style={{ margin: 0, fontSize: '0.86rem', lineHeight: 1.6 }}>
            Path recommendations and readiness percentages are deterministic heuristics comparing observed skills against entry benchmark definitions. They do not constitute statutory eligibility checks for civil services, regulated engineering licensure, or formal academic degree prerequisites. Learners are advised to verify statutory eligibility requirements with respective institutions.
          </p>
        </DarkCard>

        {/* Section 8 */}
        <DarkCard>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <h2 style={{ margin: 0, fontSize: '1.18rem', color: 'var(--color-linen)' }}>
              <span style={{ color: 'var(--color-tangerine)', fontWeight: 800, fontSize: '0.9rem', fontFamily: 'var(--font-mono)', marginRight: '8px' }}>08.</span>
              Data Export and Deletion
            </h2>
          </div>
          <p className="muted-light" style={{ margin: '0 0 10px', fontSize: '0.86rem', lineHeight: 1.6 }}>
            In accordance with digital privacy principles, you have complete self-serve access to your data:
          </p>
          <ul style={{ margin: '0 0 10px', paddingLeft: '20px', color: 'var(--color-muted-light)', fontSize: '0.84rem', lineHeight: 1.6 }}>
            <li><strong>Data Export:</strong> Download a full, machine-readable JSON archive of your profile, assessments, roadmap tasks, and interview records directly from Settings;</li>
            <li><strong>Data Erasure:</strong> Purge all user-owned rows from application tables at any time;</li>
            <li><strong>Auth Identity Disclosure:</strong> Permanent deletion of the underlying Supabase Auth credential record requires an administrative service-role edge function, as disclosed in Settings.</li>
          </ul>
        </DarkCard>

        {/* Section 9 */}
        <DarkCard>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <h2 style={{ margin: 0, fontSize: '1.18rem', color: 'var(--color-linen)' }}>
              <span style={{ color: 'var(--color-tangerine)', fontWeight: 800, fontSize: '0.9rem', fontFamily: 'var(--font-mono)', marginRight: '8px' }}>09.</span>
              Changes and Contact/Support
            </h2>
          </div>
          <p className="muted-light" style={{ margin: '0 0 12px', fontSize: '0.86rem', lineHeight: 1.6 }}>
            We update these terms and safety policies when new architectural boundaries or assessment tracks are introduced. Revisions will be reflected on this page with a revised timestamp.
          </p>
          <p className="muted-light" style={{ margin: 0, fontSize: '0.86rem', lineHeight: 1.6 }}>
            For privacy inquiries, security reports, or questions regarding our deterministic rubrics, visit the <Link to="/settings" style={{ color: 'var(--color-tangerine)', textDecoration: 'underline' }}>Settings &amp; Privacy Console</Link> or inspect our verifiable open-source data schemas.
          </p>
        </DarkCard>
      </div>

      {/* Footer Back Link */}
      <div style={{ marginTop: '36px', textAlign: 'center' }}>
        <Link
          to="/settings"
          className="button button-secondary"
          style={{ minHeight: '44px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
        >
          <ArrowLeft size={14} aria-hidden="true" />
          <span>Back to Settings &amp; Preferences</span>
        </Link>
      </div>
    </div>
  );
};

export const Terms: React.FC = () => <LegalPage initialTab="terms" />;
export const Privacy: React.FC = () => <LegalPage initialTab="privacy" />;
export const AiSafety: React.FC = () => <LegalPage initialTab="ai-safety" />;
