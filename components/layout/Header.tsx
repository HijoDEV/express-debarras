'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Logo } from '@/components/brand/Logo';
import { ButtonLink } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

const LINKS = [
  { href: '/tarifs', label: 'Tarifs' },
  { href: '/#questions', label: 'Questions' },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [hover, setHover] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.documentElement.style.overflow = open ? 'hidden' : '';
  }, [open]);

  const pill = scrolled;

  return (
    <header className="no-print fixed inset-x-0 top-0 z-50">
      <a href="#contenu" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-btn focus:bg-signal focus:px-4 focus:py-3 focus:text-navy">
        Aller au contenu
      </a>
      <div
        className={cn(
          'mx-auto flex items-center justify-between transition-all duration-500 ease-[cubic-bezier(.22,1,.36,1)]',
          pill
            ? 'on-dark mt-3 h-16 max-w-[1080px] rounded-full bg-navy/95 px-3 pl-5 shadow-lift backdrop-blur-md w-[calc(100%-24px)]'
            : 'mt-0 h-20 max-w-[1240px] bg-white/80 px-4 backdrop-blur-md sm:px-6 md:bg-transparent md:backdrop-blur-0',
        )}
      >
        <Link href="/" className="rounded-lg">
          <Logo dark={pill} />
        </Link>

        <nav aria-label="Navigation principale" className="hidden items-center gap-2 md:flex" onMouseLeave={() => setHover(null)}>
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onMouseEnter={() => setHover(l.href)}
              onFocus={() => setHover(l.href)}
              className={cn('relative rounded-full px-4 py-2 text-[15px] font-semibold transition-colors', pill ? 'text-white' : 'text-navy')}
            >
              {hover === l.href && (
                <motion.span
                  layoutId="nav-pastille"
                  className={cn('absolute inset-0 -z-0 rounded-full', pill ? 'bg-white/10' : 'bg-navy/[0.06]')}
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
              <span className="relative">{l.label}</span>
            </Link>
          ))}
          <ButtonLink
            href="/pros"
            variant={pill ? 'outlineDark' : 'secondary'}
            size="sm"
            className="ml-2"
          >
            Espace pro
          </ButtonLink>
          <ButtonLink href="/#simulateur" size="sm" arrow>
            Estimer mon prix
          </ButtonLink>
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          <ButtonLink href="/#simulateur" size="sm" className="h-10 px-3.5 text-[14px]">
            Estimer
          </ButtonLink>
          <button
            onClick={() => setOpen(true)}
            aria-label="Ouvrir le menu"
            aria-expanded={open}
            className={cn('grid h-10 w-10 place-items-center rounded-full', pill ? 'text-white' : 'text-navy ring-1 ring-navy/15')}
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="on-dark fixed inset-0 z-[70] flex flex-col bg-navy px-5 pb-8 pt-5 text-white md:hidden"
          >
            <div className="flex items-center justify-between">
              <Logo dark />
              <button onClick={() => setOpen(false)} aria-label="Fermer le menu" className="grid h-11 w-11 place-items-center rounded-full ring-1 ring-white/25">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="mt-12 flex flex-col gap-1" aria-label="Menu mobile">
              {[
                { href: '/tarifs', label: 'Tarifs' },
                { href: '/#questions', label: 'Questions' },
                { href: '/situations/succession', label: 'Successions' },
                { href: '/engagement-tri', label: 'Engagement tri' },
                { href: '/a-propos', label: 'Qui sommes-nous' },
                { href: '/contact', label: 'Contact' },
                { href: '/pros', label: 'Espace pro' },
              ].map((l, i) => (
                <motion.div key={l.href} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 * i }}>
                  <Link href={l.href} onClick={() => setOpen(false)} className="block py-2 font-display text-[34px] tight">
                    {l.label}
                  </Link>
                </motion.div>
              ))}
            </nav>
            <ButtonLink href="/#simulateur" arrow className="mt-auto w-full" onClick={() => setOpen(false)}>
              Estimer mon prix
            </ButtonLink>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
