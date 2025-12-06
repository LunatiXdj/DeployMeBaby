
import { NextResponse } from 'next/server';
import { getFirebaseAdminDb } from '@/server/lib/firebaseAdmin';
import { auth } from 'firebase-admin';

export async function POST(req: Request) {
  try {
    const { uid } = await req.json();

    if (!uid) {
      return NextResponse.json({ error: 'UID is required' }, { status: 400 });
    }

    // Set custom claim
    await auth().setCustomUserClaims(uid, { admin: true });

    // Set isAdmin field in Firestore
    const db = getFirebaseAdminDb();
    await db.collection('users').doc(uid).set({ isAdmin: true }, { merge: true });

    return NextResponse.json({ message: `Admin status set for user ${uid}` });
  } catch (error) {
    console.error("Error setting admin status:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
