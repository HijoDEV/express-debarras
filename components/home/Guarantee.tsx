import Link from 'next/link';
import { Lock } from 'lucide-react';
import { Container } from '@/components/ui/Section';
import { Reveal } from '@/components/ui/Reveal';

export function Guarantee() {
  return (
    <section className="py-8 md:py-12">
      <Container>
        <Reveal>
          <div data-tour="guarantee" className="on-dark relative overflow-hidden rounded-[28px] bg-[linear-gradient(120deg,#0E2A3B_0%,#1B3F55_60%,#24506B_100%)] p-7 text-white sm:p-10">
            <div aria-hidden className="absolute -right-10 -top-24 h-64 w-64 rounded-full bg-signal/15 blur-3xl" />
            <div className="relative flex flex-col gap-6 md:flex-row md:items-center">
              <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-white/10 ring-1 ring-white/20">
                <Lock className="h-7 w-7 text-signal" />
              </span>
              <p className="flex-1 text-[17px] leading-relaxed text-white/85 md:text-[19px]">
                <strong className="text-white">Prix garanti</strong> : le prix annoncé est le prix payé. Si le volume réel dépasse de plus de 20 % vos photos, nous vous proposons un nouveau prix{' '}
                <strong className="text-white">avant</strong> de commencer.
              </p>
              <Link href="/cgv#prix" className="shrink-0 rounded-btn px-1 text-[15px] font-semibold text-signal underline underline-offset-4 hover:text-white">
                Les conditions
              </Link>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
