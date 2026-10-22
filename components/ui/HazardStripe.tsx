import { cn } from '@/lib/cn';
export function HazardStripe({ className }: { className?: string }) {
  return <div aria-hidden className={cn('hazard h-3 w-full', className)} />;
}
