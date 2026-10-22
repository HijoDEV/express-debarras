'use client';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Building2, Camera, Check, CheckCircle2, ImagePlus, Info, MapPin, ReceiptText, RotateCcw, ShieldCheck, X } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Illus } from '@/components/illus/Illus';
import { Counter } from '@/components/ui/Counter';
import { cn } from '@/lib/cn';
import { CP_DISTANCES, DELAYS, ITEMS, METROPOLE_CP, OPTIONS, PACKS, ROOMS, SITUATIONS, type IllusId } from '@/lib/data';
import { computeQuote, fmtEur, fmtVol, proPonctuelHT, type Quote } from '@/lib/pricing';
import { DEFAULT_SIM, SIM_EVENT, SIM_KEY, type SimState } from '@/lib/sim-store';
import { scrollToEl } from '@/lib/scroll';
import { addBooking, usePersistentState, type Booking } from '@/lib/storage';
import { ChoiceCard, Stepper, Toggle, TruckGauge } from './parts';

const STEP_LABELS = ['Situation', 'Contenu', 'Accès', 'Délai et services', 'Résultat'];
const SIT_ILLUS: Record<string, IllusId> = { meuble: 'armchair', objets: 'box', cave: 'bike', logement: 'sofa', local: 'desk' };

const eur = (n: number) => fmtEur(n);

/* ---------- Code postal ---------- */
function locate(cp: string): { kind: 'empty' | 'metro' | 'known' | 'unknown'; city?: string; km?: number } {
  if (!/^\d{5}$/.test(cp)) return { kind: 'empty' };
  if (METROPOLE_CP.includes(cp)) return { kind: 'metro' };
  if (CP_DISTANCES[cp]) return { kind: 'known', ...CP_DISTANCES[cp] };
  return { kind: 'unknown' };
}

/* ---------- Créneaux ---------- */
function makeSlots(delay: SimState['delay']): string[] {
  const out: string[] = [];
  const d = new Date();
  const fmt = (x: Date, h: string) => {
    const d0 = x.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    return `${d0.charAt(0).toUpperCase()}${d0.slice(1)} · ${h}`;
  };
  const add = (n: number) => {
    const x = new Date(d);
    x.setDate(d.getDate() + n);
    return x;
  };
  if (delay === 'urgence') return [fmt(add(1), '8 h'), fmt(add(1), '13 h'), fmt(add(1), '17 h')];
  if (delay === 'samedi') {
    const sats: Date[] = [];
    for (let i = 1; sats.length < 2 && i < 20; i++) if (add(i).getDay() === 6) sats.push(add(i));
    return [fmt(sats[0], '9 h'), fmt(sats[0], '14 h'), fmt(sats[1], '9 h')];
  }
  if (delay === 'tournee') {
    for (let i = 1; out.length < 3 && i < 30; i++) {
      const x = add(i);
      if (x.getDay() === 2 || x.getDay() === 4) out.push(fmt(x, '14 h – 18 h'));
    }
    return out;
  }
  // sous 48 h : jours ouvrés (hors dimanche)
  const days: Date[] = [];
  for (let i = 1; days.length < 2 && i < 10; i++) if (add(i).getDay() !== 0) days.push(add(i));
  return [fmt(days[0], '9 h'), fmt(days[0], '14 h'), fmt(days[1], '9 h')];
}

/* ====================================================================== */

