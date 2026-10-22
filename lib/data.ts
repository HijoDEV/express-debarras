// Source de vérité : prix, volumes, contenus. Toute la logique de prix lit ce fichier.

export const BRAND = {
  name: 'Express Débarras',
  slogan: 'La déchetterie vient à vous.',
  city: 'Rouen',
  zone: 'Rouen et les 71 communes de la Métropole',
  phone: '02 35 00 00 00',
  whatsapp: '06 00 00 00 00',
  email: 'bonjour@express-debarras.fr',
};

export const PROMISES = [
  'Prix fixe sur photos en moins d’1 h',
  'Intervention sous 48 h',
  'Rapport de tri remis à chaque chantier',
  '60 % du volume valorisé',
  'Rachat des objets de valeur déduit de la facture',
];

/* ---------- Express Objet ---------- */
export const EXPRESS_OBJET = {
  maxObjects: 5,
  maxVolume: 3,
  firstTournee: 49,
  first48h: 69,
  extra: 19,
  tourneeDays: 'mardi et jeudi après-midi',
};

/* ---------- Forfaits au volume (TTC) ---------- */
export type FormulaId = 'objet' | 'mini' | 'piece' | 'logement' | 'maison' | 'audela';

export const FORFAITS = [
  { id: 'mini', name: 'Express Mini', maxVolume: 3, price: 149, example: 'Quelques meubles, un coin de garage' },
  { id: 'piece', name: 'Express Pièce', maxVolume: 8, price: 349, example: 'Une cave, une chambre, un box' },
  { id: 'logement', name: 'Express Logement', maxVolume: 20, price: 790, example: 'Un T2, un studio meublé', popular: true },
  { id: 'maison', name: 'Express Maison', maxVolume: 40, price: 1490, example: 'Un T3, une maison' },
] as const;

export const AU_DELA = { id: 'audela', name: 'Au-delà de 40 m³', pricePerM3: 36, floor: 1490 } as const;

export const FORMULA_NAMES: Record<FormulaId, string> = {
  objet: 'Express Objet',
  mini: 'Express Mini',
  piece: 'Express Pièce',
  logement: 'Express Logement',
  maison: 'Express Maison',
  audela: 'Express Sur-mesure',
};

/* ---------- Offres pros (HT) ---------- */
export const PRO_OFFERS = [
  { id: 'ponctuel', name: 'Débarras ponctuel', price: '45 € / m³', detail: 'Minimum 190 € HT', features: ['Devis sur photos en 1 h', 'Intervention sous 48 h', 'Bordereau de traçabilité'] },
  { id: 'essentiel', name: 'Pro Essentiel', price: '129 € / mois', detail: '1 passage · 3 m³ inclus', features: ['Créneau fixe chaque mois', 'Facture mensuelle unique', 'Bordereau de traçabilité'] },
  { id: 'plus', name: 'Pro Plus', price: '299 € / mois', detail: '2 passages · 8 m³ inclus', features: ['Deux passages planifiés', 'Interlocuteur dédié', 'Bordereau de traçabilité'], popular: true },
  { id: 'box', name: 'Forfait Box', price: '220 €', detail: 'Box ou réserve ≤ 9 m²', features: ['Vidage complet', 'Coup de balai', 'Bordereau de traçabilité'] },
] as const;

export const PRO_PONCTUEL = { perM3: 45, minimum: 190 };

/* ---------- Options ---------- */
export const OPTIONS = {
  floorFee: 15, // par étage sans ascenseur, à partir du 2e
  floorFrom: 2,
  longCarry: 30, // portage > 30 m
  kmFree: 30,
  kmFee: 1, // € / km au-delà de 30 km
  urgencePct: 20,
  samediPct: 15,
  dismantle: 20, // € / meuble
  cleaning: 4, // € / m²
};

/* ---------- Packs ---------- */
export type PackId = 'essentiel' | 'serenite' | 'cles';
export const PACKS: {
  id: PackId;
  name: string;
  price: number;
  tagline: string;
  features: string[];
  badge?: string;
}[] = [
  {
    id: 'essentiel',
    name: 'Essentiel',
    price: 0,
    tagline: 'Inclus dans chaque formule',
    features: ['Débarras complet', 'Tri par filière', 'Dépôt en déchetterie', 'Coup de balai', 'Rapport de tri et photos'],
  },
  {
    id: 'serenite',
    name: 'Sérénité',
    price: 190,
    tagline: 'Pour ne rien perdre',
    features: ['Tout l’Essentiel', 'Carton souvenirs et papiers', 'Démontage de tous les meubles', 'Protection des sols et des murs'],
  },
  {
    id: 'cles',
    name: 'Clés en main',
    price: 390,
    tagline: 'Vous n’avez pas à vous déplacer',
    badge: 'Idéal pour les successions',
    features: [
      'Tout le pack Sérénité',
      'Nettoyage jusqu’à 60 m²',
      'Clés remises au notaire ou à l’agence',
      'Point visio pendant le tri',
      'Attestation de logement vide',
    ],
  },
];

