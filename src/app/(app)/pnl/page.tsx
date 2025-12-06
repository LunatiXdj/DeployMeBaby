'use client';

import dynamic from 'next/dynamic';

const PnlStatement = dynamic(
    () => import('@/client/components/features/pnl-statement').then(mod => ({ default: mod.PnlStatement })),
    {
        ssr: false,
        loading: () => <div className="flex items-center justify-center min-h-screen">Loading...</div>
    }
);

export default function PnlPage() {
    return <PnlStatement />;
}
