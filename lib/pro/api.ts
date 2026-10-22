'use client';
/**
 * Couche d'API simulée. Les composants ne lisent ni n'écrivent jamais le store directement :
 * remplacer ce fichier par des appels Supabase suffit pour passer en production.
 */
import { computeProQuote, monthlyBill, PRO, prorata } from './pricing';
import { canTransition, isDone, isUpcoming, STATUS_META } from './status';
import { buildSeed } from './seed';
import { publish } from './sync';
import { useProStore } from './store';
import type {
  Bordereau,
  Delay,
  Devis,
  Facture,
  Intervention,
  InterventionContent,
  Message,
  Notification,
  Plan,
  ProDB,
  RapportTri,
  Role,
  Site,
  Status,
  Utilisateur,
} from './types';

/* ---------- Latence ---------- */
let skip = 0;
/** Le prochain appel de lecture ne simule pas de latence (rafraîchissement en arrière-plan). */
export const quietly = () => void (skip += 1);
const wait = () => {
  if (skip > 0) {
    skip -= 1;
    return Promise.resolve();
  }
  return new Promise<void>((r) => setTimeout(r, 300 + Math.random() * 400));
};

export class ApiError extends Error {}

const S = () => useProStore.getState();
const db = (): ProDB => S().ensureDb();
const uid = (p: string) => `${p}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const nowIso = () => new Date().toISOString();

function session() {
  const s = S().session;
  if (!s) throw new ApiError('Non connecté');
  return s;
}

/** Mutation optimiste : appliquée tout de suite, annulée si l'appel « réseau » échoue. */
async function mutate<T>(fn: (d: ProDB) => T): Promise<T> {
  const before = structuredClone(db());
  let out!: T;
  S().write((d) => {
    out = fn(d);
  });
  await wait();
  if (S().prefs.simulateErrors && Math.random() < 0.35) {
    S().replaceDb(before);
    throw new ApiError('Le réseau ne répond pas. Modification annulée.');
  }
  return out;
}

function notify(d: ProDB, orgId: string, n: Omit<Notification, 'id' | 'orgId' | 'at' | 'read'>) {
  d.notifications.unshift({ ...n, id: uid('n'), orgId, at: nowIso(), read: false });
}

/* ====================================================================== */
/* Session                                                                */
/* ====================================================================== */

export const auth = {
  async sendCode(email: string) {
    await wait();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ApiError('Adresse e-mail invalide.');
    return String(Math.floor(100000 + Math.random() * 900000));
  },
  async loginDemo(orgId: string) {
    await wait();
    const d = db();
    const user = d.users.find((u) => u.orgId === orgId && u.role === 'admin')!;
    S().setSession({ orgId, userId: user.id, viewAs: 'admin' });
    return user;
  },
  async logout() {
    S().setSession(null);
  },
  current() {
    const s = S().session;
    if (!s) return null;
    const d = db();
    const org = d.orgs.find((o) => o.id === s.orgId)!;
    const user = d.users.find((u) => u.id === s.userId)!;
    return { org, user, role: s.viewAs };
  },
  viewAs(role: Role) {
    const s = session();
    S().setSession({ ...s, viewAs: role });
  },
  switchOrg(orgId: string) {
    const d = db();
    const user = d.users.find((u) => u.orgId === orgId && u.role === 'admin')!;
    S().setSession({ orgId, userId: user.id, viewAs: 'admin' });
  },
  orgs() {
    return db().orgs;
  },
};

/* ====================================================================== */
/* Lectures                                                               */
/* ====================================================================== */

export type InterventionRow = Intervention & { site: Site };

const withSite = (d: ProDB, i: Intervention): InterventionRow => ({ ...i, site: d.sites.find((s) => s.id === i.siteId)! });

export async function getDashboard() {
  await wait();
  const { orgId } = session();
  const d = db();
  const its = d.interventions.filter((i) => i.orgId === orgId);
  const now = new Date();
  const m0 = new Date(now.getFullYear(), now.getMonth(), 1);
  const m1 = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const inMonth = (iso: string | undefined, start: Date, end: Date) => !!iso && new Date(iso) >= start && new Date(iso) < end;
  const doneIn = (start: Date, end: Date) => its.filter((i) => isDone(i.status) && inMonth(i.slot?.date, start, end));
  // mois glissants : si le mois courant est vide en début de mois, on compare quand même au mois précédent
  const cur = doneIn(m0, new Date(now.getFullYear(), now.getMonth() + 1, 1));
  const prev = doneIn(m1, m0);
  const vol = (list: Intervention[]) => Math.round(list.reduce((s, i) => s + i.content.volume, 0) * 10) / 10;
  const pctOf = (list: Intervention[]) => {
    const rs = list.map((i) => d.rapports.find((r) => r.interventionId === i.id)).filter(Boolean) as RapportTri[];
    const tv = rs.reduce((s, r) => s + r.volume, 0);
    return tv ? Math.round(rs.reduce((s, r) => s + (r.volume * r.valorisedPct) / 100, 0) / tv * 100) : 0;
  };
  const spend = (start: Date, end: Date) => d.factures.filter((f) => f.orgId === orgId && inMonth(f.issuedAt, start, end)).reduce((s, f) => s + f.ht, 0);

  const year = new Date(now.getFullYear(), now.getMonth() - 11, 1);
  const all12 = its.filter((i) => isDone(i.status) && i.slot && new Date(i.slot.date) >= year);
  const monthly = Array.from({ length: 12 }, (_, k) => {
    const s = new Date(now.getFullYear(), now.getMonth() - 11 + k, 1);
    const e = new Date(now.getFullYear(), now.getMonth() - 10 + k, 1);
    const list = all12.filter((i) => inMonth(i.slot!.date, s, e));
    const rs = list.map((i) => d.rapports.find((r) => r.interventionId === i.id)).filter(Boolean) as RapportTri[];
    const v = rs.reduce((acc, r) => acc + (r.volume * r.valorisedPct) / 100, 0);
    const t = list.reduce((acc, i) => acc + i.content.volume, 0);
    return { month: s.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', ''), valorise: Math.round(v * 10) / 10, toutVenant: Math.round((t - v) * 10) / 10 };
  });

  const next = its
    .filter((i) => ['planifiee', 'en_route', 'en_cours'].includes(i.status) && i.slot)
    .sort((a, b) => a.slot!.date.localeCompare(b.slot!.date))[0];

  const activity = buildActivity(d, orgId).slice(0, 7);
  return {
    kpis: {
      interventions: { value: cur.length, prev: prev.length },
      m3: { value: vol(cur), prev: vol(prev) },
      pct: { value: pctOf(cur.length ? cur : prev), prev: pctOf(prev) },
      spend: { value: spend(m0, new Date(now.getFullYear(), now.getMonth() + 1, 1)), prev: spend(m1, m0) },
    },
    next: next ? withSite(d, next) : null,
    abonnement: d.abonnements.find((a) => a.orgId === orgId)!,
    monthly,
    activity,
    toSign: d.devis.filter((x) => x.orgId === orgId && x.status === 'a_signer').length,
    slips: d.bordereaux.filter((b) => b.orgId === orgId).length,
  };
}

function buildActivity(d: ProDB, orgId: string) {
  const ev: { at: string; label: string; detail: string; href: string; kind: 'statut' | 'devis' | 'facture' | 'rapport' }[] = [];
  for (const i of d.interventions.filter((x) => x.orgId === orgId)) {
    const last = i.history[i.history.length - 1];
    ev.push({ at: last.at, label: STATUS_META[last.status].label, detail: `${i.ref} · ${d.sites.find((s) => s.id === i.siteId)?.label ?? ''}`, href: `/pro/interventions?id=${i.id}`, kind: last.status === 'rapport_dispo' ? 'rapport' : 'statut' });
  }
  for (const f of d.factures.filter((x) => x.orgId === orgId)) ev.push({ at: f.issuedAt, label: 'Facture émise', detail: `${f.number} · ${(f.ttc / 100).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} € TTC`, href: `/pro/factures/${f.id}`, kind: 'facture' });
  for (const q of d.devis.filter((x) => x.orgId === orgId && x.status === 'a_signer')) ev.push({ at: q.issuedAt, label: 'Devis envoyé', detail: q.ref, href: `/pro/devis/${q.id}`, kind: 'devis' });
  return ev.sort((a, b) => b.at.localeCompare(a.at));
}

export async function listInterventions() {
  await wait();
  const { orgId } = session();
  const d = db();
  return d.interventions.filter((i) => i.orgId === orgId).map((i) => withSite(d, i)).sort((a, b) => (b.slot?.date ?? b.createdAt).localeCompare(a.slot?.date ?? a.createdAt));
}

export async function getIntervention(id: string) {
  await wait();
  const d = db();
  const i = d.interventions.find((x) => x.id === id);
  if (!i) throw new ApiError('Intervention introuvable.');
  return {
    ...withSite(d, i),
    devis: d.devis.find((x) => x.id === i.quoteId) ?? null,
    facture: d.factures.find((x) => x.id === i.invoiceId) ?? null,
    rapport: d.rapports.find((x) => x.id === i.reportId) ?? null,
    bordereau: d.bordereaux.find((x) => x.id === i.slipId) ?? null,
    messages: d.messages.filter((m) => m.threadId === i.threadId),
  };
}

export async function listSites() {
  await wait();
  const { orgId } = session();
  const d = db();
  return d.sites
    .filter((s) => s.orgId === orgId)
    .map((s) => {
      const its = d.interventions.filter((i) => i.siteId === s.id);
      const done = its.filter((i) => isDone(i.status));
      const last = done.map((i) => i.slot?.date ?? '').sort().pop();
      return { ...s, count: its.length, last, volume: Math.round(done.reduce((acc, i) => acc + i.content.volume, 0) * 10) / 10 };
    });
}

export async function getSite(id: string) {
  await wait();
  const d = db();
  const s = d.sites.find((x) => x.id === id);
  if (!s) throw new ApiError('Site introuvable.');
  return { ...s, interventions: d.interventions.filter((i) => i.siteId === id).map((i) => withSite(d, i)).sort((a, b) => (b.slot?.date ?? b.createdAt).localeCompare(a.slot?.date ?? a.createdAt)) };
}

export async function listDevis() {
  await wait();
  const { orgId } = session();
  const d = db();
  return d.devis
    .filter((x) => x.orgId === orgId)
    .map((x) => ({ ...x, intervention: withSite(d, d.interventions.find((i) => i.id === x.interventionId)!) }))
    .sort((a, b) => (a.status === 'a_signer' ? -1 : 0) - (b.status === 'a_signer' ? -1 : 0) || b.issuedAt.localeCompare(a.issuedAt));
}

export async function getDevis(id: string) {
  await wait();
  const d = db();
  const q = d.devis.find((x) => x.id === id);
  if (!q) throw new ApiError('Devis introuvable.');
  const i = d.interventions.find((x) => x.id === q.interventionId)!;
  return { ...q, intervention: withSite(d, i), org: d.orgs.find((o) => o.id === q.orgId)! };
}

export async function listFactures() {
  await wait();
  const { orgId } = session();
  const d = db();
  return d.factures
    .filter((f) => f.orgId === orgId)
    .map((f) => ({ ...f, intervention: f.interventionId ? d.interventions.find((i) => i.id === f.interventionId) ?? null : null }))
    .sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
}

export async function getFacture(id: string) {
  await wait();
  const d = db();
  const f = d.factures.find((x) => x.id === id);
  if (!f) throw new ApiError('Facture introuvable.');
  return { ...f, org: d.orgs.find((o) => o.id === f.orgId)!, intervention: f.interventionId ? withSite(d, d.interventions.find((i) => i.id === f.interventionId)!) : null };
}

export async function listDocuments() {
  await wait();
  const { orgId } = session();
  const d = db();
  const rapports = d.rapports.filter((r) => r.orgId === orgId).map((r) => ({ ...r, intervention: withSite(d, d.interventions.find((i) => i.id === r.interventionId)!) }));
  const bordereaux = d.bordereaux.filter((b) => b.orgId === orgId).map((b) => ({ ...b, intervention: withSite(d, d.interventions.find((i) => i.id === b.interventionId)!) }));
  return { rapports: rapports.sort((a, b) => b.date.localeCompare(a.date)), bordereaux: bordereaux.sort((a, b) => b.date.localeCompare(a.date)) };
}

export async function getRapport(id: string) {
  await wait();
  const d = db();
  const r = d.rapports.find((x) => x.id === id);
  if (!r) throw new ApiError('Rapport introuvable.');
  return { ...r, intervention: withSite(d, d.interventions.find((i) => i.id === r.interventionId)!), org: d.orgs.find((o) => o.id === r.orgId)! };
}

export async function getBordereau(id: string) {
  await wait();
  const d = db();
  const b = d.bordereaux.find((x) => x.id === id);
  if (!b) throw new ApiError('Bordereau introuvable.');
  return { ...b, intervention: withSite(d, d.interventions.find((i) => i.id === b.interventionId)!), org: d.orgs.find((o) => o.id === b.orgId)! };
}

export async function getAbonnement() {
  await wait();
  const { orgId } = session();
  return structuredClone(db().abonnements.find((a) => a.orgId === orgId)!);
}

export async function listThreads() {
  await wait();
  const { orgId } = session();
  const d = db();
  return d.threads
    .filter((t) => t.orgId === orgId)
    .map((t) => {
      const ms = d.messages.filter((m) => m.threadId === t.id);
      const it = t.interventionId ? d.interventions.find((i) => i.id === t.interventionId) : undefined;
      return { ...t, ref: it?.ref, status: it?.status, last: ms[ms.length - 1] ?? null, unread: ms.filter((m) => !m.read && m.author === 'equipe').length };
    })
    .filter((t) => t.last || !t.interventionId || (t.status && isUpcoming(t.status)))
    .sort((a, b) => (b.last?.at ?? '').localeCompare(a.last?.at ?? ''));
}

export async function listMessages(threadId: string) {
  await wait();
  return db().messages.filter((m) => m.threadId === threadId);
}

export async function listNotifications() {
  await wait();
  const { orgId } = session();
  return db().notifications.filter((n) => n.orgId === orgId);
}

export async function listTeam() {
  await wait();
  const { orgId } = session();
  return db().users.filter((u) => u.orgId === orgId);
}

export async function listReferrals() {
  await wait();
  const { orgId } = session();
  return db().referrals.filter((r) => r.orgId === orgId).sort((a, b) => b.date.localeCompare(a.date));
}

export async function search(q: string) {
  quietly();
  await wait();
  const { orgId } = session();
  const d = db();
  const t = q.trim().toLowerCase();
  if (!t) return [];
  return d.interventions
    .filter((i) => i.orgId === orgId)
    .map((i) => withSite(d, i))
    .filter((i) => i.ref.toLowerCase().includes(t) || i.site.label.toLowerCase().includes(t) || i.site.address.toLowerCase().includes(t) || i.site.city.toLowerCase().includes(t))
    .slice(0, 8);
}

/** Compteurs légers pour la coquille (sans latence). */
export function counters() {
  const s = S().session;
  if (!s) return { unreadMessages: 0, unreadNotifs: 0, toSign: 0 };
  const d = db();
  const threads = new Set(d.threads.filter((t) => t.orgId === s.orgId).map((t) => t.id));
  return {
    unreadMessages: d.messages.filter((m) => threads.has(m.threadId) && !m.read && m.author === 'equipe').length,
    unreadNotifs: d.notifications.filter((n) => n.orgId === s.orgId && !n.read).length,
    toSign: d.devis.filter((x) => x.orgId === s.orgId && x.status === 'a_signer').length,
  };
}

/* ====================================================================== */
/* Prix                                                                   */
/* ====================================================================== */

export function quoteDemand(input: { siteId: string; content: InterventionContent; delay: Delay; date?: string; dismantle?: number; cleaningM2?: number; longCarry?: boolean }) {
  const { orgId } = session();
  const d = db();
  const site = d.sites.find((s) => s.id === input.siteId);
  const ab = d.abonnements.find((a) => a.orgId === orgId)!;
  const included = ab.plan !== 'ponctuel' && ab.used.passages < ab.included.passages ? { m3: Math.max(0, ab.included.m3 - ab.used.m3), passages: ab.included.passages - ab.used.passages } : null;
  return {
    ...computeProQuote({
      volume: input.content.volume,
      boxes: input.content.mode === 'box' ? input.content.boxes?.length ?? 0 : 0,
      delay: input.delay,
      floor: site?.floor,
      elevator: site?.elevator,
      distanceKm: site?.distanceKm,
      dismantle: input.dismantle,
      cleaningM2: input.cleaningM2,
      longCarry: input.longCarry,
      included,
    }),
    included,
  };
}

/* ====================================================================== */
/* Mutations                                                              */
/* ====================================================================== */

export async function createDemand(input: {
  siteId: string;
  content: InterventionContent;
  delay: Delay;
  slot: { date: string; window: string };
  internalRef?: string;
  purchaseOrder?: string;
  dismantle?: number;
  cleaningM2?: number;
  longCarry?: boolean;
}) {
  const { orgId } = session();
  const q = quoteDemand(input);
  const res = await mutate((d) => {
    const org = d.orgs.find((o) => o.id === orgId)!;
    const prefix = org.id === 'org-seine' ? 'SP' : org.id === 'org-stock' ? 'SB' : 'AC';
    const n = d.interventions.filter((i) => i.orgId === orgId).length + 1;
    const id = uid(`${orgId}-i`);
    const thread = { id: `${id}-t`, orgId, interventionId: id, title: d.sites.find((s) => s.id === input.siteId)?.label ?? 'Intervention' };
    d.threads.push(thread);
    const covered = q.covered;
    const it: Intervention = {
      id,
      ref: `${prefix}-${new Date().getFullYear()}-${String(n).padStart(4, '0')}`,
      orgId,
      siteId: input.siteId,
      status: 'demandee',
      history: [{ status: 'demandee', at: nowIso(), by: 'client' }],
      content: input.content,
      delay: input.delay,
      slot: input.slot,
      internalRef: input.internalRef || undefined,
      purchaseOrder: input.purchaseOrder || undefined,
      lines: q.lines,
      ht: q.ht,
      tva: q.tva,
      ttc: q.ttc,
      threadId: thread.id,
      createdAt: nowIso(),
    };
    if (covered) {
      it.status = 'devis_signe';
      it.history.push({ status: 'devis_signe', at: nowIso(), by: 'systeme', note: 'Couvert par l’abonnement' });
    }
    d.interventions.unshift(it);
    d.messages.push({ id: uid('m'), threadId: thread.id, author: 'equipe', userName: 'Max · Express Débarras', text: covered ? 'Demande reçue, couverte par votre abonnement. Nous planifions le passage.' : 'Demande reçue ! Nous validons vos photos et vous envoyons le devis dans l’heure.', at: nowIso(), read: false });
    notify(d, orgId, { kind: 'statut', title: 'Demande envoyée', body: `${it.ref} · ${STATUS_META[it.status].label}`, href: `/pro/interventions?id=${it.id}` });
    return it;
  });
  publish({ type: 'created', orgId, interventionId: res.id, ref: res.ref });
  return res;
}

/** Transition de statut, côté client ou équipe. Effets de bord inclus (devis, facture, rapport…). */
export async function transition(id: string, to: Status, by: 'client' | 'equipe', extra: { note?: string; slot?: { date: string; window: string } } = {}) {
  let orgId = '';
  let ref = '';
  await mutate((d) => {
    const it = d.interventions.find((x) => x.id === id);
    if (!it) throw new ApiError('Intervention introuvable.');
    if (!canTransition(it.status, to, by)) throw new ApiError(`Transition impossible : ${STATUS_META[it.status].label} → ${STATUS_META[to].label}`);
    orgId = it.orgId;
    ref = it.ref;
    applyTransition(d, it, to, by, extra);
  });
  publish({ type: 'status', orgId, interventionId: id, ref, status: to, by });
}

function applyTransition(d: ProDB, it: Intervention, to: Status, by: 'client' | 'equipe' | 'systeme', extra: { note?: string; slot?: { date: string; window: string } }) {
  const site = d.sites.find((s) => s.id === it.siteId)!;
  const org = d.orgs.find((o) => o.id === it.orgId)!;
  it.status = to;
  it.history.push({ status: to, at: nowIso(), by, note: extra.note });
  const say = (text: string) => d.messages.push({ id: uid('m'), threadId: it.threadId, author: 'equipe', userName: 'Noa · Express Débarras', text, at: nowIso(), read: false });

  if (to === 'devis_envoye') {
    const q: Devis = {
      id: `${it.id}-q`,
      ref: `DV-${it.ref}`,
      orgId: it.orgId,
      interventionId: it.id,
      lines: it.lines,
      ht: it.ht,
      tva: it.tva,
      ttc: it.ttc,
      status: 'a_signer',
      issuedAt: nowIso(),
      validUntil: new Date(Date.now() + 30 * 86400000).toISOString(),
    };
    d.devis = d.devis.filter((x) => x.id !== q.id);
    d.devis.unshift(q);
    it.quoteId = q.id;
    notify(d, it.orgId, { kind: 'devis', title: 'Devis à signer', body: `${q.ref} · ${(q.ht / 100).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} € HT`, href: `/pro/devis/${q.id}` });
    say('Photos validées, votre devis est prêt. Il ne reste qu’à le signer.');
  }
  if (to === 'planifiee') {
    if (extra.slot) it.slot = extra.slot;
    if (!it.slot) {
      const dt = new Date(Date.now() + 2 * 86400000);
      dt.setHours(9, 0, 0, 0);
      it.slot = { date: dt.toISOString(), window: '8 h – 12 h' };
    }
    notify(d, it.orgId, { kind: 'statut', title: 'Intervention planifiée', body: `${it.ref} · ${new Date(it.slot.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}, ${it.slot.window}`, href: `/pro/interventions?id=${it.id}` });
  }
  if (to === 'en_route') {
    notify(d, it.orgId, { kind: 'statut', title: 'Le camion est en route', body: `${it.ref} · ${site.label}`, href: `/pro/interventions?id=${it.id}` });
    say('Nous partons du dépôt, arrivée dans 20 minutes environ.');
  }
  if (to === 'en_cours') notify(d, it.orgId, { kind: 'statut', title: 'Intervention en cours', body: `${it.ref} · ${site.label}`, href: `/pro/interventions?id=${it.id}` });
  if (to === 'terminee') {
    // consommation d'abonnement
    const ab = d.abonnements.find((a) => a.orgId === it.orgId)!;
    if (!it.quoteId && ab.plan !== 'ponctuel') {
      ab.used.passages += 1;
      ab.used.m3 = Math.round((ab.used.m3 + it.content.volume) * 10) / 10;
    }
    // facture à l'unité si hors abonnement
    if (it.quoteId && it.ht > 0) {
      const n = d.factures.filter((f) => f.orgId === it.orgId).length + 1;
      const f: Facture = {
        id: `${it.id}-f`,
        number: `FA-${it.ref.split('-')[0]}-${new Date().getFullYear()}-${String(n).padStart(3, '0')}`,
        orgId: it.orgId,
        interventionId: it.id,
        label: `Intervention ${it.ref}`,
        lines: it.lines,
        ht: it.ht,
        tva: it.tva,
        ttc: it.ttc,
        status: 'a_payer',
        issuedAt: nowIso(),
        dueAt: new Date(Date.now() + 30 * 86400000).toISOString(),
      };
      d.factures.unshift(f);
      it.invoiceId = f.id;
      notify(d, it.orgId, { kind: 'facture', title: 'Facture émise', body: `${f.number} · ${(f.ttc / 100).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} € TTC`, href: `/pro/factures/${f.id}` });
    }
    notify(d, it.orgId, { kind: 'statut', title: 'Intervention terminée', body: `${it.ref} · ${site.label}`, href: `/pro/interventions?id=${it.id}` });
    say('C’est terminé ! Les photos après sont jointes, le rapport de tri suit.');
  }
  if (to === 'rapport_dispo') {
    const pct = 55 + Math.round(Math.random() * 17);
    const v = it.content.volume;
    const parts = [
      ['Réemploi', 15],
      ['Meubles', 15],
      ['Métaux', 10],
      ['Revente', 8],
      ['DEEE', it.content.deee ? 7 : 0],
      ['Textiles et livres', 5],
    ] as [string, number][];
    const ws = parts.reduce((s, p) => s + p[1], 0);
    const filieres = parts.filter((p) => p[1] > 0).map(([name, w]) => ({ name, m3: Math.round(((v * pct) / 100) * (w / ws) * 10) / 10, valorised: true }));
    filieres.push({ name: 'Tout-venant', m3: Math.round((v - filieres.reduce((s, f) => s + f.m3, 0)) * 10) / 10, valorised: false });
    const r: RapportTri = { id: `${it.id}-r`, orgId: it.orgId, interventionId: it.id, volume: v, valorisedPct: pct, filieres, date: nowIso() };
    const b: Bordereau = {
      id: `${it.id}-b`,
      number: `BSD-${it.ref}`,
      orgId: it.orgId,
      interventionId: it.id,
      producteur: `${org.name} · ${site.label}`,
      collecteur: 'Express Débarras · Rouen',
      nature: ['Encombrants', ...(it.content.deee ? ['DEEE'] : []), ...(it.content.archives ? ['Archives papier'] : []), ...(it.content.mobilierBureau ? ['Mobilier de bureau'] : [])],
      volume: v,
      destination: ['Ressourcerie partenaire · Rouen', 'Récupérateur de métaux · Petit-Quevilly', 'Déchetterie professionnelle · Métropole'],
      date: nowIso(),
    };
    d.rapports = d.rapports.filter((x) => x.id !== r.id);
    d.bordereaux = d.bordereaux.filter((x) => x.id !== b.id);
    d.rapports.unshift(r);
    d.bordereaux.unshift(b);
    it.reportId = r.id;
    it.slipId = b.id;
    notify(d, it.orgId, { kind: 'rapport', title: 'Rapport de tri disponible', body: `${it.ref} · ${pct} % valorisé`, href: `/pro/documents/rapport/${r.id}` });
  }
  if (to === 'annulee' && it.quoteId) {
    const q = d.devis.find((x) => x.id === it.quoteId);
    if (q && q.status === 'a_signer') q.status = 'refuse';
  }
}

export async function signDevis(id: string, signature: { dataUrl: string; name: string }) {
  let it: Intervention | undefined;
  await mutate((d) => {
    const q = d.devis.find((x) => x.id === id);
    if (!q || q.status !== 'a_signer') throw new ApiError('Ce devis n’est plus à signer.');
    q.status = 'signe';
    q.signature = { ...signature, at: nowIso() };
    it = d.interventions.find((x) => x.id === q.interventionId);
    if (it && it.status === 'devis_envoye') applyTransition(d, it, 'devis_signe', 'client', {});
  });
  if (it) publish({ type: 'status', orgId: it.orgId, interventionId: it.id, ref: it.ref, status: 'devis_signe', by: 'client' });
}

export async function refuseDevis(id: string, reason: string) {
  let it: Intervention | undefined;
  await mutate((d) => {
    const q = d.devis.find((x) => x.id === id);
    if (!q || q.status !== 'a_signer') throw new ApiError('Ce devis n’est plus à signer.');
    q.status = 'refuse';
    q.refusal = reason;
    it = d.interventions.find((x) => x.id === q.interventionId);
    if (it && it.status === 'devis_envoye') applyTransition(d, it, 'annulee', 'client', { note: reason });
  });
  if (it) publish({ type: 'status', orgId: it.orgId, interventionId: it.id, ref: it.ref, status: 'annulee', by: 'client' });
}

export async function reschedule(id: string, date: string, window = '8 h – 12 h') {
  let orgId = '';
  let ref = '';
  await mutate((d) => {
    const it = d.interventions.find((x) => x.id === id)!;
    if (it.status !== 'planifiee') throw new ApiError('Seule une intervention planifiée peut être reportée.');
    orgId = it.orgId;
    ref = it.ref;
    it.slot = { date, window };
    it.history.push({ status: 'planifiee', at: nowIso(), by: 'client', note: `Report demandé au ${new Date(date).toLocaleDateString('fr-FR')}` });
    d.messages.push({ id: uid('m'), threadId: it.threadId, author: 'client', userName: 'Vous', text: `Report demandé au ${new Date(date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}.`, at: nowIso(), read: true });
  });
  publish({ type: 'status', orgId, interventionId: id, ref, status: 'planifiee', by: 'client' });
}

export async function duplicate(id: string) {
  const d = db();
  const it = d.interventions.find((x) => x.id === id)!;
  const dt = new Date(Date.now() + 3 * 86400000);
  dt.setHours(9, 0, 0, 0);
  return createDemand({ siteId: it.siteId, content: structuredClone(it.content), delay: '48h', slot: { date: dt.toISOString(), window: '8 h – 12 h' }, internalRef: it.internalRef });
}

const AUTO = [
  'Bien reçu, Noa passe vers 14 h.',
  'Photos validées, le devis arrive dans l’heure.',
  'C’est noté, merci pour la précision !',
  'Parfait, nous prévoyons un deuxième équipier.',
  'Merci, nous gardons les clés à l’agence jusqu’à jeudi.',
];

export async function sendMessage(threadId: string, text: string, attachments?: string[], onTyping?: (typing: boolean) => void) {
  const s = session();
  const me = db().users.find((u) => u.id === s.userId)!;
  await mutate((d) => {
    d.messages.push({ id: uid('m'), threadId, author: 'client', userName: `${me.firstName} ${me.lastName}`, text, attachments, at: nowIso(), read: true });
  });
  publish({ type: 'message', orgId: s.orgId, threadId, author: 'client', text });
  // réponse automatique de l'équipe après 2 à 4 s
  const delay = 2000 + Math.random() * 2000;
  setTimeout(() => onTyping?.(true), 700);
  setTimeout(() => {
    onTyping?.(false);
    const reply = AUTO[Math.floor(Math.random() * AUTO.length)];
    S().write((d) => {
      d.messages.push({ id: uid('m'), threadId, author: 'equipe', userName: 'Noa · Express Débarras', text: reply, at: nowIso(), read: false });
    });
    publish({ type: 'message', orgId: s.orgId, threadId, author: 'equipe', text: reply });
  }, delay);
}

export async function markThreadRead(threadId: string) {
  S().write((d) => d.messages.forEach((m) => m.threadId === threadId && (m.read = true)));
}

export async function markNotifications(ids: string[] | 'all') {
  const { orgId } = session();
  S().write((d) => d.notifications.forEach((n) => n.orgId === orgId && (ids === 'all' || ids.includes(n.id)) && (n.read = true)));
}

export async function payInvoice(id: string) {
  await mutate((d) => {
    const f = d.factures.find((x) => x.id === id)!;
    f.status = 'payee';
    f.paidAt = nowIso();
  });
}

export async function changePlan(plan: Plan) {
  const { orgId } = session();
  const now = new Date();
  const days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  await mutate((d) => {
    const ab = d.abonnements.find((a) => a.orgId === orgId)!;
    const org = d.orgs.find((o) => o.id === orgId)!;
    const amount = prorata(ab.plan, plan, now.getDate(), days);
    ab.plan = plan;
    org.plan = plan;
    ab.monthlyHt = PRO.plans[plan].monthly;
    ab.included = { passages: PRO.plans[plan].passages, m3: PRO.plans[plan].m3 };
    if (amount > 0) {
      const n = d.factures.filter((f) => f.orgId === orgId).length + 1;
      const ht = amount;
      const tva = Math.round(ht * 0.2);
      d.factures.unshift({ id: uid('f'), number: `FA-PR-${now.getFullYear()}-${String(n).padStart(3, '0')}`, orgId, label: `Prorata passage à ${PRO.plans[plan].label}`, lines: [{ label: `Prorata ${PRO.plans[plan].label}`, qty: 1, unit: ht, total: ht, kind: 'base' }], ht, tva, ttc: ht + tva, status: 'a_payer', issuedAt: now.toISOString(), dueAt: new Date(Date.now() + 30 * 86400000).toISOString() });
    }
  });
}

export function prorataPreview(to: Plan) {
  const { orgId } = session();
  const ab = db().abonnements.find((a) => a.orgId === orgId)!;
  const now = new Date();
  const days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return { amount: prorata(ab.plan, to, now.getDate(), days), daysLeft: days - now.getDate() + 1, days, monthly: monthlyBill };
}

export async function addSite(input: Omit<Site, 'id' | 'orgId' | 'map'>) {
  const { orgId } = session();
  return mutate((d) => {
    const s: Site = { ...input, id: uid(`${orgId}-s`), orgId, map: { x: 30 + Math.random() * 40, y: 20 + Math.random() * 45 } };
    d.sites.push(s);
    return s;
  });
}

export async function importSites(rows: Omit<Site, 'id' | 'orgId' | 'map'>[]) {
  const { orgId } = session();
  return mutate((d) => {
    for (const r of rows) d.sites.push({ ...r, id: uid(`${orgId}-s`), orgId, map: { x: 30 + Math.random() * 40, y: 20 + Math.random() * 45 } });
    return rows.length;
  });
}

export async function inviteMember(email: string, role: Role) {
  const { orgId } = session();
  return mutate((d) => {
    const [local] = email.split('@');
    const [fn = local, ln = ''] = local.split(/[._-]/);
    const cap = (x: string) => x.charAt(0).toUpperCase() + x.slice(1);
    const u: Utilisateur = { id: uid(`${orgId}-u`), orgId, firstName: cap(fn), lastName: cap(ln), email, role, avatarSeed: Math.floor(Math.random() * 1000), invited: true };
    d.users.push(u);
    return u;
  });
}

export async function setRole(userId: string, role: Role) {
  await mutate((d) => {
    const u = d.users.find((x) => x.id === userId)!;
    u.role = role;
  });
}

export async function updateOrg(patch: { name?: string; siret?: string; billingAddress?: string }) {
  const { orgId } = session();
  await mutate((d) => {
    Object.assign(d.orgs.find((o) => o.id === orgId)!, patch);
  });
}

export async function resetDemo() {
  const s = S().session;
  S().replaceDb(buildSeed());
  S().setPrefs({ tourDone: {} });
  if (s) S().setSession(s);
  publish({ type: 'db' });
}

/* ---------- Côté équipe (/espace) ---------- */
export function teamQueue() {
  const d = db();
  return d.interventions
    .filter((i) => isUpcoming(i.status) || (i.status === 'terminee'))
    .map((i) => ({ ...withSite(d, i), org: d.orgs.find((o) => o.id === i.orgId)! }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export type { Message, Facture, Devis, RapportTri, Bordereau };
