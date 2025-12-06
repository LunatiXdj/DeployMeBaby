import { adminDb } from '@/server/lib/firebase-admin';
import type { Customer } from '@/shared/types';
import { QueryDocumentSnapshot } from 'firebase-admin/firestore';

function customerFromDoc(doc: QueryDocumentSnapshot): Customer {
    const data = doc.data(); 
    const createdAt = data.createdAt;
    return {
        id: doc.id,
        salutation: data.salutation || 'Firma',
        name: data.name || '',
        address: data.address || '',
        phone: data.phone || '',
        mobilePhone: data.mobilePhone || '',
        email: data.email || '',
        website: data.website || '',
        socialMediaLink: data.socialMediaLink || '',
        isPrivate: data.isPrivate || false,
        usePaypal: data.usePaypal || false,
        billingInfo: data.billingInfo || '',
        contactPerson: data.contactPerson || '',
        notes: data.notes || '',
        projectIds: data.projectIds || [],
        openBalance: data.openBalance || 0,
        dunningLevel: data.dunningLevel || 0,
        dunningLevelReached: data.dunningLevelReached || false,
        status: data.status || 'active',
        lastContactType: data.lastContactType,
        lastContactDate: data.lastContactDate || null,
        contactLog: data.contactLog || [],
        createdAt: typeof createdAt === 'string' ? createdAt : createdAt?.toDate().toISOString() || new Date().toISOString(),
    };
}

export async function getCustomersAdmin(): Promise<Customer[]> {
  const customersCollection = adminDb.collection('customers');
  const q = customersCollection.orderBy('createdAt', 'desc');
  const snapshot = await q.get();
  
  const validDocs = snapshot.docs.filter(doc => doc.exists && Object.keys(doc.data()).length > 0);
  
  return validDocs.map(customerFromDoc);
}
