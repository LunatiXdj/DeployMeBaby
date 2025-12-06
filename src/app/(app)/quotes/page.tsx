'use client';

import dynamic from 'next/dynamic';

const QuoteManagement = dynamic(
  () => import('@/client/components/features/quote-management').then(mod => ({ default: mod.QuoteManagement })),
  {
    ssr: false,
    loading: () => <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }
);

export default function QuotesPage() {
  return <QuoteManagement />;
}
