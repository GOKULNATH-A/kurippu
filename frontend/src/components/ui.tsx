import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Zap } from 'lucide-react';

// ── Loading Spinner ────────────────────────────────────────────────────────────
export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const s = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' }[size];
  return (
    <div className={`${s} relative`}>
      <svg className={`${s} animate-spin`} fill="none" viewBox="0 0 24 24">
        <defs>
          <linearGradient id="spin-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7c3aff" />
            <stop offset="100%" stopColor="#ff2d92" />
          </linearGradient>
        </defs>
        <circle className="opacity-20" cx="12" cy="12" r="10" stroke="#7c3aff" strokeWidth="4" />
        <path className="opacity-80" fill="url(#spin-grad)" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
      </svg>
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 px-8 text-center"
    >
      {icon && (
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 text-ink-subtle"
             style={{
               background: 'linear-gradient(135deg, rgba(124,58,255,0.1), rgba(0,229,255,0.08))',
               border: '1px solid rgba(124,58,255,0.2)',
             }}>
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-ink mb-2">{title}</h3>
      {description && <p className="text-sm text-ink-muted max-w-xs">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </motion.div>
  );
}

// ── Error State ───────────────────────────────────────────────────────────────
interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message = 'Something went wrong', onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
           style={{ background: 'rgba(255,45,146,0.12)', border: '1px solid rgba(255,45,146,0.3)' }}>
        <AlertCircle className="w-6 h-6 text-pink-400" />
      </div>
      <h3 className="text-base font-semibold text-ink mb-1">{message}</h3>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary mt-4">
          Try Again
        </button>
      )}
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
export function SkeletonCard() {
  return (
    <div className="card p-5 space-y-3 animate-pulse">
      <div className="skeleton h-4 w-3/4 rounded" />
      <div className="skeleton h-3 w-1/2 rounded" />
      <div className="skeleton h-3 w-2/3 rounded" />
    </div>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

// ── Confidence Indicator ──────────────────────────────────────────────────────
export function ConfidenceBar({ confidence }: { confidence: number }) {
  const pct = Math.round(confidence * 100);

  const gradient =
    pct >= 85 ? 'linear-gradient(90deg, #39ff14, #00e5ff)' :
    pct >= 70 ? 'linear-gradient(90deg, #ffd700, #ff6b35)' :
                'linear-gradient(90deg, #ff2d92, #ff6b35)';

  const textColor =
    pct >= 85 ? '#39ff14' :
    pct >= 70 ? '#ffd700' :
                '#ff2d92';

  return (
    <div className="flex items-center gap-2.5">
      <div className="confidence-bar flex-1 max-w-24">
        <div
          className="confidence-fill"
          style={{ width: `${pct}%`, background: gradient, boxShadow: `0 0 8px ${textColor}55` }}
        />
      </div>
      <span className="text-xs font-mono font-bold" style={{ color: textColor }}>{pct}%</span>
      {pct < 70 && (
        <span className="badge-reminder text-[10px]">Review</span>
      )}
    </div>
  );
}

// ── Status Badge ──────────────────────────────────────────────────────────────
export function StatusBadge({ status }: { status: string }) {
  const labels: Record<string, string> = {
    todo: 'To Do', in_progress: 'In Progress', completed: 'Completed', cancelled: 'Cancelled',
  };
  return <span className={`badge-${status}`}>{labels[status] ?? status}</span>;
}

// ── Priority Badge ────────────────────────────────────────────────────────────
export function PriorityBadge({ priority }: { priority: string }) {
  const labels: Record<string, string> = {
    low: 'Low', medium: 'Medium', high: 'High', urgent: 'Urgent',
  };
  return <span className={`badge-${priority}`}>{labels[priority] ?? priority}</span>;
}

// ── Document Status Badge ─────────────────────────────────────────────────────
export function DocStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; gradient: string; border: string; icon: React.ReactNode }> = {
    uploading:  { label: 'Uploading',  gradient: 'rgba(0,229,255,0.12)',   border: 'rgba(0,229,255,0.3)',   icon: <Spinner size="sm" /> },
    processing: { label: 'Processing', gradient: 'rgba(255,215,0,0.12)',   border: 'rgba(255,215,0,0.3)',   icon: <Spinner size="sm" /> },
    analyzing:  { label: 'Analyzing',  gradient: 'rgba(124,58,255,0.12)',  border: 'rgba(124,58,255,0.3)',  icon: <Spinner size="sm" /> },
    extracting: { label: 'Extracting', gradient: 'rgba(255,45,146,0.12)',  border: 'rgba(255,45,146,0.3)',  icon: <Spinner size="sm" /> },
    completed:  { label: 'Completed',  gradient: 'rgba(57,255,20,0.12)',   border: 'rgba(57,255,20,0.3)',   icon: <CheckCircle2 className="w-3 h-3 text-lime-400" /> },
    failed:     { label: 'Failed',     gradient: 'rgba(255,45,146,0.12)',  border: 'rgba(255,45,146,0.3)',  icon: <AlertCircle className="w-3 h-3 text-pink-400" /> },
  };
  const c = config[status] ?? { label: status, gradient: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.1)', icon: null };
  return (
    <span className="badge gap-1.5"
          style={{ background: c.gradient, border: `1px solid ${c.border}`, color: '#f0f0ff' }}>
      {c.icon}
      {c.label}
    </span>
  );
}

