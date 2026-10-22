'use client';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { buildSeed } from './seed';
import type { NotifPrefs, ProDB, Role } from './types';

export type Session = { orgId: string; userId: string; viewAs: Role } | null;
export type Prefs = {
  theme: 'light' | 'dark';
  tourDone: Record<string, boolean>;
  simulateErrors: boolean;
  notif: NotifPrefs;
  lang: 'fr' | 'en';
};

export const DEFAULT_NOTIF: NotifPrefs = {
  'Devis à signer': { email: true, sms: false },
  'Intervention planifiée': { email: true, sms: true },
  'Camion en route': { email: false, sms: true },
  'Intervention terminée': { email: true, sms: false },
  'Facture émise': { email: true, sms: false },
  'Nouveau message': { email: true, sms: false },
};

type State = {
  db: ProDB | null;
  session: Session;
  prefs: Prefs;
  rev: number;
  ensureDb: () => ProDB;
  write: (fn: (db: ProDB) => void) => void;
  replaceDb: (db: ProDB) => void;
  setSession: (s: Session) => void;
  setPrefs: (p: Partial<Prefs>) => void;
};

export const useProStore = create<State>()(
  persist(
    (set, get) => ({
      db: null,
      session: null,
      prefs: { theme: 'light', tourDone: {}, simulateErrors: false, notif: DEFAULT_NOTIF, lang: 'fr' },
      rev: 0,
      ensureDb: () => {
        let db = get().db;
        if (!db) {
          db = buildSeed();
          set({ db });
        }
        return db;
      },
      write: (fn) => {
        const db = structuredClone(get().ensureDb());
        fn(db);
        set((s) => ({ db, rev: s.rev + 1 }));
      },
      replaceDb: (db) => set((s) => ({ db, rev: s.rev + 1 })),
      setSession: (session) => set({ session }),
      setPrefs: (p) => set((s) => ({ prefs: { ...s.prefs, ...p } })),
    }),
    {
      name: 'ed:pro',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ db: s.db, session: s.session, prefs: s.prefs }),
    },
  ),
);

/** Relit l'état depuis localStorage (après une modification dans un autre onglet). */
export async function rehydrate() {
  await useProStore.persist.rehydrate();
  useProStore.setState((s) => ({ rev: s.rev + 1 }));
}
