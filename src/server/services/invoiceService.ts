
import { getFirebaseAdminDb } from '@/server/lib/firebaseAdmin';
import type { Invoice, Project, Customer } from '@/shared/types';
import { Timestamp, DocumentData, QueryDocumentSnapshot, DocumentSnapshot } from 'firebase-admin/firestore';
import { getProject } from './projectService.admin';
import { getCustomer } from './customerService.admin';

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
    fromFirestore(snapshot: QueryDocumentSnapshot): Invoice {
        const data = snapshot.data();
        return {
            id: snapshot.id,
            ...data,
            createdAt: toISOStringOrUndefined(data.createdAt),
            sentAt: toISOStringOrUndefined(data.sentAt),
        } as Invoice;
    }
};

async function enrichInvoiceWithRelations(invoice: Invoice): Promise<Invoice> {
    let project: Project | null = null;
    if (invoice.projectId) {
        try {
            project = await getProject(invoice.projectId);
        } catch (error) {
            console.error(`Failed to enrich invoice ${invoice.id} with project ${invoice.projectId}:`, error);
        }
    }

    let finalCustomer: Customer | null = null;
    const customerId = project?.customerId || (invoice.customer as any)?.id;

    if (customerId) {
        try {
            finalCustomer = await getCustomer(customerId);
        } catch (error) {
            console.error(`Failed to enrich invoice ${invoice.id} with customer ${customerId}:`, error);
            finalCustomer = invoice.customer || null; // Fallback to embedded
        }
    } else {
        finalCustomer = invoice.customer || null;
    }

    return {
        ...invoice,
        project: project || undefined,
        customer: finalCustomer || undefined,
    };
}


export async function getInvoices(): Promise<Invoice[]> {
    try {
        const db = getFirebaseAdminDb();
        const snapshot = await db.collection('invoices').withConverter(invoiceConverter).orderBy('date', 'desc').get();
        
        const invoices = await Promise.all(snapshot.docs.map(doc => 
            enrichInvoiceWithRelations(doc.data())
        ));
        
        return invoices;
    } catch (error) {
        console.error("Failed to fetch invoices:", error);
        return [];
    }
}

export async function getInvoice(invoiceId?: string | null): Promise<Invoice | null> {
    if (!invoiceId) {
        console.error("getInvoice called with no ID.");
        return null;
    }

    try {
        const db = getFirebaseAdminDb();
        const invoiceDoc = await db.collection('invoices').doc(invoiceId).withConverter(invoiceConverter).get();

        if (!invoiceDoc.exists) {
            console.warn(`Invoice document with ID ${invoiceId} not found.`);
            return null;
        }

        return enrichInvoiceWithRelations(invoiceDoc.data());

    } catch (error) {
        console.error(`Critical error fetching invoice with ID ${invoiceId}:`, error);
        return null;
    }
}
