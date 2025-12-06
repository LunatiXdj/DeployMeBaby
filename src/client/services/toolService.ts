import { useFirebase } from '@/client/hooks/useFirebase';
import type { Tool } from '@/shared/types';
import { collection, getDocs, doc, getDoc, addDoc, setDoc, deleteDoc, QueryDocumentSnapshot } from 'firebase/firestore';

export function useToolService() {
    const firebase = useFirebase();
    const db = firebase?.db;

    function getToolsCollection() {
        if (!db) throw new Error("Firestore not initialized");
        return collection(db, 'tools');
    }

    function toolFromDoc(doc: QueryDocumentSnapshot): Tool {
        const data = doc.data();
        return { id: doc.id, ...data } as Tool;
    }

    async function getTools(): Promise<Tool[]> {
        const snapshot = await getDocs(getToolsCollection());
        return snapshot.docs.map(toolFromDoc);
    }

    async function getTool(id: string): Promise<Tool | null> {
        if (!db) throw new Error("Firestore not initialized");
        const docRef = doc(db, 'tools', id);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? toolFromDoc(docSnap as QueryDocumentSnapshot) : null;
    }

    async function saveTool(tool: Partial<Omit<Tool, 'id'>> & { id?: string }): Promise<Tool> {
        const { id, ...toolData } = tool;
        if (!db) throw new Error("Firestore not initialized");
        if (id) {
            const docRef = doc(db, 'tools', id);
            await setDoc(docRef, toolData, { merge: true });
            const updatedDoc = await getDoc(docRef);
            return toolFromDoc(updatedDoc as QueryDocumentSnapshot);
        } else {
            const docRef = await addDoc(getToolsCollection(), { ...toolData, createdAt: new Date().toISOString() });
            const newDoc = await getDoc(docRef);
            return toolFromDoc(newDoc as QueryDocumentSnapshot);
        }
    }

    async function deleteTool(id: string): Promise<void> {
        if (!db) throw new Error("Firestore not initialized");
        await deleteDoc(doc(db, 'tools', id));
    }

    return {
        getTools,
        getTool,
        saveTool,
        deleteTool,
    };
}

// Backwards-compatible top-level exports
import { getFirebaseDb } from '@/client/lib/firebase';

export async function getTools(): Promise<Tool[]> {
    const db = getFirebaseDb();
    const snapshot = await getDocs(collection(db, 'tools'));
    return snapshot.docs.map((d: QueryDocumentSnapshot) => ({ id: d.id, ...d.data() } as Tool));
}

export async function getTool(id: string): Promise<Tool | null> {
    const db = getFirebaseDb();
    const docRef = doc(db, 'tools', id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? ({ id: docSnap.id, ...docSnap.data() } as Tool) : null;
}

export async function saveTool(tool: Partial<Omit<Tool, 'id'>> & { id?: string }): Promise<Tool> {
    const db = getFirebaseDb();
    const { id, ...toolData } = tool;
    if (id) {
        const docRef = doc(db, 'tools', id);
        await setDoc(docRef, toolData, { merge: true });
        const updated = await getDoc(docRef);
        return { id: updated.id, ...updated.data() } as Tool;
    } else {
        const docRef = await addDoc(collection(db, 'tools'), { ...toolData, createdAt: new Date().toISOString() });
        const newDoc = await getDoc(docRef);
        return { id: newDoc.id, ...newDoc.data() } as Tool;
    }
}

export async function deleteTool(id: string): Promise<void> {
    const db = getFirebaseDb();
    await deleteDoc(doc(db, 'tools', id));
}
