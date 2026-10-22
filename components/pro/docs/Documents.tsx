'use client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { FileCheck2, FolderDown, Recycle } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { cn } from '@/lib/cn';
import { photo } from '@/lib/photos';
import { getBordereau, getRapport, listDocuments } from '@/lib/pro/api';
import { useApi } from '@/lib/pro/hooks';
import type { Filiere } from '@/lib/pro/types';
import { Btn, Card, EmptyState, ErrorState, inputCls, LoadingList, PageHeader, Segmented } from '../ui';
import { DocFrame } from './DocFrame';

export function Ring({ pct, size = 64, stroke = 8 }: { pct: number; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} className="-rotate-90" aria-hidden>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E6E8EB" strokeWidth={stroke} />
      <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#2F9E6E" strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - pct / 100) }} transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }} />
    </svg>
  );
}

export function Documents() {
  const params = useSearchParams();
  const [tab, setTab] = useState<'rapports' | 'bordereaux'>(params.get('tab') === 'bordereaux' ? 'bordereaux' : 'rapports');
  const [site, setSite] = useState('all');
  const [period, setPeriod] = useState<'12' | '3' | '6'>('12');
  const { data, loading, error, reload } = useApi(listDocuments);
  const since = Date.now() - Number(period) * 30.5 * 86400000;
  const sites = useMemo(() => Array.from(new Map((data?.rapports ?? []).map((r) => [r.intervention.siteId, r.intervention.site.label])).entries()), [data]);
  const ok = (siteId: string, date: string) => (site === 'all' || siteId === site) && new Date(date).getTime() >= since;
  const rapports = (data?.rapports ?? []).filter((r) => ok(r.intervention.siteId, r.date));
  const bordereaux = (data?.bordereaux ?? []).filter((b) => ok(b.intervention.siteId, b.date));
  const totalV = rapports.reduce((s, r) => s + r.volume, 0);
  const avg = totalV ? Math.round(rapports.reduce((s, r) => s + r.volume * r.valorisedPct, 0) / totalV) : 0;

  return (
    <div>
      <PageHeader
        title="Documents et traçabilité"
        sub="Rapports de tri et bordereaux de suivi des déchets, prêts pour vos audits RSE."
        actions={
          <Btn variant="primary" href="/pro/documents/dossier-annuel">
            <FolderDown className="h-4 w-4" /> Télécharger le dossier annuel
          </Btn>
        }
      />
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Card className="flex items-center gap-4 p-5">
          <div className="relative">
            <Ring pct={avg} />
            <span className="absolute inset-0 grid place-items-center font-display text-[15px]">{avg}%</span>
          </div>
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-p-muted">Valorisé en moyenne</p>
            <p className="text-[13px] text-p-muted">sur la période</p>
          </div>
        </Card>
        <Card className="p-5">
          <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-p-muted">Volume évacué</p>
          <p className="mt-2 font-display text-[28px] leading-none tracking-[-0.035em]">{(Math.round(totalV * 10) / 10).toLocaleString('fr-FR')} m³</p>
        </Card>
        <Card className="p-5">
          <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-p-muted">Documents</p>
          <p className="mt-2 font-display text-[28px] leading-none tracking-[-0.035em]">{rapports.length + bordereaux.length}</p>
        </Card>
      </div>

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Segmented label="Type de document" value={tab} onChange={setTab} options={[{ value: 'rapports', label: `Rapports de tri (${rapports.length})` }, { value: 'bordereaux', label: `Bordereaux (${bordereaux.length})` }]} />
        <div className="flex gap-2">
          <select value={site} onChange={(e) => setSite(e.target.value)} className={cn(inputCls.replace('w-full', 'w-auto'), 'max-w-[220px]')} aria-label="Filtrer par site">
            <option value="all">Tous les sites</option>
            {sites.map(([id, l]) => (
              <option key={id} value={id}>
                {l}
              </option>
            ))}
          </select>
          <select value={period} onChange={(e) => setPeriod(e.target.value as typeof period)} className={inputCls.replace('w-full', 'w-auto')} aria-label="Période">
            <option value="12">12 mois</option>
            <option value="6">6 mois</option>
            <option value="3">3 mois</option>
          </select>
        </div>
      </div>

      {error ? (
        <Card><ErrorState message={error} onRetry={reload} /></Card>
      ) : loading ? (
        <Card><LoadingList rows={6} /></Card>
      ) : tab === 'rapports' ? (
        rapports.length === 0 ? (
          <Card><EmptyState art="doc" title="Aucun rapport sur cette période" text="Élargissez la période ou changez de site." /></Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {rapports.map((r, i) => (
              <motion.div key={r.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 12) * 0.03 }}>
                <Link href={`/pro/documents/rapport/${r.id}`} className="block h-full rounded-[14px] border border-p-line bg-p-card p-4 transition hover:-translate-y-0.5 hover:shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="relative shrink-0">
                      <Ring pct={r.valorisedPct} size={56} stroke={7} />
                      <span className="absolute inset-0 grid place-items-center text-[12.5px] font-bold">{r.valorisedPct}%</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-mono text-[12.5px] font-semibold">{r.intervention.ref}</p>
                      <p className="truncate text-[13.5px] font-semibold">{r.intervention.site.label}</p>
                      <p className="text-[12.5px] text-p-muted">
                        {format(new Date(r.date), 'd MMM yyyy', { locale: fr })} · {r.volume.toLocaleString('fr-FR')} m³
                      </p>
                    </div>
                  </div>
                  <FiliereBar filieres={r.filieres} className="mt-4" />
                </Link>
              </motion.div>
            ))}
          </div>
        )
      ) : bordereaux.length === 0 ? (
        <Card><EmptyState art="doc" title="Aucun bordereau sur cette période" text="Élargissez la période ou changez de site." /></Card>
      ) : (
        <Card className="overflow-hidden">
          <ul className="divide-y divide-p-line">
            {bordereaux.map((b) => (
              <li key={b.id}>
                <Link href={`/pro/documents/bordereau/${b.id}`} className="grid gap-1 px-4 py-3.5 hover:bg-p-hover sm:grid-cols-[auto_1.2fr_1fr_auto] sm:items-center sm:gap-4 sm:px-5">
                  <FileCheck2 className="hidden h-5 w-5 text-tri sm:block" />
                  <span className="min-w-0">
                    <span className="font-mono text-[13px] font-semibold">{b.number}</span>
                    <span className="block truncate text-[13px] text-p-muted">{b.nature.join(' · ')}</span>
                  </span>
                  <span className="truncate text-[13px] text-p-muted">{b.intervention.site.label}</span>
                  <span className="text-[13px] sm:text-right">
                    <span className="font-mono font-semibold">{b.volume.toLocaleString('fr-FR')} m³</span>
                    <span className="block text-p-muted">{format(new Date(b.date), 'd MMM yyyy', { locale: fr })}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

const COLORS: Record<string, string> = { Réemploi: '#2F9E6E', Meubles: '#4DBB88', Métaux: '#1F7A53', Revente: '#FFC21A', DEEE: '#3A7BD5', 'Textiles et livres': '#9EC3DD', 'Tout-venant': '#B9C1C8' };

export function FiliereBar({ filieres, className }: { filieres: Filiere[]; className?: string }) {
  const total = filieres.reduce((s, f) => s + f.m3, 0) || 1;
  return (
    <div className={className}>
      <div className="flex h-2.5 overflow-hidden rounded-full" role="img" aria-label={filieres.map((f) => `${f.name} ${f.m3} m³`).join(', ')}>
        {filieres.map((f) => (
          <motion.span key={f.name} initial={{ width: 0 }} animate={{ width: `${(f.m3 / total) * 100}%` }} transition={{ duration: 0.8 }} style={{ background: COLORS[f.name] ?? '#8A9299' }} />
        ))}
      </div>
    </div>
  );
}

export function RapportPage({ id }: { id: string }) {
  const { data: r, loading, error, reload } = useApi(() => getRapport(id), [id]);
  if (error) return <Card><ErrorState message={error} onRetry={reload} /></Card>;
  if (loading || !r) return <Card><LoadingList rows={10} /></Card>;
  return (
    <DocFrame kind="Rapport de tri" number={`RT-${r.intervention.ref}`} date={format(new Date(r.date), 'd MMMM yyyy', { locale: fr })}>
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-[#56646E]">Client</p>
          <p className="mt-1.5 font-semibold">{r.org.name}</p>
          <p className="text-[13px] text-[#56646E]">{r.intervention.site.label}</p>
          <p className="text-[13px] text-[#56646E]">
            {r.intervention.site.address}, {r.intervention.site.city}
          </p>
        </div>
        <div className="flex items-center gap-4 sm:justify-end">
          <div className="relative">
            <Ring pct={r.valorisedPct} size={110} stroke={12} />
            <span className="absolute inset-0 grid place-items-center text-center font-display text-[24px] leading-none">
              {r.valorisedPct} %<span className="block font-sans text-[10px] font-medium text-[#56646E]">valorisé</span>
            </span>
          </div>
        </div>
      </div>
      <table className="mt-8 w-full text-[13.5px]">
        <thead>
          <tr className="border-b border-navy text-left font-mono text-[10.5px] uppercase tracking-[0.12em] text-[#56646E]">
            <th className="py-2 font-medium">Filière</th>
            <th className="py-2 text-right font-medium">Volume</th>
            <th className="py-2 text-right font-medium">Part</th>
          </tr>
        </thead>
        <tbody>
          {r.filieres.map((f) => (
            <tr key={f.name} className="border-b border-[#E6E8EB]">
              <td className="py-2.5">
                <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full align-middle" style={{ background: COLORS[f.name] }} />
                {f.name} {!f.valorised && <span className="text-[#56646E]">(non valorisé)</span>}
              </td>
              <td className="py-2.5 text-right font-mono">{f.m3.toLocaleString('fr-FR')} m³</td>
              <td className="py-2.5 text-right font-mono">{Math.round((f.m3 / r.volume) * 100)} %</td>
            </tr>
          ))}
          <tr className="font-semibold">
            <td className="pt-3">Total</td>
            <td className="pt-3 text-right font-mono">{r.volume.toLocaleString('fr-FR')} m³</td>
            <td className="pt-3 text-right font-mono">100 %</td>
          </tr>
        </tbody>
      </table>
      <div className="mt-8 grid grid-cols-2 gap-3">
        {(['caveAvant', 'caveApres'] as const).map((k, i) => (
          <figure key={k}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo(k, 560, 400)} alt={i ? 'Après' : 'Avant'} className="aspect-[7/5] w-full rounded-[10px] object-cover" />
            <figcaption className="mt-1 text-[11.5px] text-[#56646E]">{i ? 'Après' : 'Avant'} · photo d’illustration</figcaption>
          </figure>
        ))}
      </div>
      <p className="mt-6 flex items-center gap-2 text-[12px] text-[#56646E]">
        <Recycle className="h-4 w-4 text-tri" /> Tri réalisé sur place par Express Débarras. Répartition établie à partir des bons de dépôt de chaque filière.
      </p>
    </DocFrame>
  );
}

export function BordereauPage({ id }: { id: string }) {
  const { data: b, loading, error, reload } = useApi(() => getBordereau(id), [id]);
  if (error) return <Card><ErrorState message={error} onRetry={reload} /></Card>;
  if (loading || !b) return <Card><LoadingList rows={10} /></Card>;
  const rows: [string, React.ReactNode][] = [
    ['Producteur', b.producteur],
    ['Adresse d’enlèvement', `${b.intervention.site.address}, ${b.intervention.site.postalCode} ${b.intervention.site.city}`],
    ['Collecteur · transporteur', b.collecteur],
    ['Nature des déchets', b.nature.join(' · ')],
    ['Volume', `${b.volume.toLocaleString('fr-FR')} m³`],
    ['Destinations', <ul key="d" className="list-inside list-disc">{b.destination.map((d) => <li key={d}>{d}</li>)}</ul>],
    ['Date d’enlèvement', format(new Date(b.date), 'd MMMM yyyy', { locale: fr })],
    ['Intervention', b.intervention.ref],
  ];
  return (
    <DocFrame kind="Bordereau de traçabilité" number={b.number} date={format(new Date(b.date), 'd MMMM yyyy', { locale: fr })}>
      <dl className="divide-y divide-[#E6E8EB] border-y border-[#E6E8EB] text-[13.5px]">
        {rows.map(([k, v]) => (
          <div key={k} className="grid gap-1 py-3 sm:grid-cols-[220px_1fr]">
            <dt className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#56646E]">{k}</dt>
            <dd className="font-medium">{v}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-8 grid grid-cols-2 gap-6 text-[12px] text-[#56646E]">
        <div>
          <p className="font-semibold text-navy">Visa producteur</p>
          <div className="mt-2 h-16 rounded border border-dashed border-[#C2CBD2]" />
        </div>
        <div>
          <p className="font-semibold text-navy">Visa collecteur</p>
          <div className="mt-2 grid h-16 place-items-center rounded border border-[#C2CBD2] font-mono text-navy">Express Débarras ✓</div>
        </div>
      </div>
    </DocFrame>
  );
}

export function DossierAnnuel() {
  const { data, loading } = useApi(listDocuments);
  if (loading || !data) return <Card><LoadingList rows={10} /></Card>;
  const year = new Date().getFullYear();
  const rs = data.rapports;
  const total = rs.reduce((s, r) => s + r.volume, 0);
  const valo = rs.reduce((s, r) => s + (r.volume * r.valorisedPct) / 100, 0);
  const byF = new Map<string, number>();
  rs.forEach((r) => r.filieres.forEach((f) => byF.set(f.name, (byF.get(f.name) ?? 0) + f.m3)));
  return (
    <DocFrame kind="Dossier annuel" number={`DA-${year}`} date={`12 derniers mois · édité le ${format(new Date(), 'd MMMM yyyy', { locale: fr })}`}>
      <div className="grid gap-3 sm:grid-cols-4">
        {[
          ['Interventions', String(rs.length)],
          ['Volume évacué', `${(Math.round(total * 10) / 10).toLocaleString('fr-FR')} m³`],
          ['Valorisé', `${total ? Math.round((valo / total) * 100) : 0} %`],
          ['Bordereaux', String(data.bordereaux.length)],
        ].map(([l, v]) => (
          <div key={l} className="rounded-[10px] bg-[#F7F8FA] p-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#56646E]">{l}</p>
            <p className="mt-1 font-display text-[22px] leading-none tracking-[-0.03em]">{v}</p>
          </div>
        ))}
      </div>
      <h2 className="mt-8 text-[14px] font-semibold">Répartition par filière</h2>
      <FiliereBar className="mt-2" filieres={Array.from(byF.entries()).map(([name, m3]) => ({ name, m3, valorised: name !== 'Tout-venant' }))} />
      <ul className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 text-[12.5px] sm:grid-cols-4">
        {Array.from(byF.entries()).map(([n, v]) => (
          <li key={n} className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: COLORS[n] }} /> {n} · {(Math.round(v * 10) / 10).toLocaleString('fr-FR')} m³
          </li>
        ))}
      </ul>
      <h2 className="mt-8 text-[14px] font-semibold">Détail des rapports</h2>
      <table className="mt-2 w-full text-[12.5px]">
        <thead>
          <tr className="border-b border-navy text-left font-mono text-[10px] uppercase tracking-[0.12em] text-[#56646E]">
            <th className="py-2 font-medium">Date</th>
            <th className="py-2 font-medium">Réf.</th>
            <th className="py-2 font-medium">Site</th>
            <th className="py-2 text-right font-medium">m³</th>
            <th className="py-2 text-right font-medium">Valorisé</th>
          </tr>
        </thead>
        <tbody>
          {rs.map((r) => (
            <tr key={r.id} className="border-b border-[#E6E8EB] break-inside-avoid">
              <td className="py-1.5">{format(new Date(r.date), 'dd/MM/yyyy')}</td>
              <td className="py-1.5 font-mono">{r.intervention.ref}</td>
              <td className="max-w-[220px] truncate py-1.5">{r.intervention.site.label}</td>
              <td className="py-1.5 text-right font-mono">{r.volume.toLocaleString('fr-FR')}</td>
              <td className="py-1.5 text-right font-mono">{r.valorisedPct} %</td>
            </tr>
          ))}
        </tbody>
      </table>
    </DocFrame>
  );
}
