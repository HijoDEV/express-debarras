'use client';
import { motion, useReducedMotion } from 'framer-motion';
import { Lock } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast, Toaster } from 'sonner';
import { cn } from '@/lib/cn';
import { auth, counters as getCounters } from '@/lib/pro/api';
import { useHydrated } from '@/lib/pro/hooks';
import { can, ROLE_LABEL, type Page } from '@/lib/pro/permissions';
import { STATUS_META } from '@/lib/pro/status';
import { rehydrate, useProStore } from '@/lib/pro/store';
import { subscribe, subscribeLocal } from '@/lib/pro/sync';
import { EmptyState, Btn } from '../ui';
import { CommandPalette } from './CommandPalette';
import { MobileNav } from './MobileNav';
import { NotificationsDrawer } from './NotificationsDrawer';
import { Shell, type ShellCtx } from './ShellContext';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { Tour } from './Tour';

const PAGE_OF: [string, Page][] = [
  ['/pro/demandes', 'demandes'],
  ['/pro/interventions', 'interventions'],
  ['/pro/devis', 'devis'],
  ['/pro/factures', 'factures'],
  ['/pro/documents', 'documents'],
  ['/pro/sites', 'sites'],
  ['/pro/abonnement', 'abonnement'],
  ['/pro/messages', 'messages'],
  ['/pro/partenaires', 'partenaires'],
  ['/pro/equipe', 'equipe'],
  ['/pro/parametres', 'parametres'],
];

