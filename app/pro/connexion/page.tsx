import type { Metadata } from 'next';
import { Login } from '@/components/pro/Login';

export const metadata: Metadata = { title: 'Connexion · Espace pro', robots: { index: false } };

export default function ConnexionPage() {
  return <Login />;
}
