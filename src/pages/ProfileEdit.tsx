import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCareer } from '../context/CareerContext';
import {
  DisplayHeading,
  Eyebrow,
  PrimaryButton,
  SecondaryButton,
  DarkCard,
  CottonCard,
  StatusBadge,
} from '../components/DesignSystem';
import { LearnerContextIntake } from '../components/LearnerContextIntake';
import { RoleSelector } from '../components/RoleSelector';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import {
  User,
  ArrowLeft,
  Save,
  Clock,
  Sparkles,
  Compass,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  MapPin,
  FileCode2,
  Camera,
  Trash2,
  Mail,
  Upload,
} from 'lucide-react';
import type { UserProfile } from '../types';
import { CAREER_CATALOGUE, getCareerPathById } from '../data/careerCatalogue';

export const ProfileEdit: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    profile,
    updateProfile,
    saveProfile,
    rescheduleRoadmap,
    isSaving,
    persistenceStatus,
    lastPersistenceError,
    retryLastSave,
    isDemoMode,
    showToast,
    user,
    isAuthenticated,
  } = useCareer();

  // Initial state tracking for roadmap replan detection
  const initialHours = profile.hoursPerWeek || 8;
  const initialRoleId = profile.targetRoleId || profile.preferredRoleIds?.[0] || 1;

  // Form State initialized from profile
  const [formState, setFormState] = useState<Partial<UserProfile>>({
    displayName: profile.displayName || '',
    username: profile.username || '',
    contactEmail: profile.contactEmail || '',
    profileImageUrl: profile.profileImageUrl || '',
    profileImageStorageKey: profile.profileImageStorageKey || '',
    learnerStage: profile.learnerStage || 'undergraduate',
    schoolClass: profile.schoolClass,
    stream: profile.stream,
    degree: profile.degree || profile.branch || 'BTech / BE Computer Science',
    branch: profile.branch || 'Computer Science',
    institution: profile.institution || '',
    expectedGraduationYear: profile.expectedGraduationYear || '',
    studyYear: profile.studyYear || '3rd Year',
    cgpa: profile.cgpa || '',
    hoursPerWeek: initialHours,
    locationPreference: profile.locationPreference || '',
    currentSkills: profile.currentSkills || [],
    interests: profile.interests || [],
    favoriteSubjects: profile.favoriteSubjects || [],
    preferredWorkDirection: profile.preferredWorkDirection || '',
    projectFacts: profile.projectFacts || '',
    portfolioUrl: profile.portfolioUrl || '',
    githubUrl: profile.githubUrl || '',
    linkedinUrl: profile.linkedinUrl || '',
    targetRoleId: initialRoleId,
    preferredRoleIds: profile.preferredRoleIds && profile.preferredRoleIds.length > 0
      ? profile.preferredRoleIds
      : [initialRoleId],
  });

  const [imagePreview, setImagePreview] = useState<string | null>(profile.profileImageUrl || null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showReplanModal, setShowReplanModal] = useState<boolean>(false);
  const [savedSuccessNotice, setSavedSuccessNotice] = useState<boolean>(false);

  // Authenticated email change state
  const [newAuthEmail, setNewAuthEmail] = useState('');
  const [isEditingAuthEmail, setIsEditingAuthEmail] = useState(false);
  const [authEmailStatus, setAuthEmailStatus] = useState<{
    loading: boolean;
    successMessage?: string;
    errorMessage?: string;
  }>({ loading: false });

  const updateForm = (updates: Partial<UserProfile>) => {
    setFormState(prev => ({ ...prev, ...updates }));
    setErrors(prev => {
      const next = { ...prev };
      Object.keys(updates).forEach(k => delete next[k]);
      return next;
    });
  };

  // Image file handler with validation
  const processImageFile = (file: File) => {
    setImageError(null);

    // 1. Validate file type (PNG, JPG/JPEG, WEBP)
    const validMimes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    const validExtensions = ['.png', '.jpg', '.jpeg', '.webp'];
    const lowerName = file.name.toLowerCase();
    const hasValidExt = validExtensions.some(ext => lowerName.endsWith(ext));
    const hasValidMime = validMimes.includes(file.type.toLowerCase());

    if (!hasValidMime && !hasValidExt) {
      setImageError('Unsupported file type. Please upload a PNG, JPG, or WEBP image.');
      return;
    }

    // 2. Validate file size (max 2 MB)
    const MAX_SIZE = 2 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      setImageError(`File exceeds 2 MB limit (selected: ${sizeMb} MB).`);
      return;
    }

    // 3. Read as Data URL for local browser preview & persistence
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      const dataUrl = (reader.result || e?.target?.result) as string;
      if (dataUrl) {
        setImagePreview(dataUrl);
        setImageError(null);
        updateForm({
          profileImageUrl: dataUrl,
          profileImageStorageKey: `local-avatar-${Date.now()}`,
        });
        showToast('Profile image loaded. Click "Save Profile Changes" to persist.');
      }
    };
    reader.onerror = () => {
      setImageError('Failed to read image file. Please try another image.');
    };
    reader.readAsDataURL(file);
  };

  const handleImageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleRemovePhoto = () => {
    setImagePreview(null);
    setImageError(null);
    updateForm({
      profileImageUrl: '',
      profileImageStorageKey: '',
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    showToast('Profile photo removed.');
  };

  const handleResetUnsavedChanges = () => {
    setFormState({
      displayName: profile.displayName || '',
      username: profile.username || '',
      contactEmail: profile.contactEmail || '',
      profileImageUrl: profile.profileImageUrl || '',
      profileImageStorageKey: profile.profileImageStorageKey || '',
      learnerStage: profile.learnerStage || 'undergraduate',
      schoolClass: profile.schoolClass,
      stream: profile.stream,
      degree: profile.degree || profile.branch || 'BTech / BE Computer Science',
      branch: profile.branch || 'Computer Science',
      institution: profile.institution || '',
      expectedGraduationYear: profile.expectedGraduationYear || '',
      studyYear: profile.studyYear || '3rd Year',
      cgpa: profile.cgpa || '',
      hoursPerWeek: profile.hoursPerWeek || 8,
      locationPreference: profile.locationPreference || '',
      currentSkills: profile.currentSkills || [],
      interests: profile.interests || [],
      favoriteSubjects: profile.favoriteSubjects || [],
      preferredWorkDirection: profile.preferredWorkDirection || '',
      projectFacts: profile.projectFacts || '',
      portfolioUrl: profile.portfolioUrl || '',
      githubUrl: profile.githubUrl || '',
      linkedinUrl: profile.linkedinUrl || '',
      targetRoleId: profile.targetRoleId,
      preferredRoleIds: profile.preferredRoleIds && profile.preferredRoleIds.length > 0
        ? profile.preferredRoleIds
        : [profile.targetRoleId || 1],
    });
    setImagePreview(profile.profileImageUrl || null);
    setImageError(null);
    setErrors({});
    showToast('Unsaved changes discarded. Profile restored to saved state.');
  };

  const validateForm = (): boolean => {
    const errs: Record<string, string> = {};

    // 1. Display Name validation
    if (!formState.displayName || !formState.displayName.trim()) {
      errs.displayName = 'Display name is required.';
    } else if (formState.displayName.trim().length < 2) {
      errs.displayName = 'Display name must be at least 2 characters.';
    }

    // 2. Username validation (optional, but if provided must be 3-30 chars, alphanumeric + _ -)
    if (formState.username && formState.username.trim()) {
      const rawUser = formState.username.trim();
      const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/;
      if (!usernameRegex.test(rawUser)) {
        errs.username = 'Username must be 3–30 characters and contain only letters, numbers, underscores, or hyphens.';
      }
    }

    // 3. Contact Email validation (for guest users, if provided)
    if (!isAuthenticated && formState.contactEmail && formState.contactEmail.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formState.contactEmail.trim())) {
        errs.contactEmail = 'Please enter a valid contact email address.';
      }
    }

    // 4. Weekly hours validation
    const hours = formState.hoursPerWeek;
    if (hours === undefined || isNaN(hours) || hours < 1 || hours > 40) {
      errs.hours = 'Weekly study hours must be between 1 and 40.';
    }

    // 5. Branch / Degree validation for non-school learners
    const isSchool = formState.learnerStage === 'class_10' || formState.learnerStage === 'class_11_12';
    if (!isSchool && !formState.branch && !formState.degree) {
      errs.branch = 'Please specify your degree or academic stream.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleInitiateSave = () => {
    if (!validateForm()) {
      showToast('Please fix the highlighted fields before saving.');
      return;
    }

    const hoursChanged = formState.hoursPerWeek !== initialHours;
    const roleChanged = formState.targetRoleId !== initialRoleId;

    if (hoursChanged || roleChanged) {
      setShowReplanModal(true);
    } else {
      executeSave(false);
    }
  };

  const executeSave = async (shouldReplanRoadmap: boolean) => {
    setShowReplanModal(false);

    const normalizedUsername = formState.username
      ? formState.username.trim().toLowerCase()
      : '';

    const roleIdToSave = formState.targetRoleId || 1;
    const roleSlugToSave = formState.targetRoleSlug || getCareerPathById(roleIdToSave)?.slug;

    const updatedProfile: Partial<UserProfile> = {
      ...formState,
      displayName: (formState.displayName || '').trim(),
      username: normalizedUsername,
      contactEmail: formState.contactEmail ? formState.contactEmail.trim() : '',
      profileImageUrl: imagePreview || '',
      profileImageStorageKey: formState.profileImageStorageKey || '',
      targetRoleId: roleIdToSave,
      targetRoleSlug: roleSlugToSave,
      preferredRoleIds: formState.preferredRoleIds?.length
        ? formState.preferredRoleIds
        : [roleIdToSave],
      isGuestDemo: isDemoMode, // Preserve synthetic demo status without overwriting
    };

    updateProfile(updatedProfile);
    const success = await saveProfile(updatedProfile);

    if (shouldReplanRoadmap && formState.hoursPerWeek) {
      rescheduleRoadmap(formState.hoursPerWeek);
    }

    if (success) {
      setSavedSuccessNotice(true);
      showToast('Profile updated successfully. Career recommendations refreshed.');
      setTimeout(() => {
        setSavedSuccessNotice(false);
      }, 4000);
    } else {
      showToast('Could not sync profile to backend. Your draft is preserved locally.');
    }
  };

  // Authenticated Email update handler via Supabase Auth
  const handleRequestAuthEmailUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAuthEmail || !newAuthEmail.trim()) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newAuthEmail.trim())) {
      setAuthEmailStatus({ loading: false, errorMessage: 'Please enter a valid email address.' });
      return;
    }

    setAuthEmailStatus({ loading: true });
    try {
      if (!isSupabaseConfigured() || !supabase) {
        setAuthEmailStatus({
          loading: false,
          errorMessage: 'Backend authentication service is not configured in this environment.',
        });
        return;
      }

      const { error } = await supabase.auth.updateUser({ email: newAuthEmail.trim() });
      if (error) {
        setAuthEmailStatus({ loading: false, errorMessage: error.message });
      } else {
        setAuthEmailStatus({
          loading: false,
          successMessage: `Confirmation link sent to ${newAuthEmail.trim()}. Verification required before email changes.`,
        });
        setIsEditingAuthEmail(false);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to request email update.';
      setAuthEmailStatus({ loading: false, errorMessage: msg });
    }
  };

  const targetRoleMeta = CAREER_CATALOGUE.find(p => p.numericId === formState.targetRoleId) || CAREER_CATALOGUE[0];

  // Derive user initials for fallback avatar
  const getInitials = (name?: string) => {
    if (!name || !name.trim()) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const isFormDirty =
    formState.displayName !== (profile.displayName || '') ||
    (formState.username || '') !== (profile.username || '') ||
    (formState.contactEmail || '') !== (profile.contactEmail || '') ||
    (imagePreview || '') !== (profile.profileImageUrl || '') ||
    formState.hoursPerWeek !== (profile.hoursPerWeek || 8) ||
    formState.targetRoleId !== (profile.targetRoleId || 1);

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', paddingBottom: '60px' }}>
      {/* Navigation Links */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <Link
          to="/settings"
          className="button-text"
          style={{ fontSize: '0.84rem', color: 'var(--color-cotton)' }}
        >
          <ArrowLeft size={15} aria-hidden="true" style={{ marginRight: '6px' }} />
          Return to Settings
        </Link>
        <Link
          to="/paths"
          className="button-text"
          style={{ fontSize: '0.84rem', color: 'var(--color-tangerine)' }}
        >
          View Path Explorer →
        </Link>
      </div>

      {/* Page Header */}
      <header style={{ marginBottom: '28px' }}>
        <Eyebrow text="LEARNER PROFILE / IDENTITY & CAREER BENCHMARK" />
        <DisplayHeading level={1}>EDIT LEARNER PROFILE</DisplayHeading>
        <p className="muted-light" style={{ maxWidth: '680px', marginTop: '10px', fontSize: '0.94rem', lineHeight: 1.6 }}>
          Manage your personal identity, avatar image, contact details, academic context, and target career direction. Changes calibrate your roadmap milestones and readiness scoring.
        </p>
      </header>

      {/* Demo Profile Notice */}
      {isDemoMode && (
        <CottonCard style={{ marginBottom: '24px', border: '1px solid var(--color-tangerine)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Sparkles size={20} color="var(--color-tangerine)" aria-hidden="true" />
            <div>
              <strong style={{ color: 'var(--color-ink)', fontSize: '0.92rem' }}>
                Guest Demo Profile (Synthetic Rahul Sharma)
              </strong>
              <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--color-muted-dark)' }}>
                You are currently exploring in guest demo mode. Your modifications will update your local browser session only and will never overwrite real user accounts.
              </p>
            </div>
          </div>
        </CottonCard>
      )}

      {/* Professional Profile Header Summary Card */}
      <DarkCard style={{ marginBottom: '32px', padding: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
            {/* Avatar Circle */}
            <div
              style={{
                width: '84px',
                height: '84px',
                borderRadius: '50%',
                background: 'var(--color-black-soft)',
                border: '2px solid var(--color-tangerine)',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 4px 14px rgba(0,0,0,0.5)',
              }}
            >
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt={`${formState.displayName || 'Learner'} profile avatar`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <span
                  style={{
                    fontSize: '1.8rem',
                    fontFamily: 'var(--font-display, "Bebas Neue", sans-serif)',
                    fontWeight: 700,
                    color: 'var(--color-tangerine)',
                    letterSpacing: '0.04em',
                  }}
                >
                  {getInitials(formState.displayName || profile.displayName)}
                </span>
              )}
            </div>

            {/* Profile Meta Info */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '4px' }}>
                <h2 style={{ margin: 0, fontSize: '1.4rem', color: 'var(--color-linen)', lineHeight: 1.2 }}>
                  {formState.displayName || profile.displayName || 'Learner Profile'}
                </h2>
                {formState.username && (
                  <span
                    style={{
                      fontFamily: 'var(--font-mono, monospace)',
                      fontSize: '0.84rem',
                      color: 'var(--color-cotton)',
                      background: 'rgba(255, 255, 255, 0.06)',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-pill)',
                    }}
                  >
                    @{formState.username}
                  </span>
                )}
              </div>

              {/* Email representation */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
                <Mail size={13} color="var(--color-cotton)" aria-hidden="true" />
                <span style={{ fontSize: '0.82rem', color: 'var(--color-cotton)' }}>
                  {isAuthenticated && user?.email
                    ? user.email
                    : (formState.contactEmail || profile.contactEmail || 'Guest mode — no email linked')}
                </span>
                <span
                  style={{
                    fontSize: '0.7rem',
                    padding: '1px 6px',
                    borderRadius: 'var(--radius-sm)',
                    background: isAuthenticated ? 'rgba(169, 214, 155, 0.15)' : 'rgba(255, 255, 255, 0.08)',
                    color: isAuthenticated ? 'var(--color-success)' : 'var(--color-muted-light)',
                    fontWeight: 600,
                  }}
                >
                  {isAuthenticated ? 'Authenticated Account' : 'Guest Contact'}
                </span>
              </div>

              {/* Badges for Stage & Target Role */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                <StatusBadge
                  variant="tangerine"
                  label={formState.learnerStage ? formState.learnerStage.replace(/_/g, ' ').toUpperCase() : 'UNDERGRADUATE'}
                />
                <StatusBadge
                  variant="dark"
                  label={`Target: ${targetRoleMeta.title}`}
                />
                <span style={{ fontSize: '0.78rem', color: 'var(--color-muted-light)' }}>
                  ~{formState.hoursPerWeek || 8}h / week
                </span>
              </div>
            </div>
          </div>

          {/* Unsaved Changes Indicator & Reset Action */}
          {isFormDirty && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                type="button"
                onClick={handleResetUnsavedChanges}
                className="button button-quiet"
                style={{ fontSize: '0.78rem', minHeight: '36px' }}
                title="Discard unsaved changes and reload saved profile"
              >
                <RotateCcw size={13} aria-hidden="true" style={{ marginRight: '6px' }} />
                Discard uncommitted changes
              </button>
            </div>
          )}
        </div>
      </DarkCard>

      {/* Persistence Error Notice with Retry */}
      {persistenceStatus === 'failed' && (
        <div
          role="alert"
          style={{
            padding: '14px 18px',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(255, 139, 125, 0.1)',
            border: '1px solid var(--color-danger)',
            marginBottom: '24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertTriangle size={18} color="var(--color-danger)" aria-hidden="true" />
            <span style={{ fontSize: '0.84rem', color: 'var(--color-linen)' }}>
              Failed to save profile: {lastPersistenceError || 'Network unreachable'}. Your draft is safely preserved in memory.
            </span>
          </div>
          <button
            type="button"
            onClick={retryLastSave}
            className="button button-secondary"
            style={{ fontSize: '0.78rem', padding: '6px 14px', minHeight: '34px' }}
          >
            <RotateCcw size={13} aria-hidden="true" />
            Retry Save
          </button>
        </div>
      )}

      {/* Save Success Notice */}
      {savedSuccessNotice && (
        <div
          role="status"
          style={{
            padding: '12px 18px',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(169, 214, 155, 0.12)',
            border: '1px solid var(--color-success)',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '0.86rem',
            color: 'var(--color-linen)',
          }}
        >
          <CheckCircle2 size={18} color="var(--color-success)" aria-hidden="true" />
          <span>Profile changes saved. Roadmap and career recommendations have been updated!</span>
        </div>
      )}

      {/* Main Profile Form */}
      <form noValidate onSubmit={(e) => { e.preventDefault(); handleInitiateSave(); }} style={{ display: 'grid', gap: '28px' }}>

        {/* SECTION 1: Profile Photo, Name, Username & Contact Email */}
        <DarkCard>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <User size={18} color="var(--color-tangerine)" aria-hidden="true" />
            <h2 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--color-linen)' }}>
              Personal Identity &amp; Profile Photo
            </h2>
          </div>

          <div style={{ display: 'grid', gap: '24px' }}>
            {/* A. Profile Photo Upload Area */}
            <div>
              <span
                style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: 'var(--color-cotton)',
                  marginBottom: '10px',
                }}
              >
                Profile Photo (PNG, JPG, WEBP — Max 2 MB)
              </span>

              <div
                onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true); }}
                onDragLeave={() => setIsDraggingOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDraggingOver(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) processImageFile(file);
                }}
                style={{
                  border: isDraggingOver ? '2px dashed var(--color-tangerine)' : '1px dashed var(--color-line-dark)',
                  borderRadius: 'var(--radius-md)',
                  padding: '20px',
                  background: isDraggingOver ? 'rgba(255, 109, 31, 0.08)' : 'var(--color-black-soft)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '20px',
                  flexWrap: 'wrap',
                  transition: 'all 0.2s ease',
                }}
              >
                {/* Photo Preview Thumbnail */}
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: 'var(--color-black-canvas)',
                    border: '1px solid var(--color-line-dark)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    flexShrink: 0,
                  }}
                >
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Profile preview"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <Camera size={24} color="var(--color-muted-light)" aria-hidden="true" />
                  )}
                </div>

                {/* Upload & Remove Controls */}
                <div style={{ flex: 1, minWidth: '220px' }}>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '8px' }}>
                    <input
                      ref={fileInputRef}
                      id="profile-image-upload"
                      type="file"
                      accept="image/png, image/jpeg, image/jpg, image/webp"
                      style={{ display: 'none' }}
                      onChange={handleImageInputChange}
                      aria-label="Upload profile image"
                    />

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="button button-secondary"
                      style={{ fontSize: '0.8rem', padding: '8px 16px', minHeight: '38px' }}
                    >
                      <Upload size={14} aria-hidden="true" style={{ marginRight: '6px' }} />
                      <span>{imagePreview ? 'Change Photo' : 'Upload Photo'}</span>
                    </button>

                    {imagePreview && (
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="button button-quiet"
                        style={{ fontSize: '0.8rem', minHeight: '38px', color: 'var(--color-danger)' }}
                      >
                        <Trash2 size={14} aria-hidden="true" style={{ marginRight: '6px' }} />
                        <span>Remove Photo</span>
                      </button>
                    )}
                  </div>

                  <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--color-muted-light)', lineHeight: 1.4 }}>
                    Drag &amp; drop or click to upload. Image is stored locally in your browser storage only. Never sent to third parties, AI, or analytics.
                  </p>
                </div>
              </div>

              {/* Inline Image Validation Error */}
              {imageError && (
                <p role="alert" style={{ margin: '8px 0 0', fontSize: '0.8rem', color: 'var(--color-danger)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertTriangle size={14} />
                  <span>{imageError}</span>
                </p>
              )}
            </div>

            {/* B. Display Name Input */}
            <div>
              <label
                htmlFor="edit-display-name"
                style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: 'var(--color-cotton)',
                  marginBottom: '6px',
                }}
              >
                Full Name / Display Name <span style={{ color: 'var(--color-tangerine)' }}>*</span>
              </label>
              <input
                id="edit-display-name"
                type="text"
                value={formState.displayName || ''}
                onChange={(e) => updateForm({ displayName: e.target.value })}
                placeholder="e.g. Priya Patel or Alex"
                aria-invalid={Boolean(errors.displayName)}
                aria-describedby={errors.displayName ? 'err-display-name' : undefined}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: errors.displayName ? '1px solid var(--color-danger)' : '1px solid var(--color-line-dark)',
                  background: 'var(--color-black-soft)',
                  color: 'var(--color-linen)',
                  fontSize: '0.9rem',
                  outline: 'none',
                }}
              />
              {errors.displayName && (
                <p id="err-display-name" style={{ margin: '6px 0 0', fontSize: '0.78rem', color: 'var(--color-danger)' }}>
                  {errors.displayName}
                </p>
              )}
            </div>

            {/* C. Username Input */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
                <label
                  htmlFor="edit-username"
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: 'var(--color-cotton)',
                  }}
                >
                  Username
                </label>
                <span style={{ fontSize: '0.74rem', color: 'var(--color-muted-light)' }}>
                  (optional, 3–30 chars)
                </span>
              </div>

              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <span
                  style={{
                    position: 'absolute',
                    left: '12px',
                    color: 'var(--color-cotton)',
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: '0.9rem',
                  }}
                >
                  @
                </span>
                <input
                  id="edit-username"
                  type="text"
                  value={formState.username || ''}
                  onChange={(e) => updateForm({ username: e.target.value })}
                  placeholder="learner_handle"
                  aria-invalid={Boolean(errors.username)}
                  aria-describedby="help-username"
                  style={{
                    width: '100%',
                    padding: '10px 14px 10px 30px',
                    borderRadius: 'var(--radius-sm)',
                    border: errors.username ? '1px solid var(--color-danger)' : '1px solid var(--color-line-dark)',
                    background: 'var(--color-black-soft)',
                    color: 'var(--color-linen)',
                    fontSize: '0.9rem',
                    outline: 'none',
                    fontFamily: 'var(--font-mono, monospace)',
                  }}
                />
              </div>

              {errors.username ? (
                <p role="alert" style={{ margin: '6px 0 0', fontSize: '0.78rem', color: 'var(--color-danger)' }}>
                  {errors.username}
                </p>
              ) : (
                <p id="help-username" style={{ margin: '6px 0 0', fontSize: '0.74rem', color: 'var(--color-muted-light)' }}>
                  Letters, numbers, underscores, and hyphens only. Username availability will be checked when account sync is enabled.
                </p>
              )}
            </div>

            {/* D. Email (Authenticated vs Guest Contact) */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
                <label
                  htmlFor={isAuthenticated ? 'edit-auth-email' : 'edit-contact-email'}
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: 'var(--color-cotton)',
                  }}
                >
                  {isAuthenticated ? 'Account Email (Authenticated)' : 'Contact Email (Guest)'}
                </label>
                <span style={{ fontSize: '0.72rem', color: 'var(--color-muted-light)' }}>
                  {isAuthenticated ? 'Managed by Auth' : 'Stored locally in browser'}
                </span>
              </div>

              {isAuthenticated ? (
                /* Authenticated user: Read-only email from session + change request flow */
                <div style={{ display: 'grid', gap: '10px' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--color-line-dark)',
                      background: 'rgba(255, 255, 255, 0.03)',
                    }}
                  >
                    <span style={{ fontSize: '0.9rem', color: 'var(--color-linen)' }}>
                      {user?.email || 'Authenticated user'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsEditingAuthEmail(!isEditingAuthEmail)}
                      className="button-text"
                      style={{ fontSize: '0.78rem', color: 'var(--color-tangerine)' }}
                    >
                      {isEditingAuthEmail ? 'Cancel' : 'Change Email'}
                    </button>
                  </div>

                  {isEditingAuthEmail && (
                    <div style={{ padding: '14px', borderRadius: 'var(--radius-sm)', background: 'var(--color-black-soft)', border: '1px solid var(--color-line-dark)' }}>
                      <p style={{ margin: '0 0 10px', fontSize: '0.78rem', color: 'var(--color-muted-light)' }}>
                        Enter your new email address. A confirmation email with a verification link will be sent. Email will not change until verified.
                      </p>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <input
                          id="edit-auth-email"
                          type="email"
                          value={newAuthEmail}
                          onChange={(e) => setNewAuthEmail(e.target.value)}
                          placeholder="new.email@example.com"
                          style={{
                            flex: 1,
                            minWidth: '220px',
                            padding: '8px 12px',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--color-line-dark)',
                            background: 'var(--color-black-canvas)',
                            color: 'var(--color-linen)',
                            fontSize: '0.86rem',
                          }}
                        />
                        <button
                          type="button"
                          onClick={handleRequestAuthEmailUpdate}
                          disabled={authEmailStatus.loading}
                          className="button button-primary"
                          style={{ fontSize: '0.78rem', padding: '8px 14px' }}
                        >
                          {authEmailStatus.loading ? 'Sending...' : 'Request Email Update'}
                        </button>
                      </div>

                      {authEmailStatus.errorMessage && (
                        <p role="alert" style={{ margin: '8px 0 0', fontSize: '0.78rem', color: 'var(--color-danger)' }}>
                          {authEmailStatus.errorMessage}
                        </p>
                      )}
                      {authEmailStatus.successMessage && (
                        <p role="status" style={{ margin: '8px 0 0', fontSize: '0.78rem', color: 'var(--color-success)' }}>
                          {authEmailStatus.successMessage}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                /* Guest mode: Optional contact email saved locally only */
                <div>
                  <input
                    id="edit-contact-email"
                    type="email"
                    value={formState.contactEmail || ''}
                    onChange={(e) => updateForm({ contactEmail: e.target.value })}
                    placeholder="learner@example.com"
                    aria-invalid={Boolean(errors.contactEmail)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-sm)',
                      border: errors.contactEmail ? '1px solid var(--color-danger)' : '1px solid var(--color-line-dark)',
                      background: 'var(--color-black-soft)',
                      color: 'var(--color-linen)',
                      fontSize: '0.9rem',
                      outline: 'none',
                    }}
                  />
                  {errors.contactEmail ? (
                    <p role="alert" style={{ margin: '6px 0 0', fontSize: '0.78rem', color: 'var(--color-danger)' }}>
                      {errors.contactEmail}
                    </p>
                  ) : (
                    <p style={{ margin: '6px 0 0', fontSize: '0.74rem', color: 'var(--color-muted-light)' }}>
                      Optional contact email for guest inquiries. Stored locally in your browser. Not an authenticated account email.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </DarkCard>

        {/* SECTION 2: Target Career Role & Study Commitment */}
        <DarkCard>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
            <Compass size={18} color="var(--color-tangerine)" aria-hidden="true" />
            <h2 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--color-linen)' }}>
              Target Career Role &amp; Study Pace
            </h2>
          </div>

          <div style={{ display: 'grid', gap: '18px' }}>
            {/* Target Role Selector from 33 Unified Catalogue */}
            <div>
              <RoleSelector
                selectedRoleId={formState.targetRoleId || 1}
                onSelectRole={(roleId) => {
                  const roleSlug = getCareerPathById(roleId)?.slug;
                  updateForm({
                    targetRoleId: roleId,
                    targetRoleSlug: roleSlug,
                    preferredRoleIds: [roleId],
                  });
                }}
                label="Benchmark Target Career Path"
                helperText={`Your roadmap and readiness gap diagnostics will be calculated against the ${targetRoleMeta.title} syllabus.`}
              />
            </div>

            {/* Weekly Study Hours */}
            <div>
              <label
                htmlFor="edit-hours"
                style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: 'var(--color-cotton)',
                  marginBottom: '6px',
                }}
              >
                Weekly Study Commitment (Hours/Week) <span style={{ color: 'var(--color-tangerine)' }}>*</span>
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <input
                  id="edit-hours"
                  type="number"
                  min="1"
                  max="40"
                  value={formState.hoursPerWeek || 8}
                  onChange={(e) => updateForm({ hoursPerWeek: parseInt(e.target.value, 10) || 0 })}
                  aria-invalid={Boolean(errors.hours)}
                  aria-describedby={errors.hours ? 'err-hours' : 'help-hours'}
                  style={{
                    width: '120px',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    border: errors.hours ? '1px solid var(--color-danger)' : '1px solid var(--color-line-dark)',
                    background: 'var(--color-black-soft)',
                    color: 'var(--color-linen)',
                    fontSize: '0.9rem',
                    outline: 'none',
                  }}
                />
                <span id="help-hours" style={{ fontSize: '0.82rem', color: 'var(--color-muted-light)' }}>
                  Realistic weekly hours dedicated to learning (1 to 40 hours)
                </span>
              </div>
              {errors.hours && (
                <p id="err-hours" style={{ margin: '6px 0 0', fontSize: '0.78rem', color: 'var(--color-danger)' }}>
                  {errors.hours}
                </p>
              )}
            </div>
          </div>
        </DarkCard>

        {/* SECTION 3: Academic Context & Skills Intake via Reusable Intake */}
        <DarkCard>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
            <Compass size={18} color="var(--color-tangerine)" aria-hidden="true" />
            <h2 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--color-linen)' }}>
              Academic Background, Skills &amp; Interests
            </h2>
          </div>

          <LearnerContextIntake
            profile={formState}
            onChange={(updates) => updateForm(updates)}
            errors={errors}
            mode="all"
          />
        </DarkCard>

        {/* SECTION 4: Additional Practical Preferences */}
        <DarkCard>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
            <FileCode2 size={18} color="var(--color-tangerine)" aria-hidden="true" />
            <h2 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--color-linen)' }}>
              Projects, Direction &amp; Preferences
            </h2>
          </div>

          <div style={{ display: 'grid', gap: '18px' }}>
            {/* Preferred Work Direction */}
            <div>
              <label
                htmlFor="edit-direction"
                style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: 'var(--color-cotton)',
                  marginBottom: '6px',
                }}
              >
                Preferred Work Direction
              </label>
              <input
                id="edit-direction"
                type="text"
                value={formState.preferredWorkDirection || ''}
                onChange={(e) => updateForm({ preferredWorkDirection: e.target.value })}
                placeholder="e.g. Backend API systems, Distributed microservices, UI engineering"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-line-dark)',
                  background: 'var(--color-black-soft)',
                  color: 'var(--color-linen)',
                  fontSize: '0.88rem',
                  outline: 'none',
                }}
              />
            </div>

            {/* Location Preference */}
            <div>
              <label
                htmlFor="edit-location"
                style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: 'var(--color-cotton)',
                  marginBottom: '6px',
                }}
              >
                Location Preference
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <MapPin size={16} color="var(--color-muted-light)" aria-hidden="true" />
                <input
                  id="edit-location"
                  type="text"
                  value={formState.locationPreference || ''}
                  onChange={(e) => updateForm({ locationPreference: e.target.value })}
                  placeholder="e.g. Bengaluru, Pune, Hyderabad, Remote"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-line-dark)',
                    background: 'var(--color-black-soft)',
                    color: 'var(--color-linen)',
                    fontSize: '0.88rem',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            {/* Project Facts / Verified Experience */}
            <div>
              <label
                htmlFor="edit-facts"
                style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: 'var(--color-cotton)',
                  marginBottom: '6px',
                }}
              >
                Key Projects &amp; Verified Technical Facts
              </label>
              <textarea
                id="edit-facts"
                rows={4}
                value={formState.projectFacts || ''}
                onChange={(e) => updateForm({ projectFacts: e.target.value })}
                placeholder="List completed technical projects, technologies used, and verifiable deliverables. These anchor your Resume Lab suggestions without hallucinations."
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-line-dark)',
                  background: 'var(--color-black-soft)',
                  color: 'var(--color-linen)',
                  fontSize: '0.86rem',
                  fontFamily: 'inherit',
                  lineHeight: 1.5,
                  outline: 'none',
                  resize: 'vertical',
                }}
              />
            </div>

            {/* Optional Links: Portfolio / GitHub / LinkedIn */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
              <div>
                <label
                  htmlFor="edit-portfolio"
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: 'var(--color-cotton)',
                    marginBottom: '6px',
                  }}
                >
                  Portfolio / Website URL
                </label>
                <input
                  id="edit-portfolio"
                  type="url"
                  value={formState.portfolioUrl || ''}
                  onChange={(e) => updateForm({ portfolioUrl: e.target.value })}
                  placeholder="https://yourportfolio.dev"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-line-dark)',
                    background: 'var(--color-black-soft)',
                    color: 'var(--color-linen)',
                    fontSize: '0.86rem',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label
                  htmlFor="edit-github"
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: 'var(--color-cotton)',
                    marginBottom: '6px',
                  }}
                >
                  GitHub Profile URL
                </label>
                <input
                  id="edit-github"
                  type="url"
                  value={formState.githubUrl || ''}
                  onChange={(e) => updateForm({ githubUrl: e.target.value })}
                  placeholder="https://github.com/username"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-line-dark)',
                    background: 'var(--color-black-soft)',
                    color: 'var(--color-linen)',
                    fontSize: '0.86rem',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label
                  htmlFor="edit-linkedin"
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: 'var(--color-cotton)',
                    marginBottom: '6px',
                  }}
                >
                  LinkedIn Profile URL
                </label>
                <input
                  id="edit-linkedin"
                  type="url"
                  value={formState.linkedinUrl || ''}
                  onChange={(e) => updateForm({ linkedinUrl: e.target.value })}
                  placeholder="https://linkedin.com/in/username"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-line-dark)',
                    background: 'var(--color-black-soft)',
                    color: 'var(--color-linen)',
                    fontSize: '0.86rem',
                    outline: 'none',
                  }}
                />
              </div>
            </div>
          </div>
        </DarkCard>

        {/* Action Controls: Cancel, Reset, Save Changes */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', paddingTop: '10px' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => {
                handleResetUnsavedChanges();
                navigate('/settings');
              }}
              className="button button-quiet"
              style={{ minHeight: '44px' }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleResetUnsavedChanges}
              className="button button-quiet"
              style={{ minHeight: '44px', fontSize: '0.82rem' }}
            >
              Reset unsaved changes
            </button>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <PrimaryButton
              type="submit"
              disabled={isSaving}
              icon={<Save size={15} />}
              style={{ minHeight: '44px', padding: '10px 24px' }}
            >
              {isSaving ? 'Saving Profile...' : 'Save Profile Changes ↗'}
            </PrimaryButton>
          </div>
        </div>
      </form>

      {/* Roadmap Replanning Confirmation Modal */}
      {showReplanModal && (
        <div
          role="dialog"
          aria-labelledby="replan-modal-title"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            style={{
              background: '#1A1D1E',
              border: '1px solid var(--color-line-dark)',
              borderRadius: 'var(--radius-md)',
              maxWidth: '520px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.8)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <Clock size={22} color="var(--color-tangerine)" aria-hidden="true" />
              <h3 id="replan-modal-title" style={{ margin: 0, fontSize: '1.25rem', color: 'var(--color-linen)' }}>
                Roadmap Replan Confirmation
              </h3>
            </div>

            <p style={{ margin: '0 0 16px', fontSize: '0.88rem', color: 'var(--color-muted-light)', lineHeight: 1.55 }}>
              You modified your weekly commitment ({initialHours}h → {formState.hoursPerWeek}h) or target role. Would you like CareerAI to recalculate and replan your preparation roadmap tasks to reflect your new pace?
            </p>

            <div style={{ display: 'grid', gap: '10px', marginTop: '20px' }}>
              <PrimaryButton
                onClick={() => executeSave(true)}
                style={{ width: '100%', minHeight: '44px' }}
              >
                Regenerate Roadmap &amp; Save Profile ↗
              </PrimaryButton>

              <SecondaryButton
                onClick={() => executeSave(false)}
                style={{ width: '100%', minHeight: '44px' }}
              >
                Save Profile Only (Keep Current Roadmap)
              </SecondaryButton>

              <button
                type="button"
                onClick={() => setShowReplanModal(false)}
                className="button button-quiet"
                style={{ width: '100%', minHeight: '40px', fontSize: '0.82rem' }}
              >
                Cancel and Review
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
