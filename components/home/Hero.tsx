'use client';
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform, type MotionValue } from 'framer-motion';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { Illus } from '@/components/illus/Illus';
import { ButtonLink } from '@/components/ui/Button';
import { HazardStripe } from '@/components/ui/HazardStripe';
import { SITUATIONS, type IllusId, type SituationId } from '@/lib/data';
import { EASE } from '@/lib/motion';
import { prefillSim } from '@/lib/sim-store';
import { scrollToEl } from '@/lib/scroll';
import { PhoneChat } from './PhoneChat';

const LINES = ['Vos affaires vous encombrent.', 'Pas besoin de déchetterie.'];

type Tile = { id: IllusId; x: string; y: string; size: number; r: number; depth: number; back?: boolean; dur: number; delay: number; label: string };
const TILES: Tile[] = [
  { id: 'sofa', label: 'Canapé', x: '3%', y: '50%', size: 92, r: -8, depth: 26, dur: 7, delay: 0 },
  { id: 'fridge', label: 'Réfrigérateur', x: '88%', y: '46%', size: 86, r: 7, depth: 22, dur: 8.5, delay: -2 },
  { id: 'box', label: 'Carton', x: '12%', y: '74%', size: 80, r: 6, depth: 30, dur: 9, delay: -4 },
  { id: 'mattress', label: 'Matelas', x: '80%', y: '72%', size: 84, r: -6, depth: 24, dur: 6.5, delay: -1 },
  { id: 'bike', label: 'Vélo', x: '20%', y: '0%', size: 58, r: 10, depth: 10, back: true, dur: 10, delay: -3 },
  { id: 'lamp', label: 'Lampe', x: '74%', y: '-1%', size: 54, r: -12, depth: 8, back: true, dur: 9.5, delay: -6 },
  { id: 'wardrobe', label: 'Armoire', x: '24%', y: '56%', size: 52, r: 12, depth: 8, back: true, dur: 8, delay: -5 },
  { id: 'tv', label: 'Télévision', x: '68%', y: '58%', size: 56, r: -9, depth: 12, back: true, dur: 7.5, delay: -2.5 },
];

function FloatingTile({ t, mx, my }: { t: Tile; mx: MotionValue<number>; my: MotionValue<number> }) {
  const x = useTransform(mx, (v) => v * t.depth);
  const y = useTransform(my, (v) => v * t.depth);
  return (
    <motion.div
      aria-hidden
      className="absolute hidden md:block"
      style={{ left: t.x, top: t.y, x, y, zIndex: t.back ? 0 : 2 }}
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: t.back ? 0.55 : 1, scale: 1 }}
      transition={{ duration: 0.9, ease: EASE, delay: 0.4 + Math.abs(t.delay) * 0.06 }}
    >
      <div
        className="animate-float"
        style={{ ['--dur' as string]: `${t.dur}s`, ['--r' as string]: `${t.r}deg`, animationDelay: `${t.delay}s` } as React.CSSProperties}
      >
        <div
          className="grid place-items-center rounded-[26%] bg-white shadow-lift ring-1 ring-navy/5"
          style={{
            width: `clamp(${Math.round(t.size * 0.62)}px, ${t.size / 12}vw, ${t.size}px)`,
            height: `clamp(${Math.round(t.size * 0.62)}px, ${t.size / 12}vw, ${t.size}px)`,
            filter: t.back ? 'blur(1.5px)' : undefined,
          }}
        >
          <Illus id={t.id} className="h-[68%] w-[68%]" />
        </div>
      </div>
    </motion.div>
  );
}

