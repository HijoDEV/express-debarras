import { Simulator } from '@/components/simulator/Simulator';
import { Container, Section } from '@/components/ui/Section';
import { Label } from '@/components/ui/Label';
import { Reveal } from '@/components/ui/Reveal';

export function SimulatorSection() {
  return (
    <Section id="simulateur">
      <Container>
        <Reveal className="mb-10 max-w-2xl md:mb-14">
          <Label>Simulateur · 2 minutes</Label>
          <h2 className="mt-4 font-display text-h1 text-navy">Votre prix, tout de suite.</h2>
          <p className="mt-4 text-body-lg text-navy/70">Cinq questions, un prix détaillé ligne par ligne. Il devient ferme dès que nous avons vu vos photos.</p>
        </Reveal>
        <Simulator />
      </Container>
    </Section>
  );
}
