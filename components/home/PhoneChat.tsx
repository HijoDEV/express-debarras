'use client';
import { AnimatePresence, motion, useInView, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { BadgeCheck, Camera, CheckCheck, Clock, Mic, Plus, Recycle, SendHorizontal, Truck as TruckIcon, Zap } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { LogoTile } from '@/components/brand/Logo';
import { Phone } from '@/components/ui/Phone';
import { cn } from '@/lib/cn';
import { photo, type PhotoKey } from '@/lib/photos';

/* ---------- Scénario (ms depuis le début de la boucle) ---------- */
const TYPED = 'Bonjour ! Cave à vider à Rouen, combien ?';
const T = {
  type: 500, // début de la frappe
  send1: 2300, // envoi du texte
  photos: 3000, // envoi des photos
  typing: 3900,
  reply: 5300,
  quote: 6100,
  tap: 7800,
  ok: 8500,
  confirm: 9400,
  day: 10900,
  route: 11300,
  report: 13600,
  end: 17500,
};
const STAGES = [
  { at: T.photos, label: 'Photos' },
  { at: T.quote, label: 'Prix fixe' },
  { at: T.confirm, label: 'Réservé' },
  { at: T.report, label: 'Rapport' },
];

const bubble = {
  initial: { opacity: 0, y: 14, scale: 0.94 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring' as const, stiffness: 420, damping: 30 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

function Photo({ k }: { k: PhotoKey }) {
  return (
    <div className="relative aspect-square overflow-hidden rounded-[10px] bg-[#6E6455]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photo(k, 200, 200)} alt="" width={100} height={100} loading="lazy" decoding="async" className="h-full w-full object-cover" />
    </div>
  );
}

function Tap({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.span
          className="pointer-events-none absolute left-1/2 top-1/2 z-10 h-9 w-9 -translate-x-1/2 -translate-y-1/2 rounded-full bg-navy/25"
          initial={{ scale: 0.4, opacity: 0.9 }}
          animate={{ scale: 1.8, opacity: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
        />
      )}
    </AnimatePresence>
  );
}

export function PhoneChat() {
  const wrap = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const inView = useInView(wrap, { margin: '-15% 0px' });
  const [t, setT] = useState(reduce ? T.end : 0);
  const { scrollYProgress } = useScroll({ target: wrap, offset: ['start end', 'center center'] });
  const rotateX = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [24, 0]);
  const rotateZ = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [-4, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], reduce ? [1, 1] : [0.88, 1]);

  // horloge du scénario
  useEffect(() => {
    if (reduce) return setT(T.end);
    if (!inView) return;
    let raf = 0;
    let start = performance.now() - t;
    const tick = (now: number) => {
      let el = now - start;
      if (el > T.end + 1800) {
        start = now;
        el = 0;
      }
      const q = Math.floor(el / 60) * 60; // ~16 rendus / s suffisent
      setT((prev) => (prev === q ? prev : q));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, reduce]);

  const at = (k: number) => t >= k;
  const typed = at(T.send1) ? '' : TYPED.slice(0, Math.max(0, Math.floor((t - T.type) / 40)));
  const picked = at(T.tap);
  const routePct = Math.min(1, Math.max(0, (t - T.route - 300) / 1800));
  const ring = Math.min(68, Math.max(0, Math.round(((t - T.report - 200) / 1200) * 68)));
  const stage = STAGES.reduce((acc, s, i) => (t >= s.at ? i : acc), -1);

  return (
    <div ref={wrap} className="relative mx-auto max-w-[1060px] px-4 [perspective:1600px]">
      {/* ---------- cartes latérales synchronisées ---------- */}
      <div className="pointer-events-none absolute inset-0 hidden md:block" aria-hidden>
        <AnimatePresence>
          {at(T.quote) && (
            <motion.div
              key="c1"
              initial={{ opacity: 0, x: -30, rotate: -8 }}
              animate={{ opacity: 1, x: 0, rotate: -4 }}
              exit={{ opacity: 0 }}
              className="absolute left-0 top-28 rounded-2xl bg-white p-4 pr-6 shadow-lift ring-1 ring-line lg:left-6"
            >
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-signal">
                  <Zap className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-[13px] text-navy/70">Prix fixe reçu en</p>
                  <p className="font-display text-[24px] leading-none tight">47 min</p>
                </div>
              </div>
            </motion.div>
          )}
          {at(T.confirm) && (
            <motion.div
              key="c2"
              initial={{ opacity: 0, x: 30, rotate: 8 }}
              animate={{ opacity: 1, x: 0, rotate: 4 }}
              exit={{ opacity: 0 }}
              className="absolute right-0 top-56 rounded-2xl bg-white p-4 pr-6 shadow-lift ring-1 ring-line lg:right-6"
            >
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-tri-soft text-tri-dark">
                  <Clock className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-[13px] text-navy/70">Créneau réservé</p>
                  <p className="font-display text-[24px] leading-none tight">Jeudi 14 h</p>
                </div>
              </div>
            </motion.div>
          )}
          {at(T.report) && (
            <motion.div
              key="c3"
              initial={{ opacity: 0, x: -30, rotate: -6 }}
              animate={{ opacity: 1, x: 0, rotate: 3 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-40 left-8 rounded-2xl bg-white p-4 pr-6 shadow-lift ring-1 ring-line lg:left-20"
            >
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-tri text-white">
                  <Recycle className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-[13px] text-navy/70">Rapport de tri</p>
                  <p className="font-display text-[24px] leading-none tight">68 % valorisé</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <motion.div style={{ rotateX, rotateZ, scale, transformOrigin: 'center top' }} className="relative mx-auto w-fit">
        {/* tampon */}
        <motion.div
          aria-hidden
          initial={reduce ? false : { scale: 1.6, opacity: 0, rotate: -20 }}
          whileInView={{ scale: 1, opacity: 1, rotate: -12 }}
          viewport={{ once: true, margin: '-20% 0px' }}
          transition={{ type: 'spring', stiffness: 260, damping: 14, delay: 0.3 }}
          className="absolute -left-12 -top-5 z-50 rounded-md border-[3px] border-double border-navy bg-white/90 px-3 py-2 font-mono text-[10.5px] font-bold uppercase leading-tight tracking-[0.12em] text-navy shadow-soft backdrop-blur sm:-left-20 sm:text-[12px]"
        >
          Déconseillé par
          <br />
          les déchetteries
        </motion.div>

        <Phone>
          <div className="flex h-full flex-col">
            {/* en-tête de conversation */}
            <div className="relative z-20 flex items-center gap-2.5 border-b border-black/5 bg-white/90 px-4 pb-3 pt-[54px] backdrop-blur">
              <LogoTile className="h-10 w-10" />
              <div className="min-w-0 flex-1 leading-tight">
                <p className="flex items-center gap-1 text-[14.5px] font-semibold text-navy">
                  Express Débarras <BadgeCheck className="h-4 w-4 fill-tri text-white" />
                </p>
                <p className="text-[11.5px] text-navy/60">{at(T.typing) && !at(T.reply) ? 'écrit…' : 'en ligne · répond en moins d’1 h'}</p>
              </div>
            </div>

            {/* fil */}
            <div
              className="relative flex flex-1 flex-col justify-end gap-2 overflow-hidden bg-[#EFEAE0] px-3 pb-2 pt-3 text-[13.5px]"
              style={{ backgroundImage: 'radial-gradient(rgba(14,42,59,.05) 1px, transparent 1.2px)', backgroundSize: '14px 14px' }}
              aria-hidden
            >
              <AnimatePresence initial={false}>
                <motion.p key="day" layout className="mx-auto rounded-full bg-white/85 px-2.5 py-0.5 text-[11px] text-navy/60 shadow-sm">
                  Lundi
                </motion.p>

                {at(T.send1) && (
                  <motion.div key="m1" layout {...bubble} className="ml-auto max-w-[78%] rounded-2xl rounded-br-md bg-[#D9F5C7] px-3 py-2 text-navy shadow-sm">
                    {TYPED}
                    <span className="ml-2 inline-flex translate-y-0.5 items-center gap-0.5 text-[10px] text-navy/50">
                      19:42 <CheckCheck className="h-3 w-3 text-[#3A8DDE]" />
                    </span>
                  </motion.div>
                )}

                {at(T.photos) && (
                  <motion.div key="m2" layout {...bubble} className="ml-auto w-[74%] rounded-2xl rounded-br-md bg-[#D9F5C7] p-1.5 shadow-sm">
                    <div className="grid grid-cols-3 gap-1">
                      <Photo k="caveAvant" />
                      <Photo k="garage" />
                      <Photo k="cartons" />
                    </div>
                    <p className="flex items-center justify-between px-1 pt-1 text-[10.5px] text-navy/60">
                      <span className="inline-flex items-center gap-1">
                        <Camera className="h-3 w-3" /> 3 photos
                      </span>
                      <span className="inline-flex items-center gap-0.5">
                        19:43 <CheckCheck className="h-3 w-3 text-[#3A8DDE]" />
                      </span>
                    </p>
                  </motion.div>
                )}

                {at(T.typing) && !at(T.reply) && (
                  <motion.div key="typing" layout {...bubble} className="flex w-fit gap-1 rounded-2xl rounded-bl-md bg-white px-3.5 py-3 shadow-sm">
                    {[0, 1, 2].map((d) => (
                      <motion.span key={d} className="h-1.5 w-1.5 rounded-full bg-navy/45" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.7, repeat: Infinity, delay: d * 0.14 }} />
                    ))}
                  </motion.div>
                )}

                {at(T.reply) && (
                  <motion.div key="m3" layout {...bubble} className="max-w-[80%] rounded-2xl rounded-bl-md bg-white px-3 py-2 text-navy shadow-sm">
                    Merci Claire ! D’après vos photos : environ <strong>6 m³</strong>. Voici votre prix fixe 👇
                  </motion.div>
                )}

                {at(T.quote) && (
                  <motion.div key="m4" layout {...bubble} className="w-[86%] overflow-hidden rounded-2xl rounded-bl-md bg-white shadow-sm">
                    <div className="on-dark bg-navy px-3.5 py-3 text-white">
                      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-signal">Express Pièce · jusqu’à 8 m³</p>
                      <div className="mt-1 flex items-end justify-between">
                        <p className="font-display text-[30px] leading-none tight">349 €</p>
                        <p className="text-right text-[10.5px] leading-tight text-white/70">
                          TTC · prix ferme
                          <br />
                          acompte 105 €
                        </p>
                      </div>
                    </div>
                    <div className="p-2.5">
                      <p className="mb-1.5 text-[11.5px] font-semibold text-navy/70">Choisissez un créneau</p>
                      <div className="grid grid-cols-3 gap-1.5">
                        {['Jeu. 14 h', 'Ven. 9 h', 'Sam. 9 h'].map((s, i) => (
                          <span
                            key={s}
                            className={cn(
                              'relative grid h-8 place-items-center rounded-lg text-[11.5px] font-semibold ring-1 transition-colors duration-300',
                              i === 0 && picked ? 'bg-signal text-navy ring-signal' : 'bg-kraft text-navy ring-transparent',
                            )}
                          >
                            {s}
                            {i === 0 && <Tap show={at(T.tap) && !at(T.tap + 600)} />}
                          </span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {at(T.ok) && (
                  <motion.div key="m5" layout {...bubble} className="ml-auto rounded-2xl rounded-br-md bg-[#D9F5C7] px-3 py-2 text-navy shadow-sm">
                    Jeudi 14 h, parfait 👍
                  </motion.div>
                )}

                {at(T.confirm) && (
                  <motion.div key="m6" layout {...bubble} className="w-[80%] rounded-2xl rounded-bl-md bg-white p-3 shadow-sm">
                    <p className="flex items-center gap-1.5 text-[13px] font-semibold text-tri-dark">
                      <CheckCheck className="h-4 w-4" /> Réservé · jeudi 14 h
                    </p>
                    <p className="mt-1 text-[12px] text-navy/70">Max et Noa arrivent avec le camion. Vous n’avez rien à porter.</p>
                  </motion.div>
                )}

                {at(T.day) && (
                  <motion.p key="day2" layout {...bubble} className="mx-auto rounded-full bg-white/85 px-2.5 py-0.5 text-[11px] text-navy/60 shadow-sm">
                    Jeudi
                  </motion.p>
                )}

                {at(T.route) && (
                  <motion.div key="m7" layout {...bubble} className="w-[86%] rounded-2xl rounded-bl-md bg-white p-3 shadow-sm">
                    <p className="flex items-center justify-between text-[12.5px] font-semibold text-navy">
                      <span className="inline-flex items-center gap-1.5">
                        <TruckIcon className="h-4 w-4" /> {routePct < 1 ? 'En route' : 'Arrivés'}
                      </span>
                      <span className="font-mono text-[11px] text-navy/60">{routePct < 1 ? `${Math.max(1, Math.round(12 * (1 - routePct)))} min` : '13:58'}</span>
                    </p>
                    <div className="relative mt-2.5 h-2 rounded-full bg-kraft">
                      <div className="absolute inset-y-0 left-0 rounded-full bg-signal" style={{ width: `${routePct * 100}%` }} />
                      <span className="absolute -top-[5px] grid h-[18px] w-[18px] -translate-x-1/2 place-items-center rounded-full bg-navy text-white shadow" style={{ left: `${routePct * 100}%` }}>
                        <TruckIcon className="h-2.5 w-2.5" />
                      </span>
                    </div>
                  </motion.div>
                )}

                {at(T.report) && (
                  <motion.div key="m8" layout {...bubble} className="w-[86%] rounded-2xl rounded-bl-md bg-white p-3 shadow-sm">
                    <div className="flex items-center gap-3">
                      <svg viewBox="0 0 44 44" className="h-12 w-12 -rotate-90 shrink-0">
                        <circle cx="22" cy="22" r="18" fill="none" stroke="#E6E3DA" strokeWidth="6" />
                        <circle cx="22" cy="22" r="18" fill="none" stroke="#2F9E6E" strokeWidth="6" strokeLinecap="round" strokeDasharray={113} strokeDashoffset={113 * (1 - ring / 100)} />
                      </svg>
                      <div className="leading-tight">
                        <p className="text-[12.5px] font-semibold text-navy">Cave vidée ✓ Rapport de tri</p>
                        <p className="mt-0.5 text-[12px] text-navy/70">
                          <strong className="text-tri-dark">{ring} %</strong> réemployé ou recyclé · photos avant / après jointes
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* zone de saisie */}
            <div className="relative z-20 flex items-center gap-2 bg-white/95 px-3 pb-7 pt-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-full text-navy/60">
                <Plus className="h-5 w-5" />
              </span>
              <div className="flex h-9 min-w-0 flex-1 items-center overflow-hidden rounded-full bg-[#F1F3F5] px-3 text-[12.5px] text-navy">
                {typed ? (
                  <span className="truncate">
                    {typed}
                    <span className="ml-px inline-block h-3.5 w-[1.5px] translate-y-0.5 animate-pulse bg-navy" />
                  </span>
                ) : (
                  <span className="text-navy/40">Message</span>
                )}
              </div>
              <motion.span
                animate={{ scale: typed ? 1.08 : 1, backgroundColor: typed ? '#2F9E6E' : '#0E2A3B' }}
                className="grid h-9 w-9 place-items-center rounded-full text-white"
              >
                {typed ? <SendHorizontal className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </motion.span>
            </div>
          </div>
        </Phone>
      </motion.div>

      {/* frise du parcours client */}
      <ol className="mx-auto mt-10 flex max-w-md items-center justify-between gap-2" aria-label="Parcours client">
        {STAGES.map((s, i) => (
          <li key={s.label} className="flex flex-1 items-center gap-2 last:flex-none">
            <span className={cn('flex items-center gap-2 text-[13px] font-semibold transition-colors duration-500', i <= stage ? 'text-navy' : 'text-navy/70')}>
              <span className={cn('grid h-7 w-7 place-items-center rounded-full font-mono text-[11px] transition-all duration-500', i <= stage ? 'bg-signal text-navy shadow-signal' : 'bg-kraft text-navy/70')}>{i + 1}</span>
              <span className="hidden sm:inline">{s.label}</span>
            </span>
            {i < STAGES.length - 1 && (
              <span className="relative h-0.5 flex-1 overflow-hidden rounded bg-kraft">
                <span className="absolute inset-y-0 left-0 bg-signal transition-all duration-700" style={{ width: i < stage ? '100%' : '0%' }} />
              </span>
            )}
          </li>
        ))}
      </ol>
      <p className="sr-only">
        Parcours client : vous envoyez vos photos sur WhatsApp, recevez un prix fixe de 349 euros en moins d’une heure, réservez jeudi 14 h, puis recevez le rapport de tri.
      </p>
    </div>
  );
}
