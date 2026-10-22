'use client';
import { ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { PackId, SituationId } from '@/lib/data';
import { prefillSim } from '@/lib/sim-store';
import { cn } from '@/lib/cn';

export function OpenSimButton({ situation, items, rooms, pack, label = 'Estimer mon prix', className }: { situation: SituationId; items?: Record<string, number>; rooms?: Record<string, number>; pack?: PackId; label?: string; className?: string }) {
  const router = useRouter();
  return (
    <button
      onClick={() => {
        prefillSim({ situation, mode: items ? 'items' : 'rooms', items: items ?? {}, rooms: rooms ?? {}, ...(pack ? { pack } : {}), step: 1 });
        router.push('/simulateur');
      }}
      className={cn('group inline-flex h-14 items-center justify-center gap-2 rounded-btn bg-signal px-7 text-[16px] font-semibold text-navy shadow-signal transition hover:-translate-y-0.5 hover:shadow-signal-lg', className)}
    >
      {label} <ArrowRight className="h-[18px] w-[18px] transition-transform group-hover:translate-x-1" />
    </button>
  );
}
