'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { addDays, format, isSameDay, startOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Box, Building2, Camera, Check, CheckCircle2, Home, MapPin, Plus, Search, Warehouse, X } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Illus } from '@/components/illus/Illus';
import { cn } from '@/lib/cn';
import { ITEMS } from '@/lib/data';
import { computeVolume } from '@/lib/pricing';
import { addSite, createDemand, listSites, quoteDemand } from '@/lib/pro/api';
import { useApi } from '@/lib/pro/hooks';
import { eur } from '@/lib/pro/pricing';
import type { Delay, Intervention, InterventionContent, Site } from '@/lib/pro/types';
import { Btn, Card, Field, inputCls, LoadingList, Segmented, StatusBadge, Switch } from './ui';

const STEPS = ['Lieu', 'Contenu', 'Délai', 'Récapitulatif'];
const KIND_ICON = { logement: Home, entrepot: Warehouse, box: Box, bureau: Building2 };

const siteSchema = z.object({
  label: z.string().min(2, 'Nom du lieu requis'),
  address: z.string().min(4, 'Adresse requise'),
  postalCode: z.string().regex(/^\d{5}$/, '5 chiffres'),
  city: z.string().min(2, 'Ville requise'),
  floor: z.coerce.number().int().min(0).max(20),
  elevator: z.boolean(),
  accessCode: z.string().optional(),
  onSiteContact: z.string().optional(),
  keys: z.enum(['agence', 'gardien', 'sur-place']),
});
type SiteForm = z.infer<typeof siteSchema>;

type State = {
  siteId: string | null;
  contact: string;
  keys: Site['keys'];
  mode: InterventionContent['mode'];
  volume: number;
  items: Record<string, number>;
  boxes: string[];
  deee: boolean;
  archives: boolean;
  mobilierBureau: boolean;
  photos: { url: string; name: string }[];
  delay: Delay;
  date: string | null;
  window: string;
  internalRef: string;
  purchaseOrder: string;
};

