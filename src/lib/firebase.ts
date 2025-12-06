// src/lib/firebase.ts

import { initializeApp, getApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type Storage } from 'firebase/storage';
import firebaseConfig from '../firebaseConfig';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: Storage | null = null;

function initializeFirebase() {
    if (typeof window !== 'undefined' && !app) {
        app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
        auth = getAuth(app);
        db = getFirestore(app);
        storage = getStorage(app);
    }
}

// Ensure Firebase is initialized on the client
initializeFirebase();

export const getFirebaseApp = () => {
    if (!app) initializeFirebase();
    return app;
};

export const getFirebaseAuth = () => {
    if (!auth) initializeFirebase();
    return auth;
}

export const getDb = () => {
    if (!db) initializeFirebase();
    return db;
};

export const getStorageInstance = () => {
    if (!storage) initializeFirebase();
    return storage;
};