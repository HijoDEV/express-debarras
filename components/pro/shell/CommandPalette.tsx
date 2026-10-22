'use client';
import { Command } from 'cmdk';
import { AnimatePresence, motion } from 'framer-motion';
import { Compass, CornerDownLeft, FileText, LogOut, Moon, Plus, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { auth, search, type InterventionRow } from '@/lib/pro/api';
import { can } from '@/lib/pro/permissions';
import { StatusBadge } from '../ui';
import { NAV } from './nav';
import { useShell } from './ShellContext';

export function CommandPalette({ open, setOpen }: { open: boolean; setOpen: (v: boolean) => void }) {
  const router = useRouter();
  const { role, org, toggleTheme, startTour } = useShell();
  const [q, setQ] = useState('');
  const [results, setResults] = useState<InterventionRow[]>([]);

  useEffect(() => {
    if (!open) setQ('');
  }, [open]);
  useEffect(() => {
    let alive = true;
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    void search(q).then((r) => alive && setResults(r));
    return () => {
      alive = false;
    };
  }, [q]);

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };
  const item = 'flex cursor-pointer items-center gap-3 rounded-[10px] px-3 py-2.5 text-[14px] text-p-text aria-selected:bg-p-soft';

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center p-3 pt-[12vh]" role="dialog" aria-modal="true" aria-label="Palette de commandes">
          <motion.div className="absolute inset-0 bg-[#06111A]/50 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
          <motion.div initial={{ opacity: 0, y: -12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.98 }} transition={{ type: 'spring', stiffness: 500, damping: 34 }} className="relative w-full max-w-[620px] overflow-hidden rounded-[16px] border border-p-line bg-p-card shadow-2xl">
            <Command label="Palette de commandes" shouldFilter loop>
              <div className="flex items-center gap-3 border-b border-p-line px-4">
                <Search className="h-4 w-4 text-p-muted" />
                <Command.Input autoFocus value={q} onValueChange={setQ} placeholder="Aller à, rechercher une référence ou une adresse…" className="h-14 flex-1 bg-transparent text-[15px] text-p-text outline-none placeholder:text-p-muted" />
                <kbd className="rounded border border-p-line px-1.5 font-mono text-[11px] text-p-muted">Échap</kbd>
              </div>
              <Command.List className="pro-scroll max-h-[55vh] overflow-y-auto p-2">
                <Command.Empty className="px-3 py-8 text-center text-[14px] text-p-muted">Aucun résultat pour « {q} »</Command.Empty>
                {results.length > 0 && (
                  <Command.Group heading="Interventions" className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-[10.5px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.14em] [&_[cmdk-group-heading]]:text-p-muted">
                    {results.map((r) => (
                      <Command.Item key={r.id} value={`${r.ref} ${r.site.label} ${r.site.address} ${r.site.city}`} onSelect={() => go(`/pro/interventions?id=${r.id}`)} className={item}>
                        <FileText className="h-4 w-4 text-p-muted" />
                        <span className="min-w-0 flex-1">
                          <span className="font-mono text-[13px] font-semibold">{r.ref}</span>
                          <span className="block truncate text-[12.5px] text-p-muted">
                            {r.site.label} · {r.site.city}
                          </span>
                        </span>
                        <StatusBadge status={r.status} />
                      </Command.Item>
                    ))}
                  </Command.Group>
                )}
                <Command.Group heading="Actions" className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-[10.5px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.14em] [&_[cmdk-group-heading]]:text-p-muted">
                  {can(role, 'demandes') && (
                    <Command.Item value="nouvelle demande debarras" onSelect={() => go('/pro/demandes/nouvelle')} className={item}>
                      <Plus className="h-4 w-4" /> Nouvelle demande <kbd className="ml-auto font-mono text-[11px] text-p-muted">N</kbd>
                    </Command.Item>
                  )}
                  <Command.Item
                    value="basculer theme sombre clair"
                    onSelect={() => {
                      toggleTheme();
                      setOpen(false);
                    }}
                    className={item}
                  >
                    <Moon className="h-4 w-4" /> Basculer le thème
                  </Command.Item>
                  <Command.Item
                    value="visite guidee aide"
                    onSelect={() => {
                      setOpen(false);
                      startTour();
                    }}
                    className={item}
                  >
                    <Compass className="h-4 w-4" /> Relancer la visite guidée
                  </Command.Item>
                  <Command.Item
                    value="se deconnecter"
                    onSelect={() => {
                      void auth.logout();
                      go('/pro/connexion');
                    }}
                    className={item}
                  >
                    <LogOut className="h-4 w-4" /> Se déconnecter
                  </Command.Item>
                </Command.Group>
                <Command.Group heading="Navigation" className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-[10.5px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.14em] [&_[cmdk-group-heading]]:text-p-muted">
                  {NAV.filter((n) => can(role, n.page) && (n.page !== 'partenaires' || org.kind === 'agence')).map((n) => (
                    <Command.Item key={n.href} value={`aller ${n.label}`} onSelect={() => go(n.href)} className={item}>
                      <n.icon className="h-4 w-4" /> {n.label}
                    </Command.Item>
                  ))}
                </Command.Group>
              </Command.List>
              <div className="flex items-center gap-4 border-t border-p-line px-4 py-2.5 text-[12px] text-p-muted">
                <span className="inline-flex items-center gap-1">
                  <CornerDownLeft className="h-3.5 w-3.5" /> ouvrir
                </span>
                <span>↑ ↓ naviguer</span>
                <span className="ml-auto">G puis D : tableau de bord</span>
              </div>
            </Command>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
