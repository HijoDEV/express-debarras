'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { Compass, Mail, MessageSquareText, Moon, RotateCcw, Sun, WifiOff } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { cn } from '@/lib/cn';
import { resetDemo, updateOrg } from '@/lib/pro/api';
import { canAct } from '@/lib/pro/permissions';
import { useProStore } from '@/lib/pro/store';
import { Btn, Card, CardHeader, Field, inputCls, Modal, PageHeader, Switch } from './ui';
import { useShell } from './shell/ShellContext';

const schema = z.object({
  name: z.string().min(2, 'Raison sociale requise'),
  siret: z.string().refine((v) => v === '[à compléter]' || /^\d{14}$/.test(v.replace(/\s/g, '')), '14 chiffres'),
  billingAddress: z.string().min(6, 'Adresse requise'),
});

export function Parametres() {
  const { org, role, theme, toggleTheme, startTour } = useShell();
  const prefs = useProStore((s) => s.prefs);
  const setPrefs = useProStore((s) => s.setPrefs);
  const [confirm, setConfirm] = useState(false);
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { name: org.name, siret: org.siret, billingAddress: org.billingAddress } });
  const admin = canAct(role, 'manageTeam');

  const save = form.handleSubmit(async (v) => {
    try {
      await updateOrg(v);
      toast.success('Entreprise mise à jour');
    } catch (e) {
      toast.error((e as Error).message);
    }
  });

  return (
    <div>
      <PageHeader title="Paramètres" />
      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader title="Entreprise" sub="Informations reprises sur vos devis et factures" />
          <form onSubmit={save} className="grid gap-3 px-5 pb-5 pt-3" noValidate>
            <Field label="Raison sociale" htmlFor="org-name" error={form.formState.errors.name?.message}>
              <input id="org-name" {...form.register('name')} disabled={!admin} className={inputCls} />
            </Field>
            <Field label="SIRET" htmlFor="org-siret" error={form.formState.errors.siret?.message} hint="14 chiffres">
              <input id="org-siret" {...form.register('siret')} disabled={!admin} className={cn(inputCls, 'font-mono')} />
            </Field>
            <Field label="Adresse de facturation" htmlFor="org-addr" error={form.formState.errors.billingAddress?.message}>
              <input id="org-addr" {...form.register('billingAddress')} disabled={!admin} className={inputCls} />
            </Field>
            {admin ? (
              <Btn variant="primary" type="submit" className="justify-self-start">
                Enregistrer
              </Btn>
            ) : (
              <p className="text-[13px] text-p-muted">Modification réservée à l’administrateur.</p>
            )}
          </form>
        </Card>

        <Card>
          <CardHeader title="Notifications" sub="Choisissez le canal pour chaque événement" />
          <table className="mx-5 mb-5 mt-2 w-[calc(100%-40px)] text-[14px]">
            <thead>
              <tr className="text-left text-[12px] text-p-muted">
                <th className="pb-2 font-medium">Événement</th>
                <th className="pb-2 text-center font-medium">
                  <Mail className="mx-auto h-4 w-4" aria-label="E-mail" />
                </th>
                <th className="pb-2 text-center font-medium">
                  <MessageSquareText className="mx-auto h-4 w-4" aria-label="SMS" />
                </th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(prefs.notif).map(([ev, ch]) => (
                <tr key={ev} className="border-t border-p-line">
                  <td className="py-2.5 pr-2">{ev}</td>
                  {(['email', 'sms'] as const).map((c) => (
                    <td key={c} className="py-2.5 text-center">
                      <span className="inline-flex">
                        <Switch checked={ch[c]} label={`${ev} par ${c === 'email' ? 'e-mail' : 'SMS'}`} onChange={(v) => setPrefs({ notif: { ...prefs.notif, [ev]: { ...ch, [c]: v } } })} />
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card>
          <CardHeader title="Affichage" />
          <div className="space-y-4 px-5 pb-5 pt-3">
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-[14px] font-semibold">{theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />} Thème sombre</span>
              <Switch checked={theme === 'dark'} onChange={toggleTheme} label="Thème sombre" />
            </div>
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="lang" className="text-[14px] font-semibold">
                Langue
              </label>
              <select id="lang" value={prefs.lang} onChange={(e) => setPrefs({ lang: e.target.value as 'fr' | 'en' })} className={inputCls.replace('w-full', 'w-auto')}>
                <option value="fr">Français</option>
                <option value="en">English (bientôt)</option>
              </select>
            </div>
            <Btn onClick={startTour}>
              <Compass className="h-4 w-4" /> Relancer la visite guidée
            </Btn>
          </div>
        </Card>

        <Card>
          <CardHeader title="Démonstration" sub="Outils pour l’oral" />
          <div className="space-y-4 px-5 pb-5 pt-3">
            <div className="flex items-start justify-between gap-3">
              <span>
                <span className="flex items-center gap-2 text-[14px] font-semibold">
                  <WifiOff className="h-4 w-4" /> Simuler des erreurs réseau
                </span>
                <span className="block text-[12.5px] text-p-muted">Une action sur trois échoue : la modification est annulée et un bouton « Réessayer » apparaît.</span>
              </span>
              <Switch checked={prefs.simulateErrors} onChange={(v) => setPrefs({ simulateErrors: v })} label="Simuler des erreurs réseau" />
            </div>
            <Btn variant="danger" onClick={() => setConfirm(true)}>
              <RotateCcw className="h-4 w-4" /> Réinitialiser la démo
            </Btn>
          </div>
        </Card>
      </div>

      <Modal open={confirm} onClose={() => setConfirm(false)} title="Réinitialiser la démo ?">
        <p className="text-[14.5px] text-p-muted">Toutes les données des 3 organisations reviennent à leur état initial : demandes créées, signatures, messages et réglages de visite.</p>
        <div className="mt-5 flex gap-2">
          <Btn
            variant="danger"
            onClick={async () => {
              await resetDemo();
              setConfirm(false);
              toast.success('Démo réinitialisée');
            }}
          >
            Réinitialiser
          </Btn>
          <Btn variant="ghost" onClick={() => setConfirm(false)}>
            Annuler
          </Btn>
        </div>
      </Modal>
    </div>
  );
}
