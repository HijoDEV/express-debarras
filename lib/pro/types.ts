export type ID = string;
export type ISO = string;
export type Cents = number;

export type Plan = 'ponctuel' | 'essentiel' | 'plus';
export type Role = 'admin' | 'gestionnaire' | 'comptable';
export type OrgKind = 'agence' | 'stockage' | 'pme';

export type Status =
  | 'demandee'
  | 'devis_envoye'
  | 'devis_signe'
  | 'planifiee'
  | 'en_route'
  | 'en_cours'
  | 'terminee'
  | 'rapport_dispo'
  | 'annulee';

export interface Organisation {
  id: ID;
  name: string;
  kind: OrgKind;
  tagline: string;
  siret: string;
  billingAddress: string;
  plan: Plan;
  subscriptionStart: ISO;
  referralCode?: string;
}

export interface Utilisateur {
  id: ID;
  orgId: ID;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  avatarSeed: number;
  invited?: boolean;
}

export type SiteKind = 'logement' | 'entrepot' | 'box' | 'bureau';
export interface Site {
  id: ID;
  orgId: ID;
  label: string;
  kind: SiteKind;
  address: string;
  postalCode: string;
  city: string;
  floor: number;
  elevator: boolean;
  accessCode?: string;
  onSiteContact?: string;
  keys: 'agence' | 'gardien' | 'sur-place';
  distanceKm: number;
  boxes?: string[];
  /** coordonnées sur la mini-carte (0..100) */
  map: { x: number; y: number };
}

export type Delay = '48h' | 'urgence' | 'samedi';

export interface InterventionContent {
  mode: 'volume' | 'objets' | 'box';
  volume: number;
  items?: Record<string, number>;
  boxes?: string[];
  deee: boolean;
  archives: boolean;
  mobilierBureau: boolean;
  photos: number;
}

export interface Ligne {
  label: string;
  qty: number;
  unit: Cents;
  total: Cents;
  kind: 'base' | 'majoration' | 'option' | 'deduction';
}

export interface Intervention {
  id: ID;
  ref: string;
  orgId: ID;
  siteId: ID;
  status: Status;
  history: { status: Status; at: ISO; by: 'client' | 'equipe' | 'systeme'; note?: string }[];
  content: InterventionContent;
  delay: Delay;
  slot?: { date: ISO; window: string };
  internalRef?: string;
  purchaseOrder?: string;
  lines: Ligne[];
  ht: Cents;
  tva: Cents;
  ttc: Cents;
  quoteId?: ID;
  invoiceId?: ID;
  reportId?: ID;
  slipId?: ID;
  threadId: ID;
  createdAt: ISO;
  rescheduleRequest?: ISO;
}

export interface Devis {
  id: ID;
  ref: string;
  orgId: ID;
  interventionId: ID;
  lines: Ligne[];
  ht: Cents;
  tva: Cents;
  ttc: Cents;
  status: 'a_signer' | 'signe' | 'refuse' | 'expire';
  issuedAt: ISO;
  validUntil: ISO;
  signature?: { dataUrl: string; name: string; at: ISO };
  refusal?: string;
}

export interface Facture {
  id: ID;
  number: string;
  orgId: ID;
  interventionId?: ID;
  label: string;
  lines: Ligne[];
  ht: Cents;
  tva: Cents;
  ttc: Cents;
  status: 'payee' | 'a_payer' | 'en_retard';
  issuedAt: ISO;
  dueAt: ISO;
  paidAt?: ISO;
}

export interface Filiere {
  name: string;
  m3: number;
  valorised: boolean;
}

export interface RapportTri {
  id: ID;
  orgId: ID;
  interventionId: ID;
  volume: number;
  valorisedPct: number;
  filieres: Filiere[];
  date: ISO;
}

export interface Bordereau {
  id: ID;
  number: string;
  orgId: ID;
  interventionId: ID;
  producteur: string;
  collecteur: string;
  nature: string[];
  volume: number;
  destination: string[];
  date: ISO;
}

export interface Thread {
  id: ID;
  orgId: ID;
  interventionId?: ID;
  title: string;
}

export interface Message {
  id: ID;
  threadId: ID;
  author: 'client' | 'equipe';
  userName: string;
  text: string;
  attachments?: string[];
  at: ISO;
  read: boolean;
}

export interface Notification {
  id: ID;
  orgId: ID;
  kind: 'statut' | 'devis' | 'facture' | 'message' | 'rapport';
  title: string;
  body: string;
  href: string;
  at: ISO;
  read: boolean;
}

export interface Abonnement {
  orgId: ID;
  plan: Plan;
  monthlyHt: Cents;
  included: { passages: number; m3: number };
  period: { start: ISO; end: ISO };
  used: { passages: number; m3: number };
  history: { month: string; passages: number; m3: number; overageHt: Cents }[];
}

export interface Referral {
  id: ID;
  orgId: ID;
  client: string;
  date: ISO;
  jobs: number;
  revenueHt: Cents;
  commission: Cents;
  paid: boolean;
}

export interface NotifPrefs {
  [event: string]: { email: boolean; sms: boolean };
}

export interface ProDB {
  version: number;
  seededAt: ISO;
  orgs: Organisation[];
  users: Utilisateur[];
  sites: Site[];
  interventions: Intervention[];
  devis: Devis[];
  factures: Facture[];
  rapports: RapportTri[];
  bordereaux: Bordereau[];
  threads: Thread[];
  messages: Message[];
  notifications: Notification[];
  abonnements: Abonnement[];
  referrals: Referral[];
}
