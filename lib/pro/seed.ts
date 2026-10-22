import { computeProQuote, monthlyBill, PRO } from './pricing';
import type {
  Abonnement,
  Bordereau,
  Devis,
  Facture,
  Intervention,
  Message,
  Notification,
  Organisation,
  ProDB,
  RapportTri,
  Referral,
  Site,
  Status,
  Thread,
  Utilisateur,
} from './types';

/* ---------- Aléatoire déterministe ---------- */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const day = 86400000;
const iso = (d: Date) => d.toISOString();
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * day);
const at = (d: Date, h: number, m = 0) => {
  const x = new Date(d);
  x.setHours(h, m, 0, 0);
  return x;
};
const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
const r1 = (x: number) => Math.round(x * 10) / 10;

/* ---------- Référentiel fictif ---------- */
const STREETS = [
  ['Rue Beauvoisine', 'Rouen', '76000'],
  ['Rue du Gros-Horloge', 'Rouen', '76000'],
  ['Rue Jeanne-d’Arc', 'Rouen', '76000'],
  ['Rue de la République', 'Rouen', '76000'],
  ['Boulevard des Belges', 'Rouen', '76000'],
  ['Rue Saint-Romain', 'Rouen', '76000'],
  ['Rue Eau-de-Robec', 'Rouen', '76000'],
  ['Rue du Renard', 'Rouen', '76000'],
  ['Avenue de Bretagne', 'Rouen', '76100'],
  ['Rue Saint-Julien', 'Rouen', '76100'],
  ['Rue Jean-Lecanuet', 'Rouen', '76000'],
  ['Rue Bouquet', 'Rouen', '76000'],
  ['Rue du Général-Leclerc', 'Sotteville-lès-Rouen', '76300'],
  ['Rue de l’Église', 'Bois-Guillaume', '76230'],
  ['Route de Neufchâtel', 'Bihorel', '76420'],
  ['Rue Pasteur', 'Petit-Quevilly', '76140'],
  ['Avenue des Canadiens', 'Grand-Quevilly', '76120'],
  ['Rue du Madrillet', 'Saint-Étienne-du-Rouvray', '76800'],
];
const LOGEMENTS = ['T2', 'T3', 'Studio', 'T4', 'Maison', 'T2 duplex', 'T1 bis'];
const WINDOWS = ['8 h – 12 h', '13 h – 17 h'];
const FILIERES = [
  { name: 'Réemploi', w: 15, v: true },
  { name: 'Meubles', w: 15, v: true },
  { name: 'Métaux', w: 10, v: true },
  { name: 'Revente', w: 8, v: true },
  { name: 'DEEE', w: 7, v: true },
  { name: 'Textiles et livres', w: 5, v: true },
];
const DESTINATIONS: Record<string, string> = {
  Réemploi: 'Ressourcerie partenaire · Rouen',
  Meubles: 'Filière ameublement · Grand-Quevilly',
  Métaux: 'Récupérateur de métaux · Petit-Quevilly',
  Revente: 'Dépôt-vente · Rouen rive gauche',
  DEEE: 'Point de collecte DEEE agréé',
  'Textiles et livres': 'Borne textile et bouquinerie',
  'Tout-venant': 'Déchetterie professionnelle · Métropole',
};

type OrgSpec = {
  org: Omit<Organisation, 'subscriptionStart'>;
  prefix: string;
  users: [string, string, Utilisateur['role']][];
  seed: number;
  count: [number, number];
  volume: [number, number];
};

