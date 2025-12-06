// src/lib/firebase.ts
'use client';

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let cachedApp: FirebaseApp | null = null;
let cachedAuth: Auth | null = null;
let cachedDb: Firestore | null = null;
let cachedStorage: FirebaseStorage | null = null;

function ensureApp(): FirebaseApp {
    if (typeof window === 'undefined') {
        throw new Error('Firebase client SDK cannot be used on the server');
    }
    if (cachedApp) return cachedApp;
    if (getApps().length === 0) {
        cachedApp = initializeApp(firebaseConfig);
        // Eagerly register Firestore and Storage providers on the newly created app.
        // This helps avoid "Service firestore is not available" errors when
        // other modules call getFirestore() before the provider is registered.
        try {
            // Register providers and log diagnostic info to detect multiple
            // @firebase/component instances in the bundle (which cause provider
            // mismatch errors like "Service firestore is not available").
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const _db = getFirestore(cachedApp);
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const _storage = getStorage(cachedApp);
            // Try to report component version if available
            let componentVersion: string | undefined;
            try {
                // @firebase/component exports a version in some builds; require
                // may not be available in bundlers, so guard it.
                // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-unsafe-assignment
                const comp = (globalThis as any).__firebase_component__ || undefined;
                if (comp && comp.VERSION) componentVersion = comp.VERSION;
            } catch (_err) {
                // ignore
            }
            // eslint-disable-next-line no-console
            console.debug('[firebase] ensureApp: registered firestore/storage providers', { getApps: getApps().length, appName: cachedApp?.name, componentVersion });
        } catch (e) {
            // If registration fails, log and continue; the lazy getters will
            // attempt again when used and surface helpful errors.
            // eslint-disable-next-line no-console
            console.warn('[firebase] ensureApp: failed to register firestore/storage providers', e);
        }
    } else {
        cachedApp = getApp();
    }
    return cachedApp;
}

export const getFirebaseAuth = (): Auth => {
    if (cachedAuth) return cachedAuth;
    const app = ensureApp();
    // Debug tracing to help diagnose provider issues in dev
    // eslint-disable-next-line no-console
    console.debug('[firebase] getFirebaseAuth: getApps()', getApps().length, 'appName=', app?.name);
    cachedAuth = getAuth(app);
    return cachedAuth;
};

export const getFirebaseDb = (): Firestore => {
    if (cachedDb) return cachedDb;
    const app = ensureApp();
    // Debug tracing to help diagnose provider issues in dev
    // eslint-disable-next-line no-console
    console.debug('[firebase] getFirebaseDb: getApps()', getApps().length, 'appName=', app?.name);
    try {
        cachedDb = getFirestore(app);
    } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[firebase] getFirebaseDb: getFirestore failed', err);
        throw err;
    }
    return cachedDb;
};

export const getFirebaseStorage = (): FirebaseStorage => {
    if (cachedStorage) return cachedStorage;
    const app = ensureApp();
    cachedStorage = getStorage(app);
    return cachedStorage;
};

// For backward compatibility, do not export `app`, `db`, `auth`, `storage` directly.
