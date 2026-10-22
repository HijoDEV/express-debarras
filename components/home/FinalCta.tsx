import { ButtonLink } from '@/components/ui/Button';
import { Container } from '@/components/ui/Section';
import { Reveal } from '@/components/ui/Reveal';
import { LogoTile } from '@/components/brand/Logo';

export function FinalCta({ title = ['Votre cave vous attend.', 'Vous n’avez rien à porter.'], href = '/#simulateur' }: { title?: [string, string]; href?: string }) {
  return (
    <section className="relative overflow-hidden bg-kraft py-24 md:py-36">
      <Container className="text-center">
        <Reveal>
          <LogoTile className="mx-auto h-16 w-16" />
          <h2 className="mt-8 font-display text-h1 text-navy">
            {title[0]}
            <br />
            <span className="text-beton-600">{title[1]}</span>
          </h2>
          <div className="mt-10 flex flex-col items-center gap-3">
            <ButtonLink href={href} arrow className="px-8">
              Estimer mon prix
            </ButtonLink>
            <p className="text-[13.5px] text-navy/70">Gratuit · réponse en 1 h</p>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
