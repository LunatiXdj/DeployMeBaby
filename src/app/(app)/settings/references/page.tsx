'use client';

import dynamic from 'next/dynamic';

const ReferenceManagement = dynamic(
  () => import('@/client/components/features/reference-management').then(mod => ({ default: mod.ReferenceManagement })),
  {
    ssr: false,
    loading: () => <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }
);

export default function ReferencesPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Referenzen verwalten</h1>
      <ReferenceManagement />
    </div>
  );
}
