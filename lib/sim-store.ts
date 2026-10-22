import type { PackId, SituationId } from './data';
import { SITUATIONS } from './data';
import type { Delay } from './pricing';
import { readLS, writeLS } from './storage';

export type SimState = {
  step: number; // 0..4 + 5 (coordonnées) + 6 (confirmation)
  situation: SituationId | null;
  mode: 'items' | 'rooms';
  items: Record<string, number>;
  rooms: Record<string, number>;
  floor: number;
  elevator: boolean;
  longCarry: boolean;
  postalCode: string;
  distanceKm: number;
  delay: Delay;
  dismantle: number;
  cleaningM2: number;
  pack: PackId;
  slot: string | null;
};

export const SIM_KEY = 'ed:sim';
export const SIM_EVENT = 'ed:sim-prefill';

export const DEFAULT_SIM: SimState = {
  step: 0,
  situation: null,
  mode: 'items',
  items: {},
  rooms: {},
  floor: 0,
  elevator: false,
  longCarry: false,
  postalCode: '',
  distanceKm: 0,
  delay: '48h',
  dismantle: 0,
  cleaningM2: 0,
  pack: 'essentiel',
  slot: null,
};

/** Pré-remplit le simulateur depuis le hero, une page situation ou une ligne de liste. */
export function prefillSim(patch: Partial<SimState> & { situation: SituationId }) {
  const sit = SITUATIONS.find((s) => s.id === patch.situation)!;
  const next: SimState = {
    ...DEFAULT_SIM,
    mode: sit.mode,
    step: 1,
    ...(patch.situation === 'cave' && !patch.rooms ? { rooms: { cave: 1 } } : {}),
    ...(patch.situation === 'meuble' ? { delay: 'tournee' as Delay } : {}),
    ...patch,
  };
  writeLS(SIM_KEY, next);
  window.dispatchEvent(new CustomEvent(SIM_EVENT, { detail: next }));
}

export const loadSim = () => ({ ...DEFAULT_SIM, ...readLS<Partial<SimState>>(SIM_KEY, {}) });
