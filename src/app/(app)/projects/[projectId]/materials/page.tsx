import { use } from 'react';
import { ProjectMaterials } from '@/client/components/features/project-materials';
import { getProjects } from '@/server/services/projectService';

interface PageProps {
  params: Promise<{ projectId: string }>;
}

export async function generateStaticParams() {
  try {
    const projects = await getProjects();
    return projects
      .filter(project => project.id)
      .map((project) => ({
        projectId: project.id,
      }));
  } catch (error) {
    // Return empty array if Firebase is not available (e.g., during build)
    console.warn('Could not generate static params for projects:', error);
    return [];
  }
}

export default function ProjectMaterialsPage({ params }: PageProps) {
    const resolvedParams = use(params);
    return <ProjectMaterials projectId={resolvedParams.projectId} />;
}
