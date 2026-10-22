import { Suspense } from 'react';
import { Documents } from '@/components/pro/docs/Documents';

export const metadata = { title: 'Documents' };

export default function Page() {
  return (
    <Suspense>
      <Documents />
    </Suspense>
  );
}
