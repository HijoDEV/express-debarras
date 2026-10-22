'use client';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, Compass, Keyboard, MousePointer2, Plus, Sparkles, X, ZoomIn } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import { getDashboard, quietly } from '@/lib/pro/api';
import { can } from '@/lib/pro/permissions';
import { NAV } from './nav';
import { useShell } from './ShellContext';
import { CHAPTERS, STEPS, type TourCtx, type TourStep } from './tour-steps';

type Phase = 'welcome' | 'travel' | 'step' | 'done';
type Box = { x: number; y: number; w: number; h: number };
type Mode = 'full' | 'essential';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const EASE = 'cubic-bezier(.22,1,.36,1)';
const BUBBLE_W = 360;
const PAD = 10;

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

/** Attend que la position de l’élément ne bouge plus (fin du défilement fluide). */
async function settle(el: HTMLElement, max = 1400) {
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

function stage() {
  return document.getElementById('pro-stage');
}

/** Ramène la page à l’échelle 1 et retire la transformation (sinon les éléments fixes sont décalés). */
async function resetZoom(animate: boolean) {
  const s = stage();
  const main = document.getElementById('pro-main');
  if (!s || !s.style.transform) return;
  if (animate) {
    s.style.transition = `transform .5s ${EASE}`;
    s.style.transform = 'translate(0px, 0px) scale(1)';
    await sleep(500);
  }
  s.style.transition = '';
  s.style.transform = '';
  s.style.transformOrigin = '';
  if (main) main.style.overflow = '';
}

/** Zone de travail visible (hors barre latérale, barre du haut et barre mobile). */
function region() {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const main = document.getElementById('pro-main')?.getBoundingClientRect();
  const left = main ? Math.max(0, main.left) : 0;
  const top = 104;
  const bottom = vw < 1024 ? vh - 80 : vh - 16;
  return { left, top, right: vw - 16, bottom, w: vw - 16 - left, h: bottom - top, vw, vh };
}

export function Tour({ open, onClose }: { open: boolean; onClose: (completed: boolean) => void }) {
  const router = useRouter();
  const reduce = useReducedMotion() ?? false;
  const { org, user, role } = useShell();
  const [phase, setPhase] = useState<Phase>('welcome');
  const [mode, setMode] = useState<Mode>('full');
  const [i, setI] = useState(0);
  const [spot, setSpot] = useState<Box | null>(null);
  const [zoom, setZoom] = useState(1);
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);
  const [clickKey, setClickKey] = useState(0);
  const [travelTo, setTravelTo] = useState('');
  const [navSpot, setNavSpot] = useState(false);
  const [bubbleH, setBubbleH] = useState(220);
  const [desktop, setDesktop] = useState(true);
  const ctx = useRef<TourCtx>({ org, nextId: null });
  const token = useRef(0);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const primaryRef = useRef<HTMLButtonElement>(null);

  const steps = useMemo(() => {
    return STEPS.filter((s) => (mode === 'essential' ? s.essential : true))
      .filter((s) => can(role, s.page))
      .filter((s) => !s.agenceOnly || org.kind === 'agence');
  }, [mode, role, org.kind]);

  // ouverture : écran d’accueil
  useEffect(() => {
    if (!open) return;
    setPhase('welcome');
    setI(0);
    setSpot(null);
    setCursor(null);
    setDesktop(window.innerWidth >= 1024);
    quietly();
    getDashboard()
      .then((d) => (ctx.current = { org, nextId: d.next?.id ?? null }))
      .catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, org.id]);

  const resolvePath = (s: TourStep) => (typeof s.path === 'function' ? s.path(ctx.current) : s.path);

  const goTo = useCallback(
    async (index: number) => {
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

      // 1. retour à l’échelle 1 (en parallèle du trajet du curseur)
      const unzoom = resetZoom(!reduce);

      // 2. déplacement vers une autre page : le curseur « clique » dans le menu
      const url = resolvePath(st);
      const here = window.location.pathname + window.location.search;
      const needNav = !!url && (url.includes('?') ? here !== url : window.location.pathname !== url || window.location.search !== '');
      if (needNav && url) {
        const urlPath = url.split('?')[0];
        const isNew = urlPath === '/pro/demandes/nouvelle';
        const navItem = NAV.find((n) => n.href === urlPath);
        setTravelTo(isNew ? 'Nouvelle demande' : navItem?.label ?? '');
        const sel = isNew ? '[data-tour="new"]' : navItem ? `[data-nav="${navItem.page}"]` : '';
        const link = fancy && sel ? Array.from(document.querySelectorAll<HTMLElement>(sel)).find(visible) : null;
        if (link && !url.includes('?id=')) {
          const r = link.getBoundingClientRect();
          setSpot({ x: r.left, y: r.top, w: r.width, h: r.height });
          setNavSpot(true);
          setZoom(1);
          setCursor({ x: r.left + Math.min(r.width - 18, 46), y: r.top + r.height / 2 });
          await Promise.all([unzoom, sleep(600)]);
          if (!alive()) return;
          setClickKey((k) => k + 1);
          await sleep(260);
        } else {
          setSpot(null);
          await Promise.all([unzoom, sleep(reduce ? 0 : 200)]);
        }
        if (!alive()) return;
        setNavSpot(false);
        router.push(url, { scroll: false });
        const t0 = Date.now();
        while (Date.now() - t0 < 4000 && alive()) {
          const now = window.location.pathname + window.location.search;
          if (url.includes('?') ? now === url : window.location.pathname === url) break;
          await sleep(60);
        }
        window.scrollTo({ top: 0 });
      } else await unzoom;
      if (!alive()) return;

      // 3. attente de l’élément (les données arrivent avec 300 à 700 ms de latence)
      const el = await waitForEl(`[data-tour="${st.target}"]`, needNav ? 6000 : 1500, alive);
      if (!alive()) return;
      if (!el) {
        setI(index);
        setSpot(null);
        setZoom(1);
        setPhase('step');
        return;
      }
      await sleep(needNav ? 300 : 80);
      if (!alive()) return;

      const reg = region();
      const inFixed = !!el.closest('[role="dialog"]');
      const inStage = !!stage()?.contains(el);

      // 4. cadrage : on centre la zone dans l’écran
      if (inFixed) {
        el.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' });
        await settle(el);
      } else if (inStage) {
        const r = el.getBoundingClientRect();
        const anchor = isDesk ? reg.top + reg.h / 2 : reg.top + 24;
        const delta = isDesk ? (r.height > reg.h ? r.top - reg.top - 8 : r.top + r.height / 2 - anchor) : r.top - anchor;
        if (Math.abs(delta) > 4) {
          window.scrollBy({ top: delta, behavior: reduce ? 'auto' : 'smooth' });
          await settle(el);
        }
      }
      if (!alive()) return;

      // 5. zoom caméra sur la zone (élément relu : il a pu être remplacé par un rechargement)
      const cur = Array.from(document.querySelectorAll<HTMLElement>(`[data-tour="${st.target}"]`)).find(visible) ?? el;
      const r = cur.getBoundingClientRect();
      let box: Box = { x: r.left, y: r.top, w: r.width, h: r.height };
      let s = 1;
      const s0 = stage();
      if (fancy && inStage && !inFixed && st.zoom !== false && s0) {
        const room = reg.w > 900 ? reg.w - BUBBLE_W - 72 : reg.w - 48;
        s = Math.min(1.5, (room * 0.94) / r.width, (reg.h * 0.84) / r.height);
        if (s < 1.08) s = 1;
        if (s > 1) {
          const cx = reg.w > 900 ? reg.left + room / 2 + 24 : reg.left + reg.w / 2;
          const cy = reg.top + reg.h / 2;
          const S = s0.getBoundingClientRect();
          const tx = cx - S.left - (r.left + r.width / 2 - S.left) * s;
          const ty = cy - S.top - (r.top + r.height / 2 - S.top) * s;
          const main = document.getElementById('pro-main');
          if (main) main.style.overflow = 'clip';
          s0.style.transformOrigin = '0 0';
          s0.style.transition = `transform .85s ${EASE}`;
          s0.style.transform = `translate(${tx}px, ${ty}px) scale(${s})`;
          box = { x: cx - (r.width * s) / 2, y: cy - (r.height * s) / 2, w: r.width * s, h: r.height * s };
        }
      }
      setI(index);
      setZoom(s);
      setSpot(box);
      if (fancy) setCursor({ x: box.x + box.w * 0.72, y: box.y + Math.min(box.h * 0.62, box.h - 14) });
      else setCursor(null);
      setPhase('step');
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [steps, reduce, router],
  );

  const finish = useCallback(async () => {
    token.current++;
    await resetZoom(!reduce);
    setSpot(null);
    setCursor(null);
    setPhase('done');
  }, [reduce]);

  const close = useCallback(
    async (completed: boolean) => {
      token.current++;
      await resetZoom(false);
      setSpot(null);
      setCursor(null);
      onClose(completed);
    },
    [onClose],
  );

  const start = (m: Mode) => {
    setMode(m);
    setPhase('travel');
    setTravelTo('');
  };
  // démarrage une fois le mode appliqué
  useEffect(() => {
    if (open && phase === 'travel' && token.current === 0) void goTo(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, phase, open]);
  useEffect(() => {
    if (!open) token.current = 0;
  }, [open]);

  const next = useCallback(() => (i < steps.length - 1 ? void goTo(i + 1) : void finish()), [i, steps.length, goTo, finish]);
  const prev = useCallback(() => i > 0 && void goTo(i - 1), [i, goTo]);

  // clavier (capturé avant les raccourcis de l’espace pro)
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Tab') return;
      e.stopImmediatePropagation();
      if (e.key === 'Escape') {
        e.preventDefault();
        void close(phase === 'done');
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
  }, [open, phase, next, prev, close]);

  // pas de défilement manuel pendant la visite (le cadrage est piloté)
  useEffect(() => {
    if (!open) return;
    const stop = (e: Event) => e.preventDefault();
    window.addEventListener('wheel', stop, { passive: false });
    window.addEventListener('touchmove', stop, { passive: false });
    return () => {
      window.removeEventListener('wheel', stop);
      window.removeEventListener('touchmove', stop);
    };
  }, [open]);

  // redimensionnement : on recadre
  useEffect(() => {
    if (!open || phase !== 'step') return;
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
  }, [open, phase, i, goTo]);

  // nettoyage si la visite est fermée de l’extérieur
  useEffect(() => {
    if (!open) void resetZoom(false);
  }, [open]);

  useLayoutEffect(() => {
    if (bubbleRef.current) setBubbleH(bubbleRef.current.offsetHeight);
  }, [i, phase, desktop]);

  useEffect(() => {
    if (phase === 'step') primaryRef.current?.focus({ preventScroll: true });
  }, [phase, i]);

  if (!open) return null;

  const st = steps[i];
  const chapter = st ? CHAPTERS[st.chapter] : CHAPTERS[0];
  const ChapterIcon = chapter.icon;
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1280;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;

  // anneau (zone + marge), borné à l’écran
  const ring = spot
    ? (() => {
        const x = Math.max(6, spot.x - PAD);
        const y = Math.max(6, spot.y - PAD);
        const r = Math.min(vw - 6, spot.x + spot.w + PAD);
        const b = Math.min(vh - 6, spot.y + spot.h + PAD);
        return { x, y, w: Math.max(0, r - x), h: Math.max(0, b - y) };
      })()
    : null;

  // position de la bulle
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
    } else {
      bubble = { left: vw - BUBBLE_W - 24, top: vh - bubbleH - 24 };
    }
  }
  const arrowOffset = ring
    ? side === 'left' || side === 'right'
      ? Math.min(Math.max(22, ring.y + ring.h / 2 - bubble.top), bubbleH - 22)
      : Math.min(Math.max(22, ring.x + ring.w / 2 - bubble.left), BUBBLE_W - 22)
    : 0;

  // mobile : la feuille passe en haut si elle masquerait la zone
  const sheetTop = !desktop && !!ring && ring.y + Math.min(ring.h, 140) > vh - 76 - bubbleH;
  const spring = reduce ? { duration: 0 } : { type: 'spring' as const, stiffness: 170, damping: 26, mass: 0.9 };
  const dimmed = phase === 'welcome' || phase === 'done';

  // progression par chapitre
  const chapterStats = CHAPTERS.map((_, c) => {
    const idx = steps.map((s, k) => (s.chapter === c ? k : -1)).filter((k) => k >= 0);
    const done = idx.filter((k) => k < i || (k === i && phase === 'step')).length;
    return { total: idx.length, done };
  }).filter((c) => c.total > 0);

  return (
    <div className="fixed inset-0 z-[110]" role="dialog" aria-modal="true" aria-label="Visite guidée de l’espace pro">
      {/* voile avec découpe animée */}
      <svg className="absolute inset-0 h-full w-full" aria-hidden="true">
        <defs>
          <mask id="tour-cutout">
            <rect width="100%" height="100%" fill="white" />
            <motion.rect
              rx={16}
              fill="black"
              initial={false}
              animate={ring && !dimmed ? { x: ring.x, y: ring.y, width: ring.w, height: ring.h } : { x: vw / 2, y: vh / 2, width: 0, height: 0 }}
              transition={spring}
            />
          </mask>
        </defs>
        <motion.rect width="100%" height="100%" mask="url(#tour-cutout)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: reduce ? 0 : 0.4 }} fill={dimmed ? 'rgba(6,17,26,.72)' : 'rgba(6,17,26,.62)'} />
      </svg>
      {dimmed && <div className="absolute inset-0 backdrop-blur-[3px]" aria-hidden="true" />}

      {/* anneau, viseur et pastille de zoom */}
      <AnimatePresence>
        {ring && !dimmed && (phase === 'step' || navSpot) && (
          <motion.div
            key="ring"
            className="pointer-events-none absolute"
            initial={{ opacity: 0, x: ring.x, y: ring.y, width: ring.w, height: ring.h }}
            animate={{ opacity: 1, x: ring.x, y: ring.y, width: ring.w, height: ring.h }}
            exit={{ opacity: 0 }}
            transition={spring}
            style={{ left: 0, top: 0 }}
            aria-hidden="true"
          >
            <div className="absolute inset-0 rounded-[16px] ring-2 ring-signal" />
            {!reduce && (
              <motion.div
                className="absolute inset-0 rounded-[16px] ring-2 ring-signal"
                animate={{ scale: [1, 1.035, 1.06], opacity: [0.7, 0.25, 0] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
              />
            )}
            {(['tl', 'tr', 'bl', 'br'] as const).map((c) => (
              <span
                key={c}
                className={cn(
                  'absolute h-5 w-5 border-signal',
                  c === 'tl' && '-left-2 -top-2 rounded-tl-[10px] border-l-[3px] border-t-[3px]',
                  c === 'tr' && '-right-2 -top-2 rounded-tr-[10px] border-r-[3px] border-t-[3px]',
                  c === 'bl' && '-bottom-2 -left-2 rounded-bl-[10px] border-b-[3px] border-l-[3px]',
                  c === 'br' && '-bottom-2 -right-2 rounded-br-[10px] border-b-[3px] border-r-[3px]',
                )}
              />
            ))}
            <AnimatePresence>
              {zoom > 1 && phase === 'step' && (
                <motion.span
                  key="zoom"
                  initial={{ opacity: 0, y: 6, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: 0.5 }}
                  className="absolute -top-9 left-0 inline-flex items-center gap-1.5 rounded-full bg-signal px-2.5 py-1 font-mono text-[11.5px] font-bold text-navy shadow-lg"
                >
                  <ZoomIn className="h-3.5 w-3.5" /> ×{zoom.toFixed(1).replace('.', ',')}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* destination pendant le trajet */}
      <AnimatePresence>
        {phase === 'travel' && travelTo && (
          <motion.div
            key="travel"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="absolute bottom-24 left-1/2 inline-flex -translate-x-1/2 items-center gap-3 rounded-full bg-navy px-5 py-3 text-[14px] font-semibold text-white shadow-2xl lg:bottom-10"
            role="status"
          >
            <Compass className="h-4 w-4 text-signal" />
            Direction : {travelTo}
            <span className="flex gap-1">
              {[0, 1, 2].map((d) => (
                <motion.span key={d} className="h-1.5 w-1.5 rounded-full bg-signal" animate={reduce ? undefined : { opacity: [0.3, 1, 0.3] }} transition={{ duration: 0.9, repeat: Infinity, delay: d * 0.15 }} />
              ))}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* curseur de démonstration */}
      <AnimatePresence>
        {cursor && desktop && !reduce && !dimmed && (
          <motion.div
            key="cursor"
            className="pointer-events-none absolute left-0 top-0 z-10"
            initial={{ opacity: 0, x: vw / 2, y: vh / 2 }}
            animate={{ opacity: 1, x: cursor.x, y: cursor.y }}
            exit={{ opacity: 0 }}
            transition={{ type: 'spring', stiffness: 90, damping: 18, mass: 0.8 }}
            aria-hidden="true"
          >
            <AnimatePresence>
              {clickKey > 0 && (
                <motion.span
                  key={clickKey}
                  className="absolute -left-5 -top-5 h-10 w-10 rounded-full border-2 border-signal bg-signal/30"
                  initial={{ scale: 0.2, opacity: 1 }}
                  animate={{ scale: 1.6, opacity: 0 }}
                  transition={{ duration: 0.55, ease: 'easeOut' }}
                />
              )}
            </AnimatePresence>
            <motion.div key={`press-${clickKey}`} animate={clickKey ? { scale: [1, 0.8, 1] } : undefined} transition={{ duration: 0.25 }}>
              <MousePointer2 className="h-7 w-7 -translate-x-1 -translate-y-1 fill-white text-navy drop-shadow-[0_4px_8px_rgba(0,0,0,.35)]" strokeWidth={1.6} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* écran d’accueil */}
      <AnimatePresence>
        {phase === 'welcome' && (
          <motion.div key="welcome" className="absolute inset-0 grid place-items-center overflow-y-auto p-4" exit={{ opacity: 0 }}>
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 220, damping: 24 }}
              className="w-full max-w-[520px] overflow-hidden rounded-[22px] border border-p-line bg-p-card shadow-2xl"
            >
              <WelcomeArt reduce={reduce} />
              <div className="p-6 sm:p-7">
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-p-muted">{org.name}</p>
                <h2 className="mt-2 font-display text-[28px] leading-[1.05] tracking-[-0.035em] text-p-text sm:text-[32px]">Bienvenue, {user.firstName}&nbsp;!</h2>
                <p className="mt-2 text-[15px] leading-relaxed text-p-muted">On fait le tour de votre espace ensemble. Chaque zone est mise en lumière et zoomée, page après page.</p>
                <ul className="mt-5 grid grid-cols-2 gap-2">
                  {CHAPTERS.map((c, k) => {
                    const Icon = c.icon;
                    return (
                      <motion.li
                        key={c.title}
                        initial={reduce ? false : { opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 + k * 0.08 }}
                        className="flex items-center gap-2.5 rounded-[12px] bg-p-soft px-3 py-2.5 text-[13.5px] font-semibold text-p-text"
                      >
                        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-[8px] text-navy" style={{ background: c.color }}>
                          <Icon className="h-4 w-4" />
                        </span>
                        {c.title}
                      </motion.li>
                    );
                  })}
                </ul>
                <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                  <button onClick={() => start('full')} className="btn-shine inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-[12px] bg-signal px-5 text-[15px] font-bold text-navy shadow-[0_10px_24px_-10px_rgba(255,194,26,.9)] transition hover:brightness-105" autoFocus>
                    <Sparkles className="h-4 w-4" /> Visite complète · 2 min
                  </button>
                  <button onClick={() => start('essential')} className="inline-flex h-12 items-center justify-center rounded-[12px] border border-p-line px-4 text-[14.5px] font-semibold text-p-text transition hover:bg-p-hover">
                    L’essentiel · 30 s
                  </button>
                </div>
                <div className="mt-4 flex items-center justify-between gap-3 text-[12.5px] text-p-muted">
                  <span className="hidden items-center gap-1.5 sm:inline-flex">
                    <Keyboard className="h-3.5 w-3.5" /> ← → pour naviguer · Échap pour quitter
                  </span>
                  <button onClick={() => void close(true)} className="ml-auto font-semibold underline-offset-2 hover:text-p-text hover:underline">
                    Plus tard
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* bulle d’explication */}
      <AnimatePresence>
        {phase === 'step' && st && (
          <motion.div
            key="bubble"
            ref={bubbleRef}
            initial={reduce ? false : desktop ? { opacity: 0, scale: 0.94, left: bubble.left, top: bubble.top + 10 } : { opacity: 0, y: 16 }}
            animate={desktop ? { opacity: 1, scale: 1, left: bubble.left, top: bubble.top } : { opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={spring}
            className={cn('absolute rounded-[18px] border border-p-line bg-p-card shadow-[0_30px_60px_-20px_rgba(0,0,0,.55)]', desktop ? '' : sheetTop ? 'inset-x-3 top-3' : 'inset-x-3 bottom-[76px]')}
            style={desktop ? { width: BUBBLE_W } : undefined}
          >
            {desktop && side && ring && (
              <span
                className="absolute h-3.5 w-3.5 rotate-45 border-p-line bg-p-card"
                style={{
                  ...(side === 'left' && { left: -7.5, top: arrowOffset - 7, borderLeftWidth: 1, borderBottomWidth: 1 }),
                  ...(side === 'right' && { right: -7.5, top: arrowOffset - 7, borderRightWidth: 1, borderTopWidth: 1 }),
                  ...(side === 'top' && { top: -7.5, left: arrowOffset - 7, borderLeftWidth: 1, borderTopWidth: 1 }),
                  ...(side === 'bottom' && { bottom: -7.5, left: arrowOffset - 7, borderRightWidth: 1, borderBottomWidth: 1 }),
                }}
                aria-hidden="true"
              />
            )}
            <div className="p-5">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-bold text-navy" style={{ background: chapter.color }}>
                  <ChapterIcon className="h-3.5 w-3.5" /> {chapter.title}
                </span>
                <span className="font-mono text-[11.5px] text-p-muted">
                  {i + 1} / {steps.length}
                </span>
                <button onClick={() => void close(true)} className="ml-auto grid h-8 w-8 place-items-center rounded-[8px] text-p-muted hover:bg-p-hover hover:text-p-text" aria-label="Quitter la visite">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <AnimatePresence mode="wait" initial={false}>
                <motion.div key={st.id} initial={reduce ? false : { opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.22 }} aria-live="polite">
                  <h3 className="mt-3 text-[18px] font-bold leading-snug tracking-[-0.01em] text-p-text">{st.title}</h3>
                  <p className="mt-1.5 text-[14.5px] leading-relaxed text-p-muted">{typeof st.text === 'function' ? st.text(ctx.current) : st.text}</p>
                  {st.kbd && (
                    <p className="mt-3 inline-flex items-center gap-2 text-[13px] text-p-muted">
                      Raccourci
                      <kbd className="rounded-[6px] border border-b-2 border-p-line bg-p-soft px-2 py-0.5 font-mono text-[12.5px] font-semibold text-p-text">{st.kbd}</kbd>
                    </p>
                  )}
                </motion.div>
              </AnimatePresence>
              <div className="mt-4 flex gap-1.5" aria-hidden="true">
                {chapterStats.map((c, k) => (
                  <span key={k} className="h-1.5 flex-1 overflow-hidden rounded-full bg-p-soft" style={{ flexGrow: c.total }}>
                    <motion.span className="block h-full rounded-full bg-signal" initial={false} animate={{ width: `${(c.done / c.total) * 100}%` }} transition={{ duration: reduce ? 0 : 0.5 }} />
                  </span>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-2">
                <button onClick={prev} disabled={i === 0} className="inline-flex h-10 items-center gap-1.5 rounded-[10px] px-3 text-[13.5px] font-semibold text-p-muted transition hover:bg-p-hover hover:text-p-text disabled:opacity-40" aria-label="Étape précédente">
                  <ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">Précédent</span>
                </button>
                <button ref={primaryRef} onClick={next} className="ml-auto inline-flex h-10 items-center gap-1.5 rounded-[10px] bg-navy px-4 text-[14px] font-bold text-white transition hover:brightness-110 dark:bg-signal dark:text-navy">
                  {i < steps.length - 1 ? 'Suivant' : 'Terminer'} <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* fin de visite */}
      <AnimatePresence>
        {phase === 'done' && (
          <motion.div key="done" className="absolute inset-0 grid place-items-center overflow-y-auto p-4">
            {!reduce && <Confetti />}
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 24, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 220, damping: 22 }}
              className="relative w-full max-w-[460px] rounded-[22px] border border-p-line bg-p-card p-7 text-center shadow-2xl"
            >
              <svg viewBox="0 0 64 64" className="mx-auto h-16 w-16" aria-hidden="true">
                <motion.circle cx="32" cy="32" r="29" fill="none" stroke="#2F9E6E" strokeWidth="4" initial={{ pathLength: reduce ? 1 : 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.6 }} />
                <motion.path d="M20 33 l8 8 l16 -18" fill="none" stroke="#2F9E6E" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: reduce ? 1 : 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.4, delay: 0.5 }} />
              </svg>
              <h2 className="mt-4 font-display text-[28px] leading-tight tracking-[-0.035em] text-p-text">Vous êtes prêt, {user.firstName}&nbsp;!</h2>
              <p className="mt-2 text-[14.5px] leading-relaxed text-p-muted">{mode === 'full' ? 'Vous avez fait le tour complet de votre espace.' : 'Vous connaissez l’essentiel. La visite complète reste disponible à tout moment.'}</p>
              <ul className="mt-5 space-y-2 text-left">
                {CHAPTERS.filter((_, c) => steps.some((s) => s.chapter === c)).map((c, k) => (
                  <motion.li key={c.title} initial={reduce ? false : { opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7 + k * 0.08 }} className="flex items-center gap-2.5 rounded-[12px] bg-p-soft px-3 py-2.5 text-[14px] font-semibold text-p-text">
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-tri text-white">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                    {c.title}
                  </motion.li>
                ))}
              </ul>
              <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                {can(role, 'demandes') && (
                  <button
                    onClick={() => {
                      void close(true);
                      router.push('/pro/demandes/nouvelle');
                    }}
                    className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-[12px] bg-signal px-4 text-[15px] font-bold text-navy transition hover:brightness-105"
                    autoFocus
                  >
                    <Plus className="h-4 w-4" /> Première demande
                  </button>
                )}
                <button
                  onClick={() => {
                    void close(true);
                    router.push('/pro');
                  }}
                  className="inline-flex h-12 flex-1 items-center justify-center rounded-[12px] border border-p-line px-4 text-[14.5px] font-semibold text-p-text transition hover:bg-p-hover"
                >
                  Explorer librement
                </button>
              </div>
              <p className="mt-4 text-[12.5px] text-p-muted">Relancez la visite depuis le menu de votre profil ou dans Paramètres.</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Mini-écran animé : une loupe parcourt l’interface. */
function WelcomeArt({ reduce }: { reduce: boolean }) {
  const path = { x: [40, 170, 250, 120, 40], y: [38, 30, 92, 110, 38] };
  return (
    <div className="relative h-[168px] overflow-hidden bg-navy" aria-hidden="true">
      <div className="absolute inset-0 opacity-30 [background:radial-gradient(circle_at_80%_10%,#FFC21A_0,transparent_45%)]" />
      <div className="absolute left-1/2 top-6 h-[150px] w-[360px] -translate-x-1/2 rounded-t-[12px] border border-white/15 bg-[#13344A] p-2.5 shadow-2xl">
        <div className="flex gap-1">
          {['#E8664B', '#FFC21A', '#2F9E6E'].map((c) => (
            <span key={c} className="h-2 w-2 rounded-full" style={{ background: c }} />
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          <div className="w-[64px] space-y-1.5 rounded-[6px] bg-[#0E2A3B] p-1.5">
            <div className="h-3 rounded bg-signal" />
            {[0, 1, 2, 3, 4].map((k) => (
              <div key={k} className="h-2 rounded bg-white/15" />
            ))}
          </div>
          <div className="flex-1 space-y-1.5">
            <div className="grid grid-cols-4 gap-1.5">
              {[0, 1, 2, 3].map((k) => (
                <div key={k} className="h-8 rounded-[5px] bg-white/10 p-1">
                  <div className="h-1.5 w-6 rounded bg-white/25" />
                  <div className="mt-1 h-2.5 w-8 rounded bg-white/50" />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-[1.6fr_1fr] gap-1.5">
              <div className="flex h-[58px] items-end gap-1 rounded-[5px] bg-white/10 p-1.5">
                {[40, 65, 30, 80, 55, 70, 45, 90].map((h, k) => (
                  <motion.div key={k} className="flex-1 rounded-t-[2px] bg-[#2F9E6E]" initial={{ height: reduce ? `${h}%` : 0 }} animate={{ height: `${h}%` }} transition={{ delay: 0.3 + k * 0.05, duration: 0.5 }} />
                ))}
              </div>
              <div className="h-[58px] rounded-[5px] bg-signal/80" />
            </div>
          </div>
        </div>
      </div>
      <motion.div
        className="absolute left-1/2 top-6 -ml-[180px]"
        initial={{ x: 40, y: 38 }}
        animate={reduce ? undefined : path}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="relative -left-7 -top-7 grid h-14 w-14 place-items-center rounded-full border-[3px] border-signal bg-white/10 shadow-[0_0_0_6px_rgba(255,194,26,.18)] backdrop-blur-[1px]">
          <ZoomIn className="h-5 w-5 text-signal" />
        </div>
      </motion.div>
    </div>
  );
}

function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 36 }, (_, k) => ({
        k,
        x: (Math.random() - 0.5) * 900,
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
        <motion.span
          key={p.k}
          className="absolute block rounded-[2px]"
          style={{ background: p.c, width: p.w, height: p.w * 0.45 }}
          initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
          animate={{ x: p.x, y: [0, p.y, p.y + 520], rotate: p.r, opacity: [1, 1, 0] }}
          transition={{ duration: 2.2, delay: p.d, ease: [0.2, 0.7, 0.4, 1] }}
        />
      ))}
    </div>
  );
}
