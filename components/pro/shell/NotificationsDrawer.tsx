'use client';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, CheckCheck, FileSignature, MessageSquare, Receipt, Recycle, Truck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { cn } from '@/lib/cn';
import { listNotifications, markNotifications } from '@/lib/pro/api';
import { useApi } from '@/lib/pro/hooks';
import type { Notification } from '@/lib/pro/types';
import { Drawer, EmptyState, LoadingList, Segmented } from '../ui';

const ICON: Record<Notification['kind'], typeof Bell> = { statut: Truck, devis: FileSignature, facture: Receipt, message: MessageSquare, rapport: Recycle };

export function NotificationsDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [tab, setTab] = useState<'all' | 'unread'>('all');
  const { data, loading } = useApi(listNotifications, [open]);
  const list = (data ?? []).filter((n) => tab === 'all' || !n.read);
  const unread = (data ?? []).filter((n) => !n.read).length;

  return (
    <Drawer open={open} onClose={onClose} title="Notifications" width={440}>
      <div className="flex items-center justify-between gap-3 border-b border-p-line px-5 py-3">
        <Segmented
          label="Filtre notifications"
          value={tab}
          onChange={setTab}
          options={[
            { value: 'all', label: 'Tout' },
            { value: 'unread', label: <>Non lus {unread > 0 && <span className="rounded-full bg-signal px-1.5 text-[11px] text-navy">{unread}</span>}</> },
          ]}
        />
        <button onClick={() => void markNotifications('all')} disabled={!unread} className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-p-muted hover:text-p-text disabled:opacity-40">
          <CheckCheck className="h-4 w-4" /> Tout marquer comme lu
        </button>
      </div>
      {loading ? (
        <LoadingList rows={6} />
      ) : list.length === 0 ? (
        <EmptyState art="inbox" title="Rien de nouveau" text="Vous êtes à jour. Les changements de statut et les nouveaux documents arrivent ici." />
      ) : (
        <ul className="divide-y divide-p-line">
          <AnimatePresence initial={false}>
            {list.map((n) => {
              const I = ICON[n.kind];
              return (
                <motion.li key={n.id} layout initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, height: 0 }}>
                  <button
                    onClick={() => {
                      void markNotifications([n.id]);
                      onClose();
                      router.push(n.href);
                    }}
                    className={cn('flex w-full gap-3 px-5 py-3.5 text-left transition hover:bg-p-hover', !n.read && 'bg-signal-soft/40 dark:bg-signal/5')}
                  >
                    <span className={cn('mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full', n.read ? 'bg-p-soft text-p-muted' : 'bg-signal text-navy')}>
                      <I className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate text-[14px] font-semibold">{n.title}</span>
                        {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-[#E0533A]" aria-label="Non lue" />}
                      </span>
                      <span className="block truncate text-[13px] text-p-muted">{n.body}</span>
                      <span className="mt-0.5 block text-[12px] text-p-muted">{formatDistanceToNow(new Date(n.at), { addSuffix: true, locale: fr })}</span>
                    </span>
                  </button>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}
    </Drawer>
  );
}
