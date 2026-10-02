import React from 'react';
import { AlertTriangle, Info, Loader2 } from 'lucide-react';

/* 1. BrandMark */
export const BrandMark: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <span className={`brand ${className}`} aria-label="CareerAI brand">
      <span>career</span>
      <b>/</b>
      <span>ai</span>
    </span>
  );
};

/* 2. PrimaryButton */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export const PrimaryButton: React.FC<ButtonProps> = ({ children, icon, className = '', ...props }) => {
  return (
    <button className={`button button-primary ${className}`} {...props}>
      <span>{children}</span>
      {icon && <span aria-hidden="true">{icon}</span>}
    </button>
  );
};

/* 3. SecondaryButton */
export const SecondaryButton: React.FC<ButtonProps> = ({ children, icon, className = '', ...props }) => {
  return (
    <button className={`button button-secondary ${className}`} {...props}>
      <span>{children}</span>
      {icon && <span aria-hidden="true">{icon}</span>}
    </button>
  );
};

/* 4. TextButton */
export const TextButton: React.FC<ButtonProps> = ({ children, icon, className = '', ...props }) => {
  return (
    <button className={`button-text ${className}`} {...props}>
      <span>{children}</span>
      {icon && <span aria-hidden="true">{icon}</span>}
    </button>
  );
};

/* 5. DisplayHeading */
export const DisplayHeading: React.FC<{
  level?: 1 | 2 | 3;
  children: React.ReactNode;
  className?: string;
}> = ({ level = 1, children, className = '' }) => {
  if (level === 1) return <h1 className={className}>{children}</h1>;
  if (level === 2) return <h2 className={className}>{children}</h2>;
  return <h3 className={className}>{children}</h3>;
};

/* 6. Eyebrow */
export const Eyebrow: React.FC<{
  children: React.ReactNode;
  tangerine?: boolean;
  className?: string;
}> = ({ children, tangerine = false, className = '' }) => {
  return (
    <p className={`eyebrow ${tangerine ? 'eyebrow-tangerine' : ''} ${className}`}>
      {children}
    </p>
  );
};

/* 7. BentoCard */
export const BentoCard: React.FC<{
  children: React.ReactNode;
  surface?: 'dark' | 'linen' | 'cotton' | 'featured';
  className?: string;
}> = ({ children, surface = 'dark', className = '' }) => {
  const surfaceClass = {
    dark: 'dark-card',
    linen: 'linen-card',
    cotton: 'cotton-card',
    featured: 'featured-card',
  }[surface];

  return <div className={`bento-card ${surfaceClass} ${className}`}>{children}</div>;
};

/* 8. DarkCard */
export const DarkCard: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => <div className={`dark-card ${className}`}>{children}</div>;

/* 9. LinenCard */
export const LinenCard: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => <div className={`linen-card ${className}`}>{children}</div>;

/* 10. CottonCard */
export const CottonCard: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => <div className={`cotton-card ${className}`}>{children}</div>;

/* 11. StatusBadge */
export type BadgeVariant = 'dark' | 'linen' | 'cotton' | 'tangerine' | 'success' | 'warning' | 'danger';

export const StatusBadge: React.FC<{
  variant?: BadgeVariant;
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}> = ({ variant = 'dark', children, icon, className = '' }) => {
  const variantClass = `badge-${variant}`;
  return (
    <span className={`status-badge ${variantClass} ${className}`}>
      {icon && <span aria-hidden="true">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};

/* 12. ProgressPill */
export const ProgressPill: React.FC<{
  current: number;
  total: number;
  label?: string;
  className?: string;
}> = ({ current, total, label, className = '' }) => {
  const formattedCurrent = String(current).padStart(2, '0');
  const formattedTotal = String(total).padStart(2, '0');

  return (
    <div className={`progress-pill ${className}`} aria-label={`Progress: ${current} of ${total}`}>
      <span>{formattedCurrent} / {formattedTotal}</span>
      {label && <span style={{ opacity: 0.7 }}>· {label}</span>}
    </div>
  );
};

/* 13. SourceLabel */
export const SourceLabel: React.FC<{
  source: string;
  date?: string;
  version?: string;
  className?: string;
}> = ({ source, date = '02 Oct 2026', version = 'v1.0', className = '' }) => {
  return (
    <div className={`source-label ${className}`}>
      <span>Source: {source}</span>
      <span>·</span>
      <span>Checked: {date}</span>
      <span>·</span>
      <span>{version}</span>
    </div>
  );
};

/* 14. ScoreMeter / ScoreRing */
export const ScoreMeter: React.FC<{
  percentage: number;
  darkTrack?: boolean;
  className?: string;
}> = ({ percentage, darkTrack = false, className = '' }) => {
  const clamped = Math.min(Math.max(percentage, 0), 100);
  return (
    <div
      className={`mini-meter ${darkTrack ? 'mini-meter-dark' : ''} ${className}`}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <span style={{ width: `${clamped}%` }} />
    </div>
  );
};

export const ScoreRing: React.FC<{
  active?: boolean;
  className?: string;
}> = ({ active = true, className = '' }) => {
  return <span className={`status-ring ${active ? '' : 'empty'} ${className}`} aria-hidden="true" />;
};

/* 15. EmptyState */
export const EmptyState: React.FC<{
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}> = ({ title, description, action, className = '' }) => {
  return (
    <div className={`empty-state ${className}`} role="status">
      <Info size={36} color="var(--color-muted-light)" aria-hidden="true" />
      <h4>{title}</h4>
      <p>{description}</p>
      {action && <div style={{ marginTop: '8px' }}>{action}</div>}
    </div>
  );
};

/* 16. LoadingState */
export const LoadingState: React.FC<{
  label?: string;
  className?: string;
}> = ({ label = 'Evaluating deterministic evidence...', className = '' }) => {
  return (
    <div className={`loading-state ${className}`} role="status" aria-live="polite">
      <Loader2 size={36} color="var(--color-tangerine)" style={{ animation: 'spin 1.2s linear infinite' }} />
      <h4>{label}</h4>
      <p>Zero external API calls. Computing locally.</p>
    </div>
  );
};

/* 17. ErrorState */
export const ErrorState: React.FC<{
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}> = ({ title = 'Check Failed', message, onRetry, className = '' }) => {
  return (
    <div className={`error-state ${className}`} role="alert">
      <AlertTriangle size={36} color="var(--color-danger)" aria-hidden="true" />
      <h4>{title}</h4>
      <p>{message}</p>
      {onRetry && (
        <PrimaryButton onClick={onRetry} style={{ marginTop: '8px' }}>
          Retry Action
        </PrimaryButton>
      )}
    </div>
  );
};

/* 18. Toast Component */
export const Toast: React.FC<{
  message: string | null;
  className?: string;
}> = ({ message, className = '' }) => {
  return (
    <div
      id="toast"
      className={`toast ${message ? 'show' : ''} ${className}`}
      role="status"
      aria-live="polite"
    >
      {message}
    </div>
  );
};
