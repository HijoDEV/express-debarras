import { cn } from '@/lib/cn';

function StatusBar({ dark = false, time = '9:41' }: { dark?: boolean; time?: string }) {
  const c = dark ? '#FFFFFF' : '#0E2A3B';
  return (
    <div className="absolute inset-x-0 top-0 z-30 flex h-[46px] items-center justify-between px-7 pt-1 text-[14px] font-semibold" style={{ color: c }}>
      <span className="tabular-nums tracking-tight">{time}</span>
      <span className="flex items-center gap-1.5" aria-hidden>
        <svg width="17" height="11" viewBox="0 0 17 11" fill={c}>
          <rect x="0" y="7" width="3" height="4" rx="1" />
          <rect x="4.5" y="5" width="3" height="6" rx="1" />
          <rect x="9" y="2.5" width="3" height="8.5" rx="1" />
          <rect x="13.5" y="0" width="3" height="11" rx="1" />
        </svg>
        <svg width="15" height="11" viewBox="0 0 15 11" fill={c}>
          <path d="M7.5 2.2c2.2 0 4.2.9 5.7 2.3l1.1-1.1A9.6 9.6 0 0 0 7.5.6 9.6 9.6 0 0 0 .7 3.4l1.1 1.1a8 8 0 0 1 5.7-2.3Z" />
          <path d="M7.5 5.4c1.3 0 2.5.5 3.4 1.3l1.1-1.1a6.4 6.4 0 0 0-9 0l1.1 1.1c.9-.8 2.1-1.3 3.4-1.3Z" />
          <circle cx="7.5" cy="9.3" r="1.6" />
        </svg>
        <svg width="26" height="12" viewBox="0 0 26 12" fill="none">
          <rect x="0.5" y="0.5" width="22" height="11" rx="3.2" stroke={c} opacity=".4" />
          <rect x="2" y="2" width="16" height="8" rx="2" fill={c} />
          <path d="M24 4v4c.8-.3 1.3-1.1 1.3-2S24.8 4.3 24 4Z" fill={c} opacity=".45" />
        </svg>
      </span>
    </div>
  );
}

/**
 * Smartphone réaliste et générique (aucune marque) : cadre métal, verre noir,
 * îlot caméra, boutons latéraux, barre d'état et barre d'accueil.
 */
export function Phone({
  children,
  className,
  screenClassName,
  darkStatus = false,
  time,
}: {
  children: React.ReactNode;
  className?: string;
  screenClassName?: string;
  darkStatus?: boolean;
  time?: string;
}) {
  return (
    <div className={cn('relative mx-auto w-[292px] sm:w-[318px]', className)}>
      {/* boutons latéraux */}
      <span aria-hidden className="absolute -left-[3px] top-[118px] h-7 w-[4px] rounded-l-md bg-gradient-to-r from-[#8E979E] to-[#C9CFD4]" />
      <span aria-hidden className="absolute -left-[3px] top-[164px] h-12 w-[4px] rounded-l-md bg-gradient-to-r from-[#8E979E] to-[#C9CFD4]" />
      <span aria-hidden className="absolute -left-[3px] top-[222px] h-12 w-[4px] rounded-l-md bg-gradient-to-r from-[#8E979E] to-[#C9CFD4]" />
      <span aria-hidden className="absolute -right-[3px] top-[180px] h-20 w-[4px] rounded-r-md bg-gradient-to-l from-[#8E979E] to-[#C9CFD4]" />

      {/* cadre métal */}
      <div className="rounded-[58px] bg-[linear-gradient(145deg,#F2F4F6_0%,#B8C0C6_22%,#E6E9EC_48%,#9EA7AE_74%,#DDE1E4_100%)] p-[3px] shadow-[0_50px_100px_-30px_rgba(14,42,59,.55),0_20px_40px_-20px_rgba(14,42,59,.35)]">
        {/* verre noir */}
        <div className="rounded-[55px] bg-[#05080B] p-[10px]">
          <div className={cn('relative h-[600px] overflow-hidden rounded-[46px] bg-[#F4F1E9] sm:h-[650px]', screenClassName)}>
            <StatusBar dark={darkStatus} time={time} />
            {/* îlot caméra */}
            <div aria-hidden className="absolute left-1/2 top-[11px] z-40 flex h-[30px] w-[104px] -translate-x-1/2 items-center justify-end rounded-full bg-black pr-3">
              <span className="h-[10px] w-[10px] rounded-full bg-[radial-gradient(circle_at_35%_35%,#3B4C6B,#0B0F1A_60%)]" />
            </div>
            {children}
            {/* barre d'accueil */}
            <div aria-hidden className="absolute bottom-2 left-1/2 z-40 h-[5px] w-[120px] -translate-x-1/2 rounded-full bg-[#0E2A3B]/80" />
            {/* reflet du verre */}
            <div aria-hidden className="pointer-events-none absolute inset-0 z-30 bg-[linear-gradient(115deg,rgba(255,255,255,.14)_0%,rgba(255,255,255,0)_32%)]" />
          </div>
        </div>
      </div>
    </div>
  );
}
