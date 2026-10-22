import { cn } from '@/lib/cn';

/** Maquette de téléphone générique (sans marque). */
export function Phone({ children, className, screenClassName }: { children: React.ReactNode; className?: string; screenClassName?: string }) {
  return (
    <div className={cn('relative mx-auto w-[280px] rounded-[46px] bg-navy p-[10px] shadow-[0_40px_80px_-30px_rgba(14,42,59,.55),inset_0_0_0_2px_rgba(255,255,255,.08)] sm:w-[300px]', className)}>
      <div className={cn('relative h-[560px] overflow-hidden rounded-[37px] bg-[#F4F1E9] sm:h-[600px]', screenClassName)}>
        <div aria-hidden className="absolute left-1/2 top-2.5 z-20 h-[26px] w-[92px] -translate-x-1/2 rounded-full bg-navy" />
        {children}
      </div>
    </div>
  );
}
