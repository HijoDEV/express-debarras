'use client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarClock, Copy, FileCheck2, FileSignature, KeyRound, MapPin, Receipt, Send, Truck, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { Avatar } from '@/components/illus/Avatar';
import { cn } from '@/lib/cn';
import { duplicate, getIntervention, reschedule, sendMessage, transition } from '@/lib/pro/api';
import { useApi } from '@/lib/pro/hooks';
import { canAct } from '@/lib/pro/permissions';
import { photo } from '@/lib/photos';
import { eur } from '@/lib/pro/pricing';
import { Btn, Drawer, ErrorState, inputCls, LoadingList, StatusBadge } from '../ui';
import { useShell } from '../shell/ShellContext';
import { RouenMap } from './RouenMap';
import { Timeline } from './Timeline';

export function InterventionDrawer({ id, onClose }: { id: string | null; onClose: () => void }) {
  return (
    <Drawer open={!!id} onClose={onClose} title={id ? <DrawerTitle id={id} /> : ''} width={600}>
      {id && <DetailBody id={id} onClose={onClose} />}
    </Drawer>
  );
}

function DrawerTitle({ id }: { id: string }) {
  const { data } = useApi(() => getIntervention(id), [id]);
  return (
    <span className="flex items-center gap-2">
      <span className="font-mono">{data?.ref ?? '…'}</span>
      {data && <StatusBadge status={data.status} />}
    </span>
  );
}

