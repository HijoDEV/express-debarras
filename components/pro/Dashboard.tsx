'use client';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { AlertTriangle, ArrowRight, CalendarClock, Download, Euro, FileSignature, MapPin, Plus, Receipt, Recycle, Truck } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Avatar } from '@/components/illus/Avatar';
import { cn } from '@/lib/cn';
import { getDashboard } from '@/lib/pro/api';
import { useApi } from '@/lib/pro/hooks';
import { canAct } from '@/lib/pro/permissions';
import { eur0, PRO } from '@/lib/pro/pricing';
import { Btn, Card, CardHeader, ErrorState, Gauge, Kpi, Skeleton, StatusBadge } from './ui';
import { useShell } from './shell/ShellContext';

function Countdown({ to }: { to: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const ms = Math.max(0, new Date(to).getTime() - now);
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return (
    <div className="flex gap-1.5" aria-label={`Dans ${d} jours ${h} heures ${m} minutes`}>
      {[
        [d, 'j'],
        [h, 'h'],
        [m, 'min'],
        [s, 's'],
      ].map(([v, u]) => (
        <span key={u as string} className="min-w-[50px] rounded-[10px] bg-white/10 px-2 py-1.5 text-center">
          <span className="block font-display text-[22px] leading-none tabular-nums">{String(v).padStart(2, '0')}</span>
          <span className="font-mono text-[10px] uppercase text-white/70">{u}</span>
        </span>
      ))}
    </div>
  );
}

export function Dashboard() {
  const { user, role, org } = useShell();
  const { data, loading, error, reload } = useApi(getDashboard, [org.id]);
  const today = format(new Date(), 'EEEE d MMMM yyyy', { locale: fr });

  return (
    <div>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-[13.5px] first-letter:uppercase text-p-muted">{today}</p>
          <h1 className="mt-1 font-display text-[30px] leading-none tracking-[-0.04em] sm:text-[38px]">Bonjour {user.firstName}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {canAct(role, 'order') && (
            <Btn variant="primary" href="/pro/demandes/nouvelle">
              <Plus className="h-4 w-4" /> Nouvelle demande
            </Btn>
          )}
          {canAct(role, 'sign') && (
            <Btn href="/pro/devis">
              <FileSignature className="h-4 w-4" /> Mes devis à signer
              {!!data?.toSign && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-signal px-1.5 text-[11px] font-bold text-navy">{data.toSign}</span>}
            </Btn>
          )}
          <Btn href="/pro/documents?tab=bordereaux">
            <Download className="h-4 w-4" /> Mes bordereaux
          </Btn>
        </div>
      </div>

      {error ? (
        <Card>
          <ErrorState message={error} onRetry={reload} />
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" data-tour="kpis">
            {loading || !data ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[132px] rounded-[14px]" />)
            ) : (
              <>
                <Kpi label="Interventions" value={data.kpis.interventions.value} prev={data.kpis.interventions.prev} format={(n) => String(Math.round(n))} icon={<CalendarClock className="h-4 w-4" />} suffix="ce mois" />
                <Kpi label="m³ évacués" value={data.kpis.m3.value} prev={data.kpis.m3.prev} format={(n) => (Math.round(n * 10) / 10).toLocaleString('fr-FR')} icon={<Truck className="h-4 w-4" />} suffix="m³" />
                <Kpi label="Volume valorisé" value={data.kpis.pct.value} prev={data.kpis.pct.prev} format={(n) => `${Math.round(n)} %`} icon={<Recycle className="h-4 w-4" />} />
                <Kpi label="Dépenses HT" value={data.kpis.spend.value / 100} prev={data.kpis.spend.prev / 100} format={(n) => `${Math.round(n).toLocaleString('fr-FR')} €`} icon={<Euro className="h-4 w-4" />} invert />
              </>
            )}
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-[1.25fr_1fr]">
            {/* prochaine intervention */}
            {loading || !data ? (
              <Skeleton className="h-[260px] rounded-[14px]" />
            ) : data.next ? (
              <div data-tour="next" className="on-dark relative overflow-hidden rounded-[14px] bg-navy p-5 text-white sm:p-6">
                <div aria-hidden className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-signal/15 blur-3xl" />
                <div className="relative flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-signal">Prochaine intervention</p>
                    <p className="mt-2 font-display text-[26px] first-letter:uppercase leading-none tracking-[-0.03em]">{format(new Date(data.next.slot!.date), 'EEEE d MMMM', { locale: fr })}</p>
                    <p className="mt-1.5 text-[14px] text-white/80">
                      {data.next.slot!.window} · <span className="font-mono">{data.next.ref}</span>
                    </p>
                  </div>
                  <StatusBadge status={data.next.status} />
                </div>
                <p className="relative mt-4 flex items-center gap-2 text-[14px] text-white/85">
                  <MapPin className="h-4 w-4 text-signal" /> {data.next.site.label} · {data.next.site.address}, {data.next.site.city}
                </p>
                <div className="relative mt-5 flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className="mb-2 text-[12px] text-white/70">Départ dans</p>
                    <Countdown to={data.next.slot!.date} />
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                      <Avatar variant="max" className="h-10 w-10 rounded-full ring-2 ring-navy" />
                      <Avatar variant="noa" className="h-10 w-10 rounded-full ring-2 ring-navy" />
                    </div>
                    <div className="text-[12.5px] leading-tight">
                      <p className="font-semibold">Max et Noa</p>
                      <p className="text-white/70">Équipe de 2 · camion 20 m³</p>
                    </div>
                  </div>
                </div>
                <Btn variant="primary" href={`/pro/interventions?id=${data.next.id}`} className="relative mt-5">
                  Suivre <ArrowRight className="h-4 w-4" />
                </Btn>
              </div>
            ) : (
              <Card className="grid place-items-center p-8 text-center" data-tour="next">
                <p className="font-semibold">Aucune intervention planifiée</p>
                <Btn variant="primary" className="mt-4" href="/pro/demandes/nouvelle">
                  <Plus className="h-4 w-4" /> Nouvelle demande
                </Btn>
              </Card>
            )}

            {/* abonnement */}
            {loading || !data ? (
              <Skeleton className="h-[260px] rounded-[14px]" />
            ) : (
              <Card data-tour="abo">
                <CardHeader title={data.abonnement.plan === 'ponctuel' ? 'Formule ponctuelle' : `Abonnement ${PRO.plans[data.abonnement.plan].label}`} sub={data.abonnement.plan === 'ponctuel' ? '45 € HT / m³ · forfait Box 220 € HT' : `${eur0(data.abonnement.monthlyHt)} HT / mois · consommation du mois`} action={<Btn size="sm" variant="ghost" href="/pro/abonnement">Gérer</Btn>} />
                <div className="space-y-5 px-5 pb-5 pt-3">
                  {data.abonnement.plan === 'ponctuel' ? (
                    <div className="rounded-[12px] bg-signal-soft p-4 text-[14px] text-navy dark:bg-signal/10 dark:text-p-text">
                      <p className="font-semibold">Passez à Pro Essentiel</p>
                      <p className="mt-1 text-[13.5px] opacity-80">1 passage et 3 m³ inclus chaque mois pour 129 € HT. Idéal pour vider les box résiliés.</p>
                      <Btn size="sm" variant="dark" className="mt-3" href="/pro/abonnement">
                        Comparer les offres
                      </Btn>
                    </div>
                  ) : (
                    <>
                      <Gauge label="Passages" used={data.abonnement.used.passages} total={data.abonnement.included.passages} unit="" />
                      <Gauge label="Volume inclus" used={data.abonnement.used.m3} total={data.abonnement.included.m3} unit="m³" />
                      {(data.abonnement.used.m3 / data.abonnement.included.m3 >= 0.8 || data.abonnement.used.passages / data.abonnement.included.passages >= 0.8) && (
                        <p className="flex gap-2 rounded-[10px] bg-[#FBE9E5] p-3 text-[13px] text-[#9A3412] dark:bg-[#9A3412]/25 dark:text-[#F5B7A6]" role="status">
                          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> Plus de 80 % de votre forfait consommé. Au-delà : 45 € HT / m³.
                        </p>
                      )}
                    </>
                  )}
                </div>
              </Card>
            )}
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-[1.6fr_1fr]">
            <Card data-tour="chart">
              <CardHeader
                title="Volume évacué par mois"
                sub="12 derniers mois · m³"
                action={
                  <div className="hidden items-center gap-3 text-[12px] text-p-muted sm:flex">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-sm bg-tri" /> Valorisé
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-sm bg-[#B9C1C8]" /> Tout-venant
                    </span>
                  </div>
                }
              />
              <div className="h-[260px] px-2 pb-3">
                {loading || !data ? (
                  <Skeleton className="m-3 h-[230px]" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.monthly} margin={{ top: 16, right: 12, left: -16, bottom: 0 }}>
                      <CartesianGrid vertical={false} stroke="var(--p-line)" />
                      <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: 'var(--p-muted)', fontSize: 12 }} />
                      <YAxis tickLine={false} axisLine={false} tick={{ fill: 'var(--p-muted)', fontSize: 12 }} />
                      <Tooltip
                        cursor={{ fill: 'var(--p-soft)' }}
                        contentStyle={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 10, color: 'var(--p-text)', fontSize: 13 }}
                        formatter={(v: number, n: string) => [`${v.toLocaleString('fr-FR')} m³`, n === 'valorise' ? 'Valorisé' : 'Tout-venant']}
                      />
                      <Bar dataKey="valorise" stackId="a" fill="#2F9E6E" radius={[0, 0, 0, 0]} animationDuration={900} />
                      <Bar dataKey="toutVenant" stackId="a" fill="#B9C1C8" radius={[5, 5, 0, 0]} animationDuration={900} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>

            <Card data-tour="activity">
              <CardHeader title="Activité récente" action={<Btn size="sm" variant="ghost" href="/pro/interventions">Tout voir</Btn>} />
              {loading || !data ? (
                <div className="space-y-3 p-5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-10" />
                  ))}
                </div>
              ) : (
                <ol className="relative px-5 pb-4 pt-2">
                  <span aria-hidden className="absolute bottom-6 left-[34px] top-5 w-px bg-p-line" />
                  {data.activity.map((a, i) => (
                    <motion.li key={`${a.at}-${i}`} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                      <Link href={a.href} className="relative flex gap-3 rounded-[10px] px-1 py-2 hover:bg-p-hover">
                        <span className={cn('relative z-10 grid h-7 w-7 shrink-0 place-items-center rounded-full ring-4 ring-[var(--p-card)]', a.kind === 'facture' ? 'bg-[#E4EEFB] text-[#1D4E89]' : a.kind === 'devis' ? 'bg-signal text-navy' : a.kind === 'rapport' ? 'bg-tri text-white' : 'bg-p-soft text-p-text')}>
                          {a.kind === 'facture' ? <Receipt className="h-3.5 w-3.5" /> : a.kind === 'devis' ? <FileSignature className="h-3.5 w-3.5" /> : a.kind === 'rapport' ? <Recycle className="h-3.5 w-3.5" /> : <Truck className="h-3.5 w-3.5" />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[13.5px] font-semibold">{a.label}</span>
                          <span className="block truncate text-[12.5px] text-p-muted">{a.detail}</span>
                        </span>
                        <span className="shrink-0 text-[11.5px] text-p-muted">{formatDistanceToNow(new Date(a.at), { locale: fr })}</span>
                      </Link>
                    </motion.li>
                  ))}
                </ol>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
