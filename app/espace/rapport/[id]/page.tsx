import type { Metadata } from 'next';
import { Report } from '@/components/espace/Report';

export const metadata: Metadata = { title: 'Rapport de tri', robots: { index: false } };

export default function RapportPage({ params }: { params: { id: string } }) {
  return <Report id={decodeURIComponent(params.id)} />;
}
