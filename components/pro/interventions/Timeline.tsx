'use client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { STATUS_META, STATUS_ORDER } from '@/lib/pro/status';
import type { Intervention } from '@/lib/pro/types';

/** Frise de suivi verticale, animée à chaque changement de statut. */
export function Timeline({ it }: { it: Intervention }) {
  const cancelled = it.status === 'annulee';
  const steps = STATUS_ORDER.filter((s) => s !== 'devis_envoye' || it.history.some((h) => h.status === 'devis_envoye') || it.status === 'demandee');
  const curIdx = cancelled ? -1 : steps.indexOf(it.status);
  const at = (s: string) => [...it.history].reverse().find((h) => h.status === s);

  return (
    <ol className="relative">
      {steps.map((s, i) => {
        const h = at(s);
        const done = cancelled ? !!h : i < curIdx;
        const current = !cancelled && i === curIdx;
        const last = i === steps.length - 1;
        return (
          <li key={s} className="relative flex gap-3 pb-4 last:pb-0">
            {!last && (
              <span className="absolute left-[13px] top-7 h-[calc(100%-20px)] w-0.5 bg-p-line">
                <motion.span className="absolute inset-x-0 top-0 bg-tri" initial={false} animate={{ height: done ? '100%' : '0%' }} transition={{ duration: 0.5, delay: i * 0.04 }} />
              </span>
            )}
            <motion.span
              initial={false}
              animate={{ scale: current ? [1, 1.12, 1] : 1 }}
              transition={current ? { duration: 1.6, repeat: Infinity } : {}}
              className={cn('relative z-10 grid h-7 w-7 shrink-0 place-items-center rounded-full text-[11px] font-bold', done ? 'bg-tri text-white' : current ? 'bg-signal text-navy ring-4 ring-signal/30' : 'bg-p-soft text-p-muted')}
            >
              {done ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : i + 1}
            </motion.span>
            <div className="min-w-0 pt-0.5">
              <p className={cn('text-[14px] font-semibold', !done && !current && 'text-p-muted')}>{STATUS_META[s].label}</p>
              {h && (
                <p className="text-[12.5px] text-p-muted">
                  {format(new Date(h.at), 'd MMM yyyy · HH:mm', { locale: fr })}
                  {h.by === 'systeme' ? ' · automatique' : h.by === 'equipe' ? ' · équipe' : ' · vous'}
                  {h.note && ` · ${h.note}`}
                </p>
              )}
            </div>
          </li>
        );
      })}
      {cancelled && (
        <li className="relative flex gap-3">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-[#E0533A] text-white">
            <X className="h-3.5 w-3.5" strokeWidth={3} />
          </span>
          <div className="pt-0.5">
            <p className="text-[14px] font-semibold">Annulée</p>
            <p className="text-[12.5px] text-p-muted">{at('annulee')?.note ?? ''}</p>
          </div>
        </li>
      )}
    </ol>
  );
}
