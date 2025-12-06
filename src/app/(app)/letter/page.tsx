'use client';

import dynamic from 'next/dynamic';

const LetterWriter = dynamic(
  () => import('@/client/components/features/letter-writer').then(mod => ({ default: mod.LetterWriter })),
  {
    ssr: false,
    loading: () => <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }
);

export default function LetterPage() {
  return <LetterWriter />;
}
