import { Simulator } from '@/components/simulator/Simulator';
import { Container, Section } from '@/components/ui/Section';
import { Label } from '@/components/ui/Label';
import { Reveal } from '@/components/ui/Reveal';

export function SimulatorSection() {
  return (
    <Section id="simulateur">
      <Container className="max-w-[1360px]">
        <Reveal className="mb-8 max-w-2xl md:mb-10">
          <Label>Simulateur · 2 minutes</Label>
          <h2 className="mt-4 font-display text-h1 text-navy">Votre prix, tout de suite.</h2>
          <p className="mt-4 text-body-lg text-navy/70">Ajoutez vos objets : le camion se charge et le prix se calcule en direct. Il devient ferme dès que nous avons vu vos photos.</p>
        </Reveal>
        <Simulator />
      </Container>
    </Section>
  );
}
