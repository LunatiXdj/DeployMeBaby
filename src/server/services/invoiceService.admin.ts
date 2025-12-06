
import { getFirebaseAdminDb } from '@/server/lib/firebaseAdmin';
import type { Invoice } from '@/shared/types';
import { DocumentData, QueryDocumentSnapshot, SnapshotOptions, Timestamp } from 'firebase-admin/firestore';

const toISOStringOrUndefined = (date: any): string | undefined => {
    if (!date) return undefined;
    if (typeof date === 'string') return date;
    if (date.toDate) return date.toDate().toISOString();
    return undefined;
}

const invoiceConverter = {
    toFirestore(invoice: Invoice): DocumentData {
        return invoice;
    },
    fromFirestore(
        snapshot: QueryDocumentSnapshot,
        options: SnapshotOptions
    ): Invoice {
        const data = snapshot.data(options);
        return {
            ...data,
            id: snapshot.id,
            invoiceDate: toISOStringOrUndefined(data.invoiceDate),
            dueDate: toISOStringOrUndefined(data.dueDate),
        } as Invoice;
    }
};

export async function getNextInvoiceNumber(): Promise<string> {
    const db = getFirebaseAdminDb();
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');

    const prefix = `RE${year}${month}`;

    const invoicesCollection = db.collection('invoices');
    const snapshot = await invoicesCollection
        .where('invoiceNumber', '>=', prefix)
        .where('invoiceNumber', '<', prefix + 'Z')
        .orderBy('invoiceNumber', 'desc')
        .limit(1)
        .get();

    let nextSeq = 1;

    if (!snapshot.empty) {
        const lastInvoiceNumber = snapshot.docs[0].data().invoiceNumber as string;
        const parts = lastInvoiceNumber.split('-');
        const lastSeqStr = parts[1] || '0';
        const lastSeq = parseInt(lastSeqStr, 10);
        nextSeq = lastSeq + 1;
    }

    const nextSeqStr = nextSeq.toString().padStart(3, '0');

    return `${prefix}-${nextSeqStr}`;
}


export async function getAllInvoices(): Promise<Invoice[]> {
    const db = getFirebaseAdminDb();
    const invoicesCollection = db.collection('invoices').withConverter(invoiceConverter);
    const snapshot = await invoicesCollection.get();
    return snapshot.docs.map(doc => doc.data());
}

export async function createInvoice(invoiceData: Partial<Invoice>): Promise<Invoice> {
    const db = getFirebaseAdminDb();
    const invoicesCollection = db.collection('invoices').withConverter(invoiceConverter);
    const invoiceNumber = await getNextInvoiceNumber();
    const docRef = await invoicesCollection.add({
        ...invoiceData,
        invoiceNumber: invoiceNumber,
        createdAt: new Date().toISOString(),
    } as Invoice);
    const newInvoiceDoc = await docRef.get();
    return newInvoiceDoc.data() as Invoice;
}

export async function getInvoice(invoiceId: string): Promise<Invoice | null> {
    const db = getFirebaseAdminDb();
    const invoiceRef = db.collection('invoices').doc(invoiceId).withConverter(invoiceConverter);
    const invoiceDoc = await invoiceRef.get();

    if (!invoiceDoc.exists) return null;

    return invoiceDoc.data();
}

export async function updateInvoice(invoiceId: string, invoiceData: Partial<Invoice>): Promise<Invoice> {
    const db = getFirebaseAdminDb();
    const invoiceRef = db.collection('invoices').doc(invoiceId).withConverter(invoiceConverter);
    await invoiceRef.update(invoiceData);
    const updatedInvoiceDoc = await invoiceRef.get();
    return updatedInvoiceDoc.data() as Invoice;

}

export async function deleteInvoice(invoiceId: string): Promise<void> {
    const db = getFirebaseAdminDb();
    await db.collection('invoices').doc(invoiceId).delete();
}
