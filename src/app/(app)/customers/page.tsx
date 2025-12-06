'use client';

import dynamic from 'next/dynamic';

const CustomerManagement = dynamic(
  () => import('@/client/components/features/customer-management').then(mod => ({ default: mod.CustomerManagement })),
  {
    ssr: false,
    loading: () => <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }
);

export default function CustomersPage() {
  return <CustomerManagement />;
}
