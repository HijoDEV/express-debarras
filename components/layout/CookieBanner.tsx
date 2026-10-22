'use client';
import { AnimatePresence, motion } from 'framer-motion';
import { Cookie } from 'lucide-react';
import { useEffect, useState } from 'react';
import { readLS, writeLS } from '@/lib/storage';

export function CookieBanner() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!readLS<string | null>('ed:cookies', null)) {
      const t = setTimeout(() => setShow(true), 1200);
      return () => clearTimeout(t);
    }
  }, []);
  const choose = (v: 'accepted' | 'refused') => {
    writeLS('ed:cookies', v);
    setShow(false);
  };
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          role="dialog"
          aria-label="Cookies"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="no-print fixed inset-x-3 bottom-3 z-[60] mx-auto max-w-[460px] rounded-card bg-white p-5 shadow-lift ring-1 ring-line sm:bottom-6"
        >
          <div className="flex gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-signal-soft">
              <Cookie className="h-5 w-5" aria-hidden />
            </span>
            <p className="text-[14px] leading-snug text-navy/80">
              Nous utilisons quelques cookies pour mesurer l’audience. Rien de plus, promis.
            </p>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button onClick={() => choose('refused')} className="h-11 rounded-btn bg-kraft text-[15px] font-semibold transition hover:bg-line">
              Refuser
            </button>
            <button onClick={() => choose('accepted')} className="h-11 rounded-btn bg-navy text-[15px] font-semibold text-white transition hover:bg-navy-700">
              Accepter
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
