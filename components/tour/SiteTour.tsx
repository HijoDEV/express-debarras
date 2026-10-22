'use client';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Calculator, Check, Compass, Keyboard, MousePointer2, Sparkles, X, ZoomIn } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import { SITE_CHAPTERS, SITE_STEPS, type SiteStep } from './site-steps';

type Phase = 'welcome' | 'travel' | 'step' | 'done';
type Box = { x: number; y: number; w: number; h: number };
type Mode = 'full' | 'essential';
type LenisLike = { scrollTo: (t: number, o?: object) => void; resize: () => void };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const EASE = 'cubic-bezier(.22,1,.36,1)';
const BUBBLE_W = 370;
const PAD = 12;
const PAGE_LABEL: Record<SiteStep['path'], string> = { '/': 'Accueil', '/simulateur': 'Simulateur', '/pros': 'Offres pros' };
const TRAVEL_LINK: Partial<Record<SiteStep['path'], string>> = { '/': 'header a[href="/"]', '/simulateur': 'header a[href="/#simulateur"]' };

const lenis = () => (window as unknown as { __lenis?: LenisLike }).__lenis;

function visible(el: HTMLElement) {
  const r = el.getBoundingClientRect();
  if (!r.width || !r.height) return false;
  const st = getComputedStyle(el);
  return st.visibility !== 'hidden' && st.display !== 'none';
}

async function waitForEl(selector: string, timeout: number, alive: () => boolean) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeout && alive()) {
    const el = Array.from(document.querySelectorAll<HTMLElement>(selector)).find(visible);
    if (el) return el;
    await sleep(90);
  }
  return null;
}

async function settle(el: HTMLElement, max = 1600) {
  let last = el.getBoundingClientRect().top;
  let still = 0;
  const t0 = Date.now();
  while (Date.now() - t0 < max) {
    await sleep(60);
    const top = el.getBoundingClientRect().top;
    still = Math.abs(top - last) < 0.5 ? still + 1 : 0;
    last = top;
    if (still >= 3) return;
  }
}

function scrollToY(y: number, smooth: boolean) {
  const l = lenis();
  if (l) {
    l.resize();
    l.scrollTo(y, smooth ? { force: true, duration: 0.9 } : { force: true, immediate: true });
  } else window.scrollTo({ top: y, behavior: smooth ? 'smooth' : 'auto' });
}

const stage = () => document.getElementById('contenu');

async function resetZoom(animate: boolean) {
  const s = stage();
  if (!s || !s.style.transform) return;
  if (animate) {
    s.style.transition = `transform .5s ${EASE}`;
    s.style.transform = 'translate(0px, 0px) scale(1)';
    await sleep(500);
  }
  s.style.transition = '';
  s.style.transform = '';
  s.style.transformOrigin = '';
  document.documentElement.style.overflowX = '';
}

function region() {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const header = document.querySelector('header')?.getBoundingClientRect();
  const top = Math.max(72, (header?.bottom ?? 72) + 12);
  return { left: 16, top, right: vw - 16, bottom: vh - 16, w: vw - 32, h: vh - 16 - top, vw, vh };
}

const samePath = (p: string) => window.location.pathname === p;

