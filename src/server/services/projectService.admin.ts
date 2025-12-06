
import { getFirebaseAdminDb } from '@/server/lib/firebaseAdmin';
import type { Project } from '@/shared/types';
import { DocumentData, QueryDocumentSnapshot, SnapshotOptions, Timestamp } from 'firebase-admin/firestore';

const toISOStringOrUndefined = (date: any): string | undefined => {
    if (!date) return undefined;
    if (typeof date === 'string') return date;
    if (date.toDate) return date.toDate().toISOString();
    return undefined;
}

const projectConverter = {
    toFirestore(project: Project): DocumentData {
        return project;
    },
    fromFirestore(
        snapshot: QueryDocumentSnapshot,
        options: SnapshotOptions
    ): Project {
        const data = snapshot.data(options);
        return {
            ...data,
            id: snapshot.id,
            createdAt: toISOStringOrUndefined(data.createdAt),
            startDate: toISOStringOrUndefined(data.startDate),
            endDate: toISOStringOrUndefined(data.endDate),
        } as Project;
    }
};

export async function getAllProjects(): Promise<Project[]> {
    const db = getFirebaseAdminDb();
    const projectsCollection = db.collection('projects').withConverter(projectConverter);
    const snapshot = await projectsCollection.get();
    return snapshot.docs.map(doc => doc.data());
}

export async function getProject(projectId: string): Promise<Project | null> {
    console.log('getProject called with projectId:', projectId);
    const db = getFirebaseAdminDb();
    const projectRef = db.collection('projects').doc(projectId).withConverter(projectConverter);
    const projectDoc = await projectRef.get();

    if (!projectDoc.exists) return null;

    return projectDoc.data();
}

export async function createProject(projectData: Partial<Project>): Promise<Project> {
    const db = getFirebaseAdminDb();
    const projectsCollection = db.collection('projects').withConverter(projectConverter);
    const docRef = await projectsCollection.add({
        ...projectData,
        createdAt: new Date().toISOString(),
    } as Project);
    const newProjectDoc = await docRef.get();
    return newProjectDoc.data() as Project;
}

export async function updateProject(projectId: string, projectData: Partial<Project>): Promise<Project> {
    const db = getFirebaseAdminDb();
    const projectRef = db.collection('projects').doc(projectId).withConverter(projectConverter);
    await projectRef.update(projectData);
    const updatedProjectDoc = await projectRef.get();
    return updatedProjectDoc.data() as Project;
}

export async function deleteProject(projectId: string): Promise<void> {
    if (!projectId) {
        throw new Error("Projekt-ID zum Löschen fehlt.");
    }
    const db = getFirebaseAdminDb();
    await db.collection('projects').doc(projectId).delete();
}
