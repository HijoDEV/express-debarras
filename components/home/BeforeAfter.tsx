'use client';
import { useState } from 'react';
import { Illus } from '@/components/illus/Illus';
import type { IllusId } from '@/lib/data';

/** Comparateur avant / après à curseur. Fonds dégradés en attendant les vraies photos. */
export function BeforeAfter({ title, items, from, to }: { title: string; items: IllusId[]; from: string; to: string }) {
  const [pos, setPos] = useState(55);
  return (
    <figure className="group relative aspect-[4/3.6] select-none overflow-hidden rounded-2xl ring-1 ring-line">
      {/* Après */}
      <div className="absolute inset-0" style={{ background: to }}>
        <div className="absolute inset-x-0 bottom-0 h-[30%] bg-[linear-gradient(transparent,rgba(14,42,59,.06))]" />
        <span className="absolute bottom-3 right-3 rounded-full bg-tri-dark px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-white">Après</span>
      </div>
      {/* Avant */}
      <div className="absolute inset-0" style={{ background: from, clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        <div className="absolute inset-0 grid grid-cols-3 place-items-center gap-1 p-4 pb-10">
          {items.map((id, i) => (
            <Illus key={i} id={id} className="h-full max-h-14 w-full opacity-80" />
          ))}
        </div>
        <span className="absolute bottom-3 left-3 rounded-full bg-navy px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-white">Avant</span>
      </div>
      {/* poignée */}
      <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-white shadow" style={{ left: `${pos}%` }}>
        <span className="absolute left-1/2 top-1/2 grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-[13px] font-bold text-navy shadow-lift">⇆</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={pos}
        onChange={(e) => setPos(Number(e.target.value))}
        aria-label={`Comparer avant et après · ${title}`}
        className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
      />
      <figcaption className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[12px] font-semibold text-navy backdrop-blur">{title}</figcaption>
    </figure>
  );
}
