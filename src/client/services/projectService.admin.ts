import { adminDb } from '@/server/lib/firebase-admin';
import type { Project } from '@/shared/types';
import { QueryDocumentSnapshot } from 'firebase-admin/firestore';

function projectFromDoc(doc: QueryDocumentSnapshot): Project {
    const data = doc.data();
    const createdAt = data.createdAt;
    return {
        id: doc.id,
        projectName: data.projectName || '',
        projectNumber: data.projectNumber || '',
        customerId: data.customerId || '',
        status: data.status || 'offen',
        startDate: data.startDate || null,
        endDate: data.endDate || null,
        plannedEvents: data.plannedEvents || [],
        createdAt: typeof createdAt === 'string' ? createdAt : createdAt?.toDate().toISOString() || new Date().toISOString(),
    };
}

export async function getProjectsAdmin(): Promise<Project[]> {
  const projectsCollection = adminDb.collection('projects');
  const q = projectsCollection.orderBy('createdAt', 'desc');
  const snapshot = await q.get();
  return snapshot.docs.map(projectFromDoc);
}
