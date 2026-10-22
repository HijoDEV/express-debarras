import { DevisPage } from '@/components/pro/docs/Devis';

export const metadata = { title: 'Devis' };

export default function Page({ params }: { params: { id: string } }) {
  return <DevisPage id={decodeURIComponent(params.id)} />;
}
