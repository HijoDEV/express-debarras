'use client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Radio } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast, Toaster } from 'sonner';
import { StatusBadge } from '@/components/pro/ui';
import { cn } from '@/lib/cn';
import { teamQueue, transition } from '@/lib/pro/api';
import { eur } from '@/lib/pro/pricing';
import { nextTeamAction, STATUS_META } from '@/lib/pro/status';
import { rehydrate, useProStore } from '@/lib/pro/store';
import { subscribe } from '@/lib/pro/sync';

/** File des demandes pro, côté équipe. Se met à jour en direct depuis /pro (autre onglet). */
export function ProQueue() {
  const rev = useProStore((s) => s.rev);
  const [ready, setReady] = useState(false);
  const [fresh, setFresh] = useState<string[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    const done = () => {
      useProStore.getState().ensureDb();
      setReady(true);
    };
    if (useProStore.persist.hasHydrated()) done();
    const un = useProStore.persist.onFinishHydration(done);
    const off = subscribe(async (e) => {
      await rehydrate();
      if (e.type === 'created') {
        setFresh((f) => [e.interventionId, ...f]);
        toast.success(`Nouvelle demande pro · ${e.ref}`, { description: 'Reçue à l’instant depuis l’espace pro.' });
      }
      if (e.type === 'status' && e.by === 'client') toast(`${e.ref} · ${STATUS_META[e.status].label}`, { description: 'Action du client' });
    });
    return () => {
      un();
      off();
    };
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const rows = useMemo(() => (ready ? teamQueue() : []), [ready, rev]);

  const act = async (id: string, to: Parameters<typeof transition>[1], label: string) => {
    setBusy(id);
    try {
      await transition(id, to, 'equipe');
      toast.success(label);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="mt-12">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="inline-flex items-center gap-2 font-mono text-label uppercase text-tri-dark">
            <Radio className="h-3.5 w-3.5 animate-pulse" /> En direct · espace pro
          </p>
          <h2 className="mt-2 font-display text-h2">Demandes des clients pros</h2>
          <p className="mt-2 max-w-xl text-[15px] text-navy/70">Ouvrez /pro dans une autre fenêtre : chaque demande arrive ici instantanément, et chaque action de l’équipe s’affiche chez le client.</p>
        </div>
      </div>
      <div className="mt-6 overflow-hidden rounded-[22px] bg-white ring-1 ring-line">
        {!ready ? (
          <p className="p-6 text-navy/60">Chargement…</p>
        ) : rows.length === 0 ? (
          <p className="p-6 text-navy/60">Aucune demande en cours.</p>
        ) : (
          <ul className="divide-y divide-line">
            <AnimatePresence initial={false}>
              {rows.map((r) => {
                const a = r.status === 'demandee' && r.ht === 0 ? { to: 'devis_signe' as const, label: 'Valider (abonnement)' } : nextTeamAction(r.status);
                const isNew = fresh.includes(r.id);
                return (
                  <motion.li key={r.id} layout initial={{ opacity: 0, backgroundColor: '#FFF4D1' }} animate={{ opacity: 1, backgroundColor: isNew ? '#FFF4D1' : '#FFFFFF' }} transition={{ duration: 0.6 }} className="grid gap-3 p-4 sm:grid-cols-[1.4fr_1fr_auto] sm:items-center">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[13px] font-semibold">{r.ref}</span>
                        <StatusBadge status={r.status} />
                        {isNew && <span className="rounded-full bg-signal px-2 py-0.5 text-[11px] font-bold text-navy">Nouveau</span>}
                      </div>
                      <p className="mt-1 truncate font-semibold">{r.org.name}</p>
                      <p className="truncate text-[13.5px] text-navy/70">
                        {r.site.label} · {r.site.city}
                      </p>
                    </div>
                    <div className="text-[13.5px]">
                      <p className="font-semibold">
                        {r.content.mode === 'box' ? `${r.content.boxes?.length} box` : `${r.content.volume.toLocaleString('fr-FR')} m³`} · {r.ht ? `${eur(r.ht)} HT` : 'Abonnement'}
                      </p>
                      <p className="capitalize text-navy/70">{r.slot ? `${format(new Date(r.slot.date), 'EEE d MMM', { locale: fr })} · ${r.slot.window}` : 'À planifier'}</p>
                    </div>
                    <div className="flex sm:justify-end">
                      {a ? (
                        <button disabled={busy === r.id} onClick={() => void act(r.id, a.to, `${r.ref} · ${a.label}`)} className={cn('inline-flex h-10 items-center gap-1.5 rounded-btn px-4 text-[14px] font-semibold transition disabled:opacity-50', a.to === 'en_route' ? 'bg-signal text-navy shadow-signal' : 'bg-navy text-white hover:bg-navy-700')}>
                          {a.label} <ArrowRight className="h-4 w-4" />
                        </button>
                      ) : (
                        <span className="text-[13px] text-navy/60">{r.status === 'devis_envoye' ? 'En attente de signature' : '—'}</span>
                      )}
                    </div>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        )}
      </div>
      <Toaster position="bottom-right" richColors closeButton />
    </section>
  );
}
