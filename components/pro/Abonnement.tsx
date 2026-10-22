'use client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Check, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { toast } from 'sonner';
import { cn } from '@/lib/cn';
import { changePlan, getAbonnement, prorataPreview } from '@/lib/pro/api';
import { useApi } from '@/lib/pro/hooks';
import { canAct } from '@/lib/pro/permissions';
import { eur, PRO } from '@/lib/pro/pricing';
import type { Plan } from '@/lib/pro/types';
import { Btn, Card, CardHeader, ErrorState, Gauge, LoadingList, Modal, PageHeader } from './ui';
import { useShell } from './shell/ShellContext';

const OFFERS: { plan: Plan; title: string; price: string; desc: string; features: string[] }[] = [
  { plan: 'ponctuel', title: 'Ponctuel', price: '45 € HT / m³', desc: 'Sans engagement · minimum 190 € HT', features: ['Devis sur photos en 1 h', 'Forfait Box 220 € HT', 'Bordereau de traçabilité'] },
  { plan: 'essentiel', title: 'Pro Essentiel', price: '129 € HT / mois', desc: '1 passage · 3 m³ inclus', features: ['Créneau fixe chaque mois', 'Au-delà : 45 € HT / m³', 'Facture mensuelle unique', 'Rapport de tri mensuel'] },
  { plan: 'plus', title: 'Pro Plus', price: '299 € HT / mois', desc: '2 passages · 8 m³ inclus', features: ['Deux passages planifiés', 'Interlocuteur dédié', 'Urgences prioritaires', 'Dossier annuel RSE'] },
];

export function Abonnement() {
  const { role } = useShell();
  const { data: ab, loading, error, reload } = useApi(getAbonnement);
  const [target, setTarget] = useState<Plan | null>(null);
  const [busy, setBusy] = useState(false);
  if (error) return <Card><ErrorState message={error} onRetry={reload} /></Card>;
  if (loading || !ab) return <Card><LoadingList rows={8} /></Card>;
  const preview = target ? prorataPreview(target) : null;
  const hist = ab.history.map((h) => ({ month: format(new Date(`${h.month}-01`), 'MMM', { locale: fr }).replace('.', ''), m3: h.m3, inclus: Math.min(h.m3, ab.included.m3), hors: Math.max(0, Math.round((h.m3 - ab.included.m3) * 10) / 10) }));

  return (
    <div>
      <PageHeader title="Abonnement" sub={`Offre actuelle : ${PRO.plans[ab.plan].label} · période du ${format(new Date(ab.period.start), 'd MMM', { locale: fr })} au ${format(new Date(ab.period.end), 'd MMM yyyy', { locale: fr })}`} />
      {ab.plan !== 'ponctuel' && (
        <Card className="mb-4" data-tour="abo-gauges">
          <CardHeader title="Consommation du mois" sub={`${eur(ab.monthlyHt)} HT / mois`} />
          <div className="grid gap-6 px-5 pb-5 pt-3 sm:grid-cols-2">
            <Gauge label="Passages" used={ab.used.passages} total={ab.included.passages} unit="" />
            <Gauge label="Volume" used={ab.used.m3} total={ab.included.m3} unit="m³" />
          </div>
        </Card>
      )}

      <div className="grid gap-3 lg:grid-cols-3" data-tour="abo-offers">
        {OFFERS.map((o) => {
          const current = o.plan === ab.plan;
          return (
            <Card key={o.plan} className={cn('relative flex flex-col p-5', current && 'border-2 border-signal shadow-[0_10px_30px_-12px_rgba(255,194,26,.7)]', o.plan === 'plus' && !current && 'border-navy dark:border-white/30')}>
              {current && <span className="absolute -top-3 left-5 rounded-full bg-signal px-2.5 py-0.5 text-[12px] font-bold text-navy">Offre actuelle</span>}
              {o.plan === 'plus' && !current && (
                <span className="absolute -top-3 left-5 inline-flex items-center gap-1 rounded-full bg-navy px-2.5 py-0.5 text-[12px] font-bold text-white">
                  <Sparkles className="h-3 w-3" /> Recommandé
                </span>
              )}
              <p className="font-display text-[22px] tracking-[-0.03em]">{o.title}</p>
              <p className="mt-2 font-display text-[26px] leading-none tracking-[-0.035em]">{o.price}</p>
              <p className="mt-1 text-[13px] text-p-muted">{o.desc}</p>
              <ul className="mt-4 flex-1 space-y-2 text-[14px]">
                {o.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-tri" /> {f}
                  </li>
                ))}
              </ul>
              <Btn className="mt-5" variant={current ? 'secondary' : 'primary'} disabled={current || !canAct(role, 'changePlan')} onClick={() => setTarget(o.plan)}>
                {current ? 'Votre offre' : canAct(role, 'changePlan') ? `Passer à ${o.title}` : 'Réservé à l’administrateur'}
              </Btn>
            </Card>
          );
        })}
      </div>

      <Card className="mt-4">
        <CardHeader title="Historique de consommation" sub="m³ par mois · inclus et hors forfait" />
        <div className="h-[240px] px-2 pb-3">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hist} margin={{ top: 16, right: 12, left: -16, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--p-line)" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: 'var(--p-muted)', fontSize: 12 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: 'var(--p-muted)', fontSize: 12 }} />
              <Tooltip cursor={{ fill: 'var(--p-soft)' }} contentStyle={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 10, color: 'var(--p-text)', fontSize: 13 }} formatter={(v: number, n: string) => [`${v.toLocaleString('fr-FR')} m³`, n === 'inclus' ? 'Inclus' : 'Hors forfait']} />
              <Bar dataKey="inclus" stackId="a" fill="#FFC21A" />
              <Bar dataKey="hors" stackId="a" fill="var(--p-bar2, #0E2A3B)" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Modal open={!!target} onClose={() => setTarget(null)} title="Changer d’offre">
        {target && preview && (
          <div>
            <p className="text-[14.5px]">
              Passer de <strong>{PRO.plans[ab.plan].label}</strong> à <strong>{PRO.plans[target].label}</strong>, à effet immédiat.
            </p>
            <div className="mt-4 rounded-[12px] bg-p-soft p-4 text-[14px]">
              <div className="flex justify-between">
                <span className="text-p-muted">Nouveau forfait</span>
                <span className="font-mono font-semibold">{eur(PRO.plans[target].monthly)} HT / mois</span>
              </div>
              <div className="mt-2 flex justify-between">
                <span className="text-p-muted">
                  Prorata ({preview.daysLeft} j restants sur {preview.days})
                </span>
                <span className="font-mono font-semibold">{preview.amount >= 0 ? eur(preview.amount) : `− ${eur(-preview.amount)}`} HT</span>
              </div>
              <p className="mt-3 text-[12.5px] text-p-muted">{preview.amount > 0 ? 'Une facture de prorata est émise aujourd’hui.' : preview.amount < 0 ? 'Le trop-perçu est déduit de la prochaine facture.' : 'Aucun prorata.'}</p>
            </div>
            <div className="mt-5 flex gap-2">
              <Btn
                variant="primary"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    await changePlan(target);
                    toast.success(`Offre ${PRO.plans[target].label} activée`);
                    setTarget(null);
                  } catch (e) {
                    toast.error((e as Error).message);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                Confirmer le changement
              </Btn>
              <Btn variant="ghost" onClick={() => setTarget(null)}>
                Annuler
              </Btn>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
