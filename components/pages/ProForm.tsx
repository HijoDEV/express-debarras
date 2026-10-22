'use client';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/cn';

const NEEDS = ['Débarras ponctuel', 'Pro Essentiel (mensuel)', 'Pro Plus (2 passages / mois)', 'Forfait Box', 'Je ne sais pas encore'];

export function ProForm() {
  const [f, setF] = useState({ company: '', siret: '', name: '', email: '', phone: '', need: NEEDS[0], message: '' });
  const [sent, setSent] = useState(false);
  const [touched, setTouched] = useState(false);
  const err = {
    company: f.company.trim().length < 2,
    name: f.name.trim().length < 2,
    email: !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email),
    phone: !/^(\+33\s?|0)[1-9](\s?\d{2}){4}$/.test(f.phone.trim()),
  };
  const ok = !Object.values(err).some(Boolean);

  const input = (k: keyof typeof f, label: string, opts: { type?: string; auto?: string; ph?: string; required?: boolean } = {}) => (
    <div>
      <label htmlFor={`p-${k}`} className="block text-[14px] font-semibold">
        {label} {opts.required === false && <span className="font-normal text-navy/70">(facultatif)</span>}
      </label>
      <input
        id={`p-${k}`}
        type={opts.type ?? 'text'}
        autoComplete={opts.auto}
        placeholder={opts.ph}
        value={f[k]}
        onChange={(e) => setF({ ...f, [k]: e.target.value })}
        aria-invalid={touched && k in err && err[k as keyof typeof err]}
        className={cn('mt-1.5 h-12 w-full rounded-xl bg-kraft px-4 text-[16px] outline-none ring-1 focus:bg-white focus:ring-navy', touched && k in err && err[k as keyof typeof err] ? 'ring-[#C0392B]' : 'ring-transparent')}
      />
    </div>
  );

  return (
    <div className="rounded-[28px] bg-white p-6 shadow-lift ring-1 ring-line sm:p-9">
      <AnimatePresence mode="wait">
        {sent ? (
          <motion.div key="ok" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="py-10 text-center">
            <CheckCircle2 className="mx-auto h-14 w-14 text-tri" />
            <p className="mt-5 font-display text-h3">Demande enregistrée.</p>
            <p className="mt-2 text-navy/70">Nous revenons vers {f.company} sous 24 h ouvrées avec une proposition de contrat.</p>
            <p className="mt-4 text-[13px] text-navy/70">Démonstration : rien n’a été envoyé.</p>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              setTouched(true);
              if (ok) setSent(true);
            }}
          >
            <p className="font-display text-h3">Demande de contrat</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {input('company', 'Entreprise', { auto: 'organization', ph: 'SARL Exemple' })}
              {input('siret', 'SIRET', { ph: '123 456 789 00012', required: false })}
              {input('name', 'Contact', { auto: 'name', ph: 'Prénom Nom' })}
              {input('phone', 'Téléphone', { type: 'tel', auto: 'tel', ph: '02 35 00 00 00' })}
              <div className="sm:col-span-2">{input('email', 'E-mail', { type: 'email', auto: 'email', ph: 'contact@entreprise.fr' })}</div>
              <div className="sm:col-span-2">
                <label htmlFor="p-need" className="block text-[14px] font-semibold">
                  Besoin
                </label>
                <select id="p-need" value={f.need} onChange={(e) => setF({ ...f, need: e.target.value })} className="mt-1.5 h-12 w-full rounded-xl bg-kraft px-4 text-[16px] outline-none ring-1 ring-transparent focus:bg-white focus:ring-navy">
                  {NEEDS.map((n) => (
                    <option key={n}>{n}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="p-message" className="block text-[14px] font-semibold">
                  Précisions <span className="font-normal text-navy/70">(facultatif)</span>
                </label>
                <textarea id="p-message" rows={4} value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} placeholder="Type de local, volumes, fréquence…" className="mt-1.5 w-full rounded-xl bg-kraft p-4 text-[16px] outline-none ring-1 ring-transparent focus:bg-white focus:ring-navy" />
              </div>
            </div>
            {touched && !ok && <p className="mt-4 text-[14px] text-[#B03A2E]">Vérifiez les champs entourés en rouge.</p>}
            <button type="submit" className="group mt-6 inline-flex h-14 w-full items-center justify-center gap-2 rounded-btn bg-signal font-semibold text-navy shadow-signal transition hover:-translate-y-0.5">
              Envoyer la demande <ArrowRight className="h-[18px] w-[18px] transition-transform group-hover:translate-x-1" />
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
