import type { Status } from './types';

export const STATUS_ORDER: Status[] = ['demandee', 'devis_envoye', 'devis_signe', 'planifiee', 'en_route', 'en_cours', 'terminee', 'rapport_dispo'];

export const STATUS_META: Record<Status, { label: string; className: string; dot: string; pulse?: boolean }> = {
  demandee: { label: 'Demandée', className: 'bg-[#EEF0F2] text-[#4A555E] dark:bg-white/10 dark:text-white/80', dot: 'bg-[#8A9299]' },
  devis_envoye: { label: 'Devis envoyé', className: 'bg-[#E4EEFB] text-[#1D4E89] dark:bg-[#1D4E89]/40 dark:text-[#B9D4F5]', dot: 'bg-[#3A7BD5]' },
  devis_signe: { label: 'Devis signé', className: 'bg-navy text-white dark:bg-white/15', dot: 'bg-white' },
  planifiee: { label: 'Planifiée', className: 'bg-signal-soft text-navy ring-1 ring-signal/60 dark:bg-signal/20 dark:text-signal', dot: 'bg-signal-dark' },
  en_route: { label: 'En route', className: 'bg-signal text-navy', dot: 'bg-navy', pulse: true },
  en_cours: { label: 'En cours', className: 'bg-signal text-navy', dot: 'bg-navy' },
  terminee: { label: 'Terminée', className: 'bg-tri-soft text-tri-dark dark:bg-tri/20 dark:text-[#7FD9AF]', dot: 'bg-tri' },
  rapport_dispo: { label: 'Rapport disponible', className: 'bg-tri-dark text-white', dot: 'bg-white' },
  annulee: { label: 'Annulée', className: 'bg-[#FBE9E5] text-[#9A3412] dark:bg-[#9A3412]/30 dark:text-[#F5B7A6]', dot: 'bg-[#E0533A]' },
};

/** Transitions autorisées et acteur qui les déclenche. */
export const TRANSITIONS: Record<Status, { to: Status; by: 'client' | 'equipe' | 'systeme'; label: string }[]> = {
  demandee: [
    { to: 'devis_envoye', by: 'equipe', label: 'Envoyer le devis' },
    { to: 'devis_signe', by: 'systeme', label: 'Couvert par l’abonnement' },
    { to: 'annulee', by: 'client', label: 'Annuler' },
  ],
  devis_envoye: [
    { to: 'devis_signe', by: 'client', label: 'Signer le devis' },
    { to: 'annulee', by: 'client', label: 'Refuser' },
    { to: 'annulee', by: 'systeme', label: 'Devis expiré' },
  ],
  devis_signe: [{ to: 'planifiee', by: 'equipe', label: 'Planifier' }, { to: 'annulee', by: 'client', label: 'Annuler' }],
  planifiee: [
    { to: 'en_route', by: 'equipe', label: 'Départ du camion' },
    { to: 'planifiee', by: 'client', label: 'Reporter' },
    { to: 'annulee', by: 'client', label: 'Annuler' },
  ],
  en_route: [{ to: 'en_cours', by: 'equipe', label: 'Arrivés sur place' }],
  en_cours: [{ to: 'terminee', by: 'equipe', label: 'Terminer' }],
  terminee: [{ to: 'rapport_dispo', by: 'equipe', label: 'Émettre le rapport' }],
  rapport_dispo: [],
  annulee: [],
};

export function canTransition(from: Status, to: Status, by: 'client' | 'equipe' | 'systeme') {
  return TRANSITIONS[from].some((t) => t.to === to && (t.by === by || by === 'systeme' || (by === 'equipe' && t.by === 'systeme')));
}

export const nextTeamAction = (s: Status) => TRANSITIONS[s].find((t) => t.by === 'equipe');

export const isUpcoming = (s: Status) => ['demandee', 'devis_envoye', 'devis_signe', 'planifiee', 'en_route', 'en_cours'].includes(s);
export const isDone = (s: Status) => s === 'terminee' || s === 'rapport_dispo';
