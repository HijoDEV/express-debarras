'use client';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { Truck } from '@/components/simulator/Truck';
import { computeVolume } from '@/lib/pricing';

// Ordre de chargement : du plus lourd au plus léger
const SEQ = ['canape3', 'armoire2', 'frigo', 'litdouble', 'commode', 'matelas', 'velo', 'fauteuil', 'lavelinge', 'tv', 'carton', 'carton', 'carton', 'carton', 'carton', 'carton', 'sac', 'sac'];
const FULL: Record<string, number> = SEQ.reduce((m, id) => ({ ...m, [id]: (m[id] ?? 0) + 1 }), {} as Record<string, number>);

type Phase = 'arrive' | 'load' | 'leave';

export function HeroTruck() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: '0px 0px -10% 0px' });
  const [phase, setPhase] = useState<Phase>('arrive');
  const [n, setN] = useState(0);
  const [lap, setLap] = useState(0);

  useEffect(() => {
    if (reduce || !inView) return;
    let t: ReturnType<typeof setTimeout>;
    if (phase === 'arrive') t = setTimeout(() => setPhase('load'), 1300);
    else if (phase === 'load') {
      if (n < SEQ.length) t = setTimeout(() => setN((x) => x + 1), n === 0 ? 300 : 420);
      else t = setTimeout(() => setPhase('leave'), 1600);
    } else
      t = setTimeout(() => {
        setN(0);
        setLap((l) => l + 1);
        setPhase('arrive');
      }, 1500);
    return () => clearTimeout(t);
  }, [phase, n, inView, reduce]);

  const items = reduce ? FULL : SEQ.slice(0, n).reduce((m, id) => ({ ...m, [id]: (m[id] ?? 0) + 1 }), {} as Record<string, number>);
  const volume = computeVolume(items, {});
  const x = reduce ? '0%' : phase === 'arrive' ? ['-115%', '0%'] : phase === 'leave' ? ['0%', '120%'] : '0%';

  return (
    <div ref={ref} className="relative mx-auto mt-14 max-w-[760px] overflow-hidden px-2 md:mt-16" aria-hidden>
      <motion.div
        key={`${lap}-${phase === 'load' ? 'arrive' : phase}`}
        initial={false}
        animate={{ x }}
        transition={{ duration: phase === 'leave' ? 1.3 : 1.2, ease: phase === 'leave' ? [0.55, 0, 0.8, 0.4] : [0.16, 1, 0.3, 1] }}
      >
        <Truck bare items={items} rooms={{}} volume={volume} driving={!reduce && phase !== 'load'} />
      </motion.div>
      {/* route */}
      <div className="absolute inset-x-0 bottom-[5%] -z-10 h-[2px] bg-[repeating-linear-gradient(90deg,#D8D2C3_0_18px,transparent_18px_34px)]" />
    </div>
  );
}
