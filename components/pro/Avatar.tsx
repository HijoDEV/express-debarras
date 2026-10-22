import { cn } from '@/lib/cn';

const SKIN = ['#F1C7A0', '#E0AC86', '#C68B62', '#8D5B3C', '#F6D5B8'];
const HAIR = ['#0E2A3B', '#3B2A20', '#7A4B2A', '#C99A4A', '#1B1B1B', '#8A9299'];
const BG = ['#FFC21A', '#2F9E6E', '#9EC3DD', '#F3D9B8', '#E3E8EC', '#FFD866'];

/** Avatar illustré généré à partir d'une graine (aucune vraie photo). */
export function UserAvatar({ seed, name, className }: { seed: number; name: string; className?: string }) {
  const s = SKIN[seed % SKIN.length];
  const h = HAIR[(seed >> 3) % HAIR.length];
  const b = BG[(seed >> 5) % BG.length];
  const long = (seed >> 2) % 2 === 0;
  return (
    <svg viewBox="0 0 40 40" className={cn('shrink-0 rounded-full', className)} role="img" aria-label={name}>
      <rect width="40" height="40" fill={b} />
      <path d="M8 40c1-8 6-12 12-12s11 4 12 12z" fill="#0E2A3B" />
      <rect x="17" y="22" width="6" height="7" rx="3" fill={s} />
      <ellipse cx="20" cy="18" rx="7.5" ry="8.5" fill={s} />
      {long ? <path d="M12 19c-1-8 3-12 8-12s9 4 8 12c-1-4-3-6-6-6-2 2-6 3-10 6z M12 19 l0 8 3-2z M28 19 l0 8-3-2z" fill={h} /> : <path d="M12.5 17c-1-7 3-10 7.5-10s8.5 3 7.5 10c-2-3-4-4-7-4s-6 1-8 4z" fill={h} />}
      <circle cx="17" cy="19" r="1" fill="#0E2A3B" />
      <circle cx="23" cy="19" r="1" fill="#0E2A3B" />
      <path d="M17.5 23c1.4 1.2 3.6 1.2 5 0" stroke="#0E2A3B" strokeWidth="1" fill="none" strokeLinecap="round" />
    </svg>
  );
}
