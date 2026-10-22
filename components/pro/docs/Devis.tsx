'use client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, FileSignature, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/cn';
import { getDevis, listDevis, refuseDevis, signDevis } from '@/lib/pro/api';
import { useApi } from '@/lib/pro/hooks';
import { canAct } from '@/lib/pro/permissions';
import { eur } from '@/lib/pro/pricing';
import type { Devis } from '@/lib/pro/types';
import { Btn, Card, EmptyState, ErrorState, inputCls, LoadingList, PageHeader, Pill, Segmented, StatusBadge } from '../ui';
import { useShell } from '../shell/ShellContext';
import { DocFrame, LinesTable } from './DocFrame';
import { SignaturePad } from './SignaturePad';

export const DEVIS_STATUS: Record<Devis['status'], { label: string; tone: 'yellow' | 'green' | 'red' | 'grey' }> = {
  a_signer: { label: 'À signer', tone: 'yellow' },
  signe: { label: 'Signé', tone: 'green' },
  refuse: { label: 'Refusé', tone: 'red' },
  expire: { label: 'Expiré', tone: 'grey' },
};

export function DevisList() {
  const { data, loading, error, reload } = useApi(listDevis);
  const [f, setF] = useState<'all' | Devis['status']>('all');
  const list = (data ?? []).filter((d) => f === 'all' || d.status === f);
  const n = (s: Devis['status']) => (data ?? []).filter((d) => d.status === s).length;

  return (
    <div>
      <PageHeader title="Devis" sub="Signez en ligne en 30 secondes. Validité 30 jours." />
      <div className="mb-4">
        <Segmented
          label="Filtre devis"
          value={f}
          onChange={setF}
          options={[
            { value: 'all', label: 'Tous' },
            { value: 'a_signer', label: <>À signer {n('a_signer') > 0 && <span className="rounded-full bg-signal px-1.5 text-[11px] text-navy">{n('a_signer')}</span>}</> },
            { value: 'signe', label: 'Signés' },
            { value: 'refuse', label: 'Refusés' },
            { value: 'expire', label: 'Expirés' },
          ]}
        />
      </div>
      <Card className="overflow-hidden" data-tour="devis-list">
        {error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : loading ? (
          <LoadingList rows={6} />
        ) : list.length === 0 ? (
          <EmptyState art="doc" title="Aucun devis ici" text="Les devis arrivent dès que nos équipes ont validé vos photos." />
        ) : (
          <ul className="divide-y divide-p-line">
            {list.map((d, i) => (
              <motion.li key={d.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 10) * 0.03 }}>
                <Link href={`/pro/devis/${d.id}`} className={cn('grid gap-2 px-4 py-3.5 transition hover:bg-p-hover sm:grid-cols-[1.2fr_1fr_auto_auto] sm:items-center sm:gap-4 sm:px-5', d.status === 'a_signer' && 'bg-signal-soft/50 dark:bg-signal/5')}>
                  <span className="min-w-0">
                    <span className="font-mono text-[13px] font-semibold">{d.ref}</span>
                    <span className="block truncate text-[13.5px] text-p-muted">{d.intervention.site.label}</span>
                  </span>
                  <span className="text-[13px] text-p-muted">
                    Émis le {format(new Date(d.issuedAt), 'd MMM yyyy', { locale: fr })}
                    {d.status === 'a_signer' && <span className="block font-semibold text-p-text">Valable jusqu’au {format(new Date(d.validUntil), 'd MMM', { locale: fr })}</span>}
                  </span>
                  <span className="font-mono text-[14px] font-semibold sm:text-right">{eur(d.ht)} HT</span>
                  <span className="sm:text-right">
                    <Pill tone={DEVIS_STATUS[d.status].tone}>{DEVIS_STATUS[d.status].label}</Pill>
                  </span>
                </Link>
              </motion.li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

export function DevisPage({ id }: { id: string }) {
  const { role, user } = useShell();
  const { data: d, loading, error, reload } = useApi(() => getDevis(id), [id]);
  const [sig, setSig] = useState<string | null>(null);
  const [agree, setAgree] = useState(false);
  const [name, setName] = useState(`${user.firstName} ${user.lastName}`);
  const [refusing, setRefusing] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  if (error) return <Card><ErrorState message={error} onRetry={reload} /></Card>;
  if (loading || !d) return <Card><LoadingList rows={10} /></Card>;

  const sign = async () => {
    if (!sig || !agree || name.trim().length < 3) return;
    setBusy(true);
    try {
      await signDevis(d.id, { dataUrl: sig, name: name.trim() });
      toast.success('Devis signé', { description: `${d.intervention.ref} passe à « Devis signé ». L’équipe planifie le passage.` });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const refuse = async () => {
    if (reason.trim().length < 3) return;
    setBusy(true);
    try {
      await refuseDevis(d.id, reason.trim());
      toast('Devis refusé', { description: 'Merci pour votre retour, nous restons disponibles.' });
      setRefusing(false);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <DocFrame
      kind="Devis"
      number={d.ref}
      date={`Émis le ${format(new Date(d.issuedAt), 'd MMMM yyyy', { locale: fr })}`}
      aside={
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <p className="font-semibold">Statut</p>
            <Pill tone={DEVIS_STATUS[d.status].tone}>{DEVIS_STATUS[d.status].label}</Pill>
          </div>
          <p className="mt-1 text-[13px] text-p-muted">
            Intervention <span className="font-mono">{d.intervention.ref}</span> · <StatusBadge status={d.intervention.status} className="ml-1" />
          </p>
          <AnimatePresence mode="wait">
            {d.status === 'a_signer' && canAct(role, 'sign') ? (
              refusing ? (
                <motion.div key="refuse" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-5">
                  <label htmlFor="reason" className="text-[13px] font-semibold">
                    Motif du refus
                  </label>
                  <textarea id="reason" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} className={cn(inputCls, 'mt-1.5 h-auto py-2')} placeholder="Ex. budget, volume revu à la baisse…" />
                  <div className="mt-3 flex gap-2">
                    <Btn variant="danger" disabled={busy || reason.trim().length < 3} onClick={() => void refuse()}>
                      Confirmer le refus
                    </Btn>
                    <Btn variant="ghost" onClick={() => setRefusing(false)}>
                      Retour
                    </Btn>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="sign" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-5">
                  <p className="mb-2 flex items-center gap-2 text-[14px] font-semibold">
                    <FileSignature className="h-4 w-4" /> Signature électronique
                  </p>
                  <SignaturePad onChange={setSig} />
                  <label htmlFor="signer" className="mt-3 block text-[13px] font-semibold">
                    Nom du signataire
                  </label>
                  <input id="signer" value={name} onChange={(e) => setName(e.target.value)} className={cn(inputCls, 'mt-1.5')} />
                  <label className="mt-3 flex items-start gap-2.5 text-[13.5px]">
                    <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#2F9E6E]" />
                    <span>
                      <strong>Bon pour accord</strong> · j’accepte le devis et les conditions générales de vente.
                    </span>
                  </label>
                  <p className="mt-2 text-[12px] text-p-muted">Horodatage : {format(new Date(), "d MMMM yyyy 'à' HH:mm", { locale: fr })}</p>
                  <Btn variant="primary" size="lg" className="mt-4 w-full" disabled={!sig || !agree || busy || name.trim().length < 3} onClick={() => void sign()}>
                    {busy ? 'Signature…' : `Signer · ${eur(d.ttc)} TTC`}
                  </Btn>
                  <button onClick={() => setRefusing(true)} className="mt-3 w-full text-center text-[13px] font-semibold text-p-muted hover:text-[#B4442A]">
                    Refuser ce devis
                  </button>
                </motion.div>
              )
            ) : d.status === 'signe' ? (
              <motion.div key="ok" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mt-5 rounded-[12px] bg-tri-soft p-4 text-tri-dark dark:bg-tri/15 dark:text-[#7FD9AF]">
                <p className="flex items-center gap-2 font-semibold">
                  <CheckCircle2 className="h-5 w-5" /> Signé
                </p>
                {d.signature?.at && <p className="mt-1 text-[13px]">Par {d.signature.name} le {format(new Date(d.signature.at), "d MMMM yyyy 'à' HH:mm", { locale: fr })}</p>}
                <Btn className="mt-3" href={`/pro/interventions?id=${d.interventionId}`}>
                  Suivre l’intervention
                </Btn>
              </motion.div>
            ) : d.status === 'refuse' ? (
              <div className="mt-5 rounded-[12px] bg-[#FBE9E5] p-4 text-[#9A3412] dark:bg-[#9A3412]/25 dark:text-[#F5B7A6]">
                <p className="flex items-center gap-2 font-semibold">
                  <XCircle className="h-5 w-5" /> Refusé
                </p>
                {d.refusal && <p className="mt-1 text-[13px]">Motif : {d.refusal}</p>}
              </div>
            ) : (
              <p className="mt-5 text-[13.5px] text-p-muted">{d.status === 'expire' ? 'Ce devis a expiré. Relancez une demande pour un nouveau prix.' : 'Votre rôle ne permet pas de signer.'}</p>
            )}
          </AnimatePresence>
        </Card>
      }
    >
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-[#56646E]">Client</p>
          <p className="mt-1.5 font-semibold">{d.org.name}</p>
          <p className="text-[13px] text-[#56646E]">{d.org.billingAddress}</p>
          <p className="text-[13px] text-[#56646E]">SIRET {d.org.siret}</p>
        </div>
        <div>
          <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-[#56646E]">Intervention</p>
          <p className="mt-1.5 font-semibold">{d.intervention.site.label}</p>
          <p className="text-[13px] text-[#56646E]">
            {d.intervention.site.address}, {d.intervention.site.postalCode} {d.intervention.site.city}
          </p>
          <p className="text-[13px] text-[#56646E]">
            {d.intervention.content.mode === 'box' ? `Box ${d.intervention.content.boxes?.join(', ')}` : `${d.intervention.content.volume.toLocaleString('fr-FR')} m³ estimés`} · réf. {d.intervention.ref}
          </p>
        </div>
      </div>
      <div className="mt-8">
        <LinesTable lines={d.lines} ht={d.ht} tva={d.tva} ttc={d.ttc} />
      </div>
      <div className="mt-8 grid gap-6 text-[12px] leading-relaxed text-[#56646E] sm:grid-cols-2">
        <div>
          <p className="font-semibold text-navy">Conditions</p>
          <p className="mt-1">
            Devis valable 30 jours, jusqu’au {format(new Date(d.validUntil), 'd MMMM yyyy', { locale: fr })}. Prix ferme sur la base des photos transmises. Si le volume réel dépasse de plus de 20 %, un nouveau prix est proposé avant de commencer. Paiement à 30 jours fin de mois par virement.
          </p>
        </div>
        <div>
          <p className="font-semibold text-navy">Bon pour accord</p>
          {d.signature?.dataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={d.signature.dataUrl} alt={`Signature de ${d.signature.name}`} className="mt-2 h-20 w-auto" />
          ) : (
            <div className="mt-2 h-20 rounded border border-dashed border-[#C2CBD2]" />
          )}
          {d.signature && (
            <p>
              {d.signature.name} · {format(new Date(d.signature.at), "d/MM/yyyy 'à' HH:mm", { locale: fr })}
            </p>
          )}
        </div>
      </div>
    </DocFrame>
  );
}
