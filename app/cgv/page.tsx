import type { Metadata } from 'next';
import { Field, LegalPage } from '@/components/pages/LegalPage';

export const metadata: Metadata = { title: 'Conditions générales de vente' };

export default function CgvPage() {
  return (
    <LegalPage
      label="Légal"
      title="Conditions générales de vente"
      sections={[
        { h: '1. Objet', p: [<>Les présentes conditions régissent les prestations de débarras réalisées par Express Débarras (SIRET <Field>[SIRET]</Field>) auprès des particuliers et des professionnels.</>] },
        {
          id: 'prix',
          h: '2. Prix et garantie de prix',
          p: [
            'Les prix sont exprimés en euros TTC pour les particuliers et HT pour les professionnels. Le prix est établi sur la base des photos transmises par le client.',
            'Prix garanti : le prix annoncé est le prix payé. Si le volume constaté sur place dépasse de plus de 20 % le volume visible sur les photos, Express Débarras propose un nouveau prix avant de commencer. Le client est libre de l’accepter ou d’annuler sans frais.',
            'Majorations : urgence 24 h + 20 %, samedi + 15 %, calculées sur la formule de base.',
          ],
        },
        { h: '3. Réservation et acompte', p: ['La réservation est confirmée par le versement d’un acompte de 30 %. Le solde est réglé à la fin de l’intervention.'] },
        { h: '4. Annulation', p: ['Annulation gratuite jusqu’à 48 h avant l’intervention : l’acompte est remboursé. Au-delà, l’acompte reste acquis.'] },
        {
          h: '5. Objets exclus',
          p: ['Express Débarras ne prend pas en charge l’amiante, les produits chimiques industriels, les déchets médicaux et les matières dangereuses. Le client s’engage à les signaler.'],
        },
        { h: '6. Objets de valeur', p: ['Les objets de valeur découverts sont signalés au client. Leur rachat éventuel fait l’objet d’un accord écrit et vient en déduction de la facture.'] },
        { h: '7. Responsabilité', p: [<>Express Débarras est assurée en responsabilité civile professionnelle auprès de <Field>[assureur]</Field>, contrat n° <Field>[numéro]</Field>.</>] },
        { h: '8. Médiation', p: [<>En cas de litige, le client peut recourir gratuitement au médiateur de la consommation : <Field>[médiateur]</Field>.</>] },
      ]}
    />
  );
}
