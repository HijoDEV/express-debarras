'use client';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { AlertTriangle, RotateCw, X } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { Counter } from '@/components/ui/Counter';
import { cn } from '@/lib/cn';
import { STATUS_META } from '@/lib/pro/status';
import type { Status } from '@/lib/pro/types';

/* ---------- Surfaces ---------- */
export function Card({ className, children, as: As = 'div', ...rest }: { className?: string; children: React.ReactNode; as?: 'div' | 'section' | 'article' } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <As className={cn('min-w-0 rounded-[14px] border border-p-line bg-p-card', className)} {...rest}>
      {children}
    </As>
  );
}

export function CardHeader({ title, action, sub }: { title: React.ReactNode; action?: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 px-5 pb-1 pt-4">
      <div className="min-w-0">
        <h2 className="text-[15px] font-semibold text-p-text">{title}</h2>
        {sub && <p className="mt-0.5 text-[13px] text-p-muted">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

export function PageHeader({ title, sub, actions }: { title: React.ReactNode; sub?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div className="min-w-0">
        <h1 className="font-display text-[28px] leading-[1.02] tracking-[-0.035em] text-p-text sm:text-[34px]">{title}</h1>
        {sub && <p className="mt-2 text-[14.5px] text-p-muted">{sub}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

/* ---------- Boutons ---------- */
type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'dark';
const btn: Record<BtnVariant, string> = {
  primary: 'bg-signal text-navy hover:brightness-[1.04] shadow-[0_6px_16px_-6px_rgba(255,194,26,.7)]',
  secondary: 'border border-p-line bg-p-card text-p-text hover:bg-p-hover',
  ghost: 'text-p-text hover:bg-p-hover',
  danger: 'bg-[#B4442A] text-white hover:bg-[#9C3A23]',
  dark: 'bg-navy text-white hover:bg-navy-700 dark:bg-white dark:text-navy dark:hover:bg-white/90',
};
export function Btn({ variant = 'secondary', size = 'md', className, children, href, ...rest }: { variant?: BtnVariant; size?: 'sm' | 'md' | 'lg'; href?: string } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const cls = cn(
    'inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-[10px] font-semibold transition-all duration-150 active:scale-[.98] disabled:pointer-events-none disabled:opacity-50',
    size === 'sm' ? 'h-8 px-3 text-[13px]' : size === 'lg' ? 'h-12 px-5 text-[15px]' : 'h-10 px-4 text-[14px]',
    btn[variant],
    className,
  );
  if (href)
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  return (
    <button className={cls} {...rest}>
      {children}
    </button>
  );
}

/* ---------- Statut ---------- */
export function StatusBadge({ status, className }: { status: Status; className?: string }) {
  const m = STATUS_META[status];
  return (
    <span className={cn('inline-flex h-6 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-[12px] font-semibold', m.className, className)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', m.dot, m.pulse && 'pro-pulse')} aria-hidden />
      {m.label}
    </span>
  );
}

export function Pill({ tone = 'grey', children }: { tone?: 'grey' | 'green' | 'red' | 'yellow' | 'blue' | 'navy'; children: React.ReactNode }) {
  const t = {
    grey: 'bg-[#EEF0F2] text-[#4A555E] dark:bg-white/10 dark:text-white/80',
    green: 'bg-tri-soft text-tri-dark dark:bg-tri/20 dark:text-[#7FD9AF]',
    red: 'bg-[#FBE9E5] text-[#9A3412] dark:bg-[#9A3412]/30 dark:text-[#F5B7A6]',
    yellow: 'bg-signal-soft text-navy ring-1 ring-signal/60 dark:bg-signal/20 dark:text-signal',
    blue: 'bg-[#E4EEFB] text-[#1D4E89] dark:bg-[#1D4E89]/40 dark:text-[#B9D4F5]',
    navy: 'bg-navy text-white dark:bg-white/15',
  }[tone];
  return <span className={cn('inline-flex h-6 items-center whitespace-nowrap rounded-full px-2.5 text-[12px] font-semibold', t)}>{children}</span>;
}

/* ---------- Indicateur ---------- */
export function Kpi({ label, value, prev, format, icon, suffix, invert = false }: { label: string; value: number; prev: number; format: (n: number) => string; icon: React.ReactNode; suffix?: string; invert?: boolean }) {
  const diff = prev === 0 ? (value > 0 ? 100 : 0) : Math.round(((value - prev) / prev) * 100);
  const good = invert ? diff <= 0 : diff >= 0;
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-p-muted">{label}</p>
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-p-soft text-p-text">{icon}</span>
      </div>
      <p className="mt-3 font-display text-[30px] leading-none tracking-[-0.035em] text-p-text sm:text-[34px]">
        <Counter value={value} format={format} />
        {suffix && <span className="ml-1 font-sans text-[14px] font-medium text-p-muted">{suffix}</span>}
      </p>
      <p className={cn('mt-2 text-[12.5px] font-semibold', good ? 'text-tri-dark dark:text-[#7FD9AF]' : 'text-[#B4442A] dark:text-[#F5B7A6]')}>
        {diff >= 0 ? '▲' : '▼'} {Math.abs(diff)} % <span className="font-normal text-p-muted">vs mois précédent</span>
      </p>
    </Card>
  );
}

/* ---------- États ---------- */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} aria-hidden />;
}

export function LoadingList({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2.5 p-4" role="status" aria-label="Chargement">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12" />
      ))}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="grid place-items-center px-6 py-14 text-center" role="alert">
      <span className="grid h-12 w-12 place-items-center rounded-full bg-[#FBE9E5] text-[#B4442A]">
        <AlertTriangle className="h-5 w-5" />
      </span>
      <p className="mt-4 font-semibold text-p-text">Impossible de charger les données</p>
      <p className="mt-1 text-[14px] text-p-muted">{message}</p>
      <Btn className="mt-5" onClick={onRetry}>
        <RotateCw className="h-4 w-4" /> Réessayer
      </Btn>
    </div>
  );
}

export function EmptyState({ title, text, action, art = 'box' }: { title: string; text: string; action?: React.ReactNode; art?: 'box' | 'inbox' | 'doc' }) {
  return (
    <div className="grid place-items-center px-6 py-14 text-center">
      <svg viewBox="0 0 120 90" className="h-24 w-32" aria-hidden>
        <ellipse cx="60" cy="80" rx="40" ry="5" fill="currentColor" className="text-p-soft" />
        {art === 'box' && (
          <>
            <path d="M30 40 L60 28 L90 40 L90 72 L60 84 L30 72 Z" fill="#E9CB9C" />
            <path d="M60 52 L90 40 L90 72 L60 84Z" fill="#C9A26A" />
            <path d="M30 40 L60 52 L60 84 L30 72Z" fill="#D9B47E" />
            <path d="M30 40 L20 28 L50 16 L60 28Z" fill="#E9CB9C" />
            <path d="M90 40 L100 28 L70 16 L60 28Z" fill="#D9B47E" />
            <rect x="43" y="56" width="6" height="16" fill="#FFC21A" transform="skewY(20)" opacity=".9" />
          </>
        )}
        {art === 'inbox' && (
          <>
            <rect x="26" y="24" width="68" height="50" rx="8" fill="#FFFFFF" stroke="#E6E8EB" strokeWidth="2" />
            <path d="M26 52 H46 L52 60 H68 L74 52 H94" fill="none" stroke="#8A9299" strokeWidth="2.5" />
            <circle cx="88" cy="26" r="8" fill="#FFC21A" />
          </>
        )}
        {art === 'doc' && (
          <>
            <path d="M40 12 H72 L84 24 V78 H40 Z" fill="#FFFFFF" stroke="#E6E8EB" strokeWidth="2" />
            <path d="M72 12 V24 H84" fill="#F1F3F5" />
            <path d="M48 36 H76 M48 44 H76 M48 52 H66" stroke="#C2CBD2" strokeWidth="3" strokeLinecap="round" />
            <circle cx="76" cy="66" r="9" fill="#2F9E6E" />
            <path d="M72 66 l3 3 6-6" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          </>
        )}
      </svg>
      <p className="mt-3 font-semibold text-p-text">{title}</p>
      <p className="mt-1 max-w-sm text-[14px] text-p-muted">{text}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/* ---------- Tiroir et modale (ressort) ---------- */
function useEsc(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);
}

export function Drawer({ open, onClose, title, children, width = 560 }: { open: boolean; onClose: () => void; title: React.ReactNode; children: React.ReactNode; width?: number }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  useEsc(open, onClose);
  useEffect(() => {
    if (open) setTimeout(() => ref.current?.focus(), 50);
  }, [open]);
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-label={typeof title === 'string' ? title : 'Détail'}>
          <motion.div className="absolute inset-0 bg-[#06111A]/45 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            ref={ref}
            tabIndex={-1}
            className="pro-scroll absolute inset-y-0 right-0 flex w-full flex-col overflow-y-auto border-l border-p-line bg-p-card shadow-2xl outline-none"
            style={{ maxWidth: width }}
            initial={reduce ? { opacity: 0 } : { x: '100%' }}
            animate={reduce ? { opacity: 1 } : { x: 0 }}
            exit={reduce ? { opacity: 0 } : { x: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 38 }}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-p-line bg-p-card px-5 py-3.5">
              <div className="min-w-0 text-[15px] font-semibold">{title}</div>
              <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg hover:bg-p-hover" aria-label="Fermer">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function Modal({ open, onClose, title, children, wide = false }: { open: boolean; onClose: () => void; title: React.ReactNode; children: React.ReactNode; wide?: boolean }) {
  const reduce = useReducedMotion();
  useEsc(open, onClose);
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[90] grid place-items-end sm:place-items-center sm:p-4" role="dialog" aria-modal="true">
          <motion.div className="absolute inset-0 bg-[#06111A]/50 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            className={cn('pro-scroll relative max-h-[92vh] w-full overflow-y-auto rounded-t-[20px] border border-p-line bg-p-card shadow-2xl sm:rounded-[18px]', wide ? 'sm:max-w-[720px]' : 'sm:max-w-[480px]')}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 30, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
          >
            <div className="flex items-center justify-between gap-3 border-b border-p-line px-5 py-3.5">
              <h2 className="text-[15px] font-semibold">{title}</h2>
              <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg hover:bg-p-hover" aria-label="Fermer">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/* ---------- Divers ---------- */
export function Segmented<T extends string>({ value, onChange, options, label }: { value: T; onChange: (v: T) => void; options: { value: T; label: React.ReactNode }[]; label: string }) {
  return (
    <div className="inline-flex rounded-[10px] border border-p-line bg-p-soft p-0.5" role="tablist" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn('relative inline-flex h-8 items-center gap-1.5 rounded-[8px] px-3 text-[13px] font-semibold transition-colors', value === o.value ? 'text-p-text' : 'text-p-muted hover:text-p-text')}
        >
          {value === o.value && <motion.span layoutId={`seg-${label}`} className="absolute inset-0 rounded-[8px] bg-p-card shadow-sm" transition={{ type: 'spring', stiffness: 450, damping: 34 }} />}
          <span className="relative inline-flex items-center gap-1.5">{o.label}</span>
        </button>
      ))}
    </div>
  );
}

