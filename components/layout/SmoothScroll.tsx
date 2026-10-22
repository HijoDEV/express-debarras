'use client';
import { useEffect } from 'react';
import type Lenis from 'lenis';

export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let lenis: Lenis | null = null;
    let disposed = false;
    let cleanup = () => {};
    const start = async () => {
      const { default: L } = await import('lenis');
      if (disposed) return;
      lenis = new L({ duration: 1.1, smoothWheel: true });
      cleanup = setup(lenis);
    };
    const idle = (window as unknown as { requestIdleCallback?: (cb: () => void) => number }).requestIdleCallback;
    if (idle) idle(() => void start());
    else setTimeout(() => void start(), 1200);
    return () => {
      disposed = true;
      cleanup();
      lenis?.destroy();
    };
  }, []);
  return null;
}

function setup(lenis: Lenis) {
  {
    let raf = 0;
    const loop = (t: number) => {
      lenis.raf(t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest('a');
      if (!a) return;
      const url = new URL(a.href, location.href);
      if (url.pathname !== location.pathname || !url.hash) return;
      const el = document.querySelector(decodeURIComponent(url.hash));
      if (!el) return;
      e.preventDefault();
      lenis.resize();
      lenis.scrollTo((el as HTMLElement).getBoundingClientRect().top + window.scrollY - 88, { force: true });
      history.replaceState(null, '', url.hash);
    };
    document.addEventListener('click', onClick);
    (window as unknown as { __lenis?: Lenis }).__lenis = lenis;
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('click', onClick);
      delete (window as unknown as { __lenis?: Lenis }).__lenis;
    };
  }
}
