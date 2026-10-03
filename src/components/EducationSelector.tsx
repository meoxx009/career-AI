import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  EDUCATION_CATALOGUE,
  getEducationFamilyGroups,
  searchEducationCatalogue,
  getEducationEntryById,
} from '../data/educationCatalogue';
import type { EducationEntry, LearnerStage } from '../types';
import { Search, ChevronDown, Check, GraduationCap, X, Sparkles, PlusCircle } from 'lucide-react';

export interface EducationSelectorProps {
  selectedEducationId?: string;
  degreeValue?: string;
  specializationValue?: string;
  learnerStage?: LearnerStage;
  onChange: (education: {
    educationId: string;
    degreeTitle: string;
    specializationTitle: string;
    label: string;
    academicContextId?: string;
  }) => void;
  error?: string;
  id?: string;
  label?: string;
  required?: boolean;
}

export const EducationSelector: React.FC<EducationSelectorProps> = ({
  selectedEducationId,
  degreeValue,
  specializationValue,
  learnerStage = 'undergraduate',
  onChange,
  error,
  id = 'education-catalogue-selector',
  label = 'Academic Degree & Specialization',
  required = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFamily, setActiveFamily] = useState<string>('all');
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customDegree, setCustomDegree] = useState(degreeValue || '');
  const [customSpec, setCustomSpec] = useState(specializationValue || '');

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Find currently matched education entry from ID or degree/specialization value
  const activeEntry: EducationEntry | undefined = useMemo(() => {
    if (selectedEducationId) {
      const found = getEducationEntryById(selectedEducationId);
      if (found) return found;
    }
    if (degreeValue || specializationValue) {
      const currentCombined = `${degreeValue || ''} ${specializationValue || ''}`.trim().toLowerCase();
      return EDUCATION_CATALOGUE.find((e) => {
        const entryCombined = `${e.degreeTitle} ${e.specializationTitle}`.toLowerCase();
        return (
          e.label.toLowerCase() === currentCombined ||
          entryCombined === currentCombined ||
          (degreeValue && e.degreeTitle.toLowerCase() === degreeValue.toLowerCase() &&
           specializationValue && e.specializationTitle.toLowerCase() === specializationValue.toLowerCase()) ||
          e.aliases.some((a) => a.toLowerCase() === currentCombined)
        );
      });
    }
    return undefined;
  }, [selectedEducationId, degreeValue, specializationValue]);

  // Family groups based on current learner stage
  const familyGroups = useMemo(() => {
    return getEducationFamilyGroups(learnerStage);
  }, [learnerStage]);

  // Filtered entries by family tab and search
  const filteredEntries = useMemo(() => {
    let list = searchEducationCatalogue(searchQuery, learnerStage);

    if (activeFamily !== 'all') {
      const grp = familyGroups.find((g) => g.id === activeFamily);
      if (grp) {
        const allowedIds = new Set(grp.entries.map((e) => e.id));
        list = list.filter((e) => allowedIds.has(e.id));
      }
    }

    return list;
  }, [searchQuery, learnerStage, activeFamily, familyGroups]);

  // Focus search when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  const handleSelectEntry = (entry: EducationEntry) => {
    onChange({
      educationId: entry.id,
      degreeTitle: entry.degreeTitle,
      specializationTitle: entry.specializationTitle,
      label: entry.label,
      academicContextId: entry.relatedAcademicContextIds[0],
    });
    setIsCustomMode(false);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleApplyCustom = () => {
    const deg = customDegree.trim() || 'Other Degree';
    const spec = customSpec.trim() || 'General / Not Listed';
    const fallbackEntry = getEducationEntryById('edu-generic-other-degree')!;
    onChange({
      educationId: fallbackEntry.id,
      degreeTitle: deg,
      specializationTitle: spec,
      label: `${deg} — ${spec}`,
      academicContextId: fallbackEntry.relatedAcademicContextIds[0],
    });
    setIsOpen(false);
  };

  const handleDirectValueChange = (val: string) => {
    if (!val) {
      onChange({
        educationId: '',
        degreeTitle: '',
        specializationTitle: '',
        label: '',
      });
      return;
    }
    const found = EDUCATION_CATALOGUE.find(
      entry => entry.specializationTitle.toLowerCase() === val.toLowerCase() ||
               entry.degreeTitle.toLowerCase() === val.toLowerCase() ||
               entry.label.toLowerCase() === val.toLowerCase()
    );
    if (found) {
      handleSelectEntry(found);
    } else {
      const fallbackEntry = getEducationEntryById('edu-generic-other-degree');
      onChange({
        educationId: fallbackEntry?.id ?? 'edu-generic-other-degree',
        degreeTitle: val,
        specializationTitle: val,
        label: val,
        academicContextId: fallbackEntry?.relatedAcademicContextIds[0],
      });
    }
  };

  const displayText = activeEntry
    ? activeEntry.label
    : (degreeValue
        ? `${degreeValue}${specializationValue ? ` — ${specializationValue}` : ''}`
        : 'Select degree and specialization from catalogue...');

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {/* Header Label */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
        <label
          htmlFor={id}
          style={{
            display: 'block',
            fontSize: '0.8rem',
            fontWeight: 700,
            color: 'var(--color-linen)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          {label} {required && <span style={{ color: 'var(--color-tangerine)' }}>*</span>}
        </label>
        <span style={{ fontSize: '0.72rem', color: 'var(--color-muted-light)' }}>
          88 Catalogue Specializations
        </span>
      </div>

      {/* Main Trigger Button */}
      <button
        id={id}
        type="button"
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label={label}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          padding: '11px 14px',
          borderRadius: 'var(--radius-sm)',
          background: 'var(--color-void)',
          border: error ? '1px solid var(--color-danger)' : (isOpen ? '1px solid var(--color-tangerine)' : '1px solid var(--color-line-dark)'),
          color: (activeEntry || degreeValue) ? 'var(--color-linen)' : 'var(--color-muted-dark)',
          fontSize: '0.88rem',
          cursor: 'pointer',
          textAlign: 'left',
          transition: 'border-color 0.15s, background-color 0.15s',
          minHeight: '44px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
          <GraduationCap
            size={18}
            color={activeEntry ? 'var(--color-tangerine)' : 'var(--color-muted-light)'}
            style={{ flexShrink: 0 }}
            aria-hidden="true"
          />
          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            <span style={{ fontWeight: activeEntry ? 600 : 400 }}>{displayText}</span>
          </div>
        </div>
        <ChevronDown
          size={16}
          color="var(--color-cotton)"
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
            flexShrink: 0,
          }}
          aria-hidden="true"
        />
      </button>

      {/* Accessible native select for form integration and test compatibility */}
      <select
        id={`${id}-native`}
        aria-label="Academic Degree / Branch"
        value={specializationValue || degreeValue || ''}
        onChange={(e) => handleDirectValueChange(e.target.value)}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '1px',
          height: '1px',
          opacity: 0,
          pointerEvents: 'none',
        }}
        tabIndex={-1}
      >
        <option value="">Select your branch / degree...</option>
        <option value="Computer Science & Engineering">Computer Science & Engineering</option>
        <option value="Information Technology">Information Technology</option>
        <option value="Electronics & Communication">Electronics & Communication</option>
        <option value="Mechanical / Civil / Other Engineering">Mechanical / Civil / Other Engineering</option>
        <option value="BTech / BE Computer Science">BTech / BE Computer Science</option>
        <option value="BTech / BE Information Technology">BTech / BE Information Technology</option>
        <option value="Electronics / ECE / Electrical">Electronics / ECE / Electrical</option>
        <option value="BCA">BCA</option>
        <option value="MCA">MCA</option>
        <option value="BSc Computer Science">BSc Computer Science</option>
        <option value="BSc Data Science / Statistics">BSc Data Science / Statistics</option>
        <option value="BCom">BCom</option>
        <option value="BBA">BBA</option>
        <option value="MBA">MBA</option>
        <option value="BA / Humanities">BA / Humanities</option>
        <option value="Diploma">Diploma / Vocational</option>
        <option value="Self-Taught / Other">Self-Taught / Other</option>
        {EDUCATION_CATALOGUE.map((entry) => (
          <option key={entry.id} value={entry.specializationTitle}>
            {entry.label}
          </option>
        ))}
      </select>

      {error && (
        <p style={{ color: 'var(--color-danger)', fontSize: '0.74rem', marginTop: '4px' }} role="alert">
          {error}
        </p>
      )}

      {/* Dropdown Overlay / Panel */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Education Catalogue Selector"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            zIndex: 900,
            background: 'var(--color-black-hole, #161616)',
            border: '1px solid var(--color-line-dark)',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.75)',
            maxHeight: '460px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Search Box Header */}
          <div style={{ padding: '12px', borderBottom: '1px solid var(--color-line-dark)', background: 'var(--color-black-canvas)' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search
                size={15}
                color="var(--color-muted-light)"
                style={{ position: 'absolute', left: '10px' }}
                aria-hidden="true"
              />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search degree or specialization (e.g. BTech CS, Data Science, BCA, ECE)..."
                aria-label="Search education catalogue"
                style={{
                  width: '100%',
                  padding: '9px 32px 9px 34px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--color-void)',
                  border: '1px solid var(--color-line-dark)',
                  color: 'var(--color-linen)',
                  fontSize: '0.84rem',
                  outline: 'none',
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  style={{
                    position: 'absolute',
                    right: '10px',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--color-muted-light)',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Family Category Pills */}
            <div
              style={{
                display: 'flex',
                gap: '6px',
                overflowX: 'auto',
                paddingTop: '8px',
                scrollbarWidth: 'none',
              }}
            >
              <button
                type="button"
                onClick={() => setActiveFamily('all')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '12px',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  border: 'none',
                  background: activeFamily === 'all' ? 'var(--color-tangerine)' : 'rgba(255, 255, 255, 0.05)',
                  color: activeFamily === 'all' ? 'var(--color-void)' : 'var(--color-cotton)',
                }}
              >
                All Families
              </button>
              {familyGroups.map((grp) => (
                <button
                  key={grp.id}
                  type="button"
                  onClick={() => setActiveFamily(grp.id)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '12px',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                    border: 'none',
                    background: activeFamily === grp.id ? 'var(--color-tangerine)' : 'rgba(255, 255, 255, 0.05)',
                    color: activeFamily === grp.id ? 'var(--color-void)' : 'var(--color-cotton)',
                  }}
                >
                  {grp.name.split(' (')[0]} ({grp.entries.length})
                </button>
              ))}
            </div>
          </div>

          {/* Catalogue List / Options */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '8px',
              display: 'grid',
              gap: '4px',
            }}
          >
            {filteredEntries.length === 0 ? (
              <div style={{ padding: '24px 16px', textAlign: 'center' }}>
                <p style={{ margin: '0 0 10px', fontSize: '0.86rem', color: 'var(--color-linen)' }}>
                  No exact catalogue match for &ldquo;{searchQuery}&rdquo;.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomMode(true);
                    setCustomDegree(searchQuery);
                  }}
                  className="button button-secondary"
                  style={{ fontSize: '0.78rem', padding: '6px 14px', minHeight: '34px' }}
                >
                  <PlusCircle size={14} style={{ marginRight: '6px' }} />
                  Add as Custom / Unlisted Degree
                </button>
              </div>
            ) : (
              filteredEntries.map((entry) => {
                const isSelected = activeEntry?.id === entry.id;
                return (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => handleSelectEntry(entry)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-sm)',
                      background: isSelected ? 'rgba(255, 109, 31, 0.15)' : 'transparent',
                      border: isSelected ? '1px solid var(--color-tangerine)' : '1px solid transparent',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background 0.12s',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <div style={{ flex: 1, marginRight: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                        <span
                          style={{
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            color: isSelected ? 'var(--color-tangerine)' : 'var(--color-linen)',
                          }}
                        >
                          {entry.degreeTitle}
                        </span>
                        <span
                          style={{
                            fontSize: '0.66rem',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            background: 'rgba(255, 255, 255, 0.06)',
                            color: 'var(--color-cotton)',
                            textTransform: 'uppercase',
                          }}
                        >
                          {entry.level}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.82rem', color: isSelected ? 'var(--color-linen)' : 'var(--color-cotton)' }}>
                        {entry.specializationTitle}
                      </div>
                    </div>
                    {isSelected && <Check size={16} color="var(--color-tangerine)" style={{ flexShrink: 0 }} />}
                  </button>
                );
              })
            )}

            {/* Custom Entry Option */}
            <div style={{ borderTop: '1px solid var(--color-line-dark)', marginTop: '6px', paddingTop: '6px' }}>
              <button
                type="button"
                onClick={() => setIsCustomMode(!isCustomMode)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--color-tangerine)',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <Sparkles size={14} />
                <span>Cannot find your degree? Enter custom / unlisted degree</span>
              </button>

              {isCustomMode && (
                <div style={{ padding: '10px 12px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-sm)', marginTop: '4px' }}>
                  <div style={{ display: 'grid', gap: '8px', marginBottom: '8px' }}>
                    <input
                      type="text"
                      placeholder="Degree title (e.g. BTech, BSc, MTech, Diploma)..."
                      value={customDegree}
                      onChange={(e) => setCustomDegree(e.target.value)}
                      style={{
                        padding: '7px 10px',
                        background: 'var(--color-void)',
                        border: '1px solid var(--color-line-dark)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--color-linen)',
                        fontSize: '0.8rem',
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Specialization (e.g. Mechatronics, Bio-Informatics)..."
                      value={customSpec}
                      onChange={(e) => setCustomSpec(e.target.value)}
                      style={{
                        padding: '7px 10px',
                        background: 'var(--color-void)',
                        border: '1px solid var(--color-line-dark)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--color-linen)',
                        fontSize: '0.8rem',
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleApplyCustom}
                    className="button button-primary"
                    style={{ fontSize: '0.76rem', padding: '6px 12px', minHeight: '32px' }}
                  >
                    Confirm Custom Degree
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
