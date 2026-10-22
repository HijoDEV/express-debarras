import { BarChart3, Building2, CalendarClock, CreditCard, FileCheck2, FileSignature, FolderOpen, Handshake, LayoutDashboard, MessageSquare, Settings, Users } from 'lucide-react';
import type { Page } from '@/lib/pro/permissions';

export const NAV: { href: string; label: string; icon: typeof LayoutDashboard; page: Page; badge?: 'messages' | 'toSign'; group: 'main' | 'compte' }[] = [
  { href: '/pro', label: 'Tableau de bord', icon: LayoutDashboard, page: 'dashboard', group: 'main' },
  { href: '/pro/interventions', label: 'Interventions', icon: CalendarClock, page: 'interventions', group: 'main' },
  { href: '/pro/devis', label: 'Devis', icon: FileSignature, page: 'devis', badge: 'toSign', group: 'main' },
  { href: '/pro/factures', label: 'Factures', icon: CreditCard, page: 'factures', group: 'main' },
  { href: '/pro/documents', label: 'Documents', icon: FileCheck2, page: 'documents', group: 'main' },
  { href: '/pro/sites', label: 'Sites et biens', icon: Building2, page: 'sites', group: 'main' },
  { href: '/pro/messages', label: 'Messages', icon: MessageSquare, page: 'messages', badge: 'messages', group: 'main' },
  { href: '/pro/abonnement', label: 'Abonnement', icon: BarChart3, page: 'abonnement', group: 'compte' },
  { href: '/pro/partenaires', label: 'Partenaires', icon: Handshake, page: 'partenaires', group: 'compte' },
  { href: '/pro/equipe', label: 'Équipe', icon: Users, page: 'equipe', group: 'compte' },
  { href: '/pro/parametres', label: 'Paramètres', icon: Settings, page: 'parametres', group: 'compte' },
];

export const CRUMBS: Record<string, string> = {
  pro: 'Tableau de bord',
  demandes: 'Demandes',
  nouvelle: 'Nouvelle demande',
  interventions: 'Interventions',
  devis: 'Devis',
  factures: 'Factures',
  documents: 'Documents',
  rapport: 'Rapport de tri',
  bordereau: 'Bordereau',
  'dossier-annuel': 'Dossier annuel',
  sites: 'Sites et biens',
  abonnement: 'Abonnement',
  messages: 'Messages',
  partenaires: 'Partenaires',
  equipe: 'Équipe',
  parametres: 'Paramètres',
};

export const FolderIcon = FolderOpen;
