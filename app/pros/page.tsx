import type { Metadata } from 'next';
import { ClipboardCheck, FileText, Receipt, Truck } from 'lucide-react';
import { PageHero } from '@/components/pages/PageHero';
import { ButtonLink } from '@/components/ui/Button';
import { ProForm } from '@/components/pages/ProForm';
import { Container, Section } from '@/components/ui/Section';
import { Label } from '@/components/ui/Label';
import { Reveal } from '@/components/ui/Reveal';
import { PRO_OFFERS } from '@/lib/data';
import { cn } from '@/lib/cn';
import { Check } from 'lucide-react';

export const metadata: Metadata = { title: 'Espace pro', description: 'Débarras professionnel à Rouen : 45 € HT / m³, abonnements dès 129 € HT / mois, bordereau de traçabilité inclus.' };

const BENEFITS = [
  { icon: Receipt, t: 'Facture HT', d: 'TVA récupérable, facture mensuelle unique pour les abonnements.' },
  { icon: FileText, t: 'Bordereau de traçabilité', d: 'Chaque enlèvement est tracé jusqu’à sa filière. Inclus dans toutes les offres.' },
  { icon: Truck, t: 'Créneaux fixes', d: 'Un jour de passage récurrent, sans relance de votre part.' },
  { icon: ClipboardCheck, t: 'Interlocuteur unique', d: 'Un seul contact pour le devis, le planning et la facturation.' },
];

export default function ProsPage() {
  return (
    <>
      <PageHero
        label="Espace pro"
        title={
          <>
            Vos locaux dégagés.
            <br />
            <span className="text-beton-600">Votre comptable rassuré.</span>
          </>
        }
        lead="Agences immobilières, commerces, bureaux, artisans, bailleurs : un débarras propre, tracé et facturé en HT."
      >
        <div className="mt-8 flex flex-wrap gap-3" data-tour="pros-cta">
          <ButtonLink href="/pro/connexion" arrow>
            Se connecter à l’espace pro
          </ButtonLink>
          <ButtonLink href="#contrat" variant="secondary">
            Demander un contrat
          </ButtonLink>
        </div>
      </PageHero>
      <Section tone="kraft">
        <Container>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" data-tour="pros-offers">
            {PRO_OFFERS.map((o, i) => {
              const dark = 'popular' in o && o.popular;
              return (
                <Reveal key={o.id} delay={i * 0.06}>
                  <div className={cn('relative flex h-full flex-col rounded-[24px] p-6 transition duration-300 hover:-translate-y-1 hover:shadow-lift', dark ? 'on-dark bg-navy text-white shadow-lift' : 'bg-white ring-1 ring-line')}>
                    {dark && <span className="absolute -top-3 left-6 rounded-full bg-signal px-3 py-1 text-[12px] font-semibold text-navy">Le plus choisi</span>}
                    <p className="font-display text-[22px] tracking-[-0.02em]">{o.name}</p>
                    <p className={cn('mt-4 font-display text-[34px] leading-none tight', dark && 'text-signal')}>{o.price}</p>
                    <p className={cn('mt-1 text-[13px]', dark ? 'text-white/60' : 'text-navy/70')}>HT · {o.detail}</p>
                    <ul className="mt-5 space-y-2 text-[14px]">
                      {o.features.map((x) => (
                        <li key={x} className="flex gap-2">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-tri" /> {x}
                        </li>
                      ))}
                    </ul>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </Container>
      </Section>
      <Section>
        <Container className="grid items-start gap-12 lg:grid-cols-2">
          <div>
            <Label>Pourquoi nous</Label>
            <h2 className="mt-4 font-display text-h2">Pensé pour les professionnels</h2>
            <div className="mt-10 grid gap-6 sm:grid-cols-2">
              {BENEFITS.map((b) => (
                <div key={b.t}>
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-signal">
                    <b.icon className="h-5 w-5" />
                  </span>
                  <p className="mt-4 text-[17px] font-semibold">{b.t}</p>
                  <p className="mt-1.5 text-[14.5px] leading-relaxed text-navy/65">{b.d}</p>
                </div>
              ))}
            </div>
            <div className="mt-10 rounded-[22px] bg-kraft p-6 font-mono text-[13px]">
              <p className="text-[11px] uppercase tracking-[0.18em] text-navy/70">Extrait de bordereau</p>
              <div className="my-3 dotted-sep" />
              {[
                ['Mobilier de bureau', 'Réemploi associatif', '4,0 m³'],
                ['Archives papier', 'Recyclage papier', '1,5 m³'],
                ['Postes informatiques', 'Filière DEEE', '0,8 m³'],
                ['Divers', 'Tout-venant', '2,2 m³'],
              ].map(([a, b, c]) => (
                <div key={a} className="flex justify-between gap-3 py-1">
                  <span>{a}</span>
                  <span className="text-navy/70">{b}</span>
                  <span>{c}</span>
                </div>
              ))}
            </div>
          </div>
          <div id="contrat" data-tour="pros-form">
            <ProForm />
          </div>
        </Container>
      </Section>
    </>
  );
}
