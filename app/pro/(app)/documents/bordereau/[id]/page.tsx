import { BordereauPage } from '@/components/pro/docs/Documents';

export const metadata = { title: 'Bordereau' };

export default function Page({ params }: { params: { id: string } }) {
  return <BordereauPage id={decodeURIComponent(params.id)} />;
}