function DetailBody({ id, onClose }: { id: string; onClose: () => void }) {
  const router = useRouter();
  const { role } = useShell();
  const { data: it, loading, error, reload } = useApi(() => getIntervention(id), [id]);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [resched, setResched] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [msg, setMsg] = useState('');
  const [typing, setTyping] = useState(false);
  const [busy, setBusy] = useState(false);

  if (loading || !it) return error ? <ErrorState message={error} onRetry={reload} /> : <LoadingList rows={8} />;

  const enRouteAt = [...it.history].reverse().find((h) => h.status === 'en_route')?.at;
  const canCancel = ['demandee', 'devis_envoye', 'devis_signe', 'planifiee'].includes(it.status) && canAct(role, 'order');
  const done = ['terminee', 'rapport_dispo'].includes(it.status);
  const run = async (fn: () => Promise<unknown>, ok: string) => {
    setBusy(true);
    try {
      await fn();
      toast.success(ok);
    } catch (e) {
      toast.error((e as Error).message, { action: { label: 'Réessayer', onClick: () => void run(fn, ok) } });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6 p-5">
      {/* en-tête */}
      <div>
        <p className="text-[18px] font-semibold">{it.site.label}</p>
        <p className="mt-1 flex items-center gap-1.5 text-[13.5px] text-p-muted">
          <MapPin className="h-4 w-4" /> {it.site.address}, {it.site.postalCode} {it.site.city}
        </p>
        <div className="mt-3 grid grid-cols-3 gap-2 text-[13px]">
          <div className="rounded-[10px] bg-p-soft p-2.5">
            <p className="text-p-muted">Créneau</p>
            <p className="font-semibold first-letter:uppercase">{it.slot ? format(new Date(it.slot.date), 'EEE d MMM', { locale: fr }) : 'À planifier'}</p>
            <p className="text-[12px] text-p-muted">{it.slot?.window}</p>
          </div>
          <div className="rounded-[10px] bg-p-soft p-2.5">
            <p className="text-p-muted">Volume</p>
            <p className="font-semibold">{it.content.mode === 'box' ? `${it.content.boxes?.length} box` : `${it.content.volume.toLocaleString('fr-FR')} m³`}</p>
            <p className="text-[12px] text-p-muted">{it.delay === '48h' ? 'Standard' : it.delay === 'urgence' ? 'Urgence 24 h' : 'Samedi'}</p>
          </div>
          <div className="rounded-[10px] bg-p-soft p-2.5">
            <p className="text-p-muted">Montant HT</p>
            <p className="font-mono font-semibold">{eur(it.ht)}</p>
            <p className="text-[12px] text-p-muted">{it.ht === 0 ? 'Abonnement' : `TTC ${eur(it.ttc)}`}</p>
          </div>
        </div>
      </div>

      {/* carte + équipe */}
      {it.status !== 'annulee' && (
        <section aria-label="Suivi en direct">
          <RouenMap target={it.site.map} status={it.status} since={enRouteAt} />
          <div className="mt-3 flex items-center justify-between gap-3 rounded-[12px] border border-p-line p-3">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                <Avatar variant="max" className="h-9 w-9 rounded-full ring-2 ring-[var(--p-card)]" />
                <Avatar variant="noa" className="h-9 w-9 rounded-full ring-2 ring-[var(--p-card)]" />
              </div>
              <div className="text-[13px] leading-tight">
                <p className="font-semibold">Max et Noa</p>
                <p className="text-p-muted">Camion 20 m³ · {it.site.keys === 'agence' ? 'clés à l’agence' : it.site.keys === 'gardien' ? 'clés chez le gardien' : 'contact sur place'}</p>
              </div>
            </div>
            {it.status === 'en_route' && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-signal px-2.5 py-1 text-[12px] font-bold text-navy">
                <Truck className="h-3.5 w-3.5" /> En route
              </span>
            )}
          </div>
        </section>
      )}

      {/* frise */}
      <section>
        <h3 className="mb-3 font-mono text-[11px] uppercase tracking-[0.14em] text-p-muted">Suivi</h3>
        <Timeline it={it} />
      </section>

      {/* photos */}
      <section>
        <h3 className="mb-3 font-mono text-[11px] uppercase tracking-[0.14em] text-p-muted">Photos</h3>
        <div className="grid grid-cols-2 gap-2">
          {(['caveAvant', done ? 'caveApres' : null] as const).map((k, i) => (
            <figure key={i} className="relative aspect-[4/3] overflow-hidden rounded-[12px] bg-p-soft">
              {k ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photo(k, 480, 360)} alt={i === 0 ? 'Avant' : 'Après'} loading="lazy" className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full place-items-center px-4 text-center text-[12.5px] text-p-muted">Photo après · disponible à la fin de l’intervention</div>
              )}
              <figcaption className={cn('absolute bottom-2 left-2 rounded-full px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-white', i === 0 ? 'bg-navy' : 'bg-tri-dark')}>{i === 0 ? 'Avant' : 'Après'}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* documents */}
      <section>
        <h3 className="mb-3 font-mono text-[11px] uppercase tracking-[0.14em] text-p-muted">Documents</h3>
        <ul className="grid gap-2 sm:grid-cols-2">
          {[
            { label: 'Devis', ok: !!it.devis, href: it.devis ? `/pro/devis/${it.devis.id}` : '', icon: FileSignature, sub: it.devis ? it.devis.ref : it.ht === 0 ? 'Couvert par l’abonnement' : 'En attente' },
            { label: 'Facture', ok: !!it.facture, href: it.facture ? `/pro/factures/${it.facture.id}` : '', icon: Receipt, sub: it.facture?.number ?? 'Après l’intervention' },
            { label: 'Rapport de tri', ok: !!it.rapport, href: it.rapport ? `/pro/documents/rapport/${it.rapport.id}` : '', icon: FileCheck2, sub: it.rapport ? `${it.rapport.valorisedPct} % valorisé` : 'Après l’intervention' },
            { label: 'Bordereau', ok: !!it.bordereau, href: it.bordereau ? `/pro/documents/bordereau/${it.bordereau.id}` : '', icon: FileCheck2, sub: it.bordereau?.number ?? 'Après l’intervention' },
          ].map((d) => (
            <li key={d.label}>
              {d.ok ? (
                <Link href={d.href} className="flex items-center gap-3 rounded-[12px] border border-p-line p-3 transition hover:bg-p-hover">
                  <d.icon className="h-5 w-5 text-tri" />
                  <span className="min-w-0">
                    <span className="block text-[13.5px] font-semibold">{d.label}</span>
                    <span className="block truncate font-mono text-[11.5px] text-p-muted">{d.sub}</span>
                  </span>
                </Link>
              ) : (
                <div className="flex items-center gap-3 rounded-[12px] border border-dashed border-p-line p-3 text-p-muted">
                  <d.icon className="h-5 w-5" />
                  <span>
                    <span className="block text-[13.5px] font-semibold">{d.label}</span>
                    <span className="block text-[11.5px]">{d.sub}</span>
                  </span>
                </div>
              )}
            </li>
          ))}
        </ul>
        {it.status === 'devis_envoye' && it.devis && canAct(role, 'sign') && (
          <Btn variant="primary" className="mt-3 w-full" href={`/pro/devis/${it.devis.id}`}>
            <FileSignature className="h-4 w-4" /> Signer le devis
          </Btn>
        )}
      </section>

      {/* messagerie liée */}
      <section>
        <h3 className="mb-3 font-mono text-[11px] uppercase tracking-[0.14em] text-p-muted">Messages</h3>
        <div className="space-y-2 rounded-[12px] bg-p-soft p-3">
          {it.messages.slice(-5).map((m) => (
            <motion.div key={m.id} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={cn('max-w-[85%] rounded-[12px] px-3 py-2 text-[13.5px]', m.author === 'client' ? 'ml-auto bg-navy text-white dark:bg-signal dark:text-navy' : 'bg-p-card')}>
              {m.text}
              <span className={cn('mt-0.5 block text-[10.5px]', m.author === 'client' ? 'text-white/60 dark:text-navy/60' : 'text-p-muted')}>
                {m.author === 'equipe' ? m.userName + ' · ' : ''}
                {format(new Date(m.at), 'd MMM HH:mm', { locale: fr })}
              </span>
            </motion.div>
          ))}
          <AnimatePresence>
            {typing && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex w-fit gap-1 rounded-[12px] bg-p-card px-3 py-2.5" aria-label="L’équipe écrit">
                {[0, 1, 2].map((d) => (
                  <motion.span key={d} className="h-1.5 w-1.5 rounded-full bg-p-muted" animate={{ y: [0, -3, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: d * 0.12 }} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!msg.trim()) return;
              const t = msg;
              setMsg('');
              void sendMessage(it.threadId, t, undefined, setTyping);
            }}
            className="flex gap-2 pt-1"
          >
            <input value={msg} onChange={(e) => setMsg(e.target.value)} className={inputCls} placeholder="Écrire à l’équipe…" aria-label="Message" />
            <Btn variant="dark" type="submit" aria-label="Envoyer">
              <Send className="h-4 w-4" />
            </Btn>
          </form>
        </div>
      </section>

      {/* actions */}
      <section className="sticky bottom-0 -mx-5 -mb-5 border-t border-p-line bg-p-card px-5 py-4">
        <AnimatePresence mode="wait">
          {confirmCancel ? (
            <motion.div key="confirm" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-[12px] bg-[#FBE9E5] p-3 text-[#9A3412] dark:bg-[#9A3412]/25 dark:text-[#F5B7A6]" role="alertdialog" aria-label="Confirmer l’annulation">
              <p className="text-[14px] font-semibold">Annuler {it.ref} ?</p>
              <p className="mt-0.5 text-[13px]">Gratuit jusqu’à 48 h avant le créneau. L’équipe est prévenue immédiatement.</p>
              <div className="mt-3 flex gap-2">
                <Btn variant="danger" disabled={busy} onClick={() => void run(() => transition(it.id, 'annulee', 'client', { note: 'Annulée par le client' }), 'Intervention annulée').then(() => setConfirmCancel(false))}>
                  Confirmer l’annulation
                </Btn>
                <Btn variant="ghost" onClick={() => setConfirmCancel(false)}>
                  Garder
                </Btn>
              </div>
            </motion.div>
          ) : resched ? (
            <motion.form
              key="resched"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              onSubmit={(e) => {
                e.preventDefault();
                if (!newDate) return;
                const d = new Date(newDate);
                d.setHours(9, 0, 0, 0);
                void run(() => reschedule(it.id, d.toISOString()), 'Report demandé').then(() => setResched(false));
              }}
              className="flex flex-wrap items-end gap-2"
            >
              <label className="flex-1 text-[13px] font-semibold">
                Nouvelle date
                <input type="date" required min={new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10)} value={newDate} onChange={(e) => setNewDate(e.target.value)} className={cn(inputCls, 'mt-1')} />
              </label>
              <Btn variant="primary" type="submit" disabled={busy}>
                Demander le report
              </Btn>
              <Btn variant="ghost" type="button" onClick={() => setResched(false)}>
                <X className="h-4 w-4" />
              </Btn>
            </motion.form>
          ) : (
            <motion.div key="actions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-wrap gap-2">
              {it.status === 'planifiee' && canAct(role, 'order') && (
                <Btn onClick={() => setResched(true)}>
                  <CalendarClock className="h-4 w-4" /> Reporter
                </Btn>
              )}
              {canAct(role, 'order') && (
                <Btn
                  disabled={busy}
                  onClick={() =>
                    void run(async () => {
                      const n = await duplicate(it.id);
                      onClose();
                      router.push(`/pro/interventions?id=${n.id}`);
                    }, 'Intervention dupliquée')
                  }
                >
                  <Copy className="h-4 w-4" /> Dupliquer
                </Btn>
              )}
              {canCancel && (
                <Btn variant="ghost" className="text-[#B4442A]" onClick={() => setConfirmCancel(true)}>
                  Annuler
                </Btn>
              )}
              <span className="ml-auto inline-flex items-center gap-1.5 text-[12px] text-p-muted">
                <KeyRound className="h-3.5 w-3.5" /> Code : <span className="font-mono">{it.site.accessCode ?? '—'}</span>
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>
  );
}
