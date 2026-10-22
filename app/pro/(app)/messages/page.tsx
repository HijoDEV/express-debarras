import { Suspense } from 'react';
import { Messages } from '@/components/pro/Messages';

export const metadata = { title: 'Messages' };

export default function Page() {
  return (
    <Suspense>
      <Messages />
    </Suspense>
  );
}
