'use client';
import { createContext, useContext } from 'react';
import type { Organisation, Role, Utilisateur } from '@/lib/pro/types';

export type ShellCtx = {
  org: Organisation;
  user: Utilisateur;
  role: Role;
  counters: { unreadMessages: number; unreadNotifs: number; toSign: number };
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  openPalette: () => void;
  openNotifs: () => void;
  startTour: () => void;
};

export const Shell = createContext<ShellCtx | null>(null);

export function useShell() {
  const c = useContext(Shell);
  if (!c) throw new Error('useShell hors de ProShell');
  return c;
}