/* ---------- Volumes ---------- */
export type IllusId =
  | 'sofa'
  | 'sofa2'
  | 'wardrobe'
  | 'bed'
  | 'table'
  | 'buffet'
  | 'shelf'
  | 'single'
  | 'desk'
  | 'fridge'
  | 'mattress'
  | 'armchair'
  | 'dresser'
  | 'washer'
  | 'stove'
  | 'bike'
  | 'tv'
  | 'box'
  | 'bag'
  | 'lamp';

export const ITEMS: { id: string; name: string; volume: number; illus: IllusId }[] = [
  { id: 'canape3', name: 'Canapé 3 places', volume: 2, illus: 'sofa' },
  { id: 'armoire3', name: 'Armoire 3 portes', volume: 2, illus: 'wardrobe' },
  { id: 'canape2', name: 'Canapé 2 places', volume: 1.5, illus: 'sofa2' },
  { id: 'armoire2', name: 'Armoire 2 portes', volume: 1.5, illus: 'wardrobe' },
  { id: 'litdouble', name: 'Lit double + sommier', volume: 1.5, illus: 'bed' },
  { id: 'table4', name: 'Table + 4 chaises', volume: 1.5, illus: 'table' },
  { id: 'buffet', name: 'Buffet', volume: 1, illus: 'buffet' },
  { id: 'biblio', name: 'Bibliothèque', volume: 1, illus: 'shelf' },
  { id: 'litsimple', name: 'Lit simple', volume: 0.8, illus: 'single' },
  { id: 'bureau', name: 'Bureau', volume: 0.8, illus: 'desk' },
  { id: 'frigo', name: 'Réfrigérateur', volume: 0.8, illus: 'fridge' },
  { id: 'matelas', name: 'Matelas', volume: 0.6, illus: 'mattress' },
  { id: 'fauteuil', name: 'Fauteuil', volume: 0.5, illus: 'armchair' },
  { id: 'commode', name: 'Commode', volume: 0.5, illus: 'dresser' },
  { id: 'lavelinge', name: 'Lave-linge', volume: 0.5, illus: 'washer' },
  { id: 'cuisiniere', name: 'Cuisinière', volume: 0.5, illus: 'stove' },
  { id: 'velo', name: 'Vélo', volume: 0.5, illus: 'bike' },
  { id: 'tv', name: 'Télévision', volume: 0.2, illus: 'tv' },
  { id: 'carton', name: 'Carton', volume: 0.1, illus: 'box' },
  { id: 'sac', name: 'Sac de 100 L', volume: 0.1, illus: 'bag' },
];

export const ROOMS: { id: string; name: string; volume: number }[] = [
  { id: 'cave', name: 'Cave ou box 9 m²', volume: 5 },
  { id: 'chambre', name: 'Chambre', volume: 6 },
  { id: 'sejour', name: 'Séjour', volume: 10 },
  { id: 't2', name: 'T2', volume: 15 },
  { id: 't3', name: 'T3', volume: 22 },
  { id: 'maison', name: 'Maison 100 m²', volume: 35 },
];

/* ---------- Situations ---------- */
export type SituationId = 'meuble' | 'objets' | 'cave' | 'logement' | 'local';
export const SITUATIONS: { id: SituationId; label: string; hint: string; mode: 'items' | 'rooms' }[] = [
  { id: 'meuble', label: 'Un seul meuble', hint: 'Dès 49 €', mode: 'items' },
  { id: 'objets', label: 'Quelques objets', hint: 'Jusqu’à 3 m³', mode: 'items' },
  { id: 'cave', label: 'Cave, garage, grenier', hint: '≈ 5 m³', mode: 'rooms' },
  { id: 'logement', label: 'Un logement entier', hint: 'T2, T3, maison', mode: 'rooms' },
  { id: 'local', label: 'Un local pro', hint: 'Bureaux, commerce', mode: 'rooms' },
];

