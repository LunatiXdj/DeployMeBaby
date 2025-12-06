// src/client/lib/firebase.test.ts

// Mock Firebase modules
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => ({})),
  getApps: jest.fn(() => []),
  getApp: jest.fn(() => ({})),
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({})),
  connectAuthEmulator: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
  connectFirestoreEmulator: jest.fn(),
}));

jest.mock('firebase/storage', () => ({
  getStorage: jest.fn(() => ({})),
  connectStorageEmulator: jest.fn(),
}));

describe('Firebase Initialization', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules(); // Clear cache
    process.env = { ...OLD_ENV }; // Make a copy
  });

  afterAll(() => {
    process.env = OLD_ENV; // Restore old environment
  });

  it('should use dummy config in development when no env vars are set', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

    const { getFirebaseDb } = require('./firebase');
    const { initializeApp } = require('firebase/app');
    getFirebaseDb(); // Trigger initialization

    expect(initializeApp).toHaveBeenCalledWith({
      apiKey: "dummy-key",
      authDomain: "localhost",
      projectId: "demo-project",
      storageBucket: "default-bucket",
      messagingSenderId: "dummy-sender-id",
      appId: "dummy-app-id",
    });
  });

  it('should use env vars in development when they are set', () => {
    process.env.NODE_ENV = 'development';
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'test-api-key';
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'test-project-id';

    const { getFirebaseDb } = require('./firebase');
    const { initializeApp } = require('firebase/app');
    getFirebaseDb();

    expect(initializeApp).toHaveBeenCalledWith(expect.objectContaining({
        apiKey: 'test-api-key',
        projectId: 'test-project-id',
    }));
  });

  it('should use env vars in production', () => {
    process.env.NODE_ENV = 'production';
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'prod-api-key';
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'prod-project-id';

    const { getFirebaseDb } = require('./firebase');
    const { initializeApp } = require('firebase/app');
    getFirebaseDb();

    expect(initializeApp).toHaveBeenCalledWith(expect.objectContaining({
        apiKey: 'prod-api-key',
        projectId: 'prod-project-id',
    }));
  });

  it('should connect to emulators in development', () => {
    process.env.NODE_ENV = 'development';
    const { getFirebaseDb } = require('./firebase');
    const { connectAuthEmulator } = require('firebase/auth');
    const { connectFirestoreEmulator } = require('firebase/firestore');
    const { connectStorageEmulator } = require('firebase/storage');
    getFirebaseDb();

    expect(connectAuthEmulator).toHaveBeenCalledWith(expect.any(Object), "http://localhost:9099");
    expect(connectFirestoreEmulator).toHaveBeenCalledWith(expect.any(Object), 'localhost', 8080);
    expect(connectStorageEmulator).toHaveBeenCalledWith(expect.any(Object), "localhost", 9199);
  });

  it('should not connect to emulators in production', () => {
    process.env.NODE_ENV = 'production';
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'prod-api-key';
    const { getFirebaseDb } = require('./firebase');
    const { connectAuthEmulator } = require('firebase/auth');
    const { connectFirestoreEmulator } = require('firebase/firestore');
    const { connectStorageEmulator } = require('firebase/storage');
    getFirebaseDb();

    expect(connectAuthEmulator).not.toHaveBeenCalled();
    expect(connectFirestoreEmulator).not.toHaveBeenCalled();
    expect(connectStorageEmulator).not.toHaveBeenCalled();
  });

  it('should initialize only once', () => {
    process.env.NODE_ENV = 'development';
    const { getFirebaseAuth, getFirebaseDb, getFirebaseStorage } = require('./firebase');
    const { initializeApp } = require('firebase/app');
    
    getFirebaseAuth();
    getFirebaseDb();
    getFirebaseStorage();

    expect(initializeApp).toHaveBeenCalledTimes(1);
  });
});
