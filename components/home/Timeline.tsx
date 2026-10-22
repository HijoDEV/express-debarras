'use client';
import { motion, useMotionValueEvent, useReducedMotion, useScroll, useSpring } from 'framer-motion';
import { Check } from 'lucide-react';
import { useRef, useState } from 'react';
import { cn } from '@/lib/cn';

const STEPS = [
  { title: 'Vous envoyez vos photos', text: 'Par WhatsApp, e-mail ou depuis le simulateur. Une vue large par pièce suffit.' },
  { title: 'Prix fixe en 1 h', text: 'Un prix ferme, détaillé ligne par ligne. Pas de surprise le jour J.' },
  { title: 'On débarrasse sous 48 h', text: 'Équipe de deux, camion de 20 m³, protection des sols. Vous n’avez rien à porter.' },
  { title: 'Vous recevez le rapport de tri', text: 'Photos avant / après et la part de vos affaires réemployée ou recyclée.' },
];

/** Frise verticale qui se remplit de bas en haut au scroll. Étape 1 en bas. */
export function Timeline() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 80%', 'end 45%'] });
  const fill = useSpring(scrollYProgress, { stiffness: 120, damping: 24 });
  const [reached, setReached] = useState(reduce ? STEPS.length : 0);
  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    if (reduce) return;
    setReached(Math.min(STEPS.length, Math.floor(v * STEPS.length + 0.15)));
  });
  const ordered = [...STEPS].map((s, i) => ({ ...s, i })).reverse();

  return (
    <div ref={ref} className="relative rounded-[28px] bg-white p-6 shadow-soft ring-1 ring-line sm:p-8">
      <div className="absolute bottom-12 left-[43px] top-12 w-1 rounded-full bg-kraft sm:left-[51px]">
        <motion.div className="absolute inset-x-0 bottom-0 origin-bottom rounded-full bg-tri" style={{ height: '100%', scaleY: reduce ? 1 : fill }} />
      </div>
      <ol className="relative space-y-8">
        {ordered.map((s) => {
          const done = s.i < reached;
          return (
            <li key={s.title} className="flex gap-5">
              <span
                className={cn(
                  'relative z-10 grid h-9 w-9 shrink-0 place-items-center rounded-full ring-4 ring-white transition-colors duration-500',
                  done ? 'bg-tri text-white' : 'bg-kraft text-navy/70',
                )}
              >
                {done ? (
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 18 }}>
                    <Check className="h-4 w-4" strokeWidth={3} />
                  </motion.span>
                ) : (
                  <span className="font-mono text-[12px] font-semibold">{s.i + 1}</span>
                )}
              </span>
              <div className="pt-1">
                <p className={cn('font-display text-[20px] tracking-[-0.02em] transition-colors', done ? 'text-navy' : 'text-navy/70')}>{s.title}</p>
                <p className="mt-1.5 text-[14.5px] leading-relaxed text-navy/65">{s.text}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