const SPECS: OrgSpec[] = [
  {
    org: {
      id: 'org-seine',
      name: 'Agence Seine & Pierre',
      kind: 'agence',
      tagline: 'Agence immobilière · 14 logements gérés',
      siret: '[à compléter]',
      billingAddress: 'Rue Jeanne-d’Arc, 76000 Rouen',
      plan: 'plus',
      referralCode: 'SEINE-PIERRE',
    },
    prefix: 'SP',
    users: [
      ['Claire', 'Morvan', 'admin'],
      ['Julien', 'Lebrun', 'gestionnaire'],
      ['Sophie', 'Taillandier', 'comptable'],
    ],
    seed: 11,
    count: [30, 36],
    volume: [3, 16],
  },
  {
    org: {
      id: 'org-stock',
      name: 'StockBox Rive Gauche',
      kind: 'stockage',
      tagline: 'Self-stockage · 220 box',
      siret: '[à compléter]',
      billingAddress: 'Avenue de Bretagne, 76100 Rouen',
      plan: 'ponctuel',
    },
    prefix: 'SB',
    users: [
      ['Karim', 'Aubert', 'admin'],
      ['Léa', 'Fontaine', 'gestionnaire'],
      ['Marc', 'Delattre', 'comptable'],
    ],
    seed: 23,
    count: [32, 40],
    volume: [1, 4],
  },
  {
    org: {
      id: 'org-atelier',
      name: 'Atelier Cauchoise',
      kind: 'pme',
      tagline: 'PME · 2 sites',
      siret: '[à compléter]',
      billingAddress: 'Route de Neufchâtel, 76420 Bihorel',
      plan: 'essentiel',
    },
    prefix: 'AC',
    users: [
      ['Hélène', 'Varin', 'admin'],
      ['Thomas', 'Guérin', 'gestionnaire'],
      ['Nadia', 'Benali', 'comptable'],
    ],
    seed: 37,
    count: [25, 30],
    volume: [1.5, 6],
  },
];

const TEAM_REPLIES = [
  'Bien reçu, Noa passe vers 14 h.',
  'Photos validées, le devis arrive dans l’heure.',
  'C’est noté, nous apportons des sangles pour l’armoire.',
  'Le camion est réservé pour ce créneau.',
  'Merci ! Le rapport de tri vous attend dans Documents.',
];

