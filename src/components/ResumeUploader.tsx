import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileCheck,
  AlertTriangle,
  X,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import {
  extractResumeText,
  validateResumeFile,
  SUPPORTED_EXTENSIONS,
} from '../lib/resumeExtractor';
import { PrimaryButton } from './DesignSystem';

export interface ResumeUploaderProps {
  currentDraftText: string;
  onExtractedText: (text: string, filename: string, isOcr: boolean, ocrWarning?: string) => void;
  onClearUploadedFile: () => void;
  uploadedFilename: string | null;
  ocrWarning: string | null;
}

export const ResumeUploader: React.FC<ResumeUploaderProps> = ({
  currentDraftText,
  onExtractedText,
  onClearUploadedFile,
  uploadedFilename,
  ocrWarning,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [progressStatus, setProgressStatus] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelection = (file: File) => {
    setErrorMessage(null);

    const validation = validateResumeFile(file);
    if (!validation.valid) {
      setErrorMessage(validation.error || 'Invalid file.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Check if replacing existing non-empty draft
    if (currentDraftText && currentDraftText.trim().length > 0) {
      setPendingFile(file);
      setShowConfirmModal(true);
    } else {
      processFile(file);
    }
  };

  const processFile = async (file: File) => {
    setIsExtracting(true);
    setProgressStatus('Starting extraction...');
    setProgressPercent(10);
    setErrorMessage(null);

    try {
      const result = await extractResumeText(file, (percent, status) => {
        setProgressPercent(percent);
        setProgressStatus(status);
      });

      onExtractedText(result.text, result.filename, result.isOcr, result.ocrWarning);
      setPendingFile(null);
      setShowConfirmModal(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg || 'Failed to extract text from document. Please ensure the file is not corrupted.');
    } finally {
      setIsExtracting(false);
      setProgressPercent(0);
      setProgressStatus('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelection(e.target.files[0]);
    }
  };

  return (
    <div style={{ marginBottom: '20px' }}>
      {/* Hidden File Picker Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={SUPPORTED_EXTENSIONS.join(',')}
        onChange={handleInputChange}
        style={{ display: 'none' }}
        data-testid="resume-file-input"
        aria-label="Upload resume file"
      />

      {/* Upload Drag & Drop Container */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        style={{
          border: isDragging
            ? '2px dashed var(--color-tangerine)'
            : '1px dashed var(--color-line-dark)',
          background: isDragging
            ? 'rgba(255, 109, 31, 0.08)'
            : 'var(--color-black-soft)',
          borderRadius: 'var(--radius-md)',
          padding: '24px 20px',
          textAlign: 'center',
          transition: 'border-color 0.2s, background-color 0.2s',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
        }}
      >
        <div
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            background: 'rgba(255, 109, 31, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-tangerine)',
          }}
        >
          <UploadCloud size={24} aria-hidden="true" />
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--color-linen)' }}>
              Upload your existing resume
            </span>
            <span style={{ fontSize: '0.84rem', color: 'var(--color-muted-light)' }}>
              or drag and drop here
            </span>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: 'var(--color-muted-light)' }}>
            Supported formats: <strong>TXT, DOCX, PDF, PNG, JPG, WEBP</strong> (Max 10 MB)
          </p>
          <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: 'var(--color-cotton)' }}>
            Processed 100% locally in your browser. Never uploaded to third-party servers.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isExtracting}
            className="button button-primary"
            style={{ fontSize: '0.84rem', minHeight: '44px', padding: '8px 20px' }}
          >
            {isExtracting ? 'Extracting Text...' : 'Select Resume File'}
          </button>
        </div>
      </div>

      {/* Extraction Loading / Progress Indicator */}
      {isExtracting && (
        <div
          role="status"
          aria-live="polite"
          style={{
            marginTop: '12px',
            padding: '12px 16px',
            background: 'rgba(255, 109, 31, 0.08)',
            border: '1px solid var(--color-tangerine)',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.84rem', color: 'var(--color-linen)', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <Loader2 size={16} className="spin" color="var(--color-tangerine)" aria-hidden="true" />
              <span>{progressStatus || 'Parsing document text...'}</span>
            </span>
            <span style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: 'var(--color-cotton)' }}>
              {progressPercent}%
            </span>
          </div>
          <div
            style={{
              width: '100%',
              height: '4px',
              background: 'var(--color-line-dark)',
              borderRadius: '2px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${progressPercent}%`,
                height: '100%',
                background: 'var(--color-tangerine)',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>
      )}

      {/* Extraction Error Notice */}
      {errorMessage && (
        <div
          role="alert"
          style={{
            marginTop: '12px',
            padding: '12px 16px',
            background: 'rgba(255, 139, 125, 0.12)',
            border: '1px solid var(--color-danger)',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} color="var(--color-danger)" aria-hidden="true" />
            <span style={{ fontSize: '0.84rem', color: 'var(--color-linen)' }}>
              {errorMessage}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="button-text"
            style={{ fontSize: '0.75rem', color: 'var(--color-danger)' }}
            aria-label="Dismiss error"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Currently Uploaded File Badge & Clear Action */}
      {uploadedFilename && !isExtracting && (
        <div
          style={{
            marginTop: '12px',
            padding: '10px 16px',
            background: 'rgba(169, 214, 155, 0.1)',
            border: '1px solid var(--color-success)',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileCheck size={16} color="var(--color-success)" aria-hidden="true" />
            <span style={{ fontSize: '0.84rem', color: 'var(--color-linen)' }}>
              Uploaded &amp; Extracted: <strong>{uploadedFilename}</strong>
            </span>
          </div>
          <button
            type="button"
            onClick={onClearUploadedFile}
            className="button-text"
            style={{ fontSize: '0.78rem', color: 'var(--color-cotton)' }}
            aria-label="Clear uploaded file"
          >
            <X size={13} aria-hidden="true" style={{ marginRight: '4px' }} />
            Remove File Indicator
          </button>
        </div>
      )}

      {/* OCR Review Warning Banner */}
      {ocrWarning && (
        <div
          role="status"
          style={{
            marginTop: '12px',
            padding: '12px 16px',
            background: 'rgba(255, 109, 31, 0.1)',
            border: '1px solid var(--color-tangerine)',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
          }}
        >
          <AlertTriangle size={18} color="var(--color-tangerine)" style={{ flexShrink: 0, marginTop: '2px' }} aria-hidden="true" />
          <div style={{ fontSize: '0.84rem', color: 'var(--color-linen)', lineHeight: 1.5 }}>
            <strong style={{ color: 'var(--color-tangerine)' }}>OCR Verification Required: </strong>
            {ocrWarning}
          </div>
        </div>
      )}

      {/* Replace Current Draft Confirmation Modal */}
      {showConfirmModal && pendingFile && (
        <div
          role="dialog"
          aria-labelledby="replace-draft-title"
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
              maxWidth: '480px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.8)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <AlertTriangle size={22} color="var(--color-tangerine)" aria-hidden="true" />
              <h3 id="replace-draft-title" style={{ margin: 0, fontSize: '1.2rem', color: 'var(--color-linen)' }}>
                Replace Current Resume Draft?
              </h3>
            </div>

            <p style={{ margin: '0 0 16px', fontSize: '0.86rem', color: 'var(--color-muted-light)', lineHeight: 1.55 }}>
              You already have text in your resume draft. Uploading <strong>{pendingFile.name}</strong> will replace the current draft with the extracted text. You can still manually edit the text at any time.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                onClick={() => {
                  setShowConfirmModal(false);
                  setPendingFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="button button-quiet"
                style={{ minHeight: '44px' }}
              >
                Cancel
              </button>
              <PrimaryButton
                onClick={() => processFile(pendingFile)}
                style={{ minHeight: '44px' }}
              >
                Replace Draft &amp; Extract
              </PrimaryButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
