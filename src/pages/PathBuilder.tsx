import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCareer } from '../context/CareerContext';
import {
  CAREER_CATALOGUE,
  STARTER_CAREER_PATHS,
} from '../data/careerCatalogue';
import { matchCareerPaths } from '../lib/pathMatcher';
import type { CareerPath, PathCategory } from '../types';
import {
  DisplayHeading,
  Eyebrow,
  PrimaryButton,
  SecondaryButton,
  DarkCard,
  LinenCard,
  StatusBadge,
} from '../components/DesignSystem';
import {
  Search,
  BookOpen,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  SlidersHorizontal,
  Compass,
  Code2,
  Database,
  Palette,
  Target,
  Info,
} from 'lucide-react';
import { LearnerContextIntake } from '../components/LearnerContextIntake';

const CATEGORY_TABS: Array<{ id: 'all' | PathCategory; label: string; icon: React.ReactNode; count: number }> = [
  { id: 'all', label: 'All Careers', icon: <Compass size={15} aria-hidden="true" />, count: 33 },
  { id: 'software_engineering', label: 'Software & Engineering', icon: <Code2 size={15} aria-hidden="true" />, count: 14 },
  { id: 'data_ai', label: 'Data & AI', icon: <Database size={15} aria-hidden="true" />, count: 12 },
  { id: 'design_product', label: 'Design & Product', icon: <Palette size={15} aria-hidden="true" />, count: 7 },
];

