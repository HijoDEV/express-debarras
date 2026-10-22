import { Building2, FileSignature, LayoutDashboard, Truck } from 'lucide-react';
import type { Page } from '@/lib/pro/permissions';
import type { Organisation } from '@/lib/pro/types';

export const CHAPTERS = [
  { title: 'Piloter', icon: LayoutDashboard, color: '#FFC21A' },
  { title: 'Commander et suivre', icon: Truck, color: '#2F9E6E' },
  { title: 'Valider et payer', icon: FileSignature, color: '#5B8DEF' },
  { title: 'Votre compte', icon: Building2, color: '#E8664B' },
] as const;

export type TourCtx = { org: Organisation; nextId: string | null };

export type TourStep = {
  id: string;
  chapter: number;
  /** page requise (permissions) */
  page: Page;
  /** null : on reste sur la page courante (éléments de la barre du haut) */
  path: string | null | ((c: TourCtx) => string | null);
  target: string;
  title: string;
  text: string | ((c: TourCtx) => string);
  kbd?: string;
  essential?: boolean;
  zoom?: boolean;
  agenceOnly?: boolean;
};

export const STEPS: TourStep[] = [
  {
    id: 'next',
    chapter: 0,
    page: 'dashboard',
    path: '/pro',
    target: 'next',
    title: 'Votre prochaine intervention',
    text: 'Date, créneau, équipe et compte à rebours. Tout ce qu’il faut pour prévenir le locataire ou le gardien.',
    essential: true,
  },
  {
    id: 'kpis',
    chapter: 0,
    page: 'dashboard',
    path: '/pro',
    target: 'kpis',
    title: 'Le mois en un coup d’œil',
    text: 'Interventions, m³ évacués, part valorisée et dépenses, comparés au mois précédent. Les chiffres s’animent à chaque mise à jour.',
    essential: true,
  },
  {
    id: 'abo',
    chapter: 0,
    page: 'dashboard',
    path: '/pro',
    target: 'abo',
    title: 'Votre forfait sous contrôle',
    text: 'Passages et m³ inclus déjà consommés ce mois-ci. Une alerte s’affiche dès 80 %.',
  },
  {
    id: 'chart',
    chapter: 0,
    page: 'dashboard',
    path: '/pro',
    target: 'chart',
    title: '12 mois de traçabilité',
    text: 'Volume valorisé et tout-venant, mois par mois. De quoi nourrir votre bilan RSE sans tableur.',
  },
  {
    id: 'new',
    chapter: 1,
    page: 'demandes',
    path: '/pro',
    target: 'new',
    title: 'Commander en 30 secondes',
    text: 'Le bouton jaune est toujours là, sur toutes les pages. Au clavier, une seule touche suffit.',
    kbd: 'N',
    essential: true,
    zoom: false,
  },
  {
    id: 'nd-steps',
    chapter: 1,
    page: 'demandes',
    path: '/pro/demandes/nouvelle',
    target: 'nd-steps',
    title: 'Quatre étapes, pas une de plus',
    text: 'Lieu, contenu, délai, récapitulatif. Vos sites sont déjà enregistrés : il suffit de choisir.',
  },
  {
    id: 'nd-estimate',
    chapter: 1,
    page: 'demandes',
    path: '/pro/demandes/nouvelle',
    target: 'nd-estimate',
    title: 'Le prix se calcule en direct',
    text: 'Chaque option met à jour le montant HT et TTC, forfait déjà déduit. Aucune surprise sur la facture.',
  },
  {
    id: 'int-views',
    chapter: 1,
    page: 'interventions',
    path: '/pro/interventions',
    target: 'int-views',
    title: 'Tableau, calendrier ou kanban',
    text: 'Trois façons de voir vos interventions. Dans le calendrier, glissez une intervention pour demander un report.',
  },
  {
    id: 'int-map',
    chapter: 1,
    page: 'interventions',
    path: (c) => (c.nextId ? `/pro/interventions?id=${c.nextId}` : null),
    target: 'int-map',
    title: 'Suivez le camion en direct',
    text: 'Le jour J, le camion avance sur la carte de Rouen. Vous êtes prévenu au départ du dépôt et à l’arrivée.',
  },
  {
    id: 'int-timeline',
    chapter: 1,
    page: 'interventions',
    path: (c) => (c.nextId ? `/pro/interventions?id=${c.nextId}` : null),
    target: 'int-timeline',
    title: 'Chaque étape horodatée',
    text: 'De la demande au rapport de tri, tout est tracé et visible par toute votre équipe.',
  },
  {
    id: 'devis',
    chapter: 2,
    page: 'devis',
    path: '/pro/devis',
    target: 'devis-list',
    title: 'Signez vos devis en ligne',
    text: 'Signature au doigt ou à la souris, « Bon pour accord », et l’intervention est planifiée aussitôt.',
  },
  {
    id: 'factures',
    chapter: 2,
    page: 'factures',
    path: '/pro/factures',
    target: 'fac-kpis',
    title: 'Factures et échéances',
    text: 'À payer, en retard, réglé : tout est daté. Export CSV pour votre comptable et règlement par virement.',
  },
  {
    id: 'documents',
    chapter: 2,
    page: 'documents',
    path: '/pro/documents',
    target: 'doc-tabs',
    title: 'Rapports de tri et bordereaux',
    text: 'La preuve de traçabilité de chaque m³, prête à imprimer. Le dossier annuel se génère en un clic.',
  },
  {
    id: 'sites',
    chapter: 3,
    page: 'sites',
    path: '/pro/sites',
    target: 'sites-grid',
    title: 'Tous vos biens au même endroit',
    text: (c) =>
      c.org.kind === 'stockage'
        ? 'Vos box sont regroupés par site. Importez tout votre parc en une fois avec un fichier CSV.'
        : 'Chaque logement garde son historique : interventions, volumes, documents. Import CSV possible.',
  },
  {
    id: 'messages',
    chapter: 3,
    page: 'messages',
    path: '/pro/messages',
    target: 'msg',
    title: 'Un fil par intervention',
    text: 'Échangez avec Max et Noa, joignez des photos. Réponse en général en moins d’une heure.',
  },
  {
    id: 'partenaires',
    chapter: 3,
    page: 'partenaires',
    path: '/pro/partenaires',
    target: 'referral',
    title: '5 % sur vos recommandations',
    text: 'Partagez votre lien ou votre QR code aux propriétaires : chaque chantier apporté vous rapporte une commission.',
    agenceOnly: true,
  },
  {
    id: 'equipe',
    chapter: 3,
    page: 'equipe',
    path: '/pro/equipe',
    target: 'viewas',
    title: 'Chacun son rôle',
    text: 'Administrateur, gestionnaire, comptable : chaque collègue ne voit que ce qui le concerne. Testez « Voir en tant que ».',
  },
  {
    id: 'search',
    chapter: 3,
    page: 'dashboard',
    path: null,
    target: 'search',
    title: 'Tout retrouver en une seconde',
    text: 'Une référence, une adresse, une page : cherchez depuis n’importe où.',
    kbd: '⌘ K',
    essential: true,
    zoom: false,
  },
  {
    id: 'bell',
    chapter: 3,
    page: 'dashboard',
    path: null,
    target: 'bell',
    title: 'Rien ne vous échappe',
    text: 'Devis à signer, camion en route, facture émise : tout arrive ici, et par e-mail ou SMS selon vos réglages.',
    essential: true,
    zoom: false,
  },
  {
    id: 'notif',
    chapter: 3,
    page: 'parametres',
    path: '/pro/parametres',
    target: 'notif-prefs',
    title: 'Vos notifications, à votre façon',
    text: 'E-mail, SMS ou les deux, événement par événement. La visite se relance d’ici ou depuis votre profil.',
  },
];
