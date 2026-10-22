'use client';
import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';
import type { Status } from '@/lib/pro/types';

const DEPOT = { x: 70, y: 52 };

/** Carte stylisée de Rouen (SVG maison, aucun service externe). */
export function RouenMap({ target, status, since }: { target: { x: number; y: number }; status: Status; since?: string }) {
  const reduce = useReducedMotion();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (status !== 'en_route') return;
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, [status]);

  // progression du camion : 0 au dépôt, 1 sur place
  let p = 0;
  if (status === 'en_route') {
    const el = since ? (now - new Date(since).getTime()) / 1000 : 0;
    p = reduce ? 0.6 : Math.min(0.94, 0.08 + el / 40); // arrive en ~40 s pour la démo
  } else if (['en_cours', 'terminee', 'rapport_dispo'].includes(status)) p = 1;

  const c = { x: (DEPOT.x + target.x) / 2, y: Math.min(DEPOT.y, target.y) - 14 };
  const q = (t: number) => ({
    x: (1 - t) ** 2 * DEPOT.x + 2 * (1 - t) * t * c.x + t ** 2 * target.x,
    y: (1 - t) ** 2 * DEPOT.y + 2 * (1 - t) * t * c.y + t ** 2 * target.y,
  });
  const pos = q(p);
  const ahead = q(Math.min(1, p + 0.02));
  const angle = (Math.atan2(ahead.y - pos.y, ahead.x - pos.x) * 180) / Math.PI;
  const minutes = Math.max(1, Math.round((1 - p) * 22));

  return (
    <div className="relative overflow-hidden rounded-[12px] border border-p-line">
      <svg viewBox="0 0 100 70" className="block h-auto w-full" role="img" aria-label={status === 'en_route' ? `Camion en route, arrivée dans environ ${minutes} minutes` : 'Carte de la Métropole de Rouen'}>
        <rect width="100" height="70" fill="#EEF1EC" className="dark:fill-[#122636]" />
        {/* parcs */}
        <ellipse cx="20" cy="16" rx="14" ry="8" fill="#D5E8D4" className="dark:fill-[#163A31]" />
        <ellipse cx="86" cy="18" rx="11" ry="7" fill="#D5E8D4" className="dark:fill-[#163A31]" />
        <ellipse cx="80" cy="62" rx="16" ry="6" fill="#D5E8D4" className="dark:fill-[#163A31]" />
        {/* routes */}
        <g stroke="#FFFFFF" strokeWidth="1.6" fill="none" className="dark:stroke-[#1F3B52]" strokeLinecap="round">
          <path d="M0 30 Q30 26 52 30 T100 28" />
          <path d="M44 0 Q46 20 50 36 T56 70" />
          <path d="M14 0 L30 46" />
          <path d="M70 0 Q66 30 72 70" />
          <path d="M0 52 Q30 56 60 50 T100 46" />
          <path d="M30 10 Q60 14 92 8" />
        </g>
        {/* la Seine */}
        <path d="M-4 44 C14 36 26 50 40 46 S64 34 76 42 104 50 104 50" fill="none" stroke="#9EC3DD" strokeWidth="5.5" strokeLinecap="round" className="dark:stroke-[#1D4E89]" />
        <text x="8" y="41" fontSize="2.6" fill="#5B8DB0" fontStyle="italic">
          la Seine
        </text>
        <text x="38" y="20" fontSize="2.8" fill="#56646E" fontWeight="600" className="dark:fill-[#A3B4C1]">
          Rouen rive droite
        </text>
        <text x="30" y="62" fontSize="2.8" fill="#56646E" fontWeight="600" className="dark:fill-[#A3B4C1]">
          Rive gauche
        </text>
        {/* itinéraire */}
        <path d={`M${DEPOT.x} ${DEPOT.y} Q${c.x} ${c.y} ${target.x} ${target.y}`} fill="none" stroke="#0E2A3B" strokeWidth="0.9" strokeDasharray="1.6 1.4" className="dark:stroke-[#FFC21A]" opacity={0.7} />
        {/* dépôt */}
        <g>
          <rect x={DEPOT.x - 2.6} y={DEPOT.y - 2.6} width="5.2" height="5.2" rx="1.2" fill="#0E2A3B" />
          <path d={`M${DEPOT.x - 1.2} ${DEPOT.y + 0.6} h2.4 v-1.4 l-1.2 -0.9 l-1.2 0.9z`} fill="#FFC21A" />
          <text x={DEPOT.x + 3.6} y={DEPOT.y + 1} fontSize="2.4" fill="#0E2A3B" fontWeight="700" className="dark:fill-white">
            Dépôt
          </text>
        </g>
        {/* destination */}
        <g>
          {!reduce && <motion.circle cx={target.x} cy={target.y} r={3} fill="#FFC21A" initial={{ opacity: 0.6, scale: 0.6 }} animate={{ opacity: 0, scale: 2.4 }} transition={{ duration: 1.8, repeat: Infinity }} style={{ originX: `${target.x}px`, originY: `${target.y}px` }} />}
          <circle cx={target.x} cy={target.y} r="2.2" fill="#FFC21A" stroke="#0E2A3B" strokeWidth="0.8" />
        </g>
        {/* camion */}
        <motion.g animate={{ x: pos.x, y: pos.y }} transition={{ type: 'spring', stiffness: 60, damping: 20 }}>
          <g transform={`rotate(${p >= 1 ? 0 : angle})`}>
            <rect x="-3.4" y="-1.9" width="5" height="3.8" rx="0.6" fill="#FFFFFF" stroke="#0E2A3B" strokeWidth="0.5" />
            <rect x="-3.4" y="-1.9" width="5" height="1" fill="#0E2A3B" />
            <rect x="1.6" y="-1.5" width="2" height="3" rx="0.6" fill="#FFC21A" stroke="#0E2A3B" strokeWidth="0.5" />
          </g>
        </motion.g>
      </svg>
      <div className="absolute left-2 top-2 rounded-full bg-p-card px-2.5 py-1 text-[11.5px] font-semibold shadow">
        {status === 'en_route' ? `En route · arrivée ≈ ${minutes} min` : p >= 1 ? 'Équipe sur place' : 'Au dépôt'}
      </div>
    </div>
  );
}
