'use client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Check, Copy, Download } from 'lucide-react';
import qrcode from 'qrcode-generator';
import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Counter } from '@/components/ui/Counter';
import { listReferrals } from '@/lib/pro/api';
import { useApi } from '@/lib/pro/hooks';
import { eur } from '@/lib/pro/pricing';
import { Btn, Card, CardHeader, ErrorState, LoadingList, PageHeader, Pill } from './ui';
import { useShell } from './shell/ShellContext';

function QR({ text }: { text: string }) {
  const svg = useMemo(() => {
    const q = qrcode(0, 'M');
    q.addData(text);
    q.make();
    return q.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
  }, [text]);
  return <div className="aspect-square w-full max-w-[180px] rounded-[12px] bg-white p-2 [&_svg]:h-full [&_svg]:w-full" role="img" aria-label="QR code du lien de recommandation" dangerouslySetInnerHTML={{ __html: svg }} />;
}

export function Partenaires() {
  const { org } = useShell();
  const { data, loading, error, reload } = useApi(listReferrals);
  const [copied, setCopied] = useState(false);
  const link = `https://express-debarras.vercel.app/?parrain=${org.referralCode ?? 'DEMO'}`;
  const total = (data ?? []).reduce((s, r) => s + r.commission, 0);
  const paid = (data ?? []).filter((r) => r.paid).reduce((s, r) => s + r.commission, 0);
  const jobs = (data ?? []).reduce((s, r) => s + r.jobs, 0);
  const monthly = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
      const k = `${d.getFullYear()}-${d.getMonth()}`;
      const v = (data ?? []).filter((r) => {
        const x = new Date(r.date);
        return `${x.getFullYear()}-${x.getMonth()}` === k;
      });
      return { month: format(d, 'MMM', { locale: fr }).replace('.', ''), commission: v.reduce((s, r) => s + r.commission, 0) / 100 };
    });
  }, [data]);

  if (error) return <Card><ErrorState message={error} onRetry={reload} /></Card>;

  return (
    <div>
      <PageHeader title="Programme partenaires" sub="Recommandez Express Débarras à vos propriétaires et locataires : 5 % de commission sur chaque chantier." />
      <div className="grid gap-4 lg:grid-cols-[1fr_1.3fr]">
        <Card className="p-5">
          <p className="text-[15px] font-semibold">Votre lien de recommandation</p>
          <div className="mt-3 flex gap-2">
            <code className="min-w-0 flex-1 truncate rounded-[10px] bg-p-soft px-3 py-2.5 font-mono text-[13px]">{link}</code>
            <Btn
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(link);
                } catch {
                  /* indisponible */
                }
                setCopied(true);
                setTimeout(() => setCopied(false), 1600);
              }}
              aria-label="Copier le lien"
            >
              {copied ? <Check className="h-4 w-4 text-tri" /> : <Copy className="h-4 w-4" />}
            </Btn>
          </div>
          <div className="mt-5 flex items-center gap-5">
            <QR text={link} />
            <div className="text-[13.5px] text-p-muted">
              <p>Imprimez ce QR code sur vos états des lieux de sortie ou affichez-le en agence.</p>
              <Btn size="sm" className="mt-3" onClick={() => window.print()}>
                <Download className="h-4 w-4" /> Imprimer
              </Btn>
            </div>
          </div>
        </Card>
        <div className="grid grid-cols-2 gap-3">
          {[
            ['Clients apportés', (data ?? []).length, (n: number) => String(Math.round(n))],
            ['Chantiers réalisés', jobs, (n: number) => String(Math.round(n))],
            ['Commission cumulée', total / 100, (n: number) => `${Math.round(n).toLocaleString('fr-FR')} €`],
            ['Déjà versé', paid / 100, (n: number) => `${Math.round(n).toLocaleString('fr-FR')} €`],
          ].map(([l, v, f]) => (
            <Card key={l as string} className="p-5">
              <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-p-muted">{l as string}</p>
              <p className="mt-2 font-display text-[28px] leading-none tracking-[-0.035em]">{loading ? '…' : <Counter value={v as number} format={f as (n: number) => string} />}</p>
            </Card>
          ))}
        </div>
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-[1.2fr_1fr]">
        <Card>
          <CardHeader title="Commissions par mois" sub="€ HT" />
          <div className="h-[240px] px-2 pb-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly} margin={{ top: 16, right: 12, left: -16, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--p-line)" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: 'var(--p-muted)', fontSize: 12 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: 'var(--p-muted)', fontSize: 12 }} />
                <Tooltip cursor={{ fill: 'var(--p-soft)' }} contentStyle={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 10, color: 'var(--p-text)', fontSize: 13 }} formatter={(v: number) => [`${v.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} €`, 'Commission']} />
                <Bar dataKey="commission" fill="#2F9E6E" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="overflow-hidden">
          <CardHeader title="Clients apportés" />
          {loading || !data ? (
            <LoadingList rows={5} />
          ) : (
            <ul className="mt-2 divide-y divide-p-line">
              {data.map((r) => (
                <li key={r.id} className="flex items-center gap-3 px-5 py-3">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-semibold">{r.client}</span>
                    <span className="block text-[12.5px] text-p-muted">
                      {format(new Date(r.date), 'd MMM yyyy', { locale: fr })} · {r.jobs} chantier{r.jobs > 1 ? 's' : ''} · {eur(r.revenueHt)} HT
                    </span>
                  </span>
                  <span className="text-right">
                    <span className="block font-mono text-[13.5px] font-semibold">{eur(r.commission)}</span>
                    <Pill tone={r.paid ? 'green' : 'yellow'}>{r.paid ? 'Versée' : 'À verser'}</Pill>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
      <p className="mt-4 text-[12.5px] text-p-muted">Clients fictifs de démonstration. Commission versée par virement le mois suivant la fin du chantier.</p>
    </div>
  );
}
