import type { Metadata } from 'next';
import { ProShell } from '@/components/pro/shell/ProShell';

export const metadata: Metadata = { title: { default: 'Espace pro', template: '%s · Espace pro' }, robots: { index: false } };

export default function ProLayout({ children }: { children: React.ReactNode }) {
  return <ProShell>{children}</ProShell>;
}
