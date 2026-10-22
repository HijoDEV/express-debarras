'use client';
import { format, isToday } from 'date-fns';
import { fr } from 'date-fns/locale';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ImagePlus, MessagesSquare, Paperclip, Send, X } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import { photo } from '@/lib/photos';
import { listMessages, listThreads, markThreadRead, sendMessage } from '@/lib/pro/api';
import { useApi } from '@/lib/pro/hooks';
import { Btn, Card, EmptyState, inputCls, LoadingList, StatusBadge } from './ui';

export function Messages() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const { data: threads, loading } = useApi(listThreads);
  const active = params.get('t') ?? (typeof window !== 'undefined' && window.innerWidth >= 1024 ? threads?.[0]?.id : undefined) ?? null;
  const thread = threads?.find((t) => t.id === active) ?? null;

  return (
    <div>
      <h1 className="mb-5 font-display text-[28px] leading-none tracking-[-0.035em] sm:text-[34px]">Messages</h1>
      <Card className="grid h-[calc(100vh-260px)] min-h-[520px] overflow-hidden lg:grid-cols-[340px_1fr]">
        <div className={cn('flex min-h-0 flex-col border-p-line lg:border-r', active && 'hidden lg:flex')}>
          {loading || !threads ? (
            <LoadingList rows={7} />
          ) : (
            <ul className="pro-scroll flex-1 overflow-y-auto">
              {threads.map((t) => (
                <li key={t.id}>
                  <button onClick={() => router.push(`${pathname}?t=${t.id}`, { scroll: false })} className={cn('flex w-full gap-3 border-b border-p-line px-4 py-3 text-left transition hover:bg-p-hover', t.id === active && 'bg-p-soft')}>
                    <span className={cn('mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full', t.interventionId ? 'bg-signal-soft text-navy' : 'bg-navy text-white')}>
                      <MessagesSquare className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate text-[14px] font-semibold">{t.ref ?? t.title}</span>
                        {t.last && <span className="shrink-0 text-[11.5px] text-p-muted">{isToday(new Date(t.last.at)) ? format(new Date(t.last.at), 'HH:mm') : format(new Date(t.last.at), 'd MMM', { locale: fr })}</span>}
                      </span>
                      <span className="block truncate text-[12.5px] text-p-muted">{t.ref ? t.title : 'Questions générales'}</span>
                      <span className="mt-0.5 flex items-center justify-between gap-2">
                        <span className={cn('truncate text-[13px]', t.unread ? 'font-semibold text-p-text' : 'text-p-muted')}>{t.last?.text ?? 'Aucun message'}</span>
                        {t.unread > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-signal px-1.5 text-[11px] font-bold text-navy">{t.unread}</span>}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className={cn('min-h-0 flex-col', active ? 'flex' : 'hidden lg:flex')}>
          {thread ? <ThreadView key={thread.id} id={thread.id} title={thread.ref ?? thread.title} sub={thread.ref ? thread.title : 'Fil général'} status={thread.status} onBack={() => router.push(pathname, { scroll: false })} /> : <EmptyState art="inbox" title="Choisissez une conversation" text="Un fil par intervention, plus un fil général avec l’équipe." />}
        </div>
      </Card>
    </div>
  );
}

function ThreadView({ id, title, sub, status, onBack }: { id: string; title: string; sub: string; status?: Parameters<typeof StatusBadge>[0]['status']; onBack: () => void }) {
  const { data: msgs, loading } = useApi(() => listMessages(id), [id]);
  const [text, setText] = useState('');
  const [typing, setTyping] = useState(false);
  const [att, setAtt] = useState<string[]>([]);
  const end = useRef<HTMLDivElement>(null);
  const file = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void markThreadRead(id);
  }, [id, msgs?.length]);
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [msgs?.length, typing]);

  const send = () => {
    if (!text.trim() && !att.length) return;
    void sendMessage(id, text.trim() || 'Photo jointe', att.length ? att : undefined, setTyping);
    setText('');
    setAtt([]);
  };

  return (
    <>
      <div className="flex items-center gap-3 border-b border-p-line px-4 py-3">
        <button onClick={onBack} className="grid h-9 w-9 place-items-center rounded-lg hover:bg-p-hover lg:hidden" aria-label="Retour aux conversations">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate font-mono text-[14px] font-semibold">{title}</p>
          <p className="truncate text-[12.5px] text-p-muted">{sub}</p>
        </div>
        {status && <StatusBadge status={status} />}
      </div>
      <div className="pro-scroll flex-1 space-y-2 overflow-y-auto bg-p-soft p-4" aria-live="polite">
        {loading || !msgs ? (
          <LoadingList rows={4} />
        ) : (
          <AnimatePresence initial={false}>
            {msgs.map((m) => (
              <motion.div key={m.id} layout initial={{ opacity: 0, y: 10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className={cn('flex', m.author === 'client' ? 'justify-end' : 'justify-start')}>
                <div className={cn('max-w-[78%] rounded-[16px] px-3.5 py-2.5 text-[14px] shadow-sm', m.author === 'client' ? 'rounded-br-[6px] bg-navy text-white dark:bg-signal dark:text-navy' : 'rounded-bl-[6px] bg-p-card')}>
                  {m.author === 'equipe' && <p className="mb-0.5 text-[11.5px] font-semibold text-tri-dark dark:text-[#7FD9AF]">{m.userName}</p>}
                  {m.attachments && (
                    <div className="mb-1.5 grid grid-cols-2 gap-1">
                      {m.attachments.map((a, i) =>
                        a.startsWith('blob:') ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img key={i} src={a} alt="Pièce jointe" className="h-24 w-full rounded-[10px] object-cover" />
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img key={i} src={photo(i % 2 ? 'appartement' : 'caveAvant', 240, 180)} alt="Pièce jointe" className="h-24 w-full rounded-[10px] object-cover" />
                        ),
                      )}
                    </div>
                  )}
                  <p className="whitespace-pre-wrap">{m.text}</p>
                  <p className={cn('mt-0.5 text-right text-[10.5px]', m.author === 'client' ? 'text-white/60 dark:text-navy/60' : 'text-p-muted')}>{format(new Date(m.at), 'd MMM · HH:mm', { locale: fr })}</p>
                </div>
              </motion.div>
            ))}
            {typing && (
              <motion.div key="typing" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2 text-[12.5px] text-p-muted">
                <span className="flex gap-1 rounded-[14px] bg-p-card px-3 py-2.5">
                  {[0, 1, 2].map((d) => (
                    <motion.span key={d} className="h-1.5 w-1.5 rounded-full bg-p-muted" animate={{ y: [0, -3, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: d * 0.12 }} />
                  ))}
                </span>
                Noa est en train d’écrire…
              </motion.div>
            )}
          </AnimatePresence>
        )}
        <div ref={end} />
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="border-t border-p-line p-3"
      >
        {att.length > 0 && (
          <div className="mb-2 flex gap-2">
            {att.map((a) => (
              <div key={a} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={a} alt="Pièce jointe" className="h-14 w-14 rounded-[10px] object-cover" />
                <button type="button" onClick={() => setAtt(att.filter((x) => x !== a))} className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-navy text-white" aria-label="Retirer">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => file.current?.click()} className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] hover:bg-p-hover" aria-label="Joindre une image">
            <Paperclip className="h-4 w-4" />
          </button>
          <input
            ref={file}
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            aria-label="Joindre une image"
            onChange={(e) => setAtt([...att, ...Array.from(e.target.files ?? []).slice(0, 4).map((f) => URL.createObjectURL(f))])}
          />
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Écrire un message…" className={inputCls} aria-label="Message" />
          <Btn variant="primary" type="submit" aria-label="Envoyer">
            <Send className="h-4 w-4" />
          </Btn>
        </div>
        <p className="mt-1.5 flex items-center gap-1 text-[11.5px] text-p-muted">
          <ImagePlus className="h-3 w-3" /> L’équipe répond en général en moins d’une heure (ici : réponse simulée en quelques secondes).
        </p>
      </form>
    </>
  );
}
