import { useFirebase } from '@/client/hooks/useFirebase';
import type { Project } from '@/shared/types';
import { collection, getDocs, doc, getDoc, addDoc, setDoc, updateDoc, deleteDoc, query, where, orderBy, QueryDocumentSnapshot } from 'firebase/firestore';

export function useProjectService() {
    const firebase = useFirebase();
    const db = firebase?.db;

    function getProjectsCollection() {
        if (!db) throw new Error("Firestore not initialized");
        return collection(db, 'projects');
    }

    function projectFromDoc(doc: QueryDocumentSnapshot): Project {
        const data = doc.data();
        return { id: doc.id, ...data } as Project;
    }

    async function getProjects(): Promise<Project[]> {
        const snapshot = await getDocs(query(getProjectsCollection(), orderBy('projectName')));
        return snapshot.docs.map(projectFromDoc);
    }

    async function getProject(projectId: string): Promise<Project | null> {
        if (!db) throw new Error("Firestore not initialized");
        const docRef = doc(db, 'projects', projectId);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? projectFromDoc(docSnap as QueryDocumentSnapshot) : null;
    }

    async function createProject(projectData: Partial<Project>): Promise<Project> {
        if (!db) throw new Error("Firestore not initialized");
        const docRef = await addDoc(getProjectsCollection(), { ...projectData, createdAt: new Date().toISOString() });
        const newProject = await getProject(docRef.id);
        if (!newProject) throw new Error("Failed to create project");
        return newProject;
    }

    async function updateProject(projectId: string, projectData: Partial<Project>): Promise<Project> {
        if (!db) throw new Error("Firestore not initialized");
        const docRef = doc(db, 'projects', projectId);
        await updateDoc(docRef, projectData);
        const updatedProject = await getProject(projectId);
        if (!updatedProject) throw new Error("Failed to update project");
        return updatedProject;
    }

    async function saveProject(projectData: Partial<Project>): Promise<Project> {
        if (projectData.id) {
            return updateProject(projectData.id, projectData);
        } else {
            return createProject(projectData);
        }
    }

    async function deleteProject(projectId: string): Promise<void> {
        if (!db) throw new Error("Firestore not initialized");
        await deleteDoc(doc(db, 'projects', projectId));
    }

    return {
        getProjects,
        getProject,
        createProject,
        updateProject,
        saveProject,
        deleteProject,
    };
}

// Backwards-compatible top-level exports
import { getFirebaseDb } from '@/client/lib/firebase';

export async function getProjects(): Promise<Project[]> {
    const db = getFirebaseDb();
    const snapshot = await getDocs(query(collection(db, 'projects'), orderBy('projectName')));
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Project));
}

export async function getProject(projectId: string): Promise<Project | null> {
    const db = getFirebaseDb();
    const docRef = doc(db, 'projects', projectId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? ({ id: docSnap.id, ...docSnap.data() } as Project) : null;
}

export async function saveProject(projectData: Partial<Project>): Promise<Project> {
    const db = getFirebaseDb();
    if (projectData.id) {
        const docRef = doc(db, 'projects', projectData.id);
        await updateDoc(docRef, projectData as any);
        const updated = await getDoc(docRef);
        return { id: updated.id, ...updated.data() } as Project;
    } else {
        const docRef = await addDoc(collection(db, 'projects'), { ...projectData, createdAt: new Date().toISOString() });
        const newDoc = await getDoc(docRef);
        return { id: newDoc.id, ...newDoc.data() } as Project;
    }
}

// Backwards-compatible alias: some code imports `updateProject` directly
export const updateProject = async (projectId: string, projectData: Partial<Project>) => {
    const db = getFirebaseDb();
    const docRef = doc(db, 'projects', projectId);
    await updateDoc(docRef, projectData as any);
    const updated = await getDoc(docRef);
    return { id: updated.id, ...updated.data() } as Project;
}

export async function deleteProject(projectId: string): Promise<void> {
    const db = getFirebaseDb();
    await deleteDoc(doc(db, 'projects', projectId));
}
