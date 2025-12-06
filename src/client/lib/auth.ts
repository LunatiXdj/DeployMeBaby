export {
    getAuth,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut,
} from 'firebase/auth';

// Re-export the synchronous getter for compatibility; consumers that need
// the auth instance should call `getFirebaseAuth()` (it's sync in `./firebase`).
export { getFirebaseAuth } from './firebase';
