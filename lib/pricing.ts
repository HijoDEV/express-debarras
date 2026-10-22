import {
  AU_DELA,
  EXPRESS_OBJET,
  FORFAITS,
  FORMULA_NAMES,
  ITEMS,
  OPTIONS,
  PACKS,
  ROOMS,
  type FormulaId,
  type PackId,
} from './data';

export type Delay = 'tournee' | '48h' | 'urgence' | 'samedi';

export type QuoteInput = {
  items?: Record<string, number>;
  rooms?: Record<string, number>;
  floor?: number;
  elevator?: boolean;
  longCarry?: boolean;
  distanceKm?: number; // distance depuis Rouen
  delay?: Delay;
  dismantle?: number; // nombre de meubles
  cleaningM2?: number;
  pack?: PackId;
};

export type QuoteLine = { label: string; amount: number; kind: 'base' | 'surcharge' | 'access' | 'service' | 'pack' };

export type Quote = {
  volume: number; // m³, arrondi au dixième
  objectCount: number;
  formula: FormulaId | null;
  formulaName: string;
  delay: Delay; // délai réellement appliqué
  lines: QuoteLine[];
  total: number; // € TTC, arrondi à l'euro
  deposit: number; // acompte 30 %
  eligibleObjet: boolean;
};

const cents = (euros: number) => Math.round(euros * 100);

/** Volume total en m³ (arrondi au dixième pour éviter les erreurs de flottants). */
export function computeVolume(items: Record<string, number> = {}, rooms: Record<string, number> = {}) {
  let tenths = 0;
  for (const [id, n] of Object.entries(items)) {
    const it = ITEMS.find((i) => i.id === id);
    if (it && n > 0) tenths += Math.round(it.volume * 10) * n;
  }
  for (const [id, n] of Object.entries(rooms)) {
    const r = ROOMS.find((x) => x.id === id);
    if (r && n > 0) tenths += Math.round(r.volume * 10) * n;
  }
  return tenths / 10;
}

export function countObjects(items: Record<string, number> = {}) {
  return Object.values(items).reduce((s, n) => s + Math.max(0, n), 0);
}

/** Forfait correspondant à un volume (hors Express Objet). Prix en euros. */
export function forfaitFor(volume: number): { id: FormulaId; price: number } {
  for (const f of FORFAITS) if (volume <= f.maxVolume) return { id: f.id, price: f.price };
  return { id: 'audela', price: Math.max(AU_DELA.floor, Math.round(volume * AU_DELA.pricePerM3 * 100) / 100) };
}

/**
 * Calcul du prix, fonction pure.
 * Ordre : volume → formule → majoration urgence/samedi → accès → services/packs → arrondi.
 */
