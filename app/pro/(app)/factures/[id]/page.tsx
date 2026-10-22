import { FacturePage } from '@/components/pro/docs/Factures';

export const metadata = { title: 'Facture' };

export default function Page({ params }: { params: { id: string } }) {
  return <FacturePage id={decodeURIComponent(params.id)} />;
}
