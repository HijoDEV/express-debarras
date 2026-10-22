import { Container, Section } from '@/components/ui/Section';
import { Label } from '@/components/ui/Label';
import { Reveal } from '@/components/ui/Reveal';
import { BeforeAfter } from './BeforeAfter';
import { Timeline } from './Timeline';

const CASES = [
  { title: 'Cave · Rouen', items: ['box', 'bike', 'box', 'lamp', 'bag', 'box'] as const, from: 'linear-gradient(135deg,#B7AC94,#7D725F)', to: 'linear-gradient(135deg,#F5F2EA,#E7E1D3)' },
  { title: 'Séjour · Sotteville', items: ['sofa', 'tv', 'armchair', 'shelf', 'box', 'lamp'] as const, from: 'linear-gradient(135deg,#C7B9A3,#8E7E66)', to: 'linear-gradient(135deg,#FFFFFF,#F1EEE6)' },
  { title: 'Garage · Darnétal', items: ['bike', 'washer', 'box', 'box', 'stove', 'bag'] as const, from: 'linear-gradient(135deg,#9FADB8,#66757F)', to: 'linear-gradient(135deg,#EEF2F4,#DDE4E8)' },
  { title: 'Chambre · Bihorel', items: ['bed', 'wardrobe', 'dresser', 'mattress', 'box', 'lamp'] as const, from: 'linear-gradient(135deg,#C9B39B,#8F7860)', to: 'linear-gradient(135deg,#FBF8F2,#EFE8DC)' },
];

export function ValueSection() {
  return (
    <Section>
      <Container>
        <Reveal className="max-w-4xl">
          <Label>Notre méthode</Label>
          <h2 className="mt-4 font-display text-h1 text-navy">
            On ne vous vend pas un camion.
            <br />
            <span className="text-beton-600">On vous rend votre espace.</span>
          </h2>
        </Reveal>
        <div className="mt-12 grid items-start gap-6 lg:mt-16 lg:grid-cols-2">
          <Reveal>
            <div className="grid grid-cols-2 gap-3">
              {CASES.map((c) => (
                <BeforeAfter key={c.title} title={c.title} items={[...c.items]} from={c.from} to={c.to} />
              ))}
            </div>
            <p className="mt-3 text-[13px] text-navy/70">Glissez le curseur. Visuels d’illustration, remplacés par nos photos de chantier.</p>
          </Reveal>
          <Reveal delay={0.08}>
            <Timeline />
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}
