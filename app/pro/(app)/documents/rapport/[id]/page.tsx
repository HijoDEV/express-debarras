import { RapportPage } from '@/components/pro/docs/Documents';

export const metadata = { title: 'Rapport de tri' };

export default function Page({ params }: { params: { id: string } }) {
  return <RapportPage id={decodeURIComponent(params.id)} />;
}
