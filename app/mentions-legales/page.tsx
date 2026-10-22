import type { Metadata } from 'next';
import { Field, LegalPage } from '@/components/pages/LegalPage';
import { BRAND } from '@/lib/data';

export const metadata: Metadata = { title: 'Mentions légales' };

export default function MentionsPage() {
  return (
    <LegalPage
      label="Légal"
      title="Mentions légales"
      sections={[
        {
          h: 'Éditeur du site',
          p: [
            <>Express Débarras, SAS au capital de <Field>[capital]</Field> €, immatriculée au RCS de Rouen sous le numéro <Field>[SIRET]</Field>.</>,
            <>Siège social : <Field>[adresse]</Field>, 76000 Rouen. Téléphone : <Field>[téléphone]</Field>. E-mail : {BRAND.email}.</>,
            <>Directeur de la publication : Max, Président. Numéro de TVA intracommunautaire : <Field>[TVA]</Field>.</>,
          ],
        },
        { h: 'Hébergement', p: ['Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis.'] },
        {
          h: 'Propriété intellectuelle',
          p: ['L’ensemble des textes, illustrations et logos de ce site sont la propriété d’Express Débarras. Toute reproduction sans autorisation est interdite.'],
        },
        {
          h: 'Données personnelles',
          p: [
            'Les informations saisies dans les formulaires servent uniquement à traiter votre demande de devis ou de réservation. Elles ne sont ni vendues ni cédées.',
            <>Vous disposez d’un droit d’accès, de rectification et de suppression : écrivez à {BRAND.email}. Référent données : <Field>[nom du référent]</Field>.</>,
            'Version de démonstration : aucune donnée n’est transmise, tout reste dans votre navigateur.',
          ],
        },
        { h: 'Cookies', p: ['Seuls des cookies de mesure d’audience sont utilisés, après votre accord. Votre choix est conservé dans votre navigateur.'] },
        { h: 'Projet pédagogique', p: ['Ce site est un projet de création d’entreprise réalisé dans le cadre du BTS NDRC.'] },
      ]}
    />
  );
}
