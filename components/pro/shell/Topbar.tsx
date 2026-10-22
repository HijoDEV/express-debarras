'use client';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, ChevronRight, Compass, LogOut, Moon, Search, Sun, UserCog } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { LogoMark } from '@/components/brand/Logo';
import { cn } from '@/lib/cn';
import { auth } from '@/lib/pro/api';
import { ROLE_HINT, ROLE_LABEL } from '@/lib/pro/permissions';
import type { Role } from '@/lib/pro/types';
import { UserAvatar } from '../Avatar';
import { CRUMBS } from './nav';
import { useShell } from './ShellContext';

export function Topbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, role, counters, theme, toggleTheme, openPalette, openNotifs, startTour, org } = useShell();
  const [menu, setMenu] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!menu) return;
    const h = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setMenu(false);
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [menu]);

  const parts = pathname.split('/').filter(Boolean);
  const crumbs = parts.map((p, i) => ({ label: CRUMBS[p] ?? (p.length > 12 ? 'Détail' : decodeURIComponent(p)), href: '/' + parts.slice(0, i + 1).join('/') }));

  return (
    <header className="pro-chrome sticky top-0 z-40 border-b border-p-line bg-p-card/95 backdrop-blur [background:color-mix(in_srgb,var(--p-card)_92%,transparent)]">
      <div className="flex h-14 items-center gap-3 px-4 sm:h-16 sm:px-6">
        <Link href="/pro" className="grid h-9 w-9 place-items-center rounded-[10px] bg-navy lg:hidden" aria-label="Tableau de bord">
          <LogoMark dark className="h-5 w-7" />
        </Link>
        <nav aria-label="Fil d’Ariane" className="hidden min-w-0 items-center gap-1 text-[13.5px] sm:flex">
          <span className="truncate text-p-muted">{org.name}</span>
          {crumbs.map((c, i) => (
            <span key={c.href} className="flex min-w-0 items-center gap-1">
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-p-muted" />
              {i === crumbs.length - 1 || ['demandes', 'rapport', 'bordereau'].includes(parts[i]) ? (
                <span className="truncate font-semibold text-p-text" aria-current="page">
                  {c.label}
                </span>
              ) : (
                <Link href={c.href} className="truncate text-p-muted hover:text-p-text">
                  {c.label}
                </Link>
              )}
            </span>
          ))}
        </nav>
        <p className="min-w-0 truncate text-[14px] font-semibold sm:hidden">{crumbs[crumbs.length - 1]?.label}</p>

        <div className="ml-auto flex items-center gap-1.5">
          <button
            onClick={openPalette}
            data-tour="search"
            className="hidden h-9 w-[240px] items-center gap-2 rounded-[10px] border border-p-line bg-p-soft px-3 text-left text-[13.5px] text-p-muted transition hover:border-navy/30 md:flex"
          >
            <Search className="h-4 w-4" />
            Rechercher…
            <kbd className="ml-auto rounded border border-p-line bg-p-card px-1.5 font-mono text-[11px]">⌘K</kbd>
          </button>
          <button onClick={openPalette} className="grid h-9 w-9 place-items-center rounded-[10px] hover:bg-p-hover md:hidden" aria-label="Rechercher">
            <Search className="h-[18px] w-[18px]" />
          </button>
          <button onClick={toggleTheme} className="grid h-9 w-9 place-items-center rounded-[10px] hover:bg-p-hover" aria-label={theme === 'dark' ? 'Passer en thème clair' : 'Passer en thème sombre'}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.span key={theme} initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                {theme === 'dark' ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
              </motion.span>
            </AnimatePresence>
          </button>
          <button onClick={openNotifs} className="relative grid h-9 w-9 place-items-center rounded-[10px] hover:bg-p-hover" aria-label={`Notifications, ${counters.unreadNotifs} non lues`}>
            <Bell className="h-[18px] w-[18px]" />
            {counters.unreadNotifs > 0 && (
              <motion.span key={counters.unreadNotifs} initial={{ scale: 0.4 }} animate={{ scale: 1 }} className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-[#E0533A] px-1 text-[10px] font-bold text-white">
                {counters.unreadNotifs}
              </motion.span>
            )}
          </button>

          <div className="relative" ref={ref}>
            <button onClick={() => setMenu((m) => !m)} aria-haspopup="menu" aria-expanded={menu} className="flex items-center gap-2 rounded-[10px] p-1 hover:bg-p-hover">
              <UserAvatar seed={user.avatarSeed} name={`${user.firstName} ${user.lastName}`} className="h-8 w-8" />
              <span className="hidden text-left leading-tight xl:block">
                <span className="block text-[13px] font-semibold">
                  {user.firstName} {user.lastName}
                </span>
                <span className="block text-[11.5px] text-p-muted">{ROLE_LABEL[role]}</span>
              </span>
            </button>
            <AnimatePresence>
              {menu && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="absolute right-0 top-[calc(100%+6px)] w-[270px] rounded-[14px] border border-p-line bg-p-card p-1.5 shadow-2xl"
                  role="menu"
                >
                  <p className="flex items-center gap-1.5 px-2.5 pb-1 pt-1.5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-p-muted">
                    <UserCog className="h-3.5 w-3.5" /> Voir en tant que
                  </p>
                  {(['admin', 'gestionnaire', 'comptable'] as Role[]).map((r) => (
                    <button
                      key={r}
                      role="menuitemradio"
                      aria-checked={role === r}
                      onClick={() => {
                        auth.viewAs(r);
                        setMenu(false);
                        router.push('/pro');
                      }}
                      className={cn('flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-[13.5px] hover:bg-p-hover', role === r && 'bg-p-soft font-semibold')}
                    >
                      <span>
                        {ROLE_LABEL[r]}
                        <span className="block text-[11.5px] font-normal text-p-muted">{ROLE_HINT[r]}</span>
                      </span>
                      {role === r && <span className="h-2 w-2 rounded-full bg-tri" />}
                    </button>
                  ))}
                  <div className="my-1 h-px bg-p-line" />
                  <button
                    role="menuitem"
                    onClick={() => {
                      setMenu(false);
                      startTour();
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13.5px] hover:bg-p-hover"
                  >
                    <Compass className="h-4 w-4" /> Relancer la visite guidée
                  </button>
                  <button
                    role="menuitem"
                    onClick={() => {
                      void auth.logout();
                      router.push('/pro/connexion');
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13.5px] hover:bg-p-hover"
                  >
                    <LogOut className="h-4 w-4" /> Se déconnecter
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}
