'use client';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { EASE } from '@/lib/motion';

/**
 * Entrée au scroll : fondu + montée 24 px + flou.
 * Rendu serveur visible. Les éléments déjà à l'écran ne sont jamais masqués.
 */
export function Reveal({
  children,
  delay = 0,
  className,
  as = 'div',
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  as?: 'div' | 'li' | 'section' | 'article';
}) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const inView = useInView(ref, { once: true, margin: '0px 0px -8% 0px' });
  const [phase, setPhase] = useState<'idle' | 'hidden' | 'shown'>('idle');

  useEffect(() => {
    if (reduce || !ref.current) return setPhase('shown');
    const r = ref.current.getBoundingClientRect();
    setPhase(r.top < window.innerHeight ? 'shown' : 'hidden');
  }, [reduce]);

  useEffect(() => {
    if (inView && phase === 'hidden') setPhase('shown');
  }, [inView, phase]);

  const M = motion[as] as typeof motion.div;
  return (
    <M
      ref={ref as React.Ref<HTMLDivElement>}
      className={className}
      initial={false}
      animate={phase === 'hidden' ? { opacity: 0, y: 24, filter: 'blur(6px)' } : { opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={phase === 'hidden' ? { duration: 0 } : { duration: 0.7, ease: EASE, delay }}
    >
      {children}
    </M>
  );
}
