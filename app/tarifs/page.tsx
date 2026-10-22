import type { Metadata } from 'next';
import { PageHero } from '@/components/pages/PageHero';
import { Pricing } from '@/components/home/Pricing';
import { Guarantee } from '@/components/home/Guarantee';
import { FinalCta } from '@/components/home/FinalCta';
import { Container, Section } from '@/components/ui/Section';
import { Reveal } from '@/components/ui/Reveal';
import { Label } from '@/components/ui/Label';
import { ITEMS, OPTIONS, ROOMS } from '@/lib/data';
import { fmtVol } from '@/lib/pricing';

export const metadata: Metadata = { title: 'Tarifs', description: 'Forfaits au volume, Express Objet dès 49 €, options et packs. Prix fixes TTC à Rouen.' };

const OPTION_ROWS = [
  ['Étage sans ascenseur (dès le 2e)', `+ ${OPTIONS.floorFee} € / étage`],
  ['Portage de plus de 30 m', `+ ${OPTIONS.longCarry} €`],
  ['Au-delà de 30 km de Rouen', `+ ${OPTIONS.kmFee} € / km`],
  ['Urgence 24 h', `+ ${OPTIONS.urgencePct} % sur la formule`],
  ['Samedi', `+ ${OPTIONS.samediPct} % sur la formule`],
  ['Démontage', `${OPTIONS.dismantle} € / meuble`],
  ['Nettoyage', `${OPTIONS.cleaning} € / m²`],
];

export default function TarifsPage() {
  return (
    <>
      <PageHero label="Tarifs" title="Des prix fixes. Écrits à l’avance." lead="Un forfait selon le volume, des options claires, et un prix ferme dès que nous avons vu vos photos." center />
      <Section tone="kraft">
        <Container>
          <Pricing />
        </Container>
      </Section>
      <Section>
        <Container className="grid gap-10 lg:grid-cols-2">
          <Reveal>
            <Label>Options</Label>
            <h2 className="mt-4 font-display text-h2">Ce qui peut s’ajouter</h2>
            <dl className="mt-8 divide-y divide-line border-y border-line">
              {OPTION_ROWS.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 py-4 text-[15.5px]">
                  <dt className="text-navy/75">{k}</dt>
                  <dd className="font-semibold">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-[14px] text-navy/70">Majorations urgence et samedi calculées sur la formule de base, avant options. Prix arrondi à l’euro.</p>
          </Reveal>
          <Reveal delay={0.06}>
            <Label>Grille de volumes</Label>
            <h2 className="mt-4 font-display text-h2">Comment on compte</h2>
            <div className="mt-8 grid grid-cols-2 gap-x-6 text-[14.5px]">
              {ITEMS.filter((_, i) => i % 1 === 0).map((it) => (
                <div key={it.id} className="flex justify-between border-b border-line py-2.5">
                  <span className="text-navy/75">{it.name}</span>
                  <span className="font-mono">{fmtVol(it.volume)}</span>
                </div>
              ))}
            </div>
            <p className="mt-6 font-mono text-label uppercase text-beton-600">Pièces types</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {ROOMS.map((r) => (
                <span key={r.id} className="rounded-full bg-kraft px-3 py-1.5 text-[14px]">
                  {r.name} ≈ <strong>{fmtVol(r.volume)}</strong>
                </span>
              ))}
            </div>
          </Reveal>
        </Container>
      </Section>
      <Guarantee />
      <FinalCta />
    </>
  );
}
