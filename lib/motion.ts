import type { Variants } from 'framer-motion';

export const EASE = [0.22, 1, 0.36, 1] as const;

export const reveal: Variants = {
  hidden: { opacity: 0, y: 24, filter: 'blur(6px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.7, ease: EASE } },
};

export const stagger = (s = 0.06): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: s } },
});
