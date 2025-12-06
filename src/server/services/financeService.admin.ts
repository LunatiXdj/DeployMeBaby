
import { getFirebaseAdminDb } from '@/server/lib/firebaseAdmin';
import type { Transaction } from '@/shared/types';
import { Timestamp, QueryDocumentSnapshot } from 'firebase-admin/firestore';

function getTransactionsCollection() {
    const db = getFirebaseAdminDb();
    return db.collection('transactions');
}

function transactionFromDoc(doc: QueryDocumentSnapshot): Transaction {
    const data = doc.data();
    const createdAt = data.createdAt as Timestamp; // Cast to Firestore Timestamp

    return {
        id: doc.id,
        date: data.date,
        description: data.description,
        amount: data.amount,
        type: data.type,
        category: data.category,
        relatedTo: data.relatedTo,
        // Securely convert timestamp to ISO string if it exists
        createdAt: createdAt?.toDate ? createdAt.toDate().toISOString() : new Date().toISOString(),
        netAmount: data.netAmount,
        vatAmount: data.vatAmount,
        taxRate: data.taxRate,
        projectId: data.projectId,
        receiptUrl: data.receiptUrl,
    };
}

export async function getTransactions(): Promise<Transaction[]> {
    const snapshot = await getTransactionsCollection().get();
    return snapshot.docs.map(transactionFromDoc);
}
