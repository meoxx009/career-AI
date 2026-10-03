import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCareer } from '../context/CareerContext';
import { PrimaryButton } from './DesignSystem';
import {
  ChevronDown,
  Edit3,
  LogOut,
  X,
  Mail,
  Lock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { CAREER_CATALOGUE } from '../data/careerCatalogue';

// Helper to derive initials from a name or email
function getInitials(name?: string, email?: string): string {
  const source = name && name.trim() ? name.trim() : email ? email.split('@')[0] : 'U';
  const parts = source.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const NavbarProfile: React.FC = () => {
  const {
    user,
    profile,
    saveProfile,
    signOut,
    showToast,
    isSaving,
    isDemoMode,
  } = useCareer();

  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState(profile.displayName || '');
  const [editUsername, setEditUsername] = useState(profile.username || '');
  const [editLocation, setEditLocation] = useState(profile.locationPreference || '');

  // Validation & error states
  const [errors, setErrors] = useState<{ displayName?: string; username?: string }>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [localSaving, setLocalSaving] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerButtonRef = useRef<HTMLButtonElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const handleOpenEdit = () => {
    setEditName(profile.displayName || '');
    setEditUsername(profile.username || '');
    setEditLocation(profile.locationPreference || '');
    setErrors({});
    setSaveError(null);
    setIsEditing(true);
  };

  // Handle outside click to close dropdown
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsEditing(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  // Handle keyboard navigation (Escape to close)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        setIsEditing(false);
        triggerButtonRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Focus name input when switching to edit mode
  useEffect(() => {
    if (isEditing && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [isEditing]);

  const targetRoleTitle =
    CAREER_CATALOGUE.find(c => c.numericId === (profile.targetRoleId || profile.preferredRoleIds?.[0]))?.title ||
    'Software Engineering';

  const userEmail = user?.email || profile.contactEmail || (isDemoMode ? 'rahul.demo@careerai.local' : 'Authenticated User');
  const userInitials = getInitials(profile.displayName, userEmail);

  // Validate edit form
  const validateForm = (): boolean => {
    const newErrors: { displayName?: string; username?: string } = {};

    if (!editName.trim()) {
      newErrors.displayName = 'Full name is required.';
    } else if (editName.trim().length < 2) {
      newErrors.displayName = 'Name must be at least 2 characters.';
    }

    if (editUsername.trim()) {
      const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/;
      if (!usernameRegex.test(editUsername.trim())) {
        newErrors.username = 'Username must be 3–30 characters (letters, numbers, _ or -).';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Save handler
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);

    if (!validateForm()) return;

    setLocalSaving(true);
    try {
      const success = await saveProfile({
        displayName: editName.trim(),
        username: editUsername.trim() || undefined,
        locationPreference: editLocation.trim() || undefined,
      });

      if (success) {
        showToast('Profile updated successfully.');
        setIsEditing(false);
      } else {
        setSaveError('Failed to save profile changes. Please try again.');
      }
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'An error occurred while saving.');
    } finally {
      setLocalSaving(false);
    }
  };

  // Cancel edit handler
  const handleCancelEdit = () => {
    setEditName(profile.displayName || '');
    setEditUsername(profile.username || '');
    setEditLocation(profile.locationPreference || '');
    setErrors({});
    setSaveError(null);
    setIsEditing(false);
  };

  // Sign out handler
  const handleSignOut = async () => {
    setIsOpen(false);
    setIsEditing(false);
    await signOut();
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block' }}>
      {/* Navbar Profile Trigger Button */}
      <button
        ref={triggerButtonRef}
        type="button"
        data-testid="navbar-profile-trigger"
        onClick={() => setIsOpen(prev => !prev)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label={`User profile menu for ${profile.displayName || 'Learner'}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: isOpen ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.04)',
          border: `1px solid ${isOpen ? 'var(--color-cotton)' : 'var(--color-line-dark)'}`,
          borderRadius: 'var(--radius-pill)',
          padding: '4px 10px 4px 6px',
          color: 'var(--color-linen)',
          fontSize: '0.78rem',
          fontWeight: 700,
          cursor: 'pointer',
          transition: 'background 0.2s ease, border-color 0.2s ease, transform 0.2s ease',
          height: '34px',
          outline: 'none',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.09)';
          e.currentTarget.style.borderColor = 'var(--color-cotton)';
        }}
        onMouseLeave={e => {
          if (!isOpen) {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
            e.currentTarget.style.borderColor = 'var(--color-line-dark)';
          }
        }}
      >
        {/* Compact Avatar Circle */}
        <div
          style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            background: 'var(--color-black-soft)',
            border: '1.5px solid var(--color-tangerine)',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {profile.profileImageUrl ? (
            <img
              src={profile.profileImageUrl}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <span
              style={{
                fontSize: '0.62rem',
                fontFamily: 'var(--font-display, "Bebas Neue", sans-serif)',
                fontWeight: 700,
                color: 'var(--color-tangerine)',
                lineHeight: 1,
              }}
            >
              {userInitials}
            </span>
          )}
        </div>

        {/* Compact Name */}
        <span
          style={{
            maxWidth: '90px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            color: 'var(--color-linen)',
          }}
        >
          {profile.displayName || profile.username || 'Learner'}
        </span>

        {/* Dropdown Chevron */}
        <ChevronDown
          size={13}
          color="var(--color-cotton)"
          style={{
            transition: 'transform 0.2s ease',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            opacity: 0.8,
          }}
          aria-hidden="true"
        />
      </button>

      {/* Floating Profile Popover Panel */}
      {isOpen && (
        <div
          role="dialog"
          data-testid="navbar-profile-popover"
          aria-label="Account details and settings"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: '340px',
            maxWidth: 'calc(100vw - 24px)',
            background: 'var(--color-black-soft)',
            border: '1px solid var(--color-line-dark)',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 18px 48px rgba(0, 0, 0, 0.75)',
            zIndex: 1000,
            padding: '20px',
            animation: 'fadeIn 0.15s ease-out',
          }}
        >
          {!isEditing ? (
            /* ============================================== */
            /* VIEW MODE                                      */
            /* ============================================== */
            <div>
              {/* Header: Avatar, Name, Username, Email */}
              <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '16px' }}>
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '50%',
                    background: 'var(--color-void)',
                    border: '2px solid var(--color-tangerine)',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {profile.profileImageUrl ? (
                    <img
                      src={profile.profileImageUrl}
                      alt={`${profile.displayName || 'User'} avatar`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <span
                      style={{
                        fontSize: '1.15rem',
                        fontFamily: 'var(--font-display, "Bebas Neue", sans-serif)',
                        fontWeight: 700,
                        color: 'var(--color-tangerine)',
                      }}
                    >
                      {userInitials}
                    </span>
                  )}
                </div>

                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <strong
                      style={{
                        fontSize: '1.02rem',
                        color: 'var(--color-linen)',
                        lineHeight: 1.2,
                        wordBreak: 'break-word',
                      }}
                    >
                      {profile.displayName || 'Learner'}
                    </strong>
                    {profile.username && (
                      <span
                        style={{
                          fontFamily: 'var(--font-mono, monospace)',
                          fontSize: '0.72rem',
                          color: 'var(--color-cotton)',
                          background: 'rgba(255, 255, 255, 0.06)',
                          padding: '1px 6px',
                          borderRadius: 'var(--radius-pill)',
                        }}
                      >
                        @{profile.username}
                      </span>
                    )}
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '0.78rem',
                      color: 'var(--color-muted-light)',
                      marginTop: '4px',
                      wordBreak: 'break-all',
                    }}
                  >
                    <Mail size={12} aria-hidden="true" style={{ flexShrink: 0 }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {userEmail}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(46, 204, 113, 0.1)',
                  border: '1px solid rgba(46, 204, 113, 0.3)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '5px 10px',
                  fontSize: '0.72rem',
                  color: 'var(--color-success)',
                  marginBottom: '16px',
                }}
              >
                <CheckCircle2 size={13} aria-hidden="true" />
                <span>Active Account · Synced</span>
              </div>

              {/* Details Rows */}
              <div
                style={{
                  background: 'var(--color-void)',
                  border: '1px solid var(--color-line-dark)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '12px 14px',
                  display: 'grid',
                  gap: '10px',
                  fontSize: '0.78rem',
                  marginBottom: '16px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--color-muted-light)' }}>Target Career:</span>
                  <span style={{ color: 'var(--color-linen)', fontWeight: 600 }}>{targetRoleTitle}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--color-muted-light)' }}>Academic Context:</span>
                  <span style={{ color: 'var(--color-linen)', fontWeight: 600 }}>
                    {profile.branch || profile.degree || 'Computer Science'}
                  </span>
                </div>

                {profile.locationPreference && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--color-muted-light)' }}>Location:</span>
                    <span style={{ color: 'var(--color-linen)', fontWeight: 600 }}>
                      {profile.locationPreference}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'grid', gap: '8px' }}>
                <button
                  type="button"
                  data-testid="navbar-edit-btn"
                  onClick={handleOpenEdit}
                  className="button button-secondary"
                  style={{
                    width: '100%',
                    fontSize: '0.78rem',
                    minHeight: '36px',
                    padding: '8px 12px',
                    gap: '6px',
                  }}
                >
                  <Edit3 size={13} aria-hidden="true" />
                  <span>Edit Account Details</span>
                </button>

                <Link
                  to="/profile/edit"
                  onClick={() => setIsOpen(false)}
                  className="button-text"
                  style={{
                    fontSize: '0.76rem',
                    color: 'var(--color-cotton)',
                    justifyContent: 'center',
                    padding: '6px',
                  }}
                >
                  <span>Full Profile &amp; Curriculum Settings</span>
                  <ExternalLink size={12} aria-hidden="true" />
                </Link>

                <div style={{ borderTop: '1px solid var(--color-line-dark)', margin: '4px 0' }} />

                <button
                  type="button"
                  data-testid="navbar-signout-btn"
                  onClick={handleSignOut}
                  className="button button-quiet"
                  style={{
                    width: '100%',
                    fontSize: '0.78rem',
                    minHeight: '34px',
                    padding: '6px 12px',
                    color: 'var(--color-muted-light)',
                    gap: '6px',
                  }}
                >
                  <LogOut size={13} aria-hidden="true" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          ) : (
            /* ============================================== */
            /* EDIT MODE                                      */
            /* ============================================== */
            <form onSubmit={handleSave} noValidate style={{ display: 'grid', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.08em', color: 'var(--color-tangerine)' }}>
                  EDIT DETAILS
                </div>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  style={{
                    background: 'transparent',
                    border: 0,
                    color: 'var(--color-muted-light)',
                    cursor: 'pointer',
                    padding: '2px',
                  }}
                  aria-label="Cancel editing"
                >
                  <X size={16} />
                </button>
              </div>

              {saveError && (
                <div
                  role="alert"
                  style={{
                    background: 'rgba(235, 87, 87, 0.1)',
                    border: '1px solid var(--color-danger)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '8px 10px',
                    fontSize: '0.74rem',
                    color: 'var(--color-danger)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <AlertCircle size={14} aria-hidden="true" />
                  <span>{saveError}</span>
                </div>
              )}

              {/* Full Name */}
              <div>
                <label
                  htmlFor="navbar-edit-name"
                  style={{
                    display: 'block',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    letterSpacing: '0.06em',
                    color: 'var(--color-linen)',
                    marginBottom: '4px',
                  }}
                >
                  FULL NAME *
                </label>
                <input
                  ref={nameInputRef}
                  id="navbar-edit-name"
                  type="text"
                  value={editName}
                  onChange={e => {
                    setEditName(e.target.value);
                    if (errors.displayName) setErrors(prev => ({ ...prev, displayName: undefined }));
                  }}
                  placeholder="e.g. Rahul Sharma"
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--color-void)',
                    border: `1px solid ${errors.displayName ? 'var(--color-danger)' : 'var(--color-line-dark)'}`,
                    color: 'var(--color-linen)',
                    fontSize: '0.84rem',
                  }}
                />
                {errors.displayName && (
                  <span style={{ fontSize: '0.7rem', color: 'var(--color-danger)', marginTop: '3px', display: 'block' }}>
                    {errors.displayName}
                  </span>
                )}
              </div>

              {/* Username */}
              <div>
                <label
                  htmlFor="navbar-edit-username"
                  style={{
                    display: 'block',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    letterSpacing: '0.06em',
                    color: 'var(--color-linen)',
                    marginBottom: '4px',
                  }}
                >
                  USERNAME
                </label>
                <input
                  id="navbar-edit-username"
                  type="text"
                  value={editUsername}
                  onChange={e => {
                    setEditUsername(e.target.value);
                    if (errors.username) setErrors(prev => ({ ...prev, username: undefined }));
                  }}
                  placeholder="e.g. rahul_sharma"
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--color-void)',
                    border: `1px solid ${errors.username ? 'var(--color-danger)' : 'var(--color-line-dark)'}`,
                    color: 'var(--color-linen)',
                    fontSize: '0.84rem',
                  }}
                />
                {errors.username && (
                  <span style={{ fontSize: '0.7rem', color: 'var(--color-danger)', marginTop: '3px', display: 'block' }}>
                    {errors.username}
                  </span>
                )}
              </div>

              {/* Location Preference */}
              <div>
                <label
                  htmlFor="navbar-edit-location"
                  style={{
                    display: 'block',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    letterSpacing: '0.06em',
                    color: 'var(--color-linen)',
                    marginBottom: '4px',
                  }}
                >
                  LOCATION PREFERENCE
                </label>
                <input
                  id="navbar-edit-location"
                  type="text"
                  value={editLocation}
                  onChange={e => setEditLocation(e.target.value)}
                  placeholder="e.g. Bengaluru / Remote"
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--color-void)',
                    border: '1px solid var(--color-line-dark)',
                    color: 'var(--color-linen)',
                    fontSize: '0.84rem',
                  }}
                />
              </div>

              {/* Read-only Email */}
              <div>
                <label
                  htmlFor="navbar-edit-email"
                  style={{
                    display: 'block',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    letterSpacing: '0.06em',
                    color: 'var(--color-muted-light)',
                    marginBottom: '4px',
                  }}
                >
                  EMAIL ADDRESS (ACCOUNT ID)
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="navbar-edit-email"
                    type="email"
                    value={userEmail}
                    readOnly
                    disabled
                    style={{
                      width: '100%',
                      padding: '8px 10px 8px 30px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid var(--color-line-dark)',
                      color: 'var(--color-muted-light)',
                      fontSize: '0.82rem',
                      cursor: 'not-allowed',
                    }}
                  />
                  <Lock
                    size={13}
                    style={{
                      position: 'absolute',
                      left: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--color-muted-light)',
                    }}
                    aria-hidden="true"
                  />
                </div>
                <span style={{ fontSize: '0.68rem', color: 'var(--color-muted-light)', marginTop: '2px', display: 'block' }}>
                  Managed by your authentication provider.
                </span>
              </div>

              {/* Save & Cancel Actions */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <PrimaryButton
                  type="submit"
                  data-testid="navbar-save-btn"
                  onClick={handleSave}
                  disabled={localSaving || isSaving}
                  style={{ flex: 1, minHeight: '36px', fontSize: '0.78rem', justifyContent: 'center' }}
                >
                  {localSaving || isSaving ? 'Saving...' : 'Save Changes'}
                </PrimaryButton>
                <button
                  type="button"
                  data-testid="navbar-cancel-btn"
                  onClick={handleCancelEdit}
                  className="button button-quiet"
                  style={{ minHeight: '36px', fontSize: '0.78rem', padding: '0 14px' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
};
