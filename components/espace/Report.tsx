'use client';
import Link from 'next/link';
import { ArrowLeft, Printer } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Logo } from '@/components/brand/Logo';
import { FILIERES, ITEMS, ROOMS } from '@/lib/data';
import { fmtEur, fmtVol } from '@/lib/pricing';
import { getBookings, type Booking } from '@/lib/storage';

const R = 60;
const C = 2 * Math.PI * R;

export function Report({ id }: { id: string }) {
  const [b, setB] = useState<Booking | null | undefined>(undefined);
  useEffect(() => setB(getBookings().find((x) => x.id === id) ?? null), [id]);

  if (b === undefined) return <div className="min-h-screen" />;
  if (b === null)
    return (
      <section className="grid min-h-screen place-items-center px-4 pt-24 text-center">
        <div>
          <p className="font-display text-h2">Rapport introuvable</p>
          <p className="mt-3 text-navy/70">Cette réservation n’existe pas dans ce navigateur.</p>
          <Link href="/espace" className="mt-6 inline-flex h-12 items-center rounded-btn bg-navy px-5 font-semibold text-white">
            Retour à l’espace
          </Link>
        </div>
      </section>
    );

  const rows = FILIERES.map((f) => ({ ...f, vol: Math.round((b.volume * f.pct) / 10) / 10 }));
  const valorised = FILIERES.filter((f) => f.color === 'tri').reduce((s, f) => s + f.pct, 0);
  const content = [
    ...Object.entries(b.items).filter(([, n]) => n > 0).map(([id, n]) => `${n} × ${ITEMS.find((i) => i.id === id)?.name ?? id}`),
    ...Object.entries(b.rooms).filter(([, n]) => n > 0).map(([id, n]) => `${n} × ${ROOMS.find((r) => r.id === id)?.name ?? id}`),
  ];

  return (
    <section className="bg-kraft pb-20 pt-28 print:bg-white print:p-0">
      <div className="no-print mx-auto mb-6 flex max-w-[820px] items-center justify-between px-4">
        <Link href="/espace" className="inline-flex items-center gap-2 text-[15px] font-semibold">
          <ArrowLeft className="h-4 w-4" /> Espace équipe
        </Link>
        <button onClick={() => window.print()} className="inline-flex h-11 items-center gap-2 rounded-btn bg-signal px-5 font-semibold shadow-signal">
          <Printer className="h-4 w-4" /> Imprimer / PDF
        </button>
      </div>

      <article className="mx-auto max-w-[820px] bg-white p-8 shadow-lift ring-1 ring-line sm:rounded-[20px] sm:p-12 print:max-w-none print:shadow-none print:ring-0">
        <header className="flex flex-wrap items-start justify-between gap-6 border-b-2 border-navy pb-6">
          <Logo />
          <div className="text-right text-[13px] text-navy/70">
            <p className="font-mono text-[12px] font-semibold uppercase tracking-[0.12em] text-navy">Rapport de tri</p>
            <p>Réf. {b.id}</p>
            <p>Édité le {new Date().toLocaleDateString('fr-FR')}</p>
          </div>
        </header>

        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <div>
            <p className="font-mono text-label uppercase text-beton-600">Client</p>
            <p className="mt-2 text-[16px] font-semibold">{b.name}</p>
            <p className="text-[14px] text-navy/70">{b.address}</p>
            <p className="text-[14px] text-navy/70">
              {b.phone} · {b.email}
            </p>
          </div>
          <div>
            <p className="font-mono text-label uppercase text-beton-600">Intervention</p>
            <p className="mt-2 text-[16px] font-semibold">{b.formulaName}</p>
            <p className="text-[14px] text-navy/70">{b.slot}</p>
            <p className="text-[14px] text-navy/70">
              Volume : {fmtVol(b.volume)} · {b.photos} photo{b.photos > 1 ? 's' : ''} reçue{b.photos > 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="mt-10 grid items-center gap-8 rounded-[18px] bg-kraft p-6 sm:grid-cols-[auto_1fr] print:bg-[#F5F2EA]">
          <div className="relative mx-auto h-36 w-36">
            <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90" aria-hidden>
              <circle cx="70" cy="70" r={R} fill="none" stroke="#E6E3DA" strokeWidth="14" />
              <circle cx="70" cy="70" r={R} fill="none" stroke="#2F9E6E" strokeWidth="14" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - valorised / 100)} />
            </svg>
            <div className="absolute inset-0 grid place-content-center text-center">
              <p className="font-display text-[30px] leading-none tight">{valorised} %</p>
              <p className="text-[11px] text-navy/70">valorisé</p>
            </div>
          </div>
          <table className="w-full text-[14px]">
            <thead>
              <tr className="text-left font-mono text-[11px] uppercase tracking-[0.12em] text-navy/70">
                <th className="pb-2 font-medium">Filière</th>
                <th className="pb-2 text-right font-medium">Part</th>
                <th className="pb-2 text-right font-medium">Volume</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.name} className="border-t border-line">
                  <td className="py-2">
                    <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full align-middle" style={{ background: r.color === 'tri' ? '#2F9E6E' : '#8A9299' }} />
                    {r.name}
                  </td>
                  <td className="py-2 text-right font-mono">{r.pct} %</td>
                  <td className="py-2 text-right font-mono">{fmtVol(r.vol)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {content.length > 0 && (
          <div className="mt-8">
            <p className="font-mono text-label uppercase text-beton-600">Contenu déclaré</p>
            <p className="mt-2 text-[14.5px] text-navy/75">{content.join(' · ')}</p>
          </div>
        )}

        <div className="mt-8 grid grid-cols-2 gap-3">
          {['Avant', 'Après'].map((l) => (
            <div key={l} className="grid aspect-[4/3] place-items-center rounded-[14px] border-2 border-dashed border-line text-[13px] text-navy/70">
              Photo {l.toLowerCase()} · à joindre
            </div>
          ))}
        </div>

        <div className="mt-8 border-t border-line pt-6">
          <p className="font-mono text-label uppercase text-beton-600">Facturation</p>
          <ul className="mt-3 space-y-1.5 text-[14px]">
            {b.lines.map((l) => (
              <li key={l.label} className="flex justify-between gap-4">
                <span className="text-navy/75">{l.label}</span>
                <span className="font-mono">{fmtEur(l.amount, l.amount % 1 !== 0)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex justify-between border-t-2 border-navy pt-3 text-[16px] font-semibold">
            <span>Total TTC</span>
            <span>{fmtEur(b.total)}</span>
          </div>
          <p className="mt-1 text-right text-[13px] text-navy/70">Acompte versé (30 %) : {fmtEur(b.deposit)} · Solde : {fmtEur(b.total - b.deposit)}</p>
        </div>

        <footer className="mt-10 border-t border-line pt-4 text-[11.5px] text-navy/70">
          Répartition établie selon les objectifs de tri Express Débarras. Document de démonstration · Projet de création d’entreprise BTS NDRC.
        </footer>
      </article>
    </section>
  );
}
