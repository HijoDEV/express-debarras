import { ButtonLink } from '@/components/ui/Button';
import { LogoTile } from '@/components/brand/Logo';

export default function NotFound() {
  return (
    <section className="grid min-h-[80vh] place-items-center px-4 pt-24 text-center">
      <div>
        <LogoTile className="mx-auto h-16 w-16" />
        <h1 className="mt-8 font-display text-h1">Cette page est déjà débarrassée.</h1>
        <p className="mt-4 text-body-lg text-navy/70">Elle n’existe pas, ou plus.</p>
        <ButtonLink href="/" arrow className="mt-8">
          Retour à l’accueil
        </ButtonLink>
      </div>
    </section>
  );
}
