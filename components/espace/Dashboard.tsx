'use client';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ClipboardList, FileText, Inbox, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Container } from '@/components/ui/Section';
import { ProQueue } from './ProQueue';
import { Label } from '@/components/ui/Label';
import { cn } from '@/lib/cn';
import { computeQuote, fmtEur, fmtVol } from '@/lib/pricing';
import { getBookings, saveBookings, STATUSES, type Booking, type BookingStatus } from '@/lib/storage';

const STATUS_STYLE: Record<BookingStatus, string> = {
  Nouveau: 'bg-signal-soft text-navy ring-signal',
  'Photos validées': 'bg-[#E3EDF5] text-navy ring-[#9DB8CC]',
  Planifié: 'bg-navy text-white ring-navy',
  Terminé: 'bg-tri-soft text-tri-dark ring-tri/40',
};

function demoBooking(): Booking {
  const q = computeQuote({ rooms: { t2: 1 }, floor: 3, pack: 'cles' });
  return {
    id: `ED-DEMO${Math.floor(Math.random() * 90 + 10)}`,
    createdAt: new Date().toISOString(),
    name: 'Josiane L. (démo)',
    phone: '06 12 34 56 78',
    email: 'demo@exemple.fr',
    address: '8 rue Jeanne-d’Arc, Rouen',
    postalCode: '76000',
    slot: 'jeudi · 9 h',
    formulaName: q.formulaName,
    volume: q.volume,
    total: q.total,
    deposit: q.deposit,
    lines: q.lines,
    items: {},
    rooms: { t2: 1 },
    photos: 6,
    status: 'Photos validées',
  };
}

export function Dashboard() {
  const [list, setList] = useState<Booking[] | null>(null);
  useEffect(() => setList(getBookings()), []);
  const update = (next: Booking[]) => {
    setList(next);
    saveBookings(next);
  };
  const setStatus = (id: string, s: BookingStatus) => update((list ?? []).map((b) => (b.id === id ? { ...b, status: s } : b)));

  const stats = list
    ? [
        { l: 'Réservations', v: String(list.length) },
        { l: 'À traiter', v: String(list.filter((b) => b.status === 'Nouveau').length) },
        { l: 'Volume total', v: fmtVol(Math.round(list.reduce((s, b) => s + b.volume, 0) * 10) / 10) },
        { l: 'CA prévisionnel', v: fmtEur(list.reduce((s, b) => s + b.total, 0)) },
      ]
    : [];

  return (
    <section className="min-h-screen bg-kraft pb-24 pt-28 md:pt-36">
      <Container>
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <Label>Espace équipe · démonstration</Label>
            <h1 className="mt-4 font-display text-h1">Réservations particuliers</h1>
            <p className="mt-3 max-w-xl text-[15.5px] text-navy/65">Les réservations faites dans le simulateur sont stockées dans ce navigateur. Changez leur statut, puis générez le rapport de tri.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => update([demoBooking(), ...(list ?? [])])} className="inline-flex h-11 items-center gap-2 rounded-btn bg-white px-4 text-[14.5px] font-semibold ring-1 ring-line hover:ring-navy/40">
              <Plus className="h-4 w-4" /> Exemple
            </button>
            {list && list.length > 0 && (
              <button
                onClick={() => {
                  if (confirm('Supprimer toutes les réservations de démonstration ?')) update([]);
                }}
                className="inline-flex h-11 items-center gap-2 rounded-btn px-4 text-[14.5px] font-semibold text-navy/70 hover:bg-white"
              >
                <Trash2 className="h-4 w-4" /> Vider
              </button>
            )}
          </div>
        </div>

        {list && (
          <div className="mt-10 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {stats.map((s) => (
              <div key={s.l} className="rounded-[22px] bg-white p-5 ring-1 ring-line">
                <p className="font-mono text-label uppercase text-beton-600">{s.l}</p>
                <p className="mt-2 font-display text-[30px] leading-none tight">{s.v}</p>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6">
          {list === null ? null : list.length === 0 ? (
            <div className="grid place-items-center rounded-[28px] bg-white px-6 py-20 text-center ring-1 ring-line">
              <Inbox className="h-10 w-10 text-beton" />
              <p className="mt-4 font-display text-h3">Aucune réservation pour l’instant</p>
              <p className="mt-2 max-w-sm text-[15px] text-navy/70">Faites une estimation dans le simulateur et réservez : elle apparaîtra ici.</p>
              <Link href="/simulateur" className="mt-6 inline-flex h-12 items-center rounded-btn bg-signal px-5 font-semibold shadow-signal">
                Ouvrir le simulateur
              </Link>
            </div>
          ) : (
            <ul className="space-y-3">
              <AnimatePresence initial={false}>
                {list.map((b) => (
                  <motion.li key={b.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-[22px] bg-white p-5 ring-1 ring-line">
                    <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr_auto] lg:items-center">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-[13px] font-semibold">{b.id}</span>
                          <span className="text-[12.5px] text-navy/70">{new Date(b.createdAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}</span>
                        </div>
                        <p className="mt-1 truncate text-[17px] font-semibold">{b.name}</p>
                        <p className="truncate text-[14px] text-navy/70">
                          {b.address} · {b.phone}
                        </p>
                      </div>
                      <div className="text-[14px]">
                        <p className="font-semibold">
                          {b.formulaName} · {fmtEur(b.total)} TTC
                        </p>
                        <p className="text-navy/70">
                          {fmtVol(b.volume)} · {b.slot}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <label className="sr-only" htmlFor={`s-${b.id}`}>
                          Statut
                        </label>
                        <select
                          id={`s-${b.id}`}
                          value={b.status}
                          onChange={(e) => setStatus(b.id, e.target.value as BookingStatus)}
                          className={cn('h-10 rounded-full px-3 text-[13.5px] font-semibold outline-none ring-1', STATUS_STYLE[b.status])}
                        >
                          {STATUSES.map((s) => (
                            <option key={s}>{s}</option>
                          ))}
                        </select>
                        <Link href={`/espace/rapport/${b.id}`} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-kraft px-4 text-[13.5px] font-semibold hover:bg-line">
                          <FileText className="h-4 w-4" /> Générer le rapport de tri
                        </Link>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center gap-1" aria-hidden>
                      {STATUSES.map((s, i) => (
                        <div key={s} className={cn('h-1.5 flex-1 rounded-full', i <= STATUSES.indexOf(b.status) ? 'bg-tri' : 'bg-kraft')} />
                      ))}
                    </div>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}
        </div>
        <p className="mt-8 flex items-center gap-2 text-[13px] text-navy/70">
          <ClipboardList className="h-4 w-4" /> Démonstration : données stockées uniquement dans ce navigateur (localStorage).
        </p>
        <ProQueue />
      </Container>
    </section>
  );
}
