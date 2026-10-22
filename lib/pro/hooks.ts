'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { quietly } from './api';
import { useProStore } from './store';

/**
 * Lecture via la couche API : chargement (squelette), erreur (réessayer),
 * puis rafraîchissement silencieux à chaque modification du store (local ou autre onglet).
 */
export function useApi<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const rev = useProStore((s) => s.rev);
  const first = useRef(true);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const load = useCallback(async (silent: boolean) => {
    if (!silent) {
      setLoading(true);
      setError(null);
    } else quietly();
    try {
      const d = await fnRef.current();
      setData(d);
      setError(null);
    } catch (e) {
      if (!silent) setError(e instanceof Error ? e.message : 'Erreur inconnue');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    first.current = true;
    void load(false).then(() => (first.current = false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    if (first.current) return;
    void load(true);
  }, [rev, load]);

  return { data, error, loading: loading && data === null, reload: () => load(false) };
}

/** Vrai une fois le store relu depuis localStorage (évite les écarts d'hydratation). */
export function useHydrated() {
  const [h, setH] = useState(false);
  useEffect(() => {
    const done = () => setH(true);
    if (useProStore.persist.hasHydrated()) done();
    const unsub = useProStore.persist.onFinishHydration(done);
    return unsub;
  }, []);
  return h;
}
