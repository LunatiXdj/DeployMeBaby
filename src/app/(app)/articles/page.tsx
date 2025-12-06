'use client';

import dynamic from 'next/dynamic';

const ArticleManagement = dynamic(
  () => import('@/client/components/features/article-management').then(mod => ({ default: mod.ArticleManagement })),
  {
    ssr: false,
    loading: () => <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }
);

export default function ArticlesPage() {
  return <ArticleManagement />;
}
