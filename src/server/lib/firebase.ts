import * as admin from 'firebase-admin';

let _adminDb: admin.firestore.Firestore | undefined;
let _adminAuth: admin.auth.Auth | undefined;
let _adminStorage: admin.storage.Storage | undefined;

if (!admin.apps.length) {
  try {
    // Use environment variables for Firebase Admin credentials
    const serviceAccount = {
      type: "service_account",
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
    };

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
