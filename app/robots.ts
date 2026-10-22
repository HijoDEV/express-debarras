import type { MetadataRoute } from 'next';
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: '*', allow: '/', disallow: ['/espace'] }, sitemap: 'https://express-debarras.vercel.app/sitemap.xml' };
}
