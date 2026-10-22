import { cn } from '@/lib/cn';
export function Label({ children, className, dark }: { children: React.ReactNode; className?: string; dark?: boolean }) {
  return <p className={cn('font-mono text-label uppercase', dark ? 'text-signal' : 'text-beton-600', className)}>{children}</p>;
}
