'use client';

import dynamic from 'next/dynamic';

const Dashboard = dynamic(() => import('@/client/components/features/dashboard').then(mod => mod.Dashboard), { ssr: false });

export default function DashboardClientPage() {
  return <Dashboard />;
}