export const DELAYS = [
  { id: 'tournee', label: 'Tournée sous 7 j', hint: 'Mardi ou jeudi après-midi · Express Objet' },
  { id: '48h', label: 'Sous 48 h', hint: 'Délai standard' },
  { id: 'urgence', label: 'Urgence 24 h', hint: '+ 20 % sur la formule' },
  { id: 'samedi', label: 'Samedi', hint: '+ 15 % sur la formule' },
] as const;

/* ---------- Codes postaux ---------- */
// Communes de la Métropole Rouen Normandie (codes postaux principaux).
export const METROPOLE_CP = [
  '76000', '76100', '76113', '76116', '76120', '76130', '76140', '76150', '76160', '76230', '76240', '76250',
  '76300', '76320', '76350', '76360', '76380', '76410', '76420', '76480', '76500', '76520', '76530', '76550',
  '76560', '76580', '76590', '76650', '76690', '76700', '76710', '76750', '76760', '76770', '76800', '76840',
  '76850', '76870', '76920', '76960',
];

// Distances approximatives depuis Rouen (km) pour les codes postaux hors Métropole les plus fréquents.
export const CP_DISTANCES: Record<string, { city: string; km: number }> = {
  '76190': { city: 'Yvetot', km: 37 },
  '76200': { city: 'Dieppe', km: 64 },
  '76400': { city: 'Fécamp', km: 72 },
  '76600': { city: 'Le Havre', km: 88 },
  '76620': { city: 'Le Havre', km: 88 },
  '76290': { city: 'Montivilliers', km: 82 },
  '76170': { city: 'Lillebonne', km: 55 },
  '76210': { city: 'Bolbec', km: 60 },
  '76270': { city: 'Neufchâtel-en-Bray', km: 48 },
  '76220': { city: 'Gournay-en-Bray', km: 50 },
  '76440': { city: 'Forges-les-Eaux', km: 42 },
  '76680': { city: 'Saint-Saëns', km: 32 },
  '27000': { city: 'Évreux', km: 55 },
  '27100': { city: 'Val-de-Reuil', km: 28 },
  '27400': { city: 'Louviers', km: 32 },
  '27200': { city: 'Vernon', km: 62 },
  '27500': { city: 'Pont-Audemer', km: 52 },
  '27300': { city: 'Bernay', km: 62 },
  '27700': { city: 'Les Andelys', km: 40 },
};

/* ---------- Tri ---------- */
export const FILIERES = [
  { name: 'Réemploi', pct: 15, color: 'tri' },
  { name: 'Meubles', pct: 15, color: 'tri' },
  { name: 'Métaux', pct: 10, color: 'tri' },
  { name: 'Revente', pct: 8, color: 'tri' },
  { name: 'Électroménager', pct: 7, color: 'tri' },
  { name: 'Textiles et livres', pct: 5, color: 'tri' },
  { name: 'Tout-venant', pct: 40, color: 'beton' },
];

/* ---------- Défilé timbres ---------- */
export const STAMPS: { name: string; illus: IllusId; tone: string }[] = [
  { name: 'Meuble seul', illus: 'armchair', tone: '#FFE7A3' },
  { name: 'Cave', illus: 'box', tone: '#E8E2D2' },
  { name: 'Grenier', illus: 'lamp', tone: '#F3D9B8' },
  { name: 'Garage', illus: 'bike', tone: '#D8E6EF' },
  { name: 'Box', illus: 'bag', tone: '#E3F4EC' },
  { name: 'Appartement', illus: 'sofa', tone: '#FFE7A3' },
  { name: 'Maison', illus: 'wardrobe', tone: '#F0E4D7' },
  { name: 'Succession', illus: 'dresser', tone: '#E8E2D2' },
  { name: 'Bureaux', illus: 'desk', tone: '#D8E6EF' },
  { name: 'Commerce', illus: 'shelf', tone: '#F3D9B8' },
  { name: 'Fin de chantier', illus: 'table', tone: '#E3F4EC' },
  { name: 'Électroménager', illus: 'fridge', tone: '#FFE7A3' },
];

