'use client';
import { usePathname } from 'next/navigation';

/** Masque l'habillage du site vitrine dans l'application /pro. */
export function HideOnPro({ children }: { children: React.ReactNode }) {
  const p = usePathname();
  if (p === '/pro' || p?.startsWith('/pro/')) return null;
  return <>{children}</>;
}
