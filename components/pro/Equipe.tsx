'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, motion } from 'framer-motion';
import { MailPlus, ShieldCheck } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { cn } from '@/lib/cn';
import { auth, inviteMember, listTeam, setRole } from '@/lib/pro/api';
import { useApi } from '@/lib/pro/hooks';
import { canAct, ROLE_HINT, ROLE_LABEL } from '@/lib/pro/permissions';
import type { Role } from '@/lib/pro/types';
import { UserAvatar } from './Avatar';
import { Btn, Card, CardHeader, ErrorState, Field, inputCls, LoadingList, PageHeader, Pill } from './ui';
import { useShell } from './shell/ShellContext';

const schema = z.object({ email: z.string().email('Adresse e-mail invalide.'), role: z.enum(['admin', 'gestionnaire', 'comptable']) });

const MATRIX: [string, Record<Role, boolean>][] = [
  ['Commander et suivre', { admin: true, gestionnaire: true, comptable: false }],
  ['Signer les devis', { admin: true, gestionnaire: true, comptable: false }],
  ['Factures et paiements', { admin: true, gestionnaire: false, comptable: true }],
  ['Documents et bordereaux', { admin: true, gestionnaire: true, comptable: true }],
  ['Abonnement et équipe', { admin: true, gestionnaire: false, comptable: false }],
];

export function Equipe() {
  const { role, user } = useShell();
  const { data, loading, error, reload } = useApi(listTeam);
  const form = useForm<{ email: string; role: Role }>({ resolver: zodResolver(schema), defaultValues: { email: '', role: 'gestionnaire' } });
  const manage = canAct(role, 'manageTeam');

  const invite = form.handleSubmit(async (v) => {
    try {
      await inviteMember(v.email, v.role);
      toast.success('Invitation envoyée (simulation)', { description: `${v.email} · ${ROLE_LABEL[v.role]}` });
      form.reset({ email: '', role: v.role });
    } catch (e) {
      toast.error((e as Error).message);
    }
  });

  return (
    <div>
      <PageHeader title="Équipe" sub="Chaque rôle ne voit que ce qui le concerne." />
      <Card className="mb-4 p-5">
        <p className="text-[15px] font-semibold">Voir en tant que</p>
        <p className="text-[13px] text-p-muted">Testez les permissions : les pages et boutons non autorisés disparaissent réellement.</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Voir en tant que">
          {(['admin', 'gestionnaire', 'comptable'] as Role[]).map((r) => (
            <button key={r} role="radio" aria-checked={role === r} onClick={() => auth.viewAs(r)} className={cn('rounded-[12px] border p-3.5 text-left transition', role === r ? 'border-navy bg-navy text-white dark:border-signal dark:bg-signal dark:text-navy' : 'border-p-line hover:bg-p-hover')}>
              <span className="block text-[14px] font-semibold">{ROLE_LABEL[r]}</span>
              <span className="text-[12.5px] opacity-75">{ROLE_HINT[r]}</span>
            </button>
          ))}
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Card className="overflow-hidden">
          <CardHeader title="Membres" sub={data ? `${data.length} personne${data.length > 1 ? 's' : ''}` : ''} />
          {error ? (
            <ErrorState message={error} onRetry={reload} />
          ) : loading || !data ? (
            <LoadingList rows={4} />
          ) : (
            <ul className="mt-2 divide-y divide-p-line">
              <AnimatePresence initial={false}>
                {data.map((m) => (
                  <motion.li key={m.id} layout initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 px-5 py-3">
                    <UserAvatar seed={m.avatarSeed} name={`${m.firstName} ${m.lastName}`} className="h-10 w-10" />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2 text-[14px] font-semibold">
                        {m.firstName} {m.lastName} {m.id === user.id && <Pill tone="navy">Vous</Pill>} {m.invited && <Pill tone="yellow">Invitation envoyée</Pill>}
                      </span>
                      <span className="block truncate text-[12.5px] text-p-muted">{m.email}</span>
                    </span>
                    {manage && m.id !== user.id ? (
                      <select
                        value={m.role}
                        onChange={async (e) => {
                          try {
                            await setRole(m.id, e.target.value as Role);
                            toast.success(`${m.firstName} est maintenant ${ROLE_LABEL[e.target.value as Role].toLowerCase()}`);
                          } catch (err) {
                            toast.error((err as Error).message);
                          }
                        }}
                        className={inputCls.replace('w-full', 'w-auto')}
                        aria-label={`Rôle de ${m.firstName}`}
                      >
                        {(['admin', 'gestionnaire', 'comptable'] as Role[]).map((r) => (
                          <option key={r} value={r}>
                            {ROLE_LABEL[r]}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <Pill>{ROLE_LABEL[m.role]}</Pill>
                    )}
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}
        </Card>
        <div className="space-y-4">
          <Card className="p-5">
            <p className="flex items-center gap-2 text-[15px] font-semibold">
              <MailPlus className="h-4 w-4" /> Inviter un membre
            </p>
            {manage ? (
              <form onSubmit={invite} className="mt-3 space-y-3" noValidate>
                <Field label="E-mail" htmlFor="inv-email" error={form.formState.errors.email?.message}>
                  <input id="inv-email" type="email" {...form.register('email')} className={inputCls} placeholder="prenom.nom@entreprise.fr" />
                </Field>
                <Field label="Rôle" htmlFor="inv-role">
                  <select id="inv-role" {...form.register('role')} className={inputCls}>
                    {(['admin', 'gestionnaire', 'comptable'] as Role[]).map((r) => (
                      <option key={r} value={r}>
                        {ROLE_LABEL[r]} · {ROLE_HINT[r]}
                      </option>
                    ))}
                  </select>
                </Field>
                <Btn variant="primary" type="submit" className="w-full">
                  Envoyer l’invitation
                </Btn>
              </form>
            ) : (
              <p className="mt-2 text-[13.5px] text-p-muted">Seul un administrateur peut inviter des membres.</p>
            )}
          </Card>
          <Card className="p-5">
            <p className="flex items-center gap-2 text-[15px] font-semibold">
              <ShieldCheck className="h-4 w-4" /> Permissions
            </p>
            <table className="mt-3 w-full text-[12.5px]">
              <thead>
                <tr className="text-left text-p-muted">
                  <th className="pb-2 font-medium" />
                  {(['admin', 'gestionnaire', 'comptable'] as Role[]).map((r) => (
                    <th key={r} className="pb-2 text-center font-medium">
                      {ROLE_LABEL[r].slice(0, 5)}.
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MATRIX.map(([l, v]) => (
                  <tr key={l} className="border-t border-p-line">
                    <td className="py-2 pr-2">{l}</td>
                    {(['admin', 'gestionnaire', 'comptable'] as Role[]).map((r) => (
                      <td key={r} className="py-2 text-center">
                        {v[r] ? <span className="text-tri" aria-label="Oui">●</span> : <span className="text-p-muted" aria-label="Non">–</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      </div>
    </div>
  );
}
