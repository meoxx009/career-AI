import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { UserProfile, CareerPath } from '../types';
import type { PathRecommendation } from '../lib/pathRecommendations';
import { CAREER_CATALOGUE, getCareerPathById, getCareerPathBySlug } from '../data/careerCatalogue';
import {
  Eyebrow,
  PrimaryButton,
  SecondaryButton,
  DarkCard,
  StatusBadge,
} from './DesignSystem';
import {
  Code2,
  Database,
  Palette,
  Sparkles,
} from 'lucide-react';

export interface BranchingPathTreeProps {
  profile: UserProfile;
  recommendations: PathRecommendation[];
  selectedRoleId: number | null;
  skillObservations?: Record<number, number | null>;
  onActivateRole: (roleId: number, roleTitle: string) => void;
}

export const BranchingPathTree: React.FC<BranchingPathTreeProps> = ({
  profile,
  recommendations,
  selectedRoleId,
  onActivateRole,
}) => {
  const navigate = useNavigate();

  // Find matching CareerPath objects for recommendations
  const resolvedPaths = useMemo(() => {
    const list: Array<{
      rec: Partial<PathRecommendation> & { id: string; title: string; whySuggested: string };
      path: CareerPath;
    }> = [];

    recommendations.forEach((rec) => {
      let matched: CareerPath | undefined;
      if (rec.cataloguePathId) {
        matched = getCareerPathById(rec.cataloguePathId);
      }
      if (!matched && rec.cataloguePathSlug) {
        matched = getCareerPathBySlug(rec.cataloguePathSlug);
      }
      if (!matched) {
        // Fallback matching by role name or title
        matched = CAREER_CATALOGUE.find(
          (p) =>
            p.title.toLowerCase().includes(rec.title.toLowerCase()) ||
            rec.title.toLowerCase().includes(p.title.toLowerCase())
        );
      }
      if (matched && !list.some((item) => item.path.numericId === matched!.numericId)) {
        list.push({ rec, path: matched });
      }
    });

    // Ensure at least top entry roles if recommendations are sparse
    if (list.length === 0) {
      CAREER_CATALOGUE.slice(0, 3).forEach((path) => {
        list.push({
          rec: {
            id: `rec-${path.slug}`,
            cataloguePathId: path.numericId,
            cataloguePathSlug: path.slug,
            pathType: 'career_role',
            title: path.title,
            category: path.category,
            whySuggested: path.description,
            contributingInputs: ['General career catalogue exploration'],
            canExplore: true,
            exploreHref: `/paths/${path.slug}`,
          },
          path,
        });
      });
    }

    return list;
  }, [recommendations]);

  // Group resolved paths into domains/branches
  const branches = useMemo(() => {
    const map = new Map<string, {
      id: string;
      title: string;
      icon: React.ReactNode;
      items: Array<{ rec: Partial<PathRecommendation> & { id: string; title: string; whySuggested: string }; path: CareerPath }>;
    }>();

    // Defined domain buckets
    map.set('software_engineering', {
      id: 'software_engineering',
      title: 'Software & Engineering',
      icon: <Code2 size={16} color="var(--color-tangerine)" aria-hidden="true" />,
      items: [],
    });
    map.set('data_ai', {
      id: 'data_ai',
      title: 'Data & AI',
      icon: <Database size={16} color="var(--color-tangerine)" aria-hidden="true" />,
      items: [],
    });
    map.set('design_product', {
      id: 'design_product',
      title: 'Design & Product',
      icon: <Palette size={16} color="var(--color-tangerine)" aria-hidden="true" />,
      items: [],
    });

    resolvedPaths.forEach((item) => {
      const cat = item.path.category;
      if (map.has(cat)) {
        map.get(cat)!.items.push(item);
      } else {
        // Fallback to software
        map.get('software_engineering')!.items.push(item);
      }
    });

    // Filter to branches that have at least one recommended role
    return Array.from(map.values()).filter((b) => b.items.length > 0);
  }, [resolvedPaths]);

  // Initially null so detail breakdown only renders when clicked
  const [activeRoleSlug, setActiveRoleSlug] = useState<string | null>(null);

  const activeItem = useMemo(() => {
    if (!activeRoleSlug) return null;
    return resolvedPaths.find((item) => item.path.slug === activeRoleSlug) || null;
  }, [resolvedPaths, activeRoleSlug]);

  const activePath = activeItem?.path;
  const isSelectedActiveRoadmap = activePath && selectedRoleId === activePath.numericId;

  // Formatting helper for learner horizon summary
  const stageDisplay = useMemo(() => {
    switch (profile.learnerStage) {
      case 'class_10':
        return 'School (Class 10)';
      case 'class_11_12':
        return `School (${profile.stream ? profile.stream.toUpperCase() : 'Class 11/12'})`;
      case 'diploma':
        return 'Diploma / Polytechnic';
      case 'undergraduate':
        return profile.degree ? `College (${profile.degree})` : 'Undergraduate';
      case 'postgraduate':
        return profile.degree ? `Postgraduate (${profile.degree})` : 'Postgraduate';
      case 'self_taught':
        return 'Self-Taught Career Switcher';
      default:
        return 'Applied Learner Horizon';
    }
  }, [profile.learnerStage, profile.stream, profile.degree]);

  return (
    <section
      aria-labelledby="branching-tree-heading"
      className="branching-path-tree"
      style={{
        marginTop: '16px',
        marginBottom: '48px',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <Sparkles size={16} color="var(--color-tangerine)" aria-hidden="true" />
          <Eyebrow text="PERSONALIZED PATH SUGGESTIONS / BRANCHING DIRECTIONS" />
        </div>
        <h2
          id="branching-tree-heading"
          style={{
            margin: '0 0 10px',
            fontSize: '1.6rem',
            fontFamily: 'var(--font-display)',
            color: 'var(--color-linen)',
            letterSpacing: '0.04em',
          }}
        >
          Suggested Directions for You — Branching Path Visualization
        </h2>
        <p className="muted-light" style={{ maxWidth: '680px', margin: '0 auto', fontSize: '0.92rem', lineHeight: 1.55 }}>
          Generated deterministically from your stage, stream, interests, and stated hours. Select any role node below
          to inspect its 5-phase curriculum, verified deliverables, and activate it for your roadmap.
        </p>
      </div>

      {/* TOP-TO-BOTTOM VISUAL TREE CONTAINER */}
      <div
        style={{
          position: 'relative',
          padding: '28px 20px',
          background: 'linear-gradient(180deg, rgba(255, 109, 31, 0.04) 0%, var(--color-black-hole) 100%)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-line-dark)',
          marginBottom: '32px',
        }}
      >
        {/* LEVEL 1: ROOT NODE (APPLIED LEARNER HORIZON) */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 2 }}>
          <div
            style={{
              padding: '14px 24px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-black-soft)',
              border: '1px solid var(--color-tangerine)',
              boxShadow: '0 0 20px rgba(255, 109, 31, 0.15)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '14px',
              maxWidth: '92%',
            }}
          >
            <div
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: 'var(--color-tangerine)',
                boxShadow: '0 0 10px var(--color-tangerine)',
                flexShrink: 0,
              }}
              aria-hidden="true"
            />
            <div>
              <div style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)', color: 'var(--color-tangerine)', fontWeight: 700, textTransform: 'uppercase' }}>
                ROOT HORIZON • {stageDisplay}
              </div>
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--color-linen)', marginTop: '2px' }}>
                {profile.stream ? `Stream: ${profile.stream.toUpperCase()}` : profile.degree || 'General Intake'}{' '}
                <span style={{ fontSize: '0.78rem', color: 'var(--color-cotton)', fontWeight: 400 }}>
                  (~{profile.hoursPerWeek || 8} hrs/week)
                </span>
              </div>
            </div>
          </div>

          {/* ROOT-TO-BRANCH VERTICAL STEM */}
          <div
            style={{
              width: '2px',
              height: '32px',
              background: 'linear-gradient(180deg, var(--color-tangerine) 0%, var(--color-line-dark) 100%)',
              margin: '0 auto',
            }}
            aria-hidden="true"
          />
        </div>

        {/* LEVEL 2 & 3: DOMAIN BRANCHES & ROLE NODES */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${branches.length}, minmax(0, 1fr))`,
            gap: '24px',
            position: 'relative',
            zIndex: 2,
          }}
          className="tree-branches-grid"
        >
          {branches.map((branch) => (
            <div
              key={branch.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              {/* Branch Header Node */}
              <div
                style={{
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-pill)',
                  background: 'var(--color-black-hole)',
                  border: '1px solid var(--color-line-dark)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '16px',
                }}
              >
                {branch.icon}
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-linen)' }}>
                  {branch.title} ({branch.items.length})
                </span>
              </div>

              {/* Connecting line down to role nodes */}
              <div
                style={{
                  width: '2px',
                  height: '16px',
                  background: 'var(--color-line-dark)',
                  marginBottom: '16px',
                }}
                aria-hidden="true"
              />

              {/* Role Leaf Nodes */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', width: '100%' }}>
                {branch.items.map(({ rec, path }) => {
                  const isNodeActive = activeRoleSlug === path.slug;
                  const isRoleTarget = selectedRoleId === path.numericId;

                  return (
                    <DarkCard
                      key={path.id}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        padding: '24px',
                        border: isNodeActive
                          ? '1px solid var(--color-tangerine)'
                          : isRoleTarget
                          ? '1px solid var(--color-cotton)'
                          : '1px solid var(--color-line-dark)',
                        background: isNodeActive
                          ? 'rgba(255, 109, 31, 0.08)'
                          : undefined,
                        boxShadow: isNodeActive ? '0 0 20px rgba(255, 109, 31, 0.15)' : 'none',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div>
                        {/* Header badge row */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <StatusBadge variant="tangerine" label={rec.badge || `${path.level.toUpperCase()} LEVEL`} />
                          {rec.alignedRoleId && (
                            <span style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)', color: 'var(--color-cotton)' }}>
                              SEED #{rec.alignedRoleId}
                            </span>
                          )}
                          {isRoleTarget && !rec.alignedRoleId && (
                            <StatusBadge variant="tangerine" label="Active Target" />
                          )}
                        </div>

                        {/* Title heading */}
                        <h3 style={{ fontSize: '1.25rem', color: 'var(--color-linen)', margin: '0 0 10px', lineHeight: 1.3 }}>
                          {rec.title}
                        </h3>

                        {/* Why suggested */}
                        <p style={{ margin: '0 0 16px', fontSize: '0.84rem', color: 'var(--color-muted-light)', lineHeight: 1.5 }}>
                          <strong>Why suggested:</strong> {rec.whySuggested || path.description}
                        </p>

                        {/* 8 Criteria details container */}
                        <div
                          style={{
                            display: 'grid',
                            gap: '8px',
                            fontSize: '0.78rem',
                            color: 'var(--color-muted-light)',
                            marginBottom: '18px',
                            padding: '12px 14px',
                            borderRadius: 'var(--radius-sm)',
                            background: 'var(--color-black-soft)',
                            border: '1px solid var(--color-line-dark)',
                          }}
                        >
                          <div><strong>Inputs evaluated:</strong> {(rec.inputsEvaluated || rec.contributingInputs || []).join(' · ')}</div>
                          {rec.requirementsEvaluated && rec.requirementsEvaluated.length > 0 && (
                            <div><strong>Requirements evaluated:</strong> {rec.requirementsEvaluated.join(' · ')}</div>
                          )}
                          <div>
                            <strong>Evidence found:</strong>{' '}
                            {rec.evidenceFound && rec.evidenceFound.length > 0 && !rec.evidenceFound.every((e: string) => e.includes('No prior coursework') || e.includes('No verified skill'))
                              ? rec.evidenceFound.join(' · ')
                              : 'No verified skill evidence supplied yet.'}
                          </div>
                          <div>
                            <strong>Still unknown:</strong>{' '}
                            {(rec.stillUnknown || rec.unknowns || []).length > 0
                              ? (rec.stillUnknown || rec.unknowns || []).map((u: string) => u.replace(/Confirmed gap/gi, 'Not assessed yet')).join(' · ')
                              : 'Not assessed yet'}
                          </div>
                          {rec.prerequisites && rec.prerequisites.length > 0 && (
                            <div><strong>Prerequisites:</strong> {rec.prerequisites.join(' · ')}</div>
                          )}
                          <div>
                            <strong>Estimated Curriculum Path:</strong>{' '}
                            {(rec.estimatedCurriculum && rec.estimatedCurriculum.length > 0)
                              ? rec.estimatedCurriculum.join(' · ')
                              : `${path.estimatedEffortHours || 80} hours · 5 phases`}
                          </div>
                          <div>
                            <strong>Next Action:</strong>{' '}
                            {rec.nextAction || 'Explore curriculum and begin milestone 1'}
                          </div>
                        </div>

                        {/* Core Technical Keywords */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
                          {path.coreSkills.map((skill, sIdx) => (
                            <span
                              key={sIdx}
                              style={{
                                fontSize: '0.70rem',
                                padding: '2px 8px',
                                borderRadius: 'var(--radius-pill)',
                                background: 'rgba(250, 243, 225, 0.06)',
                                color: 'var(--color-cotton)',
                                border: '1px solid var(--color-line-dark)',
                              }}
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Card Actions */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto' }}>
                        <PrimaryButton
                          onClick={() => {
                            setActiveRoleSlug(path.slug);
                            onActivateRole(path.numericId, path.title);
                          }}
                          style={{ width: '100%', fontSize: '0.84rem', padding: '10px 16px' }}
                        >
                          Explore this curriculum roadmap →
                        </PrimaryButton>

                        <SecondaryButton
                          onClick={() => navigate('/assessment')}
                          style={{ width: '100%', fontSize: '0.78rem', padding: '8px 14px' }}
                        >
                          Take diagnostic assessment
                        </SecondaryButton>

                        <button
                          type="button"
                          onClick={() => setActiveRoleSlug(activeRoleSlug === path.slug ? null : path.slug)}
                          className="button-text"
                          style={{ fontSize: '0.76rem', color: 'var(--color-tangerine)', marginTop: '4px', textAlign: 'center', width: '100%' }}
                        >
                          {activeRoleSlug === path.slug ? 'Hide Curriculum Breakdown ▲' : 'Inspect 5-Phase Curriculum Breakdown ▼'}
                        </button>
                      </div>
                    </DarkCard>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* DETAIL OVERVIEW CONTAINER (OPENS DIRECTLY BELOW THE TREE UPON NODE SELECTION) */}
      {activePath && (
        <DarkCard
          style={{
            padding: '32px',
            border: '1px solid var(--color-tangerine)',
            background: 'var(--color-black-hole)',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5)',
          }}
        >
          {/* Header Row */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              gap: '16px',
              marginBottom: '20px',
              borderBottom: '1px solid var(--color-line-dark)',
              paddingBottom: '20px',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <Eyebrow text={`DIRECTION OVERVIEW / ${activePath.category.toUpperCase().replace('_', ' ')}`} />
                <span
                  style={{
                    fontSize: '0.70rem',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-pill)',
                    background: 'rgba(255, 255, 255, 0.08)',
                    color: 'var(--color-linen)',
                    fontWeight: 600,
                  }}
                >
                  {activePath.level.toUpperCase()}
                </span>
                {isSelectedActiveRoadmap && (
                  <StatusBadge variant="tangerine" label="Active Roadmap Target" />
                )}
              </div>
              <h3 style={{ margin: '0 0 8px', fontSize: '1.6rem', color: 'var(--color-linen)', fontWeight: 800 }}>
                <span style={{ color: 'var(--color-tangerine)', fontSize: '0.82rem', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Selected Direction Overview
                </span>
                {activePath.title} Curriculum Breakdown
              </h3>
              <p className="muted-light" style={{ maxWidth: '720px', margin: 0, fontSize: '0.94rem', lineHeight: 1.5 }}>
                {activePath.description}
              </p>
            </div>

            {/* Explicit Activation Action */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '220px' }}>
              <PrimaryButton
                onClick={() => onActivateRole(activePath.numericId, activePath.title)}
                style={{ fontSize: '0.86rem', padding: '10px 18px', minHeight: '44px', width: '100%' }}
              >
                {isSelectedActiveRoadmap ? 'Active Target ✓' : 'Activate for Roadmap →'}
              </PrimaryButton>

              <SecondaryButton
                onClick={() => navigate('/roadmap')}
                style={{ fontSize: '0.80rem', padding: '8px 14px', minHeight: '38px', width: '100%' }}
              >
                Open Interactive Roadmap
              </SecondaryButton>
            </div>
          </div>

          {/* Key Metrics Strip */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))',
              gap: '14px',
              marginBottom: '24px',
            }}
          >
            <div style={{ padding: '12px 16px', borderRadius: 'var(--radius-sm)', background: 'var(--color-black-soft)', border: '1px solid var(--color-line-dark)' }}>
              <span style={{ fontSize: '0.70rem', color: 'var(--color-cotton)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                Estimated Effort
              </span>
              <strong style={{ fontSize: '1.1rem', color: 'var(--color-linen)' }}>
                ~{activePath.estimatedEffortHours} Hours
              </strong>
            </div>

            <div style={{ padding: '12px 16px', borderRadius: 'var(--radius-sm)', background: 'var(--color-black-soft)', border: '1px solid var(--color-line-dark)' }}>
              <span style={{ fontSize: '0.70rem', color: 'var(--color-cotton)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                Curriculum Scope
              </span>
              <strong style={{ fontSize: '1.1rem', color: 'var(--color-linen)' }}>
                5 Progressive Phases
              </strong>
            </div>

            <div style={{ padding: '12px 16px', borderRadius: 'var(--radius-sm)', background: 'var(--color-black-soft)', border: '1px solid var(--color-line-dark)' }}>
              <span style={{ fontSize: '0.70rem', color: 'var(--color-cotton)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                Verified Deliverables
              </span>
              <strong style={{ fontSize: '1.1rem', color: 'var(--color-tangerine)' }}>
                Hands-on Project Proof
              </strong>
            </div>
          </div>

          {/* Core Competencies */}
          <div style={{ marginBottom: '24px' }}>
            <span style={{ fontSize: '0.74rem', color: 'var(--color-cotton)', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
              Core Technical Competencies
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {activePath.coreSkills.map((skill, idx) => (
                <span
                  key={idx}
                  style={{
                    fontSize: '0.78rem',
                    padding: '4px 12px',
                    borderRadius: 'var(--radius-pill)',
                    background: 'rgba(250, 243, 225, 0.08)',
                    color: 'var(--color-linen)',
                    border: '1px solid var(--color-line-dark)',
                  }}
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* First Hands-on Deliverable */}
          {activePath.firstProjectDeliverable && (
            <div
              style={{
                padding: '14px 18px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(255, 109, 31, 0.06)',
                border: '1px solid rgba(255, 109, 31, 0.25)',
                marginBottom: '28px',
              }}
            >
              <span style={{ fontSize: '0.72rem', color: 'var(--color-tangerine)', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                First Verified Milestone Deliverable
              </span>
              <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--color-linen)', lineHeight: 1.45 }}>
                {activePath.firstProjectDeliverable}
              </p>
            </div>
          )}

          {/* 5-Phase Curriculum Breakdown */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span style={{ fontSize: '0.74rem', color: 'var(--color-cotton)', fontWeight: 700, textTransform: 'uppercase' }}>
                5-Phase Structured Curriculum Path
              </span>
              <button
                type="button"
                onClick={() => navigate(`/paths/${activePath.slug}`)}
                className="button-text"
                style={{ fontSize: '0.78rem', color: 'var(--color-tangerine)' }}
              >
                Full Syllabus &amp; Specs ↗
              </button>
            </div>

            <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {activePath.curriculum.map((c, idx) => (
                <li
                  key={c.id || idx}
                  style={{
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid var(--color-line-dark)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '10px',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--color-tangerine)', fontWeight: 700, textTransform: 'uppercase', marginRight: '8px' }}>
                      Phase {idx + 1}: {c.phase}
                    </span>
                    <strong style={{ fontSize: '0.88rem', color: 'var(--color-linen)' }}>
                      {c.title}
                    </strong>
                  </div>
                  <span style={{ fontSize: '0.76rem', color: 'var(--color-muted-light)', fontFamily: 'var(--font-mono)' }}>
                    ~{c.estimatedHours} hrs
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </DarkCard>
      )}
    </section>
  );
};
