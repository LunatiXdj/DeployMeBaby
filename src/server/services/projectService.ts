
import { getFirebaseAdminDb } from '@/server/lib/firebaseAdmin';
import type { Project } from '@/shared/types';
import { DocumentData, QueryDocumentSnapshot, SnapshotOptions, Timestamp } from 'firebase-admin/firestore';

const projectConverter = {
    toFirestore(project: Project): DocumentData {
        return project;
    },
    fromFirestore(
        snapshot: QueryDocumentSnapshot,
        options: SnapshotOptions
    ): Project {
        const data = snapshot.data(options);
        const firestoreCreatedAt = data.createdAt as Timestamp;
        return {
            id: snapshot.id,
            projectName: data.projectName,
            projectNumber: data.projectNumber,
            customerId: typeof data.customerId === 'string' ? data.customerId : '',
            status: data.status,
            startDate: data.startDate,
            endDate: data.endDate,
            plannedEvents: data.plannedEvents,
            createdAt: firestoreCreatedAt?.toDate ? firestoreCreatedAt.toDate().toISOString() : new Date().toISOString(),
        };
    }
};

export async function getProjects(): Promise<Project[]> {
    const db = getFirebaseAdminDb();
    const projectsCollection = db.collection('projects').withConverter(projectConverter);
    const snapshot = await projectsCollection.orderBy('createdAt', 'desc').get();
    return snapshot.docs.map(doc => doc.data());
}

export async function getProject(projectId: string): Promise<Project | null> {
    if (!projectId || typeof projectId !== 'string') {
        console.error('getProject called with invalid projectId:', projectId);
        throw new Error('Invalid projectId provided. Must be a non-empty string.');
    }

    console.log('getProject called with projectId:', projectId);
    const db = getFirebaseAdminDb();
    const projectRef = db.collection('projects').doc(projectId).withConverter(projectConverter);
    const projectDoc = await projectRef.get();

    if (!projectDoc.exists) return null;

    return projectDoc.data();
}

export async function updateProject(projectId: string, projectData: Partial<Project>): Promise<Project> {
    const db = getFirebaseAdminDb();
    const projectRef = db.collection('projects').doc(projectId);
    
    const dataToUpdate = { ...projectData };
    if ('id' in dataToUpdate) {
        delete (dataToUpdate as {id?: string}).id;
    }

    await projectRef.update(dataToUpdate);

    const updatedDoc = await projectRef.withConverter(projectConverter).get();
    if (!updatedDoc.exists) {
        throw new Error('Project could not be found after update.');
    }
    return updatedDoc.data() as Project;
}