export function Hero() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const mx = useSpring(rawX, { stiffness: 60, damping: 18 });
  const my = useSpring(rawY, { stiffness: 60, damping: 18 });
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (reduce) return;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      rawX.set((e.clientX / window.innerWidth - 0.5) * -1);
      rawY.set((e.clientY / window.innerHeight - 0.5) * -1);
    };
    window.addEventListener('pointermove', onMove);
    return () => window.removeEventListener('pointermove', onMove);
  }, [reduce, rawX, rawY]);

  const pick = (id: SituationId) => {
    prefillSim({ situation: id });
    if (pathname === '/') {
      requestAnimationFrame(() => scrollToEl(document.getElementById('simulateur')));
    } else router.push('/simulateur');
  };

  let w = 0;
  const word = (text: string, extra = '') =>
    text.split(' ').map((wd) => {
      const i = w++;
      return (
        <span key={i}>
          <span className="inline-block overflow-hidden pb-[0.08em] align-bottom">
          <span className={`anim-rise inline-block ${extra}`} style={{ animationDelay: `${0.05 + i * 0.06}s` }}>
            {wd}
          </span>
          </span>{' '}
        </span>
      );
    });

  return (
    <section className="relative overflow-hidden bg-white pt-28 md:pt-36" aria-labelledby="hero-title">
      {/* halo de fond */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[720px] bg-[radial-gradient(60%_50%_at_50%_30%,#FFF4D1_0%,rgba(255,244,209,0)_70%)]" />

      <div ref={ref} className="relative mx-auto max-w-[1280px] px-4 sm:px-6">
        <div className="pointer-events-none absolute inset-0">
          {TILES.map((t) => (
            <FloatingTile key={t.id} t={t} mx={mx} my={my} />
          ))}
        </div>

        <div className="relative z-[3] mx-auto max-w-[1240px] text-center">
          <div aria-hidden className="mb-6 flex justify-center gap-3 md:hidden">
            {(['sofa', 'fridge', 'box', 'mattress'] as IllusId[]).map((id, i) => (
              <motion.span
                key={id}
                initial={reduce ? false : { opacity: 0, y: 12, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.3 + i * 0.08, duration: 0.6, ease: EASE }}
                className="animate-float grid h-12 w-12 place-items-center rounded-2xl bg-white shadow-soft ring-1 ring-navy/5"
                style={{ ['--dur' as string]: `${6 + i * 1.3}s`, ['--r' as string]: `${[-8, 6, -4, 8][i]}deg`, animationDelay: `${-i}s` } as React.CSSProperties}
              >
                <Illus id={id} className="h-8 w-8" />
              </motion.span>
            ))}
          </div>
          <p className="anim-fade-up mx-auto mb-7 inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 font-mono text-label uppercase text-navy shadow-soft ring-1 ring-line">
            <span className="h-2 w-2 rounded-full bg-tri" /> Rouen · Métropole · 7 j / 7
          </p>

          <h1 id="hero-title" className="font-display text-navy [font-size:clamp(2.6rem,0.55rem+4.45vw,4.9rem)] [letter-spacing:-0.045em] [line-height:0.95]">
            {LINES.map((l) => (
              <span key={l} className="block text-navy/90">
                {word(l)}
              </span>
            ))}
            <span
              className="anim-hl relative mt-[0.06em] inline [-webkit-box-decoration-break:clone] [box-decoration-break:clone]"
              style={{ backgroundImage: 'linear-gradient(#FFC21A,#FFC21A)', backgroundRepeat: 'no-repeat', backgroundPosition: '0 88%', backgroundSize: '100% 62%', animationDelay: '0.8s' }}
            >
              {word('Elle vient à vous.', 'text-navy')}
            </span>
          </h1>

          <p className="mx-auto mt-7 max-w-[560px] text-body-lg text-navy/75">
            Envoyez vos photos, recevez un <strong className="font-semibold text-navy">prix fixe en moins d’1 h</strong>, on débarrasse{' '}
            <strong className="font-semibold text-navy">sous 48 h</strong>.
          </p>

          <div style={{ animationDelay: '1s' }} className="anim-fade-up mt-8 flex flex-col items-center gap-3">
            <ButtonLink href="#simulateur" arrow className="px-8">
              Estimer mon prix
            </ButtonLink>
            <p className="text-[13.5px] text-navy/70">Gratuit · sans engagement · réponse en 1 h</p>
          </div>

          <div
            style={{ animationDelay: '1.12s' }}
            className="anim-fade-up mx-auto mt-12 max-w-[760px] rounded-card bg-white/90 p-4 shadow-soft ring-1 ring-line backdrop-blur sm:p-5"
          >
            <p className="text-[15px] text-navy">
              <span className="font-mono text-label uppercase text-signal-dark">Commencez ici</span>
              <span className="mx-2 text-beton">·</span>
              <span className="font-semibold">Que voulez-vous débarrasser ?</span>
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {SITUATIONS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => pick(s.id)}
                  className="group inline-flex h-11 items-center gap-2 rounded-full bg-kraft px-4 text-[14.5px] font-semibold text-navy ring-1 ring-inset ring-transparent transition-all hover:-translate-y-0.5 hover:bg-signal hover:shadow-signal focus-visible:bg-signal"
                >
                  {s.label}
                  <span className="text-[12px] font-medium text-navy/70 transition-colors group-hover:text-navy/70">{s.hint}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="relative mt-16 md:mt-24">
        <PhoneChat />
      </div>
      <HazardStripe className="relative z-[2] -mt-6 h-4" />
    </section>
  );
}