export function ProShell({ children }: { children: React.ReactNode }) {
  const hydrated = useHydrated();
  const router = useRouter();
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const session = useProStore((s) => s.session);
  const prefs = useProStore((s) => s.prefs);
  const setPrefs = useProStore((s) => s.setPrefs);
  const rev = useProStore((s) => s.rev);
  const [collapsed, setCollapsed] = useState(false);
  const [palette, setPalette] = useState(false);
  const [notifs, setNotifs] = useState(false);
  const [tour, setTour] = useState(false);
  const gPressed = useRef(0);

  useEffect(() => {
    if (hydrated && !session) router.replace('/pro/connexion');
  }, [hydrated, session, router]);

  const current = useMemo(() => (hydrated && session ? auth.current() : null), [hydrated, session, rev]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const counters = useMemo(() => (current ? getCounters() : { unreadMessages: 0, unreadNotifs: 0, toSign: 0 }), [current, rev]);

  const toggleTheme = useCallback(() => setPrefs({ theme: prefs.theme === 'dark' ? 'light' : 'dark' }), [prefs.theme, setPrefs]);
  const startTour = useCallback(() => {
    if (pathname !== '/pro') router.push('/pro');
    setTimeout(() => setTour(true), pathname !== '/pro' ? 900 : 0);
  }, [pathname, router]);

  // visite guidée au premier login
  useEffect(() => {
    if (!current || pathname !== '/pro' || prefs.tourDone[current.org.id]) return;
    const t = setTimeout(() => setTour(true), 1400);
    return () => clearTimeout(t);
  }, [current, pathname, prefs.tourDone]);

  // synchronisation entre onglets : toasts en direct
  useEffect(() => {
    const off1 = subscribe(async (e) => {
      await rehydrate();
      const s = useProStore.getState().session;
      if (!s) return;
      if (e.type === 'status' && e.orgId === s.orgId && e.by !== 'client') {
        toast(`${e.ref} · ${STATUS_META[e.status].label}`, {
          description: e.status === 'en_route' ? 'Le camion vient de partir du dépôt.' : e.status === 'devis_envoye' ? 'Un devis attend votre signature.' : 'Mise à jour par l’équipe Express Débarras.',
          action: { label: 'Voir', onClick: () => router.push(`/pro/interventions?id=${e.interventionId}`) },
        });
      }
      if (e.type === 'db') toast('Démo réinitialisée dans un autre onglet');
    });
    const off2 = subscribeLocal((e) => {
      const s = useProStore.getState().session;
      if (e.type === 'message' && e.author === 'equipe' && s && e.orgId === s.orgId && !window.location.pathname.startsWith('/pro/messages')) {
        toast('Nouveau message de l’équipe', { description: e.text, action: { label: 'Ouvrir', onClick: () => router.push(`/pro/messages?t=${e.threadId}`) } });
      }
    });
    return () => {
      off1();
      off2();
    };
  }, [router]);

  // raccourcis clavier
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      const typing = t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName);
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPalette((p) => !p);
        return;
      }
      if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === '/') {
        e.preventDefault();
        setPalette(true);
      } else if (e.key.toLowerCase() === 'n' && current && can(current.role, 'demandes')) {
        e.preventDefault();
        router.push('/pro/demandes/nouvelle');
      } else if (e.key.toLowerCase() === 'g') gPressed.current = Date.now();
      else if (Date.now() - gPressed.current < 1000) {
        const map: Record<string, string> = { d: '/pro', i: '/pro/interventions', f: '/pro/factures', m: '/pro/messages', p: '/pro/parametres' };
        const href = map[e.key.toLowerCase()];
        if (href) router.push(href);
        gPressed.current = 0;
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [current, router]);

  if (!hydrated || !current) {
    return (
      <div className="pro grid min-h-screen place-items-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-signal border-t-transparent" aria-label="Chargement" />
      </div>
    );
  }

  const page = PAGE_OF.find(([p]) => pathname.startsWith(p))?.[1] ?? 'dashboard';
  const allowed = can(current.role, page) && (page !== 'partenaires' || current.org.kind === 'agence');

  const ctx: ShellCtx = {
    ...current,
    counters,
    theme: prefs.theme,
    toggleTheme,
    openPalette: () => setPalette(true),
    openNotifs: () => setNotifs(true),
    startTour,
  };

  return (
    <Shell.Provider value={ctx}>
      <div className={cn('pro flex min-h-screen font-sans', prefs.theme === 'dark' && 'dark')}>
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="pro-chrome flex h-8 items-center justify-center gap-2 bg-[repeating-linear-gradient(-45deg,#FFC21A_0_10px,#F5B800_10px_20px)] text-[12px] font-semibold text-navy" role="note">
            <span className="rounded bg-white/80 px-2 py-0.5">Données de démonstration</span>
            <span className="hidden sm:inline">· Projet BTS NDRC · aucune donnée réelle</span>
          </div>
          <Topbar />
          <main className="flex-1 px-4 pb-32 pt-5 sm:px-6 sm:pt-7 lg:px-8 lg:pb-12" id="pro-main">
            <motion.div key={pathname} initial={reduce ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }} className="mx-auto w-full max-w-[1320px]">
              {allowed ? (
                children
              ) : (
                <EmptyState
                  art="doc"
                  title="Accès restreint"
                  text={`Le rôle ${ROLE_LABEL[current.role]} ne donne pas accès à cette page. Changez de rôle depuis le menu de votre profil.`}
                  action={
                    <Btn variant="primary" href="/pro">
                      <Lock className="h-4 w-4" /> Retour au tableau de bord
                    </Btn>
                  }
                />
              )}
            </motion.div>
          </main>
        </div>
        <MobileNav />
        <CommandPalette open={palette} setOpen={setPalette} />
        <NotificationsDrawer open={notifs} onClose={() => setNotifs(false)} />
        <Tour
          open={tour}
          onClose={() => {
            setTour(false);
            setPrefs({ tourDone: { ...prefs.tourDone, [current.org.id]: true } });
          }}
        />
        <Toaster theme={prefs.theme} position="bottom-right" richColors closeButton toastOptions={{ style: { fontFamily: 'var(--font-inter)' } }} />
      </div>
    </Shell.Provider>
  );
}
