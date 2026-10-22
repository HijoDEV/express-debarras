import { describe, expect, it } from 'vitest';
import { buildSeed } from '@/lib/pro/seed';
import { computeProQuote } from '@/lib/pro/pricing';

const db = buildSeed(new Date('2026-10-22T10:00:00'));

describe('Données de démonstration', () => {
  for (const org of db.orgs) {
    const its = db.interventions.filter((i) => i.orgId === org.id);
    it(`${org.name} : 25 à 40 interventions`, () => {
      expect(its.length).toBeGreaterThanOrEqual(25);
      expect(its.length).toBeLessThanOrEqual(40);
    });
    it(`${org.name} : 2 factures en retard, 1 devis à signer`, () => {
      expect(db.factures.filter((f) => f.orgId === org.id && f.status === 'en_retard').length).toBe(2);
      expect(db.devis.filter((d) => d.orgId === org.id && d.status === 'a_signer').length).toBe(1);
    });
    it(`${org.name} : prochaine intervention dans 2 jours`, () => {
      const next = its.filter((i) => i.status === 'planifiee' && i.slot).sort((a, b) => a.slot!.date.localeCompare(b.slot!.date))[0];
      const days = Math.round((new Date(next.slot!.date).getTime() - new Date('2026-10-22T09:00:00').getTime()) / 86400000);
      expect(days).toBe(2);
    });
  }
  it('% valorisé entre 55 et 72', () => {
    for (const r of db.rapports) {
      expect(r.valorisedPct).toBeGreaterThanOrEqual(55);
      expect(r.valorisedPct).toBeLessThanOrEqual(72);
    }
  });
  it('Montants des interventions ponctuelles conformes aux règles', () => {
    for (const it2 of db.interventions.filter((i) => i.orgId === 'org-stock')) {
      const site = db.sites.find((s) => s.id === it2.siteId)!;
      const q = computeProQuote({ boxes: it2.content.boxes?.length ?? 0, volume: it2.content.volume, delay: it2.delay, floor: site.floor, elevator: site.elevator, distanceKm: site.distanceKm });
      expect(it2.ht).toBe(q.ht);
    }
  });
});
