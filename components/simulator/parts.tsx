'use client';
import { motion } from 'framer-motion';
import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/cn';

export function Stepper({
  value,
  onChange,
  min = 0,
  max = 99,
  step = 1,
  label,
  size = 'md',
}: {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label: string;
  size?: 'sm' | 'md';
}) {
  const btn = cn(
    'grid place-items-center rounded-full bg-white ring-1 ring-line transition hover:ring-navy/40 active:scale-95 disabled:opacity-30 disabled:hover:ring-line',
    size === 'sm' ? 'h-8 w-8' : 'h-10 w-10',
  );
  return (
    <div className="inline-flex items-center gap-2" role="group" aria-label={label}>
      <button type="button" className={btn} onClick={() => onChange(Math.max(min, value - step))} disabled={value <= min} aria-label={`Retirer · ${label}`}>
        <Minus className="h-4 w-4" />
      </button>
      <motion.span key={value} initial={{ scale: 0.7, opacity: 0.4 }} animate={{ scale: 1, opacity: 1 }} className={cn('min-w-[2ch] text-center font-semibold tabular-nums', size === 'sm' ? 'text-[15px]' : 'text-[17px]')} aria-live="polite">
        {value}
      </motion.span>
      <button type="button" className={btn} onClick={() => onChange(Math.min(max, value + step))} disabled={value >= max} aria-label={`Ajouter · ${label}`}>
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

export function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn('flex w-full items-center justify-between gap-4 rounded-2xl p-4 text-left ring-1 transition', checked ? 'bg-signal-soft ring-signal' : 'bg-white ring-line hover:ring-navy/30')}
    >
      <span>
        <span className="block text-[15.5px] font-semibold">{label}</span>
        {hint && <span className="mt-0.5 block text-[13px] text-navy/70">{hint}</span>}
      </span>
      <span className={cn('relative h-7 w-12 shrink-0 rounded-full transition-colors', checked ? 'bg-navy' : 'bg-line')}>
        <motion.span layout transition={{ type: 'spring', stiffness: 500, damping: 34 }} className={cn('absolute top-1 h-5 w-5 rounded-full bg-white shadow', checked ? 'right-1' : 'left-1')} />
      </span>
    </button>
  );
}

export function ChoiceCard({
  selected,
  onClick,
  title,
  hint,
  disabled,
  badge,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  hint?: string;
  disabled?: boolean;
  badge?: string;
  children?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'relative flex h-full w-full flex-col items-start rounded-2xl p-4 text-left ring-1 transition-all duration-300',
        selected ? 'bg-navy text-white shadow-lift ring-navy' : 'bg-white ring-line hover:-translate-y-0.5 hover:shadow-soft hover:ring-navy/30',
        disabled && 'cursor-not-allowed opacity-40 hover:translate-y-0 hover:shadow-none',
      )}
    >
      {badge && <span className="absolute -top-2.5 right-3 rounded-full bg-tri-dark px-2 py-0.5 text-[11px] font-semibold text-white">{badge}</span>}
      {children}
      <span className="text-[15.5px] font-semibold">{title}</span>
      {hint && <span className={cn('mt-1 text-[13px]', selected ? 'text-white/70' : 'text-navy/70')}>{hint}</span>}
    </button>
  );
}
