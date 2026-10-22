'use client';
import { Eraser } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

/** Zone de signature au doigt, au stylet ou à la souris. */
export function SignaturePad({ onChange }: { onChange: (dataUrl: string | null) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const [empty, setEmpty] = useState(true);

  useEffect(() => {
    const c = ref.current!;
    const ratio = window.devicePixelRatio || 1;
    const r = c.getBoundingClientRect();
    c.width = r.width * ratio;
    c.height = r.height * ratio;
    const ctx = c.getContext('2d')!;
    ctx.scale(ratio, ratio);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0E2A3B';
    ctx.lineWidth = 2.4;
  }, []);

  const pos = (e: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const start = (e: React.PointerEvent) => {
    e.preventDefault();
    ref.current!.setPointerCapture(e.pointerId);
    drawing.current = true;
    last.current = pos(e);
  };
  const move = (e: React.PointerEvent) => {
    if (!drawing.current || !last.current) return;
    const p = pos(e);
    const ctx = ref.current!.getContext('2d')!;
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    const mid = { x: (last.current.x + p.x) / 2, y: (last.current.y + p.y) / 2 };
    ctx.quadraticCurveTo(last.current.x, last.current.y, mid.x, mid.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last.current = p;
    if (empty) setEmpty(false);
  };
  const end = () => {
    if (!drawing.current) return;
    drawing.current = false;
    last.current = null;
    onChange(ref.current!.toDataURL('image/png'));
  };
  const clear = () => {
    const c = ref.current!;
    c.getContext('2d')!.clearRect(0, 0, c.width, c.height);
    setEmpty(true);
    onChange(null);
  };

  return (
    <div>
      <div className="relative overflow-hidden rounded-[12px] border-2 border-dashed border-p-line bg-white">
        <canvas
          ref={ref}
          className="block h-[160px] w-full touch-none cursor-crosshair"
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerLeave={end}
          aria-label="Zone de signature : dessinez votre signature"
          role="img"
        />
        {empty && <p className="pointer-events-none absolute inset-0 grid place-items-center text-[14px] text-[#8A9299]">Signez ici avec la souris ou le doigt</p>}
        <span className="pointer-events-none absolute bottom-8 left-6 right-6 h-px bg-[#E6E8EB]" />
      </div>
      <button type="button" onClick={clear} className="mt-2 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-p-muted hover:text-p-text">
        <Eraser className="h-3.5 w-3.5" /> Effacer
      </button>
    </div>
  );
}
