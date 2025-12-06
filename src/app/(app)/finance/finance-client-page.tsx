'use client';

import dynamic from 'next/dynamic';

const FinanceManagement = dynamic(() => import('@/client/components/features/finance-management').then(mod => mod.FinanceManagement), { ssr: false });

export default function FinanceClientPage() {
    return <FinanceManagement />;
}