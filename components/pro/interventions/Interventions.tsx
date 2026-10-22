'use client';
import { flexRender, getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable, type ColumnDef, type SortingState } from '@tanstack/react-table';
import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, startOfMonth, startOfWeek } from 'date-fns';
import { fr } from 'date-fns/locale';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowDown, ArrowUp, CalendarDays, ChevronLeft, ChevronRight, Columns3, Download, Plus, Search, Table2 } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/cn';
import { listInterventions, reschedule, type InterventionRow } from '@/lib/pro/api';
import { downloadCsv } from '@/lib/pro/csv';
import { useApi } from '@/lib/pro/hooks';
import { canAct } from '@/lib/pro/permissions';
import { eur } from '@/lib/pro/pricing';
import { STATUS_META } from '@/lib/pro/status';
import type { Status } from '@/lib/pro/types';
import { Btn, Card, EmptyState, ErrorState, inputCls, LoadingList, PageHeader, Segmented, StatusBadge } from '../ui';
import { useShell } from '../shell/ShellContext';
import { InterventionDrawer } from './Detail';

type View = 'table' | 'calendar' | 'kanban';

export function Interventions() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const { role } = useShell();
  const openId = params.get('id');
  const [view, setView] = useState<View>((params.get('vue') as View) ?? 'table');
  const { data, loading, error, reload } = useApi(listInterventions);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'all' | 'upcoming' | Status>('all');
  const [site, setSite] = useState('all');
  const [period, setPeriod] = useState<'all' | '3' | '6' | '12'>('all');

  const open = (id: string) => router.push(`${pathname}?id=${id}${view !== 'table' ? `&vue=${view}` : ''}`, { scroll: false });
  const close = () => router.push(`${pathname}${view !== 'table' ? `?vue=${view}` : ''}`, { scroll: false });

  const rows = useMemo(() => {
    if (!data) return [];
    const since = period === 'all' ? 0 : Date.now() - Number(period) * 30 * 86400000;
    return data.filter(
      (r) =>
        (status === 'all' || (status === 'upcoming' ? ['demandee', 'devis_envoye', 'devis_signe', 'planifiee', 'en_route', 'en_cours'].includes(r.status) : r.status === status)) &&
        (site === 'all' || r.siteId === site) &&
        new Date(r.slot?.date ?? r.createdAt).getTime() >= since,
    );
  }, [data, status, site, period]);

  const sites = useMemo(() => Array.from(new Map((data ?? []).map((r) => [r.siteId, r.site.label])).entries()), [data]);

  const exportCsv = () =>
    downloadCsv(`interventions-${format(new Date(), 'yyyy-MM-dd')}.csv`, [
      ['Référence', 'Statut', 'Site', 'Adresse', 'Date', 'Créneau', 'Volume m³', 'HT', 'TVA', 'TTC', 'Réf. interne', 'Bon de commande'],
      ...rows.map((r) => [r.ref, STATUS_META[r.status].label, r.site.label, `${r.site.address}, ${r.site.city}`, r.slot ? format(new Date(r.slot.date), 'dd/MM/yyyy') : '', r.slot?.window ?? '', String(r.content.volume).replace('.', ','), (r.ht / 100).toFixed(2).replace('.', ','), (r.tva / 100).toFixed(2).replace('.', ','), (r.ttc / 100).toFixed(2).replace('.', ','), r.internalRef ?? '', r.purchaseOrder ?? '']),
    ]);

  return (
    <div>
      <PageHeader
        title="Interventions"
        sub={data ? `${data.length} interventions sur 12 mois · ${data.filter((r) => ['planifiee', 'en_route', 'en_cours'].includes(r.status)).length} à venir` : 'Chargement…'}
        actions={
          <>
            <Btn onClick={exportCsv} disabled={!rows.length}>
              <Download className="h-4 w-4" /> Export CSV
            </Btn>
            {canAct(role, 'order') && (
              <Btn variant="primary" href="/pro/demandes/nouvelle">
                <Plus className="h-4 w-4" /> Nouvelle demande
              </Btn>
            )}
          </>
        }
      />

      <div className="mb-4 flex flex-col gap-2 lg:flex-row lg:items-center">
        <Segmented
          label="Vue"
          value={view}
          onChange={setView}
          options={[
            { value: 'table', label: <><Table2 className="h-4 w-4" /> Tableau</> },
            { value: 'calendar', label: <><CalendarDays className="h-4 w-4" /> Calendrier</> },
            { value: 'kanban', label: <><Columns3 className="h-4 w-4" /> Kanban</> },
          ]}
        />
        <div className="flex flex-1 flex-wrap gap-2 lg:justify-end">
          <div className="relative min-w-[180px] flex-1 lg:max-w-[260px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-p-muted" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Référence, site, adresse" className={cn(inputCls, 'pl-9')} aria-label="Rechercher" />
          </div>
          <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className={cn(inputCls, 'w-auto')} aria-label="Filtrer par statut">
            <option value="all">Tous les statuts</option>
            <option value="upcoming">En cours et à venir</option>
            {(Object.keys(STATUS_META) as Status[]).map((s) => (
              <option key={s} value={s}>
                {STATUS_META[s].label}
              </option>
            ))}
          </select>
          <select value={site} onChange={(e) => setSite(e.target.value)} className={cn(inputCls, 'w-auto max-w-[200px]')} aria-label="Filtrer par site">
            <option value="all">Tous les sites</option>
            {sites.map(([id, l]) => (
              <option key={id} value={id}>
                {l}
              </option>
            ))}
          </select>
          <select value={period} onChange={(e) => setPeriod(e.target.value as typeof period)} className={cn(inputCls, 'w-auto')} aria-label="Période">
            <option value="all">12 mois</option>
            <option value="3">3 derniers mois</option>
            <option value="6">6 derniers mois</option>
          </select>
        </div>
      </div>

      {error ? (
        <Card>
          <ErrorState message={error} onRetry={reload} />
        </Card>
      ) : loading ? (
        <Card>
          <LoadingList rows={8} />
        </Card>
      ) : view === 'table' ? (
        <TableView rows={rows} q={q} onOpen={open} />
      ) : view === 'calendar' ? (
        <CalendarView rows={rows.filter((r) => `${r.ref} ${r.site.label} ${r.site.address}`.toLowerCase().includes(q.toLowerCase()))} onOpen={open} />
      ) : (
        <KanbanView rows={rows.filter((r) => `${r.ref} ${r.site.label} ${r.site.address}`.toLowerCase().includes(q.toLowerCase()))} onOpen={open} />
      )}

      <InterventionDrawer id={openId} onClose={close} />
    </div>
  );
}

