'use client';
import { AnimatePresence, motion, useInView, useReducedMotion } from 'framer-motion';
import { CheckCircle2, Recycle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { LogoTile } from '@/components/brand/Logo';
import { Phone } from '@/components/ui/Phone';
import { FILIERES } from '@/lib/data';
import { cn } from '@/lib/cn';

const R = 54;
const C = 2 * Math.PI * R;
const REPORT = [
  { name: 'Réemploi associatif', v: '6 m³', c: '#2F9E6E' },
  { name: 'Métaux', v: '4 m³', c: '#2F9E6E' },
  { name: 'Revente', v: '3 m³', c: '#2F9E6E' },
  { name: 'Électroménager', v: '2 m³', c: '#2F9E6E' },
  { name: 'Tout-venant', v: '7 m³', c: '#8A9299' },
];

export function SortReport() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-25% 0px' });
  const reduce = useReducedMotion();
  const [pct, setPct] = useState(reduce ? 68 : 0);
  const [toast, setToast] = useState(false);

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      setPct(68);
      setToast(true);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const k = Math.min(1, (t - start) / 1600);
      setPct(Math.round(68 * (1 - Math.pow(1 - k, 3))));
      if (k < 1) raf = requestAnimationFrame(tick);
      else setTimeout(() => setToast(true), 300);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, reduce]);

  const float = (delay: number) =>
    reduce ? {} : { animate: { y: [0, -8, 0] }, transition: { duration: 5 + delay, repeat: Infinity, ease: 'easeInOut' as const, delay } };

  return (
    <div ref={ref}>
      <div className="relative mx-auto max-w-[860px]" data-tour="sortreport">
        {/* cartes flottantes */}
        {[
          { t: 'Emmaüs', d: '6 m³ réemployés', cls: 'left-0 top-16 md:left-4 -rotate-3' },
          { t: 'Métaux', d: '4 m³ recyclés', cls: 'right-0 top-40 md:right-6 rotate-3' },
          { t: 'Revente', d: '3 m³', cls: 'left-2 bottom-28 md:left-16 rotate-2' },
        ].map((c, i) => (
          <motion.div key={c.t} {...float(i)} className={cn('absolute z-10 hidden rounded-2xl bg-white p-3.5 pr-5 shadow-lift ring-1 ring-line sm:block', c.cls)}>
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-tri-soft text-tri">
                <Recycle className="h-[18px] w-[18px]" />
              </span>
              <div className="leading-tight">
                <p className="text-[14px] font-semibold">{c.t}</p>
                <p className="text-[12.5px] text-navy/70">{c.d}</p>
              </div>
            </div>
          </motion.div>
        ))}

        <Phone>
          <div className="flex h-full flex-col bg-white pt-11">
            <div className="flex items-center gap-2 px-5 pb-3">
              <LogoTile className="h-8 w-8" />
              <div className="leading-tight">
                <p className="text-[13px] font-semibold">Rapport de tri</p>
                <p className="text-[11px] text-navy/70">Maison · Bois-Guillaume · 22 m³</p>
              </div>
            </div>
            <div className="relative mx-4 grid place-items-center rounded-3xl bg-kraft py-6">
              <svg viewBox="0 0 140 140" className="h-36 w-36 -rotate-90" aria-hidden>
                <circle cx="70" cy="70" r={R} fill="none" stroke="#E6E3DA" strokeWidth="14" />
                <circle cx="70" cy="70" r={R} fill="none" stroke="#2F9E6E" strokeWidth="14" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - pct / 100)} />
              </svg>
              <div className="absolute inset-0 grid place-content-center text-center">
                <p className="font-display text-[34px] leading-none tight">{pct} %</p>
                <p className="mt-1 text-[11px] text-navy/70">valorisé</p>
              </div>
            </div>
            <ul className="mt-4 space-y-2.5 px-5 text-[13px]">
              {REPORT.map((r) => (
                <li key={r.name} className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: r.c }} /> {r.name}
                  </span>
                  <span className="font-mono text-navy/70">{r.v}</span>
                </li>
              ))}
            </ul>
            <AnimatePresence>
              {toast && (
                <motion.div
                  initial={{ opacity: 0, y: 30, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                  className="mx-4 mt-auto mb-5 flex items-center gap-2 rounded-2xl bg-navy px-4 py-3 text-[13px] font-semibold text-white shadow-lift"
                >
                  <CheckCircle2 className="h-4 w-4 text-tri" /> 68 % de votre débarras valorisé
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Phone>
      </div>

      <ul className="mx-auto mt-12 flex max-w-3xl flex-wrap justify-center gap-2" aria-label="Filières et objectifs">
        {FILIERES.map((f) => (
          <li key={f.name} className={cn('inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-[14px] font-semibold ring-1', f.color === 'tri' ? 'bg-tri-soft text-tri-dark ring-tri/20' : 'bg-white text-navy/70 ring-line')}>
            {f.name}
            <span className="font-mono text-[12px]">{f.pct} %</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-center text-[13px] text-navy/70">Objectifs de répartition par filière · 60 % du volume valorisé en moyenne</p>
    </div>
  );
}
