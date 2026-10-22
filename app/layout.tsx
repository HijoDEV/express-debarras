import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { CookieBanner } from '@/components/layout/CookieBanner';
import { SmoothScroll } from '@/components/layout/SmoothScroll';

const inter = localFont({ src: './fonts/inter.woff2', weight: '100 900', variable: '--font-inter', display: 'swap' });
const archivo = localFont({ src: './fonts/archivo-black.woff2', weight: '400', variable: '--font-archivo', display: 'swap' });
const mono = localFont({ src: './fonts/jetbrains-mono.woff2', weight: '500', variable: '--font-mono', display: 'swap', preload: false });

export const metadata: Metadata = {
  metadataBase: new URL('https://express-debarras.vercel.app'),
  title: { default: 'Express Débarras · La déchetterie vient à vous', template: '%s · Express Débarras' },
  description: 'Débarras à Rouen sur photos : prix fixe en moins d’1 h, intervention sous 48 h, rapport de tri. Un meuble, une cave ou un logement entier.',
  openGraph: { title: 'Express Débarras · La déchetterie vient à vous', description: 'Prix fixe sur photos en 1 h, débarras sous 48 h à Rouen.', locale: 'fr_FR', type: 'website' },
};

export const viewport: Viewport = { themeColor: '#0E2A3B', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${inter.variable} ${archivo.variable} ${mono.variable}`}>
      <body>
        <SmoothScroll />
        <Header />
        <main id="contenu">{children}</main>
        <Footer />
        <CookieBanner />
      </body>
    </html>
  );
}