/* ---------- Avis (EXEMPLES de démonstration) ---------- */
export const SAMPLE_REVIEWS = [
  { name: 'Claire B.', city: 'Rouen', text: 'Trois photos envoyées le soir, prix reçu avant 9 h. La cave était vide le lendemain midi.' },
  { name: 'Mehdi A.', city: 'Sotteville', text: 'Un seul canapé à sortir du 3e sans ascenseur. Prix annoncé, prix payé. Rien à redire.' },
  { name: 'Josiane L.', city: 'Bois-Guillaume', text: 'Pour la maison de ma mère, ils ont mis de côté les photos et les papiers. Beaucoup de tact.' },
  { name: 'Thomas R.', city: 'Mont-Saint-Aignan', text: 'Garage plein depuis dix ans. Le rapport de tri m’a surpris : presque tout est reparti ailleurs.' },
  { name: 'Inès K.', city: 'Petit-Quevilly', text: 'Déménagement à Lyon, je ne pouvais pas rester. Clés remises à l’agence, attestation reçue.' },
  { name: 'Patrick D.', city: 'Elbeuf', text: 'Le vieux frigo et la gazinière partis en 20 minutes. Ponctuels et polis.' },
  { name: 'Sophie M.', city: 'Rouen rive gauche', text: 'Mon locataire avait tout laissé. Logement vide et nettoyé en deux jours.' },
  { name: 'Hugo P.', city: 'Darnétal', text: 'Le simulateur tombait juste à 10 € près. Très pratique pour décider vite.' },
  { name: 'Nadia F.', city: 'Grand-Quevilly', text: 'Ils ont racheté une commode ancienne, c’est venu en moins sur la facture.' },
  { name: 'Laurent G.', city: 'Bihorel', text: 'Fermeture de nos bureaux : bordereau de traçabilité fourni, notre comptable est content.' },
];

/* ---------- FAQ ---------- */
export const FAQ = [
  {
    q: 'Je n’ai qu’un seul meuble, vous venez quand même ?',
    a: 'Oui. Express Objet démarre à 49 € en tournée (mardi ou jeudi après-midi), ou 69 € sous 48 h. Chaque objet en plus : 19 €, jusqu’à 5 objets.',
  },
  {
    q: 'Comment estimez-vous le volume à distance ?',
    a: 'Avec vos photos. Une vue large par pièce et un gros plan des meubles suffisent. Nous comparons à notre grille de volumes et vous envoyons un prix fixe en moins d’1 h.',
  },
  {
    q: 'Je ne peux pas être sur place.',
    a: 'Aucun souci. Vous nous confiez les clés, nous faisons un point visio pendant le tri et vous recevez les photos avant / après. Le pack Clés en main remet ensuite les clés au notaire ou à l’agence.',
  },
  {
    q: 'Que deviennent mes affaires ?',
    a: 'Elles sont triées sur place : réemploi associatif, revente, métaux, électroménager, textiles. Nous visons 60 % du volume valorisé. Vous recevez un rapport de tri détaillé.',
  },
  {
    q: 'Et si vous trouvez des objets de valeur ?',
    a: 'Nous vous les signalons. Si vous le souhaitez, nous les rachetons et le montant est déduit de votre facture. Papiers et souvenirs sont mis de côté.',
  },
  {
    q: 'C’est plus cher que la déchetterie gratuite.',
    a: 'La déchetterie est gratuite, pas le reste : location d’utilitaire, carburant, allers-retours, une journée perdue et le dos qui souffre. Nous faisons tout en quelques heures, au prix annoncé.',
  },
  {
    q: 'Vous intervenez où ?',
    a: 'À Rouen et dans les 71 communes de la Métropole, sans supplément. Au-delà de 30 km de Rouen : 1 € par kilomètre.',
  },
  {
    q: 'Que ne prenez-vous pas ?',
    a: 'L’amiante, les produits chimiques industriels et les déchets médicaux. Nous vous orientons vers les filières agréées.',
  },
];

/* ---------- Pages situation ---------- */
export const SITUATION_PAGES: Record<
  string,
  {
    slug: string;
    situation: SituationId;
    title: string;
    lead: string;
    label: string;
    formula: string;
    price: string;
    points: string[];
    faq: { q: string; a: string }[];
    prefill?: { items?: Record<string, number>; rooms?: Record<string, number>; pack?: PackId };
  }
