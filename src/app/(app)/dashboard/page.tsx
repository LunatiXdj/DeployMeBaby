'use client';

import dynamic from 'next/dynamic';

const Dashboard = dynamic(
  () => import('@/client/components/features/dashboard').then(mod => ({ default: mod.Dashboard })),
  {
    ssr: false,
    loading: () => <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }
);

export default function DashboardPage() {
  return <Dashboard />;
}