export function Field({ label, hint, error, children, htmlFor }: { label: string; hint?: string; error?: string; children: React.ReactNode; htmlFor?: string }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-[13px] font-semibold text-p-text">
        {label}
      </label>
      {children}
      {error ? <p className="mt-1 text-[12.5px] text-[#B4442A] dark:text-[#F5B7A6]">{error}</p> : hint ? <p className="mt-1 text-[12.5px] text-p-muted">{hint}</p> : null}
    </div>
  );
}

export const inputCls =
  'h-10 w-full rounded-[10px] border border-p-line bg-p-card px-3 text-[14px] text-p-text placeholder:text-p-muted outline-none transition focus:border-navy focus:ring-2 focus:ring-signal/50 dark:focus:border-signal';

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)} className={cn('relative h-6 w-11 shrink-0 rounded-full transition-colors', checked ? 'bg-tri' : 'bg-[#C9D0D6] dark:bg-white/20')}>
      <motion.span layout transition={{ type: 'spring', stiffness: 600, damping: 34 }} className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow', checked ? 'right-0.5' : 'left-0.5')} />
    </button>
  );
}

export function Gauge({ label, used, total, unit }: { label: string; used: number; total: number; unit: string }) {
  const pct = total ? Math.min(100, (used / total) * 100) : 0;
  const warn = pct >= 80;
  return (
    <div>
      <div className="flex items-baseline justify-between text-[13px]">
        <span className="font-semibold text-p-text">{label}</span>
        <span className="font-mono text-p-muted">
          {used.toLocaleString('fr-FR')} / {total.toLocaleString('fr-FR')} {unit}
        </span>
      </div>
      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-p-soft" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
        <motion.div className={cn('h-full rounded-full', warn ? 'bg-[#E0533A]' : 'bg-signal')} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }} />
      </div>
    </div>
  );
}
