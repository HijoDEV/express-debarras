'use client';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useLayoutEffect, useState } from 'react';

const STEPS = [
  { target: 'next', title: 'Voici votre prochaine intervention', text: 'Date, créneau, équipe et compte à rebours. « Suivre » ouvre le suivi en direct avec le camion sur la carte.' },
  { target: 'kpis', title: 'Vos indicateurs du mois', text: 'Interventions, m³ évacués, part valorisée et dépenses, comparés au mois précédent.' },
  { target: 'new', title: 'Commander en 4 étapes', text: 'Lieu, contenu, délai, récapitulatif. Raccourci : touche N.' },
  { target: 'nav-interventions', title: 'Tout votre historique', text: 'Tableau, calendrier ou kanban. Glissez une intervention dans le calendrier pour demander un report.' },
  { target: 'search', title: 'Allez plus vite avec ⌘K', text: 'Cherchez une référence ou une adresse, changez de thème, naviguez au clavier.' },
];

export function Tour({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [i, setI] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (open) setI(0);
  }, [open]);

  useLayoutEffect(() => {
    if (!open) return;
    const find = () => {
      const els = Array.from(document.querySelectorAll<HTMLElement>(`[data-tour="${STEPS[i].target}"]`));
      const el = els.find((e) => e.offsetParent !== null) ?? null;
      if (el) {
        el.scrollIntoView({ block: 'center', behavior: 'smooth' });
        setTimeout(() => setRect(el.getBoundingClientRect()), 280);
      } else setRect(null);
    };
    find();
    window.addEventListener('resize', find);
    return () => window.removeEventListener('resize', find);
  }, [open, i]);

  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') setI((x) => Math.max(0, x - 1));
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  });

  const next = () => (i < STEPS.length - 1 ? setI(i + 1) : onClose());
  const pad = 8;
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
  const bubbleW = Math.min(340, vw - 24);
  let top = vh / 2 - 90;
  let left = vw / 2 - bubbleW / 2;
  if (rect) {
    const below = rect.bottom + 14 + 190 < vh;
    top = below ? rect.bottom + 14 : Math.max(12, rect.top - 14 - 190);
    left = Math.min(Math.max(12, rect.left + rect.width / 2 - bubbleW / 2), vw - bubbleW - 12);
    if (rect.width < 300 && rect.left < 300 && vw > 1000) {
      // cible dans la barre latérale : bulle à droite
      left = rect.right + 16;
      top = Math.min(Math.max(12, rect.top - 20), vh - 220);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[110]" role="dialog" aria-modal="true" aria-label="Visite guidée">
          {rect ? (
            <motion.div
              className="pointer-events-none absolute rounded-[14px] ring-4 ring-signal"
              animate={{ top: rect.top - pad, left: rect.left - pad, width: rect.width + pad * 2, height: rect.height + pad * 2 }}
              transition={{ type: 'spring', stiffness: 260, damping: 30 }}
              style={{ boxShadow: '0 0 0 9999px rgba(6,17,26,.55)' }}
            />
          ) : (
            <div className="absolute inset-0 bg-[#06111A]/55" />
          )}
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            className="absolute rounded-[16px] border border-p-line bg-p-card p-5 shadow-2xl"
            style={{ top, left, width: bubbleW }}
          >
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-p-muted">
              Visite · {i + 1} / {STEPS.length}
            </p>
            <p className="mt-2 text-[16px] font-semibold text-p-text">{STEPS[i].title}</p>
            <p className="mt-1.5 text-[14px] leading-relaxed text-p-muted">{STEPS[i].text}</p>
            <div className="mt-4 flex items-center gap-2">
              <div className="flex gap-1">
                {STEPS.map((_, k) => (
                  <span key={k} className={`h-1.5 rounded-full transition-all ${k === i ? 'w-5 bg-signal' : 'w-1.5 bg-p-line'}`} />
                ))}
              </div>
              <button onClick={onClose} className="ml-auto h-9 rounded-[10px] px-3 text-[13px] font-semibold text-p-muted hover:bg-p-hover">
                Passer
              </button>
              <button onClick={next} className="h-9 rounded-[10px] bg-signal px-4 text-[13.5px] font-bold text-navy">
                {i < STEPS.length - 1 ? 'Suivant' : 'Terminer'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
