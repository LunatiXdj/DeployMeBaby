import { NextResponse } from 'next/server';
import { getProject, updateProject } from '@/server/services/projectService';

export async function GET(request: Request, { params }: { params: { projectId: string } }) {
  const projectId = params.projectId;
  if (!projectId || projectId === 'undefined') {
    return NextResponse.json({ error: 'Project ID is invalid or not provided' }, { status: 400 });
  }
  
  try {
    const project = await getProject(projectId);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    return NextResponse.json(project);
  } catch (error) {
    console.error(`Error fetching project ${projectId}:`, error);
    return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { projectId: string } }) {
  const projectId = params.projectId;
  if (!projectId || projectId === 'undefined') {
    return NextResponse.json({ error: 'Project ID is invalid or not provided' }, { status: 400 });
  }

  try {
    const projectData = await request.json();
    const updatedProject = await updateProject(projectId, projectData);
    return NextResponse.json(updatedProject);
  } catch (error) {
    console.error(`Error updating project ${projectId}:`, error);
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
  }
}
