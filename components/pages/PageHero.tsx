import { Label } from '@/components/ui/Label';
import { Container } from '@/components/ui/Section';
import { Reveal } from '@/components/ui/Reveal';
import { HazardStripe } from '@/components/ui/HazardStripe';
import { cn } from '@/lib/cn';

export function PageHero({ label, title, lead, children, center = false, stripe = true }: { label: string; title: React.ReactNode; lead?: React.ReactNode; children?: React.ReactNode; center?: boolean; stripe?: boolean }) {
  return (
    <section className="relative overflow-hidden bg-white pb-16 pt-32 md:pb-24 md:pt-44">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(55%_60%_at_50%_0%,#FFF4D1_0%,rgba(255,244,209,0)_70%)]" />
      <Container className={cn('relative', center && 'text-center')}>
        <Reveal>
          <Label>{label}</Label>
          <h1 className={cn('mt-5 font-display text-h1 text-navy', center ? 'mx-auto max-w-4xl' : 'max-w-4xl')}>{title}</h1>
          {lead && <p className={cn('mt-6 max-w-2xl text-body-lg text-navy/70', center && 'mx-auto')}>{lead}</p>}
          {children}
        </Reveal>
      </Container>
      {stripe && <HazardStripe className="absolute bottom-0 h-2" />}
    </section>
  );
}
