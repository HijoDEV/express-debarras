import { describe, expect, it } from 'vitest';
import { computeProQuote, monthlyBill, prorata } from '@/lib/pro/pricing';

describe('Prix pros · tests obligatoires', () => {
  it('Ponctuel 3 m³ → 190,00 € HT (minimum)', () => {
    expect(computeProQuote({ volume: 3 }).ht).toBe(19000);
  });
  it('Ponctuel 10 m³ → 450 HT, 90 TVA, 540 TTC', () => {
    const q = computeProQuote({ volume: 10 });
    expect([q.ht, q.tva, q.ttc]).toEqual([45000, 9000, 54000]);
  });
  it('Ponctuel 10 m³ en urgence → 540,00 € HT', () => {
    expect(computeProQuote({ volume: 10, delay: 'urgence' }).ht).toBe(54000);
  });
  it('3 box → 660,00 € HT', () => {
    expect(computeProQuote({ boxes: 3 }).ht).toBe(66000);
  });
  it('Pro Plus, 11 m³ dans le mois → 434,00 € HT', () => {
    expect(monthlyBill('plus', 11).ht).toBe(43400);
  });
  it('Ponctuel 6 m³ au 4e sans ascenseur → 307,50 € HT', () => {
    expect(computeProQuote({ volume: 6, floor: 4, elevator: false }).ht).toBe(30750);
  });
});

describe('Prix pros · cas limites', () => {
  it('Abonné dans le volume inclus → 0 € et couvert', () => {
    const q = computeProQuote({ volume: 2, included: { m3: 3, passages: 1 } });
    expect(q.ht).toBe(0);
    expect(q.covered).toBe(true);
  });
  it('Abonné au-delà du volume inclus → 45 € / m³ en plus', () => {
    expect(computeProQuote({ volume: 5, included: { m3: 3, passages: 1 } }).ht).toBe(9000);
  });
  it('Majoration samedi sur le montant après déduction', () => {
    expect(computeProQuote({ volume: 5, included: { m3: 3, passages: 1 }, delay: 'samedi' }).ht).toBe(10350);
  });
  it('Options au centime', () => {
    const q = computeProQuote({ volume: 10, distanceKm: 40, dismantle: 3, cleaningM2: 10, longCarry: true });
    expect(q.ht).toBe(45000 + 850 + 5010 + 3350 + 2500);
  });
  it('TVA arrondie au centime', () => {
    expect(computeProQuote({ volume: 10, dismantle: 1 }).tva).toBe(Math.round((45000 + 1670) * 0.2));
  });
  it('Prorata Essentiel → Plus à mi-mois', () => {
    expect(prorata('essentiel', 'plus', 16, 30)).toBe(Math.round(17000 * (15 / 30)));
  });
});
