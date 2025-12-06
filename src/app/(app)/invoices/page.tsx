'use client';

import dynamic from 'next/dynamic';

const InvoiceManagement = dynamic(
  () => import('@/client/components/features/invoice-management').then(mod => ({ default: mod.InvoiceManagement })),
  {
    ssr: false,
    loading: () => <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }
);

export default function InvoicesPage() {
  return <InvoiceManagement />;
}