export const PathBuilder: React.FC = () => {
  const navigate = useNavigate();
  const {
    profile,
    updateProfile,
    saveProfile,
    selectedRoleId,
    setSelectedRoleId,
    showToast,
    isDemoMode,
    demoBadgeText,
  } = useCareer();

  const [activeTab, setActiveTab] = useState<'all' | PathCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCurriculumSlug, setExpandedCurriculumSlug] = useState<string | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  // Deterministic matching based on learner profile
  const matchResult = useMemo(() => {
    return matchCareerPaths(profile, 6);
  }, [profile]);

  const academicContext = matchResult.academicContext;

  // Filter catalogue based on category tab and search query
  const filteredCatalogue = useMemo(() => {
    let list = CAREER_CATALOGUE;
    if (activeTab !== 'all') {
      list = list.filter((p) => p.category === activeTab);
    }
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.coreSkills.some((s) => s.toLowerCase().includes(q)) ||
          p.prerequisiteSkills.some((s) => s.toLowerCase().includes(q)) ||
          p.compatibleStreamsOrDegrees.some((s) => s.toLowerCase().includes(q))
      );
    }
    return list;
  }, [activeTab, searchQuery]);

  const toggleCurriculum = (slug: string) => {
    setExpandedCurriculumSlug((prev) => (prev === slug ? null : slug));
  };

  const handleSelectPath = (path: CareerPath) => {
    setSelectedRoleId(path.numericId);
    showToast(`Active career path set to ${path.title}.`);
  };

  return (
    <div style={{ maxWidth: '1160px', margin: '0 auto', paddingBottom: '64px' }}>
      {/* Demo Badge */}
      {isDemoMode && (
        <div style={{ marginBottom: '20px' }}>
          <span className="fictional-demo-badge">{demoBadgeText}</span>
        </div>
      )}

      {/* Breadcrumb / Back Link */}
      <nav aria-label="Breadcrumb" style={{ marginBottom: '16px' }}>
        <Link
          to="/paths"
          style={{
            fontSize: '0.85rem',
            color: 'var(--color-cotton)',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          ← Return to Role Comparison
        </Link>
      </nav>

      {/* Header */}
      <header style={{ marginBottom: '32px' }}>
        <Eyebrow text="UNIFIED CATALOGUE & CURRICULUM ARCHITECTURE" />
        <DisplayHeading level={1}>CAREER CATALOGUE &amp; PATH BUILDER</DisplayHeading>
        <p
          className="muted-light"
          style={{ maxWidth: '820px', marginTop: '14px', fontSize: '1.02rem', lineHeight: 1.55 }}
        >
          Explore 33 production career paths across Software Engineering, Data &amp; AI, and Design &amp;
          Product. Every path features a transparent 5-phase staged curriculum, verified project deliverables,
          and deterministic matching without college prestige bias or artificial hype.
        </p>
      </header>

      {/* Learner Context Summary & Profile Adjuster */}
      <DarkCard style={{ marginBottom: '36px', padding: '24px 28px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                flexWrap: 'wrap',
                marginBottom: '8px',
              }}
            >
              <span
                style={{
                  fontSize: '0.74rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  color: 'var(--color-cotton)',
                }}
              >
                YOUR PROFILE CONTEXT
              </span>
              {profile.learnerStage && (
                <StatusBadge variant="tangerine" label={profile.learnerStage.replace('_', ' ').toUpperCase()} />
              )}
              {profile.stream && (
                <StatusBadge variant="dark" label={`Stream: ${profile.stream.toUpperCase()}`} />
              )}
              {profile.branch && <StatusBadge variant="dark" label={profile.branch} />}
              <span style={{ fontSize: '0.82rem', color: 'var(--color-muted-light)' }}>
                Study Budget: {profile.hoursPerWeek || 8} hrs/week
              </span>
            </div>

            {/* Academic Context Bridge Advisory */}
            {academicContext ? (
              <div
                style={{
                  marginTop: '10px',
                  padding: '12px 16px',
                  backgroundColor: 'rgba(245, 231, 198, 0.04)',
                  borderRadius: '12px',
                  border: '1px solid var(--color-line-dark)',
                  maxWidth: '780px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <Info size={14} color="var(--color-tangerine)" aria-hidden="true" />
                  <strong style={{ fontSize: '0.84rem', color: 'var(--color-cotton)' }}>
                    Academic Alignment: {academicContext.name}
                  </strong>
                </div>
                <p style={{ margin: '0 0 6px', fontSize: '0.82rem', color: 'var(--color-muted-light)' }}>
                  {academicContext.advisoryNote}
                </p>
                <div style={{ fontSize: '0.78rem', color: 'var(--color-muted-light)' }}>
                  <strong style={{ color: 'var(--color-linen)' }}>Transferable Strengths: </strong>
                  {academicContext.transferableStrengths.join(' • ')}
                </div>
              </div>
            ) : (
              <p
                style={{
                  margin: '6px 0 0',
                  fontSize: '0.86rem',
                  color: 'var(--color-muted-light)',
                  fontStyle: 'italic',
                }}
              >
                More information needed to personalize this path — set your academic context or interests
                in Onboarding or Settings.
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsEditorOpen(!isEditorOpen)}
            className="button button-secondary"
            style={{ fontSize: '0.82rem', padding: '8px 16px', minHeight: '40px' }}
          >
            <SlidersHorizontal size={14} aria-hidden="true" style={{ marginRight: '6px' }} />
            <span>{isEditorOpen ? 'Close Profile Adjuster' : 'Adjust Academic Context'}</span>
          </button>
        </div>

        {/* Expandable Reusable Intake Component */}
        {isEditorOpen && (
          <div
            style={{
              marginTop: '24px',
              paddingTop: '24px',
              borderTop: '1px solid var(--color-line-dark)',
            }}
          >
            <LearnerContextIntake
              profile={profile}
              onChange={(updates) => {
                updateProfile(updates);
                saveProfile(updates);
              }}
              mode="all"
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <PrimaryButton
                onClick={() => setIsEditorOpen(false)}
                style={{ fontSize: '0.82rem', padding: '8px 18px' }}
              >
                Apply Profile Context &amp; Recalculate ↗
              </PrimaryButton>
            </div>
          </div>
        )}
      </DarkCard>

      {/* Recommended Paths Section (Deterministic Recommendations) */}
      <section aria-labelledby="recommended-paths-heading" style={{ marginBottom: '48px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <Target size={20} color="var(--color-tangerine)" aria-hidden="true" />
          <h2
            id="recommended-paths-heading"
            style={{
              margin: 0,
              fontSize: '1.25rem',
              fontWeight: 800,
              fontFamily: 'var(--font-display)',
              color: 'var(--color-linen)',
              letterSpacing: '0.04em',
            }}
          >
            TOP MATCHED CAREER DIRECTIONS FOR YOUR PROFILE
          </h2>
        </div>
        <p className="muted-light" style={{ fontSize: '0.88rem', margin: '0 0 20px' }}>
          Ranked using deterministic academic bridges, selected interests, and foundational prerequisites.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
          {matchResult.recommendations.map(({ path, reasons, prerequisiteGaps, nextBestAction }) => {
            const isSelected = path.numericId === selectedRoleId;
            return (
              <DarkCard
                key={path.id}
                style={{
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  border: isSelected ? '2px solid var(--color-tangerine)' : '1px solid var(--color-line-dark)',
                  boxShadow: isSelected ? '0 0 20px rgba(255, 109, 31, 0.15)' : 'none',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--color-cotton)', fontWeight: 700, letterSpacing: '0.04em' }}>
                      {path.category.replace('_', ' ')}
                    </span>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        backgroundColor: 'rgba(255, 109, 31, 0.15)',
                        color: 'var(--color-tangerine)',
                        fontWeight: 700,
                      }}
                    >
                      {path.level.toUpperCase()}
                    </span>
                  </div>

                  <h3 style={{ margin: '0 0 8px', fontSize: '1.18rem', fontWeight: 700, color: 'var(--color-linen)' }}>
                    {path.title}
                  </h3>
                  <p style={{ margin: '0 0 16px', fontSize: '0.86rem', color: 'var(--color-muted-light)', lineHeight: 1.45 }}>
                    {path.description}
                  </p>

                  {/* Match Rationale */}
                  <div style={{ marginBottom: '16px', padding: '10px 12px', backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: '8px', borderLeft: '3px solid var(--color-tangerine)' }}>
                    <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--color-cotton)', marginBottom: '4px' }}>
                      DETERMINISTIC MATCH RATIONALE
                    </div>
                    {reasons.slice(0, 2).map((r, i) => (
                      <div key={i} style={{ fontSize: '0.8rem', color: 'var(--color-linen)', display: 'flex', alignItems: 'flex-start', gap: '6px', marginTop: '3px' }}>
                        <CheckCircle2 size={13} color="var(--color-tangerine)" style={{ flexShrink: 0, marginTop: '2px' }} aria-hidden="true" />
                        <span>{r.description}</span>
                      </div>
                    ))}
                  </div>

                  {/* Prerequisite Gaps if any */}
                  {prerequisiteGaps.length > 0 && (
                    <div style={{ marginBottom: '14px', fontSize: '0.78rem', color: 'var(--color-muted-light)' }}>
                      <strong style={{ color: 'var(--color-cotton)' }}>Prerequisites to verify: </strong>
                      {prerequisiteGaps.slice(0, 3).join(', ')}
                    </div>
                  )}

                  {/* Next Best Action */}
                  <div style={{ marginBottom: '14px', fontSize: '0.78rem', color: 'var(--color-cotton)' }}>
                    <strong>Next Action: </strong>
                    <span style={{ color: 'var(--color-linen)' }}>{nextBestAction}</span>
                  </div>

                  {/* First Deliverable */}
                  <div style={{ marginBottom: '16px', padding: '8px 10px', backgroundColor: 'rgba(245, 231, 198, 0.05)', borderRadius: '6px', border: '1px dashed var(--color-line-dark)' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--color-cotton)', fontWeight: 700 }}>
                      FIRST PROJECT DELIVERABLE:
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-linen)', marginTop: '2px' }}>
                      {path.firstProjectDeliverable}
                    </div>
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginTop: '12px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => toggleCurriculum(path.slug)}
                      className="button button-secondary"
                      style={{ fontSize: '0.78rem', padding: '6px 12px', minHeight: '36px' }}
                      aria-expanded={expandedCurriculumSlug === path.slug}
                    >
                      {expandedCurriculumSlug === path.slug ? (
                        <>Hide Curriculum <ChevronUp size={14} aria-hidden="true" /></>
                      ) : (
                        <>View 5-Phase Curriculum <ChevronDown size={14} aria-hidden="true" /></>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectPath(path)}
                      className={`button ${isSelected ? 'button-secondary' : 'button-primary'}`}
                      style={{ fontSize: '0.78rem', padding: '6px 14px', minHeight: '36px' }}
                    >
                      {isSelected ? 'Active Path ✓' : 'Select Target Path'}
                    </button>
                  </div>

                  {/* Expandable 5-Phase Curriculum */}
                  {expandedCurriculumSlug === path.slug && (
                    <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--color-line-dark)' }}>
                      <h4 style={{ margin: '0 0 12px', fontSize: '0.84rem', color: 'var(--color-cotton)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        5-Phase Staged Curriculum (~{path.estimatedEffortHours} hrs total)
                      </h4>
                      <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {path.curriculum.map((c, cIdx) => (
                          <li
                            key={c.id}
                            style={{
                              padding: '10px 12px',
                              backgroundColor: 'rgba(0,0,0,0.3)',
                              borderRadius: '8px',
                              border: '1px solid var(--color-line-dark)',
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-tangerine)' }}>
                                Phase {cIdx + 1}: {c.phase}
                              </span>
                              <span style={{ fontSize: '0.72rem', color: 'var(--color-muted-light)' }}>
                                {c.estimatedHours} hrs
                              </span>
                            </div>
                            <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--color-linen)', marginBottom: '4px' }}>
                              {c.title}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--color-muted-light)', marginBottom: '6px' }}>
                              <em>Deliverable:</em> {c.deliverable}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-cotton)' }}>
                              <strong>Why it matters:</strong> {c.whyItMatters}
                            </div>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              </DarkCard>
            );
          })}
        </div>
      </section>

      {/* Catalogue Filter Tabs & Search Bar */}
      <section aria-labelledby="catalogue-explorer-heading" style={{ marginBottom: '48px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
          <div>
            <h2
              id="catalogue-explorer-heading"
              style={{
                margin: 0,
                fontSize: '1.25rem',
                fontWeight: 800,
                fontFamily: 'var(--font-display)',
                color: 'var(--color-linen)',
                letterSpacing: '0.04em',
              }}
            >
              EXPLORE FULL 33-CAREER CATALOGUE
            </h2>
            <p className="muted-light" style={{ margin: '4px 0 0', fontSize: '0.86rem' }}>
              Filter by engineering group or search across core skills, prerequisite requirements, and career titles.
            </p>
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative', minWidth: '260px', flex: '1 1 280px', maxWidth: '380px' }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--color-muted-light)',
                pointerEvents: 'none',
              }}
              aria-hidden="true"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search roles, skills, or prerequisites..."
              aria-label="Search career catalogue"
              style={{
                width: '100%',
                padding: '9px 12px 9px 36px',
                backgroundColor: 'var(--color-black-hole)',
                border: '1px solid var(--color-line-dark)',
                borderRadius: '10px',
                color: 'var(--color-linen)',
                fontSize: '0.86rem',
                outline: 'none',
              }}
            />
          </div>
        </div>

        {/* Category Tab Pills */}
        <div
          role="tablist"
          aria-label="Career Catalogue Categories"
          style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
            marginBottom: '24px',
            borderBottom: '1px solid var(--color-line-dark)',
            paddingBottom: '12px',
          }}
        >
          {CATEGORY_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`button ${isActive ? 'button-primary' : 'button-secondary'}`}
                style={{
                  fontSize: '0.82rem',
                  padding: '8px 16px',
                  minHeight: '38px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {tab.icon}
                <span>{tab.label} ({tab.count})</span>
              </button>
            );
          })}
        </div>

        {/* Filtered Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {filteredCatalogue.map((path) => {
            const isSelected = path.numericId === selectedRoleId;
            return (
              <DarkCard
                key={path.id}
                style={{
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  border: isSelected ? '1px solid var(--color-tangerine)' : '1px solid var(--color-line-dark)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--color-cotton)', fontWeight: 700 }}>
                      {path.category.replace('_', ' ')}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--color-muted-light)' }}>
                      ~{path.estimatedEffortHours} hrs
                    </span>
                  </div>

                  <h3 style={{ margin: '0 0 6px', fontSize: '1.08rem', fontWeight: 700, color: 'var(--color-linen)' }}>
                    {path.title}
                  </h3>
                  <p style={{ margin: '0 0 12px', fontSize: '0.84rem', color: 'var(--color-muted-light)', lineHeight: 1.4 }}>
                    {path.description}
                  </p>

                  {/* Core Skills Chips */}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
                    {path.coreSkills.slice(0, 4).map((skill, sIdx) => (
                      <span
                        key={sIdx}
                        style={{
                          fontSize: '0.72rem',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          backgroundColor: 'rgba(255,255,255,0.05)',
                          color: 'var(--color-linen)',
                        }}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>

                  {/* First deliverable preview */}
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-muted-light)', marginBottom: '14px' }}>
                    <strong style={{ color: 'var(--color-cotton)' }}>Deliverable: </strong>
                    {path.firstProjectDeliverable}
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', paddingTop: '12px', borderTop: '1px solid var(--color-line-dark)' }}>
                    <button
                      type="button"
                      onClick={() => toggleCurriculum(path.slug)}
                      className="button button-secondary"
                      style={{ fontSize: '0.76rem', padding: '6px 10px', minHeight: '34px' }}
                    >
                      {expandedCurriculumSlug === path.slug ? 'Hide Stages' : '5 Stages'}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectPath(path)}
                      className={`button ${isSelected ? 'button-secondary' : 'button-primary'}`}
                      style={{ fontSize: '0.76rem', padding: '6px 12px', minHeight: '34px' }}
                    >
                      {isSelected ? 'Active ✓' : 'Select'}
                    </button>
                  </div>

                  {/* Expandable 5 Stages */}
                  {expandedCurriculumSlug === path.slug && (
                    <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px dashed var(--color-line-dark)' }}>
                      <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {path.curriculum.map((c, idx) => (
                          <li key={c.id} style={{ fontSize: '0.76rem', color: 'var(--color-linen)' }}>
                            <strong style={{ color: 'var(--color-tangerine)' }}>Phase {idx + 1} ({c.phase}):</strong> {c.title}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              </DarkCard>
            );
          })}
        </div>
      </section>

      {/* Original 3 Starter Paths Section (Preserved) */}
      <section aria-labelledby="starter-paths-heading">
        <LinenCard style={{ padding: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <BookOpen size={20} color="var(--color-ink)" aria-hidden="true" />
            <h2
              id="starter-paths-heading"
              style={{
                margin: 0,
                fontSize: '1.25rem',
                fontWeight: 800,
                fontFamily: 'var(--font-display)',
                color: 'var(--color-ink)',
                letterSpacing: '0.04em',
              }}
            >
              CORE STARTER PATHS WITH INTERACTIVE ROADMAPS &amp; DIAGNOSTICS
            </h2>
          </div>
          <p style={{ margin: '0 0 24px', fontSize: '0.9rem', color: 'var(--color-muted-dark)' }}>
            These three foundation roles include full 10-question diagnostic assessments, dynamic weekly study-hour
            rescheduling, and mock interview practice rubrics.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            {STARTER_CAREER_PATHS.map((path) => {
              const isSelected = path.numericId === selectedRoleId;
              return (
                <div
                  key={path.id}
                  style={{
                    backgroundColor: 'var(--color-void)',
                    borderRadius: '16px',
                    padding: '24px',
                    color: 'var(--color-linen)',
                    border: isSelected ? '2px solid var(--color-tangerine)' : '1px solid var(--color-line-dark)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--color-cotton)', fontWeight: 700, textTransform: 'uppercase' }}>
                        Starter Path #{path.numericId}
                      </span>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          backgroundColor: 'rgba(255, 109, 31, 0.2)',
                          color: 'var(--color-tangerine)',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontWeight: 700,
                        }}
                      >
                        DIAGNOSTIC READY
                      </span>
                    </div>

                    <h3 style={{ margin: '0 0 8px', fontSize: '1.18rem', fontWeight: 700, color: 'var(--color-linen)' }}>
                      {path.title}
                    </h3>
                    <p style={{ margin: '0 0 16px', fontSize: '0.84rem', color: 'var(--color-muted-light)', lineHeight: 1.45 }}>
                      {path.description}
                    </p>

                    <div style={{ fontSize: '0.78rem', color: 'var(--color-cotton)', marginBottom: '14px' }}>
                      <strong>Next Action: </strong> {path.nextAction}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                    <PrimaryButton
                      onClick={() => {
                        setSelectedRoleId(path.numericId);
                        navigate('/roadmap');
                      }}
                      style={{ fontSize: '0.8rem', padding: '8px 14px', flex: 1 }}
                    >
                      View Roadmap →
                    </PrimaryButton>
                    <SecondaryButton
                      onClick={() => {
                        setSelectedRoleId(path.numericId);
                        navigate('/assessment');
                      }}
                      style={{ fontSize: '0.8rem', padding: '8px 14px' }}
                    >
                      Assess
                    </SecondaryButton>
                  </div>
                </div>
              );
            })}
          </div>
        </LinenCard>
      </section>
    </div>
  );
};
