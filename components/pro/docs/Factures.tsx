'use client';
import { flexRender, getCoreRowModel, getSortedRowModel, useReactTable, type ColumnDef, type SortingState } from '@tanstack/react-table';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ArrowDown, ArrowUp, Check, Copy, Download, Landmark } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Counter } from '@/components/ui/Counter';
import { cn } from '@/lib/cn';
import { getFacture, listFactures, payInvoice } from '@/lib/pro/api';
import { downloadCsv } from '@/lib/pro/csv';
import { useApi } from '@/lib/pro/hooks';
import { canAct } from '@/lib/pro/permissions';
import { eur } from '@/lib/pro/pricing';
import type { Facture } from '@/lib/pro/types';
import { Btn, Card, EmptyState, ErrorState, LoadingList, Modal, PageHeader, Pill } from '../ui';
import { useShell } from '../shell/ShellContext';
import { DocFrame, LinesTable } from './DocFrame';

export const FACT_STATUS: Record<Facture['status'], { label: string; tone: 'green' | 'yellow' | 'red' }> = {
  payee: { label: 'Payée', tone: 'green' },
  a_payer: { label: 'À payer', tone: 'yellow' },
  en_retard: { label: 'En retard', tone: 'red' },
};

const RIB = { titulaire: 'EXPRESS DEBARRAS (fictif)', iban: 'FR76 0000 0000 0000 0000 0000 000', bic: 'DEMOFRPPXXX' };

