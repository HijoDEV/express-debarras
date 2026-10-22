'use client';
import { Check, Copy } from 'lucide-react';
import { useState } from 'react';

export function CopyField({ label, value, href, icon }: { label: string; value: string; href?: string; icon: React.ReactNode }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const t = document.createElement('textarea');
      t.value = value;
      document.body.appendChild(t);
      t.select();
      document.execCommand('copy');
      t.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-[22px] bg-white p-4 shadow-soft ring-1 ring-line sm:gap-4 sm:p-5">
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-signal">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="font-mono text-label uppercase text-beton-600">{label}</p>
        {href ? (
          <a href={href} className="mt-1 block select-all truncate text-[16px] font-semibold hover:underline sm:text-[18px]">
            {value}
          </a>
        ) : (
          <p className="mt-1 select-all truncate text-[18px] font-semibold">{value}</p>
        )}
      </div>
      <button onClick={copy} className="inline-flex h-11 shrink-0 items-center gap-2 rounded-btn bg-kraft px-4 text-[14px] font-semibold transition hover:bg-line" aria-label={`Copier · ${label}`}>
        {copied ? <Check className="h-4 w-4 text-tri" /> : <Copy className="h-4 w-4" />}
        <span className="hidden sm:inline">{copied ? 'Copié' : 'Copier'}</span>
      </button>
    </div>
  );
}
