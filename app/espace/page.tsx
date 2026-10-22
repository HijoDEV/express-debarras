import type { Metadata } from 'next';
import { Dashboard } from '@/components/espace/Dashboard';

export const metadata: Metadata = { title: 'Espace équipe (démo)', robots: { index: false } };

export default function EspacePage() {
  return <Dashboard />;
}