export function buildSeed(now = new Date()): ProDB {
  const db: ProDB = {
    version: 1,
    seededAt: iso(now),
    orgs: [],
    users: [],
    sites: [],
    interventions: [],
    devis: [],
    factures: [],
    rapports: [],
    bordereaux: [],
    threads: [],
    messages: [],
    notifications: [],
    abonnements: [],
    referrals: [],
  };
  const today = at(now, 9);

  for (const spec of SPECS) {
    const R = rng(spec.seed);
    const pick = <T,>(a: T[]) => a[Math.floor(R() * a.length)];
    const between = (a: number, b: number) => a + R() * (b - a);
    const org: Organisation = { ...spec.org, subscriptionStart: iso(addDays(today, -400)) };
    db.orgs.push(org);
    const slug = org.name.toLowerCase().normalize('NFD').replace(/[^a-z]+/g, '');
    spec.users.forEach(([fn, ln, role], i) =>
      db.users.push({
        id: `${org.id}-u${i}`,
        orgId: org.id,
        firstName: fn,
        lastName: ln,
        role,
        email: `${fn.toLowerCase().normalize('NFD').replace(/[^a-z]/g, '')}.${ln.toLowerCase().normalize('NFD').replace(/[^a-z]/g, '')}@${slug}.demo`,
        avatarSeed: Math.floor(R() * 1000),
      }),
    );

    /* ---- sites ---- */
    const sites: Site[] = [];
    if (org.kind === 'agence') {
      for (let i = 0; i < 14; i++) {
        const [street, city, cp] = STREETS[i % STREETS.length];
        const floor = Math.floor(R() * 6);
        sites.push({
          id: `${org.id}-s${i}`,
          orgId: org.id,
          label: `${pick(LOGEMENTS)} · ${street.replace(/^(Rue|Avenue|Boulevard|Route|Quai) (du |de la |de l’|des |de )?/, '')}`,
          kind: 'logement',
          address: street,
          city,
          postalCode: cp,
          floor,
          elevator: floor >= 3 ? R() > 0.4 : false,
          accessCode: `${Math.floor(1000 + R() * 8999)}B`,
          onSiteContact: 'Gardien · 06 00 00 00 00',
          keys: R() > 0.5 ? 'agence' : 'gardien',
          distanceKm: Math.round(between(1, 9)),
          map: { x: between(30, 72), y: between(22, 62) },
        });
      }
    } else if (org.kind === 'stockage') {
      const mk = (prefix: string, n: number) => Array.from({ length: n }, (_, k) => `${prefix}${String(k + 1).padStart(3, '0')}`);
      sites.push(
        { id: `${org.id}-s0`, orgId: org.id, label: 'Site Saint-Sever · 140 box', kind: 'box', address: 'Avenue de Bretagne', city: 'Rouen', postalCode: '76100', floor: 0, elevator: true, accessCode: 'Badge accueil', onSiteContact: 'Accueil · 02 35 00 00 01', keys: 'sur-place', distanceKm: 3, boxes: mk('A', 140), map: { x: 48, y: 66 } },
        { id: `${org.id}-s1`, orgId: org.id, label: 'Site Grand-Quevilly · 80 box', kind: 'box', address: 'Avenue des Canadiens', city: 'Grand-Quevilly', postalCode: '76120', floor: 0, elevator: true, accessCode: 'Badge accueil', onSiteContact: 'Accueil · 02 35 00 00 02', keys: 'sur-place', distanceKm: 7, boxes: mk('B', 80), map: { x: 24, y: 78 } },
      );
    } else {
      sites.push(
        { id: `${org.id}-s0`, orgId: org.id, label: 'Atelier · Déville-lès-Rouen', kind: 'entrepot', address: 'Rue Pasteur', city: 'Déville-lès-Rouen', postalCode: '76250', floor: 0, elevator: false, accessCode: 'Portail bleu', onSiteContact: 'Thomas Guérin', keys: 'sur-place', distanceKm: 6, map: { x: 22, y: 26 } },
        { id: `${org.id}-s1`, orgId: org.id, label: 'Bureaux · Mont-Saint-Aignan', kind: 'bureau', address: 'Rue de l’Église', city: 'Mont-Saint-Aignan', postalCode: '76130', floor: 2, elevator: false, accessCode: '2580A', onSiteContact: 'Accueil', keys: 'sur-place', distanceKm: 5, map: { x: 40, y: 14 } },
      );
    }
    db.sites.push(...sites);

    const plan = PRO.plans[org.plan];
    const general: Thread = { id: `${org.id}-t-gen`, orgId: org.id, title: 'Fil général' };
    db.threads.push(general);

    /* ---- interventions passées ---- */
    const n = Math.round(between(spec.count[0], spec.count[1]));
    const usage: Record<string, { passages: number; m3: number }> = {};
    let refN = 1;
    const ref = () => `${spec.prefix}-${now.getFullYear()}-${String(refN++).padStart(4, '0')}`;
    const pastDates = Array.from({ length: n }, () => addDays(today, -Math.round(between(4, 360)))).sort((a, b) => a.getTime() - b.getTime());

    const mkContent = (siteIdx: number) => {
      const site = sites[siteIdx];
      if (org.kind === 'stockage') {
        const k = Math.max(1, Math.round(between(spec.volume[0], spec.volume[1])));
        const start = Math.floor(R() * (site.boxes!.length - k));
        const boxes = site.boxes!.slice(start, start + k);
        return { mode: 'box' as const, volume: r1(k * between(3.5, 5.5)), boxes, deee: R() > 0.7, archives: false, mobilierBureau: false, photos: Math.round(between(2, 6)) };
      }
      return {
        mode: 'volume' as const,
        volume: r1(between(spec.volume[0], spec.volume[1])),
        deee: R() > 0.6,
        archives: org.kind === 'pme' && R() > 0.5,
        mobilierBureau: org.kind === 'pme' && R() > 0.4,
        photos: Math.round(between(2, 8)),
      };
    };

    const quoteFor = (content: ReturnType<typeof mkContent>, site: Site, d: Date, delay: Intervention['delay']) => {
      const k = monthKey(d);
      const u = (usage[k] ??= { passages: 0, m3: 0 });
      const included = org.plan !== 'ponctuel' && u.passages < plan.passages ? { m3: Math.max(0, plan.m3 - u.m3), passages: plan.passages - u.passages } : null;
      const q = computeProQuote({
        volume: content.volume,
        boxes: content.mode === 'box' ? content.boxes!.length : 0,
        delay,
        floor: site.floor,
        elevator: site.elevator,
        distanceKm: site.distanceKm,
        included,
      });
      return { q, included, k, u };
    };

    for (let i = 0; i < n; i++) {
      let d = pastDates[i];
      const siteIdx = Math.floor(R() * sites.length);
      const site = sites[siteIdx];
      const content = mkContent(siteIdx);
      const delay: Intervention['delay'] = R() > 0.88 ? 'urgence' : R() > 0.9 ? 'samedi' : '48h';
      d = at(d, R() > 0.5 ? 9 : 14);
      const { q, included, u } = quoteFor(content, site, d, delay);
      const cancelled = R() < 0.05;
      const id = `${org.id}-i${i}`;
      const created = addDays(d, -Math.round(between(2, 6)));
      const history: Intervention['history'] = [{ status: 'demandee', at: iso(created), by: 'client' }];
      if (!included) {
        history.push({ status: 'devis_envoye', at: iso(addDays(created, 0.05)), by: 'equipe' });
        history.push({ status: 'devis_signe', at: iso(addDays(created, 0.3)), by: 'client' });
      } else history.push({ status: 'devis_signe', at: iso(addDays(created, 0.01)), by: 'systeme' });
      let status: Status;
      if (cancelled) {
        history.push({ status: 'annulee', at: iso(addDays(created, 0.6)), by: 'client', note: 'Bien reloué entre-temps' });
        status = 'annulee';
      } else {
        history.push({ status: 'planifiee', at: iso(addDays(created, 0.5)), by: 'equipe' });
        history.push({ status: 'en_route', at: iso(addDays(d, -0.02)), by: 'equipe' });
        history.push({ status: 'en_cours', at: iso(d), by: 'equipe' });
        history.push({ status: 'terminee', at: iso(addDays(d, 0.12)), by: 'equipe' });
        history.push({ status: 'rapport_dispo', at: iso(addDays(d, 0.5)), by: 'equipe' });
        status = 'rapport_dispo';
        if (included) {
          u.passages += 1;
          u.m3 = r1(u.m3 + content.volume);
        }
      }
      const thread: Thread = { id: `${id}-t`, orgId: org.id, interventionId: id, title: `${site.label}` };
      db.threads.push(thread);
      const inter: Intervention = {
        id,
        ref: ref(),
        orgId: org.id,
        siteId: site.id,
        status,
        history,
        content,
        delay,
        slot: { date: iso(d), window: d.getHours() < 12 ? WINDOWS[0] : WINDOWS[1] },
        internalRef: org.kind === 'agence' ? `LOT-${Math.floor(100 + R() * 800)}` : undefined,
        purchaseOrder: org.kind === 'pme' ? `BC-${Math.floor(1000 + R() * 8000)}` : undefined,
        lines: q.lines,
        ht: q.ht,
        tva: q.tva,
        ttc: q.ttc,
        threadId: thread.id,
        createdAt: iso(created),
      };
      if (!included) {
        const dv: Devis = { id: `${id}-q`, ref: `DV-${inter.ref}`, orgId: org.id, interventionId: id, lines: q.lines, ht: q.ht, tva: q.tva, ttc: q.ttc, status: 'signe', issuedAt: history[1].at, validUntil: iso(addDays(new Date(history[1].at), 30)), signature: { dataUrl: '', name: `${spec.users[0][0]} ${spec.users[0][1]}`, at: history[2].at } };
        db.devis.push(dv);
        inter.quoteId = dv.id;
      }
      if (status === 'rapport_dispo') {
        // rapport de tri et bordereau
        const pct = Math.round(between(55, 72));
        const valorisedM3 = (content.volume * pct) / 100;
        const parts = FILIERES.filter((f) => f.name !== 'DEEE' || content.deee);
        const wsum = parts.reduce((s, f) => s + f.w, 0);
        const filieres = parts.map((f) => ({ name: f.name, m3: r1((valorisedM3 * f.w) / wsum), valorised: true }));
        filieres.push({ name: 'Tout-venant', m3: r1(content.volume - filieres.reduce((s, f) => s + f.m3, 0)), valorised: false });
        const rp: RapportTri = { id: `${id}-r`, orgId: org.id, interventionId: id, volume: content.volume, valorisedPct: pct, filieres, date: history[history.length - 1].at };
        const bd: Bordereau = {
          id: `${id}-b`,
          number: `BSD-${inter.ref}`,
          orgId: org.id,
          interventionId: id,
          producteur: `${org.name} · ${site.label}`,
          collecteur: 'Express Débarras · Rouen',
          nature: ['Encombrants ménagers', ...(content.deee ? ['DEEE'] : []), ...(content.archives ? ['Archives papier'] : []), ...(content.mobilierBureau ? ['Mobilier de bureau'] : [])],
          volume: content.volume,
          destination: filieres.filter((f) => f.m3 > 0).map((f) => DESTINATIONS[f.name]),
          date: iso(d),
        };
        db.rapports.push(rp);
        db.bordereaux.push(bd);
        inter.reportId = rp.id;
        inter.slipId = bd.id;
      }
      db.interventions.push(inter);
    }

    /* ---- factures ---- */
    const factures: Facture[] = [];
    let fN = 1;
    const fnum = (d: Date) => `FA-${spec.prefix}-${d.getFullYear()}-${String(fN++).padStart(3, '0')}`;
    {
      // interventions facturées à l'unité (hors abonnement)
      for (const it of db.interventions.filter((x) => x.orgId === org.id && x.status === 'rapport_dispo' && x.quoteId && x.ht > 0)) {
        const done = new Date(it.history.find((h) => h.status === 'terminee')!.at);
        const f: Facture = { id: `${it.id}-f`, number: fnum(done), orgId: org.id, interventionId: it.id, label: `Intervention ${it.ref}`, lines: it.lines, ht: it.ht, tva: it.tva, ttc: it.ttc, status: 'payee', issuedAt: iso(done), dueAt: iso(addDays(done, 30)), paidAt: iso(addDays(done, Math.round(between(5, 25)))) };
        factures.push(f);
        it.invoiceId = f.id;
      }
    }
    if (org.plan !== 'ponctuel') {
      for (let m = 11; m >= 0; m--) {
        const d = new Date(today.getFullYear(), today.getMonth() - m, 1, 9);
        const k = monthKey(d);
        const used = usage[k]?.m3 ?? 0;
        const b = monthlyBill(org.plan, used);
        const label = `Abonnement ${plan.label} · ${d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`;
        const f: Facture = { id: `${org.id}-fa${m}`, number: fnum(d), orgId: org.id, label, lines: b.lines, ht: b.ht, tva: b.tva, ttc: b.ttc, status: 'payee', issuedAt: iso(d), dueAt: iso(addDays(d, 30)), paidAt: iso(addDays(d, Math.round(between(3, 20)))) };
        factures.push(f);
        for (const it of db.interventions.filter((x) => x.orgId === org.id && !x.quoteId && x.slot && monthKey(new Date(x.slot.date)) === k)) it.invoiceId = f.id;
      }
    }
    factures.sort((a, b) => a.issuedAt.localeCompare(b.issuedAt));
    // 2 factures en retard (échéance dépassée), les plus récentes à payer
    const overdue = factures.filter((f) => new Date(f.dueAt) < addDays(today, -10));
    overdue.slice(-2).forEach((f) => {
      f.status = 'en_retard';
      delete f.paidAt;
    });
    factures.filter((f) => new Date(f.dueAt) >= today).forEach((f) => {
      f.status = 'a_payer';
      delete f.paidAt;
    });
    db.factures.push(...factures);

    /* ---- à venir ---- */
    const up = (k: number, status: Status, dOffset: number, opts: { volume?: number; delay?: Intervention['delay'] } = {}) => {
      const site = sites[k % sites.length];
      const id = `${org.id}-up${k}`;
      const content = mkContent(k % sites.length);
      if (opts.volume) content.volume = opts.volume;
      const d = at(addDays(today, dOffset), dOffset === 2 ? 9 : 14);
      const delay = opts.delay ?? '48h';
      const u = usage[monthKey(d)] ?? { passages: 0, m3: 0 };
      const included = org.plan !== 'ponctuel' && status !== 'devis_envoye' && u.passages < plan.passages ? { m3: Math.max(0, plan.m3 - u.m3), passages: plan.passages - u.passages } : null;
      const q = computeProQuote({ volume: content.volume, boxes: content.mode === 'box' ? content.boxes!.length : 0, delay, floor: site.floor, elevator: site.elevator, distanceKm: site.distanceKm, included });
      const created = addDays(today, -Math.max(1, Math.round(between(1, 3))));
      const history: Intervention['history'] = [{ status: 'demandee', at: iso(created), by: 'client' }];
      if (status !== 'demandee') {
        if (included) history.push({ status: 'devis_signe', at: iso(addDays(created, 0.01)), by: 'systeme' });
        else history.push({ status: 'devis_envoye', at: iso(addDays(created, 0.05)), by: 'equipe' });
      }
      if (status === 'planifiee') {
        if (!included) history.push({ status: 'devis_signe', at: iso(addDays(created, 0.3)), by: 'client' });
        history.push({ status: 'planifiee', at: iso(addDays(created, 0.5)), by: 'equipe' });
      }
      const thread: Thread = { id: `${id}-t`, orgId: org.id, interventionId: id, title: site.label };
      db.threads.push(thread);
      const it: Intervention = {
        id,
        ref: ref(),
        orgId: org.id,
        siteId: site.id,
        status,
        history,
        content,
        delay,
        slot: status === 'planifiee' ? { date: iso(d), window: d.getHours() < 12 ? WINDOWS[0] : WINDOWS[1] } : undefined,
        lines: q.lines,
        ht: q.ht,
        tva: q.tva,
        ttc: q.ttc,
        threadId: thread.id,
        createdAt: iso(created),
        internalRef: org.kind === 'agence' ? `LOT-${Math.floor(100 + R() * 800)}` : undefined,
      };
      if (!included && status !== 'demandee') {
        const issued = history.find((h) => h.status === 'devis_envoye')!.at;
        const dv: Devis = { id: `${id}-q`, ref: `DV-${it.ref}`, orgId: org.id, interventionId: id, lines: q.lines, ht: q.ht, tva: q.tva, ttc: q.ttc, status: status === 'devis_envoye' ? 'a_signer' : 'signe', issuedAt: issued, validUntil: iso(addDays(new Date(issued), 30)), signature: status === 'devis_envoye' ? undefined : { dataUrl: '', name: `${spec.users[0][0]} ${spec.users[0][1]}`, at: issued } };
        db.devis.push(dv);
        it.quoteId = dv.id;
      }
      db.interventions.push(it);
      return it;
    };
    const next = up(0, 'planifiee', 2);
    up(1, 'planifiee', 9);
    const toSign = up(2, 'devis_envoye', 0, { volume: org.kind === 'stockage' ? undefined : spec.volume[1] + 4 });
    up(3, 'demandee', 0);

    // un devis expiré et un refusé dans l'historique pour la liste
    const old = db.devis.filter((x) => x.orgId === org.id && x.status === 'signe').slice(0, 2);
    if (old[0]) {
      const exp: Devis = { ...old[0], id: `${old[0].id}-x`, ref: `${old[0].ref}-B`, status: 'expire', signature: undefined };
      db.devis.push(exp);
    }
    if (old[1]) {
      const ref2: Devis = { ...old[1], id: `${old[1].id}-y`, ref: `${old[1].ref}-B`, status: 'refuse', signature: undefined, refusal: 'Volume finalement pris en charge par le locataire' };
      db.devis.push(ref2);
    }

    /* ---- abonnement ---- */
    const curK = monthKey(today);
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const ab: Abonnement = {
      orgId: org.id,
      plan: org.plan,
      monthlyHt: plan.monthly,
      included: { passages: plan.passages, m3: plan.m3 },
      period: { start: iso(start), end: iso(end) },
      used: usage[curK] ?? { passages: 0, m3: 0 },
      history: Array.from({ length: 12 }, (_, i) => {
        const d = new Date(today.getFullYear(), today.getMonth() - 11 + i, 1);
        const u = usage[monthKey(d)] ?? { passages: 0, m3: 0 };
        return { month: monthKey(d), passages: u.passages, m3: u.m3, overageHt: org.plan === 'ponctuel' ? 0 : monthlyBill(org.plan, u.m3).ht - plan.monthly };
      }),
    };
    // abonnés : forcer une consommation visible ce mois-ci (alerte à 80 %)
    if (org.plan !== 'ponctuel' && ab.used.m3 === 0) ab.used = { passages: Math.max(0, plan.passages - 1), m3: r1(plan.m3 * 0.82) };
    db.abonnements.push(ab);

    /* ---- messages ---- */
    const admin = spec.users[0];
    const userName = `${admin[0]} ${admin[1]}`;
    const msgs: Message[] = [];
    const push = (threadId: string, author: Message['author'], text: string, d: Date, read = true, attachments?: string[]) =>
      msgs.push({ id: `${threadId}-m${msgs.length}`, threadId, author, userName: author === 'client' ? userName : author === 'equipe' ? 'Noa · Express Débarras' : '', text, at: iso(d), read, attachments });
    push(general.id, 'equipe', `Bienvenue dans votre espace pro, ${admin[0]} ! Une question ? Écrivez-nous ici.`, addDays(today, -60));
    push(general.id, 'client', 'Merci ! Pouvez-vous nous envoyer l’attestation d’assurance ?', addDays(today, -59));
    push(general.id, 'equipe', 'C’est fait, elle est dans Documents.', addDays(today, -59));
    const nt = db.threads.find((t) => t.interventionId === next.id)!;
    push(nt.id, 'client', 'Le gardien sera présent à partir de 8 h 30.', addDays(today, -1), true, ['photo-entree']);
    push(nt.id, 'equipe', TEAM_REPLIES[0], addDays(today, -1));
    const st = db.threads.find((t) => t.interventionId === toSign.id)!;
    push(st.id, 'client', 'Voici les photos du logement.', addDays(today, -1), true, ['photo-sejour', 'photo-chambre']);
    push(st.id, 'equipe', TEAM_REPLIES[1], addDays(today, -1));
    push(st.id, 'equipe', 'Votre devis est disponible, il vous reste à le signer.', addDays(today, -0.9), false);
    db.messages.push(...msgs);

    /* ---- notifications ---- */
    const notifs: Omit<Notification, 'id' | 'orgId'>[] = [
      { kind: 'devis', title: 'Devis à signer', body: `${toSign.ref} · ${(toSign.ht / 100).toLocaleString('fr-FR')} € HT`, href: `/pro/devis/${toSign.quoteId ?? ''}`, at: iso(addDays(today, -0.9)), read: false },
      { kind: 'statut', title: 'Intervention planifiée', body: `${next.ref} · dans 2 jours`, href: `/pro/interventions?id=${next.id}`, at: iso(addDays(today, -1.5)), read: false },
      { kind: 'message', title: 'Nouveau message', body: 'Votre devis est disponible, il vous reste à le signer.', href: `/pro/messages?t=${st.id}`, at: iso(addDays(today, -0.9)), read: false },
      { kind: 'facture', title: 'Facture émise', body: factures[factures.length - 1]?.number ?? '', href: `/pro/factures`, at: iso(addDays(today, -5)), read: true },
      { kind: 'rapport', title: 'Rapport de tri disponible', body: 'Consultez la répartition par filière.', href: '/pro/documents', at: iso(addDays(today, -6)), read: true },
    ];
    notifs.forEach((x, i) => db.notifications.push({ ...x, id: `${org.id}-n${i}`, orgId: org.id }));

    /* ---- partenaires (agence) ---- */
    if (org.kind === 'agence') {
      const clients = ['Famille Lemarchand', 'M. Duclos', 'Mme Ferrand', 'SCI Les Tilleuls', 'M. et Mme Roussel', 'Mme Hamel', 'M. Perrier'];
      clients.forEach((c, i) => {
        const d = addDays(today, -Math.round(20 + i * 45 + R() * 20));
        const jobs = 1 + Math.floor(R() * 3);
        const revenue = jobs * Math.round(between(30000, 120000));
        const r: Referral = { id: `${org.id}-ref${i}`, orgId: org.id, client: c, date: iso(d), jobs, revenueHt: revenue, commission: Math.round(revenue * 0.05), paid: i > 1 };
        db.referrals.push(r);
      });
    }
  }

  return db;
}
