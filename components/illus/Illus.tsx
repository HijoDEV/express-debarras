import type { IllusId } from '@/lib/data';

const N = '#0E2A3B';
const Y = '#FFC21A';
const W = '#FFFFFF';
const K = '#EDE6D6';
const G = '#2F9E6E';
const B = '#B9C0C6';

const s = { stroke: N, strokeWidth: 2.5, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };

const ART: Record<IllusId, JSX.Element> = {
  sofa: (
    <>
      <rect x="10" y="22" width="44" height="16" rx="5" fill={Y} {...s} />
      <rect x="6" y="30" width="10" height="16" rx="4" fill={Y} {...s} />
      <rect x="48" y="30" width="10" height="16" rx="4" fill={Y} {...s} />
      <rect x="16" y="34" width="32" height="12" rx="3" fill={W} {...s} />
      <path d="M32 34v12" {...s} />
      <path d="M12 46v5M52 46v5" {...s} />
    </>
  ),
  sofa2: (
    <>
      <rect x="14" y="22" width="36" height="16" rx="5" fill={G} {...s} />
      <rect x="10" y="30" width="9" height="16" rx="4" fill={G} {...s} />
      <rect x="45" y="30" width="9" height="16" rx="4" fill={G} {...s} />
      <rect x="19" y="34" width="26" height="12" rx="3" fill={W} {...s} />
      <path d="M15 46v5M49 46v5" {...s} />
    </>
  ),
  wardrobe: (
    <>
      <rect x="14" y="8" width="36" height="46" rx="3" fill={K} {...s} />
      <path d="M32 8v46" {...s} />
      <path d="M28 28v6M36 28v6" {...s} />
      <path d="M18 54v4M46 54v4" {...s} />
    </>
  ),
  bed: (
    <>
      <rect x="6" y="18" width="8" height="34" rx="2" fill={N} {...s} />
      <rect x="12" y="32" width="46" height="12" rx="3" fill={W} {...s} />
      <rect x="16" y="26" width="12" height="7" rx="3" fill={Y} {...s} />
      <path d="M12 44h46v6" {...s} />
      <path d="M58 32v18" {...s} />
    </>
  ),
  single: (
    <>
      <rect x="10" y="20" width="7" height="30" rx="2" fill={N} {...s} />
      <rect x="15" y="32" width="40" height="11" rx="3" fill={K} {...s} />
      <rect x="19" y="26" width="10" height="7" rx="3" fill={W} {...s} />
      <path d="M15 43h40v7" {...s} />
    </>
  ),
  table: (
    <>
      <rect x="10" y="24" width="44" height="6" rx="2" fill={Y} {...s} />
      <path d="M16 30v22M48 30v22" {...s} />
      <path d="M4 34v18M4 40h8v12" {...s} />
      <path d="M60 34v18M60 40h-8v12" {...s} />
    </>
  ),
  buffet: (
    <>
      <rect x="8" y="22" width="48" height="26" rx="3" fill={K} {...s} />
      <path d="M24 22v26M40 22v26" {...s} />
      <path d="M16 33h2M30 33h4M46 33h2" {...s} />
      <path d="M12 48v6M52 48v6" {...s} />
    </>
  ),
  shelf: (
    <>
      <rect x="14" y="6" width="36" height="52" rx="2" fill={W} {...s} />
      <path d="M14 20h36M14 34h36M14 48h36" {...s} />
      <rect x="18" y="10" width="5" height="10" fill={Y} {...s} />
      <rect x="24" y="12" width="5" height="8" fill={G} {...s} />
      <rect x="36" y="38" width="10" height="10" fill={Y} {...s} />
      <rect x="19" y="25" width="5" height="9" fill={N} {...s} />
    </>
  ),
  desk: (
    <>
      <rect x="6" y="28" width="52" height="6" rx="2" fill={K} {...s} />
      <rect x="40" y="34" width="14" height="18" fill={K} {...s} />
      <path d="M10 34v18M40 42h14" {...s} />
      <rect x="18" y="12" width="18" height="12" rx="2" fill={N} {...s} />
      <path d="M27 24v4" {...s} />
    </>
  ),
  fridge: (
    <>
      <rect x="18" y="6" width="28" height="52" rx="4" fill={W} {...s} />
      <path d="M18 24h28" {...s} />
      <path d="M23 13v6M23 30v10" {...s} />
      <rect x="36" y="32" width="6" height="6" rx="1" fill={Y} stroke="none" />
    </>
  ),
  mattress: (
    <>
      <rect x="6" y="26" width="52" height="16" rx="6" fill={W} {...s} />
      <path d="M14 34h0M24 34h0M34 34h0M44 34h0M54 34h0" stroke={N} strokeWidth="4" strokeLinecap="round" />
      <path d="M6 34c0-4 4-8 8-8" stroke={Y} strokeWidth="3" fill="none" />
    </>
  ),
  armchair: (
    <>
      <rect x="16" y="14" width="32" height="24" rx="6" fill={Y} {...s} />
      <rect x="10" y="28" width="10" height="18" rx="4" fill={Y} {...s} />
      <rect x="44" y="28" width="10" height="18" rx="4" fill={Y} {...s} />
      <rect x="20" y="34" width="24" height="12" rx="3" fill={W} {...s} />
      <path d="M16 46v6M48 46v6" {...s} />
    </>
  ),
  dresser: (
    <>
      <rect x="12" y="14" width="40" height="38" rx="3" fill={K} {...s} />
      <path d="M12 27h40M12 40h40" {...s} />
      <path d="M29 21h6M29 34h6M29 46h6" {...s} />
      <path d="M16 52v5M48 52v5" {...s} />
      <circle cx="44" cy="9" r="4" fill={G} {...s} />
    </>
  ),
  washer: (
    <>
      <rect x="14" y="8" width="36" height="48" rx="4" fill={W} {...s} />
      <path d="M14 18h36" {...s} />
      <circle cx="32" cy="37" r="11" fill={B} {...s} />
      <circle cx="32" cy="37" r="5" fill={W} {...s} />
      <circle cx="42" cy="13" r="1.8" fill={Y} stroke="none" />
    </>
  ),
  stove: (
    <>
      <rect x="14" y="10" width="36" height="46" rx="3" fill={W} {...s} />
      <rect x="20" y="28" width="24" height="20" rx="2" fill={N} {...s} />
      <circle cx="24" cy="18" r="3" fill={Y} {...s} />
      <circle cx="40" cy="18" r="3" fill={Y} {...s} />
    </>
  ),
  bike: (
    <>
      <circle cx="16" cy="40" r="11" fill="none" {...s} />
      <circle cx="48" cy="40" r="11" fill="none" {...s} />
      <path d="M16 40l10-16h16l6 16M26 24l8 16h-2M42 24l-2-6h-6" stroke={N} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M24 20h8" stroke={Y} strokeWidth="4" strokeLinecap="round" />
    </>
  ),
  tv: (
    <>
      <rect x="6" y="12" width="52" height="32" rx="3" fill={N} {...s} />
      <rect x="11" y="17" width="42" height="22" rx="1" fill={Y} stroke="none" opacity=".85" />
      <path d="M24 52h16M32 44v8" {...s} />
    </>
  ),
  box: (
    <>
      <path d="M10 24l22-10 22 10v26L32 58 10 50z" fill={K} {...s} />
      <path d="M10 24l22 10 22-10M32 34v24" {...s} />
      <path d="M21 19l22 10" stroke={Y} strokeWidth="4" />
    </>
  ),
  bag: (
    <>
      <path d="M16 20h32l4 36H12z" fill={N} {...s} />
      <path d="M24 20c0-8 4-12 8-12s8 4 8 12" stroke={N} strokeWidth="2.5" fill="none" />
      <path d="M26 12l6 4 6-4" stroke={Y} strokeWidth="3" fill="none" strokeLinecap="round" />
    </>
  ),
  lamp: (
    <>
      <path d="M20 10h24l6 18H14z" fill={Y} {...s} />
      <path d="M32 28v22" {...s} />
      <rect x="22" y="50" width="20" height="6" rx="2" fill={N} {...s} />
    </>
  ),
};

export function Illus({ id, className, title }: { id: IllusId; className?: string; title?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} role={title ? 'img' : undefined} aria-hidden={title ? undefined : true}>
      {title && <title>{title}</title>}
      {ART[id]}
    </svg>
  );
}
