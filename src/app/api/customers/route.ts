
import { NextResponse } from 'next/server';
import { getFirebaseAdminDb } from '@/server/lib/firebaseAdmin';
import { Customer } from '@/shared/types';

export async function GET(request: Request) {
  try {
    const db = getFirebaseAdminDb();
    const customersCollection = db.collection('customers');
    const snapshot = await customersCollection.get();
    const customers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer));
    return NextResponse.json(customers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    // In production, you might want to log this error to a service
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
  }
}