/* ---------- Tableau ---------- */
function TableView({ rows, q, onOpen }: { rows: InterventionRow[]; q: string; onOpen: (id: string) => void }) {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'date', desc: true }]);
  const columns = useMemo<ColumnDef<InterventionRow>[]>(
    () => [
      { id: 'ref', header: 'Référence', accessorKey: 'ref', cell: (c) => <span className="font-mono text-[13px] font-semibold">{c.getValue<string>()}</span> },
      { id: 'site', header: 'Site', accessorFn: (r) => `${r.site.label} ${r.site.address} ${r.site.city}`, cell: (c) => <span className="block max-w-[260px] truncate">{c.row.original.site.label}<span className="block truncate text-[12px] text-p-muted">{c.row.original.site.address}, {c.row.original.site.city}</span></span> },
      { id: 'date', header: 'Date', accessorFn: (r) => r.slot?.date ?? r.createdAt, cell: (c) => <span className="whitespace-nowrap">{c.row.original.slot ? format(new Date(c.row.original.slot.date), 'd MMM yyyy', { locale: fr }) : '—'}<span className="block text-[12px] text-p-muted">{c.row.original.slot?.window ?? 'À planifier'}</span></span> },
      { id: 'status', header: 'Statut', accessorFn: (r) => STATUS_META[r.status].label, cell: (c) => <StatusBadge status={c.row.original.status} /> },
      { id: 'volume', header: 'Volume', accessorFn: (r) => r.content.volume, cell: (c) => <span className="font-mono">{c.row.original.content.mode === 'box' ? `${c.row.original.content.boxes?.length} box` : `${c.getValue<number>().toLocaleString('fr-FR')} m³`}</span> },
      { id: 'ht', header: 'HT', accessorKey: 'ht', cell: (c) => <span className="font-mono">{c.getValue<number>() ? eur(c.getValue<number>()) : 'Inclus'}</span> },
    ],
    [],
  );
  const table = useReactTable({ data: rows, columns, state: { sorting, globalFilter: q }, onSortingChange: setSorting, getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel(), getFilteredRowModel: getFilteredRowModel(), globalFilterFn: 'includesString' });
  const list = table.getRowModel().rows;

  if (!list.length) return <Card><EmptyState title="Aucune intervention" text="Modifiez les filtres ou lancez une nouvelle demande." action={<Btn variant="primary" href="/pro/demandes/nouvelle">Nouvelle demande</Btn>} /></Card>;

  return (
    <Card className="overflow-hidden">
      <div className="pro-scroll hidden overflow-x-auto md:block">
        <table className="w-full text-[14px]">
          <thead className="border-b border-p-line bg-p-soft">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => (
                  <th key={h.id} className="px-4 py-2.5 text-left font-mono text-[10.5px] font-medium uppercase tracking-[0.12em] text-p-muted" aria-sort={h.column.getIsSorted() === 'asc' ? 'ascending' : h.column.getIsSorted() === 'desc' ? 'descending' : 'none'}>
                    <button onClick={h.column.getToggleSortingHandler()} className="inline-flex items-center gap-1 hover:text-p-text">
                      {flexRender(h.column.columnDef.header, h.getContext())}
                      {h.column.getIsSorted() === 'asc' ? <ArrowUp className="h-3 w-3" /> : h.column.getIsSorted() === 'desc' ? <ArrowDown className="h-3 w-3" /> : null}
                    </button>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <motion.tbody layout>
            <AnimatePresence initial={false}>
              {list.map((r) => (
                <motion.tr layout key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => onOpen(r.original.id)} onKeyDown={(e) => e.key === 'Enter' && onOpen(r.original.id)} tabIndex={0} className="cursor-pointer border-b border-p-line transition-colors last:border-0 hover:bg-p-hover focus-visible:bg-p-hover">
                  {r.getVisibleCells().map((c) => (
                    <td key={c.id} className="px-4 py-3 align-middle">
                      {flexRender(c.column.columnDef.cell, c.getContext())}
                    </td>
                  ))}
                </motion.tr>
              ))}
            </AnimatePresence>
          </motion.tbody>
        </table>
      </div>
      {/* mobile : cartes */}
      <ul className="divide-y divide-p-line md:hidden">
        {list.map((r) => (
          <li key={r.id}>
            <button onClick={() => onOpen(r.original.id)} className="flex w-full items-start gap-3 px-4 py-3.5 text-left hover:bg-p-hover">
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[13px] font-semibold">{r.original.ref}</span>
                  <StatusBadge status={r.original.status} />
                </span>
                <span className="mt-1 block truncate text-[14px] font-semibold">{r.original.site.label}</span>
                <span className="block text-[12.5px] text-p-muted">
                  {r.original.slot ? format(new Date(r.original.slot.date), 'EEE d MMM', { locale: fr }) : 'À planifier'} · {r.original.content.volume.toLocaleString('fr-FR')} m³ · {r.original.ht ? eur(r.original.ht) : 'Inclus'}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      <p className="border-t border-p-line px-4 py-2.5 text-[12.5px] text-p-muted">{list.length} résultat{list.length > 1 ? 's' : ''}</p>
    </Card>
  );
}

/* ---------- Calendrier ---------- */
function CalendarView({ rows, onOpen }: { rows: InterventionRow[]; onOpen: (id: string) => void }) {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [over, setOver] = useState<string | null>(null);
  const days = eachDayOfInterval({ start: startOfWeek(month, { weekStartsOn: 1 }), end: endOfWeek(endOfMonth(month), { weekStartsOn: 1 }) });
  const byDay = (d: Date) => rows.filter((r) => r.slot && isSameDay(new Date(r.slot.date), d));

  const drop = async (id: string, d: Date) => {
    const r = rows.find((x) => x.id === id);
    if (!r || r.status !== 'planifiee') return toast.error('Seules les interventions planifiées peuvent être déplacées.');
    if (d.getTime() < Date.now() + 86400000) return toast.error('Choisissez une date à partir d’après-demain.');
    const x = new Date(d);
    x.setHours(r.slot!.window.startsWith('8') ? 9 : 14, 0, 0, 0);
    try {
      await reschedule(id, x.toISOString(), r.slot!.window);
      toast.success(`Report demandé au ${format(x, 'EEEE d MMMM', { locale: fr })}`, { description: `${r.ref} · l’équipe confirme dans l’heure.` });
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-p-line px-4 py-3">
        <p className="text-[15px] font-semibold first-letter:uppercase">{format(month, 'MMMM yyyy', { locale: fr })}</p>
        <div className="flex gap-1">
          <Btn size="sm" variant="ghost" onClick={() => setMonth(addMonths(month, -1))} aria-label="Mois précédent">
            <ChevronLeft className="h-4 w-4" />
          </Btn>
          <Btn size="sm" onClick={() => setMonth(startOfMonth(new Date()))}>
            Aujourd’hui
          </Btn>
          <Btn size="sm" variant="ghost" onClick={() => setMonth(addMonths(month, 1))} aria-label="Mois suivant">
            <ChevronRight className="h-4 w-4" />
          </Btn>
        </div>
      </div>
      <div className="grid grid-cols-7 border-b border-p-line bg-p-soft text-center font-mono text-[10.5px] uppercase tracking-[0.12em] text-p-muted">
        {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((d) => (
          <span key={d} className="py-2">
            {d}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((d) => {
          const list = byDay(d);
          const key = d.toISOString();
          const today = isSameDay(d, new Date());
          return (
            <div
              key={key}
              onDragOver={(e) => {
                e.preventDefault();
                setOver(key);
              }}
              onDragLeave={() => setOver((o) => (o === key ? null : o))}
              onDrop={(e) => {
                e.preventDefault();
                setOver(null);
                void drop(e.dataTransfer.getData('text/plain'), d);
              }}
              className={cn('min-h-[86px] border-b border-r border-p-line p-1 transition-colors sm:min-h-[112px] sm:p-1.5', !isSameMonth(d, month) && 'bg-p-soft/60 opacity-60', over === key && 'bg-signal-soft dark:bg-signal/10')}
            >
              <span className={cn('inline-grid h-6 w-6 place-items-center rounded-full text-[12px] font-semibold', today && 'bg-signal text-navy')}>{d.getDate()}</span>
              <div className="mt-1 space-y-1">
                {list.slice(0, 3).map((r) => (
                  <button
                    key={r.id}
                    draggable={r.status === 'planifiee'}
                    onDragStart={(e) => e.dataTransfer.setData('text/plain', r.id)}
                    onClick={() => onOpen(r.id)}
                    title={`${r.ref} · ${r.site.label} · ${STATUS_META[r.status].label}`}
                    className={cn('flex w-full items-center gap-1 truncate rounded-[6px] px-1.5 py-1 text-left text-[11px] font-semibold', STATUS_META[r.status].className, r.status === 'planifiee' && 'cursor-grab active:cursor-grabbing')}
                  >
                    <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', STATUS_META[r.status].dot, STATUS_META[r.status].pulse && 'pro-pulse')} />
                    <span className="hidden truncate sm:inline">{r.site.label}</span>
                    <span className="sr-only">{STATUS_META[r.status].label}</span>
                  </button>
                ))}
                {list.length > 3 && <p className="px-1 text-[11px] text-p-muted">+ {list.length - 3}</p>}
              </div>
            </div>
          );
        })}
      </div>
      <p className="px-4 py-2.5 text-[12.5px] text-p-muted">Astuce : glissez une intervention planifiée vers une autre date pour demander un report.</p>
    </Card>
  );
}

/* ---------- Kanban ---------- */
const COLS: { title: string; statuses: Status[] }[] = [
  { title: 'Demandée', statuses: ['demandee'] },
  { title: 'Devis envoyé', statuses: ['devis_envoye'] },
  { title: 'Devis signé', statuses: ['devis_signe'] },
  { title: 'Planifiée', statuses: ['planifiee'] },
  { title: 'En route · en cours', statuses: ['en_route', 'en_cours'] },
  { title: 'Terminée', statuses: ['terminee', 'rapport_dispo'] },
];

function KanbanView({ rows, onOpen }: { rows: InterventionRow[]; onOpen: (id: string) => void }) {
  return (
    <div className="pro-scroll -mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
      <div className="grid min-w-[1080px] grid-cols-6 gap-3">
        {COLS.map((c) => {
          const list = rows.filter((r) => c.statuses.includes(r.status)).slice(0, c.statuses.includes('rapport_dispo') ? 8 : 50);
          return (
            <div key={c.title} className="rounded-[14px] border border-p-line bg-p-soft p-2">
              <p className="flex items-center justify-between px-1.5 pb-2 pt-1 text-[13px] font-semibold">
                {c.title}
                <span className="rounded-full bg-p-card px-2 font-mono text-[11px] text-p-muted">{rows.filter((r) => c.statuses.includes(r.status)).length}</span>
              </p>
              <motion.ul layout className="space-y-2">
                <AnimatePresence>
                  {list.map((r) => (
                    <motion.li key={r.id} layout initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ type: 'spring', stiffness: 400, damping: 32 }}>
                      <button onClick={() => onOpen(r.id)} className="w-full rounded-[12px] border border-p-line bg-p-card p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                        <span className="flex items-center justify-between gap-1">
                          <span className="font-mono text-[11.5px] font-semibold">{r.ref}</span>
                          {c.statuses.length > 1 && <StatusBadge status={r.status} className="h-5 px-2 text-[10.5px]" />}
                        </span>
                        <span className="mt-1.5 block truncate text-[13px] font-semibold">{r.site.label}</span>
                        <span className="mt-0.5 block text-[12px] text-p-muted">
                          {r.slot ? format(new Date(r.slot.date), 'd MMM', { locale: fr }) : 'À planifier'} · {r.content.volume.toLocaleString('fr-FR')} m³
                        </span>
                      </button>
                    </motion.li>
                  ))}
                </AnimatePresence>
                {list.length === 0 && <li className="rounded-[10px] border border-dashed border-p-line p-3 text-center text-[12px] text-p-muted">Vide</li>}
              </motion.ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
