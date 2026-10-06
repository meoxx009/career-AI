import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  ChevronDown,
  ChevronUp,
  Compass,
  ArrowRight,
} from 'lucide-react';

export interface BranchingPathTreeProps {
  profile: UserProfile;
  recommendations: PathRecommendation[];
  selectedRoleId: number | null;
  skillObservations?: Record<number, number | null>;
  onActivateRole: (roleId: number, roleTitle: string) => void;
  onOpenCustomizer?: () => void;
  applyKey?: number;
}

export const BranchingPathTree: React.FC<BranchingPathTreeProps> = ({
  profile,
  recommendations,
  selectedRoleId,
  onActivateRole,
  onOpenCustomizer,
  applyKey,
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
        map.get('software_engineering')!.items.push(item);
      }
    });

    // Filter to branches that have at least one recommended role
    return Array.from(map.values()).filter((b) => b.items.length > 0);
  }, [resolvedPaths]);

  // State for user manually previewing a node
  const [userSelectedSlug, setUserSelectedSlug] = useState<string | null>(null);
  const [prevApplyKey, setPrevApplyKey] = useState(applyKey);
  // Reset manual preview selection upon a new Apply commit
  if (applyKey !== prevApplyKey) {
    setPrevApplyKey(applyKey);
    setUserSelectedSlug(null);
  }

  // Accordion state for compact "Why this direction?"
  const [expandedWhySlug, setExpandedWhySlug] = useState<string | null>(null);

  // Top-to-bottom animation trigger on genuine new Apply
  const [isAnimating, setIsAnimating] = useState(false);
  const prevAnimRef = useRef(applyKey ?? 0);

  useEffect(() => {
    if (applyKey !== undefined && applyKey > 0 && applyKey !== prevAnimRef.current) {
      prevAnimRef.current = applyKey;
      const frame = requestAnimationFrame(() => {
        setIsAnimating(true);
      });
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 750);
      return () => {
        cancelAnimationFrame(frame);
        clearTimeout(timer);
      };
    }
  }, [applyKey]);

  // Default open behavior:
  // - If an explicit target role exists, open its path by default after Apply.
  // - If only suggestions exist, invite the learner to choose a direction node.
  const targetRoleSlug = useMemo(() => {
    if (profile.targetRoleId) {
      const matched = resolvedPaths.find((p) => p.path.numericId === profile.targetRoleId);
      return matched?.path.slug || null;
    }
    return null;
  }, [profile.targetRoleId, resolvedPaths]);

  const activeRoleSlug = useMemo(() => {
    if (userSelectedSlug && resolvedPaths.some((p) => p.path.slug === userSelectedSlug)) {
      return userSelectedSlug;
    }
    return targetRoleSlug;
  }, [userSelectedSlug, resolvedPaths, targetRoleSlug]);

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

  const toggleWhy = (slug: string) => {
    setExpandedWhySlug((prev) => (prev === slug ? null : slug));
  };

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
        {/* LEVEL 1: ROOT NODE (YOUR APPLIED DIRECTION) */}
        <div
          className={isAnimating ? 'branch-animate-root' : undefined}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 2 }}
        >
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
                YOUR APPLIED DIRECTION • ROOT HORIZON • {stageDisplay}
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
            className={isAnimating ? 'branch-animate-stem' : undefined}
            style={{
              width: '2px',
              height: '32px',
              background: 'linear-gradient(180deg, var(--color-tangerine) 0%, var(--color-line-dark) 100%)',
              margin: '0 auto',
              pointerEvents: 'none',
            }}
            aria-hidden="true"
          />
        </div>

        {resolvedPaths.length === 0 ? (
          <div
            style={{
              padding: '36px 24px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '14px',
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: 'var(--radius-md)',
              border: '1px dashed var(--color-line-dark)',
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: 'rgba(255, 109, 31, 0.1)',
                border: '1px solid rgba(255, 109, 31, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-tangerine)',
                marginBottom: '4px',
              }}
            >
              <Sparkles size={20} aria-hidden="true" />
            </div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--color-linen)', fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}>
              Choose a Target Role or Add Interests
            </h3>
            <p className="muted-light" style={{ maxWidth: '540px', margin: 0, fontSize: '0.9rem', lineHeight: 1.55 }}>
              No applied direction signals yet. Customize your profile &amp; interests or select a target career role to generate evidence-aligned paths without manufactured suggestions.
            </p>
            {onOpenCustomizer && (
              <button
                type="button"
                onClick={onOpenCustomizer}
                className="button button-primary"
                aria-label="Configure Profile Signals"
                style={{ marginTop: '8px', fontSize: '0.84rem', padding: '10px 20px' }}
              >
                <span>Configure Profile Signals</span>
              </button>
            )}
          </div>
        ) : (
          <>
            {/* LEVEL 2 & 3: DOMAIN BRANCHES & COMPACT ROLE NODES */}
            <div
              className="tree-branches-grid"
              style={{
                position: 'relative',
                zIndex: 2,
              }}
            >
              {branches.map((branch, bIdx) => (
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
                    className={isAnimating ? 'branch-animate-branch-header' : undefined}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 'var(--radius-pill)',
                      background: 'var(--color-black-hole)',
                      border: '1px solid var(--color-line-dark)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '16px',
                      pointerEvents: 'none',
                    }}
                  >
                    {branch.icon}
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-linen)' }}>
                      {branch.title} ({branch.items.length})
                    </span>
                  </div>

                  {/* Branch connector line down to nodes */}
                  <div
                    className={isAnimating ? 'branch-animate-stem' : undefined}
                    style={{
                      width: '2px',
                      height: '16px',
                      background: 'var(--color-line-dark)',
                      marginBottom: '16px',
                      pointerEvents: 'none',
                    }}
                    aria-hidden="true"
                  />

                  {/* Role Leaf Nodes */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
                    {branch.items.map(({ rec, path }, nIdx) => {
                      const isNodeActive = activeRoleSlug === path.slug;
                      const isRoleTarget = selectedRoleId === path.numericId;
                      const isWhyOpen = expandedWhySlug === path.slug;
                      const staggerDelay = `${0.35 + (bIdx * 2 + nIdx) * 0.08}s`;

                      return (
                        <DarkCard
                          key={path.id}
                          className={isAnimating ? 'branch-animate-node' : undefined}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            padding: '20px',
                            border: isNodeActive
                              ? '1px solid var(--color-tangerine)'
                              : isRoleTarget
                              ? '1px solid var(--color-cotton)'
                              : '1px solid var(--color-line-dark)',
                            background: isNodeActive
                              ? 'rgba(255, 109, 31, 0.08)'
                              : undefined,
                            boxShadow: isNodeActive ? '0 0 20px rgba(255, 109, 31, 0.15)' : 'none',
                            transition: 'border 0.2s ease, background 0.2s ease, box-shadow 0.2s ease',
                            pointerEvents: 'auto',
                            '--stagger-delay': staggerDelay,
                          } as React.CSSProperties}
                        >
                          <div>
                            {/* Header badge row */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                              <StatusBadge variant="tangerine" label={rec.badge || `${path.level.toUpperCase()} LEVEL`} />
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {isRoleTarget && (
                                  <span
                                    style={{
                                      fontSize: '0.68rem',
                                      padding: '2px 8px',
                                      borderRadius: 'var(--radius-pill)',
                                      background: 'rgba(255, 109, 31, 0.2)',
                                      color: 'var(--color-tangerine)',
                                      fontWeight: 700,
                                      border: '1px solid var(--color-tangerine)',
                                    }}
                                  >
                                    Active Target
                                  </span>
                                )}
                                {isNodeActive && !isRoleTarget && (
                                  <span
                                    style={{
                                      fontSize: '0.68rem',
                                      padding: '2px 8px',
                                      borderRadius: 'var(--radius-pill)',
                                      background: 'rgba(250, 243, 225, 0.12)',
                                      color: 'var(--color-cotton)',
                                      fontWeight: 600,
                                    }}
                                  >
                                    Previewing
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Canonical role title */}
                            <h3 style={{ fontSize: '1.2rem', color: 'var(--color-linen)', margin: '0 0 6px', lineHeight: 1.3 }}>
                              {rec.title || path.title}
                            </h3>
                            {rec.title && rec.title !== path.title && (
                              <div style={{ fontSize: '0.74rem', color: 'var(--color-cotton)', marginBottom: '4px' }}>
                                <span>Canonical Role: </span>
                                <span style={{ fontWeight: 600 }}>{path.title}</span>
                              </div>
                            )}

                            {/* One-line description */}
                            <p
                              style={{
                                margin: '0 0 12px',
                                fontSize: '0.84rem',
                                color: 'var(--color-muted-light)',
                                lineHeight: 1.45,
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                              }}
                            >
                              {path.description}
                            </p>

                            {/* Up to 3 relevant skills */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
                              {path.coreSkills.slice(0, 3).map((skill, sIdx) => (
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

                            {/* Compact "Why this direction?" Accordion Toggle */}
                            <div style={{ marginBottom: '14px' }}>
                              <button
                                type="button"
                                onClick={() => toggleWhy(path.slug)}
                                className="button-text"
                                style={{
                                  fontSize: '0.76rem',
                                  color: 'var(--color-tangerine)',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: 0,
                                }}
                                aria-expanded={isWhyOpen}
                              >
                                <span>Why this direction?</span>
                                {isWhyOpen ? <ChevronUp size={12} aria-hidden="true" /> : <ChevronDown size={12} aria-hidden="true" />}
                              </button>
                              {isWhyOpen && (
                                <div
                                  style={{
                                    marginTop: '8px',
                                    padding: '10px 12px',
                                    borderRadius: 'var(--radius-sm)',
                                    background: 'var(--color-black-soft)',
                                    border: '1px solid var(--color-line-dark)',
                                    fontSize: '0.78rem',
                                    color: 'var(--color-linen)',
                                    lineHeight: 1.45,
                                  }}
                                >
                                  {rec.whySuggested || path.description}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Accessible open/preview action button & diagnostic link */}
                          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <PrimaryButton
                              onClick={() => setUserSelectedSlug(path.slug)}
                              aria-label={`Inspect 5-Phase Curriculum Breakdown ▼ ${path.title}`}
                              style={{ width: '100%', fontSize: '0.82rem', padding: '9px 14px' }}
                            >
                              Explore this curriculum roadmap {isNodeActive ? '· Viewing Below ↓' : '· Inspect Breakdown ▼'}
                            </PrimaryButton>

                            <SecondaryButton
                              onClick={() => navigate('/assessment')}
                              style={{ width: '100%', fontSize: '0.76rem', padding: '6px 12px' }}
                            >
                              Take diagnostic assessment
                            </SecondaryButton>
                          </div>
                        </DarkCard>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* DETAIL OVERVIEW CONTAINER (OPENS DIRECTLY BELOW THE TREE UPON NODE SELECTION) */}
      {activePath ? (
        <DarkCard
          className={isAnimating ? 'branch-animate-overview' : undefined}
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
                style={{ fontSize: '0.78rem', color: 'var(--color-tangerine)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                <span>Full Syllabus &amp; Specs</span>
                <ArrowRight size={13} aria-hidden="true" />
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
      ) : (
        resolvedPaths.length > 0 && (
          <DarkCard
            style={{
              padding: '24px',
              textAlign: 'center',
              border: '1px dashed var(--color-line-dark)',
              background: 'var(--color-black-hole)',
            }}
          >
            <Compass size={28} color="var(--color-tangerine)" style={{ margin: '0 auto 10px' }} aria-hidden="true" />
            <h3 style={{ margin: '0 0 6px', fontSize: '1.1rem', color: 'var(--color-linen)' }}>
              Select a Career Direction Above
            </h3>
            <p className="muted-light" style={{ margin: 0, fontSize: '0.88rem', maxWidth: '540px', marginInline: 'auto', lineHeight: 1.5 }}>
              Click or activate any direction node above to inspect its 5-phase structured curriculum, verified milestone deliverables, and activate it for your roadmap.
            </p>
          </DarkCard>
        )
      )}
    </section>
  );
};
