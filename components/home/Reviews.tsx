import { Star } from 'lucide-react';
import { SAMPLE_REVIEWS } from '@/lib/data';

function Card({ r }: { r: (typeof SAMPLE_REVIEWS)[number] }) {
  return (
    <li className="w-[300px] shrink-0 px-2 sm:w-[340px]">
      <article className="relative h-full rounded-[22px] bg-white p-6 shadow-soft ring-1 ring-line">
        <span className="absolute right-4 top-4 rounded-full bg-kraft px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-navy/70">Exemple</span>
        <div className="flex gap-0.5 text-signal" role="img" aria-label="5 étoiles sur 5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className="h-4 w-4 fill-current" aria-hidden />
          ))}
        </div>
        <div className="my-4 dotted-sep" />
        <p className="text-[15px] leading-relaxed text-navy/85">{r.text}</p>
        <p className="mt-4 text-[14px] font-semibold">
          {r.name} <span className="font-normal text-navy/70">· {r.city}</span>
        </p>
      </article>
    </li>
  );
}

export function Reviews() {
  const a = SAMPLE_REVIEWS.slice(0, 5);
  const b = SAMPLE_REVIEWS.slice(5);
  return (
    <div className="space-y-4">
      <div className="fade-x overflow-hidden">
        <ul className="marquee-track flex w-max animate-marquee py-2 [--dur:60s]">
          {[...a, ...a, ...a, ...a].map((r, i) => (
            <Card key={i} r={r} />
          ))}
        </ul>
      </div>
      <div className="fade-x overflow-hidden">
        <ul className="marquee-track flex w-max animate-marquee-rev py-2 [--dur:65s]">
          {[...b, ...b, ...b, ...b].map((r, i) => (
            <Card key={i} r={r} />
          ))}
        </ul>
      </div>
    </div>
  );
}
