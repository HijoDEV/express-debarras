'use client';
import { animate, useReducedMotion } from 'framer-motion';
import { useEffect, useRef } from 'react';

/** Nombre animé (prix, volumes). Rendu serveur = valeur finale. */
export function Counter({ value, format = (n) => String(Math.round(n)), duration = 0.8, className }: { value: number; format?: (n: number) => string; duration?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const prev = useRef(value);
  const reduce = useReducedMotion();
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduce) {
      el.textContent = format(value);
      prev.current = value;
      return;
    }
    const c = animate(prev.current, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => (el.textContent = format(v)),
    });
    prev.current = value;
    return () => c.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, reduce]);
  return (
    <span ref={ref} className={className} aria-live="polite">
      {format(value)}
    </span>
  );
}
