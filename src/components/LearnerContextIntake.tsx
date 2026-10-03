import React, { useState } from 'react';
import type { UserProfile, LearnerStage, SchoolStream } from '../types';
import {
  LEARNER_STAGES,
  SCHOOL_STREAMS,
  INTEREST_OPTIONS,
} from '../lib/pathRecommendations';
import { SKILLS_CATALOGUE } from '../data/skillCatalogue';
import { EducationSelector } from './EducationSelector';
import { GraduationCap, BookOpen, Check, Info, Search, Sparkles } from 'lucide-react';

export interface LearnerContextIntakeProps {
  profile: Partial<UserProfile>;
  onChange: (updates: Partial<UserProfile>) => void;
  errors?: Record<string, string>;
  mode?: 'all' | 'stage_academic' | 'interests_skills';
  compact?: boolean;
}

export const LearnerContextIntake: React.FC<LearnerContextIntakeProps> = ({
  profile,
  onChange,
  errors = {},
  mode = 'all',
  compact = false,
}) => {
  const learnerStage: LearnerStage = profile.learnerStage || 'undergraduate';
  const isSchool = learnerStage === 'class_10' || learnerStage === 'class_11_12';

  const [skillSearch, setSkillSearch] = useState('');
  const [interestSearch, setInterestSearch] = useState('');

  const currentSkills = profile.currentSkills || [];
  const currentInterests = profile.interests || [];

  const handleStageChange = (newStage: LearnerStage) => {
    const isNewSchool = newStage === 'class_10' || newStage === 'class_11_12';
    const isNewSelfTaught = newStage === 'self_taught';
    onChange({
      learnerStage: newStage,
      schoolClass: isNewSchool ? (newStage === 'class_10' ? 'Class 10' : 'Class 11') : undefined,
      stream: isNewSchool ? (profile.stream || 'pcm') : undefined,
      branch: isNewSchool
        ? `School (${profile.stream || 'PCM'})`
        : isNewSelfTaught
        ? (profile.branch || 'Self-Taught / Other')
        : (profile.branch || 'Computer Science & Engineering'),
      degree: isNewSchool
        ? 'School Student'
        : isNewSelfTaught
        ? (profile.degree || 'Self-Taught')
        : (profile.degree || 'BTech / BE'),
      specialization: isNewSchool
        ? (profile.stream || 'PCM')
        : isNewSelfTaught
        ? 'Self-Taught / Independent'
        : (profile.branch || 'Computer Science & Engineering'),
      studyYear: isNewSchool
        ? (newStage === 'class_10' ? 'Class 10' : 'Class 12')
        : isNewSelfTaught
        ? (profile.studyYear || 'Self-Taught / Independent')
        : (profile.studyYear || '3rd Year'),
    });
  };

  const handleStreamChange = (streamId: SchoolStream) => {
    const streamMeta = SCHOOL_STREAMS.find(s => s.id === streamId);
    onChange({
      stream: streamId,
      branch: `School (${streamMeta?.shortCode || streamId.toUpperCase()})`,
    });
  };

  const toggleInterest = (interestId: string) => {
    if (currentInterests.includes(interestId)) {
      onChange({ interests: currentInterests.filter(i => i !== interestId) });
    } else {
      onChange({ interests: [...currentInterests, interestId] });
    }
  };

  const toggleSkill = (skillName: string) => {
    if (currentSkills.includes(skillName)) {
      onChange({ currentSkills: currentSkills.filter(s => s !== skillName) });
    } else {
      onChange({ currentSkills: [...currentSkills, skillName] });
    }
  };

  const filteredSkills = SKILLS_CATALOGUE.filter(s =>
    s.name.toLowerCase().includes(skillSearch.toLowerCase()) ||
    s.category.toLowerCase().includes(skillSearch.toLowerCase()) ||
    s.slug.toLowerCase().includes(skillSearch.toLowerCase())
  );

  const filteredInterests = INTEREST_OPTIONS.filter(i =>
    i.label.toLowerCase().includes(interestSearch.toLowerCase()) ||
    i.category.toLowerCase().includes(interestSearch.toLowerCase())
  );

  return (
    <div style={{ display: 'grid', gap: '28px' }}>
      {/* ================= SECTION 1: LEARNER STAGE & ACADEMIC CONTEXT ================= */}
      {(mode === 'all' || mode === 'stage_academic') && (
        <div style={{ display: 'grid', gap: '22px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
              <label style={{ fontSize: '0.86rem', fontWeight: 800, color: 'var(--color-linen)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                1. What is your current learner stage? <span style={{ color: 'var(--color-tangerine)' }}>*</span>
              </label>
              <span style={{ fontSize: '0.74rem', color: 'var(--color-muted-light)' }}>Required</span>
            </div>
            <p className="muted-light" style={{ fontSize: '0.82rem', margin: '0 0 14px' }}>
              Choose your present academic or professional position. We calibrate suggestions to your true learning horizon.
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: compact ? '1fr' : 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '10px',
              }}
              role="radiogroup"
              aria-label="Learner stage"
            >
              {LEARNER_STAGES.map(stage => {
                const isSelected = learnerStage === stage.id;
                return (
                  <button
                    key={stage.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => handleStageChange(stage.id)}
                    style={{
                      textAlign: 'left',
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-sm)',
                      background: isSelected ? 'rgba(255, 109, 31, 0.12)' : 'var(--color-void)',
                      border: isSelected ? '1px solid var(--color-tangerine)' : '1px solid var(--color-line-dark)',
                      cursor: 'pointer',
                      transition: 'border-color 0.15s, background-color 0.15s',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: isSelected ? 'var(--color-tangerine)' : 'var(--color-cotton)' }}>
                        {stage.badge}
                      </span>
                      {isSelected && <Check size={14} color="var(--color-tangerine)" aria-hidden="true" />}
                    </div>
                    <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--color-linen)', lineHeight: 1.3 }}>
                      {stage.label}
                    </div>
                  </button>
                );
              })}
            </div>
            {errors.learnerStage && (
              <p style={{ color: 'var(--color-danger)', fontSize: '0.78rem', marginTop: '6px' }} role="alert">
                {errors.learnerStage}
              </p>
            )}
          </div>

          {/* Conditional Academic Context for School Students */}
          {isSchool ? (
            <div
              style={{
                background: 'rgba(255, 243, 225, 0.03)',
                border: '1px solid rgba(255, 109, 31, 0.25)',
                borderRadius: 'var(--radius-md)',
                padding: '20px',
                display: 'grid',
                gap: '18px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BookOpen size={16} color="var(--color-tangerine)" aria-hidden="true" />
                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--color-cotton)', textTransform: 'uppercase' }}>
                  School Academic Context
                </span>
              </div>

              {/* Class selection */}
              <div>
                <label htmlFor="intake-school-class" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-linen)', marginBottom: '6px' }}>
                  Current Class or Level
                </label>
                <select
                  id="intake-school-class"
                  value={profile.schoolClass || (learnerStage === 'class_10' ? 'Class 10' : 'Class 11')}
                  onChange={e => onChange({ schoolClass: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--color-void)',
                    border: '1px solid var(--color-line-dark)',
                    color: 'var(--color-linen)',
                    fontSize: '0.9rem',
                  }}
                >
                  <option value="Class 10">Class 10 completed (planning stream)</option>
                  <option value="Class 11">Class 11</option>
                  <option value="Class 12">Class 12</option>
                </select>
              </div>

              {/* Stream selection */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-linen)', marginBottom: '6px' }}>
                  Stream Choice or Intended Stream <span style={{ color: 'var(--color-tangerine)' }}>*</span>
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: compact ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
                  {SCHOOL_STREAMS.map(stream => {
                    const isSelected = (profile.stream || 'pcm') === stream.id;
                    return (
                      <button
                        key={stream.id}
                        type="button"
                        onClick={() => handleStreamChange(stream.id)}
                        style={{
                          textAlign: 'left',
                          padding: '10px 12px',
                          borderRadius: 'var(--radius-sm)',
                          background: isSelected ? 'rgba(255, 109, 31, 0.15)' : 'var(--color-void)',
                          border: isSelected ? '1px solid var(--color-tangerine)' : '1px solid var(--color-line-dark)',
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ fontWeight: 700, fontSize: '0.84rem', color: isSelected ? 'var(--color-tangerine)' : 'var(--color-linen)' }}>
                          {stream.label}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--color-muted-light)', marginTop: '2px' }}>
                          {stream.description}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Favourite subjects (optional) */}
              <div>
                <label htmlFor="intake-fav-subjects" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-linen)', marginBottom: '4px' }}>
                  Favourite Subjects <span style={{ color: 'var(--color-muted-light)', fontWeight: 400 }}>(optional)</span>
                </label>
                <input
                  id="intake-fav-subjects"
                  type="text"
                  placeholder="e.g. Mathematics, Computer Science, Biology, English, Economics"
                  value={(profile.favoriteSubjects || []).join(', ')}
                  onChange={e => onChange({ favoriteSubjects: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--color-void)',
                    border: '1px solid var(--color-line-dark)',
                    color: 'var(--color-linen)',
                    fontSize: '0.88rem',
                  }}
                />
              </div>
            </div>
          ) : learnerStage === 'self_taught' ? (
            /* Self-Taught Learner Academic Context — formal degree not forced */
            <div
              style={{
                background: 'rgba(255, 243, 225, 0.02)',
                border: '1px solid var(--color-line-dark)',
                borderRadius: 'var(--radius-md)',
                padding: '20px',
                display: 'grid',
                gap: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={16} color="var(--color-tangerine)" aria-hidden="true" />
                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--color-cotton)', textTransform: 'uppercase' }}>
                  Self-Taught &amp; Independent Learning Horizon
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--color-muted-light)', lineHeight: 1.5 }}>
                Formal college degrees are <strong>not required</strong>. Career recommendations and roadmap planning will evaluate verified hands-on projects, demonstrated skills, and portfolio proof.
              </p>

              {/* Optional Prior Degree or Background */}
              <div>
                <EducationSelector
                  id="self-taught-prior-education"
                  label="Prior Degree or Academic Discipline (optional)"
                  required={false}
                  degreeValue={profile.degree}
                  specializationValue={profile.branch}
                  learnerStage={learnerStage}
                  onChange={({ degreeTitle, specializationTitle }) => {
                    onChange({
                      degree: degreeTitle,
                      branch: specializationTitle,
                      specialization: specializationTitle,
                    });
                  }}
                />
              </div>

              {/* Current Status */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
                  <label htmlFor="onboarding-study-year" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-linen)' }}>
                    Current Learning Status
                  </label>
                  <span style={{ fontSize: '0.74rem', color: 'var(--color-cotton)' }}>
                    (self-paced)
                  </span>
                </div>
                <select
                  id="onboarding-study-year"
                  aria-label="Current Academic Year / Learning Status"
                  value={profile.studyYear || 'Self-Taught / Independent'}
                  onChange={e => onChange({ studyYear: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--color-void)',
                    border: '1px solid var(--color-line-dark)',
                    color: 'var(--color-linen)',
                    fontSize: '0.9rem',
                  }}
                >
                  <option value="Self-Taught / Independent">Independent Study (Self-Paced)</option>
                  <option value="Working / Career Switch">Working / Career Switch</option>
                  <option value="Career Switcher">Career Switcher (Transitioning into Tech)</option>
                  <option value="Bootcamp / Practical Course">Bootcamp / Practical Project Course</option>
                  <option value="Recent Graduate">Recent Graduate (Independent Upskilling)</option>
                </select>
              </div>
            </div>
          ) : (
            /* Higher Ed / Graduate / Diploma Academic Context */
            <div
              style={{
                background: 'rgba(255, 243, 225, 0.02)',
                border: '1px solid var(--color-line-dark)',
                borderRadius: 'var(--radius-md)',
                padding: '20px',
                display: 'grid',
                gap: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <GraduationCap size={16} color="var(--color-tangerine)" aria-hidden="true" />
                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--color-cotton)', textTransform: 'uppercase' }}>
                  Higher Education &amp; Discipline Context
                </span>
              </div>

              {/* Data-Driven Degree and Specialization Selector */}
              <div>
                <EducationSelector
                  id="onboarding-branch"
                  label="Academic Degree & Specialization"
                  required={true}
                  degreeValue={profile.degree}
                  specializationValue={profile.branch}
                  learnerStage={learnerStage}
                  error={errors.branch}
                  onChange={({ degreeTitle, specializationTitle }) => {
                    onChange({
                      degree: degreeTitle,
                      branch: specializationTitle,
                      specialization: specializationTitle,
                    });
                  }}
                />
              </div>

              {/* Current Year or Graduation Status */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
                  <label htmlFor="onboarding-study-year" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-linen)' }}>
                    Current Academic Year
                  </label>
                  <span style={{ fontSize: '0.74rem', color: 'var(--color-tangerine)', fontWeight: 600 }}>
                    (required)
                  </span>
                </div>
                <select
                  id="onboarding-study-year"
                  aria-label="Current Academic Year"
                  value={profile.studyYear || ''}
                  onChange={e => onChange({ studyYear: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--color-void)',
                    border: errors.studyYear ? '1px solid var(--color-danger)' : '1px solid var(--color-line-dark)',
                    color: profile.studyYear ? 'var(--color-linen)' : 'var(--color-muted-dark)',
                    fontSize: '0.9rem',
                  }}
                >
                  <option value="">Select your academic year...</option>
                  <option value="1st Year">1st Year (Foundations & Exploration)</option>
                  <option value="2nd Year">2nd Year (Core Programming & Systems)</option>
                  <option value="3rd Year">3rd Year (Internship Preparation & Projects)</option>
                  <option value="4th Year">4th Year (Campus Placement & Direct Hiring)</option>
                  <option value="Recent Graduate">Recent Graduate (Active Job Seeker)</option>
                  <option value="Working / Career Switch">Working Professional / Switching to Tech</option>
                  <option value="Self-Taught / Independent">Self-Taught / Independent Study</option>
                </select>
                {errors.studyYear && (
                  <p style={{ color: 'var(--color-danger)', fontSize: '0.74rem', marginTop: '4px' }} role="alert">
                    {errors.studyYear}
                  </p>
                )}
              </div>

              {/* Specific branch detail if needed */}
              <div>
                <label htmlFor="intake-branch-custom" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-linen)', marginBottom: '4px' }}>
                  Specific Branch / Specialization <span style={{ color: 'var(--color-muted-light)', fontWeight: 400 }}>(optional)</span>
                </label>
                <input
                  id="intake-branch-custom"
                  type="text"
                  placeholder="e.g. Artificial Intelligence, Data Science, Cyber Security, Mechanical"
                  value={profile.branch || ''}
                  onChange={e => onChange({ branch: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--color-void)',
                    border: '1px solid var(--color-line-dark)',
                    color: 'var(--color-linen)',
                    fontSize: '0.88rem',
                  }}
                />
              </div>
            </div>
          )}

          <div
            style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--color-line-dark)',
              fontSize: '0.76rem',
              color: 'var(--color-muted-light)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Info size={14} color="var(--color-cotton)" aria-hidden="true" />
            <span>
              <strong>Fairness contract:</strong> Academic stage, stream, and CGPA are used only to suggest relevant curriculum starting points. They are never used to compute ability scores, ranking penalties, or hireability predictions.
            </span>
          </div>
        </div>
      )}

      {/* ================= SECTION 2: INTERESTS, SKILLS & COMMITMENT ================= */}
      {(mode === 'all' || mode === 'interests_skills') && (
        <div style={{ display: 'grid', gap: '22px' }}>
          {/* Interests Grouped Selection */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
              <label style={{ fontSize: '0.86rem', fontWeight: 800, color: 'var(--color-linen)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                2. Select Your Career &amp; Topic Interests <span style={{ color: 'var(--color-muted-light)', fontWeight: 400 }}>(multi-select)</span>
              </label>
              <span style={{ fontSize: '0.74rem', color: 'var(--color-cotton)' }}>{currentInterests.length} selected</span>
            </div>
            <p className="muted-light" style={{ fontSize: '0.82rem', margin: '0 0 12px' }}>
              Choose topics that genuinely engage you. We map these directly to industry role benchmarks.
            </p>

            <div style={{ position: 'relative', marginBottom: '12px' }}>
              <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted-light)' }} aria-hidden="true" />
              <input
                type="text"
                placeholder="Search interests (e.g. backend, ai, design, security)..."
                value={interestSearch}
                onChange={e => setInterestSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 34px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--color-void)',
                  border: '1px solid var(--color-line-dark)',
                  color: 'var(--color-linen)',
                  fontSize: '0.84rem',
                }}
                aria-label="Filter interests"
              />
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {filteredInterests.map(interest => {
                const isSelected = currentInterests.includes(interest.id);
                return (
                  <button
                    key={interest.id}
                    type="button"
                    onClick={() => toggleInterest(interest.id)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '999px',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      background: isSelected ? 'var(--color-tangerine)' : 'var(--color-black-soft)',
                      color: isSelected ? '#121415' : 'var(--color-linen)',
                      border: isSelected ? '1px solid var(--color-tangerine)' : '1px solid var(--color-line-dark)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <span>{interest.label}</span>
                    {isSelected && <Check size={12} aria-hidden="true" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Current Skills from validated seed catalogue */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
              <label style={{ fontSize: '0.86rem', fontWeight: 800, color: 'var(--color-linen)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                3. Current Skills <span style={{ color: 'var(--color-muted-light)', fontWeight: 400 }}>(from seed catalogue, optional)</span>
              </label>
              <span style={{ fontSize: '0.74rem', color: 'var(--color-cotton)' }}>{currentSkills.length} selected</span>
            </div>
            <p className="muted-light" style={{ fontSize: '0.82rem', margin: '0 0 12px' }}>
              Select skills you have already studied or used in small exercises. (Honest baselines help identify the right starting week).
            </p>

            <div style={{ position: 'relative', marginBottom: '12px' }}>
              <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted-light)' }} aria-hidden="true" />
              <input
                type="text"
                placeholder="Search canonical skill catalogue..."
                value={skillSearch}
                onChange={e => setSkillSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 34px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--color-void)',
                  border: '1px solid var(--color-line-dark)',
                  color: 'var(--color-linen)',
                  fontSize: '0.84rem',
                }}
                aria-label="Filter skills"
              />
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {filteredSkills.map(skill => {
                const isSelected = currentSkills.includes(skill.name);
                return (
                  <button
                    key={skill.id}
                    type="button"
                    onClick={() => toggleSkill(skill.name)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      background: isSelected ? 'rgba(255, 109, 31, 0.18)' : 'var(--color-void)',
                      color: isSelected ? 'var(--color-tangerine)' : 'var(--color-linen)',
                      border: isSelected ? '1px solid var(--color-tangerine)' : '1px solid var(--color-line-dark)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <span>{skill.name}</span>
                    <span style={{ fontSize: '0.68rem', color: 'var(--color-muted-light)', opacity: 0.8 }}>({skill.category})</span>
                    {isSelected && <Check size={12} color="var(--color-tangerine)" aria-hidden="true" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preferred Work Direction (optional free-text / guidance) */}
          <div>
            <label htmlFor="intake-work-direction" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-linen)', marginBottom: '4px' }}>
              Preferred Work Direction or Target Goals <span style={{ color: 'var(--color-muted-light)', fontWeight: 400 }}>(optional)</span>
            </label>
            <input
              id="intake-work-direction"
              type="text"
              placeholder="e.g. Build open-source developer tools, transition into data analyst, or enter a tech internship"
              value={profile.preferredWorkDirection || ''}
              onChange={e => onChange({ preferredWorkDirection: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--color-void)',
                border: '1px solid var(--color-line-dark)',
                color: 'var(--color-linen)',
                fontSize: '0.88rem',
              }}
            />
          </div>

          {/* Weekly Available Study Hours */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
              <label htmlFor="intake-hours-input" style={{ fontSize: '0.86rem', fontWeight: 800, color: 'var(--color-linen)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                4. Weekly Dedicated Study Commitment <span style={{ color: 'var(--color-tangerine)' }}>*</span>
              </label>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-tangerine)' }}>
                {profile.hoursPerWeek || 8} hrs / week
              </span>
            </div>
            <p className="muted-light" style={{ fontSize: '0.82rem', margin: '0 0 14px' }}>
              Set an achievable schedule. Milestone schedules dynamically budget tasks into sequential weeks based on this number.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <input
                type="range"
                min="1"
                max="40"
                step="1"
                value={profile.hoursPerWeek || 8}
                onChange={e => onChange({ hoursPerWeek: Number(e.target.value) })}
                style={{ flex: 1, accentColor: 'var(--color-tangerine)' }}
                aria-label="Weekly study hours slider"
              />
              <input
                id="intake-hours-input"
                type="number"
                min="1"
                max="40"
                value={profile.hoursPerWeek || 8}
                onChange={e => {
                  const val = Number(e.target.value);
                  onChange({ hoursPerWeek: isNaN(val) ? 0 : val });
                }}
                style={{
                  width: '70px',
                  padding: '6px 10px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--color-void)',
                  border: '1px solid var(--color-line-dark)',
                  color: 'var(--color-linen)',
                  fontSize: '0.9rem',
                  textAlign: 'center',
                }}
                aria-label="Weekly dedicated study commitment"
              />
            </div>
            {errors.hours && (
              <p style={{ color: 'var(--color-danger)', fontSize: '0.78rem', marginTop: '6px' }} role="alert">
                {errors.hours}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
