import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'secondary' | 'dark' | 'ghost' | 'outlineDark';
type Size = 'md' | 'sm';

const base =
  'group relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-btn font-semibold transition-[transform,box-shadow,background-color,color] duration-300 ease-out disabled:pointer-events-none disabled:opacity-50';
const variants: Record<Variant, string> = {
  primary: 'bg-signal text-navy shadow-signal hover:-translate-y-0.5 hover:shadow-signal-lg active:translate-y-0',
  secondary: 'bg-white text-navy ring-1 ring-inset ring-navy/15 hover:-translate-y-0.5 hover:ring-navy/40 hover:shadow-soft',
  dark: 'bg-navy text-white hover:-translate-y-0.5 hover:bg-navy-700 hover:shadow-lift',
  ghost: 'text-navy hover:bg-navy/5',
  outlineDark: 'text-white ring-1 ring-inset ring-white/30 hover:-translate-y-0.5 hover:bg-white/10 hover:ring-white/60',
};
const sizes: Record<Size, string> = {
  md: 'h-14 px-6 text-[16px]',
  sm: 'h-11 px-4 text-[15px]',
};

type Common = { variant?: Variant; size?: Size; arrow?: boolean; className?: string; children: React.ReactNode };

function Inner({ children, arrow }: { children: React.ReactNode; arrow?: boolean }) {
  return (
    <>
      <span>{children}</span>
      {arrow && <ArrowRight aria-hidden className="h-[18px] w-[18px] transition-transform duration-300 group-hover:translate-x-1" />}
    </>
  );
}

export function ButtonLink({ href, variant = 'primary', size = 'md', arrow, className, children, ...rest }: Common & { href: string } & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>) {
  return (
    <Link href={href} className={cn(base, variants[variant], sizes[size], className)} {...rest}>
      <Inner arrow={arrow}>{children}</Inner>
    </Link>
  );
}

export function Button({ variant = 'primary', size = 'md', arrow, className, children, ...rest }: Common & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={cn(base, variants[variant], sizes[size], className)} {...rest}>
      <Inner arrow={arrow}>{children}</Inner>
    </button>
  );
}