export function NewDemand() {
  const router = useRouter();
  const params = useSearchParams();
  const reduce = useReducedMotion();
  const { data: sites, loading } = useApi(listSites);
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState<Intervention | null>(null);
  const [s, setS] = useState<State>({
    siteId: params.get('site'),
    contact: '',
    keys: 'agence',
    mode: 'volume',
    volume: 6,
    items: {},
    boxes: [],
    deee: false,
    archives: false,
    mobilierBureau: false,
    photos: [],
    delay: '48h',
    date: null,
    window: '8 h – 12 h',
    internalRef: '',
    purchaseOrder: '',
  });
  const patch = (p: Partial<State>) => setS((x) => ({ ...x, ...p }));
  const site = sites?.find((x) => x.id === s.siteId) ?? null;
  const isBoxSite = !!site?.boxes?.length;

  const volume = s.mode === 'objets' ? computeVolume(s.items, {}) : s.mode === 'box' ? Math.round(s.boxes.length * 4.5 * 10) / 10 : s.volume;
  const content: InterventionContent = { mode: s.mode, volume, items: s.mode === 'objets' ? s.items : undefined, boxes: s.mode === 'box' ? s.boxes : undefined, deee: s.deee, archives: s.archives, mobilierBureau: s.mobilierBureau, photos: s.photos.length };
  const quote = useMemo(() => (s.siteId ? quoteDemand({ siteId: s.siteId, content, delay: s.delay }) : null), [s.siteId, JSON.stringify(content), s.delay]); // eslint-disable-line react-hooks/exhaustive-deps

  const valid = [!!s.siteId, s.mode === 'box' ? s.boxes.length > 0 : volume > 0, !!s.date, true];
  const go = (n: number) => {
    setDir(n > step ? 1 : -1);
    setStep(n);
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  };

  const submit = async () => {
    if (!s.siteId || !s.date) return;
    setSending(true);
    try {
      const it = await createDemand({ siteId: s.siteId, content, delay: s.delay, slot: { date: s.date, window: s.window }, internalRef: s.internalRef, purchaseOrder: s.purchaseOrder });
      setDone(it);
      toast.success(`Demande ${it.ref} envoyée`, { description: 'Elle apparaît déjà dans l’espace équipe.' });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSending(false);
    }
  };

  if (done)
    return (
      <Card className="mx-auto max-w-xl p-8 text-center">
        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 15 }} className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-tri text-white">
          <CheckCircle2 className="h-8 w-8" />
        </motion.span>
        <h1 className="mt-5 font-display text-[28px] tracking-[-0.035em]">Demande envoyée</h1>
        <p className="mt-2 text-p-muted">
          Référence <span className="font-mono font-semibold text-p-text">{done.ref}</span>
        </p>
        <div className="mt-3 flex justify-center">
          <StatusBadge status={done.status} />
        </div>
        <p className="mx-auto mt-4 max-w-sm text-[14px] text-p-muted">{done.status === 'devis_signe' ? 'Couverte par votre abonnement : nous planifions le passage.' : 'Nous validons vos photos et vous envoyons le devis dans l’heure.'}</p>
        <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
          <Btn variant="primary" onClick={() => router.push(`/pro/interventions?id=${done.id}`)}>
            Suivre l’intervention <ArrowRight className="h-4 w-4" />
          </Btn>
          <Btn
            onClick={() => {
              setDone(null);
              setStep(0);
            }}
          >
            Nouvelle demande
          </Btn>
        </div>
      </Card>
    );

  return (
    <div>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-p-muted">Nouvelle demande</p>
          <h1 className="mt-1 font-display text-[28px] leading-none tracking-[-0.035em] sm:text-[34px]">{STEPS[step]}</h1>
        </div>
        <Btn variant="ghost" onClick={() => router.back()}>
          <X className="h-4 w-4" /> Annuler
        </Btn>
      </div>

      {/* étapes */}
      <ol className="mb-6 grid grid-cols-4 gap-2" aria-label="Étapes">
        {STEPS.map((l, i) => (
          <li key={l}>
            <button onClick={() => i < step && go(i)} disabled={i > step} aria-current={i === step ? 'step' : undefined} className="w-full text-left">
              <div className="h-1.5 overflow-hidden rounded-full bg-p-soft">
                <motion.div className="h-full rounded-full bg-signal" initial={false} animate={{ width: i <= step ? '100%' : '0%' }} />
              </div>
              <p className={cn('mt-2 flex items-center gap-1.5 text-[12.5px] font-semibold', i <= step ? 'text-p-text' : 'text-p-muted')}>
                {i < step ? <Check className="h-3.5 w-3.5 text-tri" /> : <span className="font-mono">{i + 1}</span>}
                <span className={cn(i !== step && 'hidden sm:inline')}>{l}</span>
              </p>
            </button>
          </li>
        ))}
      </ol>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Card className="overflow-hidden">
          <div className="min-h-[440px] p-5 sm:p-6">
            <AnimatePresence mode="wait" initial={false} custom={dir}>
              <motion.div key={step} initial={reduce ? { opacity: 0 } : { opacity: 0, x: dir * 30 }} animate={{ opacity: 1, x: 0 }} exit={reduce ? { opacity: 0 } : { opacity: 0, x: dir * -30 }} transition={{ duration: 0.25 }}>
                {step === 0 && (loading || !sites ? <LoadingList rows={4} /> : <StepLieu sites={sites} s={s} patch={patch} />)}
                {step === 1 && <StepContenu s={s} patch={patch} volume={volume} isBoxSite={isBoxSite} site={site} />}
                {step === 2 && <StepDelai s={s} patch={patch} />}
                {step === 3 && quote && site && <StepRecap s={s} site={site} quote={quote} volume={volume} />}
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="sticky bottom-[64px] flex items-center justify-between gap-3 border-t border-p-line bg-p-card px-5 py-3.5 sm:px-6 lg:bottom-0">
            <Btn variant="ghost" onClick={() => go(step - 1)} disabled={step === 0}>
              <ArrowLeft className="h-4 w-4" /> Retour
            </Btn>
            {step < 3 ? (
              <Btn variant="primary" onClick={() => go(step + 1)} disabled={!valid[step]}>
                Continuer <ArrowRight className="h-4 w-4" />
              </Btn>
            ) : (
              <Btn variant="primary" size="lg" onClick={() => void submit()} disabled={sending}>
                {sending ? 'Envoi…' : 'Envoyer la demande'} <ArrowRight className="h-4 w-4" />
              </Btn>
            )}
          </div>
        </Card>

        {/* récapitulatif en direct */}
        <aside className="lg:sticky lg:top-24" aria-label="Estimation">
          <Card className="overflow-hidden">
            <div className="on-dark bg-navy p-5 text-white">
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-signal">Estimation HT</p>
              <p className="mt-2 font-display text-[36px] leading-none tracking-[-0.04em]">{quote ? eur(quote.ht) : '—'}</p>
              <p className="mt-1.5 text-[13px] text-white/70">{quote ? `TTC ${eur(quote.ttc)} · TVA 20 %` : 'Choisissez un lieu'}</p>
              {quote?.covered && <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-tri px-2.5 py-1 text-[12px] font-semibold">Couvert par l’abonnement</p>}
            </div>
            <dl className="space-y-2.5 p-5 text-[13.5px]">
              <div className="flex justify-between gap-3">
                <dt className="text-p-muted">Lieu</dt>
                <dd className="truncate text-right font-semibold">{site?.label ?? '—'}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-p-muted">Volume</dt>
                <dd className="font-mono font-semibold">{s.mode === 'box' ? `${s.boxes.length} box` : `${volume.toLocaleString('fr-FR')} m³`}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-p-muted">Délai</dt>
                <dd className="font-semibold">{s.delay === '48h' ? 'Sous 48 h' : s.delay === 'urgence' ? 'Urgence 24 h' : 'Samedi'}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-p-muted">Créneau</dt>
                <dd className="text-right font-semibold first-letter:uppercase">{s.date ? `${format(new Date(s.date), 'EEE d MMM', { locale: fr })} · ${s.window}` : '—'}</dd>
              </div>
            </dl>
          </Card>
        </aside>
      </div>
    </div>
  );
}

