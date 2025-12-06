'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/client/contexts/auth-context';
import { Skeleton } from '@/client/components/ui/skeleton';

export function PrivateRoute({ children }: { children: ReactNode }) {
  const { authUser, loading } = useAuth();
  const router = useRouter();

  console.log('PrivateRoute: Loading state:', loading);
  console.log('PrivateRoute: AuthUser state:', authUser);

  useEffect(() => {
    console.log('PrivateRoute useEffect: Loading:', loading, 'AuthUser:', !!authUser);
    if (!loading && !authUser) {
      console.log('PrivateRoute: Redirecting to /login');
      router.push('/login');
    }
  }, [authUser, loading, router]);

  if (loading || !authUser) {
    console.log('PrivateRoute: Showing loading skeleton or redirecting...');
    return (
      <div className="grid min-h-screen w-full lg:grid-cols-[256px_1fr]">
        <aside className="fixed inset-y-0 left-0 z-10 hidden w-64 flex-col border-r bg-background sm:flex p-4 gap-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-6 w-32" />
          </div>
          <div className="flex flex-col gap-2 mt-4">
            <Skeleton className='h-8 w-full rounded-lg' />
            <Skeleton className='h-8 w-full rounded-lg' />
            <Skeleton className='h-8 w-full rounded-lg' />
          </div>
        </aside>
        <div className="flex flex-col lg:pl-64">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6">
            <Skeleton className="h-6 w-32" />
            <div className="relative ml-auto flex-1 md:grow-0"></div>
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </header>
          <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            <Skeleton className="h-[60vh] w-full" />
          </main>
        </div>
      </div>
    );
  }

  console.log('PrivateRoute: Rendering children.');
  return <>{children}</>;
}
