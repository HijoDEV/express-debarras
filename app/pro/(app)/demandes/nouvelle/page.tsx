import { Suspense } from 'react';
import { NewDemand } from '@/components/pro/NewDemand';

export const metadata = { title: 'Nouvelle demande' };

export default function Page() {
  return (
    <Suspense>
      <NewDemand />
    </Suspense>
  );
}
