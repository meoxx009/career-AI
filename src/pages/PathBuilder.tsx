import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCareer } from '../context/CareerContext';
import {
  CAREER_CATALOGUE,
} from '../data/careerCatalogue';
import { getRelatedCareerPaths } from '../lib/pathMatcher';
import type { CareerPath, PathCategory } from '../types';
import {
  DisplayHeading,
  Eyebrow,
  PrimaryButton,
  SecondaryButton,
  DarkCard,
  StatusBadge,
} from '../components/DesignSystem';
import {
  Search,
  Compass,
  Code2,
  Database,
  Palette,
  Flame,
} from 'lucide-react';
import { RolePreviewHero } from '../components/RolePreviewHero';
import { RoleSelector } from '../components/RoleSelector';

export const PathBuilder: React.FC = () => {
  const navigate = useNavigate();
  const {
    hasSelectedRole,
    selectedRoleId,
    setSelectedRoleId,
    showToast,
    isDemoMode,
    demoBadgeText,
  } = useCareer();

  const [activeTab, setActiveTab] = useState<'all' | PathCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCurriculumSlug, setExpandedCurriculumSlug] = useState<string | null>(null);
  const [isCatalogueOpen, setIsCatalogueOpen] = useState(false);

  // Active target role (validated against catalogue)
  const activePath = useMemo(() => {
    if (hasSelectedRole && typeof selectedRoleId === 'number') {
      return CAREER_CATALOGUE.find((p) => p.numericId === selectedRoleId) || null;
    }
    return null;
  }, [hasSelectedRole, selectedRoleId]);

  // Deterministic related career paths (up to 3) for the active role
  const relatedPaths = useMemo(() => {
    if (!activePath) return [];
    return getRelatedCareerPaths(activePath, CAREER_CATALOGUE, 3);
  }, [activePath]);

  // Dynamic category tabs based on actual catalogue counts
  const categoryTabs = useMemo(() => [
    { id: 'all' as const, label: 'All Careers', icon: <Compass size={15} aria-hidden="true" />, count: CAREER_CATALOGUE.length },
    { id: 'software_engineering' as const, label: 'Software & Engineering', icon: <Code2 size={15} aria-hidden="true" />, count: CAREER_CATALOGUE.filter((p) => p.category === 'software_engineering').length },
    { id: 'data_ai' as const, label: 'Data & AI', icon: <Database size={15} aria-hidden="true" />, count: CAREER_CATALOGUE.filter((p) => p.category === 'data_ai').length },
    { id: 'design_product' as const, label: 'Design & Product', icon: <Palette size={15} aria-hidden="true" />, count: CAREER_CATALOGUE.filter((p) => p.category === 'design_product').length },
  ], []);

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

      {/* STATE A: NO ROLE SELECTED — CALM ROLE SELECTION STATE */}
      {!activePath && (
        <section aria-labelledby="choose-role-heading" style={{ marginBottom: '40px' }}>
          <header style={{ marginBottom: '28px' }}>
            <Eyebrow text="ROLE SELECTION / EVIDENCE-LED PREPARATION" tangerine />
            <DisplayHeading level={1}>CAREER CATALOGUE &amp; PATH BUILDER</DisplayHeading>
            <p
              className="muted-light"
              style={{ maxWidth: '780px', marginTop: '12px', fontSize: '1.02rem', lineHeight: 1.6 }}
            >
              Explore 33 production career paths across Software Engineering, Data &amp; AI, and Design &amp; Product
              without degree prestige bias or artificial hype.
            </p>
          </header>

          <DarkCard style={{ padding: '48px 32px', textAlign: 'center', marginBottom: '32px' }}>
            <Compass size={44} color="var(--color-tangerine)" style={{ margin: '0 auto 16px' }} aria-hidden="true" />
            <h2
              id="choose-role-heading"
              style={{
                fontSize: '1.6rem',
                fontFamily: 'var(--font-display)',
                color: 'var(--color-linen)',
                margin: '0 0 12px',
                letterSpacing: '0.04em',
              }}
            >
              CHOOSE A CAREER DIRECTION TO SEE YOUR PATH.
            </h2>
            <p
              className="muted-light"
              style={{ maxWidth: '620px', margin: '0 auto 28px', fontSize: '0.96rem', lineHeight: 1.55 }}
            >
              Select your target career role to focus your view. You will receive an interactive 5-phase
              curriculum, deterministic related role transitions, and grounded milestone deliverables.
            </p>

            <div style={{ maxWidth: '580px', margin: '0 auto 28px', textAlign: 'left' }}>
              <RoleSelector
                selectedRoleId={selectedRoleId}
                onSelectRole={(id) => {
                  const path = CAREER_CATALOGUE.find((p) => p.numericId === id);
                  if (path) handleSelectPath(path);
                }}
                label="Choose a Target Career Direction"
                helperText="Search all 33 production career paths across Software, Data & AI, and Design"
              />
            </div>

            <div>
              <button
                type="button"
                onClick={() => setIsCatalogueOpen(!isCatalogueOpen)}
                className="button button-secondary"
                style={{ fontSize: '0.84rem', padding: '10px 20px', minHeight: '42px' }}
                aria-expanded={isCatalogueOpen}
              >
                <span>{isCatalogueOpen ? 'Hide Full Catalogue ▲' : 'Browse All 33 Career Paths in Full Catalogue ↓'}</span>
              </button>
            </div>
          </DarkCard>
        </section>
      )}

      {/* STATE B: ROLE SELECTED — PRIMARY ACTIVE ROLE FOCUS VIEW */}
      {activePath && (
        <section aria-labelledby="active-role-heading">
          {/* Active Role Preview Hero with Animation */}
          <RolePreviewHero
            path={activePath}
            onViewRoadmap={() => navigate('/roadmap')}
            onTakeAssessment={() => navigate('/assessment')}
            onChangeRole={() => {
              setIsCatalogueOpen(true);
              const el = document.getElementById('catalogue-explorer-heading');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
          />

          {/* THREE RELATED CAREER DIRECTIONS SECTION */}
          {relatedPaths.length > 0 && (
            <section aria-labelledby="related-roles-heading" style={{ marginBottom: '44px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <Compass size={18} color="var(--color-tangerine)" aria-hidden="true" />
                <Eyebrow text={`DETERMINISTIC TRANSITIONS / BASED ON ${activePath.title.toUpperCase()}`} />
              </div>
              <h2
                id="related-roles-heading"
                style={{
                  margin: '0 0 10px',
                  fontSize: '1.4rem',
                  fontWeight: 800,
                  fontFamily: 'var(--font-display)',
                  color: 'var(--color-linen)',
                  letterSpacing: '0.04em',
                }}
              >
                RELATED CAREER DIRECTIONS FOR {activePath.title.toUpperCase()}
              </h2>
              <p className="muted-light" style={{ fontSize: '0.88rem', margin: '0 0 20px', maxWidth: '780px' }}>
                Deterministic role transitions sharing core skills, domain competencies, and foundational
                prerequisites from the career catalogue. Selecting any related role will not change your active path
                until explicitly activated.
              </p>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 310px), 1fr))',
                  gap: '20px',
                }}
              >
                {relatedPaths.map((related) => (
                  <DarkCard
                    key={related.id}
                    style={{
                      padding: '24px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      border: '1px solid var(--color-line-dark)',
                      backgroundColor: 'var(--color-black-hole)',
                    }}
                  >
                    <div>
                      {/* Topline badges */}
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '10px',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontFamily: 'var(--font-mono)',
                            color: 'var(--color-cotton)',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                          }}
                        >
                          {related.category.replace('_', ' ')}
                        </span>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-pill)',
                            backgroundColor: 'rgba(255, 255, 255, 0.08)',
                            color: 'var(--color-linen)',
                            fontWeight: 600,
                          }}
                        >
                          {related.level.toUpperCase()}
                        </span>
                      </div>

                      <h3 style={{ margin: '0 0 8px', fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-linen)' }}>
                        {related.title}
                      </h3>
                      <p style={{ margin: '0 0 16px', fontSize: '0.84rem', color: 'var(--color-muted-light)', lineHeight: 1.45 }}>
                        {related.description}
                      </p>

                      {/* 2-3 Relevant Skills */}
                      <div style={{ marginBottom: '16px' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--color-cotton)', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                          RELEVANT SKILLS:
                        </span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {related.coreSkills.slice(0, 3).map((skill, sIdx) => (
                            <span
                              key={sIdx}
                              style={{
                                fontSize: '0.72rem',
                                padding: '3px 8px',
                                borderRadius: '6px',
                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                color: 'var(--color-linen)',
                              }}
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* What you can build or practise */}
                      <div
                        style={{
                          marginBottom: '18px',
                          padding: '10px 12px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'rgba(245, 231, 198, 0.04)',
                          border: '1px solid var(--color-line-dark)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                          <Flame size={13} color="var(--color-tangerine)" aria-hidden="true" />
                          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-cotton)' }}>
                            WHAT YOU CAN BUILD OR PRACTISE:
                          </span>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--color-linen)', lineHeight: 1.4 }}>
                          {related.firstProjectDeliverable}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '8px', paddingTop: '12px', borderTop: '1px solid var(--color-line-dark)', flexWrap: 'wrap' }}>
                      <PrimaryButton
                        onClick={() => navigate(`/paths/${related.slug}`)}
                        style={{ flex: 1, fontSize: '0.78rem', padding: '8px 12px', minHeight: '38px' }}
                      >
                        <span>View Overview →</span>
                      </PrimaryButton>

                      <SecondaryButton
                        onClick={() => handleSelectPath(related)}
                        style={{ fontSize: '0.78rem', padding: '8px 12px', minHeight: '38px' }}
                      >
                        Set as Target
                      </SecondaryButton>
                    </div>
                  </DarkCard>
                ))}
              </div>
            </section>
          )}

          {/* ROLE PATH & CURRICULUM DIRECTLY BELOW PREVIEW */}
          <section aria-labelledby="role-path-curriculum-heading" style={{ marginBottom: '48px' }}>
            <DarkCard style={{ padding: '28px 32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <Eyebrow text={`STRUCTURED CURRICULUM PATH / ${activePath.title.toUpperCase()}`} />
                  </div>
                  <h3
                    id="role-path-curriculum-heading"
                    style={{ margin: 0, fontSize: '1.3rem', fontWeight: 700, color: 'var(--color-linen)' }}
                  >
                    5-Phase Path for {activePath.title} (~{activePath.estimatedEffortHours} hrs total)
                  </h3>
                </div>

                <PrimaryButton
                  onClick={() => navigate('/roadmap')}
                  style={{ fontSize: '0.82rem', padding: '10px 18px', minHeight: '40px' }}
                >
                  <span>Open Interactive Roadmap →</span>
                </PrimaryButton>
              </div>

              <ol style={{ listStyle: 'none', padding: 0, margin: '20px 0 0', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {activePath.curriculum.map((c, cIdx) => (
                  <li
                    key={c.id || cIdx}
                    style={{
                      padding: '16px 20px',
                      backgroundColor: 'rgba(0,0,0,0.3)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--color-line-dark)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '8px' }}>
                      <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--color-tangerine)', fontFamily: 'var(--font-mono)' }}>
                        PHASE 0{cIdx + 1}: {c.phase.toUpperCase()}
                      </span>
                      <span style={{ fontSize: '0.76rem', color: 'var(--color-muted-light)', fontFamily: 'var(--font-mono)' }}>
                        ~{c.estimatedHours} Hours
                      </span>
                    </div>

                    <div style={{ fontSize: '0.94rem', fontWeight: 700, color: 'var(--color-linen)', marginBottom: '6px' }}>
                      {c.title}
                    </div>

                    <p style={{ margin: '0 0 8px', fontSize: '0.82rem', color: 'var(--color-muted-light)', lineHeight: 1.45 }}>
                      <strong>Why it matters:</strong> {c.whyItMatters}
                    </p>

                    <div style={{ fontSize: '0.8rem', color: 'var(--color-cotton)' }}>
                      <strong style={{ color: 'var(--color-linen)' }}>Verified Deliverable: </strong>
                      {c.deliverable}
                    </div>
                  </li>
                ))}
              </ol>
            </DarkCard>
          </section>
        </section>
      )}

      {/* SECONDARY FULL 33-CAREER CATALOGUE EXPLORATION SECTION */}
      <section
        id="full-catalogue-section"
        aria-labelledby="catalogue-explorer-heading"
        style={{ marginTop: '36px', paddingTop: '28px', borderTop: '1px solid var(--color-line-dark)' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: isCatalogueOpen ? '24px' : '0' }}>
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
              {isCatalogueOpen
                ? 'Filter by category or search across core skills, prerequisite requirements, and career titles.'
                : 'Browse all 33 production career paths without losing your active role.'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsCatalogueOpen(!isCatalogueOpen)}
            className="button button-secondary"
            style={{ fontSize: '0.82rem', padding: '8px 18px', minHeight: '40px' }}
            aria-expanded={isCatalogueOpen}
          >
            <span>{isCatalogueOpen ? 'Collapse Catalogue ▲' : 'Explore All 33 Careers ▼'}</span>
          </button>
        </div>

        {/* Expandable 33-Role Grid */}
        {isCatalogueOpen && (
          <div style={{ marginTop: '24px' }}>
            {/* Search Box */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
              <div style={{ position: 'relative', minWidth: '260px', flex: '1 1 280px', maxWidth: '420px' }}>
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
                  placeholder="Search 33 roles, skills, or prerequisites..."
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
              {categoryTabs.map((tab) => {
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

            {/* Filtered 33-Catalogue Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 310px), 1fr))', gap: '20px' }}>
              {filteredCatalogue.map((path) => {
                const isSelected = activePath?.numericId === path.numericId;
                return (
                  <DarkCard
                    key={path.id}
                    style={{
                      padding: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      border: isSelected ? '1px solid var(--color-tangerine)' : '1px solid var(--color-line-dark)',
                      background: isSelected ? 'rgba(255, 109, 31, 0.06)' : 'var(--color-black-hole)',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--color-cotton)', fontWeight: 700 }}>
                          {path.category.replace('_', ' ')}
                        </span>
                        {isSelected ? (
                          <StatusBadge variant="tangerine" label="Active Target" />
                        ) : (
                          <span style={{ fontSize: '0.72rem', color: 'var(--color-muted-light)' }}>
                            ~{path.estimatedEffortHours} hrs
                          </span>
                        )}
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
                          {expandedCurriculumSlug === path.slug ? 'Hide 5-Phase Curriculum' : 'View 5-Phase Curriculum'}
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
                              <li key={c.id || idx} style={{ fontSize: '0.76rem', color: 'var(--color-linen)' }}>
                                <strong style={{ color: 'var(--color-tangerine)' }}>Phase {idx + 1}: {c.phase}</strong> — {c.title}
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
          </div>
        )}
      </section>
    </div>
  );
};
