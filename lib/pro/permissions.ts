import type { Role } from './types';

export type Page = 'dashboard' | 'demandes' | 'interventions' | 'devis' | 'factures' | 'documents' | 'sites' | 'abonnement' | 'messages' | 'partenaires' | 'equipe' | 'parametres';

const ACCESS: Record<Role, Page[]> = {
  admin: ['dashboard', 'demandes', 'interventions', 'devis', 'factures', 'documents', 'sites', 'abonnement', 'messages', 'partenaires', 'equipe', 'parametres'],
  gestionnaire: ['dashboard', 'demandes', 'interventions', 'devis', 'documents', 'sites', 'messages', 'parametres'],
  comptable: ['dashboard', 'factures', 'documents', 'abonnement', 'parametres'],
};

export const can = (role: Role, page: Page) => ACCESS[role].includes(page);
export const canAct = (role: Role, action: 'order' | 'sign' | 'pay' | 'manageTeam' | 'changePlan') =>
  ({
    order: role !== 'comptable',
    sign: role !== 'comptable',
    pay: role !== 'gestionnaire',
    manageTeam: role === 'admin',
    changePlan: role === 'admin',
  })[action];

export const ROLE_LABEL: Record<Role, string> = { admin: 'Administrateur', gestionnaire: 'Gestionnaire', comptable: 'Comptable' };
export const ROLE_HINT: Record<Role, string> = {
  admin: 'Tout l’espace',
  gestionnaire: 'Demandes et interventions',
  comptable: 'Factures et documents',
};
