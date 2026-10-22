'use client';
import { AnimatePresence, motion } from 'framer-motion';
import { LayoutGrid, Plus, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/cn';
import { can } from '@/lib/pro/permissions';
import { NAV } from './nav';
import { isActive } from './Sidebar';
import { useShell } from './ShellContext';

const PREFERRED = ['dashboard', 'interventions', 'messages', 'devis', 'factures', 'documents'];

export function MobileNav() {
  const pathname = usePathname();
  const { role, org, counters } = useShell();
  const [more, setMore] = useState(false);
  useEffect(() => setMore(false), [pathname]);
  const allowed = NAV.filter((n) => can(role, n.page) && (n.page !== 'partenaires' || org.kind === 'agence'));
  const tabs = PREFERRED.map((p) => allowed.find((a) => a.page === p)).filter(Boolean).slice(0, 4) as typeof NAV;
  const rest = allowed.filter((a) => !tabs.includes(a));

  return (
    <>
      {can(role, 'demandes') && !pathname.startsWith('/pro/demandes') && (
        <Link
          href="/pro/demandes/nouvelle"
          className="pro-chrome fixed bottom-[84px] right-4 z-40 inline-flex h-12 items-center gap-2 rounded-full bg-signal pl-4 pr-5 text-[14.5px] font-bold text-navy shadow-[0_10px_24px_-8px_rgba(255,194,26,.9)] lg:hidden"
        >
          <Plus className="h-5 w-5" /> Demande
        </Link>
      )}
      <nav className="pro-chrome fixed inset-x-0 bottom-0 z-40 border-t border-p-line bg-p-card pb-[env(safe-area-inset-bottom)] lg:hidden" aria-label="Navigation">
        <ul className="grid grid-cols-5">
          {tabs.map((t) => {
            const active = isActive(pathname, t.href);
            const n = t.badge === 'messages' ? counters.unreadMessages : t.badge === 'toSign' ? counters.toSign : 0;
            return (
              <li key={t.href}>
                <Link href={t.href} aria-current={active ? 'page' : undefined} className={cn('relative flex h-16 flex-col items-center justify-center gap-1 text-[10.5px] font-semibold', active ? 'text-p-text' : 'text-p-muted')}>
                  {active && <motion.span layoutId="tab-active" className="absolute top-0 h-[3px] w-10 rounded-b bg-signal" />}
                  <span className="relative">
                    <t.icon className="h-5 w-5" />
                    {n > 0 && <span className="absolute -right-2 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-signal px-1 text-[10px] text-navy">{n}</span>}
                  </span>
                  {t.label.split(' ')[0]}
                </Link>
              </li>
            );
          })}
          <li>
            <button onClick={() => setMore(true)} className="flex h-16 w-full flex-col items-center justify-center gap-1 text-[10.5px] font-semibold text-p-muted" aria-expanded={more}>
              <LayoutGrid className="h-5 w-5" /> Plus
            </button>
          </li>
        </ul>
      </nav>
      <AnimatePresence>
        {more && (
          <div className="fixed inset-0 z-[70] lg:hidden" role="dialog" aria-modal="true" aria-label="Plus de pages">
            <motion.div className="absolute inset-0 bg-[#06111A]/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMore(false)} />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 380, damping: 36 }} className="absolute inset-x-0 bottom-0 rounded-t-[22px] border-t border-p-line bg-p-card p-4 pb-8">
              <div className="mb-3 flex items-center justify-between">
                <p className="font-semibold">Toutes les pages</p>
                <button onClick={() => setMore(false)} className="grid h-9 w-9 place-items-center rounded-lg hover:bg-p-hover" aria-label="Fermer">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <ul className="grid grid-cols-3 gap-2">
                {rest.map((r) => (
                  <li key={r.href}>
                    <Link href={r.href} className="flex flex-col items-center gap-2 rounded-[12px] border border-p-line p-3 text-center text-[12.5px] font-semibold hover:bg-p-hover">
                      <r.icon className="h-5 w-5" />
                      {r.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