export function SiteTour({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const reduce = useReducedMotion() ?? false;
  const [phase, setPhase] = useState<Phase>('welcome');
  const [mode, setMode] = useState<Mode>('full');
  const [i, setI] = useState(0);
  const [spot, setSpot] = useState<Box | null>(null);
  const [zoom, setZoom] = useState(1);
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);
  const [clickKey, setClickKey] = useState(0);
  const [travelTo, setTravelTo] = useState('');
  const [navSpot, setNavSpot] = useState(false);
  const [bubbleH, setBubbleH] = useState(230);
  const [desktop, setDesktop] = useState(true);
  const [started, setStarted] = useState(false);
  const token = useRef(0);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const primaryRef = useRef<HTMLButtonElement>(null);

  const steps = useMemo(() => SITE_STEPS.filter((s) => (mode === 'essential' ? s.essential : true)), [mode]);

  useEffect(() => {
    setDesktop(window.innerWidth >= 1024);
    document.documentElement.dataset.tour = 'on';
    return () => {
      delete document.documentElement.dataset.tour;
    };
  }, []);

  const goTo = useCallback(
    async (index: number, dir: 1 | -1 = 1): Promise<void> => {
      const run = ++token.current;
      const alive = () => token.current === run;
      const st = steps[index];
      if (!st) return;
      const isDesk = window.innerWidth >= 1024;
      setDesktop(isDesk);
      const fancy = isDesk && !reduce;
      setPhase('travel');
      setTravelTo('');
      setNavSpot(false);
      const unzoom = resetZoom(!reduce);

      // trajet vers une autre page
      const needNav = !samePath(st.path);
      if (needNav) {
        setTravelTo(PAGE_LABEL[st.path]);
        const sel = TRAVEL_LINK[st.path];
        const link = fancy && sel ? Array.from(document.querySelectorAll<HTMLElement>(sel)).find(visible) : null;
        if (link) {
          const r = link.getBoundingClientRect();
          setSpot({ x: r.left, y: r.top, w: r.width, h: r.height });
          setNavSpot(true);
          setZoom(1);
          setCursor({ x: r.left + r.width * 0.6, y: r.top + r.height * 0.6 });
          await Promise.all([unzoom, sleep(650)]);
          if (!alive()) return;
          setClickKey((k) => k + 1);
          await sleep(260);
        } else {
          setSpot(null);
          await Promise.all([unzoom, sleep(reduce ? 0 : 300)]);
        }
        if (!alive()) return;
        setNavSpot(false);
        router.push(st.path, { scroll: false });
        const t0 = Date.now();
        while (Date.now() - t0 < 5000 && alive() && !samePath(st.path)) await sleep(60);
        scrollToY(0, false);
      } else await unzoom;
      if (!alive()) return;

      const el = await waitForEl(`[data-tour="${st.target}"]`, needNav ? 6000 : st.optional ? 900 : 2000, alive);
      if (!alive()) return;
      if (!el) {
        if (st.optional) {
          const n = index + dir;
          if (n >= 0 && n < steps.length) return goTo(n, dir);
        }
        setI(index);
        setSpot(null);
        setZoom(1);
        setPhase('step');
        return;
      }
      await sleep(needNav ? 350 : 80);
      if (!alive()) return;

      // cadrage
      const reg = region();
      const r0 = el.getBoundingClientRect();
      const anchor = isDesk ? reg.top + reg.h / 2 : reg.top + 12;
      const delta = isDesk ? (r0.height > reg.h ? r0.top - reg.top - 8 : r0.top + r0.height / 2 - anchor) : r0.top - anchor;
      if (Math.abs(delta) > 4) {
        scrollToY(Math.max(0, window.scrollY + delta), !reduce);
        await settle(el);
      }
      if (!alive()) return;

      // zoom caméra (élément relu : il a pu être remplacé pendant le défilement)
      const cur = Array.from(document.querySelectorAll<HTMLElement>(`[data-tour="${st.target}"]`)).find(visible) ?? el;
      const r = cur.getBoundingClientRect();
      let box: Box = { x: r.left, y: r.top, w: r.width, h: r.height };
      let s = 1;
      const s0 = stage();
      if (fancy && s0 && st.zoom !== false) {
        const room = reg.w - BUBBLE_W - 72;
        s = Math.min(1.45, (room * 0.94) / r.width, (reg.h * 0.84) / r.height);
        if (s < 1.08) s = 1;
        if (s > 1) {
          const cx = reg.left + room / 2 + 24;
          const cy = reg.top + reg.h / 2;
          const S = s0.getBoundingClientRect();
          const tx = cx - S.left - (r.left + r.width / 2 - S.left) * s;
          const ty = cy - S.top - (r.top + r.height / 2 - S.top) * s;
          document.documentElement.style.overflowX = 'clip';
          s0.style.transformOrigin = '0 0';
          s0.style.transition = `transform .85s ${EASE}`;
          s0.style.transform = `translate(${tx}px, ${ty}px) scale(${s})`;
          box = { x: cx - (r.width * s) / 2, y: cy - (r.height * s) / 2, w: r.width * s, h: r.height * s };
        }
      }
      setI(index);
      setZoom(s);
      setSpot(box);
      setCursor(fancy ? { x: box.x + box.w * 0.7, y: box.y + Math.min(box.h * 0.6, box.h - 14) } : null);
      setPhase('step');

      // démonstration : clic réel dans la zone, puis étape suivante
      if (st.click) {
        await sleep(reduce ? 600 : 1300);
        if (!alive()) return;
        const { selector, text } = st.click;
        // l’élément a pu être remplacé entre-temps (hydratation) : on le recherche à nouveau
        const host = Array.from(document.querySelectorAll<HTMLElement>(`[data-tour="${st.target}"]`)).find(visible) ?? el;
        const btn = Array.from(host.querySelectorAll<HTMLElement>(selector)).find((b) => visible(b) && (!text || b.textContent?.includes(text)));
        if (btn) {
          if (s > 1) await resetZoom(!reduce);
          if (!alive()) return;
          const b = btn.getBoundingClientRect();
          setSpot({ x: b.left, y: b.top, w: b.width, h: b.height });
          setZoom(1);
          if (fancy) setCursor({ x: b.left + b.width * 0.55, y: b.top + b.height * 0.55 });
          await sleep(reduce ? 200 : 750);
          if (!alive()) return;
          setClickKey((k) => k + 1);
          await sleep(180);
          btn.click();
          await sleep(reduce ? 300 : 900);
          if (!alive()) return;
          const n = index + 1;
          if (n < steps.length) return goTo(n, 1);
        }
      }
    },
    [steps, reduce, router],
  );

  const finish = useCallback(async () => {
    token.current++;
    await resetZoom(!reduce);
    setSpot(null);
    setCursor(null);
    setPhase('done');
  }, [reduce]);

  const close = useCallback(async () => {
    token.current++;
    await resetZoom(false);
    onClose();
  }, [onClose]);

  const start = (m: Mode) => {
    setMode(m);
    setStarted(true);
  };
  useEffect(() => {
    if (started) void goTo(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started]);

  const next = useCallback(() => (i < steps.length - 1 ? void goTo(i + 1, 1) : void finish()), [i, steps.length, goTo, finish]);
  const prev = useCallback(() => i > 0 && void goTo(i - 1, -1), [i, goTo]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Tab') return;
      e.stopImmediatePropagation();
      if (e.key === 'Escape') {
        e.preventDefault();
        void close();
      } else if (phase === 'step' && (e.key === 'ArrowRight' || e.key === 'Enter')) {
        e.preventDefault();
        next();
      } else if (phase === 'step' && e.key === 'ArrowLeft') {
        e.preventDefault();
        prev();
      }
    };
    window.addEventListener('keydown', h, true);
    return () => window.removeEventListener('keydown', h, true);
  }, [phase, next, prev, close]);

  // défilement manuel bloqué (y compris le défilement doux) : le cadrage est piloté
  useEffect(() => {
    const stop = (e: Event) => {
      e.preventDefault();
      e.stopImmediatePropagation();
    };
    window.addEventListener('wheel', stop, { passive: false, capture: true });
    window.addEventListener('touchmove', stop, { passive: false, capture: true });
    return () => {
      window.removeEventListener('wheel', stop, { capture: true });
      window.removeEventListener('touchmove', stop, { capture: true });
    };
  }, []);

  useEffect(() => {
    if (phase !== 'step') return;
    let t: ReturnType<typeof setTimeout>;
    const h = () => {
      clearTimeout(t);
      t = setTimeout(() => void goTo(i), 220);
    };
    window.addEventListener('resize', h);
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', h);
    };
  }, [phase, i, goTo]);

  useEffect(
    () => () => {
      token.current++;
      void resetZoom(false);
    },
    [],
  );

  useLayoutEffect(() => {
    if (bubbleRef.current) setBubbleH(bubbleRef.current.offsetHeight);
  }, [i, phase, desktop]);

  useEffect(() => {
    if (phase === 'step') primaryRef.current?.focus({ preventScroll: true });
  }, [phase, i]);

  const st = steps[i];
  const chapter = st ? SITE_CHAPTERS[st.chapter] : SITE_CHAPTERS[0];
  const ChapterIcon = chapter.icon;
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1280;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
  const dimmed = phase === 'welcome' || phase === 'done';

  const ring = spot
    ? (() => {
        const x = Math.max(6, spot.x - PAD);
        const y = Math.max(6, spot.y - PAD);
        const r = Math.min(vw - 6, spot.x + spot.w + PAD);
        const b = Math.min(vh - 6, spot.y + spot.h + PAD);
        return { x, y, w: Math.max(0, r - x), h: Math.max(0, b - y) };
      })()
    : null;

  let bubble = { left: vw / 2 - BUBBLE_W / 2, top: vh / 2 - bubbleH / 2 };
  let side: 'left' | 'right' | 'top' | 'bottom' | null = null;
  if (desktop && ring && phase === 'step') {
    const gap = 22;
    const clampY = (y: number) => Math.min(Math.max(16, y), vh - bubbleH - 16);
    const clampX = (x: number) => Math.min(Math.max(16, x), vw - BUBBLE_W - 16);
    if (ring.x + ring.w + gap + BUBBLE_W < vw - 16) {
      bubble = { left: ring.x + ring.w + gap, top: clampY(ring.y + ring.h / 2 - bubbleH / 2) };
      side = 'left';
    } else if (ring.x - gap - BUBBLE_W > 16) {
      bubble = { left: ring.x - gap - BUBBLE_W, top: clampY(ring.y + ring.h / 2 - bubbleH / 2) };
      side = 'right';
    } else if (ring.y + ring.h + gap + bubbleH < vh - 16) {
      bubble = { left: clampX(ring.x + ring.w / 2 - BUBBLE_W / 2), top: ring.y + ring.h + gap };
      side = 'top';
    } else if (ring.y - gap - bubbleH > 16) {
      bubble = { left: clampX(ring.x + ring.w / 2 - BUBBLE_W / 2), top: ring.y - gap - bubbleH };
      side = 'bottom';
    } else bubble = { left: vw - BUBBLE_W - 24, top: vh - bubbleH - 24 };
  }
  const arrowOffset = ring
    ? side === 'left' || side === 'right'
      ? Math.min(Math.max(22, ring.y + ring.h / 2 - bubble.top), bubbleH - 22)
      : Math.min(Math.max(22, ring.x + ring.w / 2 - bubble.left), BUBBLE_W - 22)
    : 0;
  const sheetTop = !desktop && !!ring && ring.y + Math.min(ring.h, 150) > vh - 12 - bubbleH;
  const spring = reduce ? { duration: 0 } : { type: 'spring' as const, stiffness: 170, damping: 26, mass: 0.9 };

  const chapterStats = SITE_CHAPTERS.map((_, c) => {
    const idx = steps.map((s, k) => (s.chapter === c ? k : -1)).filter((k) => k >= 0);
    return { total: idx.length, done: idx.filter((k) => k < i || (k === i && phase === 'step')).length };
  }).filter((c) => c.total > 0);

  return (
    <div className="fixed inset-0 z-[120] font-sans" role="dialog" aria-modal="true" aria-label="Visite guidée du site">
      <svg className="absolute inset-0 h-full w-full" aria-hidden="true">
        <defs>
          <mask id="site-tour-cutout">
            <rect width="100%" height="100%" fill="white" />
            <motion.rect
              rx={18}
              fill="black"
              initial={false}
              animate={ring && !dimmed ? { x: ring.x, y: ring.y, width: ring.w, height: ring.h } : { x: vw / 2, y: vh / 2, width: 0, height: 0 }}
              transition={spring}
            />
          </mask>
        </defs>
        <motion.rect width="100%" height="100%" mask="url(#site-tour-cutout)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: reduce ? 0 : 0.4 }} fill={dimmed ? 'rgba(14,42,59,.74)' : 'rgba(14,42,59,.64)'} />
      </svg>
      {dimmed && <div className="absolute inset-0 backdrop-blur-[3px]" aria-hidden="true" />}

      {/* anneau + viseur */}
      <AnimatePresence>
        {ring && !dimmed && (phase === 'step' || navSpot) && (
          <motion.div
            key="ring"
            className="pointer-events-none absolute left-0 top-0"
            initial={{ opacity: 0, x: ring.x, y: ring.y, width: ring.w, height: ring.h }}
            animate={{ opacity: 1, x: ring.x, y: ring.y, width: ring.w, height: ring.h }}
            exit={{ opacity: 0 }}
            transition={spring}
            aria-hidden="true"
          >
            <div className="absolute inset-0 rounded-[18px] ring-2 ring-signal" />
            {!reduce && (
              <motion.div className="absolute inset-0 rounded-[18px] ring-2 ring-signal" animate={{ scale: [1, 1.03, 1.055], opacity: [0.7, 0.25, 0] }} transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }} />
            )}
            {(['tl', 'tr', 'bl', 'br'] as const).map((c) => (
              <span
                key={c}
                className={cn(
                  'absolute h-6 w-6 border-signal',
                  c === 'tl' && '-left-2 -top-2 rounded-tl-[12px] border-l-[3px] border-t-[3px]',
                  c === 'tr' && '-right-2 -top-2 rounded-tr-[12px] border-r-[3px] border-t-[3px]',
                  c === 'bl' && '-bottom-2 -left-2 rounded-bl-[12px] border-b-[3px] border-l-[3px]',
                  c === 'br' && '-bottom-2 -right-2 rounded-br-[12px] border-b-[3px] border-r-[3px]',
                )}
              />
            ))}
            <AnimatePresence>
              {zoom > 1 && phase === 'step' && (
                <motion.span key="z" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: 0.5 }} className="absolute -top-9 left-0 inline-flex items-center gap-1.5 rounded-full bg-signal px-2.5 py-1 font-mono text-[11.5px] font-bold text-navy shadow-lg">
                  <ZoomIn className="h-3.5 w-3.5" /> ×{zoom.toFixed(1).replace('.', ',')}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {phase === 'travel' && travelTo && (
          <motion.div key="travel" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="absolute bottom-8 left-1/2 inline-flex -translate-x-1/2 items-center gap-3 whitespace-nowrap rounded-full bg-navy px-5 py-3 text-[14.5px] font-semibold text-white shadow-2xl ring-1 ring-white/10" role="status">
            <Compass className="h-4 w-4 text-signal" /> Direction : {travelTo}
            <span className="flex gap-1">
              {[0, 1, 2].map((d) => (
                <motion.span key={d} className="h-1.5 w-1.5 rounded-full bg-signal" animate={reduce ? undefined : { opacity: [0.3, 1, 0.3] }} transition={{ duration: 0.9, repeat: Infinity, delay: d * 0.15 }} />
              ))}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* curseur */}
      <AnimatePresence>
        {cursor && desktop && !reduce && !dimmed && (
          <motion.div key="cursor" className="pointer-events-none absolute left-0 top-0 z-10" initial={{ opacity: 0, x: vw / 2, y: vh / 2 }} animate={{ opacity: 1, x: cursor.x, y: cursor.y }} exit={{ opacity: 0 }} transition={{ type: 'spring', stiffness: 90, damping: 18, mass: 0.8 }} aria-hidden="true">
            <AnimatePresence>
              {clickKey > 0 && <motion.span key={clickKey} className="absolute -left-5 -top-5 h-10 w-10 rounded-full border-2 border-signal bg-signal/30" initial={{ scale: 0.2, opacity: 1 }} animate={{ scale: 1.7, opacity: 0 }} transition={{ duration: 0.55, ease: 'easeOut' }} />}
            </AnimatePresence>
            <motion.div key={`p-${clickKey}`} animate={clickKey ? { scale: [1, 0.8, 1] } : undefined} transition={{ duration: 0.25 }}>
              <MousePointer2 className="h-7 w-7 -translate-x-1 -translate-y-1 fill-white text-navy drop-shadow-[0_4px_8px_rgba(0,0,0,.35)]" strokeWidth={1.6} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* accueil */}
      <AnimatePresence>
        {phase === 'welcome' && (
          <motion.div key="welcome" className="absolute inset-0 grid place-items-center overflow-y-auto p-4" exit={{ opacity: 0 }}>
            <motion.div initial={reduce ? false : { opacity: 0, y: 24, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 220, damping: 24 }} className="w-full max-w-[540px] overflow-hidden rounded-[26px] bg-white shadow-2xl">
              <WelcomeArt reduce={reduce} />
              <div className="p-6 sm:p-8">
                <p className="font-mono text-label uppercase text-signal-dark">Visite guidée · Démo BTS NDRC</p>
                <h2 className="mt-2 font-display text-[30px] leading-[1.02] tracking-[-0.035em] text-navy sm:text-[36px]">Bienvenue chez Express&nbsp;Débarras</h2>
                <p className="mt-3 text-[15.5px] leading-relaxed text-navy/70">Faites le tour du site en quelques instants : chaque zone importante est mise en lumière et zoomée, page après page.</p>
                <ul className="mt-5 grid grid-cols-2 gap-2">
                  {SITE_CHAPTERS.map((c, k) => {
                    const Icon = c.icon;
                    return (
                      <motion.li key={c.title} initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 + k * 0.08 }} className="flex items-center gap-2.5 rounded-xl bg-kraft px-3 py-2.5 text-[14px] font-semibold text-navy">
                        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-navy" style={{ background: c.color }}>
                          <Icon className="h-4 w-4" />
                        </span>
                        {c.title}
                      </motion.li>
                    );
                  })}
                </ul>
                <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                  <button onClick={() => start('full')} autoFocus className="btn-shine inline-flex h-[52px] flex-1 items-center justify-center gap-2 rounded-btn bg-signal px-5 text-[15.5px] font-bold text-navy shadow-signal transition hover:-translate-y-0.5">
                    <Sparkles className="h-4 w-4" /> Visite complète · 2 min
                  </button>
                  <button onClick={() => start('essential')} className="inline-flex h-[52px] items-center justify-center rounded-btn px-5 text-[15px] font-semibold text-navy ring-1 ring-inset ring-navy/15 transition hover:ring-navy/40">
                    L’essentiel · 40 s
                  </button>
                </div>
                <div className="mt-4 flex items-center justify-between gap-3 text-[13px] text-navy/75">
                  <span className="hidden items-center gap-1.5 sm:inline-flex">
                    <Keyboard className="h-3.5 w-3.5" /> ← → pour naviguer · Échap pour quitter
                  </span>
                  <button onClick={() => void close()} className="ml-auto font-semibold underline-offset-2 hover:text-navy hover:underline">
                    Non merci, je découvre seul
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* bulle */}
      <AnimatePresence>
        {phase === 'step' && st && (
          <motion.div
            key="bubble"
            ref={bubbleRef}
            initial={reduce ? false : desktop ? { opacity: 0, scale: 0.94, left: bubble.left, top: bubble.top + 10 } : { opacity: 0, y: 16 }}
            animate={desktop ? { opacity: 1, scale: 1, left: bubble.left, top: bubble.top } : { opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={spring}
            className={cn('absolute rounded-[20px] bg-white text-navy shadow-[0_30px_70px_-20px_rgba(0,0,0,.55)]', desktop ? '' : sheetTop ? 'inset-x-3 top-3' : 'inset-x-3 bottom-3')}
            style={desktop ? { width: BUBBLE_W } : undefined}
          >
            {desktop && side && ring && (
              <span
                className="absolute h-3.5 w-3.5 rotate-45 bg-white"
                style={{
                  ...(side === 'left' && { left: -7, top: arrowOffset - 7 }),
                  ...(side === 'right' && { right: -7, top: arrowOffset - 7 }),
                  ...(side === 'top' && { top: -7, left: arrowOffset - 7 }),
                  ...(side === 'bottom' && { bottom: -7, left: arrowOffset - 7 }),
                }}
                aria-hidden="true"
              />
            )}
            <div className="relative p-5">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-bold text-navy" style={{ background: chapter.color }}>
                  <ChapterIcon className="h-3.5 w-3.5" /> {chapter.title}
                </span>
                <span className="font-mono text-[11.5px] text-navy/75">
                  {i + 1} / {steps.length}
                </span>
                <button onClick={() => void close()} className="ml-auto grid h-8 w-8 place-items-center rounded-lg text-navy/75 hover:bg-kraft hover:text-navy" aria-label="Quitter la visite">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <AnimatePresence mode="wait" initial={false}>
                <motion.div key={st.id} initial={reduce ? false : { opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.22 }} aria-live="polite">
                  <h3 className="mt-3 text-[19px] font-bold leading-snug tracking-[-0.01em]">{st.title}</h3>
                  <p className="mt-1.5 text-[15px] leading-relaxed text-navy/70">{st.text}</p>
                  {st.click && (
                    <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-kraft px-3 py-1 text-[12.5px] font-semibold text-navy/80">
                      <MousePointer2 className="h-3.5 w-3.5" /> Démonstration en cours…
                    </p>
                  )}
                </motion.div>
              </AnimatePresence>
              <div className="mt-4 flex gap-1.5" aria-hidden="true">
                {chapterStats.map((c, k) => (
                  <span key={k} className="h-1.5 overflow-hidden rounded-full bg-kraft" style={{ flexGrow: c.total, flexBasis: 0 }}>
                    <motion.span className="block h-full rounded-full bg-signal" initial={false} animate={{ width: `${(c.done / c.total) * 100}%` }} transition={{ duration: reduce ? 0 : 0.5 }} />
                  </span>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-2">
                <button onClick={prev} disabled={i === 0} className="inline-flex h-10 items-center gap-1.5 rounded-xl px-3 text-[14px] font-semibold text-navy/75 transition hover:bg-kraft hover:text-navy disabled:opacity-40" aria-label="Étape précédente">
                  <ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">Précédent</span>
                </button>
                <button ref={primaryRef} onClick={next} className="ml-auto inline-flex h-10 items-center gap-1.5 rounded-xl bg-navy px-4 text-[14.5px] font-bold text-white transition hover:brightness-110">
                  {i < steps.length - 1 ? 'Suivant' : 'Terminer'} <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* fin */}
      <AnimatePresence>
        {phase === 'done' && (
          <motion.div key="done" className="absolute inset-0 grid place-items-center overflow-y-auto p-4">
            {!reduce && <Confetti />}
            <motion.div initial={reduce ? false : { opacity: 0, y: 24, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 220, damping: 22 }} className="relative w-full max-w-[470px] rounded-[26px] bg-white p-7 text-center text-navy shadow-2xl">
              <svg viewBox="0 0 64 64" className="mx-auto h-16 w-16" aria-hidden="true">
                <motion.circle cx="32" cy="32" r="29" fill="none" stroke="#2F9E6E" strokeWidth="4" initial={{ pathLength: reduce ? 1 : 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.6 }} />
                <motion.path d="M20 33 l8 8 l16 -18" fill="none" stroke="#2F9E6E" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: reduce ? 1 : 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.4, delay: 0.5 }} />
              </svg>
              <h2 className="mt-4 font-display text-[30px] leading-tight tracking-[-0.035em]">Vous connaissez la maison&nbsp;!</h2>
              <p className="mt-2 text-[15px] leading-relaxed text-navy/70">{mode === 'full' ? 'Prix fixe sur photos, camion qui se remplit, tri tracé, offre pro : vous avez tout vu.' : 'Voilà l’essentiel. La visite complète reste disponible en bas de chaque page.'}</p>
              <ul className="mt-5 space-y-2 text-left">
                {SITE_CHAPTERS.filter((_, c) => steps.some((s) => s.chapter === c)).map((c, k) => (
                  <motion.li key={c.title} initial={reduce ? false : { opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7 + k * 0.08 }} className="flex items-center gap-2.5 rounded-xl bg-kraft px-3 py-2.5 text-[14.5px] font-semibold">
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-tri text-white">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                    {c.title}
                  </motion.li>
                ))}
              </ul>
              <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                <button
                  autoFocus
                  onClick={() => {
                    void close();
                    router.push('/simulateur');
                  }}
                  className="inline-flex h-[52px] flex-1 items-center justify-center gap-2 rounded-btn bg-signal px-4 text-[15.5px] font-bold text-navy shadow-signal transition hover:-translate-y-0.5"
                >
                  <Calculator className="h-4 w-4" /> Estimer mon prix
                </button>
                <button
                  onClick={() => {
                    void close();
                    router.push('/pro/connexion');
                  }}
                  className="inline-flex h-[52px] flex-1 items-center justify-center rounded-btn px-4 text-[15px] font-semibold ring-1 ring-inset ring-navy/15 transition hover:ring-navy/40"
                >
                  Tester l’espace pro
                </button>
              </div>
              <button onClick={() => void close()} className="mt-4 text-[13px] font-semibold text-navy/75 underline-offset-2 hover:text-navy hover:underline">
                Continuer ma visite librement
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function WelcomeArt({ reduce }: { reduce: boolean }) {
  return (
    <div className="relative h-[176px] overflow-hidden bg-navy" aria-hidden="true">
      <div className="absolute inset-0 opacity-40 [background:radial-gradient(circle_at_85%_0%,#FFC21A_0,transparent_45%)]" />
      <div className="absolute left-1/2 top-6 h-[160px] w-[380px] -translate-x-1/2 rounded-t-[14px] bg-white p-3 shadow-2xl">
        <div className="flex items-center justify-between">
          <span className="h-3 w-16 rounded bg-navy" />
          <span className="flex gap-1.5">
            <span className="h-3 w-8 rounded-full bg-kraft" />
            <span className="h-3 w-12 rounded-full bg-signal" />
          </span>
        </div>
        <div className="mx-auto mt-4 h-4 w-48 rounded bg-navy/85" />
        <div className="mx-auto mt-1.5 h-4 w-36 rounded bg-navy/85" />
        <div className="mx-auto mt-3 h-2 w-52 rounded bg-navy/20" />
        <div className="mx-auto mt-3 flex w-max gap-2">
          <span className="h-7 w-28 rounded-lg bg-signal" />
          <span className="h-7 w-24 rounded-lg ring-1 ring-navy/15" />
        </div>
        <motion.svg viewBox="0 0 120 40" className="absolute bottom-2 left-4 h-10 w-28" initial={{ x: reduce ? 0 : -140 }} animate={{ x: reduce ? 0 : [-140, 250] }} transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}>
          <rect x="2" y="6" width="74" height="24" rx="3" fill="#FFC21A" />
          <rect x="78" y="12" width="26" height="18" rx="3" fill="#0E2A3B" />
          <rect x="84" y="15" width="12" height="7" rx="1.5" fill="#BFE3F2" />
          <text x="10" y="22" fontSize="9" fontWeight="800" fill="#0E2A3B" fontFamily="sans-serif">EXPRESS</text>
          <circle cx="20" cy="32" r="5" fill="#0E2A3B" />
          <circle cx="88" cy="32" r="5" fill="#0E2A3B" />
        </motion.svg>
      </div>
      <motion.div className="absolute left-1/2 top-6 -ml-[190px]" initial={{ x: 70, y: 40 }} animate={reduce ? undefined : { x: [70, 200, 300, 150, 70], y: [40, 32, 100, 120, 40] }} transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}>
        <div className="relative -left-8 -top-8 grid h-16 w-16 place-items-center rounded-full border-[3px] border-signal bg-white/20 shadow-[0_0_0_7px_rgba(255,194,26,.2)]">
          <ZoomIn className="h-6 w-6 text-navy" />
        </div>
      </motion.div>
    </div>
  );
}

function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 40 }, (_, k) => ({
        k,
        x: (Math.random() - 0.5) * 960,
        y: -200 - Math.random() * 320,
        r: Math.random() * 540 - 270,
        c: ['#FFC21A', '#2F9E6E', '#5B8DEF', '#E8664B', '#FFFFFF'][k % 5],
        d: Math.random() * 0.25,
        w: 6 + Math.random() * 6,
      })),
    [],
  );
  return (
    <div className="pointer-events-none absolute left-1/2 top-1/2" aria-hidden="true">
      {pieces.map((p) => (
        <motion.span key={p.k} className="absolute block rounded-[2px]" style={{ background: p.c, width: p.w, height: p.w * 0.45 }} initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }} animate={{ x: p.x, y: [0, p.y, p.y + 520], rotate: p.r, opacity: [1, 1, 0] }} transition={{ duration: 2.2, delay: p.d, ease: [0.2, 0.7, 0.4, 1] }} />
      ))}
    </div>
  );
}