export function Simulator({ fullPage = false }: { fullPage?: boolean }) {
  const [sim, setSim, hydrated] = usePersistentState<SimState>(SIM_KEY, DEFAULT_SIM);
  const [dir, setDir] = useState(1);
  const [photos, setPhotos] = useState<{ url: string; name: string }[]>([]);
  const [booking, setBooking] = useState<Booking | null>(null);
  const reduce = useReducedMotion();
  const top = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const on = (e: Event) => {
      setDir(1);
      setSim((e as CustomEvent<SimState>).detail);
    };
    window.addEventListener(SIM_EVENT, on);
    return () => window.removeEventListener(SIM_EVENT, on);
  }, [setSim]);

  const patch = (p: Partial<SimState>) => setSim((s) => ({ ...s, ...p }));
  const quote = useMemo<Quote>(
    () =>
      computeQuote({
        items: sim.mode === 'items' ? sim.items : {},
        rooms: sim.mode === 'rooms' ? sim.rooms : {},
        floor: sim.floor,
        elevator: sim.elevator,
        longCarry: sim.longCarry,
        distanceKm: sim.distanceKm,
        delay: sim.delay,
        dismantle: sim.dismantle,
        cleaningM2: sim.cleaningM2,
        pack: sim.pack,
      }),
    [sim],
  );

  const go = (n: number) => {
    setDir(n > sim.step ? 1 : -1);
    patch({ step: n });
    const el = top.current;
    if (el && el.getBoundingClientRect().top < 0) requestAnimationFrame(() => scrollToEl(el, -96));
  };

  const reset = () => {
    setPhotos([]);
    setBooking(null);
    setDir(-1);
    setSim(DEFAULT_SIM);
  };

  const canNext = sim.step === 0 ? !!sim.situation : sim.step === 1 ? quote.volume > 0 : true;
  const showSummary = sim.step >= 1 && sim.step <= 4;
  const isLocal = sim.situation === 'local';

  return (
    <div ref={top} className="relative">
      <div className={cn('grid gap-6', showSummary && 'lg:grid-cols-[1fr_340px]')}>
        {/* ---------- Carte principale ---------- */}
        <div className="relative min-w-0 overflow-hidden rounded-[28px] bg-white shadow-lift ring-1 ring-line">
          {sim.step <= 4 && (
            <div className="border-b border-line px-5 pb-4 pt-5 sm:px-8 sm:pt-7">
              <div className="flex items-center justify-between gap-3">
                <p className="font-mono text-label uppercase text-beton-600">
                  Étape {sim.step + 1} / 5 · <span className="text-navy">{STEP_LABELS[sim.step]}</span>
                </p>
                {(sim.step > 0 || sim.situation) && (
                  <button onClick={reset} className="inline-flex items-center gap-1.5 text-[13px] font-medium text-navy/70 hover:text-navy">
                    <RotateCcw className="h-3.5 w-3.5" /> Recommencer
                  </button>
                )}
              </div>
              <div className="mt-3 grid grid-cols-5 gap-1.5" aria-hidden>
                {STEP_LABELS.map((l, i) => (
                  <div key={l} className="h-1.5 overflow-hidden rounded-full bg-kraft">
                    <motion.div className="h-full rounded-full bg-signal" initial={false} animate={{ width: i <= sim.step ? '100%' : '0%' }} transition={{ duration: 0.5 }} />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className={cn('relative px-5 py-6 sm:px-8 sm:py-8', fullPage ? 'min-h-[520px]' : 'min-h-[480px]')}>
            <AnimatePresence mode="wait" custom={dir} initial={false}>
              <motion.div
                key={hydrated ? sim.step : 'ssr'}
                custom={dir}
                initial={reduce ? { opacity: 0 } : { opacity: 0, x: dir * 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, x: dir * -40 }}
                transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              >
                {sim.step === 0 && (
                  <StepSituation
                    value={sim.situation}
                    onPick={(id) => {
                      const s = SITUATIONS.find((x) => x.id === id)!;
                      setDir(1);
                      setSim((p) => ({
                        ...p,
                        situation: id,
                        mode: s.mode,
                        step: 1,
                        rooms: id === 'cave' && Object.keys(p.rooms).length === 0 ? { cave: 1 } : p.rooms,
                        delay: id === 'meuble' ? 'tournee' : p.delay,
                      }));
                    }}
                  />
                )}
                {sim.step === 1 && <StepContent sim={sim} patch={patch} quote={quote} photos={photos} setPhotos={setPhotos} />}
                {sim.step === 2 && <StepAccess sim={sim} patch={patch} />}
                {sim.step === 3 && <StepServices sim={sim} patch={patch} quote={quote} />}
                {sim.step === 4 && <StepResult sim={sim} patch={patch} quote={quote} isLocal={isLocal} onBook={() => go(5)} />}
                {sim.step === 5 && (
                  <StepContact
                    sim={sim}
                    quote={quote}
                    photos={photos.length}
                    onBack={() => go(4)}
                    onDone={(b) => {
                      addBooking(b);
                      setBooking(b);
                      go(6);
                    }}
                  />
                )}
                {sim.step === 6 && <Confirmation booking={booking} onReset={reset} />}
              </motion.div>
            </AnimatePresence>
          </div>

          {sim.step >= 1 && sim.step <= 3 && (
            <div className="flex items-center justify-between gap-3 border-t border-line bg-kraft/60 px-5 py-4 sm:px-8">
              <button onClick={() => go(sim.step - 1)} className="inline-flex h-12 items-center gap-2 rounded-btn px-3 text-[15px] font-semibold text-navy hover:bg-white">
                <ArrowLeft className="h-4 w-4" /> Retour
              </button>
              <button
                onClick={() => go(sim.step + 1)}
                disabled={!canNext}
                className="group inline-flex h-12 items-center gap-2 rounded-btn bg-navy px-5 text-[15px] font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-lift disabled:opacity-40 disabled:hover:translate-y-0"
              >
                {sim.step === 3 ? 'Voir mon prix' : 'Continuer'}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          )}
          {sim.step === 4 && (
            <div className="border-t border-line bg-kraft/60 px-5 py-4 sm:px-8">
              <button onClick={() => go(3)} className="inline-flex h-12 items-center gap-2 rounded-btn px-3 text-[15px] font-semibold text-navy hover:bg-white">
                <ArrowLeft className="h-4 w-4" /> Modifier
              </button>
            </div>
          )}
        </div>

        {/* ---------- Récapitulatif desktop ---------- */}
        {showSummary && (
          <aside className="hidden lg:block" aria-label="Récapitulatif du prix">
            <div className="sticky top-28">
              <Summary quote={quote} />
            </div>
          </aside>
        )}
      </div>

      {/* ---------- Barre mobile collante ---------- */}
      {showSummary && (
        <div className="sticky bottom-3 z-30 mt-4 lg:hidden">
          <div className="on-dark flex items-center justify-between gap-3 rounded-2xl bg-navy px-4 py-3 text-white shadow-lift">
            <div className="min-w-0">
              <p className="truncate text-[12px] text-white/60">
                {quote.formula ? quote.formulaName : 'Votre estimation'} · {fmtVol(quote.volume)}
              </p>
              <p className="font-display text-[24px] leading-none tight">
                <Counter value={quote.total} format={(n) => eur(Math.round(n))} /> <span className="font-sans text-[12px] font-medium text-white/60">TTC</span>
              </p>
            </div>
            {sim.step < 4 ? (
              <button onClick={() => go(sim.step + 1)} disabled={!canNext} className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-btn bg-signal px-4 text-[14.5px] font-semibold text-navy disabled:opacity-40">
                {sim.step === 3 ? 'Mon prix' : 'Continuer'} <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button onClick={() => go(5)} className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-btn bg-signal px-4 text-[14.5px] font-semibold text-navy">
                Réserver <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ====================================================================== */

function Summary({ quote }: { quote: Quote }) {
  return (
    <div className="on-dark overflow-hidden rounded-[28px] bg-navy text-white shadow-lift">
      <div className="p-6">
        <p className="font-mono text-label uppercase text-signal">Votre estimation</p>
        <p className="mt-3 text-[15px] text-white/70">{quote.formula ? quote.formulaName : 'Ajoutez vos objets'}</p>
        <p className="mt-1 font-display text-[48px] leading-none tight">
          <Counter value={quote.total} format={(n) => eur(Math.round(n))} />
        </p>
        <p className="mt-2 text-[13px] text-white/60">TTC · volume estimé {fmtVol(quote.volume)}</p>
      </div>
      {quote.lines.length > 0 && (
        <ul className="space-y-2 border-t border-white/10 px-6 py-5 text-[13.5px]">
          {quote.lines.map((l) => (
            <li key={l.label} className="flex justify-between gap-3">
              <span className="text-white/75">{l.label}</span>
              <span className="shrink-0 tabular-nums">{fmtEur(l.amount, l.amount % 1 !== 0)}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="flex items-center gap-2 border-t border-white/10 bg-white/5 px-6 py-4 text-[12.5px] text-white/70">
        <ShieldCheck className="h-4 w-4 shrink-0 text-signal" /> Prix ferme après validation de vos photos
      </div>
    </div>
  );
}

/* ---------- Étape 1 ---------- */
function StepSituation({ value, onPick }: { value: SimState['situation']; onPick: (id: SimState['situation'] & string) => void }) {
  return (
    <div>
      <h2 className="font-display text-h3 text-navy">Que voulez-vous débarrasser ?</h2>
      <p className="mt-2 text-[15px] text-navy/65">Choisissez la situation la plus proche. Vous pourrez tout ajuster.</p>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5" role="radiogroup" aria-label="Situation">
        {SITUATIONS.map((s) => (
          <ChoiceCard key={s.id} selected={value === s.id} onClick={() => onPick(s.id)} title={s.label} hint={s.hint}>
            <span className={cn('mb-4 grid h-14 w-14 place-items-center rounded-2xl', value === s.id ? 'bg-white' : 'bg-kraft')}>
              <Illus id={SIT_ILLUS[s.id]} className="h-10 w-10" />
            </span>
          </ChoiceCard>
        ))}
      </div>
    </div>
  );
}

/* ---------- Étape 2 ---------- */
function StepContent({
  sim,
  patch,
  quote,
  photos,
  setPhotos,
}: {
  sim: SimState;
  patch: (p: Partial<SimState>) => void;
  quote: Quote;
  photos: { url: string; name: string }[];
  setPhotos: React.Dispatch<React.SetStateAction<{ url: string; name: string }[]>>;
}) {
  const [drag, setDrag] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const next = Array.from(files)
      .filter((f) => f.type.startsWith('image/'))
      .slice(0, 12)
      .map((f) => ({ url: URL.createObjectURL(f), name: f.name }));
    setPhotos((p) => [...p, ...next].slice(0, 12));
  };
  const setItem = (id: string, n: number) => patch({ items: { ...sim.items, [id]: n } });
  const setRoom = (id: string, n: number) => patch({ rooms: { ...sim.rooms, [id]: n } });

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-h3 text-navy">Qu’y a-t-il à enlever ?</h2>
          <p className="mt-2 text-[15px] text-navy/65">Objet par objet, ou par pièce type si c’est plus simple.</p>
        </div>
        <div className="inline-flex rounded-full bg-kraft p-1" role="tablist" aria-label="Mode de saisie">
          {(['items', 'rooms'] as const).map((m) => (
            <button
              key={m}
              role="tab"
              aria-selected={sim.mode === m}
              onClick={() => patch({ mode: m })}
              className={cn('relative h-9 rounded-full px-4 text-[14px] font-semibold transition-colors', sim.mode === m ? 'text-white' : 'text-navy/70')}
            >
              {sim.mode === m && <motion.span layoutId="mode-pill" className="absolute inset-0 rounded-full bg-navy" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
              <span className="relative">{m === 'items' ? 'Objet par objet' : 'Pièces types'}</span>
            </button>
          ))}
        </div>
      </div>

      {sim.mode === 'items' ? (
        <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {ITEMS.map((it) => {
            const n = sim.items[it.id] ?? 0;
            return (
              <div key={it.id} className={cn('flex items-center gap-3 rounded-2xl p-2.5 pr-3 ring-1 transition', n > 0 ? 'bg-signal-soft ring-signal' : 'bg-white ring-line')}>
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-kraft">
                  <Illus id={it.illus} className="h-8 w-8" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14.5px] font-semibold">{it.name}</span>
                  <span className="text-[12.5px] text-navy/70">{fmtVol(it.volume)}</span>
                </span>
                <Stepper size="sm" value={n} onChange={(v) => setItem(it.id, v)} label={it.name} max={50} />
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {ROOMS.map((r) => {
            const n = sim.rooms[r.id] ?? 0;
            return (
              <div key={r.id} className={cn('flex items-center justify-between gap-3 rounded-2xl p-4 ring-1 transition', n > 0 ? 'bg-signal-soft ring-signal' : 'bg-white ring-line')}>
                <span>
                  <span className="block text-[15px] font-semibold">{r.name}</span>
                  <span className="text-[13px] text-navy/70">≈ {fmtVol(r.volume)}</span>
                </span>
                <Stepper size="sm" value={n} onChange={(v) => setRoom(r.id, v)} label={r.name} max={6} />
              </div>
            );
          })}
        </div>
      )}

      {/* Volume + jauge */}
      <div className="mt-6 flex flex-col justify-between gap-4 rounded-2xl bg-kraft p-4 sm:flex-row sm:items-center">
        <div>
          <p className="font-mono text-label uppercase text-beton-600">Volume total</p>
          <p className="mt-1 font-display text-[34px] leading-none tight">
            <Counter value={quote.volume} format={(n) => fmtVol(Math.round(n * 10) / 10)} duration={0.5} />
          </p>
          {quote.eligibleObjet && <p className="mt-1.5 text-[13px] font-medium text-tri-dark">Éligible Express Objet · dès 49 €</p>}
        </div>
        <TruckGauge volume={quote.volume} />
      </div>

      {/* Photos */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          addFiles(e.dataTransfer.files);
        }}
        className={cn('mt-4 rounded-2xl border-2 border-dashed p-5 transition', drag ? 'border-signal bg-signal-soft' : 'border-line')}
      >
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-signal">
            <Camera className="h-5 w-5" />
          </span>
          <div className="flex-1">
            <p className="text-[15px] font-semibold">Ajoutez vos photos</p>
            <p className="text-[13px] text-navy/70">Une vue large par pièce suffit. Démo : rien n’est envoyé.</p>
          </div>
          <button type="button" onClick={() => input.current?.click()} className="inline-flex h-11 items-center gap-2 rounded-btn bg-white px-4 text-[14.5px] font-semibold ring-1 ring-line hover:ring-navy/40">
            <ImagePlus className="h-4 w-4" /> Choisir
          </button>
          <input ref={input} type="file" accept="image/*" multiple className="sr-only" onChange={(e) => addFiles(e.target.files)} aria-label="Ajouter des photos" />
        </div>
        {photos.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {photos.map((p, i) => (
              <motion.div key={p.url} initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt={`Photo ${i + 1}`} className="h-16 w-16 rounded-xl object-cover ring-1 ring-line" />
                <button onClick={() => setPhotos((ps) => ps.filter((x) => x.url !== p.url))} aria-label={`Retirer la photo ${i + 1}`} className="absolute -right-1.5 -top-1.5 grid h-6 w-6 place-items-center rounded-full bg-navy text-white">
                  <X className="h-3 w-3" />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- Étape 3 ---------- */
function StepAccess({ sim, patch }: { sim: SimState; patch: (p: Partial<SimState>) => void }) {
  const loc = locate(sim.postalCode);
  const extraKm = Math.max(0, Math.round(sim.distanceKm) - OPTIONS.kmFree);
  return (
    <div>
      <h2 className="font-display text-h3 text-navy">Comment accède-t-on ?</h2>
      <p className="mt-2 text-[15px] text-navy/65">Pour prévoir l’équipe et le bon matériel.</p>

      <div className="mt-6 grid gap-3">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl p-4 ring-1 ring-line">
          <span>
            <span className="block text-[15.5px] font-semibold">Étage</span>
            <span className="text-[13px] text-navy/70">{sim.floor === 0 ? 'Rez-de-chaussée' : `${sim.floor}${sim.floor === 1 ? 'er' : 'e'} étage`}</span>
          </span>
          <Stepper value={sim.floor} onChange={(v) => patch({ floor: v })} max={10} label="Étage" />
        </div>
        <Toggle checked={sim.elevator} onChange={(v) => patch({ elevator: v })} label="Ascenseur utilisable" hint={`Sans ascenseur : + ${OPTIONS.floorFee} € par étage à partir du 2e`} />
        <Toggle checked={sim.longCarry} onChange={(v) => patch({ longCarry: v })} label="Portage de plus de 30 m" hint="Entre le camion et la porte · + 30 €" />

        <div className="rounded-2xl p-4 ring-1 ring-line">
          <label htmlFor="cp" className="block text-[15.5px] font-semibold">
            Code postal
          </label>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <div className="relative">
              <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy/40" />
              <input
                id="cp"
                inputMode="numeric"
                autoComplete="postal-code"
                maxLength={5}
                value={sim.postalCode}
                onChange={(e) => {
                  const cp = e.target.value.replace(/\D/g, '').slice(0, 5);
                  const l = locate(cp);
                  patch({ postalCode: cp, distanceKm: l.kind === 'known' ? l.km! : l.kind === 'unknown' ? 50 : 0 });
                }}
                placeholder="76000"
                className="h-12 w-36 rounded-xl bg-kraft pl-9 pr-3 text-[16px] font-semibold tracking-wider outline-none ring-1 ring-transparent focus:bg-white focus:ring-navy"
              />
            </div>
            <AnimatePresence mode="wait">
              {loc.kind === 'metro' && (
                <motion.p key="m" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="inline-flex items-center gap-1.5 text-[14px] font-medium text-tri-dark">
                  <Check className="h-4 w-4" /> Métropole de Rouen · sans frais de déplacement
                </motion.p>
              )}
              {loc.kind === 'known' && (
                <motion.p key="k" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="text-[14px] text-navy/75">
                  {loc.city} · {loc.km} km de Rouen{extraKm > 0 && <strong className="ml-1 text-navy">· + {extraKm} km facturés</strong>}
                </motion.p>
              )}
              {loc.kind === 'unknown' && (
                <motion.div key="u" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="flex flex-wrap items-center gap-2 text-[14px]">
                  <span className="text-navy/70">Hors Métropole · distance depuis Rouen :</span>
                  <Stepper size="sm" value={sim.distanceKm} onChange={(v) => patch({ distanceKm: v })} step={5} max={200} label="Distance en km" />
                  <span className="text-navy/70">km</span>
                  {extraKm > 0 && <strong>· + {extraKm} km</strong>}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Étape 4 ---------- */
function StepServices({ sim, patch, quote }: { sim: SimState; patch: (p: Partial<SimState>) => void; quote: Quote }) {
  const packIncludesDismantle = sim.pack !== 'essentiel';
  return (
    <div>
      <h2 className="font-display text-h3 text-navy">Quand et avec quoi ?</h2>
      <p className="mt-2 text-[15px] text-navy/65">Choisissez le délai, puis les services utiles.</p>

      <p className="mt-6 font-mono text-label uppercase text-beton-600">Délai</p>
      <div className="mt-3 grid grid-cols-2 gap-2.5" role="radiogroup" aria-label="Délai">
        {DELAYS.map((d) => {
          const disabled = d.id === 'tournee' && !quote.eligibleObjet;
          return (
            <ChoiceCard key={d.id} selected={quote.delay === d.id} disabled={disabled} onClick={() => patch({ delay: d.id })} title={d.label} hint={disabled ? 'Réservé à Express Objet' : d.hint} />
          );
        })}
      </div>

      <p className="mt-7 font-mono text-label uppercase text-beton-600">Services</p>
      <div className="mt-3 grid gap-2.5">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl p-4 ring-1 ring-line">
          <span>
            <span className="block text-[15.5px] font-semibold">Démontage</span>
            <span className="text-[13px] text-navy/70">{packIncludesDismantle ? 'Inclus dans votre pack' : `${OPTIONS.dismantle} € par meuble`}</span>
          </span>
          <Stepper value={sim.dismantle} onChange={(v) => patch({ dismantle: v })} max={30} label="Meubles à démonter" />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl p-4 ring-1 ring-line">
          <span>
            <span className="block text-[15.5px] font-semibold">Nettoyage</span>
            <span className="text-[13px] text-navy/70">{sim.pack === 'cles' ? 'Inclus jusqu’à 60 m²' : `${OPTIONS.cleaning} € / m²`}</span>
          </span>
          <div className="flex items-center gap-2">
            <Stepper value={sim.cleaningM2} onChange={(v) => patch({ cleaningM2: v })} step={5} max={300} label="Surface à nettoyer en m²" />
            <span className="text-[14px] text-navy/70">m²</span>
          </div>
        </div>
      </div>

      <p className="mt-7 font-mono text-label uppercase text-beton-600">Pack</p>
      <div className="mt-3 grid gap-2.5 sm:grid-cols-3" role="radiogroup" aria-label="Pack">
        {PACKS.map((p) => (
          <ChoiceCard key={p.id} selected={sim.pack === p.id} onClick={() => patch({ pack: p.id })} title={p.name} hint={p.price ? `+ ${p.price} €` : 'Inclus'} badge={p.id === 'cles' ? 'Successions' : undefined}>
            <span className="mb-2 text-[12.5px] opacity-70">{p.tagline}</span>
          </ChoiceCard>
        ))}
      </div>
    </div>
  );
}

/* ---------- Étape 5 ---------- */
function StepResult({ sim, patch, quote, isLocal, onBook }: { sim: SimState; patch: (p: Partial<SimState>) => void; quote: Quote; isLocal: boolean; onBook: () => void }) {
  const slots = useMemo(() => makeSlots(quote.delay), [quote.delay]);
  useEffect(() => {
    if (!sim.slot || !slots.includes(sim.slot)) patch({ slot: slots[0] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slots]);

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-label uppercase text-beton-600">Formule recommandée</p>
          <h2 className="mt-2 font-display text-h2 text-navy">{quote.formulaName}</h2>
          <p className="mt-2 text-[15px] text-navy/65">
            {fmtVol(quote.volume)} estimés · {DELAYS.find((d) => d.id === quote.delay)!.label.toLowerCase()}
          </p>
        </div>
        <span className="hidden h-16 w-16 shrink-0 place-items-center rounded-2xl bg-signal sm:grid">
          <ReceiptText className="h-7 w-7" />
        </span>
      </div>

      {/* Ticket */}
      <div className="mt-6 rounded-2xl bg-kraft p-5 font-mono text-[13px]">
        <p className="text-center text-[11px] uppercase tracking-[0.2em] text-navy/70">Ticket · détail du prix</p>
        <div className="my-3 dotted-sep" />
        <ul className="space-y-2.5">
          {quote.lines.map((l, i) => (
            <motion.li key={l.label} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.08 * i }} className="flex justify-between gap-4">
              <span className="text-navy/80">{l.label}</span>
              <span className="shrink-0 tabular-nums text-navy">{fmtEur(l.amount, l.amount % 1 !== 0)}</span>
            </motion.li>
          ))}
        </ul>
        <div className="my-3 dotted-sep" />
        <div className="flex items-end justify-between gap-4 font-sans">
          <span className="text-[14px] font-semibold">Total TTC</span>
          <span className="font-display text-[42px] leading-none tight">
            <Counter value={quote.total} format={(n) => eur(Math.round(n))} duration={1.1} />
          </span>
        </div>
        <p className="mt-2 text-right font-sans text-[13px] text-navy/70">Acompte de 30 % à la réservation : {eur(quote.deposit)}</p>
      </div>
      <p className="mt-3 flex items-center gap-2 text-[13.5px] font-medium text-tri-dark">
        <ShieldCheck className="h-4 w-4" /> Prix ferme après validation de vos photos
      </p>

      {isLocal && (
        <div className="mt-4 flex gap-3 rounded-2xl bg-signal-soft p-4 text-[14px]">
          <Building2 className="h-5 w-5 shrink-0" />
          <p>
            Professionnel ? En débarras ponctuel, ce volume vous coûterait <strong>{eur(proPonctuelHT(quote.volume))} HT</strong>, bordereau de traçabilité inclus.{' '}
            <Link href="/pros" className="font-semibold underline underline-offset-2">
              Voir les offres pros
            </Link>
          </p>
        </div>
      )}

      <p className="mt-6 font-mono text-label uppercase text-beton-600">Choisissez un créneau</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Créneau">
        {slots.map((s) => (
          <button
            key={s}
            role="radio"
            aria-checked={sim.slot === s}
            onClick={() => patch({ slot: s })}
            className={cn('rounded-2xl p-3.5 text-left text-[14px] font-semibold ring-1 transition', sim.slot === s ? 'bg-navy text-white ring-navy' : 'bg-white ring-line hover:ring-navy/40')}
          >
            {s}
          </button>
        ))}
      </div>

      <button
        onClick={onBook}
        className="group mt-6 inline-flex h-14 w-full items-center justify-center gap-2 rounded-btn bg-signal px-6 text-[16px] font-semibold text-navy shadow-signal transition hover:-translate-y-0.5 hover:shadow-signal-lg"
      >
        <Camera className="h-5 w-5" /> Envoyer mes photos et réserver
        <ArrowRight className="h-[18px] w-[18px] transition-transform group-hover:translate-x-1" />
      </button>
    </div>
  );
}

/* ---------- Coordonnées ---------- */
function StepContact({ sim, quote, photos, onBack, onDone }: { sim: SimState; quote: Quote; photos: number; onBack: () => void; onDone: (b: Booking) => void }) {
  const [f, setF] = useState({ name: '', phone: '', email: '', address: '' });
  const [touched, setTouched] = useState(false);
  const errors = {
    name: f.name.trim().length < 2 ? 'Indiquez votre nom.' : '',
    phone: !/^(\+33\s?|0)[1-9](\s?\d{2}){4}$/.test(f.phone.trim()) ? 'Numéro au format 06 12 34 56 78.' : '',
    email: !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim()) ? 'Adresse e-mail invalide.' : '',
    address: f.address.trim().length < 6 ? 'Indiquez l’adresse du débarras.' : '',
  };
  const valid = Object.values(errors).every((e) => !e);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!valid) return;
    onDone({
      id: `ED-${Date.now().toString(36).slice(-5).toUpperCase()}`,
      createdAt: new Date().toISOString(),
      name: f.name.trim(),
      phone: f.phone.trim(),
      email: f.email.trim(),
      address: f.address.trim(),
      postalCode: sim.postalCode,
      slot: sim.slot ?? '',
      formulaName: quote.formulaName,
      volume: quote.volume,
      total: quote.total,
      deposit: quote.deposit,
      lines: quote.lines.map(({ label, amount }) => ({ label, amount })),
      items: sim.mode === 'items' ? sim.items : {},
      rooms: sim.mode === 'rooms' ? sim.rooms : {},
      photos,
      status: 'Nouveau',
    });
  };

  const field = (k: keyof typeof f, label: string, type: string, auto: string, placeholder: string) => (
    <div>
      <label htmlFor={`f-${k}`} className="block text-[14px] font-semibold">
        {label}
      </label>
      <input
        id={`f-${k}`}
        type={type}
        autoComplete={auto}
        value={f[k]}
        placeholder={placeholder}
        onChange={(e) => setF({ ...f, [k]: e.target.value })}
        aria-invalid={touched && !!errors[k]}
        aria-describedby={touched && errors[k] ? `e-${k}` : undefined}
        className={cn('mt-1.5 h-12 w-full rounded-xl bg-kraft px-4 text-[16px] outline-none ring-1 transition focus:bg-white focus:ring-navy', touched && errors[k] ? 'ring-[#C0392B]' : 'ring-transparent')}
      />
      {touched && errors[k] && (
        <p id={`e-${k}`} className="mt-1 text-[13px] text-[#B03A2E]">
          {errors[k]}
        </p>
      )}
    </div>
  );

  return (
    <form onSubmit={submit} noValidate>
      <p className="font-mono text-label uppercase text-beton-600">Dernière étape</p>
      <h2 className="mt-2 font-display text-h3 text-navy">Vos coordonnées</h2>
      <p className="mt-2 text-[15px] text-navy/65">
        {quote.formulaName} · <strong className="text-navy">{eur(quote.total)} TTC</strong> · <span>{sim.slot}</span>
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {field('name', 'Nom et prénom', 'text', 'name', 'Claire Martin')}
        {field('phone', 'Téléphone', 'tel', 'tel', '06 12 34 56 78')}
        {field('email', 'E-mail', 'email', 'email', 'claire@exemple.fr')}
        {field('address', 'Adresse du débarras', 'text', 'street-address', '12 rue du Gros-Horloge, Rouen')}
      </div>
      <p className="mt-4 flex gap-2 text-[13px] text-navy/70">
        <Info className="mt-0.5 h-4 w-4 shrink-0" /> Démonstration : aucune donnée n’est envoyée, aucun paiement n’est demandé.
      </p>
      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <button type="button" onClick={onBack} className="inline-flex h-12 items-center justify-center gap-2 rounded-btn px-3 text-[15px] font-semibold hover:bg-kraft">
          <ArrowLeft className="h-4 w-4" /> Retour
        </button>
        <button type="submit" className="group inline-flex h-14 items-center justify-center gap-2 rounded-btn bg-signal px-6 text-[16px] font-semibold text-navy shadow-signal transition hover:-translate-y-0.5 hover:shadow-signal-lg">
          Confirmer la réservation <ArrowRight className="h-[18px] w-[18px] transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </form>
  );
}

/* ---------- Confirmation ---------- */
function Confirmation({ booking, onReset }: { booking: Booking | null; onReset: () => void }) {
  const reduce = useReducedMotion();
  useEffect(() => {
    if (reduce) return;
    let cancelled = false;
    import('canvas-confetti').then(({ default: confetti }) => {
      if (cancelled) return;
      const colors = ['#FFC21A', '#FFD75E', '#0E2A3B', '#FFFFFF'];
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.55 }, colors, disableForReducedMotion: true });
      setTimeout(() => confetti({ particleCount: 60, angle: 60, spread: 60, origin: { x: 0, y: 0.7 }, colors }), 250);
      setTimeout(() => confetti({ particleCount: 60, angle: 120, spread: 60, origin: { x: 1, y: 0.7 }, colors }), 400);
    });
    return () => {
      cancelled = true;
    };
  }, [reduce]);

  return (
    <div className="py-6 text-center">
      <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 16 }} className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-tri text-white">
        <CheckCircle2 className="h-10 w-10" />
      </motion.span>
      <h2 className="mx-auto mt-6 max-w-md font-display text-h2 text-navy">Réservation enregistrée.</h2>
      <p className="mt-3 text-body-lg text-navy/70">Nous vous recontactons sous 1 h.</p>
      {booking && (
        <div className="mx-auto mt-8 max-w-sm rounded-2xl bg-kraft p-5 text-left text-[14.5px]">
          <div className="flex justify-between">
            <span className="text-navy/70">Référence</span>
            <span className="font-mono font-semibold">{booking.id}</span>
          </div>
          <div className="mt-2 flex justify-between gap-4">
            <span className="text-navy/70">Créneau</span>
            <span className="text-right font-semibold">{booking.slot}</span>
          </div>
          <div className="mt-2 flex justify-between">
            <span className="text-navy/70">{booking.formulaName}</span>
            <span className="font-semibold">{fmtEur(booking.total)} TTC</span>
          </div>
          <div className="my-3 dotted-sep" />
          <div className="flex justify-between">
            <span className="font-semibold">Acompte 30 %</span>
            <span className="font-display text-[22px] leading-none tight">{fmtEur(booking.deposit)}</span>
          </div>
          <p className="mt-2 text-[12.5px] text-navy/70">Démonstration : aucun paiement n’est effectué.</p>
        </div>
      )}
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <Link href="/espace" className="inline-flex h-12 items-center justify-center rounded-btn bg-navy px-5 text-[15px] font-semibold text-white hover:bg-navy-700">
          Voir dans l’espace équipe
        </Link>
        <button onClick={onReset} className="inline-flex h-12 items-center justify-center rounded-btn px-5 text-[15px] font-semibold ring-1 ring-line hover:ring-navy/40">
          Nouvelle estimation
        </button>
      </div>
    </div>
  );
}
