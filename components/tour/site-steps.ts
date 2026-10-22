import { Building2, Calculator, ShieldCheck, Sparkles } from 'lucide-react';

export const SITE_CHAPTERS = [
  { title: 'Découvrir', icon: Sparkles, color: '#FFC21A' },
  { title: 'Estimer', icon: Calculator, color: '#2F9E6E' },
  { title: 'Faire confiance', icon: ShieldCheck, color: '#5B8DEF' },
  { title: 'Professionnels', icon: Building2, color: '#E8664B' },
] as const;

export type SiteStep = {
  id: string;
  chapter: number;
  path: '/' | '/simulateur' | '/pros';
  target: string;
  title: string;
  text: string;
  essential?: boolean;
  zoom?: boolean;
  /** étape sautée si la zone n’existe pas (ex. simulateur déjà commencé) */
  optional?: boolean;
  /** démonstration : le curseur clique un élément dans la zone */
  click?: { selector: string; text?: string };
};

export const SITE_STEPS: SiteStep[] = [
  {
    id: 'hero-cta',
    chapter: 0,
    path: '/',
    target: 'hero-cta',
    title: 'Votre prix gratuit, en 2 minutes',
    text: 'Deux portes d’entrée : le simulateur, ou une simple photo envoyée sur WhatsApp. Prix fixe en moins d’une heure.',
    essential: true,
  },
  {
    id: 'hero-start',
    chapter: 0,
    path: '/',
    target: 'hero-start',
    title: 'Commencez par votre situation',
    text: 'Cave, appartement, succession, local pro… Un clic et le simulateur s’ouvre déjà réglé.',
  },
  {
    id: 'hero-phone',
    chapter: 0,
    path: '/',
    target: 'hero-phone',
    title: 'Toute l’expérience dans le téléphone',
    text: 'Photos, devis, créneau, suivi du camion : la conversation complète d’un client, de la première photo au rapport de tri.',
  },
  {
    id: 'situations',
    chapter: 0,
    path: '/',
    target: 'situations',
    title: 'Une méthode par situation',
    text: 'Chaque cas a son délai, sa méthode et son prix indicatif. Survolez une situation pour la voir en détail.',
  },
  {
    id: 'sim-steps',
    chapter: 1,
    path: '/simulateur',
    target: 'sim-steps',
    title: 'Cinq étapes, à votre rythme',
    text: 'Situation, contenu, accès, services, prix. Vos réponses sont gardées : vous pouvez revenir plus tard.',
  },
  {
    id: 'sim-situation',
    chapter: 1,
    path: '/simulateur',
    target: 'sim-situation',
    title: 'Un clic pour démarrer',
    text: 'Choisissons « Cave, garage, grenier » pour l’exemple…',
    optional: true,
    essential: true,
    click: { selector: '[role="radio"], button', text: 'Cave' },
  },
  {
    id: 'sim-stage',
    chapter: 1,
    path: '/simulateur',
    target: 'sim-stage',
    title: 'Le camion se remplit sous vos yeux',
    text: 'Chaque objet ajouté se charge dans notre camion floqué, et le prix se recalcule en direct. Il devient ferme dès que nous voyons vos photos.',
    essential: true,
  },
  {
    id: 'sortreport',
    chapter: 2,
    path: '/',
    target: 'sortreport',
    title: 'Chaque objet trouve sa filière',
    text: 'Après chaque débarras, vous recevez un rapport de tri : réemploi, revente, recyclage. La déchetterie en dernier recours.',
  },
  {
    id: 'pricing',
    chapter: 2,
    path: '/',
    target: 'pricing',
    title: 'Des prix fixes, écrits à l’avance',
    text: 'Particuliers ou professionnels : basculez pour comparer les forfaits. Aucune surprise le jour J.',
    essential: true,
  },
  {
    id: 'guarantee',
    chapter: 2,
    path: '/',
    target: 'guarantee',
    title: 'Le prix annoncé est le prix payé',
    text: 'Le devis validé sur photos ne bouge plus, sauf si le contenu change réellement sur place.',
  },
  {
    id: 'pros-offers',
    chapter: 3,
    path: '/pros',
    target: 'pros-offers',
    title: 'Une offre pour chaque professionnel',
    text: 'Ponctuel, abonnement mensuel ou forfait Box : tarifs HT et une seule facture.',
  },
  {
    id: 'pros-cta',
    chapter: 3,
    path: '/pros',
    target: 'pros-cta',
    title: 'Un espace client dédié aux pros',
    text: 'Suivi du camion en direct, devis signés en ligne, factures et bordereaux : tout est dans l’espace pro, avec sa propre visite guidée.',
    essential: true,
    zoom: false,
  },
  {
    id: 'pros-form',
    chapter: 3,
    path: '/pros',
    target: 'pros-form',
    title: 'Demandez votre contrat',
    text: 'Quelques informations sur vos besoins : nous revenons vers vous avec une proposition chiffrée.',
  },
];
