'use client';

import dynamic from 'next/dynamic';

const CompanySettingsForm = dynamic(
  () => import('@/components/features/settings-form').then(mod => ({ default: mod.CompanySettingsForm })),
  {
    ssr: false,
    loading: () => <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }
);

export default function CompanySettingsPage() {
  return <CompanySettingsForm />;
}
