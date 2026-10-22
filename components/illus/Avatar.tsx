/** Avatars illustrés, plats, dans la palette. */
export function Avatar({ variant, className }: { variant: 'max' | 'noa'; className?: string }) {
  const isMax = variant === 'max';
  return (
    <svg viewBox="0 0 200 200" className={className} role="img" aria-label={isMax ? 'Illustration de Max' : 'Illustration de Noa'}>
      <rect width="200" height="200" rx="48" fill={isMax ? '#FFC21A' : '#2F9E6E'} />
      <circle cx="160" cy="40" r="46" fill="#fff" opacity=".18" />
      {/* buste */}
      <path d="M40 200c4-40 30-62 60-62s56 22 60 62z" fill="#0E2A3B" />
      <path d="M84 140l16 20 16-20" fill="none" stroke={isMax ? '#FFC21A' : '#2F9E6E'} strokeWidth="5" strokeLinejoin="round" />
      {/* cou + tête */}
      <rect x="88" y="112" width="24" height="30" rx="10" fill="#E9B98F" />
      <ellipse cx="100" cy="92" rx="34" ry="38" fill="#F1C7A0" />
      {/* cheveux */}
      {isMax ? (
        <path d="M66 86c-2-30 18-46 38-46 22 0 36 14 34 40-6-12-18-18-30-16-10 2-14 10-26 10-8 0-12 4-16 12z" fill="#0E2A3B" />
      ) : (
        <path d="M64 92c-4-34 16-54 40-54 26 0 40 20 36 50-4-14-10-22-18-26-6 8-22 14-40 12-8 0-14 6-18 18z" fill="#3B2A20" />
      )}
      {/* visage */}
      <circle cx="87" cy="96" r="3.5" fill="#0E2A3B" />
      <circle cx="113" cy="96" r="3.5" fill="#0E2A3B" />
      <path d="M90 112c6 6 14 6 20 0" fill="none" stroke="#0E2A3B" strokeWidth="3.5" strokeLinecap="round" />
      {isMax ? <path d="M78 86h16M106 86h16" stroke="#0E2A3B" strokeWidth="3" strokeLinecap="round" /> : <path d="M80 87l12-2M108 85l12 2" stroke="#3B2A20" strokeWidth="3" strokeLinecap="round" />}
      {/* accessoire */}
      {isMax ? (
        <rect x="128" y="150" width="22" height="34" rx="4" fill="#fff" stroke="#0E2A3B" strokeWidth="3" />
      ) : (
        <g>
          <rect x="44" y="154" width="34" height="26" rx="3" fill="#F5F2EA" stroke="#0E2A3B" strokeWidth="3" />
          <path d="M44 162h34" stroke="#0E2A3B" strokeWidth="3" />
        </g>
      )}
    </svg>
  );
}
