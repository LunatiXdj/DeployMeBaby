import * as admin from 'firebase-admin';
import serviceAccount from './x-tool-ph-service-firebase-adminsdk-fbsvc-f461726f22.json';

let _adminDb: admin.firestore.Firestore | undefined;
let _adminAuth: admin.auth.Auth | undefined;
let _adminStorage: admin.storage.Storage | undefined;

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as any),
      databaseURL: `https://${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebaseio.com`,
      storageBucket: `${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.appspot.com`,
    });
    _adminDb = admin.firestore();
    _adminAuth = admin.auth();
    _adminStorage = admin.storage();
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
} else {
  _adminDb = admin.firestore();
  _adminAuth = admin.auth();
  _adminStorage = admin.storage();
}

export function getFirebaseAdminDb(): admin.firestore.Firestore {
  if (!_adminDb) throw new Error('Firebase Admin SDK is not initialized.');
  return _adminDb;
}

export function getFirebaseAdminAuth(): admin.auth.Auth {
  if (!_adminAuth) throw new Error('Firebase Admin SDK is not initialized.');
  return _adminAuth;
}

export function getFirebaseAdminStorage(): admin.storage.Storage {
  if (!_adminStorage) throw new Error('Firebase Admin SDK is not initialized.');
  return _adminStorage;
}

// Backwards-compat exports (may be undefined during dev if not initialized)
export const adminDb = _adminDb;
export const adminAuth = _adminAuth;
export const adminStorage = _adminStorage;
