import Link from 'next/link';
import { Logo } from '@/components/brand/Logo';
import { BRAND } from '@/lib/data';
import { HazardStripe } from '@/components/ui/HazardStripe';

const COLS = [
  {
    title: 'Aide',
    links: [
      { href: '/#simulateur', label: 'Estimer mon prix' },
      { href: '/tarifs', label: 'Tarifs' },
      { href: '/#questions', label: 'Questions fréquentes' },
      { href: '/contact', label: 'Contact' },
    ],
  },
  {
    title: 'Entreprise',
    links: [
      { href: '/a-propos', label: 'Qui sommes-nous' },
      { href: '/engagement-tri', label: 'Engagement tri' },
      { href: '/pros', label: 'Espace pro' },
      { href: '/situations/succession', label: 'Successions' },
      { href: '/espace', label: 'Espace équipe (démo)' },
    ],
  },
  {
    title: 'Légal',
    links: [
      { href: '/mentions-legales', label: 'Mentions légales' },
      { href: '/cgv', label: 'Conditions générales' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="no-print relative overflow-hidden bg-white">
      <HazardStripe className="h-2 opacity-90" />
      <div className="mx-auto grid max-w-[1200px] gap-12 px-4 pt-16 sm:px-6 md:grid-cols-[1.3fr_2fr] md:pt-20">
        <div>
          <Logo />
          <p className="mt-5 max-w-xs text-[15px] leading-relaxed text-navy/70">
            {BRAND.slogan} Débarras sur photos, prix fixe en 1 h, intervention sous {'48\u00a0h'} à {BRAND.city}.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
          {COLS.map((c) => (
            <div key={c.title}>
              <p className="font-mono text-label uppercase text-signal-dark">{c.title}</p>
              <ul className="mt-5 space-y-3">
                {c.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-[15px] text-navy/80 transition-colors hover:text-navy hover:underline hover:underline-offset-4">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div aria-hidden className="pointer-events-none relative mt-12 select-none overflow-hidden">
        <div
          data-w="EXPRESS"
          className="text-center font-display leading-[0.8] tracking-[-0.06em] text-[#EDEFF1] before:content-[attr(data-w)]"
          style={{
            fontSize: 'clamp(4rem, 18.5vw, 24rem)',
            WebkitMaskImage: 'linear-gradient(180deg, #000 30%, transparent 95%)',
            maskImage: 'linear-gradient(180deg, #000 30%, transparent 95%)',
          }}
        />
      </div>

      <div className="mx-auto flex max-w-[1200px] flex-col gap-2 border-t border-line px-4 py-6 text-[13px] text-navy/70 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>© 2026 Express Débarras</p>
        <p>Projet de création d’entreprise réalisé dans le cadre du BTS NDRC</p>
      </div>
    </footer>
  );
}
