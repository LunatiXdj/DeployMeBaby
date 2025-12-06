// This file historically contained a second client initializer and helpers.
// Keep a very small compatibility shim that re-exports the canonical getters
// from `./firebase` to avoid duplicate initialization and provider mismatches.
export { getFirebaseAuth, getFirebaseDb, getFirebaseStorage } from './firebase';

import { getFirebaseDb } from './firebase';
import { collection, addDoc } from 'firebase/firestore';

export const logError = async (error: any, context: string) => {
    try {
        const db = getFirebaseDb();
        await addDoc(collection(db, 'errors'), {
            error: JSON.stringify(error, Object.getOwnPropertyNames(error)),
            context,
            createdAt: new Date(),
            userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
        });
    } catch (e) {
        console.error('Failed to log error to Firestore:', e);
    }
};