export function computeQuote(input: QuoteInput): Quote {
  const items = input.items ?? {};
  const rooms = input.rooms ?? {};
  const volume = computeVolume(items, rooms);
  const objectCount = countObjects(items);
  const hasRooms = Object.values(rooms).some((n) => n > 0);

  const eligibleObjet =
    !hasRooms && objectCount > 0 && objectCount <= EXPRESS_OBJET.maxObjects && volume <= EXPRESS_OBJET.maxVolume;

  // La tournée n'existe que pour Express Objet.
  let delay: Delay = input.delay ?? '48h';
  if (delay === 'tournee' && !eligibleObjet) delay = '48h';

  const lines: QuoteLine[] = [];

  if (volume <= 0) {
    return { volume: 0, objectCount: 0, formula: null, formulaName: '—', delay, lines, total: 0, deposit: 0, eligibleObjet: false };
  }

  // 2. Formule de base
  let formula: FormulaId;
  let baseC: number;
  if (eligibleObjet) {
    formula = 'objet';
    const first = delay === 'tournee' ? EXPRESS_OBJET.firstTournee : EXPRESS_OBJET.first48h;
    baseC = cents(first);
    lines.push({
      label: `Express Objet · 1er objet${delay === 'tournee' ? ' (tournée)' : ''}`,
      amount: cents(first),
      kind: 'base',
    });
    if (objectCount > 1) {
      const extra = cents(EXPRESS_OBJET.extra * (objectCount - 1));
      baseC += extra;
      lines.push({ label: `${objectCount - 1} objet${objectCount > 2 ? 's' : ''} supplémentaire${objectCount > 2 ? 's' : ''} × 19 €`, amount: extra, kind: 'base' });
    }
  } else {
    const f = forfaitFor(volume);
    formula = f.id;
    baseC = cents(f.price);
    const label =
      f.id === 'audela'
        ? `${FORMULA_NAMES.audela} · ${fmtVol(volume)} × ${AU_DELA.pricePerM3} €`
        : `${FORMULA_NAMES[f.id]} · jusqu’à ${FORFAITS.find((x) => x.id === f.id)!.maxVolume} m³`;
    lines.push({ label, amount: baseC, kind: 'base' });
  }

  // 3. Majorations sur la formule de base
  if (delay === 'urgence') {
    lines.push({ label: `Urgence 24 h · + ${OPTIONS.urgencePct} %`, amount: Math.round((baseC * OPTIONS.urgencePct) / 100), kind: 'surcharge' });
  } else if (delay === 'samedi') {
    lines.push({ label: `Samedi · + ${OPTIONS.samediPct} %`, amount: Math.round((baseC * OPTIONS.samediPct) / 100), kind: 'surcharge' });
  }

  // 4. Accès
  const floor = Math.max(0, Math.min(10, Math.floor(input.floor ?? 0)));
  if (!input.elevator && floor >= OPTIONS.floorFrom) {
    const n = floor - (OPTIONS.floorFrom - 1);
    lines.push({ label: `${floor}e étage sans ascenseur · ${n} × ${OPTIONS.floorFee} €`, amount: cents(n * OPTIONS.floorFee), kind: 'access' });
  }
  if (input.longCarry) lines.push({ label: 'Portage de plus de 30 m', amount: cents(OPTIONS.longCarry), kind: 'access' });
  const km = Math.max(0, Math.round(input.distanceKm ?? 0) - OPTIONS.kmFree);
  if (km > 0) lines.push({ label: `Déplacement · + ${km} km × ${OPTIONS.kmFee} €`, amount: cents(km * OPTIONS.kmFee), kind: 'access' });

  // 5. Services et packs
  const pack: PackId = input.pack ?? 'essentiel';
  const packIncludesDismantle = pack === 'serenite' || pack === 'cles';
  const dismantle = Math.max(0, Math.floor(input.dismantle ?? 0));
  if (dismantle > 0 && !packIncludesDismantle) {
    lines.push({ label: `Démontage · ${dismantle} meuble${dismantle > 1 ? 's' : ''} × ${OPTIONS.dismantle} €`, amount: cents(dismantle * OPTIONS.dismantle), kind: 'service' });
  }
  const m2 = Math.max(0, Math.floor(input.cleaningM2 ?? 0));
  const billableM2 = pack === 'cles' ? Math.max(0, m2 - 60) : m2;
  if (billableM2 > 0) {
    lines.push({
      label: `Nettoyage · ${billableM2} m² × ${OPTIONS.cleaning} €${pack === 'cles' ? ' (au-delà de 60 m²)' : ''}`,
      amount: cents(billableM2 * OPTIONS.cleaning),
      kind: 'service',
    });
  }
  const p = PACKS.find((x) => x.id === pack)!;
  if (p.price > 0) lines.push({ label: `Pack ${p.name}`, amount: cents(p.price), kind: 'pack' });

  // 6. Arrondi à l'euro le plus proche
  const totalC = lines.reduce((s, l) => s + l.amount, 0);
  const total = Math.round(totalC / 100);
  const deposit = Math.round(total * 0.3);

  return {
    volume,
    objectCount,
    formula,
    formulaName: FORMULA_NAMES[formula],
    delay,
    lines: lines.map((l) => ({ ...l, amount: l.amount / 100 })),
    total,
    deposit,
    eligibleObjet,
  };
}

/** Prix pro HT pour un débarras ponctuel. */
export function proPonctuelHT(volume: number) {
  return Math.max(190, Math.round(volume * 45));
}

export const fmtEur = (n: number, decimals = false) =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: decimals ? 2 : 0,
    maximumFractionDigits: decimals ? 2 : 0,
  }).format(n);

export const fmtVol = (v: number) => `${v.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} m³`;