> = {
  'meuble-seul': {
    slug: 'meuble-seul',
    situation: 'meuble',
    label: 'Un seul meuble',
    title: 'Un meuble. Un prix. Point.',
    lead: 'Un canapé, une armoire, un vieux frigo ? Nous passons le chercher, même au 5e sans ascenseur.',
    formula: 'Express Objet',
    price: 'dès 49 €',
    points: ['49 € en tournée mardi ou jeudi', '69 € sous 48 h', '+ 19 € par objet, jusqu’à 5'],
    faq: [FAQ[0], FAQ[5]],
    prefill: { items: { canape3: 1 } },
  },
  'cave-garage-grenier': {
    slug: 'cave-garage-grenier',
    situation: 'cave',
    label: 'Cave, garage, grenier',
    title: 'Votre cave déborde ? Elle sera vide jeudi.',
    lead: 'Cartons, vélos, vieux meubles : on trie, on charge, on balaie. Vous récupérez votre espace.',
    formula: 'Express Pièce',
    price: '349 €',
    points: ['Jusqu’à 8 m³', 'Tri par filière', 'Coup de balai compris'],
    faq: [FAQ[1], FAQ[3]],
    prefill: { rooms: { cave: 1 } },
  },
  demenagement: {
    slug: 'demenagement',
    situation: 'logement',
    label: 'Déménagement',
    title: 'Vous partez léger. On garde le reste.',
    lead: 'Ce qui ne rentre pas dans le camion de déménagement part avec nous, la veille ou le jour même.',
    formula: 'Express Logement',
    price: '790 €',
    points: ['Jusqu’à 20 m³', 'Intervention sous 48 h', 'Samedi possible (+ 15 %)'],
    faq: [FAQ[1], FAQ[6]],
    prefill: { rooms: { t2: 1 } },
  },
  succession: {
    slug: 'succession',
    situation: 'logement',
    label: 'Succession',
    title: 'Nous prenons soin de ce qui compte.',
    lead: 'Vider le logement d’un proche est un moment difficile. Nous mettons de côté papiers et souvenirs, et vous tenons au courant à chaque étape, même à distance.',
    formula: 'Express Logement + Clés en main',
    price: '1 180 €',
    points: ['Carton souvenirs et papiers', 'Point visio pendant le tri', 'Clés remises au notaire', 'Attestation de logement vide'],
    faq: [FAQ[2], FAQ[4]],
    prefill: { rooms: { t2: 1 }, pack: 'cles' },
  },
  'local-pro': {
    slug: 'local-pro',
    situation: 'local',
    label: 'Local professionnel',
    title: 'Vos bureaux vides, votre bail rendu.',
    lead: 'Mobilier, archives, matériel : débarras sur créneau, bordereau de traçabilité et facture HT.',
    formula: 'Débarras ponctuel pro',
    price: '45 € HT / m³',
    points: ['Minimum 190 € HT', 'Bordereau de traçabilité', 'Abonnements dès 129 € HT / mois'],
    faq: [FAQ[6], FAQ[7]],
    prefill: { rooms: { sejour: 1 } },
  },
};

export const LIST_SITUATIONS: {
  label: string;
  volume: number;
  solution: string;
  input: { items?: Record<string, number>; rooms?: Record<string, number>; delay?: 'tournee' | '48h' | 'urgence' | 'samedi'; pack?: PackId };
  pro?: boolean;
}[] = [
  { label: 'J’ai un seul meuble', volume: 2, solution: 'Express Objet en tournée', input: { items: { canape3: 1 }, delay: 'tournee' } },
  { label: 'Ma cave déborde', volume: 5, solution: 'Express Pièce', input: { rooms: { cave: 1 } } },
  { label: 'Je déménage', volume: 15, solution: 'Express Logement', input: { rooms: { t2: 1 } } },
  { label: 'J’hérite et je vis loin', volume: 22, solution: 'Express Maison + Clés en main', input: { rooms: { t3: 1 }, pack: 'cles' } },
  { label: 'Mon locataire est parti', volume: 15, solution: 'Express Logement + Clés en main', input: { rooms: { t2: 1 }, pack: 'cles' } },
  { label: 'Je ferme mes bureaux', volume: 20, solution: 'Débarras pro · 45 € HT / m³', input: { rooms: { sejour: 2 } }, pro: true },
  { label: 'C’est urgent', volume: 5, solution: 'Express Pièce · Urgence 24 h', input: { rooms: { cave: 1 }, delay: 'urgence' } },
];

export const TEAM = [
  { name: 'Max', role: 'Président', focus: 'Commercial et partenariats', text: 'Votre premier contact. Il chiffre vos photos, répond sur WhatsApp et construit nos partenariats avec les associations, agences et notaires.' },
  { name: 'Noa', role: 'Directeur général', focus: 'Opérations et logistique', text: 'Il organise les tournées, encadre les chantiers et veille à ce que chaque objet parte dans la bonne filière.' },
];
