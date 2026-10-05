import React, { useState, useMemo, useRef, useEffect } from 'react';
import { CAREER_CATALOGUE } from '../data/careerCatalogue';
import type { PathCategory } from '../types';
import { Search, ChevronDown, Check, X, Compass, Code2, Database, Palette } from 'lucide-react';

export interface RoleSelectorProps {
  selectedRoleId?: number | null;
  onSelectRole: (roleId: number) => void;
  label?: string;
  helperText?: string;
  showCategoryTabs?: boolean;
  className?: string;
  id?: string;
}

export const RoleSelector: React.FC<RoleSelectorProps> = ({
  selectedRoleId,
  onSelectRole,
  label = 'Target Career Role',
  helperText,
  showCategoryTabs = true,
  className = '',
  id = 'career-role-selector',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<PathCategory | 'all'>('all');
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const categoryTabs = useMemo(() => [
    { id: 'all' as const, label: 'All Roles', count: CAREER_CATALOGUE.length },
    { id: 'software_engineering' as const, label: 'Software & Systems', count: CAREER_CATALOGUE.filter(p => p.category === 'software_engineering').length },
    { id: 'data_ai' as const, label: 'Data & AI', count: CAREER_CATALOGUE.filter(p => p.category === 'data_ai').length },
    { id: 'design_product' as const, label: 'Design & Product', count: CAREER_CATALOGUE.filter(p => p.category === 'design_product').length },
  ], []);

  // Active role
  const activePath = useMemo(() => {
    if (typeof selectedRoleId === 'number') {
      return CAREER_CATALOGUE.find((p) => p.numericId === selectedRoleId) || null;
    }
    return null;
  }, [selectedRoleId]);

  // Filtered roles based on category and search query
  const filteredRoles = useMemo(() => {
    let list = CAREER_CATALOGUE;
    if (activeCategory !== 'all') {
      list = list.filter((p) => p.category === activeCategory);
    }
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.coreSkills.some((s) => s.toLowerCase().includes(q)) ||
          p.category.toLowerCase().includes(q)
      );
    }
    return list;
  }, [activeCategory, searchQuery]);

  // Focus search input when dropdown opens (unless mobile touch)
  useEffect(() => {
    if (isOpen) {
      const isTouch = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
      if (!isTouch) {
        setTimeout(() => {
          searchInputRef.current?.focus();
        }, 50);
      }
    }
  }, [isOpen]);

  // Close on outside click / tap
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('touchstart', handleOutsideClick);
      document.addEventListener('pointerdown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
      document.removeEventListener('pointerdown', handleOutsideClick);
    };
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % Math.max(1, filteredRoles.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev === 0 ? Math.max(0, filteredRoles.length - 1) : prev - 1
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredRoles[highlightedIndex]) {
        handleSelect(filteredRoles[highlightedIndex].numericId);
      }
    }
  };

  const handleSelect = (roleId: number) => {
    onSelectRole(roleId);
    setIsOpen(false);
    setSearchQuery('');
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'software_engineering':
        return <Code2 size={13} aria-hidden="true" style={{ color: 'var(--color-tangerine)' }} />;
      case 'data_ai':
        return <Database size={13} aria-hidden="true" style={{ color: '#D4B996' }} />;
      case 'design_product':
        return <Palette size={13} aria-hidden="true" style={{ color: '#E8A87C' }} />;
      default:
        return <Compass size={13} aria-hidden="true" style={{ color: 'var(--color-cotton)' }} />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'software_engineering':
        return 'Software & Systems';
      case 'data_ai':
        return 'Data & AI';
      case 'design_product':
        return 'Design & Product';
      default:
        return category;
    }
  };

  return (
    <div
      ref={containerRef}
      className={`role-selector-container ${className}`}
      style={{ position: 'relative', width: '100%' }}
      onKeyDown={handleKeyDown}
    >
      {label && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <label
            htmlFor={id}
            style={{
              fontSize: '0.78rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--color-cotton)',
            }}
          >
            {label}
          </label>
          <span style={{ fontSize: '0.74rem', color: 'var(--color-muted-light)' }}>
            33 validated paths
          </span>
        </div>
      )}

      {/* Main Trigger Button */}
      <button
        type="button"
        id={id}
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={
          activePath
            ? `Current role: ${activePath.title}. Click to search and select from 33 career paths.`
            : 'No role selected. Click to choose from 33 career paths.'
        }
        style={{
          width: '100%',
          minHeight: '48px',
          padding: '10px 16px',
          borderRadius: 'var(--radius-sm)',
          border: isOpen ? '1px solid var(--color-tangerine)' : '1px solid var(--color-line-dark)',
          background: 'var(--color-black-soft)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          textAlign: 'left',
          transition: 'border-color 0.2s ease, background 0.2s ease',
          outline: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              background: 'rgba(255, 255, 255, 0.05)',
              flexShrink: 0,
            }}
          >
            {activePath ? getCategoryIcon(activePath.category) : <Compass size={14} color="var(--color-tangerine)" aria-hidden="true" />}
          </div>
          <div style={{ minWidth: 0 }}>
            {activePath ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      fontSize: '0.94rem',
                      fontWeight: 700,
                      color: 'var(--color-linen)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {activePath.title}
                  </span>
                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontFamily: 'var(--font-mono)',
                      padding: '2px 6px',
                      borderRadius: 'var(--radius-pill)',
                      background: 'rgba(255, 109, 31, 0.12)',
                      color: 'var(--color-tangerine)',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                    }}
                  >
                    {getCategoryLabel(activePath.category)}
                  </span>
                </div>
                <p
                  style={{
                    margin: '2px 0 0',
                    fontSize: '0.76rem',
                    color: 'var(--color-muted-light)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {activePath.description}
                </p>
              </>
            ) : (
              <div>
                <span style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--color-muted-light)' }}>
                  Choose a career direction...
                </span>
                <p style={{ margin: '2px 0 0', fontSize: '0.74rem', color: 'var(--color-cotton)' }}>
                  Select from 33 validated engineering, data, and design paths
                </p>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, marginLeft: '12px' }}>
          <span
            style={{
              fontSize: '0.74rem',
              color: 'var(--color-cotton)',
              fontWeight: 600,
            }}
          >
            {activePath ? 'Change' : 'Select'}
          </span>
          <ChevronDown
            size={16}
            style={{
              color: 'var(--color-cotton)',
              transform: isOpen ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.2s ease',
            }}
            aria-hidden="true"
          />
        </div>
      </button>

      {/* Selected Role Description Note (below trigger) */}
      {helperText && (
        <p style={{ margin: '6px 0 0', fontSize: '0.76rem', color: 'var(--color-muted-light)', lineHeight: 1.4 }}>
          {helperText}
        </p>
      )}

      {/* Dropdown Popover */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Career Path Selection Menu"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            zIndex: 999,
            backgroundColor: '#1C1C1C',
            border: '1px solid var(--color-line-dark)',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 16px 36px rgba(0, 0, 0, 0.65)',
            padding: '16px',
            maxHeight: 'min(420px, 70vh)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          {/* Search Box */}
          <div style={{ position: 'relative' }}>
            <Search
              size={15}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--color-muted-light)',
              }}
              aria-hidden="true"
            />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setHighlightedIndex(0);
              }}
              placeholder="Search 33 roles by title, skill, or keyword (e.g. AI, React, Docker)..."
              aria-label="Search career roles"
              style={{
                width: '100%',
                height: '42px',
                padding: '8px 36px 8px 36px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-line-dark)',
                background: 'var(--color-black-void)',
                color: 'var(--color-linen)',
                fontSize: '0.84rem',
                outline: 'none',
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setHighlightedIndex(0);
                }}
                aria-label="Clear role search query"
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--color-muted-light)',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                <X size={14} aria-hidden="true" />
              </button>
            )}
          </div>

          {/* Category Filter Tabs */}
          {showCategoryTabs && (
            <div
              style={{
                display: 'flex',
                gap: '6px',
                overflowX: 'auto',
                paddingBottom: '4px',
                scrollbarWidth: 'none',
              }}
            >
              {categoryTabs.map((tab) => {
                const isActive = activeCategory === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setActiveCategory(tab.id);
                      setHighlightedIndex(0);
                    }}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-pill)',
                      border: isActive
                        ? '1px solid var(--color-tangerine)'
                        : '1px solid var(--color-line-dark)',
                      background: isActive ? 'rgba(255, 109, 31, 0.15)' : 'var(--color-black-soft)',
                      color: isActive ? 'var(--color-tangerine)' : 'var(--color-muted-light)',
                      fontSize: '0.72rem',
                      fontWeight: isActive ? 700 : 500,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {tab.label} ({tab.count})
                  </button>
                );
              })}
            </div>
          )}

          {/* Roles Listbox */}
          <div
            role="listbox"
            aria-label="Career roles"
            style={{
              overflowY: 'auto',
              maxHeight: '240px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              paddingRight: '4px',
            }}
          >
            {filteredRoles.map((path, idx) => {
              const isSelected = path.numericId === selectedRoleId;
              const isHighlighted = idx === highlightedIndex;

              return (
                <button
                  key={path.numericId}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(path.numericId)}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: isSelected
                      ? 'rgba(255, 109, 31, 0.16)'
                      : isHighlighted
                      ? 'rgba(255, 255, 255, 0.05)'
                      : 'transparent',
                    border: isSelected
                      ? '1px solid var(--color-tangerine)'
                      : isHighlighted
                      ? '1px solid rgba(255, 255, 255, 0.1)'
                      : '1px solid transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    minHeight: '44px',
                    textAlign: 'left',
                    width: '100%',
                    transition: 'background 0.15s ease',
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          fontSize: '0.88rem',
                          fontWeight: 700,
                          color: isSelected ? 'var(--color-linen)' : 'var(--color-cotton)',
                        }}
                      >
                        {path.title}
                      </span>
                      <span
                        style={{
                          fontSize: '0.66rem',
                          fontFamily: 'var(--font-mono)',
                          color: 'var(--color-muted-light)',
                        }}
                      >
                        {getCategoryLabel(path.category)}
                      </span>
                    </div>
                    <p
                      style={{
                        margin: '2px 0 0',
                        fontSize: '0.74rem',
                        color: 'var(--color-muted-light)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {path.description}
                    </p>
                  </div>

                  <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                    {isSelected && (
                      <Check size={16} color="var(--color-tangerine)" aria-hidden="true" />
                    )}
                  </div>
                </button>
              );
            })}

            {/* Empty State */}
            {filteredRoles.length === 0 && (
              <div
                style={{
                  padding: '24px 16px',
                  textAlign: 'center',
                  color: 'var(--color-muted-light)',
                  fontSize: '0.82rem',
                }}
              >
                <Compass size={24} style={{ margin: '0 auto 8px', opacity: 0.5 }} aria-hidden="true" />
                <p style={{ margin: 0, fontWeight: 600 }}>
                  No roles match &quot;{searchQuery}&quot;
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setActiveCategory('all');
                    setHighlightedIndex(0);
                  }}
                  className="button-text"
                  style={{ fontSize: '0.76rem', color: 'var(--color-tangerine)', marginTop: '8px' }}
                >
                  Reset search &amp; filter
                </button>
              </div>
            )}
          </div>

          {/* Quick Starter Roles Footer */}
          <div
            style={{
              paddingTop: '10px',
              borderTop: '1px solid var(--color-line-dark)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '6px',
              fontSize: '0.72rem',
              color: 'var(--color-muted-light)',
            }}
          >
            <span>Core Starters:</span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                onClick={() => handleSelect(1)}
                className="button-text"
                style={{ fontSize: '0.72rem', color: 'var(--color-cotton)' }}
              >
                Backend
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => handleSelect(2)}
                className="button-text"
                style={{ fontSize: '0.72rem', color: 'var(--color-cotton)' }}
              >
                Frontend
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => handleSelect(3)}
                className="button-text"
                style={{ fontSize: '0.72rem', color: 'var(--color-cotton)' }}
              >
                Data Analyst
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
