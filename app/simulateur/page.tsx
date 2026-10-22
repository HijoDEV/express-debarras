import type { Metadata } from 'next';
import { Simulator } from '@/components/simulator/Simulator';
import { Container } from '@/components/ui/Section';
import { Label } from '@/components/ui/Label';

export const metadata: Metadata = { title: 'Simulateur de prix', description: 'Estimez le prix de votre débarras à Rouen en 2 minutes.' };

export default function SimulateurPage() {
  return (
    <section className="min-h-screen bg-kraft pb-24 pt-24 md:pt-28">
      <Container className="max-w-[1360px]">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
          <div>
            <Label>Simulateur · 2 minutes</Label>
            <h1 className="mt-3 font-display text-h2 text-navy">Votre prix, tout de suite.</h1>
          </div>
          <p className="max-w-md text-[15px] text-navy/70">Ajoutez vos objets : le camion se charge et le prix se calcule en direct.</p>
        </div>
        <div className="mt-6">
          <Simulator fullPage />
        </div>
      </Container>
    </section>
  );
}
