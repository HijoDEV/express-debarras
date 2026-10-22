import { describe, expect, it } from 'vitest';
import { computeQuote, computeVolume, forfaitFor, proPonctuelHT } from '@/lib/pricing';

describe('Tests obligatoires', () => {
  it('Canapé 3 places + matelas, 2e étage sans ascenseur, tournée → 83 €', () => {
    const q = computeQuote({ items: { canape3: 1, matelas: 1 }, floor: 2, elevator: false, delay: 'tournee' });
    expect(q.formula).toBe('objet');
    expect(q.total).toBe(83);
  });

  it('Réfrigérateur, rez-de-chaussée, sous 48 h → 69 €', () => {
    const q = computeQuote({ items: { frigo: 1 }, floor: 0, delay: '48h' });
    expect(q.total).toBe(69);
  });

  it('6 cartons (0,6 m³) → Express Mini 149 €', () => {
    const q = computeQuote({ items: { carton: 6 } });
    expect(q.volume).toBe(0.6);
    expect(q.formula).toBe('mini');
    expect(q.total).toBe(149);
  });

  it('Cave type 5 m³ → Express Pièce 349 €', () => {
    const q = computeQuote({ rooms: { cave: 1 } });
    expect(q.formula).toBe('piece');
    expect(q.total).toBe(349);
  });

  it('T2 15 m³ + samedi + Clés en main → 1 299 €', () => {
    const q = computeQuote({ rooms: { t2: 1 }, delay: 'samedi', pack: 'cles' });
    expect(q.formula).toBe('logement');
    expect(q.total).toBe(1299);
  });

  it('50 m³ → 1 800 €', () => {
    const q = computeQuote({ rooms: { maison: 1, t2: 1 } });
    expect(q.volume).toBe(50);
    expect(q.total).toBe(1800);
  });
});

describe('Cas limites', () => {
  it('41 m³ ne coûte jamais moins qu’Express Maison', () => {
    expect(forfaitFor(41).price).toBe(1490);
  });
  it('Tournée refusée hors Express Objet → 48 h', () => {
    expect(computeQuote({ rooms: { cave: 1 }, delay: 'tournee' }).delay).toBe('48h');
  });
  it('Ascenseur annule le supplément étage', () => {
    expect(computeQuote({ items: { frigo: 1 }, floor: 5, elevator: true }).total).toBe(69);
  });
  it('1er étage sans ascenseur gratuit', () => {
    expect(computeQuote({ items: { frigo: 1 }, floor: 1 }).total).toBe(69);
  });
  it('Distance au-delà de 30 km', () => {
    expect(computeQuote({ items: { frigo: 1 }, distanceKm: 55 }).total).toBe(69 + 25);
  });
  it('Démontage inclus dans Sérénité', () => {
    expect(computeQuote({ rooms: { cave: 1 }, dismantle: 3, pack: 'serenite' }).total).toBe(349 + 190);
  });
  it('Nettoyage inclus jusqu’à 60 m² avec Clés en main', () => {
    expect(computeQuote({ rooms: { t2: 1 }, cleaningM2: 70, pack: 'cles' }).total).toBe(790 + 390 + 40);
  });
  it('Volume vide → 0', () => {
    expect(computeQuote({}).total).toBe(0);
  });
  it('Acompte 30 %', () => {
    expect(computeQuote({ rooms: { cave: 1 } }).deposit).toBe(105);
  });
  it('Volumes sans erreurs de flottants', () => {
    expect(computeVolume({ tv: 3, carton: 1 })).toBe(0.7);
  });
  it('Pro ponctuel minimum 190 € HT', () => {
    expect(proPonctuelHT(2)).toBe(190);
    expect(proPonctuelHT(20)).toBe(900);
  });
});
