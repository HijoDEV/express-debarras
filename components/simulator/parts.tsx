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

/** Jauge camion 20 m³. */
export function TruckGauge({ volume }: { volume: number }) {
  const pct = Math.min(1, volume / 20);
  const trucks = Math.max(1, Math.ceil(volume / 20));
  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 160 70" className="h-14 w-32 shrink-0" aria-hidden>
        <defs>
          <clipPath id="cargo">
            <rect x="6" y="8" width="96" height="42" rx="4" />
          </clipPath>
        </defs>
        <rect x="6" y="8" width="96" height="42" rx="4" fill="#F5F2EA" stroke="#0E2A3B" strokeWidth="2.5" />
        <motion.rect
          clipPath="url(#cargo)"
          x="6"
          y="8"
          height="42"
          fill="#FFC21A"
          initial={false}
          animate={{ width: 96 * pct }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        />
        <path d="M102 20h26l14 16v14h-40z" fill="#0E2A3B" stroke="#0E2A3B" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M110 25h15l9 10h-24z" fill="#D8E6EF" />
        <circle cx="30" cy="54" r="8" fill="#fff" stroke="#0E2A3B" strokeWidth="3" />
        <circle cx="122" cy="54" r="8" fill="#fff" stroke="#0E2A3B" strokeWidth="3" />
      </svg>
      <div className="text-[13px] leading-snug text-navy/70">
        <p className="font-semibold text-navy">
          {Math.round(pct * 100)} % d’un camion de 20 m³
        </p>
        {trucks > 1 && <p>{trucks} rotations prévues</p>}
      </div>
    </div>
  );
}
