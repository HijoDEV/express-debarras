import type { MetadataRoute } from 'next';
import { SITUATION_PAGES } from '@/lib/data';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://express-debarras.vercel.app';
  const paths = ['', '/tarifs', '/simulateur', '/pros', '/engagement-tri', '/a-propos', '/contact', '/mentions-legales', '/cgv', ...Object.keys(SITUATION_PAGES).map((s) => `/situations/${s}`)];
  return paths.map((p) => ({ url: `${base}${p}`, lastModified: new Date() }));
}
