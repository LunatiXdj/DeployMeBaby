import { db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc, addDoc, setDoc, deleteDoc, query, orderBy, where, updateDoc, QueryDocumentSnapshot, limit, writeBatch } from 'firebase/firestore';
import { useFirebase } from '@/client/hooks/useFirebase';
import type { Invoice, Quote, Customer, Project } from '@/shared/types';
import { useProjectService } from '@/client/services/projectService';

export const useInvoiceService = () => {
    const firebase = useFirebase();
    const projectService = useProjectService();

    const db = firebase?.db;

    //... (other functions are unchanged)

    const createInvoiceFromQuote = async (quote: Quote): Promise<Invoice> => {
        if (!db) throw new Error("Firestore not initialized");
        const quoteRef = doc(db, 'quotes', quote.id);

        const newInvoiceData = {
            invoiceNumber: `RE-${new Date().getFullYear()}-`,
            projectId: quote.projectId,
            date: new Date().toISOString().split('T')[0],
            items: quote.items,
            totalAmount: quote.totalAmount,
            status: 'offen' as Invoice['status'],
            customer: quote.customer,
            quoteId: quote.id,
            createdAt: new Date(),
        };

        const invoiceCollection = collection(db, 'invoices');
        const invoiceRef = await addDoc(invoiceCollection, newInvoiceData);

        const batch = writeBatch(db);
        batch.update(quoteRef, { status: 'invoiced' });
        batch.update(invoiceRef, { invoiceNumber: `RE-${new Date().getFullYear()}-${invoiceRef.id.substring(0, 4).toUpperCase()}` });
        await batch.commit();

        const newInvoice = await getInvoice(invoiceRef.id);
        if (!newInvoice) {
            throw new Error("Failed to create invoice");
        }
        return newInvoice;
    }

    return {
        getInvoices,
        getInvoice,
        saveInvoice,
        deleteInvoice,
        createBlankInvoice,
        createInvoiceFromQuote,
    };
}

// Backwards-compatible named exports using lazy client getter
import { getFirebaseDb } from '@/client/lib/firebase';

export async function getInvoices(): Promise<Invoice[]> {
    const db = getFirebaseDb();
    const q = query(collection(db, 'invoices'), orderBy('date', 'desc'));

    // For simplicity reuse the hook logic minimally: fetch projects/customers via existing services
    // Note: these top-level helpers depend on other top-level functions existing (projectService, customerService)
    const [invoiceSnapshot, projects, customers] = await Promise.all([
        getDocs(q),
        (await import('@/services/projectService')).getProjects(),
        (await import('@/services/customerService')).getCustomers(),
    ]);

    const projectsMap = new Map(projects.map((p: Project) => [p.id, p]));
    const customersMap = new Map(customers.map((c: Customer) => [c.id, c]));

    return invoiceSnapshot.docs.map((d: QueryDocumentSnapshot) => {
        const data: any = d.data();
        const project = data.projectId ? projectsMap.get(data.projectId) : undefined;
        const customer = project ? customersMap.get(project.customerId) : undefined;
        
        // Convert Firestore Timestamps to ISO strings
        const createdAt = data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt;
        const sentAt = data.sentAt?.toDate ? data.sentAt.toDate().toISOString() : data.sentAt;
        
        return { id: d.id, ...data, createdAt, sentAt, project: project || null, customer: customer || null } as Invoice;
    });
}

