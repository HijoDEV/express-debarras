'use client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { Box, Building2, FileUp, Home, KeyRound, LayoutGrid, List, MapPin, Plus, Search, Warehouse } from 'lucide-react';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/cn';
import { getSite, importSites, listSites } from '@/lib/pro/api';
import { parseCsv } from '@/lib/pro/csv';
import { useApi } from '@/lib/pro/hooks';
import { canAct } from '@/lib/pro/permissions';
import { eur } from '@/lib/pro/pricing';
import type { Site } from '@/lib/pro/types';
import { Btn, Card, CardHeader, EmptyState, ErrorState, inputCls, LoadingList, Modal, PageHeader, Segmented, StatusBadge } from './ui';
import { useShell } from './shell/ShellContext';

const ICON = { logement: Home, entrepot: Warehouse, box: Box, bureau: Building2 };
const TINT = { logement: 'bg-signal-soft text-navy', entrepot: 'bg-[#E4EEFB] text-[#1D4E89]', box: 'bg-tri-soft text-tri-dark', bureau: 'bg-[#F3E8FF] text-[#5B21B6]' };

export function SitesList() {
  const { role } = useShell();
  const { data, loading, error, reload } = useApi(listSites);
  const [view, setView] = useState<'cards' | 'list'>('cards');
  const [q, setQ] = useState('');
  const [importOpen, setImportOpen] = useState(false);
  const list = (data ?? []).filter((s) => `${s.label} ${s.address} ${s.city}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <div>
      <PageHeader
        title="Sites et biens"
        sub={data ? `${data.length} adresse${data.length > 1 ? 's' : ''} enregistrée${data.length > 1 ? 's' : ''}` : 'Chargement…'}
        actions={
          <>
            <Btn onClick={() => setImportOpen(true)}>
              <FileUp className="h-4 w-4" /> Importer un CSV
            </Btn>
            {canAct(role, 'order') && (
              <Btn variant="primary" href="/pro/demandes/nouvelle">
                <Plus className="h-4 w-4" /> Commander
              </Btn>
            )}
          </>
        }
      />
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative sm:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-p-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher une adresse" className={cn(inputCls, 'pl-9')} aria-label="Rechercher" />
        </div>
        <Segmented label="Affichage" value={view} onChange={setView} options={[{ value: 'cards', label: <><LayoutGrid className="h-4 w-4" /> Cartes</> }, { value: 'list', label: <><List className="h-4 w-4" /> Liste</> }]} />
      </div>
      {error ? (
        <Card><ErrorState message={error} onRetry={reload} /></Card>
      ) : loading ? (
        <Card><LoadingList rows={6} /></Card>
      ) : list.length === 0 ? (
        <Card><EmptyState title="Aucun site" text="Ajoutez vos biens un par un ou importez un fichier CSV." action={<Btn variant="primary" onClick={() => setImportOpen(true)}>Importer un CSV</Btn>} /></Card>
      ) : view === 'cards' ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((s, i) => {
            const I = ICON[s.kind];
            return (
              <motion.div className="min-w-0" key={s.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 12) * 0.03 }}>
                <Link href={`/pro/sites/${s.id}`} className="block h-full rounded-[14px] border border-p-line bg-p-card p-4 transition hover:-translate-y-0.5 hover:shadow-lg">
                  <div className="flex items-start gap-3">
                    <span className={cn('grid h-12 w-12 shrink-0 place-items-center rounded-[12px]', TINT[s.kind])}>
                      <I className="h-6 w-6" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-semibold">{s.label}</p>
                      <p className="truncate text-[13px] text-p-muted">
                        {s.address}, {s.city}
                      </p>
                    </div>
                  </div>
                  <dl className="mt-4 grid grid-cols-3 gap-1.5 text-center">
                    {[
                      ['Interventions', String(s.count)],
                      ['Dernière', s.last ? format(new Date(s.last), 'd MMM yy', { locale: fr }) : '—'],
                      ['Cumul', `${s.volume.toLocaleString('fr-FR')} m³`],
                    ].map(([k, v]) => (
                      <div key={k} className="rounded-[10px] bg-p-soft px-1 py-2">
                        <dt className="text-[10.5px] text-p-muted">{k}</dt>
                        <dd className="mt-0.5 truncate text-[13px] font-semibold">{v}</dd>
                      </div>
                    ))}
                  </dl>
                </Link>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <Card className="overflow-hidden">
          <ul className="divide-y divide-p-line">
            {list.map((s) => {
              const I = ICON[s.kind];
              return (
                <li key={s.id}>
                  <Link href={`/pro/sites/${s.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-p-hover sm:px-5">
                    <I className="h-5 w-5 shrink-0 text-p-muted" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{s.label}</span>
                      <span className="block truncate text-[12.5px] text-p-muted">
                        {s.address}, {s.city}
                      </span>
                    </span>
                    <span className="hidden text-right text-[13px] sm:block">
                      {s.count} interv. · {s.volume.toLocaleString('fr-FR')} m³
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
      <ImportModal open={importOpen} onClose={() => setImportOpen(false)} />
    </div>
  );
}

const SAMPLE = 'libelle;adresse;code_postal;ville;etage;ascenseur;code_acces\nT2 · Saint-Marc;Place Saint-Marc;76000;Rouen;3;non;4512A\nStudio · Pasteur;Rue Pasteur;76100;Rouen;1;non;\nT4 · Mont-Riboudet;Avenue du Mont-Riboudet;76000;Rouen;5;oui;9087B';

function ImportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [rows, setRows] = useState<Omit<Site, 'id' | 'orgId' | 'map'>[] | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const input = useRef<HTMLInputElement>(null);
  const parse = (text: string) => {
    const t = parseCsv(text);
    const [head, ...body] = t;
    const idx = (k: string) => head.findIndex((h) => h.toLowerCase().replace(/\s/g, '_').includes(k));
    const errs: string[] = [];
    const out = body.map((r, i) => {
      const cp = r[idx('code')] ?? '';
      if (!/^\d{5}$/.test(cp)) errs.push(`Ligne ${i + 2} : code postal invalide (« ${cp} »)`);
      return {
        label: r[idx('libel')] || `Bien ${i + 1}`,
        address: r[idx('adresse')] ?? '',
        postalCode: cp,
        city: r[idx('ville')] ?? '',
        floor: Number(r[idx('etage')] ?? 0) || 0,
        elevator: /^(oui|yes|1|true)$/i.test(r[idx('ascenseur')] ?? ''),
        accessCode: r[idx('acces')] || undefined,
        kind: 'logement' as const,
        keys: 'agence' as const,
        distanceKm: 5,
      };
    });
    setErrors(errs);
    setRows(out);
  };
  const close = () => {
    setRows(null);
    setErrors([]);
    onClose();
  };
  return (
    <Modal open={open} onClose={close} title="Importer des biens (CSV)" wide>
      {!rows ? (
        <div>
          <button onClick={() => input.current?.click()} className="grid w-full place-items-center rounded-[12px] border-2 border-dashed border-p-line px-4 py-10 text-center hover:bg-p-hover">
            <FileUp className="h-8 w-8 text-p-muted" />
            <span className="mt-2 font-semibold">Choisir un fichier CSV</span>
            <span className="text-[13px] text-p-muted">Colonnes : libelle, adresse, code_postal, ville, etage, ascenseur, code_acces</span>
          </button>
          <input
            ref={input}
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            aria-label="Fichier CSV"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (f) parse(await f.text());
            }}
          />
          <Btn variant="ghost" className="mt-3" onClick={() => parse(SAMPLE)}>
            Utiliser un fichier d’exemple
          </Btn>
        </div>
      ) : (
        <div>
          <p className="text-[14px]">
            <strong>{rows.length}</strong> bien{rows.length > 1 ? 's' : ''} détecté{rows.length > 1 ? 's' : ''}. Aperçu avant validation :
          </p>
          <div className="pro-scroll mt-3 max-h-[280px] overflow-auto rounded-[10px] border border-p-line">
            <table className="w-full text-[13px]">
              <thead className="sticky top-0 bg-p-soft font-mono text-[10.5px] uppercase tracking-[0.1em] text-p-muted">
                <tr>
                  {['Libellé', 'Adresse', 'CP', 'Ville', 'Étage', 'Asc.'].map((h) => (
                    <th key={h} className="px-3 py-2 text-left font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className={cn('border-t border-p-line', !/^\d{5}$/.test(r.postalCode) && 'bg-[#FBE9E5] dark:bg-[#9A3412]/20')}>
                    <td className="px-3 py-2">{r.label}</td>
                    <td className="px-3 py-2">{r.address}</td>
                    <td className="px-3 py-2 font-mono">{r.postalCode}</td>
                    <td className="px-3 py-2">{r.city}</td>
                    <td className="px-3 py-2">{r.floor}</td>
                    <td className="px-3 py-2">{r.elevator ? 'oui' : 'non'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {errors.length > 0 && (
            <ul className="mt-3 space-y-1 text-[13px] text-[#B4442A]" role="alert">
              {errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          )}
          <div className="mt-5 flex gap-2">
            <Btn
              variant="primary"
              disabled={!!errors.length}
              onClick={async () => {
                try {
                  const n = await importSites(rows);
                  toast.success(`${n} bien${n > 1 ? 's' : ''} importé${n > 1 ? 's' : ''}`);
                  close();
                } catch (e) {
                  toast.error((e as Error).message);
                }
              }}
            >
              Importer {rows.length} bien{rows.length > 1 ? 's' : ''}
            </Btn>
            <Btn variant="ghost" onClick={() => setRows(null)}>
              Changer de fichier
            </Btn>
          </div>
        </div>
      )}
    </Modal>
  );
}

export function SitePage({ id }: { id: string }) {
  const { role } = useShell();
  const { data: s, loading, error, reload } = useApi(() => getSite(id), [id]);
  if (error) return <Card><ErrorState message={error} onRetry={reload} /></Card>;
  if (loading || !s) return <Card><LoadingList rows={8} /></Card>;
  const I = ICON[s.kind];
  return (
    <div>
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            <span className={cn('grid h-11 w-11 place-items-center rounded-[12px]', TINT[s.kind])}>
              <I className="h-5 w-5" />
            </span>
            {s.label}
          </span>
        }
        sub={`${s.address}, ${s.postalCode} ${s.city}`}
        actions={
          canAct(role, 'order') && (
            <Btn variant="primary" href={`/pro/demandes/nouvelle?site=${s.id}`}>
              <Plus className="h-4 w-4" /> Commander ici
            </Btn>
          )
        }
      />
      <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
        <Card>
          <CardHeader title="Accès" />
          <dl className="space-y-3 px-5 pb-5 pt-2 text-[14px]">
            {[
              [MapPin, 'Étage', s.floor === 0 ? 'Rez-de-chaussée' : `${s.floor}e · ${s.elevator ? 'ascenseur' : 'sans ascenseur'}`],
              [KeyRound, 'Code d’accès', s.accessCode ?? '—'],
              [KeyRound, 'Clés', s.keys === 'agence' ? 'À récupérer à l’agence' : s.keys === 'gardien' ? 'Chez le gardien' : 'Sur place'],
              [Building2, 'Contact sur place', s.onSiteContact ?? '—'],
              [MapPin, 'Distance du dépôt', `${s.distanceKm} km`],
            ].map(([Ic, k, v]) => {
              const C = Ic as typeof MapPin;
              return (
                <div key={k as string} className="flex gap-3">
                  <C className="mt-0.5 h-4 w-4 shrink-0 text-p-muted" />
                  <div>
                    <dt className="text-[12.5px] text-p-muted">{k as string}</dt>
                    <dd className="font-semibold">{v as string}</dd>
                  </div>
                </div>
              );
            })}
            {s.boxes && (
              <div className="rounded-[10px] bg-p-soft p-3 text-[13px]">
                <strong>{s.boxes.length}</strong> box · numéros {s.boxes[0]} à {s.boxes[s.boxes.length - 1]}
              </div>
            )}
          </dl>
        </Card>
        <Card className="overflow-hidden">
          <CardHeader title="Historique" sub={`${s.interventions.length} intervention${s.interventions.length > 1 ? 's' : ''}`} />
          {s.interventions.length === 0 ? (
            <EmptyState title="Aucune intervention ici" text="Commandez un premier débarras pour ce bien." />
          ) : (
            <ul className="mt-2 divide-y divide-p-line">
              {s.interventions.map((it) => (
                <li key={it.id}>
                  <Link href={`/pro/interventions?id=${it.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-p-hover">
                    <span className="min-w-0 flex-1">
                      <span className="font-mono text-[13px] font-semibold">{it.ref}</span>
                      <span className="block text-[12.5px] text-p-muted">
                        {it.slot ? format(new Date(it.slot.date), 'd MMM yyyy', { locale: fr }) : 'À planifier'} · {it.content.volume.toLocaleString('fr-FR')} m³ · {it.ht ? eur(it.ht) : 'Inclus'}
                      </span>
                    </span>
                    <StatusBadge status={it.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
