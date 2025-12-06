'use client';

import { AuthProvider } from '@/client/contexts/auth-context';
import { TooltipProvider } from '@/client/components/ui/tooltip';
import { Toaster } from '@/client/components/ui/toaster';
import { PageViewTracker } from '@/client/components/analytics/page-view-tracker';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <TooltipProvider>
        <PageViewTracker />
        {children}
      </TooltipProvider>
      <Toaster />
    </AuthProvider>
  );
}
