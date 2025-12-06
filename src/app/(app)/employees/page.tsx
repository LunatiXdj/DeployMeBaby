'use client';

import dynamic from 'next/dynamic';

const EmployeeManagement = dynamic(
  () => import('@/client/components/features/employee-management').then(mod => ({ default: mod.EmployeeManagement })),
  {
    ssr: false,
    loading: () => <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }
);

export default function EmployeesPage() {
  return <EmployeeManagement />;
}
