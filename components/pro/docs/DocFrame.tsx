'use client';
import { ArrowLeft, Printer } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/brand/Logo';
import { BRAND } from '@/lib/data';
import { Btn } from '../ui';

/** Page document A4 imprimable (devis, facture, rapport, bordereau). */
export function DocFrame({ kind, number, date, children, actions, aside }: { kind: string; number: string; date: string; children: React.ReactNode; actions?: React.ReactNode; aside?: React.ReactNode }) {
  const router = useRouter();
  return (
    <div>
      <div className="pro-chrome mb-4 flex flex-wrap items-center justify-between gap-2">
        <Btn variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" /> Retour
        </Btn>
        <div className="flex flex-wrap gap-2">
          {actions}
          <Btn onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> Imprimer / PDF
          </Btn>
        </div>
      </div>
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,820px)_1fr]">
        <article className="pro-print-page mx-auto w-full max-w-[820px] rounded-[14px] border border-p-line bg-white p-6 text-navy shadow-xl sm:p-12 print:p-0" style={{ colorScheme: 'light' }}>
          <header className="flex flex-wrap items-start justify-between gap-6 border-b-2 border-navy pb-6">
            <div>
              <Logo />
              <p className="mt-3 text-[11.5px] leading-relaxed text-[#56646E]">
                Express Débarras · SAS [capital] € · SIRET [SIRET]
                <br />
                [adresse], 76000 Rouen · {BRAND.email}
              </p>
            </div>
            <div className="text-right">
              <p className="font-mono text-[12px] font-bold uppercase tracking-[0.14em]">{kind}</p>
              <p className="mt-1 font-mono text-[15px] font-semibold">{number}</p>
              <p className="text-[12.5px] text-[#56646E]">{date}</p>
            </div>
          </header>
          <div className="mt-6">{children}</div>
          <footer className="mt-10 flex flex-wrap justify-between gap-2 border-t border-[#E6E8EB] pt-4 text-[11px] text-[#56646E]">
            <span>Document de démonstration · Projet BTS NDRC</span>
            <span>Express Débarras · TVA [TVA]</span>
          </footer>
        </article>
        {aside && <aside className="pro-chrome space-y-4 xl:sticky xl:top-24">{aside}</aside>}
      </div>
    </div>
  );
}

export function LinesTable({ lines, ht, tva, ttc }: { lines: { label: string; qty: number; unit: number; total: number; kind: string }[]; ht: number; tva: number; ttc: number }) {
  const e = (c: number) => (c / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
  return (
    <div>
      <table className="w-full text-[13.5px]">
        <thead>
          <tr className="border-b border-navy text-left font-mono text-[10.5px] uppercase tracking-[0.12em] text-[#56646E]">
            <th className="py-2 font-medium">Désignation</th>
            <th className="py-2 text-right font-medium">Qté</th>
            <th className="hidden py-2 text-right font-medium sm:table-cell">PU HT</th>
            <th className="py-2 text-right font-medium">Total HT</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((l) => (
            <tr key={l.label} className="border-b border-[#E6E8EB]">
              <td className={`py-2.5 pr-2 ${l.kind === 'deduction' ? 'text-tri-dark' : ''}`}>{l.label}</td>
              <td className="py-2.5 text-right font-mono">{l.qty.toLocaleString('fr-FR')}</td>
              <td className="hidden py-2.5 text-right font-mono sm:table-cell">{e(l.unit)}</td>
              <td className="py-2.5 text-right font-mono">{e(l.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="ml-auto mt-4 w-full max-w-[280px] space-y-1.5 font-mono text-[13.5px]">
        <div className="flex justify-between">
          <span className="text-[#56646E]">Total HT</span>
          <span>{e(ht)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#56646E]">TVA 20 %</span>
          <span>{e(tva)}</span>
        </div>
        <div className="flex justify-between border-t-2 border-navy pt-2 text-[16px] font-bold">
          <span>Total TTC</span>
          <span>{e(ttc)}</span>
        </div>
      </div>
    </div>
  );
}
