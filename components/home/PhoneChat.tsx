'use client';
import { AnimatePresence, motion, useInView, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { CheckCheck, Clock, Zap } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Illus } from '@/components/illus/Illus';
import { LogoTile } from '@/components/brand/Logo';
import { Phone } from '@/components/ui/Phone';

const STEPS = [700, 1700, 3300, 4900, 5900]; // apparition de chaque message (ms)
const LOOP = 9500;

const bubble = {
  initial: { opacity: 0, y: 12, scale: 0.96 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring' as const, stiffness: 380, damping: 28 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

function Photo({ id, bg }: { id: 'box' | 'bike' | 'dresser'; bg: string }) {
  return (
    <div className="grid aspect-square place-items-center rounded-lg" style={{ background: bg }}>
      <Illus id={id} className="h-3/5 w-3/5 opacity-90" />
    </div>
  );
}

export function PhoneChat() {
  const wrap = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const inView = useInView(wrap, { margin: '-10% 0px' });
  const [stage, setStage] = useState(reduce ? 5 : 0);
  const { scrollYProgress } = useScroll({ target: wrap, offset: ['start end', 'center center'] });
  const rotateX = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [22, 4]);
  const scale = useTransform(scrollYProgress, [0, 1], reduce ? [1, 1] : [0.9, 1]);

  useEffect(() => {
    if (reduce) return setStage(5);
    if (!inView) return;
    let timers: ReturnType<typeof setTimeout>[] = [];
    const run = () => {
      setStage(0);
      timers = STEPS.map((t, i) => setTimeout(() => setStage(i + 1), t));
      timers.push(setTimeout(run, LOOP));
    };
    run();
    return () => timers.forEach(clearTimeout);
  }, [inView, reduce]);

  return (
    <div ref={wrap} className="relative mx-auto max-w-[960px] px-4 [perspective:1400px]">
      {/* cartes latérales */}
      <div aria-hidden className="absolute left-0 top-24 z-10 hidden rotate-[-4deg] rounded-2xl bg-white p-4 shadow-lift ring-1 ring-line md:block lg:left-8">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-signal"><Zap className="h-5 w-5" /></span>
          <div>
            <p className="text-[13px] text-navy/70">Prix fixe reçu en</p>
            <p className="font-display text-[22px] tight">47 min</p>
          </div>
        </div>
      </div>
      <div aria-hidden className="absolute right-0 top-64 z-10 hidden rotate-[5deg] rounded-2xl bg-white p-4 shadow-lift ring-1 ring-line md:block lg:right-8">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-tri-soft text-tri"><Clock className="h-5 w-5" /></span>
          <div>
            <p className="text-[13px] text-navy/70">Cave vidée</p>
            <p className="font-display text-[22px] tight">Jeudi 14 h</p>
          </div>
        </div>
      </div>

      <motion.div style={{ rotateX, scale, transformOrigin: 'center top' }} className="relative mx-auto w-fit">
        {/* tampon */}
        <div
          aria-hidden
          className="absolute -left-10 -top-6 z-30 rotate-[-12deg] rounded-md border-[3px] border-double border-navy bg-white/85 px-3 py-2 font-mono text-[10.5px] font-bold uppercase leading-tight tracking-[0.12em] text-navy shadow-soft backdrop-blur sm:-left-16 sm:text-[12px]"
        >
          Déconseillé par
          <br />
          les déchetteries
        </div>

        <Phone>
          <div className="flex h-full flex-col">
            <div className="flex items-center gap-2.5 bg-navy px-4 pb-3 pt-12 text-white">
              <LogoTile className="h-9 w-9 ring-1 ring-white/20" />
              <div className="leading-tight">
                <p className="text-[14px] font-semibold">Express Débarras</p>
                <p className="text-[11.5px] text-white/60">{stage >= 2 && stage < 3 ? 'écrit…' : 'en ligne'}</p>
              </div>
            </div>

            <div className="flex flex-1 flex-col gap-2.5 overflow-hidden px-3 py-4 text-[13.5px]" aria-live="off">
              <p className="mx-auto rounded-full bg-white/80 px-2.5 py-0.5 text-[11px] text-navy/70">Aujourd’hui</p>
              <AnimatePresence>
                {stage >= 1 && (
                  <motion.div key="photos" {...bubble} className="ml-auto w-[78%] rounded-2xl rounded-tr-md bg-[#DDF3D0] p-1.5 shadow-sm">
                    <div className="grid grid-cols-3 gap-1">
                      <Photo id="box" bg="linear-gradient(135deg,#C9BFA8,#8E8370)" />
                      <Photo id="bike" bg="linear-gradient(135deg,#A9B7C2,#6E7D88)" />
                      <Photo id="dresser" bg="linear-gradient(135deg,#C8B49A,#8B765E)" />
                    </div>
                    <p className="px-1.5 pb-0.5 pt-1.5 text-navy">Bonjour, ma cave à vider. Combien ?</p>
                    <p className="flex items-center justify-end gap-1 px-1 text-[10px] text-navy/70">
                      19:42 <CheckCheck className="h-3 w-3 text-[#3A8DDE]" />
                    </p>
                  </motion.div>
                )}
                {stage === 2 && (
                  <motion.div key="typing" {...bubble} className="flex w-fit gap-1 rounded-2xl rounded-tl-md bg-white px-3.5 py-3 shadow-sm">
                    {[0, 1, 2].map((d) => (
                      <motion.span
                        key={d}
                        className="h-1.5 w-1.5 rounded-full bg-navy/40"
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 0.8, repeat: Infinity, delay: d * 0.15 }}
                      />
                    ))}
                  </motion.div>
                )}
                {stage >= 3 && (
                  <motion.div key="reply" {...bubble} className="w-[80%] rounded-2xl rounded-tl-md bg-white p-2.5 shadow-sm">
                    <p className="text-navy/70">Merci ! Environ 6 m³. Notre prix fixe :</p>
                    <div className="mt-2 rounded-xl bg-navy p-3 text-white">
                      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-signal">Express Pièce</p>
                      <p className="mt-1 font-display text-[26px] leading-none tight">349 € TTC</p>
                      <p className="mt-1.5 text-[12.5px] text-white/75">Jeudi 14 h ?</p>
                    </div>
                    <p className="mt-1 text-right text-[10px] text-navy/70">20:29</p>
                  </motion.div>
                )}
                {stage >= 4 && (
                  <motion.div key="ok" {...bubble} className="ml-auto w-fit rounded-2xl rounded-tr-md bg-[#DDF3D0] px-3 py-2 shadow-sm">
                    <p className="text-navy">Parfait 👍</p>
                  </motion.div>
                )}
                {stage >= 5 && (
                  <motion.p key="done" {...bubble} className="mx-auto mt-1 flex items-center gap-1.5 rounded-full bg-tri-dark px-3 py-1 text-[11.5px] font-semibold text-white">
                    <CheckCheck className="h-3.5 w-3.5" /> Réservé · jeudi 14 h
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            <div className="flex items-center gap-2 bg-white/70 px-3 py-3">
              <div aria-hidden className="h-9 flex-1 rounded-full bg-white ring-1 ring-line" />
              <span className="h-9 w-9 rounded-full bg-tri" />
            </div>
          </div>
        </Phone>
      </motion.div>
    </div>
  );
}
