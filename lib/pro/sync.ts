'use client';
import type { Status } from './types';

export type SyncEvent =
  | { type: 'status'; orgId: string; interventionId: string; ref: string; status: Status; by: 'client' | 'equipe' | 'systeme'; origin: string }
  | { type: 'created'; orgId: string; interventionId: string; ref: string; origin: string }
  | { type: 'message'; orgId: string; threadId: string; author: 'client' | 'equipe'; text: string; origin: string }
  | { type: 'db'; origin: string };

/** Identifiant de cet onglet, pour ignorer ses propres messages. */
export const TAB_ID = typeof window !== 'undefined' ? Math.random().toString(36).slice(2) : 'ssr';

let channel: BroadcastChannel | null = null;
const listeners = new Set<(e: SyncEvent) => void>();

function ensure() {
  if (typeof window === 'undefined' || channel) return;
  if (typeof BroadcastChannel !== 'undefined') {
    channel = new BroadcastChannel('ed-sync');
    channel.onmessage = (m) => listeners.forEach((l) => l(m.data as SyncEvent));
  } else {
    // repli : l'événement storage se déclenche dans les autres onglets
    window.addEventListener('storage', (e) => {
      if (e.key !== 'ed:sync' || !e.newValue) return;
      try {
        const ev = JSON.parse(e.newValue) as SyncEvent;
        listeners.forEach((l) => l(ev));
      } catch {
        /* ignoré */
      }
    });
  }
}

type Without<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

export function publish(e: Without<SyncEvent, 'origin'>) {
  ensure();
  const ev = { ...e, origin: TAB_ID } as SyncEvent;
  try {
    if (channel) channel.postMessage(ev);
    else localStorage.setItem('ed:sync', JSON.stringify({ ...ev, t: Date.now() }));
  } catch {
    /* ignoré */
  }
  // dans l'onglet courant aussi (les vues se rafraîchissent)
  localListeners.forEach((l) => l(ev));
}

const localListeners = new Set<(e: SyncEvent) => void>();

/** Événements venant des autres onglets. */
export function subscribe(cb: (e: SyncEvent) => void) {
  ensure();
  listeners.add(cb);
  return () => void listeners.delete(cb);
}

/** Événements de cet onglet (mise à jour des vues). */
export function subscribeLocal(cb: (e: SyncEvent) => void) {
  localListeners.add(cb);
  return () => void localListeners.delete(cb);
}
