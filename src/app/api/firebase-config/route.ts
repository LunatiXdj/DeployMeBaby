import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // These variables should be set on the server environment.
    const firebaseConfig = {
      apiKey: process.env.FIREBASE_API_KEY,
      authDomain: process.env.FIREBASE_AUTH_DOMAIN,
      projectId: process.env.FIREBASE_PROJECT_ID,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.FIREBASE_APP_ID,
    };

    // Basic validation
    if (!firebaseConfig.apiKey) {
      throw new Error('Firebase config is missing on the server.');
    }

    return NextResponse.json(firebaseConfig);
  } catch (error) {
    console.error('Error fetching Firebase client config:', error);
    return NextResponse.json({ error: 'Failed to fetch Firebase config' }, { status: 500 });
  }
}
