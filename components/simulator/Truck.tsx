'use client';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Illus } from '@/components/illus/Illus';
import { cn } from '@/lib/cn';
import { fmtVol } from '@/lib/pricing';
import { buildPieces, COLS, pack, ROWS, TRUCK_M3 } from '@/lib/truck';

/* Géométrie (viewBox 0 0 720 300) — camion vu de profil, cabine à gauche */
const IN_X = 268;
const IN_Y = 66;
const IN_W = 404;
const IN_H = 152;
const CW = IN_W / COLS;
const CH = IN_H / ROWS;
const FLOOR = IN_Y + IN_H;
const WHEELS = [
  { cx: 132, cy: 252 },
  { cx: 566, cy: 252 },
];

const N = '#0E2A3B';
const Y = '#FFC21A';

const PIECE_FILL = {
  furniture: { fill: '#FFFFFF', stroke: 'rgba(14,42,59,.18)' },
  carton: { fill: '#E7D6B5', stroke: 'rgba(120,90,40,.35)' },
  appliance: { fill: '#F1F4F6', stroke: 'rgba(14,42,59,.22)' },
};

function Wheel({ cx, cy, spin, driving }: { cx: number; cy: number; spin: number; driving?: boolean }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={27} fill="#0B1F2B" />
      <circle cx={cx} cy={cy} r={22} fill="#1B2B36" />
      <motion.g
        animate={driving ? { rotate: [spin, spin + 360] } : { rotate: spin }}
        transition={driving ? { duration: 0.6, ease: 'linear', repeat: Infinity } : { duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        style={{ originX: `${cx}px`, originY: `${cy}px` }}
      >
        <circle cx={cx} cy={cy} r={15} fill="#D9DEE2" />
        <circle cx={cx} cy={cy} r={15} fill="none" stroke="#B5BDC3" strokeWidth={2} />
        {[0, 72, 144, 216, 288].map((a) => (
          <circle key={a} cx={cx + Math.cos((a * Math.PI) / 180) * 9} cy={cy + Math.sin((a * Math.PI) / 180) * 9} r={2.4} fill="#8A9299" />
        ))}
        <circle cx={cx} cy={cy} r={5} fill={Y} stroke={N} strokeWidth={1.5} />
      </motion.g>
    </g>
  );
}

export function Truck({
  items,
  rooms,
  volume,
  compact = false,
  bare = false,
  driving = false,
  className,
}: {
  items: Record<string, number>;
  rooms: Record<string, number>;
  volume: number;
  compact?: boolean;
  bare?: boolean;
  driving?: boolean;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const uid = useId().replace(/:/g, '');
  const { placed } = useMemo(() => pack(buildPieces(items, rooms)), [items, rooms]);
  const pct = Math.min(1, volume / TRUCK_M3);
  const rotations = Math.max(1, Math.ceil(volume / TRUCK_M3 - 1e-9));
  const full = volume > TRUCK_M3;

  // Animations déclenchées à chaque changement de chargement
  const [spin, setSpin] = useState(0);
  const [doorOpen, setDoorOpen] = useState(false);
  const [puff, setPuff] = useState(0);
  const prev = useRef(volume);
  useEffect(() => {
    if (prev.current === volume) return;
    const added = volume > prev.current;
    prev.current = volume;
    if (reduce) return;
    setSpin((s) => s + (added ? 40 : -40));
    setPuff((p) => p + 1);
    setDoorOpen(true);
    const t = setTimeout(() => setDoorOpen(false), 1600);
    return () => clearTimeout(t);
  }, [volume, reduce]);

  const sag = reduce ? 0 : pct * 5;

  return (
    <div className={cn('relative', bare ? '' : compact ? 'pt-6' : 'pt-7 sm:pt-2', className)}>
      <svg viewBox="0 0 720 300" className="h-auto w-full" role="img" aria-label={`Camion de 20 m³ rempli à ${Math.round(pct * 100)} %`}>
        <defs>
          <pattern id={`hz-${uid}`} width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="8" height="16" fill={Y} />
            <rect x="8" width="8" height="16" fill={N} />
          </pattern>
          <linearGradient id={`glass-${uid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#D8E8F2" />
            <stop offset="1" stopColor="#8FB0C4" />
          </linearGradient>
          <linearGradient id={`body-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#FFFFFF" />
            <stop offset="1" stopColor="#EEF1F3" />
          </linearGradient>
          <linearGradient id={`inside-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#E9E2D2" />
            <stop offset="1" stopColor="#F6F1E6" />
          </linearGradient>
          <clipPath id={`cargo-${uid}`}>
            <rect x={IN_X} y={IN_Y} width={IN_W} height={IN_H} rx={4} />
          </clipPath>
        </defs>

        {/* ombre au sol */}
        <ellipse cx={370} cy={282} rx={330} ry={10} fill="rgba(14,42,59,.12)" />

        <motion.g
          initial={reduce ? false : { x: -70, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* caisse + cabine : s'affaissent légèrement avec la charge */}
          <motion.g animate={{ y: sag }} transition={{ type: 'spring', stiffness: 140, damping: 12 }}>
            {/* châssis */}
            <rect x={78} y={234} width={612} height={12} rx={3} fill="#22323D" />

            {/* ---------- CAISSE ---------- */}
            <rect x={252} y={24} width={438} height={214} rx={10} fill={`url(#body-${uid})`} stroke="#CBD3D9" strokeWidth={2} />
            {/* bandeau de flocage haut */}
            <path d="M262 24 H680 Q690 24 690 34 V60 H252 V34 Q252 24 262 24 Z" fill={N} />
            <g transform="translate(268 30)">
              <g transform="scale(.42)">
                <path d="M3 24h9M6 31h7M2 38h11" stroke={Y} strokeWidth="3" strokeLinecap="round" />
                <rect x="17" y="20" width="31" height="25" rx="3" fill={Y} stroke="#fff" strokeWidth="2.5" />
                <path d="M17 19.5 L23 9 H45 V4.5 L61 14 L45 23.5 V19.5 Z" fill={Y} stroke="#fff" strokeWidth="2.5" strokeLinejoin="round" />
              </g>
            </g>
            <text x={300} y={47} textLength={80} lengthAdjust="spacingAndGlyphs" fill="#FFFFFF" style={{ fontFamily: 'var(--font-archivo)', fontSize: 17, letterSpacing: '-0.02em' }} transform="skewX(-8) translate(6 0)">
              EXPRESS
            </text>
            <text x={392} y={47} textLength={92} lengthAdjust="spacingAndGlyphs" fill={Y} style={{ fontFamily: 'var(--font-archivo)', fontSize: 17, letterSpacing: '0.04em' }}>
              DÉBARRAS
            </text>
            {!compact && (
              <text className="hidden sm:block" x={676} y={46} textLength={158} lengthAdjust="spacingAndGlyphs" textAnchor="end" fill="rgba(255,255,255,.75)" style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '0.06em' }}>
                LA DÉCHETTERIE VIENT À VOUS
              </text>
            )}

            {/* intérieur en coupe */}
            <rect x={IN_X} y={IN_Y} width={IN_W} height={IN_H} rx={4} fill={`url(#inside-${uid})`} />
            <g clipPath={`url(#cargo-${uid})`}>
              {/* lattes et rails d'arrimage */}
              {Array.from({ length: 13 }).map((_, i) => (
                <rect key={i} x={IN_X + i * 32} y={IN_Y} width={1.5} height={IN_H} fill="rgba(120,100,60,.12)" />
              ))}
              {[IN_Y + CH, IN_Y + CH * 2].map((y) => (
                <rect key={y} x={IN_X} y={y} width={IN_W} height={3} fill="rgba(14,42,59,.07)" />
              ))}
              {/* filigrane */}
              <text x={IN_X + IN_W / 2} y={IN_Y + IN_H / 2 + 14} textAnchor="middle" fill="rgba(14,42,59,.035)" style={{ fontFamily: 'var(--font-archivo)', fontSize: 44, letterSpacing: '-0.04em' }}>
                EXPRESS
              </text>

              {/* chargement */}
              <AnimatePresence>
                {placed.map((p) => {
                  const w = p.w * CW;
                  const h = p.h * CH;
                  const x = IN_X + p.col * CW;
                  const y = FLOOR - (p.row + p.h) * CH;
                  const s = Math.min(w, h) * (p.h > 1 && p.w === 1 ? 0.78 : 0.7);
                  const col = PIECE_FILL[p.kind];
                  return (
                    <motion.g
                      key={p.id}
                      layout={false}
                      initial={reduce ? false : { x: IN_X + IN_W + 30, y: y - 18, opacity: 0, rotate: 6 }}
                      animate={{ x, y, opacity: 1, rotate: 0 }}
                      exit={reduce ? { opacity: 0 } : { x: IN_X + IN_W + 40, opacity: 0, transition: { duration: 0.35 } }}
                      transition={{ type: 'spring', stiffness: 170, damping: 19, mass: 0.8 }}
                    >
                      <rect x={1.5} y={1.5} width={w - 3} height={h - 3} rx={6} fill={col.fill} stroke={col.stroke} strokeWidth={1.5} />
                      {p.kind === 'carton' && <rect x={w / 2 - 3} y={1.5} width={6} height={h - 3} fill="rgba(255,194,26,.55)" />}
                      <svg x={(w - s) / 2} y={(h - s) / 2} width={s} height={s} viewBox="0 0 64 64" overflow="visible">
                        <Illus id={p.illus} className="h-full w-full" />
                      </svg>
                      {p.count && p.count > 1 && (
                        <g transform={`translate(${w - 15} 4)`}>
                          <rect width={13} height={11} rx={5.5} fill={N} />
                          <text x={6.5} y={8.4} textAnchor="middle" fill="#fff" style={{ fontFamily: 'var(--font-inter)', fontSize: 7.5, fontWeight: 700 }}>
                            {p.count}
                          </text>
                        </g>
                      )}
                    </motion.g>
                  );
                })}
              </AnimatePresence>

            </g>
            <rect x={IN_X} y={IN_Y} width={IN_W} height={IN_H} rx={4} fill="none" stroke="rgba(14,42,59,.18)" strokeWidth={1.5} />
            {placed.length === 0 && !bare && (
              <text x={IN_X + IN_W / 2} y={IN_Y + IN_H / 2 + 5} textAnchor="middle" fill="rgba(14,42,59,.45)" style={{ fontFamily: 'var(--font-inter)', fontSize: 14, fontWeight: 600 }}>
                Ajoutez des objets : ils se chargent ici
              </text>
            )}

            {/* montants d'angle + reflet de toit */}
            <rect x={254} y={60} width={10} height={162} fill="#E3E8EC" />
            <rect x={676} y={60} width={12} height={162} fill="#E3E8EC" />
            <rect x={262} y={61} width={414} height={2} fill="rgba(255,255,255,.35)" />
            {[300, 420, 540, 650].map((x) => (
              <rect key={x} x={x} y={238} width={8} height={4} rx={1} fill="#F4A340" />
            ))}
            {/* jupe chantier */}
            <rect x={252} y={222} width={438} height={14} fill={`url(#hz-${uid})`} />
            <rect x={252} y={222} width={438} height={14} fill="none" stroke={N} strokeWidth={1} />
            {/* feux arrière */}
            <rect x={684} y={196} width={8} height={20} rx={2} fill="#E0533A" />
            <rect x={684} y={182} width={8} height={10} rx={2} fill="#F4A340" />

            {/* porte arrière qui s'ouvre pendant le chargement */}
            <motion.path
              d="M690 30 L724 44 L724 222 L690 234 Z"
              fill="#F3F5F7"
              stroke="#C3CCD3"
              strokeWidth={2}
              initial={false}
              animate={{ opacity: doorOpen ? 1 : 0, scaleX: doorOpen ? 1 : 0.2 }}
              style={{ originX: '690px' }}
              transition={{ duration: 0.35 }}
            />

            {/* ---------- CABINE ---------- */}
            {/* capucine (spoiler au-dessus de la cabine) */}
            <path d="M252 24 V74 H170 Q150 74 146 62 L140 40 Q138 26 154 26 Z" fill="#FFFFFF" stroke="#CBD3D9" strokeWidth={2} />
            <path d="M252 40 V58 H166 L160 40 Z" fill={Y} />
            <g stroke={N} strokeWidth={3} strokeLinecap="round">
              <path d="M178 46h18" />
              <path d="M184 52h14" />
            </g>
            <text x={204} y={55} fill={N} style={{ fontFamily: 'var(--font-archivo)', fontSize: 12 }}>
              48 H
            </text>

            <path
              d="M252 76 H142 Q130 76 125 86 L98 150 Q94 158 86 162 L80 165 Q72 170 72 180 V228 Q72 238 82 238 H252 Z"
              fill={`url(#body-${uid})`}
              stroke="#CBD3D9"
              strokeWidth={2}
            />
            {/* pare-brise + vitre latérale */}
            <path d="M140 86 L116 144 H156 V86 Z" fill={`url(#glass-${uid})`} stroke="#9FB4C2" strokeWidth={1.5} />
            <rect x={164} y={86} width={70} height={58} rx={6} fill={`url(#glass-${uid})`} stroke="#9FB4C2" strokeWidth={1.5} />
            <path d="M172 92 L196 92 L178 120 Z" fill="rgba(255,255,255,.45)" />
            {/* rétroviseur */}
            <rect x={150} y={98} width={8} height={24} rx={3} fill={N} />
            {/* portière */}
            <path d="M160 82 V226 M240 82 V226" stroke="#D3DAE0" strokeWidth={2} />
            <rect x={222} y={156} width={14} height={4} rx={2} fill="#9AA6AF" />
            {/* flocage portière */}
            <g transform="translate(170 162) scale(.62)">
              <path d="M3 24h9M6 31h7M2 38h11" stroke={N} strokeWidth="3" strokeLinecap="round" />
              <rect x="17" y="20" width="31" height="25" rx="3" fill={Y} stroke={N} strokeWidth="2.5" />
              <path d="M17 19.5 L23 9 H45 V4.5 L61 14 L45 23.5 V19.5 Z" fill={Y} stroke={N} strokeWidth="2.5" strokeLinejoin="round" />
            </g>
            <text x={170} y={210} fill={N} style={{ fontFamily: 'var(--font-archivo)', fontSize: 11.5 }} transform="skewX(-8) translate(30 0)">
              EXPRESS
            </text>
            <text x={170} y={221} fill={N} style={{ fontFamily: 'var(--font-mono)', fontSize: 7.5, letterSpacing: '0.14em' }}>
              DÉBARRAS · ROUEN
            </text>
            {/* phare, calandre, pare-chocs */}
            <rect x={74} y={172} width={20} height={12} rx={4} fill="#FFF6D6" stroke="#C9B26A" strokeWidth={1.5} />
            <rect x={72} y={190} width={10} height={20} rx={2} fill={N} />
            <path d="M66 214 H118 Q122 214 122 218 V232 Q122 236 118 236 H70 Q66 236 66 232 Z" fill="#22323D" />
            <rect x={68} y={218} width={12} height={6} rx={2} fill="#FFFFFF" />
            {/* clignotant latéral + ombre de toit */}
            <rect x={146} y={150} width={8} height={4} rx={2} fill="#F4A340" />
            <path d="M142 76 H252 V82 H139 Z" fill="rgba(14,42,59,.08)" />
            {/* bavette arrière */}
            <rect x={604} y={238} width={8} height={26} rx={2} fill="#16242E" />
            {/* marchepied */}
            <rect x={168} y={232} width={56} height={6} rx={2} fill="#9AA6AF" />

            {/* passages de roue */}
            {WHEELS.map((w) => (
              <path key={w.cx} d={`M${w.cx - 36} 238 A36 36 0 0 1 ${w.cx + 36} 238 Z`} fill="#16242E" />
            ))}
          </motion.g>

          {/* roues (non affaissées) */}
          {WHEELS.map((w) => (
            <Wheel key={w.cx} cx={w.cx} cy={w.cy} spin={spin} driving={driving} />
          ))}

          {/* gaz d'échappement à chaque ajout */}
          <AnimatePresence>
            {!reduce &&
              [0, 1, 2].map((i) => (
                <motion.circle
                  key={`${puff}-${i}`}
                  cx={700}
                  cy={256}
                  r={6 + i * 3}
                  fill="rgba(138,146,153,.35)"
                  initial={{ opacity: puff ? 0.8 : 0, x: 0, y: 0 }}
                  animate={{ opacity: 0, x: 26 + i * 14, y: -10 - i * 6, scale: 1.6 }}
                  transition={{ duration: 0.9, delay: i * 0.08 }}
                />
              ))}
          </AnimatePresence>
        </motion.g>
      </svg>

      {/* étiquettes */}
      {!bare && (
      <div className={cn('pointer-events-none absolute flex items-center gap-1.5', compact ? 'right-1 top-0' : 'right-0 top-0')}>
        <motion.span
          key={full ? 'full' : 'ok'}
          initial={reduce ? false : { scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={cn('rounded-full px-2.5 py-1 font-mono font-semibold shadow-soft', compact ? 'text-[10px]' : 'text-[11.5px]', full ? 'bg-[#B4442A] text-white' : 'bg-white text-navy ring-1 ring-line')}
        >
          {full ? `${fmtVol(Math.round(volume * 10) / 10)} · ${rotations} rotations` : `${fmtVol(Math.round(volume * 10) / 10)} · ${Math.round(pct * 100)} %`}
        </motion.span>
      </div>
      )}
      {!compact && !bare && (
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[13px] text-navy/70">
          <span>
            Camion de 20 m³ · <strong className="text-navy">{full ? `${rotations} allers-retours` : `reste ${fmtVol(Math.max(0, Math.round((TRUCK_M3 - volume) * 10) / 10))}`}</strong>
          </span>
          <span className="hidden items-center gap-1.5 sm:inline-flex">
            <span className="h-2 w-2 rounded-full bg-tri" /> Chargé de l’avant vers l’arrière, objets lourds au plancher
          </span>
        </div>
      )}
    </div>
  );
}
