
import { getFirebaseAdminDb } from '@/server/lib/firebaseAdmin';
import type { Customer } from '@/shared/types';
import { DocumentData, QueryDocumentSnapshot, SnapshotOptions, Timestamp } from 'firebase-admin/firestore';

const toISOStringOrUndefined = (date: any): string | undefined => {
    if (!date) return undefined;
    if (typeof date === 'string') return date;
    if (date.toDate) return date.toDate().toISOString();
    return undefined;
}

const customerConverter = {
    toFirestore(customer: Customer): DocumentData {
        // We don't implement this because we only read data in this service
        return customer;
    },
    fromFirestore(
        snapshot: QueryDocumentSnapshot,
        options: SnapshotOptions
    ): Customer {
        const data = snapshot.data(options);
        return {
            ...data,
            id: snapshot.id,
            createdAt: toISOStringOrUndefined(data.createdAt),
        } as Customer;
    }
};

export async function getAllCustomers(): Promise<Customer[]> {
    const db = getFirebaseAdminDb();
    const customersCollection = db.collection('customers').withConverter(customerConverter);
    const snapshot = await customersCollection.orderBy('name').get();
    return snapshot.docs.map(doc => doc.data());
}

export async function getCustomers(customerIds: string[]): Promise<Customer[]> {
    if (customerIds.length === 0) return [];
    const db = getFirebaseAdminDb();
    const customersCollection = db.collection('customers').withConverter(customerConverter);
    // Firestore 'in' queries are limited to 10 items. We need to fetch in batches.
    const customerPromises = [];
    for (let i = 0; i < customerIds.length; i += 10) {
        const chunk = customerIds.slice(i, i + 10);
        customerPromises.push(customersCollection.where('id', 'in', chunk).get());
    }
    const snapshots = await Promise.all(customerPromises);
    return snapshots.flatMap(snapshot => snapshot.docs.map(doc => doc.data()));
}


export async function getCustomer(customerId: string): Promise<Customer | null> {
    const db = getFirebaseAdminDb();
    const customerRef = db.collection('customers').doc(customerId).withConverter(customerConverter);
    const customerDoc = await customerRef.get();

    if (!customerDoc.exists) return null;

    return customerDoc.data();
}

export async function updateCustomer(customerId: string, customerData: Partial<Customer>): Promise<Customer> {
    const db = getFirebaseAdminDb();
    const customerRef = db.collection('customers').doc(customerId);
    await customerRef.update(customerData);
    const updatedDoc = await customerRef.withConverter(customerConverter).get();
    return updatedDoc.data()!;
}

export async function deleteCustomer(customerId: string): Promise<void> {
    const db = getFirebaseAdminDb();
    await db.collection('customers').doc(customerId).delete();
}
