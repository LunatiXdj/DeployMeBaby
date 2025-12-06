import { useFirebase } from '@/client/hooks/useFirebase';
import { getFirebaseStorage } from '@/client/lib/firebase';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import type { Quote, Customer, Project } from '@/shared/types';
import { useProjectService } from '@/client/services/projectService';
import { collection, getDocs, doc, getDoc, addDoc, setDoc, deleteDoc, query, orderBy, where, updateDoc, QueryDocumentSnapshot, limit, writeBatch } from 'firebase/firestore';

export function useQuoteService() {
    const firebase = useFirebase();
    const projectService = useProjectService();

    const db = firebase?.db;

    function getQuotesCollection() {
        if (!db) throw new Error("Firestore not initialized");
        return collection(db, 'quotes');
    }

    // Helper function to process a single document snapshot into a Quote object
    function quoteFromDoc(docSnapshot: QueryDocumentSnapshot, projectsMap: Map<string, Project>, customersMap: Map<string, Customer>): Quote {
        const data = docSnapshot.data();

        const project = data.projectId ? projectsMap.get(data.projectId) : undefined;
        let customer = data.customer; // Use embedded customer data if available
        if (!customer && project) {
            customer = customersMap.get(project.customerId) || undefined;
        }
        const createdAt = data.createdAt;

        return {
            id: docSnapshot.id,
            quoteNumber: data.quoteNumber || '',
            projectId: data.projectId || '',
            date: data.date,
            items: data.items || [],
            totalAmount: data.totalAmount || 0,
            status: data.status || 'draft',
            customer: customer || null,
            project: project || null,
            createdAt: typeof createdAt === 'string' ? createdAt : createdAt?.toDate().toISOString() || new Date().toISOString(),
        };
    }

    // Get all quotes, ordered by date - OPTIMIZED to avoid N+1 queries
    async function getQuotes(): Promise<Quote[]> {
        try {
            const q = query(getQuotesCollection(), orderBy('date', 'desc'));

            // Fetch all data in parallel
            const [quotesSnapshot, projects, customers] = await Promise.all([
                getDocs(q),
                projectService.getProjects(),
                // customerService.getCustomers()
            ]);

            // Create maps for efficient lookups
            const projectsMap = new Map<string, Project>(projects.map((p: Project) => [p.id, p]));
            const customersMap = new Map<string, Customer>(customers.map((c: Customer) => [c.id, c]));

            const quotes = quotesSnapshot.docs.map(doc => quoteFromDoc(doc, projectsMap, customersMap));

            return quotes;
        } catch (error) {
            console.error("Error in getQuotes:", error);
            throw error;
        }
    }

    // Get a single quote
    async function getQuote(id: string): Promise<Quote | null> {
        if (id === 'new') {
            return null; // Should be handled by createNewQuote
        }

        const [docSnap, projects, customers] = await Promise.all([
            getDoc(doc(getQuotesCollection(), id)),
            projectService.getProjects(),
            // customerService.getCustomers()
        ]);

        if (docSnap.exists()) {
            const projectsMap = new Map(projects.map(p => [p.id, p]));
            const customersMap = new Map(customers.map(c => [c.id, c]));
            return quoteFromDoc(docSnap as QueryDocumentSnapshot, projectsMap, customersMap);
        }
        return null;
    }

    // Create a new blank quote and return its ID
    async function createNewQuote(customerId?: string): Promise<string> {
        const quotesCollection = getQuotesCollection();
        let customerData = null;

        if (customerId) {
            const customer = await customerService.getCustomer(customerId);
            if (customer) {
                customerData = {
                    id: customer.id,
                    name: customer.name,
                    address: customer.address,
                    salutation: customer.salutation,
                    email: customer.email,
                }
            }
        }

        const newQuoteData = {
            quoteNumber: `AN-${new Date().getFullYear()}-`,
            projectId: '',
            date: new Date().toISOString().split('T')[0],
            items: [],
            totalAmount: 0,
            status: 'draft' as Quote['status'],
            customer: customerData, // Embed customer data
            createdAt: new Date(),
        };
        const docRef = await addDoc(quotesCollection, newQuoteData);

        // Update quote number with document ID
        const quoteNumber = `AN-${new Date().getFullYear()}-${docRef.id.substring(0, 4).toUpperCase()}`;
        await setDoc(docRef, { quoteNumber }, { merge: true });

        return docRef.id;
    }


    // Save a quote (update only)
    async function saveQuote(data: Quote): Promise<Quote> {
        const { id, customer, project, ...quoteData } = data;
        const quoteRef = doc(getQuotesCollection(), id);

        // Create an object with only the fields to be saved to Firestore
        const dataToSave = {
            ...quoteData,
            customer: customer ? { id: customer.id, name: customer.name, address: customer.address, salutation: customer.salutation, email: customer.email } : null,
        };

        await setDoc(quoteRef, dataToSave, { merge: true });

        // We need to refetch the data to populate project/customer for the return value
        const updatedQuote = await getQuote(id);
        if (!updatedQuote) throw new Error("Failed to refetch updated quote.");
        return updatedQuote;
    }

    // Delete a quote
    async function deleteQuote(id: string): Promise<void> {
        await deleteDoc(doc(getQuotesCollection(), id));
    }

    // Update quote status
    async function updateQuoteStatus(id: string, status: Quote['status']): Promise<void> {
        const quoteRef = doc(getQuotesCollection(), id);
        await updateDoc(quoteRef, { status });
    }

    const uploadSignature = async (quoteId: string, signatureDataUrl: string): Promise<string> => {
        const storage = getFirebaseStorage();
        const filePath = `signatures/${quoteId}.png`;
        const fileRef = ref(storage, filePath);

        try {
            // Upload the base64 data URL
            await uploadString(fileRef, signatureDataUrl, 'data_url');

            // Get the download URL
            const downloadURL = await getDownloadURL(fileRef);
            return downloadURL;
        } catch (error) {
            console.error("Failed to upload signature", error);
            throw new Error("Signature could not be uploaded.");
        }
    };

    // Find an accepted quote for a project that has not yet been invoiced
    async function findOpenAcceptedQuoteForProject(projectId: string): Promise<Quote | null> {
        const q = query(getQuotesCollection(),
            where('projectId', '==', projectId),
            where('status', '==', 'accepted'),
            limit(1));
        const snapshot = await getDocs(q);
        if (snapshot.empty) {
            return null;
        }

        // Re-use getQuote to ensure data consistency
        return await getQuote(snapshot.docs[0].id);
    }

    return {
        getQuotes,
        getQuote,
        createNewQuote,
        saveQuote,
        deleteQuote,
        updateQuoteStatus,
        uploadSignature,
        findOpenAcceptedQuoteForProject,
    };
}

