import React from 'react';
import { Loader2, X } from 'lucide-react';

// One place for the LMS control centre's look, so the eight pages stay visually
// consistent without each one re-inventing a table, a modal or a card.

export const inputClass =
  'w-full px-3 py-2 rounded-xl bg-[#001C57] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400/40';

// #1D4ED8 (blue-700) rather than blue-500: white text on the lighter shade
// fails the 4.5:1 contrast threshold the accessibility audit enforces.
export const btnPrimary =
  'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-xs font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

export const btnGhost =
  'inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-slate-200 text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

export const btnDanger =
  'inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-300 text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

export const btnIcon =
  'p-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.14] text-slate-300 transition-colors';

export function PageHeader({ title, subtitle, actions, icon: Icon }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-400/20 flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5 text-blue-300" />
          </div>
        )}
        <div>
          <h1 className="text-lg font-bold text-white font-heading">{title}</h1>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5 max-w-2xl">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}

export function Card({ children, className = '' }) {
  return (
    <div className={`rounded-2xl bg-[#002060] border border-white/[0.08] ${className}`}>{children}</div>
  );
}

export function StatCard({ label, value, hint, tone = 'indigo', icon: Icon }) {
  const tones = {
    indigo: 'text-blue-300 bg-blue-500/10',
    emerald: 'text-blue-300 bg-blue-500/10',
    amber: 'text-red-300 bg-red-500/10',
    rose: 'text-red-300 bg-red-500/10',
    slate: 'text-slate-300 bg-white/[0.06]',
  };
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</div>
          <div className="text-xl font-bold text-white mt-1">{value}</div>
          {hint && <div className="text-[10px] text-slate-400 mt-1">{hint}</div>}
        </div>
        {Icon && (
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${tones[tone] || tones.indigo}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>
    </Card>
  );
}

export function Badge({ children, tone = 'slate' }) {
  const tones = {
    slate: 'bg-white/[0.06] text-slate-300 border-white/10',
    indigo: 'bg-blue-500/15 text-blue-200 border-blue-400/25',
    emerald: 'bg-blue-500/15 text-blue-200 border-blue-400/25',
    amber: 'bg-red-500/15 text-red-200 border-red-400/25',
    rose: 'bg-red-500/15 text-red-200 border-red-400/25',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-bold ${tones[tone] || tones.slate}`}>
      {children}
    </span>
  );
}

export function EmptyState({ icon: Icon, title, message, action }) {
  return (
    <div className="p-10 text-center">
      {Icon && <Icon className="w-8 h-8 mx-auto mb-3 text-slate-400" />}
      <p className="text-sm font-bold text-white">{title}</p>
      {message && <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">{message}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

export function Loading({ label = 'Loading…' }) {
  return (
    <div className="p-10 flex items-center justify-center gap-2 text-xs text-slate-400">
      <Loader2 className="w-4 h-4 animate-spin" /> {label}
    </div>
  );
}

export function ErrorNote({ children }) {
  if (!children) return null;
  return (
    <div className="mb-4 px-3 py-2 rounded-xl bg-red-500/10 border border-red-400/20 text-[11px] text-red-200">
      {children}
    </div>
  );
}

export function Modal({ open, title, subtitle, onClose, children, footer, wide = false }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div
        className={`relative w-full ${wide ? 'max-w-4xl' : 'max-w-2xl'} my-8 rounded-2xl bg-[#002060] border border-white/[0.1] shadow-2xl`}
      >
        <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-white/[0.08]">
          <div>
            <h2 className="text-sm font-bold text-white">{title}</h2>
            {subtitle && <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="Close dialog" className={btnIcon}>
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-5 py-5 max-h-[70vh] overflow-y-auto">{children}</div>
        {footer && <div className="px-5 py-4 border-t border-white/[0.08] flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}

export function Field({ label, hint, required, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="block text-[11px] font-bold text-slate-300 mb-1.5">
        {label} {required && <span className="text-red-300">*</span>}
      </span>
      {children}
      {hint && <span className="block text-[10px] text-slate-400 mt-1">{hint}</span>}
    </label>
  );
}

export function ProgressBar({ percent = 0 }) {
  return (
    <div className="flex items-center gap-2 min-w-[110px]">
      <div className="h-1.5 w-full rounded-full bg-white/[0.08] overflow-hidden">
        <div className="h-full bg-blue-500" style={{ width: `${Math.min(100, Math.max(0, percent))}%` }} />
      </div>
      <span className="text-[10px] font-mono text-slate-400 shrink-0">{percent}%</span>
    </div>
  );
}
