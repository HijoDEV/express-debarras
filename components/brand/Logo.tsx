import { cn } from '@/lib/cn';

/** Carton jaune dont le couvercle forme une flèche vers la droite, avec 3 traits de vitesse. */
export function LogoMark({ className, dark = false }: { className?: string; dark?: boolean }) {
  const stroke = dark ? '#FFFFFF' : '#0E2A3B';
  return (
    <svg viewBox="0 0 64 48" className={className} aria-hidden="true" fill="none">
      {/* traits de vitesse */}
      <g stroke={dark ? '#FFC21A' : '#0E2A3B'} strokeWidth="3" strokeLinecap="round">
        <path d="M3 24h9" />
        <path d="M6 31h7" />
        <path d="M2 38h11" />
      </g>
      {/* carton */}
      <rect x="17" y="20" width="31" height="25" rx="3" fill="#FFC21A" stroke={stroke} strokeWidth="2.5" />
      <path d="M32.5 20v9" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M22 38h8" stroke={stroke} strokeWidth="2" strokeLinecap="round" opacity=".55" />
      {/* couvercle-flèche */}
      <path
        d="M17 19.5 L23 9 H45 V4.5 L61 14 L45 23.5 V19.5 Z"
        fill="#FFC21A"
        stroke={stroke}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logo({ className, dark = false, compact = false }: { className?: string; dark?: boolean; compact?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark className="h-9 w-12 shrink-0" dark={dark} />
      {!compact && (
        <span className={cn('flex flex-col leading-none', dark ? 'text-white' : 'text-navy')}>
          <span className="font-display text-[19px] tracking-[-0.02em]" style={{ transform: 'skewX(-8deg)', transformOrigin: 'left' }}>
            EXPRESS
          </span>
          <span className="font-display text-[11.5px] tracking-[0.16em] opacity-90">DÉBARRAS</span>
        </span>
      )}
    </span>
  );
}

/** Tuile carrée navy, à la manière d'une icône d'app. */
export function LogoTile({ className }: { className?: string }) {
  return (
    <span className={cn('inline-grid place-items-center rounded-[22%] bg-navy shadow-soft', className)}>
      <LogoMark dark className="h-[52%] w-[62%]" />
    </span>
  );
}
