import type { IllusId } from '@/lib/data';

/**
 * Objets en volume (perspective cavalière), sans contour : face avant, dessus éclairé, côté ombré.
 * Aucun dégradé ni identifiant SVG : sûr à répéter des centaines de fois sur une page.
 */

type Tone = [front: string, top: string, side: string];

const WOOD: Tone = ['#C98B4E', '#E2AA6E', '#9E6A37'];
const WOOD_D: Tone = ['#8C5A2E', '#A86F3B', '#6E4522'];
const YEL: Tone = ['#FFC21A', '#FFD866', '#D9A100'];
const NAVY: Tone = ['#1B3F55', '#2D5B77', '#0E2A3B'];
const WHITE: Tone = ['#F4F6F8', '#FFFFFF', '#CDD5DB'];
const KRAFT: Tone = ['#D9B47E', '#E9CB9C', '#B8915A'];
const GREEN: Tone = ['#2F9E6E', '#4DBB88', '#1F7A53'];
const DARK: Tone = ['#22323D', '#37505F', '#13202A'];

const DX = 0.62;
const DY = 0.46;

/** Pavé en perspective : x,y = coin haut-gauche de la face avant ; d = profondeur. */
function Box({ x, y, w, h, d, t }: { x: number; y: number; w: number; h: number; d: number; t: Tone }) {
  const dx = d * DX;
  const dy = d * DY;
  return (
    <g>
      <path d={`M${x} ${y}L${x + dx} ${y - dy}H${x + w + dx}L${x + w} ${y}Z`} fill={t[1]} />
      <path d={`M${x + w} ${y}L${x + w + dx} ${y - dy}V${y + h - dy}L${x + w} ${y + h}Z`} fill={t[2]} />
      <rect x={x} y={y} width={w} height={h} fill={t[0]} />
    </g>
  );
}

const Shadow = ({ cx = 33, w = 26, y = 58 }: { cx?: number; w?: number; y?: number }) => <ellipse cx={cx} cy={y} rx={w} ry={3.2} fill="rgba(14,42,59,.16)" />;
const Leg = ({ x, y, h = 4, c = '#6E4522' }: { x: number; y: number; h?: number; c?: string }) => <rect x={x} y={y} width={2.2} height={h} rx={0.6} fill={c} />;

function Sofa({ t, w = 46 }: { t: Tone; w?: number }) {
  const x = 32 - w / 2 - 3;
  return (
    <>
      <Shadow w={w / 2 + 6} />
      <Leg x={x + 3} y={52} />
      <Leg x={x + w - 5} y={52} />
      <Box x={x + 3} y={26} w={w - 6} h={16} d={8} t={t} />
      <Box x={x + 3} y={40} w={w - 6} h={12} d={9} t={t} />
      {/* coussins */}
      <rect x={x + 6} y={36} width={(w - 14) / 2} height={5} rx={2} fill={t[1]} />
      <rect x={x + 8 + (w - 14) / 2} y={36} width={(w - 14) / 2} height={5} rx={2} fill={t[1]} />
      <path d={`M${x + 4 + (w - 6) / 2} 41V52`} stroke={t[2]} strokeWidth={1.2} />
      <Box x={x} y={34} w={7} h={18} d={9} t={t} />
      <Box x={x + w - 7} y={34} w={7} h={18} d={9} t={t} />
    </>
  );
}