// Top-level named exports for compatibility with existing imports
import { getFirebaseDb } from '@/client/lib/firebase';

export async function getQuotes(): Promise<Quote[]> {
    const db = getFirebaseDb();
    const q = query(collection(db, 'quotes'), orderBy('date', 'desc'));
    const [quotesSnapshot, projects, customers] = await Promise.all([
        getDocs(q),
        (await import('@/services/projectService')).getProjects(),
        (await import('@/services/customerService')).getCustomers(),
    ]);

    const projectsMap = new Map(projects.map((p: Project) => [p.id, p]));
    const customersMap = new Map(customers.map((c: Customer) => [c.id, c]));

    return quotesSnapshot.docs.map((d: QueryDocumentSnapshot) => {
        const data: any = d.data();
        const project = data.projectId ? projectsMap.get(data.projectId) : undefined;
        let customer = data.customer || null;
        if (!customer && project) customer = customersMap.get(project.customerId) || null;
        const createdAt = data.createdAt;
        return {
            id: d.id,
            quoteNumber: data.quoteNumber || '',
            projectId: data.projectId || '',
            date: data.date,
            items: data.items || [],
            totalAmount: data.totalAmount || 0,
            status: data.status || 'draft',
            customer: customer || null,
            project: project || null,
            createdAt: typeof createdAt === 'string' ? createdAt : createdAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
        } as Quote;
    });
}

