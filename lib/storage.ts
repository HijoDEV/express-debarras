'use client';
import { useEffect, useRef, useState } from 'react';

export function readLS<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeLS<T>(key: string, value: T) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* stockage indisponible : on continue sans persister */
  }
}

/** État React synchronisé avec localStorage (hydraté après le premier rendu). */
export function usePersistentState<T>(key: string, initial: T) {
  const [state, setState] = useState<T>(initial);
  const [hydrated, setHydrated] = useState(false);
  const first = useRef(true);
  useEffect(() => {
    setState(readLS(key, initial));
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (hydrated) writeLS(key, state);
  }, [key, state, hydrated]);
  return [state, setState, hydrated] as const;
}

/* ---------- Réservations (démo) ---------- */
export type BookingStatus = 'Nouveau' | 'Photos validées' | 'Planifié' | 'Terminé';
export const STATUSES: BookingStatus[] = ['Nouveau', 'Photos validées', 'Planifié', 'Terminé'];

export type Booking = {
  id: string;
  createdAt: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  postalCode: string;
  slot: string;
  formulaName: string;
  volume: number;
  total: number;
  deposit: number;
  lines: { label: string; amount: number }[];
  items: Record<string, number>;
  rooms: Record<string, number>;
  photos: number;
  status: BookingStatus;
};

const BOOKINGS_KEY = 'ed:bookings';
export const getBookings = () => readLS<Booking[]>(BOOKINGS_KEY, []);
export const saveBookings = (b: Booking[]) => writeLS(BOOKINGS_KEY, b);
export function addBooking(b: Booking) {
  saveBookings([b, ...getBookings()]);
}