export function PayModal({ f, open, onClose }: { f: Facture | null; open: boolean; onClose: () => void }) {
  const [copied, setCopied] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const copy = async (k: string, v: string) => {
    try {
      await navigator.clipboard.writeText(v);
    } catch {
      /* presse-papiers indisponible */
    }
    setCopied(k);
    setTimeout(() => setCopied(null), 1500);
  };
  if (!f) return null;
  return (
    <Modal open={open} onClose={onClose} title={`Payer ${f.number} par virement`}>
      <p className="text-[14px] text-p-muted">Montant à régler</p>
      <p className="font-display text-[34px] leading-none tracking-[-0.04em]">{eur(f.ttc)}</p>
      <dl className="mt-5 space-y-2">
        {[
          ['Titulaire', RIB.titulaire],
          ['IBAN', RIB.iban],
          ['BIC', RIB.bic],
          ['Référence à indiquer', f.number],
        ].map(([k, v]) => (
          <div key={k} className="flex items-center justify-between gap-3 rounded-[10px] bg-p-soft px-3 py-2.5">
            <div className="min-w-0">
              <dt className="text-[12px] text-p-muted">{k}</dt>
              <dd className="truncate font-mono text-[13.5px] font-semibold">{v}</dd>
            </div>
            <button onClick={() => void copy(k, v)} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg hover:bg-p-hover" aria-label={`Copier ${k}`}>
              {copied === k ? <Check className="h-4 w-4 text-tri" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-[12.5px] text-p-muted">RIB fictif de démonstration : aucun paiement n’est possible.</p>
      <Btn
        variant="primary"
        className="mt-5 w-full"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            await payInvoice(f.id);
            toast.success('Virement enregistré', { description: `${f.number} est marquée comme payée (démo).` });
            onClose();
          } catch (e) {
            toast.error((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <Landmark className="h-4 w-4" /> J’ai effectué le virement
      </Btn>
    </Modal>
  );
}

type Row = Awaited<ReturnType<typeof listFactures>>[number];

export function FacturesList() {
  const router = useRouter();
  const { role } = useShell();
  const { data, loading, error, reload } = useApi(listFactures);
  const [sorting, setSorting] = useState<SortingState>([{ id: 'date', desc: true }]);
  const [pay, setPay] = useState<Facture | null>(null);
  const year = new Date().getFullYear();
  const sum = (fn: (f: Row) => boolean) => (data ?? []).filter(fn).reduce((s, f) => s + f.ttc, 0);

  const columns = useMemo<ColumnDef<Row>[]>(
    () => [
      { id: 'number', header: 'Numéro', accessorKey: 'number', cell: (c) => <span className="font-mono text-[13px] font-semibold">{c.getValue<string>()}</span> },
      { id: 'date', header: 'Date', accessorKey: 'issuedAt', cell: (c) => format(new Date(c.getValue<string>()), 'd MMM yyyy', { locale: fr }) },
      { id: 'label', header: 'Objet', accessorFn: (r) => r.label, cell: (c) => <span className="block max-w-[260px] truncate">{c.row.original.intervention ? c.row.original.intervention.ref : c.getValue<string>()}</span> },
      { id: 'ht', header: 'HT', accessorKey: 'ht', cell: (c) => <span className="font-mono">{eur(c.getValue<number>())}</span> },
      { id: 'tva', header: 'TVA', accessorKey: 'tva', cell: (c) => <span className="font-mono text-p-muted">{eur(c.getValue<number>())}</span> },
      { id: 'ttc', header: 'TTC', accessorKey: 'ttc', cell: (c) => <span className="font-mono font-semibold">{eur(c.getValue<number>())}</span> },
      { id: 'status', header: 'Statut', accessorKey: 'status', cell: (c) => <Pill tone={FACT_STATUS[c.row.original.status].tone}>{FACT_STATUS[c.row.original.status].label}</Pill> },
      {
        id: 'act',
        header: '',
        enableSorting: false,
        cell: (c) =>
          c.row.original.status !== 'payee' && canAct(role, 'pay') ? (
            <Btn
              size="sm"
              variant="primary"
              onClick={(e) => {
                e.stopPropagation();
                setPay(c.row.original);
              }}
            >
              Payer
            </Btn>
          ) : null,
      },
    ],
    [role],
  );
  const table = useReactTable({ data: data ?? [], columns, state: { sorting }, onSortingChange: setSorting, getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel() });

  const exportCsv = () =>
    downloadCsv(`factures-${year}.csv`, [
      ['Numéro', 'Date', 'Échéance', 'Objet', 'HT', 'TVA', 'TTC', 'Statut', 'Payée le'],
      ...(data ?? []).map((f) => [f.number, format(new Date(f.issuedAt), 'dd/MM/yyyy'), format(new Date(f.dueAt), 'dd/MM/yyyy'), f.label, (f.ht / 100).toFixed(2).replace('.', ','), (f.tva / 100).toFixed(2).replace('.', ','), (f.ttc / 100).toFixed(2).replace('.', ','), FACT_STATUS[f.status].label, f.paidAt ? format(new Date(f.paidAt), 'dd/MM/yyyy') : '']),
    ]);

  return (
    <div>
      <PageHeader title="Factures" sub="Export comptable et paiement par virement" actions={<Btn onClick={exportCsv} disabled={!data?.length}><Download className="h-4 w-4" /> Export CSV</Btn>} />
      <div className="mb-4 grid gap-3 sm:grid-cols-3" data-tour="fac-kpis">
        {[
          { l: `Payé en ${year}`, v: sum((f) => f.status === 'payee' && new Date(f.issuedAt).getFullYear() === year), c: 'text-tri-dark dark:text-[#7FD9AF]' },
          { l: 'À payer', v: sum((f) => f.status === 'a_payer'), c: '' },
          { l: 'En retard', v: sum((f) => f.status === 'en_retard'), c: 'text-[#B4442A] dark:text-[#F5B7A6]' },
        ].map((k) => (
          <Card key={k.l} className="p-5">
            <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-p-muted">{k.l} · TTC</p>
            <p className={cn('mt-2 font-display text-[30px] leading-none tracking-[-0.035em]', k.c)}>{loading ? '…' : <Counter value={k.v / 100} format={(n) => `${Math.round(n).toLocaleString('fr-FR')} €`} />}</p>
          </Card>
        ))}
      </div>
      <Card className="overflow-hidden" data-tour="fac-list">
        {error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : loading ? (
          <LoadingList rows={8} />
        ) : !data?.length ? (
          <EmptyState art="doc" title="Aucune facture" text="Vos factures apparaîtront après la première intervention." />
        ) : (
          <>
            <div className="pro-scroll hidden overflow-x-auto md:block">
              <table className="w-full text-[14px]">
                <thead className="border-b border-p-line bg-p-soft">
                  {table.getHeaderGroups().map((hg) => (
                    <tr key={hg.id}>
                      {hg.headers.map((h) => (
                        <th key={h.id} className="px-4 py-2.5 text-left font-mono text-[10.5px] font-medium uppercase tracking-[0.12em] text-p-muted">
                          {h.column.getCanSort() ? (
                            <button onClick={h.column.getToggleSortingHandler()} className="inline-flex items-center gap-1 hover:text-p-text">
                              {flexRender(h.column.columnDef.header, h.getContext())}
                              {h.column.getIsSorted() === 'asc' ? <ArrowUp className="h-3 w-3" /> : h.column.getIsSorted() === 'desc' ? <ArrowDown className="h-3 w-3" /> : null}
                            </button>
                          ) : null}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.map((r) => (
                    <tr key={r.id} onClick={() => router.push(`/pro/factures/${r.original.id}`)} tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && router.push(`/pro/factures/${r.original.id}`)} className={cn('cursor-pointer border-b border-p-line transition-colors last:border-0 hover:bg-p-hover', r.original.status === 'en_retard' && 'bg-[#FBE9E5]/40 dark:bg-[#9A3412]/10')}>
                      {r.getVisibleCells().map((c) => (
                        <td key={c.id} className="px-4 py-3">
                          {flexRender(c.column.columnDef.cell, c.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="divide-y divide-p-line md:hidden">
              {table.getRowModel().rows.map(({ original: f }) => (
                <li key={f.id} className="flex items-center gap-3 px-4 py-3.5">
                  <Link href={`/pro/factures/${f.id}`} className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[13px] font-semibold">{f.number}</span>
                      <Pill tone={FACT_STATUS[f.status].tone}>{FACT_STATUS[f.status].label}</Pill>
                    </span>
                    <span className="mt-1 block text-[13px] text-p-muted">
                      {format(new Date(f.issuedAt), 'd MMM yyyy', { locale: fr })} · <span className="font-mono font-semibold text-p-text">{eur(f.ttc)}</span> TTC
                    </span>
                  </Link>
                  {f.status !== 'payee' && canAct(role, 'pay') && (
                    <Btn size="sm" variant="primary" onClick={() => setPay(f)}>
                      Payer
                    </Btn>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>
      <PayModal f={pay} open={!!pay} onClose={() => setPay(null)} />
    </div>
  );
}

export function FacturePage({ id }: { id: string }) {
  const { role } = useShell();
  const { data: f, loading, error, reload } = useApi(() => getFacture(id), [id]);
  const [pay, setPay] = useState(false);
  if (error) return <Card><ErrorState message={error} onRetry={reload} /></Card>;
  if (loading || !f) return <Card><LoadingList rows={10} /></Card>;
  return (
    <>
      <DocFrame
        kind="Facture"
        number={f.number}
        date={`Émise le ${format(new Date(f.issuedAt), 'd MMMM yyyy', { locale: fr })}`}
        actions={
          f.status !== 'payee' && canAct(role, 'pay') ? (
            <Btn variant="primary" onClick={() => setPay(true)}>
              <Landmark className="h-4 w-4" /> Payer par virement
            </Btn>
          ) : undefined
        }
      >
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-[#56646E]">Facturé à</p>
            <p className="mt-1.5 font-semibold">{f.org.name}</p>
            <p className="text-[13px] text-[#56646E]">{f.org.billingAddress}</p>
            <p className="text-[13px] text-[#56646E]">SIRET {f.org.siret}</p>
          </div>
          <div className="sm:text-right">
            <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-[#56646E]">Échéance</p>
            <p className="mt-1.5 font-semibold">{format(new Date(f.dueAt), 'd MMMM yyyy', { locale: fr })}</p>
            <p className="mt-2 inline-block">
              <Pill tone={FACT_STATUS[f.status].tone}>{FACT_STATUS[f.status].label}</Pill>
            </p>
            {f.intervention && <p className="mt-2 text-[13px] text-[#56646E]">Intervention {f.intervention.ref} · {f.intervention.site.label}</p>}
          </div>
        </div>
        <p className="mt-8 text-[14px] font-semibold">{f.label}</p>
        <div className="mt-3">
          <LinesTable lines={f.lines} ht={f.ht} tva={f.tva} ttc={f.ttc} />
        </div>
        <div className="mt-8 rounded-[10px] bg-[#F7F8FA] p-4 text-[12px] leading-relaxed text-[#56646E]">
          <p className="font-semibold text-navy">Règlement par virement</p>
          <p className="mt-1 font-mono">
            {RIB.titulaire} · IBAN {RIB.iban} · BIC {RIB.bic}
          </p>
          <p className="mt-1">Pénalités de retard : 3 fois le taux d’intérêt légal. Indemnité forfaitaire pour frais de recouvrement : 40 €. Pas d’escompte pour paiement anticipé.</p>
        </div>
      </DocFrame>
      <PayModal f={f} open={pay} onClose={() => setPay(false)} />
    </>
  );
}
