'use client';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useId, useState } from 'react';
import { cn } from '@/lib/cn';

export function Accordion({ items, className }: { items: { q: string; a: string }[]; className?: string }) {
  const [open, setOpen] = useState<number | null>(0);
  const uid = useId();
  return (
    <div className={cn('divide-y divide-line border-y border-line', className)}>
      {items.map((it, i) => {
        const isOpen = open === i;
        return (
          <div key={it.q}>
            <h3 className="font-sans">
              <button
                id={`${uid}-b${i}`}
                aria-expanded={isOpen}
                aria-controls={`${uid}-p${i}`}
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-6 py-6 text-left text-[17px] font-semibold text-navy md:text-[19px]"
              >
                {it.q}
                <span className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-full ring-1 ring-line transition-all duration-300', isOpen && 'rotate-180 bg-signal ring-signal')}>
                  <ChevronDown className="h-4 w-4" aria-hidden />
                </span>
              </button>
            </h3>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={`${uid}-p${i}`}
                  role="region"
                  aria-labelledby={`${uid}-b${i}`}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <p className="max-w-2xl pb-6 text-[16px] leading-relaxed text-navy/75">{it.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
