import { Illus } from '@/components/illus/Illus';
import { Label } from '@/components/ui/Label';
import { STAMPS } from '@/lib/data';

function Stamp({ s, i }: { s: (typeof STAMPS)[number]; i: number }) {
  return (
    <li className="shrink-0 px-2.5">
      <div className="stamp w-[168px] bg-white p-[14px] transition-transform duration-300 hover:-translate-y-1.5 hover:rotate-[-1.5deg] sm:w-[188px]">
        <div className="relative grid aspect-[4/3.4] place-items-center overflow-hidden" style={{ background: s.tone }}>
          <Illus id={s.illus} className="h-[62%] w-[62%]" />
          <span className="absolute right-2 top-1.5 font-mono text-[10px] font-semibold text-navy/70">{String(i + 1).padStart(2, '0')}</span>
        </div>
        <p className="mt-2.5 truncate font-display text-[16px] tracking-[-0.02em] text-navy">{s.name}</p>
        <p className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-navy/70">Express · Rouen</p>
      </div>
    </li>
  );
}

export function StampMarquee() {
  return (
    <section className="overflow-hidden bg-kraft py-16 md:py-24" aria-labelledby="stamps-title">
      <Label className="text-center">
        <span id="stamps-title">Ce que nous débarrassons</span>
      </Label>
      <div className="fade-x mt-10 overflow-hidden">
        <ul className="marquee-track flex w-max animate-marquee py-4 [--dur:55s]" aria-label="Types de débarras">
          {[...STAMPS, ...STAMPS].map((s, i) => (
            <Stamp key={i} s={s} i={i % STAMPS.length} />
          ))}
        </ul>
      </div>
    </section>
  );
}
