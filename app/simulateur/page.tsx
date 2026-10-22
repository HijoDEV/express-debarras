import type { Metadata } from 'next';
import { Simulator } from '@/components/simulator/Simulator';
import { Container } from '@/components/ui/Section';
import { Label } from '@/components/ui/Label';

export const metadata: Metadata = { title: 'Simulateur de prix', description: 'Estimez le prix de votre débarras à Rouen en 2 minutes.' };

export default function SimulateurPage() {
  return (
    <section className="min-h-screen bg-kraft pb-24 pt-28 md:pt-36">
      <Container>
        <Label>Simulateur · 2 minutes</Label>
        <h1 className="mt-4 font-display text-h1 text-navy">Votre prix, tout de suite.</h1>
        <p className="mt-4 max-w-2xl text-body-lg text-navy/70">Prix détaillé ligne par ligne, ferme après validation de vos photos.</p>
        <div className="mt-10">
          <Simulator fullPage />
        </div>
      </Container>
    </section>
  );
}