/* ---------- 1. Lieu ---------- */
function StepLieu({ sites, s, patch }: { sites: (Site & { count: number })[]; s: State; patch: (p: Partial<State>) => void }) {
  const [q, setQ] = useState('');
  const [adding, setAdding] = useState(false);
  const form = useForm<SiteForm>({ resolver: zodResolver(siteSchema), defaultValues: { floor: 0, elevator: false, keys: 'agence', label: '', address: '', postalCode: '', city: 'Rouen' } });
  const list = sites.filter((x) => `${x.label} ${x.address} ${x.city}`.toLowerCase().includes(q.toLowerCase()));
  const site = sites.find((x) => x.id === s.siteId);

  const save = form.handleSubmit(async (v) => {
    try {
      const created = await addSite({ ...v, kind: 'logement', distanceKm: 5 });
      patch({ siteId: created.id });
      setAdding(false);
      toast.success('Lieu ajouté');
    } catch (e) {
      toast.error((e as Error).message);
    }
  });

  return (
    <div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-p-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un site ou un bien" className={cn(inputCls, 'pl-9')} aria-label="Rechercher un lieu" />
        </div>
        <Btn onClick={() => setAdding((a) => !a)}>
          <Plus className="h-4 w-4" /> Ajouter un lieu
        </Btn>
      </div>

      <AnimatePresence>
        {adding && (
          <motion.form initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} onSubmit={save} className="overflow-hidden" noValidate>
            <div className="mt-4 grid gap-3 rounded-[12px] border border-p-line bg-p-soft p-4 sm:grid-cols-2">
              <Field label="Nom du lieu" htmlFor="ns-label" error={form.formState.errors.label?.message}>
                <input id="ns-label" {...form.register('label')} className={inputCls} placeholder="T3 · rue Bouquet" />
              </Field>
              <Field label="Adresse" htmlFor="ns-address" error={form.formState.errors.address?.message}>
                <input id="ns-address" {...form.register('address')} className={inputCls} placeholder="Rue Bouquet" />
              </Field>
              <Field label="Code postal" htmlFor="ns-cp" error={form.formState.errors.postalCode?.message}>
                <input id="ns-cp" inputMode="numeric" {...form.register('postalCode')} className={inputCls} placeholder="76000" />
              </Field>
              <Field label="Ville" htmlFor="ns-city" error={form.formState.errors.city?.message}>
                <input id="ns-city" {...form.register('city')} className={inputCls} />
              </Field>
              <Field label="Étage" htmlFor="ns-floor">
                <input id="ns-floor" type="number" min={0} max={20} {...form.register('floor')} className={inputCls} />
              </Field>
              <Field label="Clés" htmlFor="ns-keys">
                <select id="ns-keys" {...form.register('keys')} className={inputCls}>
                  <option value="agence">À récupérer à l’agence</option>
                  <option value="gardien">Chez le gardien</option>
                  <option value="sur-place">Quelqu’un sur place</option>
                </select>
              </Field>
              <Field label="Code d’accès" htmlFor="ns-code">
                <input id="ns-code" {...form.register('accessCode')} className={inputCls} placeholder="1234B" />
              </Field>
              <Field label="Contact sur place" htmlFor="ns-contact">
                <input id="ns-contact" {...form.register('onSiteContact')} className={inputCls} placeholder="Nom · téléphone" />
              </Field>
              <label className="flex items-center gap-3 text-[14px] font-semibold sm:col-span-2">
                <Switch checked={form.watch('elevator')} onChange={(v) => form.setValue('elevator', v)} label="Ascenseur" /> Ascenseur utilisable
              </label>
              <div className="flex gap-2 sm:col-span-2">
                <Btn variant="dark" type="submit">
                  Enregistrer le lieu
                </Btn>
                <Btn variant="ghost" type="button" onClick={() => setAdding(false)}>
                  Annuler
                </Btn>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <ul className="mt-4 grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Lieu">
        {list.map((x) => {
          const I = KIND_ICON[x.kind];
          const sel = s.siteId === x.id;
          return (
            <li key={x.id}>
              <button role="radio" aria-checked={sel} onClick={() => patch({ siteId: x.id, keys: x.keys, contact: x.onSiteContact ?? '', mode: x.boxes?.length ? 'box' : 'volume', boxes: [] })} className={cn('flex w-full items-start gap-3 rounded-[12px] border p-3.5 text-left transition', sel ? 'border-navy bg-signal-soft ring-2 ring-signal dark:border-signal dark:bg-signal/10' : 'border-p-line hover:bg-p-hover')}>
                <span className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-[10px]', sel ? 'bg-signal text-navy' : 'bg-p-soft')}>
                  <I className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-semibold">{x.label}</span>
                  <span className="block truncate text-[12.5px] text-p-muted">
                    {x.address}, {x.city}
                  </span>
                  <span className="mt-1 block text-[12px] text-p-muted">
                    {x.floor === 0 ? 'RDC' : `${x.floor}e étage`} · {x.elevator ? 'ascenseur' : 'sans ascenseur'} · {x.count} intervention{x.count > 1 ? 's' : ''}
                  </span>
                </span>
                {sel && <Check className="h-5 w-5 shrink-0 text-tri" />}
              </button>
            </li>
          );
        })}
      </ul>

      {site && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-5 grid gap-3 rounded-[12px] border border-p-line p-4 sm:grid-cols-2">
          <p className="flex items-center gap-2 text-[14px] font-semibold sm:col-span-2">
            <MapPin className="h-4 w-4 text-signal-dark" /> Accès pour cette intervention
          </p>
          <Field label="Contact sur place" htmlFor="d-contact">
            <input id="d-contact" value={s.contact} onChange={(e) => patch({ contact: e.target.value })} className={inputCls} placeholder="Nom · téléphone" />
          </Field>
          <Field label="Récupération des clés" htmlFor="d-keys">
            <select id="d-keys" value={s.keys} onChange={(e) => patch({ keys: e.target.value as Site['keys'] })} className={inputCls}>
              <option value="agence">À l’agence</option>
              <option value="gardien">Chez le gardien</option>
              <option value="sur-place">Quelqu’un sur place</option>
            </select>
          </Field>
          <p className="text-[12.5px] text-p-muted sm:col-span-2">
            Code d’accès : <span className="font-mono">{site.accessCode ?? '—'}</span> · {site.floor === 0 ? 'rez-de-chaussée' : `${site.floor}e étage`} · {site.elevator ? 'ascenseur' : 'sans ascenseur'}
          </p>
        </motion.div>
      )}
    </div>
  );
}

