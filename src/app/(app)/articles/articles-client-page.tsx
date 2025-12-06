'use client';

import dynamic from 'next/dynamic';

const ArticleManagement = dynamic(() => import('@/client/components/features/article-management').then(mod => mod.ArticleManagement), { ssr: false });

export default function ArticlesClientPage() {
  return <ArticleManagement />;
}