const ART: Record<IllusId, JSX.Element> = {
  sofa: <Sofa t={YEL} />,
  sofa2: <Sofa t={NAVY} w={36} />,
  armchair: (
    <>
      <Shadow w={17} />
      <Leg x={20} y={52} />
      <Leg x={38} y={52} />
      <Box x={21} y={24} w={20} h={18} d={8} t={YEL} />
      <Box x={21} y={40} w={20} h={12} d={9} t={YEL} />
      <rect x={23} y={36} width={16} height={5} rx={2} fill={YEL[1]} />
      <Box x={16} y={33} w={6} h={19} d={9} t={YEL} />
      <Box x={40} y={33} w={6} h={19} d={9} t={YEL} />
    </>
  ),
  wardrobe: (
    <>
      <Shadow w={18} />
      <Box x={16} y={10} w={26} h={46} d={9} t={WOOD} />
      <path d="M29 12V54" stroke={WOOD[2]} strokeWidth={1.2} />
      <rect x={25.5} y={30} width={1.8} height={6} rx={0.9} fill="#F4E3C8" />
      <rect x={30.7} y={30} width={1.8} height={6} rx={0.9} fill="#F4E3C8" />
      <rect x={16} y={50} width={26} height={2} fill={WOOD[2]} opacity={0.5} />
    </>
  ),
  dresser: (
    <>
      <Shadow w={19} />
      <Leg x={17} y={52} />
      <Leg x={41} y={52} />
      <Box x={15} y={24} w={30} h={28} d={10} t={WOOD} />
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <rect x={17} y={26.5 + i * 8.6} width={26} height={7} rx={1} fill={WOOD[1]} opacity={0.55} />
          <rect x={27} y={29.3 + i * 8.6} width={6} height={1.6} rx={0.8} fill="#F4E3C8" />
        </g>
      ))}
      <circle cx={47} cy={15} r={4} fill={GREEN[0]} />
      <rect x={45} y={16} width={4} height={4} fill={KRAFT[2]} />
    </>
  ),
  buffet: (
    <>
      <Shadow w={24} />
      <Leg x={10} y={51} h={5} />
      <Leg x={48} y={51} h={5} />
      <Box x={8} y={27} w={44} h={24} d={9} t={WOOD_D} />
      <path d="M22.7 29V49M37.3 29V49" stroke={WOOD_D[2]} strokeWidth={1.2} />
      <rect x={19} y={37} width={1.6} height={5} rx={0.8} fill="#E9CFA6" />
      <rect x={34} y={37} width={1.6} height={5} rx={0.8} fill="#E9CFA6" />
      <rect x={49} y={37} width={1.6} height={5} rx={0.8} fill="#E9CFA6" opacity={0} />
    </>
  ),
  shelf: (
    <>
      <Shadow w={18} />
      <Box x={16} y={8} w={26} h={48} d={8} t={WOOD} />
      <rect x={18.5} y={10.5} width={21} height={43} fill={WOOD[2]} />
      {[22.5, 34.5, 46.5].map((y) => (
        <rect key={y} x={18.5} y={y} width={21} height={2} fill={WOOD[1]} />
      ))}
      {/* livres */}
      <rect x={20} y={13} width={3} height={9.5} fill="#FFC21A" />
      <rect x={23.3} y={14.5} width={2.6} height={8} fill="#2F9E6E" />
      <rect x={26.2} y={12.5} width={3.2} height={10} fill="#F4F6F8" />
      <rect x={30} y={15} width={2.4} height={7.5} fill="#1B3F55" />
      <rect x={21} y={27} width={3} height={7.5} fill="#E0533A" />
      <rect x={24.4} y={26} width={2.6} height={8.5} fill="#F4F6F8" />
      <rect x={31} y={28} width={7} height={6.5} fill={KRAFT[0]} />
      <rect x={20} y={39} width={2.8} height={7.5} fill="#1B3F55" />
      <rect x={23.2} y={40} width={2.8} height={6.5} fill="#FFC21A" />
      <path d="M33 46.5 L36 39 L38.5 46.5Z" fill="#2F9E6E" />
    </>
  ),
  bed: (
    <>
      <Shadow w={27} />
      <Box x={6} y={22} w={8} h={34} d={10} t={WOOD_D} />
      <Box x={12} y={38} w={44} h={10} d={12} t={WHITE} />
      <Box x={24} y={36} w={32} h={10} d={12} t={NAVY} />
      <rect x={15} y={33} width={10} height={5} rx={2.5} fill="#FFFFFF" />
      <Box x={12} y={47} w={44} h={6} d={12} t={WOOD} />
      <Leg x={54} y={53} />
    </>
  ),
  single: (
    <>
      <Shadow w={24} />
      <Box x={9} y={26} w={7} h={30} d={8} t={WOOD} />
      <Box x={14} y={40} w={38} h={8} d={9} t={WHITE} />
      <Box x={26} y={38} w={26} h={8} d={9} t={YEL} />
      <rect x={17} y={35.5} width={8} height={4.5} rx={2.2} fill="#FFFFFF" />
      <Box x={14} y={47} w={38} h={5} d={9} t={WOOD} />
      <Leg x={50} y={52} />
    </>
  ),
  mattress: (
    <>
      <Shadow w={26} />
      <g transform="translate(0 6)">
        <Box x={6} y={36} w={44} h={11} d={18} t={WHITE} />
        {[0, 1, 2, 3, 4].map((i) => (
          <circle key={i} cx={14 + i * 7 + 6} cy={31} r={1} fill="#C2CBD2" />
        ))}
        {[0, 1, 2, 3].map((i) => (
          <circle key={i} cx={17 + i * 7 + 3} cy={35} r={1} fill="#C2CBD2" />
        ))}
        <rect x={6} y={40} width={44} height={2.2} fill="#1B3F55" opacity={0.85} />
      </g>
    </>
  ),
  table: (
    <>
      <Shadow w={26} />
      <Box x={6} y={30} w={36} h={3.5} d={14} t={WOOD} />
      <Leg x={8} y={33.5} h={22} c={WOOD[2]} />
      <Leg x={38} y={33.5} h={22} c={WOOD[2]} />
      <Leg x={16} y={27} h={22} c={WOOD_D[2]} />
      {/* chaise */}
      <Box x={44} y={20} w={3} h={20} d={8} t={WOOD_D} />
      <Box x={44} y={38} w={12} h={3} d={9} t={WOOD_D} />
      <Leg x={45} y={41} h={15} c={WOOD_D[2]} />
      <Leg x={53} y={41} h={15} c={WOOD_D[2]} />
    </>
  ),
  desk: (
    <>
      <Shadow w={26} />
      <Box x={6} y={32} w={46} h={3.5} d={12} t={WHITE} />
      <Leg x={8} y={35.5} h={20} c="#8A9299" />
      <Box x={34} y={35.5} w={18} h={20} d={11} t={WHITE} />
      <path d="M36 44H50" stroke="#CDD5DB" strokeWidth={1.2} />
      <rect x={41} y={39.5} width={4} height={1.3} rx={0.6} fill="#8A9299" />
      {/* écran */}
      <rect x={20} y={27} width={2.4} height={5} fill={DARK[1]} />
      <Box x={10} y={12} w={23} h={15} d={2} t={DARK} />
      <rect x={11.5} y={13.5} width={20} height={12} fill="#2D5B77" />
      <path d="M14 23 L24 15 H27 L17 23Z" fill="rgba(255,255,255,.25)" />
    </>
  ),
  fridge: (
    <>
      <Shadow w={17} />
      <Box x={18} y={8} w={24} h={48} d={10} t={WHITE} />
      <rect x={18} y={24} width={24} height={1.4} fill="#CDD5DB" />
      <rect x={21} y={13} width={1.8} height={8} rx={0.9} fill="#8A9299" />
      <rect x={21} y={29} width={1.8} height={14} rx={0.9} fill="#8A9299" />
      <rect x={34} y={30} width={5} height={4} rx={0.6} fill="#FFC21A" />
      <rect x={33} y={36} width={4} height={4} rx={0.6} fill="#2F9E6E" />
    </>
  ),
  washer: (
    <>
      <Shadow w={18} />
      <Box x={16} y={18} w={28} h={38} d={11} t={WHITE} />
      <rect x={16} y={18} width={28} height={7} fill="#E6EBEE" />
      <circle cx={22} cy={21.5} r={1.6} fill="#2F9E6E" />
      <rect x={30} y={20.6} width={11} height={2} rx={1} fill="#8A9299" />
      <circle cx={30} cy={40} r={10.5} fill="#B9C3CA" />
      <circle cx={30} cy={40} r={8} fill="#1B3F55" />
      <path d="M24.5 37 Q30 31 35 36" stroke="rgba(255,255,255,.4)" strokeWidth={2} fill="none" strokeLinecap="round" />
    </>
  ),
  stove: (
    <>
      <Shadow w={18} />
      <Box x={16} y={20} w={28} h={36} d={12} t={WHITE} />
      {/* plaques sur le dessus */}
      {[
        [22, 16.5],
        [31, 16.5],
        [27, 13],
        [36, 13],
      ].map(([cx, cy]) => (
        <ellipse key={`${cx}-${cy}`} cx={cx + 1} cy={cy} rx={3.2} ry={1.5} fill={DARK[0]} />
      ))}
      <rect x={16} y={20} width={28} height={6} fill="#E6EBEE" />
      {[20, 25, 30, 35, 40].map((x) => (
        <circle key={x} cx={x} cy={23} r={1.3} fill="#8A9299" />
      ))}
      <rect x={19} y={30} width={22} height={20} rx={2} fill={DARK[0]} />
      <rect x={21} y={32} width={18} height={10} rx={1} fill="#37505F" />
      <rect x={22} y={28.2} width={16} height={1.4} rx={0.7} fill="#8A9299" />
    </>
  ),
  bike: (
    <>
      <Shadow w={26} y={57} />
      <circle cx={16} cy={42} r={12} fill="none" stroke={DARK[0]} strokeWidth={3} />
      <circle cx={48} cy={42} r={12} fill="none" stroke={DARK[0]} strokeWidth={3} />
      <circle cx={16} cy={42} r={8} fill="none" stroke="#C2CBD2" strokeWidth={0.8} />
      <circle cx={48} cy={42} r={8} fill="none" stroke="#C2CBD2" strokeWidth={0.8} />
      <path d="M16 42 L26 26 H44 L48 42 M26 26 L33 42 H31 M44 26 L42 19" stroke="#FFC21A" strokeWidth={3.2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M33 42 L44 26" stroke="#E0A400" strokeWidth={3} strokeLinecap="round" />
      <path d="M21 21 H30" stroke={DARK[0]} strokeWidth={3.6} strokeLinecap="round" />
      <path d="M39 18 H46" stroke={DARK[0]} strokeWidth={2.4} strokeLinecap="round" />
      <circle cx={33} cy={42} r={2.4} fill={DARK[1]} />
    </>
  ),
  tv: (
    <>
      <Shadow w={16} />
      <path d="M26 46 L22 55 H42 L38 46Z" fill={DARK[1]} />
      <Box x={6} y={12} w={50} h={33} d={3} t={DARK} />
      <rect x={8} y={14} width={46} height={29} fill="#24465C" />
      <path d="M12 39 L34 16 H44 L22 39Z" fill="rgba(255,255,255,.12)" />
      <circle cx={51} cy={41} r={0.9} fill="#2F9E6E" />
    </>
  ),
  box: (
    <>
      <Shadow w={20} />
      <Box x={12} y={28} w={30} h={26} d={16} t={KRAFT} />
      {/* scotch */}
      <path d={`M${12 + 13} 28 L${12 + 13 + 16 * DX} ${28 - 16 * DY} H${12 + 17 + 16 * DX} L${12 + 17} 28Z`} fill="#FFC21A" opacity={0.9} />
      <rect x={25} y={28} width={4} height={9} fill="#FFC21A" opacity={0.9} />
      <rect x={16} y={42} width={10} height={6} rx={0.6} fill="#F6EAD2" />
      <path d="M17.5 44H24.5M17.5 46H22" stroke="#B8915A" strokeWidth={0.8} />
    </>
  ),
  bag: (
    <>
      <Shadow w={16} />
      <path d="M18 54 Q12 40 20 28 L26 22 H38 L44 28 Q52 40 46 54 Z" fill="#22323D" />
      <path d="M24 30 Q22 42 25 52" stroke="#37505F" strokeWidth={2} fill="none" strokeLinecap="round" />
      <path d="M38 30 Q41 40 38 50" stroke="#13202A" strokeWidth={2} fill="none" strokeLinecap="round" />
      <path d="M27 22 Q32 26 37 22 L39 13 Q35 17 32 14 Q29 17 25 13 Z" fill="#37505F" />
      <rect x={28} y={20} width={8} height={3} rx={1.5} fill="#FFC21A" />
    </>
  ),
  lamp: (
    <>
      <Shadow w={11} />
      <ellipse cx={32} cy={55} rx={8} ry={2.4} fill={DARK[0]} />
      <rect x={31} y={22} width={2.2} height={33} fill="#8A9299" />
      <path d="M21 22 H43 L39 8 H25 Z" fill={YEL[0]} />
      <path d="M39 8 L43 22 H40 L36.5 8Z" fill={YEL[2]} />
      <ellipse cx={32} cy={8} rx={7} ry={1.6} fill={YEL[1]} />
      <path d="M24 24 L18 40 H46 L40 24Z" fill="rgba(255,216,102,.18)" />
    </>
  ),
};

export function Illus({ id, className, title }: { id: IllusId; className?: string; title?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} role={title ? 'img' : undefined} aria-hidden={title ? undefined : true}>
      {title && <title>{title}</title>}
      {ART[id]}
    </svg>
  );
}
