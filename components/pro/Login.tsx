'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Building2, KeyRound, Mail, Store, Warehouse } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast, Toaster } from 'sonner';
import { z } from 'zod';
import { LogoMark } from '@/components/brand/Logo';
import { Counter } from '@/components/ui/Counter';
import { cn } from '@/lib/cn';
import { auth } from '@/lib/pro/api';
import { useProStore } from '@/lib/pro/store';
import { inputCls } from './ui';

const schema = z.object({ email: z.string().min(1, 'Indiquez votre e-mail.').email('Adresse e-mail invalide.') });

const DEMOS = [
  { id: 'org-seine', name: 'Agence Seine & Pierre', sub: 'Agence immobilière · Pro Plus', icon: Building2 },
  { id: 'org-stock', name: 'StockBox Rive Gauche', sub: 'Self-stockage · forfaits Box', icon: Warehouse },
  { id: 'org-atelier', name: 'Atelier Cauchoise', sub: 'PME, 2 sites · Pro Essentiel', icon: Store },
];

export function Login() {
  const router = useRouter();
  const theme = useProStore((s) => s.prefs.theme);
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [code, setCode] = useState('');
  const [typed, setTyped] = useState(['', '', '', '', '', '']);
  const [busy, setBusy] = useState<string | null>(null);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const { register, handleSubmit, formState, getValues } = useForm<{ email: string }>({ resolver: zodResolver(schema) });

  const send = handleSubmit(async ({ email }) => {
    setBusy('email');
    try {
      const c = await auth.sendCode(email);
      setCode(c);
      setStep('code');
      toast('Lien magique envoyé (simulation)', { description: `Votre code : ${c}`, duration: 15000 });
      setTimeout(() => inputs.current[0]?.focus(), 100);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  });

  const verify = async (value: string) => {
    if (value.length < 6) return;
    if (value !== code) {
      toast.error('Code incorrect');
      setTyped(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
      return;
    }
    setBusy('code');
    await auth.loginDemo('org-seine');
    router.push('/pro');
  };

  const demo = async (id: string) => {
    setBusy(id);
    await auth.loginDemo(id);
    router.push('/pro');
  };

  return (
    <div className={cn('pro grid min-h-screen lg:grid-cols-[1fr_1.05fr]', theme === 'dark' && 'dark')}>
      <div className="flex flex-col px-5 py-6 sm:px-10 lg:px-16">
        <div className="flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 text-[13.5px] font-semibold text-p-muted hover:text-p-text">
            <ArrowLeft className="h-4 w-4" /> Retour au site
          </Link>
          <span className="rounded-full bg-signal px-2.5 py-1 text-[11.5px] font-bold text-navy">Données de démonstration</span>
        </div>
        <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center py-10">
          <span className="grid h-14 w-14 place-items-center rounded-[16px] bg-navy shadow-lg">
            <LogoMark dark className="h-8 w-11" />
          </span>
          <h1 className="mt-7 font-display text-[34px] leading-[1] tracking-[-0.04em]">Votre espace pro</h1>
          <p className="mt-3 text-[15px] text-p-muted">Commandez, suivez et retrouvez tous vos documents de débarras.</p>

          {step === 'email' ? (
            <form onSubmit={send} className="mt-8" noValidate>
              <label htmlFor="email" className="mb-1.5 block text-[13px] font-semibold">
                E-mail professionnel
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-p-muted" />
                <input id="email" type="email" autoComplete="email" placeholder="vous@entreprise.fr" {...register('email')} aria-invalid={!!formState.errors.email} className={cn(inputCls, 'h-12 pl-9')} />
              </div>
              {formState.errors.email && <p className="mt-1 text-[12.5px] text-[#B4442A]">{formState.errors.email.message}</p>}
              <button disabled={!!busy} className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-[12px] bg-navy text-[15px] font-semibold text-white transition hover:bg-navy-700 disabled:opacity-60 dark:bg-white dark:text-navy">
                {busy === 'email' ? 'Envoi…' : 'Recevoir un lien magique'} <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          ) : (
            <div className="mt-8">
              <p className="text-[14px] text-p-muted">
                Code envoyé à <strong className="text-p-text">{getValues('email')}</strong>
              </p>
              <div className="mt-3 flex gap-2" role="group" aria-label="Code à 6 chiffres">
                {typed.map((v, i) => (
                  <input
                    key={i}
                    ref={(el) => {
                      inputs.current[i] = el;
                    }}
                    inputMode="numeric"
                    maxLength={1}
                    value={v}
                    aria-label={`Chiffre ${i + 1}`}
                    onPaste={(e) => {
                      const t = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
                      if (t.length === 6) {
                        e.preventDefault();
                        setTyped(t.split(''));
                        void verify(t);
                      }
                    }}
                    onKeyDown={(e) => e.key === 'Backspace' && !v && i > 0 && inputs.current[i - 1]?.focus()}
                    onChange={(e) => {
                      const d = e.target.value.replace(/\D/g, '').slice(-1);
                      const next = [...typed];
                      next[i] = d;
                      setTyped(next);
                      if (d && i < 5) inputs.current[i + 1]?.focus();
                      void verify(next.join(''));
                    }}
                    className="h-14 w-full rounded-[12px] border border-p-line bg-p-card text-center font-mono text-[22px] font-semibold outline-none focus:border-navy focus:ring-2 focus:ring-signal/50"
                  />
                ))}
              </div>
              <button onClick={() => setStep('email')} className="mt-3 text-[13px] font-semibold text-p-muted hover:text-p-text">
                Changer d’adresse
              </button>
            </div>
          )}

          <div className="my-8 flex items-center gap-3 text-[12px] text-p-muted">
            <span className="h-px flex-1 bg-p-line" /> ou testez directement <span className="h-px flex-1 bg-p-line" />
          </div>
          <div className="space-y-2.5">
            {DEMOS.map((d) => (
              <button
                key={d.id}
                onClick={() => void demo(d.id)}
                disabled={!!busy}
                className="group flex w-full items-center gap-3 rounded-[14px] border border-p-line bg-p-card p-3 text-left transition hover:-translate-y-0.5 hover:border-signal hover:shadow-lg disabled:opacity-60"
              >
                <span className="grid h-11 w-11 place-items-center rounded-[12px] bg-signal-soft text-navy dark:bg-signal/15 dark:text-signal">
                  <d.icon className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[14.5px] font-semibold">Se connecter en démo · {d.name}</span>
                  <span className="block text-[12.5px] text-p-muted">{d.sub}</span>
                </span>
                {busy === d.id ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-signal border-t-transparent" /> : <ArrowRight className="h-4 w-4 text-p-muted transition group-hover:translate-x-1" />}
              </button>
            ))}
          </div>
          <p className="mt-6 flex items-center gap-2 text-[12.5px] text-p-muted">
            <KeyRound className="h-3.5 w-3.5" /> Organisations fictives. Tout reste dans votre navigateur.
          </p>
        </div>
      </div>
      <Showcase />
      <Toaster theme={theme} position="top-center" richColors />
    </div>
  );
}

function Showcase() {
  const reduce = useReducedMotion();
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (reduce) return;
    const t = setInterval(() => setTick((x) => x + 1), 2600);
    return () => clearInterval(t);
  }, [reduce]);
  const bars = [40, 55, 38, 62, 70, 48, 66, 74, 58, 80, 68, 86].map((v, i) => Math.max(18, (v + ((tick * 7 + i * 13) % 17)) % 100));
  return (
    <div className="on-dark relative hidden overflow-hidden bg-navy p-12 text-white lg:flex lg:flex-col lg:justify-between">
      <div aria-hidden className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-signal/20 blur-3xl" />
      <div className="relative">
        <p className="font-mono text-[11.5px] uppercase tracking-[0.16em] text-signal">Express Débarras · Pro</p>
        <p className="mt-4 max-w-md font-display text-[44px] leading-[0.98] tracking-[-0.045em]">
          La déchetterie vient à vous.
          <br />
          <span className="text-white/60">Même pour 220 box.</span>
        </p>
      </div>
      <motion.div initial={reduce ? false : { opacity: 0, y: 30, rotateX: 18 }} animate={{ opacity: 1, y: 0, rotateX: 8 }} transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }} style={{ transformPerspective: 1200 }} className="relative mt-10 rounded-[18px] bg-[#F7F8FA] p-4 text-navy shadow-2xl">
        <div className="grid grid-cols-4 gap-2.5">
          {[
            { l: 'Interventions', v: 6 + (tick % 3), f: (n: number) => String(Math.round(n)) },
            { l: 'm³ évacués', v: 48 + (tick % 5) * 3, f: (n: number) => `${Math.round(n)}` },
            { l: 'Valorisé', v: 64 + (tick % 4), f: (n: number) => `${Math.round(n)} %` },
            { l: 'Dépenses HT', v: 2140 + (tick % 4) * 120, f: (n: number) => `${Math.round(n).toLocaleString('fr-FR')} €` },
          ].map((k) => (
            <div key={k.l} className="rounded-[10px] border border-[#E6E8EB] bg-white p-2.5">
              <p className="font-mono text-[8.5px] uppercase tracking-[0.12em] text-[#56646E]">{k.l}</p>
              <p className="mt-1 font-display text-[18px] leading-none tracking-[-0.03em]">
                <Counter value={k.v} format={k.f} />
              </p>
            </div>
          ))}
        </div>
        <div className="mt-2.5 grid grid-cols-[1.5fr_1fr] gap-2.5">
          <div className="rounded-[10px] border border-[#E6E8EB] bg-white p-3">
            <p className="text-[10.5px] font-semibold">Volume évacué par mois</p>
            <div className="mt-2 flex h-24 items-end gap-1">
              {bars.map((h, i) => (
                <motion.div key={i} className="flex-1 overflow-hidden rounded-t-[3px] bg-[#C9D0D6]" animate={{ height: `${h}%` }} transition={{ type: 'spring', stiffness: 120, damping: 16 }}>
                  <div className="h-[65%] bg-tri" />
                </motion.div>
              ))}
            </div>
          </div>
          <div className="rounded-[10px] border border-[#E6E8EB] bg-white p-3">
            <p className="text-[10.5px] font-semibold">Prochaine intervention</p>
            <p className="mt-1 font-display text-[16px] tracking-[-0.02em]">Dans 2 jours</p>
            <div className="relative mt-3 h-2 rounded-full bg-[#F1F3F5]">
              <motion.div className="absolute inset-y-0 left-0 rounded-full bg-signal" animate={{ width: `${30 + (tick % 4) * 18}%` }} />
            </div>
            <p className="mt-2 text-[10px] text-[#56646E]">Max et Noa · 8 h – 12 h</p>
          </div>
        </div>
      </motion.div>
      <p className="relative mt-8 text-[13px] text-white/60">Devis signés en ligne · suivi du camion en direct · rapports de tri et bordereaux prêts pour l’audit.</p>
    </div>
  );
}
