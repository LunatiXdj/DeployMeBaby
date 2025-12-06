'use client';

import dynamic from 'next/dynamic';

const FinanceManagement = dynamic(
    () => import('@/client/components/features/finance-management').then(mod => ({ default: mod.FinanceManagement })),
    {
        ssr: false,
        loading: () => <div className="flex items-center justify-center min-h-screen">Loading...</div>
    }
);

export default function FinancePage() {
    return <FinanceManagement />;
}