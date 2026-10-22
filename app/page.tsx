import { Hero } from '@/components/home/Hero';
import { StampMarquee } from '@/components/home/StampMarquee';
import { ValueSection } from '@/components/home/ValueSection';
import { SituationPicker } from '@/components/home/SituationPicker';
import { SimulatorSection } from '@/components/home/SimulatorSection';
import { SortReport } from '@/components/home/SortReport';
import { Pricing } from '@/components/home/Pricing';
import { Reviews } from '@/components/home/Reviews';
import { Guarantee } from '@/components/home/Guarantee';
import { FinalCta } from '@/components/home/FinalCta';
import { Accordion } from '@/components/ui/Accordion';
import { Container, Section } from '@/components/ui/Section';
import { Label } from '@/components/ui/Label';
import { Reveal } from '@/components/ui/Reveal';
import { FAQ } from '@/lib/data';

export default function Home() {
  return (
    <>
      <Hero />
      <StampMarquee />
      <ValueSection />

      <Section tone="kraft">
        <Container>
          <Reveal className="mb-12 max-w-3xl">
            <Label>Votre situation</Label>
            <h2 className="mt-4 font-display text-h1 text-navy">Votre solution, choisie pour vous.</h2>
          </Reveal>
          <SituationPicker />
        </Container>
      </Section>

      <SimulatorSection />

      <Section>
        <Container>
          <Reveal className="mx-auto mb-14 max-w-3xl text-center">
            <Label>Engagement tri</Label>
            <h2 className="mt-4 font-display text-h1 text-navy">Chaque objet trouve sa filière.</h2>
            <p className="mx-auto mt-5 max-w-xl text-body-lg text-navy/70">Réemploi, revente, recyclage : vous recevez un rapport de tri à chaque débarras. La déchetterie, c’est en dernier recours.</p>
          </Reveal>
          <SortReport />
        </Container>
      </Section>

      <Section id="tarifs" tone="kraft">
        <Container>
          <Reveal className="mx-auto mb-10 max-w-3xl text-center">
            <Label>Tarifs</Label>
            <h2 className="mt-4 font-display text-h1 text-navy">Des prix fixes. Écrits à l’avance.</h2>
          </Reveal>
          <Pricing />
        </Container>
      </Section>

      <Section className="overflow-hidden">
        <Container>
          <Reveal className="mx-auto mb-12 max-w-3xl text-center">
            <Label>Avis clients</Label>
            <h2 className="mt-4 font-display text-h1 text-navy">Vos avis, bientôt ici.</h2>
          </Reveal>
        </Container>
        <Reviews />
        <Container>
          <p className="mt-8 text-center text-[13.5px] font-medium text-navy/70">
            Exemples d’avis à titre de démonstration, remplacés par les avis Google réels au lancement.
          </p>
        </Container>
      </Section>

      <Guarantee />

      <Section id="questions">
        <Container className="grid gap-10 lg:grid-cols-[1fr_1.6fr] lg:gap-16">
          <Reveal>
            <Label>Questions</Label>
            <h2 className="mt-4 font-display text-h1 text-navy">Les questions qu’on nous pose souvent</h2>
          </Reveal>
          <Reveal delay={0.06}>
            <Accordion items={FAQ} />
          </Reveal>
        </Container>
      </Section>

      <FinalCta />
    </>
  );
}
