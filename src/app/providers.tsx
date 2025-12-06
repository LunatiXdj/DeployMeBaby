'use client';

import { AuthProvider } from '@/client/contexts/auth-context';
import { TooltipProvider } from '@/client/components/ui/tooltip';
import { Toaster } from '@/client/components/ui/toaster';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <TooltipProvider>
        {children}
      </TooltipProvider>
      <Toaster />
    </AuthProvider>
  );
}
