'use client';
import { AnimatePresence, motion } from 'framer-motion';
import { Compass } from 'lucide-react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const SiteTour = dynamic(() => import('./SiteTour').then((m) => m.SiteTour), { ssr: false });

const KEY = 'ed:site-tour';
export const OPEN_SITE_TOUR = 'ed:open-site-tour';

const read = () => {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return '1';
  }
};
const write = () => {
  try {
    localStorage.setItem(KEY, '1');
  } catch {
    /* stockage indisponible */
  }
};

/** Lance la visite guidée du site : automatiquement à la première visite de l’accueil, ou à la demande. */
export function SiteTourLauncher() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState(true);

  useEffect(() => setSeen(!!read()), []);

  useEffect(() => {
    const h = () => setOpen(true);
    window.addEventListener(OPEN_SITE_TOUR, h);
    return () => window.removeEventListener(OPEN_SITE_TOUR, h);
  }, []);

  useEffect(() => {
    if (pathname !== '/' || read()) return;
    const t = setTimeout(() => setOpen(true), 2600);
    return () => clearTimeout(t);
  }, [pathname]);

  const showPill = seen && !open && (pathname === '/' || pathname === '/pros' || pathname === '/tarifs');

  return (
    <>
      <AnimatePresence>
        {showPill && (
          <motion.button
            key="pill"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ delay: 1.2 }}
            onClick={() => setOpen(true)}
            className="no-print fixed bottom-5 left-5 z-[55] hidden items-center gap-2 rounded-full bg-navy py-2.5 pl-3 pr-4 text-[13.5px] font-semibold text-white shadow-lift ring-1 ring-white/10 transition hover:-translate-y-0.5 lg:inline-flex"
          >
            <span className="grid h-7 w-7 place-items-center rounded-full bg-signal text-navy">
              <Compass className="h-4 w-4" />
            </span>
            Visite guidée
          </motion.button>
        )}
      </AnimatePresence>
      {open && (
        <SiteTour
          onClose={() => {
            write();
            setSeen(true);
            setOpen(false);
          }}
        />
      )}
    </>
  );
}

/** Bouton (pied de page, etc.) qui ouvre la visite. */
export function SiteTourButton({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <button type="button" onClick={() => window.dispatchEvent(new Event(OPEN_SITE_TOUR))} className={className}>
      {children}
    </button>
  );
}
