import type { Metadata } from 'next';
import { Mail, MessageCircle, Phone, MapPin } from 'lucide-react';
import { PageHero } from '@/components/pages/PageHero';
import { CopyField } from '@/components/pages/CopyField';
import { Container, Section } from '@/components/ui/Section';
import { BRAND } from '@/lib/data';

export const metadata: Metadata = { title: 'Contact', description: 'WhatsApp, téléphone, e-mail : contactez Express Débarras à Rouen.' };

export default function ContactPage() {
  return (
    <>
      <PageHero label="Contact" title="Une photo suffit pour commencer." lead="Envoyez-la par WhatsApp, appelez-nous ou écrivez-nous. Réponse en moins d’1 h, 7 j / 7 de 8 h à 20 h." />
      <Section tone="kraft">
        <Container className="grid max-w-3xl grid-cols-1 gap-4">
          <CopyField label="WhatsApp" value={BRAND.whatsapp} href={`https://wa.me/33${BRAND.whatsapp.replace(/\s/g, '').slice(1)}`} icon={<MessageCircle className="h-5 w-5" />} />
          <CopyField label="Téléphone" value={BRAND.phone} href={`tel:${BRAND.phone.replace(/\s/g, '')}`} icon={<Phone className="h-5 w-5" />} />
          <CopyField label="E-mail" value={BRAND.email} href={`mailto:${BRAND.email}`} icon={<Mail className="h-5 w-5" />} />
          <div className="flex items-center gap-4 rounded-[22px] bg-white/60 p-5 ring-1 ring-line">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white"><MapPin className="h-5 w-5" /></span>
            <p className="text-[15.5px]">
              <strong>Zone d’intervention :</strong> {BRAND.zone}. Au-delà de 30 km : 1 € / km.
            </p>
          </div>
          <p className="mt-2 text-[13px] text-navy/70">Coordonnées de démonstration, remplacées par les coordonnées réelles au lancement.</p>
        </Container>
      </Section>
    </>
  );
}
