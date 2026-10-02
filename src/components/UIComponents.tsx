import React from 'react';
import { AlertCircle, CheckCircle2, ShieldCheck, Sparkles, X } from 'lucide-react';

export const DisplayHeading: React.FC<{
  children: React.ReactNode;
  level?: 1 | 2 | 3;
  className?: string;
}> = ({ children, level = 1, className = '' }) => {
  if (level === 1) {
    return (
      <h1 className={`text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-linen ${className}`}>
        {children}
      </h1>
    );
  }
  if (level === 2) {
    return (
      <h2 className={`text-2xl sm:text-3xl font-semibold tracking-tight text-linen ${className}`}>
        {children}
      </h2>
    );
  }
  return (
    <h3 className={`text-xl font-medium tracking-tight text-linen ${className}`}>
      {children}
    </h3>
  );
};

export const PrimaryButton: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  disabled?: boolean;
  className?: string;
  icon?: React.ReactNode;
}> = ({ children, onClick, type = 'button', disabled = false, className = '', icon }) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 px-6 py-3 min-h-[44px] rounded-lg bg-tangerine text-void font-semibold text-sm transition-all duration-150 hover:bg-orange-500 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm ${className}`}
    >
      {icon}
      <span>{children}</span>
    </button>
  );
};

export const TextButton: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}> = ({ children, onClick, disabled = false, className = '' }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center px-4 py-2 min-h-[44px] rounded-lg text-sm font-medium text-neutral-300 hover:text-linen hover:bg-neutral-800/60 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${className}`}
    >
      {children}
    </button>
  );
};

export const ProgressPill: React.FC<{
  current: number;
  total: number;
  label?: string;
}> = ({ current, total, label }) => {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-xs text-cotton font-mono">
      <span>{String(current).padStart(2, '0')} / {String(total).padStart(2, '0')}</span>
      {label && <span className="text-neutral-400">· {label}</span>}
    </div>
  );
};

