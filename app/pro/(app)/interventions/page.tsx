import { Suspense } from 'react';
import { Interventions } from '@/components/pro/interventions/Interventions';

export const metadata = { title: 'Interventions' };

export default function Page() {
  return (
    <Suspense>
      <Interventions />
    </Suspense>
  );
}
