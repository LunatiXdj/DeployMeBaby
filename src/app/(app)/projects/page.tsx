'use client';

import dynamic from 'next/dynamic';

const ProjectManagement = dynamic(
  () => import("@/client/components/features/project-management").then(mod => ({ default: mod.ProjectManagement })),
  {
    ssr: false,
    loading: () => <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }
);

export default function ProjectsPage() {
  return (
    <div>
      <ProjectManagement />
    </div>
  );
}