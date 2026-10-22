import { cn } from '@/lib/cn';
export function Section({ id, className, children, tone = 'white' }: { id?: string; className?: string; children: React.ReactNode; tone?: 'white' | 'kraft' | 'navy' }) {
  return (
    <section
      id={id}
      className={cn(
        'relative py-20 md:py-32',
        tone === 'kraft' && 'bg-kraft',
        tone === 'navy' && 'on-dark bg-navy text-white',
        className,
      )}
    >
      {children}
    </section>
  );
}
export function Container({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('mx-auto w-full max-w-[1200px] px-4 sm:px-6', className)}>{children}</div>;
}
