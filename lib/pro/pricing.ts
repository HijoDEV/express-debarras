import type { Cents, Delay, Ligne, Plan } from './types';

export const PRO = {
  perM3: 4500,
  minimum: 19000,
  box: 22000,
  plans: {
    ponctuel: { label: 'Ponctuel', monthly: 0, passages: 0, m3: 0 },
    essentiel: { label: 'Pro Essentiel', monthly: 12900, passages: 1, m3: 3 },
    plus: { label: 'Pro Plus', monthly: 29900, passages: 2, m3: 8 },
  } as Record<Plan, { label: string; monthly: Cents; passages: number; m3: number }>,
  urgencePct: 20,
  samediPct: 15,
  floor: 1250,
  longCarry: 2500,
  kmFree: 30,
  km: 85,
  dismantle: 1670,
  cleaning: 335,
  tva: 20,
};

/** Arrondi au centime, demi vers le haut, sans erreur de flottant. */
const rc = (x: number) => Math.round(x + 1e-9);

export type ProQuoteInput = {
  volume?: number;
  boxes?: number;
  delay?: Delay;
  floor?: number;
  elevator?: boolean;
  longCarry?: boolean;
  distanceKm?: number;
  dismantle?: number;
  cleaningM2?: number;
  /** abonné : m³ et passages restants sur la période */
  included?: { m3: number; passages: number } | null;
};

export type ProQuote = { lines: Ligne[]; ht: Cents; tva: Cents; ttc: Cents; covered: boolean; billableM3: number };

const line = (label: string, qty: number, unit: Cents, kind: Ligne['kind']): Ligne => ({ label, qty, unit, total: rc(qty * unit), kind });

/** Prix d'une intervention pro, en centimes HT. Fonction pure. */
export function computeProQuote(i: ProQuoteInput): ProQuote {
  const lines: Ligne[] = [];
  const volume = Math.max(0, Math.round((i.volume ?? 0) * 10) / 10);
  const boxes = Math.max(0, Math.floor(i.boxes ?? 0));
  let base = 0;
  let billableM3 = volume;
  let covered = false;

  if (boxes > 0) {
    lines.push(line(`Forfait Box ≤ 9 m²`, boxes, PRO.box, 'base'));
    base = boxes * PRO.box;
    billableM3 = 0;
  } else if (i.included && i.included.passages > 0) {
    // abonné : volume inclus d'abord, puis 45 € HT / m³
    const inc = Math.min(volume, i.included.m3);
    billableM3 = Math.round((volume - inc) * 10) / 10;
    if (inc > 0) lines.push({ label: `Volume inclus dans l’abonnement`, qty: inc, unit: 0, total: 0, kind: 'deduction' });
    if (billableM3 > 0) {
      lines.push(line(`Volume hors forfait`, billableM3, PRO.perM3, 'base'));
      base = rc(billableM3 * PRO.perM3);
    }
    covered = billableM3 === 0;
  } else if (volume > 0) {
    const raw = rc(volume * PRO.perM3);
    if (raw < PRO.minimum) {
      lines.push({ label: `Débarras ponctuel · ${volume.toLocaleString('fr-FR')} m³ (minimum)`, qty: 1, unit: PRO.minimum, total: PRO.minimum, kind: 'base' });
      base = PRO.minimum;
    } else {
      lines.push(line(`Débarras ponctuel`, volume, PRO.perM3, 'base'));
      base = raw;
    }
  }

  if (i.delay === 'urgence' && base > 0) lines.push({ label: `Urgence 24 h · + ${PRO.urgencePct} %`, qty: 1, unit: rc((base * PRO.urgencePct) / 100), total: rc((base * PRO.urgencePct) / 100), kind: 'majoration' });
  if (i.delay === 'samedi' && base > 0) lines.push({ label: `Samedi · + ${PRO.samediPct} %`, qty: 1, unit: rc((base * PRO.samediPct) / 100), total: rc((base * PRO.samediPct) / 100), kind: 'majoration' });

  const floor = Math.max(0, Math.min(20, Math.floor(i.floor ?? 0)));
  if (!i.elevator && floor >= 2) lines.push(line(`Étage sans ascenseur (${floor}e)`, floor - 1, PRO.floor, 'option'));
  if (i.longCarry) lines.push(line('Portage de plus de 30 m', 1, PRO.longCarry, 'option'));
  const km = Math.max(0, Math.round(i.distanceKm ?? 0) - PRO.kmFree);
  if (km > 0) lines.push(line('Déplacement au-delà de 30 km', km, PRO.km, 'option'));
  if ((i.dismantle ?? 0) > 0) lines.push(line('Démontage', Math.floor(i.dismantle!), PRO.dismantle, 'option'));
  if ((i.cleaningM2 ?? 0) > 0) lines.push(line('Nettoyage (m²)', Math.floor(i.cleaningM2!), PRO.cleaning, 'option'));

  const ht = lines.reduce((s, l) => s + l.total, 0);
  const tva = rc((ht * PRO.tva) / 100);
  return { lines, ht, tva, ttc: ht + tva, covered: covered && ht === 0, billableM3 };
}

/** Facture mensuelle d'abonnement : forfait + dépassement à 45 € HT / m³. */
export function monthlyBill(plan: Plan, usedM3: number) {
  const p = PRO.plans[plan];
  const over = Math.max(0, Math.round((usedM3 - p.m3) * 10) / 10);
  const lines: Ligne[] = [];
  if (p.monthly) lines.push(line(`Abonnement ${p.label}`, 1, p.monthly, 'base'));
  if (over > 0) lines.push(line('Volume hors forfait', over, PRO.perM3, 'option'));
  const ht = lines.reduce((s, l) => s + l.total, 0);
  const tva = rc((ht * PRO.tva) / 100);
  return { lines, ht, tva, ttc: ht + tva, overM3: over };
}

/** Prorata d'un changement d'offre en cours de mois. */
export function prorata(from: Plan, to: Plan, dayOfMonth: number, daysInMonth: number) {
  const left = Math.max(0, daysInMonth - dayOfMonth + 1) / daysInMonth;
  const diff = PRO.plans[to].monthly - PRO.plans[from].monthly;
  return rc(diff * left);
}

export const eur = (cents: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(cents / 100);
export const eur0 = (cents: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(Math.round(cents / 100));
