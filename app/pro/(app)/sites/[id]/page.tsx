import { SitePage } from '@/components/pro/Sites';

export const metadata = { title: 'Site' };

export default function Page({ params }: { params: { id: string } }) {
  return <SitePage id={decodeURIComponent(params.id)} />;
}
