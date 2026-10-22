'use client';
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform, type MotionValue } from 'framer-motion';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { Illus } from '@/components/illus/Illus';
import { ArrowRight, Camera, Check } from 'lucide-react';
import { HazardStripe } from '@/components/ui/HazardStripe';
import { BRAND, SITUATIONS, type IllusId, type SituationId } from '@/lib/data';
import { EASE } from '@/lib/motion';
import { prefillSim } from '@/lib/sim-store';
import { scrollToEl } from '@/lib/scroll';
import { PhoneChat } from './PhoneChat';
import { HeroTruck } from './HeroTruck';

const LINES = ['Vos affaires vous encombrent.', 'Pas besoin de déchetterie.'];

type Tile = { id: IllusId; x: string; y: string; size: number; r: number; depth: number; back?: boolean; dur: number; delay: number; label: string };
const TILES: Tile[] = [
  { id: 'sofa', label: 'Canapé', x: '1%', y: '360px', size: 124, r: -8, depth: 26, dur: 7, delay: 0 },
  { id: 'fridge', label: 'Réfrigérateur', x: '88%', y: '320px', size: 112, r: 7, depth: 22, dur: 8.5, delay: -2 },
  { id: 'box', label: 'Carton', x: '10%', y: '560px', size: 104, r: 6, depth: 30, dur: 9, delay: -4 },
  { id: 'mattress', label: 'Matelas', x: '80%', y: '540px', size: 108, r: -6, depth: 24, dur: 6.5, delay: -1 },
  { id: 'bike', label: 'Vélo', x: '18%', y: '-6px', size: 74, r: 10, depth: 10, back: true, dur: 10, delay: -3 },
  { id: 'lamp', label: 'Lampe', x: '74%', y: '-14px', size: 70, r: -12, depth: 8, back: true, dur: 9.5, delay: -6 },
];

function FloatingTile({ t, mx, my }: { t: Tile; mx: MotionValue<number>; my: MotionValue<number> }) {
  const x = useTransform(mx, (v) => v * t.depth);
  const y = useTransform(my, (v) => v * t.depth);
  return (
    <motion.div
      aria-hidden
      className="pointer-events-auto absolute hidden md:block"
      style={{ left: t.x, top: t.y, x, y, zIndex: t.back ? 0 : 2 }}
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: t.back ? 0.55 : 1, scale: 1 }}
      transition={{ duration: 0.9, ease: EASE, delay: 0.4 + Math.abs(t.delay) * 0.06 }}
    >
      <div
        className="animate-float"
        style={{ ['--dur' as string]: `${t.dur}s`, ['--r' as string]: `${t.r}deg`, animationDelay: `${t.delay}s` } as React.CSSProperties}
      >
        <motion.div
          whileHover={{ rotate: [0, -8, 7, -4, 0], scale: 1.12 }}
          transition={{ duration: 0.6 }}
          className="grid cursor-grab place-items-center rounded-[28%] bg-white shadow-lift ring-1 ring-navy/5"
          style={{
            width: `clamp(${Math.round(t.size * 0.62)}px, ${t.size / 12}vw, ${t.size}px)`,
            height: `clamp(${Math.round(t.size * 0.62)}px, ${t.size / 12}vw, ${t.size}px)`,
            filter: t.back ? 'blur(1.5px)' : undefined,
          }}
        >
          <Illus id={t.id} className="h-[84%] w-[84%]" />
        </motion.div>
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
                className="animate-float grid h-14 w-14 place-items-center rounded-2xl bg-white shadow-soft ring-1 ring-navy/5"
                style={{ ['--dur' as string]: `${6 + i * 1.3}s`, ['--r' as string]: `${[-8, 6, -4, 8][i]}deg`, animationDelay: `${-i}s` } as React.CSSProperties}
              >
                <Illus id={id} className="h-11 w-11" />
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

          <div style={{ animationDelay: '1s' }} data-tour="hero-cta" className="anim-fade-up mt-9 flex flex-col items-center gap-4">
            <div className="flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row">
              <a
                href="#simulateur"
                className="btn-shine group inline-flex h-16 w-full items-center justify-center gap-2.5 rounded-btn bg-signal px-9 text-[17px] font-bold text-navy shadow-signal transition-all duration-300 hover:-translate-y-1 hover:shadow-signal-lg sm:w-auto"
              >
                Obtenir mon prix gratuit
                <span className="grid h-8 w-8 place-items-center rounded-full bg-navy text-signal transition-transform duration-300 group-hover:translate-x-1">
                  <ArrowRight className="h-4 w-4" />
                </span>
              </a>
              <a
                href={`https://wa.me/33${BRAND.whatsapp.replace(/\s/g, '').slice(1)}?text=${encodeURIComponent('Bonjour, voici mes photos pour un débarras :')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex h-16 w-full items-center justify-center gap-2.5 rounded-btn bg-white px-6 text-[16px] font-semibold text-navy ring-1 ring-inset ring-navy/15 transition-all duration-300 hover:-translate-y-1 hover:shadow-soft hover:ring-navy/40 sm:w-auto"
              >
                <span className="relative grid h-8 w-8 place-items-center rounded-full bg-tri text-white">
                  <span className="ping-soft absolute inset-0 rounded-full bg-tri" />
                  <Camera className="relative h-4 w-4" />
                </span>
                Envoyer une photo
              </a>
            </div>
            <p className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[13.5px] font-medium text-navy/70">
              {['Gratuit', 'Sans engagement', 'Prix fixe en 1 h'].map((x) => (
                <span key={x} className="inline-flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-tri-dark" strokeWidth={3} /> {x}
                </span>
              ))}
            </p>
          </div>

          <div
            style={{ animationDelay: '1.12s' }}
            data-tour="hero-start"
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
          <HeroTruck />
        </div>
      </div>

      <div className="relative mt-16 md:mt-24">
        <PhoneChat />
      </div>
      <HazardStripe className="relative z-[2] -mt-6 h-4" />
    </section>
  );
}
