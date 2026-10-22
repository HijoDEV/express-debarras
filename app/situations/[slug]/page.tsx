import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Check } from 'lucide-react';
import Link from 'next/link';
import { SITUATION_PAGES } from '@/lib/data';
import { PageHero } from '@/components/pages/PageHero';
import { OpenSimButton } from '@/components/pages/OpenSimButton';
import { Accordion } from '@/components/ui/Accordion';
import { Container, Section } from '@/components/ui/Section';
import { Label } from '@/components/ui/Label';
import { Reveal } from '@/components/ui/Reveal';
import { FinalCta } from '@/components/home/FinalCta';
import { Timeline } from '@/components/home/Timeline';

export function generateStaticParams() {
  return Object.keys(SITUATION_PAGES).map((slug) => ({ slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const p = SITUATION_PAGES[params.slug];
  return p ? { title: p.label, description: p.lead } : {};
}

export default function SituationPage({ params }: { params: { slug: string } }) {
  const p = SITUATION_PAGES[params.slug];
  if (!p) notFound();
  return (
    <>
      <PageHero label={p.label} title={p.title} lead={p.lead}>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
          <OpenSimButton situation={p.situation} items={p.prefill?.items} rooms={p.prefill?.rooms} pack={p.prefill?.pack} label="Estimer avec ce cas" />
          <p className="text-[13.5px] text-navy/70">Gratuit · sans engagement · réponse en 1 h</p>
        </div>
      </PageHero>

      <Section tone="kraft">
        <Container className="grid items-start gap-8 lg:grid-cols-2">
          <Reveal>
            <div className="on-dark rounded-[28px] bg-navy p-8 text-white shadow-lift sm:p-10">
              <Label dark>Notre solution</Label>
              <p className="mt-4 font-display text-[34px] leading-[1] tracking-[-0.03em]">{p.formula}</p>
              <p className="mt-6 font-display text-[52px] leading-none tight text-signal">{p.price}</p>
              <ul className="mt-8 space-y-3 border-t border-white/10 pt-6 text-[15.5px]">
                {p.points.map((x) => (
                  <li key={x} className="flex gap-3">
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-tri">
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                    {x}
                  </li>
                ))}
              </ul>
              {p.slug === 'local-pro' && (
                <Link href="/pros" className="mt-8 inline-block font-semibold text-signal underline underline-offset-4">
                  Voir les offres pros
                </Link>
              )}
            </div>
          </Reveal>
          <Reveal delay={0.06}>
            <Timeline />
          </Reveal>
        </Container>
      </Section>

      <Section>
        <Container className="grid gap-10 lg:grid-cols-[1fr_1.6fr]">
          <div>
            <Label>Questions</Label>
            <h2 className="mt-4 font-display text-h2">Ce que vous vous demandez</h2>
          </div>
          <Accordion items={p.faq} />
        </Container>
      </Section>
      <FinalCta title={[p.title, 'On s’occupe du reste.']} href="/simulateur" />
    </>
  );
}
