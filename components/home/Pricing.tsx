'use client';
import { motion } from 'framer-motion';
import { Check, Package } from 'lucide-react';
import { useState } from 'react';
import { ButtonLink } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import { EXPRESS_OBJET, FORFAITS, PACKS, PRO_OFFERS } from '@/lib/data';
import { fmtEur } from '@/lib/pricing';

export function PricingToggle({ pro, setPro }: { pro: boolean; setPro: (v: boolean) => void }) {
  return (
    <div className="inline-flex rounded-full bg-white p-1 shadow-soft ring-1 ring-line" role="tablist" aria-label="Type de client">
      {[
        { v: false, l: 'Particulier · TTC' },
        { v: true, l: 'Pro · HT' },
      ].map((o) => (
        <button key={o.l} role="tab" aria-selected={pro === o.v} onClick={() => setPro(o.v)} className={cn('relative h-11 rounded-full px-5 text-[14.5px] font-semibold transition-colors', pro === o.v ? 'text-white' : 'text-navy/70')}>
          {pro === o.v && <motion.span layoutId="price-toggle" className="absolute inset-0 rounded-full bg-navy" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
          <span className="relative">{o.l}</span>
        </button>
      ))}
    </div>
  );
}

const ht = (ttc: number) => Math.round(ttc / 1.2);

export function Pricing({ showPacks = true }: { showPacks?: boolean }) {
  const [pro, setPro] = useState(false);
  return (
    <div>
      <div className="flex justify-center">
        <PricingToggle pro={pro} setPro={setPro} />
      </div>

      {!pro ? (
        <motion.div data-tour="pricing" key="part" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {/* Express Objet */}
          <div className="flex flex-col rounded-[24px] bg-signal-soft p-6 ring-1 ring-signal/50 transition duration-300 hover:-translate-y-1 hover:shadow-lift">
            <p className="font-mono text-label uppercase text-signal-dark">1 à 5 objets</p>
            <p className="mt-3 min-h-[2.1em] font-display text-[22px] leading-[1.05] tracking-[-0.02em]">Express Objet</p>
            <p className="mt-4 font-display text-[40px] leading-none tight">{EXPRESS_OBJET.firstTournee} €</p>
            <p className="mt-1 text-[13px] text-navy/70">1er objet en tournée</p>
            <ul className="mt-5 space-y-2 text-[14px]">
              <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-tri" /> {EXPRESS_OBJET.first48h} € sous 48 h</li>
              <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-tri" /> + {EXPRESS_OBJET.extra} € par objet en plus</li>
              <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-tri" /> Jusqu’à 3 m³</li>
            </ul>
          </div>
          {FORFAITS.map((f) => {
            const dark = 'popular' in f && f.popular;
            return (
              <div key={f.id} className={cn('relative flex flex-col rounded-[24px] p-6 transition duration-300 hover:-translate-y-1 hover:shadow-lift', dark ? 'on-dark bg-navy text-white shadow-lift' : 'bg-white ring-1 ring-line')}>
                {dark && <span className="absolute -top-3 left-6 rounded-full bg-signal px-3 py-1 text-[12px] font-semibold text-navy">Le plus demandé</span>}
                <p className={cn('font-mono text-label uppercase', dark ? 'text-signal' : 'text-beton-600')}>Jusqu’à {f.maxVolume} m³</p>
                <p className="mt-3 min-h-[2.1em] font-display text-[22px] leading-[1.05] tracking-[-0.02em]">{f.name}</p>
                <p className={cn('mt-4 font-display text-[40px] leading-none tight', dark && 'text-signal')}>{fmtEur(f.price)}</p>
                <p className={cn('mt-1 text-[13px]', dark ? 'text-white/60' : 'text-navy/70')}>TTC · prix fixe</p>
                <p className={cn('mt-5 text-[14px]', dark ? 'text-white/80' : 'text-navy/75')}>{f.example}</p>
              </div>
            );
          })}
          <p className="text-[13.5px] text-navy/70 sm:col-span-2 lg:col-span-5">
            Au-delà de 40 m³ : 36 € / m³ (jamais moins que le forfait Maison). Majorations : urgence 24 h + 20 %, samedi + 15 %. Étage sans ascenseur dès le 2e : + 15 € / étage.
          </p>
        </motion.div>
      ) : (
        <motion.div data-tour="pricing" key="pro" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PRO_OFFERS.map((o) => {
            const dark = 'popular' in o && o.popular;
            return (
              <div key={o.id} className={cn('relative flex flex-col rounded-[24px] p-6 transition duration-300 hover:-translate-y-1 hover:shadow-lift', dark ? 'on-dark bg-navy text-white shadow-lift' : 'bg-white ring-1 ring-line')}>
                {dark && <span className="absolute -top-3 left-6 rounded-full bg-signal px-3 py-1 text-[12px] font-semibold text-navy">Le plus choisi</span>}
                <p className="font-display text-[22px] tracking-[-0.02em]">{o.name}</p>
                <p className={cn('mt-4 font-display text-[34px] leading-none tight', dark && 'text-signal')}>{o.price}</p>
                <p className={cn('mt-1 text-[13px]', dark ? 'text-white/60' : 'text-navy/70')}>HT · {o.detail}</p>
                <ul className="mt-5 space-y-2 text-[14px]">
                  {o.features.map((x) => (
                    <li key={x} className="flex gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-tri" /> {x}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
          <div className="flex flex-col items-start justify-between gap-4 rounded-[24px] bg-kraft p-6 sm:col-span-2 sm:flex-row sm:items-center lg:col-span-4">
            <p className="text-[14.5px] text-navy/75">
              Forfaits particuliers en HT : Mini {fmtEur(ht(149))} · Pièce {fmtEur(ht(349))} · Logement {fmtEur(ht(790))} · Maison {fmtEur(ht(1490))}.
            </p>
            <ButtonLink href="/pros" variant="dark" size="sm" arrow>
              Demander un contrat
            </ButtonLink>
          </div>
        </motion.div>
      )}

      {showPacks && (
        <div className="mt-16">
          <h2 className="text-center font-display text-h2 text-navy">Trois packs. Un seul interlocuteur.</h2>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {PACKS.map((p) => (
              <div key={p.id} className={cn('relative flex flex-col rounded-[24px] p-7 transition duration-300 hover:-translate-y-1 hover:shadow-lift', p.id === 'cles' ? 'bg-white shadow-soft ring-2 ring-navy' : 'bg-white ring-1 ring-line')}>
                {p.badge && <span className="absolute -top-3 left-7 rounded-full bg-tri-dark px-3 py-1 text-[12px] font-semibold text-white">{p.badge}</span>}
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-kraft">
                  <Package className="h-5 w-5" />
                </span>
                <p className="mt-5 font-display text-[24px] tracking-[-0.02em]">{p.name}</p>
                <p className="text-[14px] text-navy/70">{p.tagline}</p>
                <p className="mt-4 font-display text-[34px] leading-none tight">{p.price ? `+ ${fmtEur(pro ? ht(p.price) : p.price)}` : 'Inclus'}</p>
                {p.price > 0 && <p className="mt-1 text-[12.5px] text-navy/70">{pro ? 'HT' : 'TTC'}</p>}
                <ul className="mt-6 space-y-2.5 text-[14.5px]">
                  {p.features.map((x) => (
                    <li key={x} className="flex gap-2.5">
                      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-tri text-white">
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </span>
                      {x}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
