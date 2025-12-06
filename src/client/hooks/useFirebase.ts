'use client';

import { useEffect, useState } from 'react';
import { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import type { FirebaseStorage } from 'firebase/storage';
import { getFirebaseAuth, getFirebaseDb, getFirebaseStorage } from '@/client/lib/firebase';

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

interface FirebaseServices {
    app: FirebaseApp;
    auth: Auth;
    db: Firestore | null;
    storage: FirebaseStorage | null;
}

// Hook returns null until Firebase is initialized on the client (initialized in useEffect)
export function useFirebase(): FirebaseServices | null {
    const [services, setServices] = useState<FirebaseServices | null>(null);

    useEffect(() => {
        // Only run on the client
        if (typeof window === 'undefined') return;
        if (services) return;

        (async () => {
            try {
                // Dynamically import firebase/app and submodules so they share the same runtime instance
                // Use synchronous getters from the central firebase lib so we always
                // get the same runtime instance and keep the API simple for consumers.
                const auth = getFirebaseAuth();
                const db = getFirebaseDb();
                const storage = getFirebaseStorage();
                // app is not exposed directly here; it's fine for Auth consumers
                setServices({ app: (null as any) as FirebaseApp, auth, db, storage });
            } catch (err) {
                // initialization failed; leave services null so consumers can show a loading/error state
                // log to console for developer debugging
                // eslint-disable-next-line no-console
                console.error('useFirebase: failed to initialize Firebase', err);
            }
        })();
    }, [services]);

    return services;
}