export async function getInvoice(id: string): Promise<Invoice | null> {
    const db = getFirebaseDb();
    const docRef = doc(db, 'invoices', id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;

    const projects = await (await import('@/services/projectService')).getProjects();
    const customers = await (await import('@/services/customerService')).getCustomers();
    const projectsMap = new Map(projects.map((p: Project) => [p.id, p]));
    const customersMap = new Map(customers.map((c: Customer) => [c.id, c]));
    const data: any = docSnap.data();
    const project = data.projectId ? projectsMap.get(data.projectId) : undefined;
    const customer = project ? customersMap.get(project.customerId) : undefined;
    
    // Convert Firestore Timestamps to ISO strings
    const createdAt = data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt;
    const sentAt = data.sentAt?.toDate ? data.sentAt.toDate().toISOString() : data.sentAt;
    
    return { id: docSnap.id, ...data, createdAt, sentAt, project: project || null, customer: customer || null } as Invoice;
}

export async function deleteInvoice(id: string): Promise<void> {
    const db = getFirebaseDb();
    await deleteDoc(doc(db, 'invoices', id));
}

export async function createBlankInvoice(customerId: string, customerName: string): Promise<string> {
    const db = getFirebaseDb();
    const newInvoiceData = {
        invoiceNumber: `RE-${new Date().getFullYear()}-`,
        projectId: '',
        date: new Date().toISOString().split('T')[0],
        items: [],
        totalAmount: 0,
        status: 'draft' as Invoice['status'],
        customer: { id: customerId, name: customerName },
        createdAt: new Date(),
    };
    const docRef = await addDoc(collection(db, 'invoices'), newInvoiceData);
    await setDoc(docRef, { invoiceNumber: `RE-${new Date().getFullYear()}-${docRef.id.substring(0, 4).toUpperCase()}` }, { merge: true });
    return docRef.id;
}

export async function createInvoiceFromQuote(quoteId: string): Promise<Invoice> {
    const db = getFirebaseDb();
    const quoteRef = doc(db, 'quotes', quoteId);
    const quoteSnap = await getDoc(quoteRef);
    if (!quoteSnap.exists()) throw new Error('Quote not found');
    const quote = quoteSnap.data() as Quote;

    const newInvoiceData = {
        invoiceNumber: `RE-${new Date().getFullYear()}-`,
        projectId: quote.projectId,
        date: new Date().toISOString().split('T')[0],
        items: quote.items,
        totalAmount: quote.totalAmount,
        status: 'offen' as Invoice['status'],
        customer: quote.customer,
        quoteId: quoteId,
        createdAt: new Date(),
    };

    const invoiceCollection = collection(db, 'invoices');
    const invoiceRef = await addDoc(invoiceCollection, newInvoiceData);

    const batch = writeBatch(db);
    batch.update(quoteRef, { status: 'invoiced' });
    batch.update(invoiceRef, { invoiceNumber: `RE-${new Date().getFullYear()}-${invoiceRef.id.substring(0, 4).toUpperCase()}` });
    await batch.commit();

    const newInvoice = await getInvoice(invoiceRef.id);
    if (!newInvoice) throw new Error('Failed to create invoice');
    return newInvoice;
}

export async function createInvoiceFromMaterials(projectId: string): Promise<Invoice> {
    const db = getFirebaseDb();
    // Find material orders for projectId and convert to invoice items
    const ordersSnapshot = await getDocs(query(collection(db, 'materialOrders'), where('projectId', '==', projectId), where('status', '==', 'submitted')));
    const items: any[] = [];
    let total = 0;
    for (const d of ordersSnapshot.docs) {
        const data: any = d.data();
        if (Array.isArray(data.items)) {
            for (const it of data.items) {
                const line = {
                    description: it.description || it.name || 'Material',
                    quantity: it.quantity || 1,
                    unitPrice: it.unitPrice || it.price || 0,
                    total: (it.quantity || 1) * (it.unitPrice || it.price || 0),
                };
                total += line.total;
                items.push(line);
            }
        }
    }

    // Create invoice document
    const newInvoiceData = {
        invoiceNumber: await getNextInvoiceNumber(db),
        projectId,
        date: new Date().toISOString().split('T')[0],
        items,
        totalAmount: total,
        status: 'offen' as Invoice['status'],
        createdAt: new Date(),
    };

    const invoiceCollection = collection(db, 'invoices');
    const invoiceRef = await addDoc(invoiceCollection, newInvoiceData);
    await setDoc(invoiceRef, { invoiceNumber: `RE-${new Date().getFullYear()}-${invoiceRef.id.substring(0, 4).toUpperCase()}` }, { merge: true });

    const newInvoice = await getInvoice(invoiceRef.id);
    if (!newInvoice) throw new Error('Failed to create invoice from materials');
    return newInvoice;
}

export async function createInvoiceFromTimeEntries(projectId: string): Promise<Invoice> {
    const db = getFirebaseDb();
    // Gather time entries for the project that are billable
    const entriesSnapshot = await getDocs(query(collection(db, 'timeEntries'), where('projectId', '==', projectId), where('billed', '==', false)));
    const items: any[] = [];
    let total = 0;
    for (const d of entriesSnapshot.docs) {
        const data: any = d.data();
        const hours = data.totalTime || data.hours || 0;
        const rate = data.hourlyRate || data.rate || 0;
        const lineTotal = hours * rate;
        const line = {
            description: data.description || `Arbeitszeit: ${data.employeeId || 'Mitarbeiter'}`,
            quantity: hours,
            unitPrice: rate,
            total: lineTotal,
        };
        total += lineTotal;
        items.push(line);
    }

    const newInvoiceData = {
        invoiceNumber: await getNextInvoiceNumber(db),
        projectId,
        date: new Date().toISOString().split('T')[0],
        items,
        totalAmount: total,
        status: 'offen' as Invoice['status'],
        createdAt: new Date(),
    };

    const invoiceCollection = collection(db, 'invoices');
    const invoiceRef = await addDoc(invoiceCollection, newInvoiceData);
    await setDoc(invoiceRef, { invoiceNumber: `RE-${new Date().getFullYear()}-${invoiceRef.id.substring(0, 4).toUpperCase()}` }, { merge: true });

    const newInvoice = await getInvoice(invoiceRef.id);
    if (!newInvoice) throw new Error('Failed to create invoice from time entries');
    return newInvoice;
}

// Backwards-compatible top-level create/update helpers
export async function createInvoice(invoiceData: Partial<Invoice>): Promise<Invoice> {
    const db = getFirebaseDb();
    const docRef = await addDoc(collection(db, 'invoices'), { ...invoiceData, createdAt: new Date() });
    const invoiceNumber = await getNextInvoiceNumber(db);
    await setDoc(docRef, { invoiceNumber }, { merge: true });
    const created = await getInvoice(docRef.id);
    if (!created) throw new Error('Failed to create invoice');
    return created;
}

export async function updateInvoice(invoiceId: string, invoiceData: Partial<Invoice>): Promise<Invoice> {
    const db = getFirebaseDb();
    const docRef = doc(db, 'invoices', invoiceId);
    await setDoc(docRef, invoiceData as any, { merge: true });
    const updated = await getInvoice(invoiceId);
    if (!updated) throw new Error('Failed to update invoice');
    return updated;
}

// Alias for backward compatibility
export const saveInvoice = updateInvoice;
