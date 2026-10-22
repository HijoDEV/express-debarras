import type { Metadata } from 'next';
import { PageHero } from '@/components/pages/PageHero';
import { Avatar } from '@/components/illus/Avatar';
import { Container, Section } from '@/components/ui/Section';
import { Label } from '@/components/ui/Label';
import { Reveal } from '@/components/ui/Reveal';
import { FinalCta } from '@/components/home/FinalCta';
import { TEAM, PROMISES } from '@/lib/data';
import { Check } from 'lucide-react';

export const metadata: Metadata = { title: 'Qui sommes-nous', description: 'Max et Noa, fondateurs d’Express Débarras à Rouen.' };

export default function AProposPage() {
  return (
    <>
      <PageHero
        label="Qui sommes-nous"
        title={
          <>
            Deux Rouennais,
            <br />
            <span className="text-beton-600">un camion, une méthode.</span>
          </>
        }
        lead="Nous avons créé Express Débarras parce que vider un logement ne devrait pas coûter une semaine de congés ni trois allers-retours à la déchetterie."
      />
      <Section tone="kraft">
        <Container className="grid gap-6 md:grid-cols-2">
          {TEAM.map((m, i) => (
            <Reveal key={m.name} delay={i * 0.08}>
              <article className="flex h-full flex-col gap-6 rounded-[28px] bg-white p-7 shadow-soft ring-1 ring-line sm:flex-row sm:p-8">
                <Avatar variant={i === 0 ? 'max' : 'noa'} className="h-32 w-32 shrink-0" />
                <div>
                  <p className="font-mono text-label uppercase text-signal-dark">{m.role}</p>
                  <h2 className="mt-2 font-display text-h2">{m.name}</h2>
                  <p className="mt-1 text-[15px] font-semibold text-navy/70">{m.focus}</p>
                  <p className="mt-4 text-[15.5px] leading-relaxed text-navy/75">{m.text}</p>
                </div>
              </article>
            </Reveal>
          ))}
        </Container>
      </Section>
      <Section>
        <Container className="grid gap-10 lg:grid-cols-2">
          <Reveal>
            <Label>Nos engagements</Label>
            <h2 className="mt-4 font-display text-h2">Ce que nous promettons, à chaque chantier</h2>
          </Reveal>
          <Reveal delay={0.06}>
            <ul className="space-y-4">
              {PROMISES.map((p) => (
                <li key={p} className="flex items-center gap-4 rounded-2xl bg-kraft p-4 text-[16px] font-semibold">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-tri text-white">
                    <Check className="h-4 w-4" strokeWidth={3} />
                  </span>
                  {p}
                </li>
              ))}
            </ul>
          </Reveal>
        </Container>
      </Section>
      <FinalCta />
    </>
  );
}
