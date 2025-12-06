'use client';

import dynamic from 'next/dynamic';

const ToolManagement = dynamic(
  () => import('@/components/features/tool-management').then(mod => ({ default: mod.ToolManagement })),
  {
    ssr: false,
    loading: () => <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }
);

export default function ToolsPage() {
  return <ToolManagement />;
}
