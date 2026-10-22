type LenisLike = { resize: () => void; scrollTo: (t: Element | number, o?: object) => void };

/** Défilement doux vers un élément, compatible Lenis et prefers-reduced-motion. */
export function scrollToEl(el: Element | null, offset = -88) {
  if (!el) return;
  const lenis = (window as unknown as { __lenis?: LenisLike }).__lenis;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (lenis && !reduce) {
    lenis.resize();
    const y = el.getBoundingClientRect().top + window.scrollY + offset;
    lenis.scrollTo(y, { force: true });
  } else {
    const y = el.getBoundingClientRect().top + window.scrollY + offset;
    window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
  }
}