export const StatusBadge: React.FC<{
  variant: 'tangerine' | 'linen' | 'cotton' | 'neutral' | 'success';
  children: React.ReactNode;
}> = ({ variant, children }) => {
  const styles = {
    tangerine: 'bg-orange-950/40 text-tangerine border-orange-800/50',
    linen: 'bg-amber-950/20 text-linen border-amber-800/30',
    cotton: 'bg-yellow-950/20 text-cotton border-yellow-800/40',
    neutral: 'bg-neutral-900 text-neutral-400 border-neutral-800',
    success: 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[variant]}`}
    >
      {children}
    </span>
  );
};

export const SourceLabel: React.FC<{
  source: string;
  attempt?: number;
  date?: string;
}> = ({ source, attempt = 1, date = '02 Oct 2026' }) => {
  return (
    <div className="text-xs text-neutral-400 flex items-center gap-1.5 font-mono">
      <span>Source: {source}</span>
      <span>·</span>
      <span>Attempt {attempt}</span>
      <span>·</span>
      <span>{date}</span>
    </div>
  );
};

export const BentoCard: React.FC<{
  children: React.ReactNode;
  surface?: 'void' | 'linen' | 'cotton';
  className?: string;
}> = ({ children, surface = 'void', className = '' }) => {
  const surfaceStyles = {
    void: 'bg-void-subtle border-neutral-800 text-linen',
    linen: 'bg-linen border-[#e4dcbe] text-ink',
    cotton: 'bg-cotton border-[#deceaa] text-ink',
  };

  return (
    <div
      className={`rounded-2xl border p-6 transition-all duration-200 ${surfaceStyles[surface]} ${className}`}
    >
      {children}
    </div>
  );
};

export const SafeSuggestionCard: React.FC<{
  original: string;
  rewrite: string;
  sourceFactIds: string[];
  needsConfirmation: boolean;
  status: 'pending' | 'accepted' | 'edited' | 'rejected';
  onAccept: () => void;
  onEdit: (text: string) => void;
  onReject: () => void;
}> = ({
  original,
  rewrite,
  sourceFactIds,
  needsConfirmation,
  status,
  onAccept,
  onEdit,
  onReject,
}) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editText, setEditText] = React.useState(rewrite);

  return (
    <div className="rounded-xl border border-neutral-800 bg-void-subtle p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-tangerine" />
          <span className="text-xs font-semibold text-cotton">
            AI suggestion — review before using
          </span>
        </div>
        {needsConfirmation && (
          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-amber-950/40 text-amber-300 border border-amber-800/50">
            <AlertCircle className="w-3 h-3" />
            Needs verification
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="p-3 rounded-lg bg-neutral-900 border border-neutral-800">
          <span className="text-neutral-500 uppercase font-mono text-[10px] block mb-1">Original Draft</span>
          <p className="text-neutral-300 font-normal">{original}</p>
        </div>

        <div className="p-3 rounded-lg bg-linen text-ink border border-[#e4dcbe]">
          <span className="text-ink-muted uppercase font-mono text-[10px] block mb-1">Truthful Proposal</span>
          {isEditing ? (
            <textarea
              value={editText}
              onChange={e => setEditText(e.target.value)}
              className="w-full text-xs p-1.5 rounded border border-neutral-400 bg-white text-ink focus:outline-none"
              rows={3}
            />
          ) : (
            <p className="font-medium text-ink">{rewrite}</p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between text-xs pt-2 border-t border-neutral-800">
        <span className="text-neutral-500 text-[11px]">
          Source facts linked: {sourceFactIds.join(', ')}
        </span>

        <div className="flex items-center gap-2">
          {status === 'accepted' ? (
            <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
              <CheckCircle2 className="w-4 h-4" /> Accepted
            </span>
          ) : status === 'rejected' ? (
            <span className="inline-flex items-center gap-1 text-neutral-400">
              <X className="w-4 h-4" /> Rejected
            </span>
          ) : (
            <>
              {isEditing ? (
                <button
                  onClick={() => {
                    onEdit(editText);
                    setIsEditing(false);
                  }}
                  className="px-3 py-1.5 rounded bg-tangerine text-void font-semibold hover:bg-orange-500 transition cursor-pointer"
                >
                  Save edit
                </button>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-3 py-1.5 rounded bg-neutral-800 text-neutral-300 hover:text-linen transition cursor-pointer"
                >
                  Edit
                </button>
              )}
              <button
                onClick={onReject}
                className="px-3 py-1.5 rounded bg-neutral-900 text-neutral-400 hover:text-neutral-200 transition cursor-pointer"
              >
                Reject
              </button>
              <button
                onClick={onAccept}
                className="px-3 py-1.5 rounded bg-tangerine text-void font-semibold hover:bg-orange-500 transition cursor-pointer"
              >
                Accept
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export const ConsentDialog: React.FC<{
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ open, onConfirm, onCancel }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-void-subtle border border-neutral-800 rounded-2xl max-w-md w-full p-6 text-linen shadow-2xl">
        <div className="flex items-center gap-3 text-tangerine mb-4">
          <ShieldCheck className="w-6 h-6" />
          <h3 className="text-lg font-semibold text-linen">Privacy & Consent Boundary</h3>
        </div>

        <p className="text-sm text-neutral-300 mb-4 leading-relaxed">
          CareerAI strictly processes user data client-side by default. External AI assistance only runs when explicitly requested, using redacted summaries without personal contact details.
        </p>

        <ul className="text-xs text-neutral-400 space-y-2 mb-6">
          <li>✓ No public storage of personal resumes.</li>
          <li>✓ Deterministic fallback is always available offline.</li>
          <li>✓ Never invents unverified metrics or employers.</li>
        </ul>

        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm text-neutral-400 hover:text-linen cursor-pointer"
          >
            Cancel
          </button>
          <PrimaryButton onClick={onConfirm}>
            Grant Consent & Continue
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
};