// ── Processing Pulse ──────────────────────────────────────────────────────────
export function ProcessingPulse({ status }: { status: string }) {
  const processing = ['uploading', 'processing', 'analyzing', 'extracting'].includes(status);
  if (!processing) return null;

  const config: Record<string, { msg: string; color: string; bg: string; border: string }> = {
    uploading:  { msg: 'Uploading your document…',         color: '#00e5ff', bg: 'rgba(0,229,255,0.08)',   border: 'rgba(0,229,255,0.2)'   },
    processing: { msg: 'Parsing document structure…',      color: '#ffd700', bg: 'rgba(255,215,0,0.08)',   border: 'rgba(255,215,0,0.2)'   },
    analyzing:  { msg: 'Kurippu is reading your document…',color: '#7c3aff', bg: 'rgba(124,58,255,0.1)',   border: 'rgba(124,58,255,0.25)' },
    extracting: { msg: 'Extracting actions and insights…', color: '#ff2d92', bg: 'rgba(255,45,146,0.08)',  border: 'rgba(255,45,146,0.2)'  },
  };

  const c = config[status];
  return (
    <div className="flex items-center gap-3 p-4 rounded-xl"
         style={{ background: c.bg, border: `1px solid ${c.border}` }}>
      <div className="relative">
        <Zap className="w-5 h-5" style={{ color: c.color }} />
        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full animate-pulse"
              style={{ background: c.color }} />
      </div>
      <p className="text-sm font-medium" style={{ color: c.color }}>{c.msg}</p>
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  accentColor?: string;
}

export function Modal({ isOpen, onClose, title, children, size = 'md', accentColor = '#7c3aff' }: ModalProps) {
  if (!isOpen) return null;
  const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 12 }}
        className={`relative card w-full ${widths[size]} max-h-[90vh] overflow-y-auto z-10`}
        style={{ border: `1px solid ${accentColor}33`, boxShadow: `0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px ${accentColor}22` }}
      >
        {/* Color accent bar */}
        <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl"
             style={{ background: `linear-gradient(90deg, ${accentColor}, #ff2d92)` }} />
        <div className="flex items-center justify-between p-5"
             style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <h2 className="text-base font-bold text-ink">{title}</h2>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-ink-subtle hover:text-ink transition-colors"
            style={{ background: 'rgba(255,255,255,0.06)' }}
          >
            ✕
          </button>
        </div>
        <div className="p-5">{children}</div>
      </motion.div>
    </div>
  );
}
