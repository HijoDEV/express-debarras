import type { Metadata } from 'next';
import { HandHeart, Recycle, Store, Trash2, Wrench, Shirt, Refrigerator } from 'lucide-react';
import { PageHero } from '@/components/pages/PageHero';
import { SortReport } from '@/components/home/SortReport';
import { FinalCta } from '@/components/home/FinalCta';
import { Container, Section } from '@/components/ui/Section';
import { Label } from '@/components/ui/Label';
import { Reveal } from '@/components/ui/Reveal';
import { FILIERES } from '@/lib/data';
import { cn } from '@/lib/cn';

export const metadata: Metadata = { title: 'Engagement tri', description: '60 % du volume valorisé : réemploi, revente, recyclage. Un rapport de tri à chaque débarras.' };

const DETAILS: Record<string, { icon: typeof Recycle; d: string }> = {
  Réemploi: { icon: HandHeart, d: 'Associations et ressourceries de la Métropole : ce qui est en bon état repart servir.' },
  Meubles: { icon: Wrench, d: 'Mobilier remis en état ou orienté vers la filière d’ameublement.' },
  Métaux: { icon: Recycle, d: 'Ferraille, vélos, cadres : rachetés et recyclés.' },
  Revente: { icon: Store, d: 'Objets de valeur rachetés : le montant est déduit de votre facture.' },
  Électroménager: { icon: Refrigerator, d: 'Filière agréée pour les appareils électriques et électroniques.' },
  'Textiles et livres': { icon: Shirt, d: 'Bornes textiles, boîtes à livres et bouquinistes.' },
  'Tout-venant': { icon: Trash2, d: 'Ce qui reste part en déchetterie professionnelle, en dernier recours.' },
};

export default function EngagementTriPage() {
  return (
    <>
      <PageHero label="Engagement tri" title="La déchetterie, en dernier recours." lead="Chaque débarras est trié sur place. Objectif : 60 % du volume valorisé, et un rapport de tri pour le prouver." />
      <Section tone="kraft">
        <Container>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {FILIERES.map((f, i) => {
              const D = DETAILS[f.name];
              const green = f.color === 'tri';
              return (
                <Reveal key={f.name} delay={i * 0.05}>
                  <div className="h-full rounded-[24px] bg-white p-6 ring-1 ring-line">
                    <div className="flex items-center justify-between">
                      <span className={cn('grid h-11 w-11 place-items-center rounded-xl', green ? 'bg-tri-soft text-tri' : 'bg-kraft text-beton-600')}>
                        <D.icon className="h-5 w-5" />
                      </span>
                      <span className="font-display text-[30px] tight">{f.pct} %</span>
                    </div>
                    <p className="mt-5 text-[18px] font-semibold">{f.name}</p>
                    <p className="mt-1.5 text-[14.5px] leading-relaxed text-navy/65">{D.d}</p>
                    <div className="mt-5 h-2 overflow-hidden rounded-full bg-kraft">
                      <div className={cn('h-full rounded-full', green ? 'bg-tri' : 'bg-beton')} style={{ width: `${(f.pct / 40) * 100}%` }} />
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </Container>
      </Section>
      <Section>
        <Container>
          <Reveal className="mx-auto mb-14 max-w-3xl text-center">
            <Label>Le rapport de tri</Label>
            <h2 className="mt-4 font-display text-h1">Vous savez où tout est parti.</h2>
          </Reveal>
          <SortReport />
        </Container>
      </Section>
      <FinalCta />
    </>
  );
}
