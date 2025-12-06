
import { NextResponse } from 'next/server';
import { getFirebaseAdminDb } from '@/server/lib/firebaseAdmin';
import { Supplier } from '@/shared/types';

export async function GET(request: Request) {
  try {
    const db = getFirebaseAdminDb();
    const suppliersCollection = db.collection('suppliers');
    const snapshot = await suppliersCollection.get();
    const suppliers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Supplier));
    return NextResponse.json(suppliers);
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    return NextResponse.json({ error: 'Failed to fetch suppliers' }, { status: 500 });
  }
}
