import { PageHero } from './PageHero';
import { Container, Section } from '@/components/ui/Section';

export function LegalPage({ label, title, sections }: { label: string; title: string; sections: { id?: string; h: string; p: React.ReactNode[] }[] }) {
  return (
    <>
      <PageHero label={label} title={title} lead="Texte modèle de démonstration. Les champs entre crochets seront complétés à l’immatriculation." stripe={false} />
      <Section className="pt-0 md:pt-0">
        <Container className="max-w-3xl">
          <div className="space-y-10">
            {sections.map((s) => (
              <section key={s.h} id={s.id}>
                <h2 className="font-display text-[24px] tracking-[-0.02em]">{s.h}</h2>
                <div className="mt-3 space-y-3 text-[15.5px] leading-relaxed text-navy/75">
                  {s.p.map((x, i) => (
                    <p key={i}>{x}</p>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </Container>
      </Section>
    </>
  );
}

export const Field = ({ children }: { children: React.ReactNode }) => <mark className="rounded bg-signal-soft px-1 font-mono text-[14px] text-navy">{children}</mark>;
