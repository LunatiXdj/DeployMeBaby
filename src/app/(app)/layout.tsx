
import { type ReactNode } from 'react';
import { Sidebar } from '@/client/components/layout/sidebar';
import { Header } from '@/client/components/layout/header';
import { PrivateRoute } from '@/client/components/layout/private-route';

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <PrivateRoute>
      <div className="flex min-h-screen w-full bg-muted/40">
        <Sidebar />
        <div className="flex flex-1 flex-col">
          <Header />
          <main className="flex-1 overflow-auto p-4 sm:px-6 sm:py-6">
            {children}
          </main>
        </div>
      </div>
    </PrivateRoute>
  );
}
