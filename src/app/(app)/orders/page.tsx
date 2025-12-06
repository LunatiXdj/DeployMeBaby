'use client';

import dynamic from 'next/dynamic';

const MaterialOrderManagement = dynamic(
  () => import('@/client/components/features/material-order-management').then(mod => ({ default: mod.MaterialOrderManagement })),
  {
    ssr: false,
    loading: () => <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }
);

export default function MaterialOrdersPage() {

  return (
    <MaterialOrderManagement />
  );
}
