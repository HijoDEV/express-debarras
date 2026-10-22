'use client';
import { AnimatePresence, motion, useInView, useReducedMotion } from 'framer-motion';
import { ArrowRight, Pause } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import { LIST_SITUATIONS, type SituationId } from '@/lib/data';
import { computeQuote, fmtEur, fmtVol, proPonctuelHT } from '@/lib/pricing';
import { prefillSim } from '@/lib/sim-store';
import { scrollToEl } from '@/lib/scroll';

const SIT_FOR: SituationId[] = ['meuble', 'cave', 'logement', 'logement', 'logement', 'local', 'cave'];

export function SituationPicker() {
  const [active, setActive] = useState(0);
  const [auto, setAuto] = useState(true);
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: '-20% 0px' });

  useEffect(() => {
    if (!auto || reduce || !inView) return;
    const t = setInterval(() => setActive((a) => (a + 1) % LIST_SITUATIONS.length), 2400);
    return () => clearInterval(t);
  }, [auto, reduce, inView]);

  const s = LIST_SITUATIONS[active];
  const q = computeQuote(s.input);
  const price = s.pro ? `${fmtEur(proPonctuelHT(s.volume))} HT` : fmtEur(q.total);

  const open = () => {
    const sit = SIT_FOR[active];
    prefillSim({
      situation: sit,
      mode: s.input.items ? 'items' : 'rooms',
      items: s.input.items ?? {},
      rooms: s.input.rooms ?? {},
      delay: s.input.delay ?? '48h',
      pack: s.input.pack ?? 'essentiel',
      step: 3,
    });
    requestAnimationFrame(() => scrollToEl(document.getElementById('simulateur')));
  };

  return (
    <div ref={ref} className="grid items-start gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-12">
      <div>
        <ul className="space-y-2" aria-label="Situations">
          {LIST_SITUATIONS.map((x, i) => (
            <li key={x.label}>
              <button
                aria-pressed={active === i}
                onClick={() => {
                  setActive(i);
                  setAuto(false);
                }}
                className={cn(
                  'relative flex w-full items-center justify-between rounded-2xl px-5 py-4 text-left transition-colors duration-300',
                  active === i ? 'text-navy' : 'text-navy/70 hover:text-navy',
                )}
              >
                {active === i && (
                  <motion.span layoutId="sit-frame" className="absolute inset-0 rounded-2xl bg-white ring-2 ring-navy" transition={{ type: 'spring', stiffness: 380, damping: 34 }} />
                )}
                <span className="relative font-display text-[22px] tracking-[-0.03em] sm:text-[28px]">{x.label}</span>
                <span className={cn('relative font-mono text-[12px] transition-opacity', active === i ? 'opacity-100' : 'opacity-0')}>{fmtVol(x.volume)}</span>
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-6 px-1">
          <div className="flex justify-between font-mono text-label uppercase text-beton-600">
            <span>Volume estimé</span>
            <span className="text-navy">{fmtVol(s.volume)}</span>
          </div>
          <div className="mt-2.5 h-3 overflow-hidden rounded-full bg-white ring-1 ring-line">
            <motion.div className="h-full rounded-full bg-signal" initial={false} animate={{ width: `${Math.min(100, (s.volume / 25) * 100)}%` }} transition={{ type: 'spring', stiffness: 90, damping: 18 }} />
          </div>
          {!auto && (
            <p className="mt-3 inline-flex items-center gap-1.5 text-[13px] text-navy/70">
              <Pause className="h-3.5 w-3.5" /> Défilement arrêté ·{' '}
              <button className="underline underline-offset-2" onClick={() => setAuto(true)}>
                reprendre
              </button>
            </p>
          )}
        </div>
      </div>

      <div className="lg:sticky lg:top-28">
        <div className="on-dark relative overflow-hidden rounded-[28px] bg-navy p-7 text-white shadow-lift sm:p-9">
          <div aria-hidden className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/[0.06] blur-2xl" />
          <AnimatePresence mode="wait">
            <motion.div key={active} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="relative">
              <p className="font-mono text-label uppercase text-signal">Notre solution</p>
              <p className="mt-4 font-display text-[30px] leading-[1] tracking-[-0.03em] sm:text-[36px]">{s.solution}</p>
              <div className="mt-8 flex items-end justify-between gap-4 border-t border-white/10 pt-6">
                <div>
                  <p className="text-[13px] text-white/60">{s.pro ? 'Prix indicatif' : 'Prix estimé TTC'}</p>
                  <p className="mt-1 font-display text-[44px] leading-none tight text-signal">{price}</p>
                </div>
                <p className="text-right text-[13px] text-white/60">
                  {fmtVol(s.volume)}
                  <br />
                  sous {s.input.delay === 'urgence' ? '24 h' : s.input.delay === 'tournee' ? '7 j' : '48 h'}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
          <button
            onClick={open}
            className="group relative mt-8 inline-flex h-14 w-full items-center justify-center gap-2 rounded-btn bg-signal font-semibold text-navy shadow-signal transition hover:-translate-y-0.5"
          >
            Ajuster dans le simulateur <ArrowRight className="h-[18px] w-[18px] transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </div>
  );
}
