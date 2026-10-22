'use client';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronsLeft, ChevronsUpDown, LogOut, Plus } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { LogoMark } from '@/components/brand/Logo';
import { cn } from '@/lib/cn';
import { auth } from '@/lib/pro/api';
import { can } from '@/lib/pro/permissions';
import { NAV } from './nav';
import { useShell } from './ShellContext';

export function isActive(pathname: string, href: string) {
  return href === '/pro' ? pathname === '/pro' : pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar({ collapsed, setCollapsed }: { collapsed: boolean; setCollapsed: (v: boolean) => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { org, role, counters } = useShell();
  const [orgOpen, setOrgOpen] = useState(false);
  const items = NAV.filter((n) => can(role, n.page) && (n.page !== 'partenaires' || org.kind === 'agence'));
  const badge = (b?: 'messages' | 'toSign') => (b === 'messages' ? counters.unreadMessages : b === 'toSign' ? counters.toSign : 0);

  return (
    <aside
      className={cn('pro-chrome sticky top-0 hidden h-screen shrink-0 flex-col bg-navy text-white transition-[width] duration-300 ease-[cubic-bezier(.22,1,.36,1)] lg:flex', collapsed ? 'w-[76px]' : 'w-[256px]')}
      aria-label="Navigation de l’espace pro"
    >
      <div className="flex h-16 items-center gap-3 px-4">
        <Link href="/pro" className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] bg-white/10 ring-1 ring-white/15" aria-label="Tableau de bord">
          <LogoMark dark className="h-6 w-8" />
        </Link>
        {!collapsed && (
          <div className="min-w-0 leading-tight">
            <p className="font-display text-[14px] tracking-[-0.02em]">EXPRESS PRO</p>
            <p className="truncate text-[11.5px] text-white/60">Espace clients professionnels</p>
          </div>
        )}
      </div>

      <div className="px-3 pb-2">
        {can(role, 'demandes') && (
          <Link
            href="/pro/demandes/nouvelle"
            data-tour="new"
            className={cn('flex h-10 items-center gap-2 rounded-[10px] bg-signal font-semibold text-navy transition hover:brightness-105', collapsed ? 'justify-center' : 'px-3')}
            title="Nouvelle demande (N)"
          >
            <Plus className="h-4 w-4" />
            {!collapsed && (
              <>
                <span className="text-[14px]">Nouvelle demande</span>
                <kbd className="ml-auto rounded bg-navy/10 px-1.5 font-mono text-[11px]">N</kbd>
              </>
            )}
          </Link>
        )}
      </div>

      <nav className="pro-scroll flex-1 overflow-y-auto px-3 py-2">
        {(['main', 'compte'] as const).map((g) => (
          <div key={g} className="mb-3">
            {!collapsed && g === 'compte' && <p className="px-3 pb-1.5 pt-2 font-mono text-[10.5px] uppercase tracking-[0.14em] text-white/50">Compte</p>}
            <ul className="space-y-0.5">
              {items
                .filter((i) => i.group === g)
                .map((i) => {
                  const active = isActive(pathname, i.href);
                  const n = badge(i.badge);
                  return (
                    <li key={i.href}>
                      <Link
                        href={i.href}
                        data-nav={i.page}
                        title={collapsed ? i.label : undefined}
                        aria-current={active ? 'page' : undefined}
                        className={cn('relative flex h-10 items-center gap-3 rounded-[10px] text-[14px] font-medium transition-colors', collapsed ? 'justify-center' : 'px-3', active ? 'text-white' : 'text-white/70 hover:bg-white/5 hover:text-white')}
                      >
                        {active && <motion.span layoutId="side-active" className="absolute inset-0 rounded-[10px] bg-white/10 ring-1 ring-white/10" transition={{ type: 'spring', stiffness: 450, damping: 36 }} />}
                        {active && <span className="absolute left-0 top-2 h-6 w-[3px] rounded-r bg-signal" />}
                        <i.icon className="relative h-[18px] w-[18px] shrink-0" />
                        {!collapsed && <span className="relative truncate">{i.label}</span>}
                        {n > 0 && (
                          <span className={cn('grid h-5 min-w-5 place-items-center rounded-full bg-signal px-1.5 text-[11px] font-bold text-navy', collapsed ? 'absolute right-1 top-1' : 'relative ml-auto')}>{n}</span>
                        )}
                      </Link>
                    </li>
                  );
                })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="relative border-t border-white/10 p-3">
        <AnimatePresence>
          {orgOpen && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="absolute bottom-[calc(100%-4px)] left-3 right-3 z-20 min-w-[230px] rounded-[12px] border border-white/10 bg-navy-900 p-1.5 shadow-2xl"
              role="menu"
            >
              <p className="px-2.5 pb-1 pt-1.5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-white/50">Organisations de démo</p>
              {auth.orgs().map((o) => (
                <button
                  key={o.id}
                  role="menuitem"
                  onClick={() => {
                    auth.switchOrg(o.id);
                    setOrgOpen(false);
                    router.push('/pro');
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13.5px] hover:bg-white/5"
                >
                  <OrgTile name={o.name} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{o.name}</span>
                    <span className="block truncate text-[11.5px] text-white/60">{o.tagline}</span>
                  </span>
                  {o.id === org.id && <Check className="h-4 w-4 text-signal" />}
                </button>
              ))}
              <div className="my-1 h-px bg-white/10" />
              <button
                role="menuitem"
                onClick={() => {
                  void auth.logout();
                  router.push('/pro/connexion');
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13.5px] text-white/80 hover:bg-white/5"
              >
                <LogOut className="h-4 w-4" /> Se déconnecter
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        <button onClick={() => setOrgOpen((o) => !o)} aria-expanded={orgOpen} aria-haspopup="menu" className={cn('flex w-full items-center gap-2.5 rounded-[10px] p-2 text-left hover:bg-white/5', collapsed && 'justify-center')}>
          <OrgTile name={org.name} />
          {!collapsed && (
            <>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13.5px] font-semibold">{org.name}</span>
                <span className="block truncate text-[11.5px] text-white/60">{org.tagline}</span>
              </span>
              <ChevronsUpDown className="h-4 w-4 text-white/60" />
            </>
          )}
        </button>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="mt-1 flex h-8 w-full items-center justify-center gap-2 rounded-lg text-[12px] text-white/60 hover:bg-white/5 hover:text-white"
          aria-label={collapsed ? 'Déplier la barre latérale' : 'Replier la barre latérale'}
        >
          <ChevronsLeft className={cn('h-4 w-4 transition-transform', collapsed && 'rotate-180')} />
          {!collapsed && 'Replier'}
        </button>
      </div>
    </aside>
  );
}

export function OrgTile({ name, className }: { name: string; className?: string }) {
  const initials = name
    .split(/[\s&]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('');
  return <span className={cn('grid h-8 w-8 shrink-0 place-items-center rounded-[8px] bg-signal font-display text-[12px] text-navy', className)}>{initials}</span>;
}
