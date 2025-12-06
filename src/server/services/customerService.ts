import { getFirebaseAdminDb } from '@/server/lib/firebaseAdmin';
import type { Customer } from '@/shared/types';
import { DocumentData, QueryDocumentSnapshot, Timestamp } from 'firebase-admin/firestore';

const customerConverter = {
    toFirestore(customer: Customer): DocumentData {
        return customer;
    },
    fromFirestore(
        snapshot: QueryDocumentSnapshot
    ): Customer {
        const data = snapshot.data();
        const firestoreCreatedAt = data.createdAt as Timestamp;
        return {
            id: snapshot.id,
            salutation: data.salutation,
            name: data.name,
            address: data.address,
            phone: data.phone,
            mobilePhone: data.mobilePhone,
            email: data.email,
            website: data.website,
            socialMediaLink: data.socialMediaLink,
            isPrivate: data.isPrivate,
            usePaypal: data.usePaypal,
            billingInfo: data.billingInfo,
            contactPerson: data.contactPerson,
            notes: data.notes,
            projectIds: data.projectIds,
            openBalance: data.openBalance,
            dunningLevel: data.dunningLevel,
            dunningLevelReached: data.dunningLevelReached,
            status: data.status,
            lastContactType: data.lastContactType,
            lastContactDate: data.lastContactDate,
            contactLog: data.contactLog,
            createdAt: firestoreCreatedAt?.toDate ? firestoreCreatedAt.toDate().toISOString() : new Date().toISOString(),
        };
    }
};

export async function getCustomers(): Promise<Customer[]> {
    const db = getFirebaseAdminDb();
    const customersCollection = db.collection('customers').withConverter(customerConverter);
    const snapshot = await customersCollection.orderBy('createdAt', 'desc').get();
    return snapshot.docs.map(doc => doc.data());
}

export async function getCustomer(customerId: string): Promise<Customer | null> {
    console.log('getCustomer called with customerId:', customerId);
    const db = getFirebaseAdminDb();
    const customerRef = db.collection('customers').doc(customerId).withConverter(customerConverter);
    const customerDoc = await customerRef.get();

    if (!customerDoc.exists) {
        return null;
    }
    
    const data = customerDoc.data();
    return data || null;
}
