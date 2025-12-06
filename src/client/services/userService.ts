import { getFirebaseDb } from '@/client/lib/firebase';
import type { AuthUser } from '@/client/contexts/auth-context';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';

function getUsersCollection() {
    const db = getFirebaseDb();
    return collection(db, 'users');
}

export async function getUsers(): Promise<AuthUser[]> {
    const snapshot = await getDocs(getUsersCollection());
    return snapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id } as AuthUser));
}

export async function updateUserRole(uid: string, role: 'admin' | 'user'): Promise<void> {
    const userRef = doc(getUsersCollection(), uid);
    await updateDoc(userRef, { role });
}