export async function getQuote(id: string): Promise<Quote | null> {
    const db = getFirebaseDb();
    const docSnap = await getDoc(doc(db, 'quotes', id));
    if (!docSnap.exists()) return null;
    const projects = await (await import('@/services/projectService')).getProjects();
    const customers = await (await import('@/services/customerService')).getCustomers();
    const projectsMap = new Map(projects.map((p: Project) => [p.id, p]));
    const customersMap = new Map(customers.map((c: Customer) => [c.id, c]));
    const data: any = docSnap.data();
    const project = data.projectId ? projectsMap.get(data.projectId) : undefined;
    let customer = data.customer || null;
    if (!customer && project) customer = customersMap.get(project.customerId) || null;
    const createdAt = data.createdAt;
    return {
        id: docSnap.id,
        quoteNumber: data.quoteNumber || '',
        projectId: data.projectId || '',
        date: data.date,
        items: data.items || [],
        totalAmount: data.totalAmount || 0,
        status: data.status || 'draft',
        customer: customer || null,
        project: project || null,
        createdAt: typeof createdAt === 'string' ? createdAt : createdAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
    } as Quote;
}

export async function createNewQuote(customerId?: string): Promise<string> {
    const db = getFirebaseDb();
    const quotesCollection = collection(db, 'quotes');
    let customerData = null;
    if (customerId) {
        const customer = await (await import('@/services/customerService')).getCustomer(customerId);
        if (customer) {
            customerData = { id: customer.id, name: customer.name, address: customer.address, salutation: customer.salutation, email: customer.email };
        }
    }
    const newQuoteData = {
        quoteNumber: `AN-${new Date().getFullYear()}-`,
        projectId: '',
        date: new Date().toISOString().split('T')[0],
        items: [],
        totalAmount: 0,
        status: 'draft' as Quote['status'],
        customer: customerData,
        createdAt: new Date(),
    };
    const docRef = await addDoc(quotesCollection, newQuoteData);
    const quoteNumber = `AN-${new Date().getFullYear()}-${docRef.id.substring(0, 4).toUpperCase()}`;
    await setDoc(docRef, { quoteNumber }, { merge: true });
    return docRef.id;
}

export async function saveQuote(data: Quote): Promise<Quote> {
    const db = getFirebaseDb();
    const { id, customer, project, ...quoteData } = data;
    const quoteRef = doc(db, 'quotes', id);
    const dataToSave = { ...quoteData, customer: customer ? { id: customer.id, name: customer.name, address: customer.address, salutation: customer.salutation, email: customer.email } : null };
    await setDoc(quoteRef, dataToSave, { merge: true });
    return await getQuote(id) as Quote;
}

export async function deleteQuote(id: string): Promise<void> {
    const db = getFirebaseDb();
    await deleteDoc(doc(db, 'quotes', id));
}

export async function uploadSignature(quoteId: string, signatureDataUrl: string): Promise<string> {
    const storage = await (await import('@/client/lib/firebase')).getFirebaseStorage();
    if (!storage) throw new Error("Firebase Storage not initialized");
    const { ref, uploadString, getDownloadURL } = await import('firebase/storage');
    const filePath = `signatures/${quoteId}.png`;
    const fileRef = ref(storage, filePath);

    try {
        await uploadString(fileRef, signatureDataUrl, 'data_url');
        const downloadURL = await getDownloadURL(fileRef);
        return downloadURL;
    } catch (error) {
        console.error("Failed to upload signature", error);
        throw new Error("Signature could not be uploaded.");
    }
}