/* ---------- 2. Contenu ---------- */
function StepContenu({ s, patch, volume, isBoxSite, site }: { s: State; patch: (p: Partial<State>) => void; volume: number; isBoxSite: boolean; site: Site | null }) {
  const [drag, setDrag] = useState(false);
  const [bq, setBq] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const add = (files: FileList | null) => {
    if (!files) return;
    const next = Array.from(files)
      .filter((f) => f.type.startsWith('image/'))
      .slice(0, 12)
      .map((f) => ({ url: URL.createObjectURL(f), name: f.name }));
    patch({ photos: [...s.photos, ...next].slice(0, 12) });
  };
  const options = [
    { value: 'volume' as const, label: 'Volume estimé' },
    { value: 'objets' as const, label: 'Objet par objet' },
    ...(isBoxSite ? [{ value: 'box' as const, label: 'Forfait Box' }] : []),
  ];

  return (
    <div>
      <Segmented label="Mode de saisie" value={s.mode} onChange={(v) => patch({ mode: v })} options={options} />

      {s.mode === 'volume' && (
        <div className="mt-6">
          <div className="flex items-end justify-between">
            <label htmlFor="vol" className="text-[14px] font-semibold">
              Volume estimé
            </label>
            <p className="font-display text-[34px] leading-none tracking-[-0.04em]">
              {s.volume.toLocaleString('fr-FR')} <span className="font-sans text-[15px] font-medium text-p-muted">m³</span>
            </p>
          </div>
          <input id="vol" type="range" min={0.5} max={40} step={0.5} value={s.volume} onChange={(e) => patch({ volume: Number(e.target.value) })} className="mt-4 w-full accent-[#FFC21A]" />
          <div className="mt-1 flex justify-between font-mono text-[11px] text-p-muted">
            <span>0,5</span>
            <span>Studio ≈ 8</span>
            <span>T3 ≈ 22</span>
            <span>40 m³</span>
          </div>
        </div>
      )}

      {s.mode === 'objets' && (
        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
          {ITEMS.map((it) => {
            const n = s.items[it.id] ?? 0;
            return (
              <div key={it.id} className={cn('flex flex-col items-center rounded-[12px] border p-2.5 text-center', n ? 'border-signal bg-signal-soft dark:bg-signal/10' : 'border-p-line')}>
                <Illus id={it.illus} className="h-12 w-12" />
                <p className="mt-1 line-clamp-1 text-[12.5px] font-semibold">{it.name}</p>
                <p className="font-mono text-[11px] text-p-muted">{it.volume.toLocaleString('fr-FR')} m³</p>
                <div className="mt-2 flex items-center gap-2">
                  <button type="button" onClick={() => patch({ items: { ...s.items, [it.id]: Math.max(0, n - 1) } })} disabled={!n} className="grid h-7 w-7 place-items-center rounded-full border border-p-line bg-p-card disabled:opacity-30" aria-label={`Retirer · ${it.name}`}>
                    −
                  </button>
                  <span className="w-5 font-semibold tabular-nums">{n}</span>
                  <button type="button" onClick={() => patch({ items: { ...s.items, [it.id]: n + 1 } })} className="grid h-7 w-7 place-items-center rounded-full border border-p-line bg-p-card" aria-label={`Ajouter · ${it.name}`}>
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {s.mode === 'box' && site?.boxes && (
        <div className="mt-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[14px]">
              <strong>{s.boxes.length}</strong> box sélectionné{s.boxes.length > 1 ? 's' : ''} · 220 € HT par box
            </p>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-p-muted" />
              <input value={bq} onChange={(e) => setBq(e.target.value.toUpperCase())} placeholder="N° de box" className={cn(inputCls, 'h-9 w-36 pl-9')} aria-label="Rechercher une box" />
            </div>
          </div>
          <div className="pro-scroll mt-3 grid max-h-[300px] grid-cols-5 gap-1.5 overflow-y-auto rounded-[12px] border border-p-line p-2 sm:grid-cols-8 xl:grid-cols-10" role="group" aria-label="Box">
            {site.boxes
              .filter((b) => b.includes(bq))
              .map((b) => {
                const on = s.boxes.includes(b);
                return (
                  <button key={b} type="button" aria-pressed={on} onClick={() => patch({ boxes: on ? s.boxes.filter((x) => x !== b) : [...s.boxes, b] })} className={cn('h-9 rounded-[8px] font-mono text-[12px] font-semibold transition', on ? 'bg-navy text-white dark:bg-signal dark:text-navy' : 'bg-p-soft hover:bg-p-hover')}>
                    {b}
                  </button>
                );
              })}
          </div>
        </div>
      )}

      <p className="mt-5 text-[13px] text-p-muted">
        Volume retenu : <strong className="text-p-text">{volume.toLocaleString('fr-FR')} m³</strong>
      </p>

      <div className="mt-5 grid gap-2 sm:grid-cols-3">
        {(
          [
            ['deee', 'DEEE', 'Électroménager, informatique'],
            ['archives', 'Archives à broyer', 'Destruction certifiée'],
            ['mobilierBureau', 'Mobilier de bureau', 'Filière dédiée'],
          ] as const
        ).map(([k, l, h]) => (
          <label key={k} className={cn('flex cursor-pointer items-start gap-3 rounded-[12px] border p-3', s[k] ? 'border-tri bg-tri-soft dark:bg-tri/10' : 'border-p-line')}>
            <input type="checkbox" checked={s[k]} onChange={(e) => patch({ [k]: e.target.checked } as Partial<State>)} className="mt-0.5 h-4 w-4 accent-[#2F9E6E]" />
            <span>
              <span className="block text-[13.5px] font-semibold">{l}</span>
              <span className="text-[12px] text-p-muted">{h}</span>
            </span>
          </label>
        ))}
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          add(e.dataTransfer.files);
        }}
        className={cn('mt-5 rounded-[12px] border-2 border-dashed p-4', drag ? 'border-signal bg-signal-soft' : 'border-p-line')}
      >
        <div className="flex flex-wrap items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-[10px] bg-signal text-navy">
            <Camera className="h-5 w-5" />
          </span>
          <div className="flex-1">
            <p className="text-[14px] font-semibold">Photos du lieu</p>
            <p className="text-[12.5px] text-p-muted">Glissez-déposez ou choisissez. Démo : rien n’est envoyé.</p>
          </div>
          <Btn size="sm" type="button" onClick={() => input.current?.click()}>
            Choisir
          </Btn>
          <input ref={input} type="file" accept="image/*" multiple className="sr-only" onChange={(e) => add(e.target.files)} aria-label="Ajouter des photos" />
        </div>
        {s.photos.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {s.photos.map((p, i) => (
              <div key={p.url} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt={`Photo ${i + 1}`} className="h-16 w-16 rounded-[10px] object-cover" />
                <button type="button" onClick={() => patch({ photos: s.photos.filter((x) => x.url !== p.url) })} className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-navy text-white" aria-label={`Retirer la photo ${i + 1}`}>
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- 3. Délai ---------- */
function StepDelai({ s, patch }: { s: State; patch: (p: Partial<State>) => void }) {
  const today = startOfDay(new Date());
  const first = s.delay === 'urgence' ? 1 : 2;
  const days = Array.from({ length: 28 }, (_, i) => addDays(today, i + 1));
  const available = (d: Date) => {
    const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
    if (diff < first) return false;
    if (s.delay === 'samedi') return d.getDay() === 6;
    if (s.delay === 'urgence') return diff <= 2 && d.getDay() !== 0;
    return d.getDay() !== 0 && d.getDay() !== 6 && (d.getDate() * 7) % 5 !== 0; // quelques créneaux déjà pris
  };
  const lead = (days[0].getDay() + 6) % 7;

  return (
    <div>
      <div className="grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Délai">
        {(
          [
            ['48h', 'Standard sous 48 h', 'Prix de base'],
            ['urgence', 'Urgence 24 h', '+ 20 %'],
            ['samedi', 'Samedi', '+ 15 %'],
          ] as const
        ).map(([v, l, h]) => (
          <button key={v} role="radio" aria-checked={s.delay === v} onClick={() => patch({ delay: v, date: null })} className={cn('rounded-[12px] border p-3.5 text-left transition', s.delay === v ? 'border-navy bg-navy text-white dark:border-signal dark:bg-signal dark:text-navy' : 'border-p-line hover:bg-p-hover')}>
            <span className="block text-[14px] font-semibold">{l}</span>
            <span className="text-[12.5px] opacity-75">{h}</span>
          </button>
        ))}
      </div>

      <div className="mt-6 rounded-[12px] border border-p-line p-4">
        <p className="text-[14px] font-semibold first-letter:uppercase">{format(days[0], 'MMMM yyyy', { locale: fr })}</p>
        <div className="mt-3 grid grid-cols-7 gap-1.5 text-center font-mono text-[11px] text-p-muted">
          {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
            <span key={i}>{d}</span>
          ))}
        </div>
        <div className="mt-1.5 grid grid-cols-7 gap-1.5" role="grid" aria-label="Créneaux disponibles">
          {Array.from({ length: lead }).map((_, i) => (
            <span key={`e${i}`} />
          ))}
          {days.map((d) => {
            const ok = available(d);
            const sel = s.date && isSameDay(new Date(s.date), d);
            return (
              <button
                key={d.toISOString()}
                disabled={!ok}
                onClick={() => {
                  const x = new Date(d);
                  x.setHours(s.window.startsWith('8') ? 9 : 14, 0, 0, 0);
                  patch({ date: x.toISOString() });
                }}
                aria-pressed={!!sel}
                aria-label={format(d, 'EEEE d MMMM', { locale: fr })}
                className={cn('relative aspect-square rounded-[10px] text-[13.5px] font-semibold transition', sel ? 'bg-signal text-navy shadow-[0_6px_16px_-6px_rgba(255,194,26,.8)]' : ok ? 'bg-p-soft hover:bg-signal-soft dark:hover:bg-signal/20' : 'cursor-not-allowed text-p-muted opacity-40')}
              >
                {d.getDate()}
                {ok && !sel && <span className="absolute bottom-1.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-tri" />}
              </button>
            );
          })}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {['8 h – 12 h', '13 h – 17 h'].map((w) => (
            <button
              key={w}
              onClick={() => {
                const next: Partial<State> = { window: w };
                if (s.date) {
                  const x = new Date(s.date);
                  x.setHours(w.startsWith('8') ? 9 : 14, 0, 0, 0);
                  next.date = x.toISOString();
                }
                patch(next);
              }}
              aria-pressed={s.window === w}
              className={cn('h-9 rounded-full px-4 text-[13px] font-semibold', s.window === w ? 'bg-navy text-white dark:bg-white dark:text-navy' : 'border border-p-line')}
            >
              {w}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Field label="Référence interne" htmlFor="ref" hint="Facultatif · reprise sur la facture">
          <input id="ref" value={s.internalRef} onChange={(e) => patch({ internalRef: e.target.value })} className={inputCls} placeholder="LOT-214" />
        </Field>
        <Field label="N° de bon de commande" htmlFor="po" hint="Facultatif">
          <input id="po" value={s.purchaseOrder} onChange={(e) => patch({ purchaseOrder: e.target.value })} className={inputCls} placeholder="BC-2026-0091" />
        </Field>
      </div>
    </div>
  );
}

/* ---------- 4. Récapitulatif ---------- */
function StepRecap({ s, site, quote, volume }: { s: State; site: Site; quote: ReturnType<typeof quoteDemand>; volume: number }) {
  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ['Lieu', site.label, `${site.address}, ${site.city}`],
          ['Contenu', s.mode === 'box' ? `${s.boxes.length} box` : `${volume.toLocaleString('fr-FR')} m³`, [s.deee && 'DEEE', s.archives && 'archives', s.mobilierBureau && 'mobilier'].filter(Boolean).join(' · ') || `${s.photos.length} photo(s)`],
          ['Créneau', s.date ? format(new Date(s.date), 'EEEE d MMMM', { locale: fr }) : '—', s.window],
        ].map(([l, v, h]) => (
          <div key={l} className="rounded-[12px] bg-p-soft p-3.5">
            <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-p-muted">{l}</p>
            <p className="mt-1 truncate text-[14.5px] font-semibold first-letter:uppercase">{v}</p>
            <p className="truncate text-[12.5px] text-p-muted">{h}</p>
          </div>
        ))}
      </div>

      <table className="mt-6 w-full text-[14px]">
        <thead>
          <tr className="border-b border-p-line text-left font-mono text-[10.5px] uppercase tracking-[0.12em] text-p-muted">
            <th className="pb-2 font-medium">Désignation</th>
            <th className="pb-2 text-right font-medium">Qté</th>
            <th className="hidden pb-2 text-right font-medium sm:table-cell">PU HT</th>
            <th className="pb-2 text-right font-medium">Total HT</th>
          </tr>
        </thead>
        <tbody>
          {quote.lines.map((l, i) => (
            <motion.tr key={l.label} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="border-b border-p-line">
              <td className={cn('py-2.5 pr-2', l.kind === 'deduction' && 'text-tri-dark dark:text-[#7FD9AF]')}>{l.label}</td>
              <td className="py-2.5 text-right font-mono">{l.qty.toLocaleString('fr-FR')}</td>
              <td className="hidden py-2.5 text-right font-mono sm:table-cell">{eur(l.unit)}</td>
              <td className="py-2.5 text-right font-mono font-semibold">{eur(l.total)}</td>
            </motion.tr>
          ))}
        </tbody>
        <tfoot className="font-mono">
          <tr>
            <td colSpan={2} className="pt-3 sm:hidden" />
            <td colSpan={2} className="hidden pt-3 sm:table-cell" />
            <td className="pt-3 text-right">
              <span className="text-p-muted">HT </span>
              {eur(quote.ht)}
            </td>
          </tr>
          <tr>
            <td colSpan={2} className="sm:hidden" />
            <td colSpan={2} className="hidden sm:table-cell" />
            <td className="pt-1 text-right">
              <span className="text-p-muted">TVA 20 % </span>
              {eur(quote.tva)}
            </td>
          </tr>
          <tr>
            <td colSpan={2} className="sm:hidden" />
            <td colSpan={2} className="hidden sm:table-cell" />
            <td className="pt-2 text-right font-display text-[22px] tracking-[-0.03em]">{eur(quote.ttc)}</td>
          </tr>
        </tfoot>
      </table>
      {quote.included && (
        <p className="mt-4 rounded-[10px] bg-tri-soft p-3 text-[13px] text-tri-dark dark:bg-tri/15 dark:text-[#7FD9AF]">
          Abonnement : {quote.included.m3.toLocaleString('fr-FR')} m³ inclus restants ce mois-ci, déduits ci-dessus.
        </p>
      )}
      <p className="mt-4 text-[12.5px] text-p-muted">Prix ferme après validation des photos. La demande passe au statut « Demandée » et l’équipe est prévenue en direct.</p>
    </div>
  );
}
