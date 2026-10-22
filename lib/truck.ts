import { ITEMS, ROOMS, type IllusId } from './data';

/** Caisse de 20 m³ découpée en 10 colonnes × 4 rangées de 0,5 m³. */
export const COLS = 10;
export const ROWS = 4;
export const CELL_M3 = 0.5;
export const TRUCK_M3 = COLS * ROWS * CELL_M3; // 20

export type Piece = {
  id: string;
  illus: IllusId;
  name: string;
  w: number; // colonnes
  h: number; // rangées
  kind: 'furniture' | 'carton' | 'appliance';
  count?: number; // petits objets regroupés
};

export type Placed = Piece & { col: number; row: number };

const TALL: IllusId[] = ['wardrobe', 'fridge', 'shelf', 'washer', 'stove'];
const APPLIANCE: IllusId[] = ['fridge', 'washer', 'stove', 'tv'];
const ROOM_MIX: IllusId[] = ['box', 'dresser', 'box', 'bag', 'armchair', 'box', 'lamp', 'box', 'bike', 'tv', 'box', 'shelf'];

function shape(illus: IllusId, cells: number): { w: number; h: number } {
  const c = Math.min(cells, 4);
  if (TALL.includes(illus)) return { w: 1, h: c };
  if (c === 4) return { w: 2, h: 2 };
  return { w: c, h: 1 };
}

/** Transforme la sélection en blocs à charger, du plus encombrant au plus petit. */
export function buildPieces(items: Record<string, number> = {}, rooms: Record<string, number> = {}): Piece[] {
  const big: Piece[] = [];
  const small: Piece[] = [];

  for (const it of ITEMS) {
    const n = Math.max(0, items[it.id] ?? 0);
    if (!n) continue;
    const kind = APPLIANCE.includes(it.illus) ? 'appliance' : it.illus === 'box' || it.illus === 'bag' ? 'carton' : 'furniture';
    if (it.volume >= CELL_M3) {
      const cells = Math.max(1, Math.round(it.volume / CELL_M3));
      const { w, h } = shape(it.illus, cells);
      for (let i = 0; i < n; i++) big.push({ id: `${it.id}-${i}`, illus: it.illus, name: it.name, w, h, kind });
    } else {
      // petits objets regroupés par cellule de 0,5 m³
      const perCell = Math.max(1, Math.floor(CELL_M3 / it.volume + 1e-9));
      let left = n;
      let k = 0;
      while (left > 0 && k < COLS * ROWS) {
        const c = Math.min(perCell, left);
        small.push({ id: `${it.id}-g${k}`, illus: it.illus, name: it.name, w: 1, h: 1, kind, count: c });
        left -= c;
        k++;
      }
    }
  }

  let r = 0;
  for (const room of ROOMS) {
    const n = Math.max(0, rooms[room.id] ?? 0);
    for (let u = 0; u < n; u++) {
      const cells = Math.round(room.volume / CELL_M3);
      for (let k = 0; k < cells && big.length + small.length < COLS * ROWS * 3; k++) {
        const illus = ROOM_MIX[(k + r) % ROOM_MIX.length];
        small.push({ id: `${room.id}-${u}-${k}`, illus, name: room.name, w: 1, h: 1, kind: illus === 'box' || illus === 'bag' ? 'carton' : 'furniture' });
      }
      r += 3;
    }
  }

  big.sort((a, b) => b.w * b.h - a.w * a.h);
  return [...big, ...small];
}

/** Rangement : des colonnes avant (côté cabine) vers l'arrière, du plancher vers le plafond. */
export function pack(pieces: Piece[]): { placed: Placed[]; overflow: number } {
  const grid = Array.from({ length: COLS }, () => Array(ROWS).fill(false) as boolean[]);
  const placed: Placed[] = [];
  let overflow = 0;
  const fits = (c: number, r: number, w: number, h: number) => {
    if (c + w > COLS || r + h > ROWS) return false;
    for (let x = c; x < c + w; x++) for (let y = r; y < r + h; y++) if (grid[x][y]) return false;
    // pas de bloc suspendu dans le vide
    if (r > 0) for (let x = c; x < c + w; x++) if (!grid[x][r - 1]) return false;
    return true;
  };
  for (const p of pieces) {
    let done = false;
    for (let c = 0; c < COLS && !done; c++)
      for (let r = 0; r < ROWS && !done; r++)
        if (fits(c, r, p.w, p.h)) {
          for (let x = c; x < c + p.w; x++) for (let y = r; y < r + p.h; y++) grid[x][y] = true;
          placed.push({ ...p, col: c, row: r });
          done = true;
        }
    if (!done) overflow += p.w * p.h;
  }
  return { placed, overflow };
}
