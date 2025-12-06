
import { getFirebaseAdminDb } from '@/server/lib/firebaseAdmin';
import type { Quote, Customer, Project } from '@/shared/types';
import { getAllProjects, getProject } from '@/server/services/projectService.admin';
import { getCustomers, getCustomer } from '@/server/services/customerService.admin';
import { QueryDocumentSnapshot, DocumentSnapshot, Timestamp } from 'firebase-admin/firestore';

const toISOStringOrUndefined = (date: any): string | undefined => {
    if (!date) return undefined;
    if (typeof date === 'string') return date;
    if (date.toDate) return date.toDate().toISOString();
    return undefined;
}

async function enrichQuotesWithRelations(quotesData: Omit<Quote, 'id'>[]): Promise<Quote[]> {
    const projectIds = [...new Set(quotesData.map(q => q.projectId).filter(id => id))];
    const customerIdsFromQuotes = [...new Set(quotesData.flatMap(q => q.customer ? [q.customer.id] : []))];
    
    const [projects, customers] = await Promise.all([
        projectIds.length > 0 ? getAllProjects() : Promise.resolve([]),
        customerIdsFromQuotes.length > 0 ? getCustomers(customerIdsFromQuotes) : Promise.resolve([]),
    ]);

    const projectsMap = new Map(projects.map((p: Project) => [p.id, p]));
    const customersMap = new Map(customers.map((c: Customer) => [c.id, c]));

    const customerIdsFromProjects = projects.map((p: Project) => p.customerId).filter((id: string | undefined) => id && !customersMap.has(id));
    if (customerIdsFromProjects.length > 0) {
        const additionalCustomers = await getCustomers(customerIdsFromProjects as string[]);
        additionalCustomers.forEach((c: Customer) => customersMap.set(c.id, c));
    }
    
    return quotesData.map(quoteData => {
        const project = quoteData.projectId ? projectsMap.get(quoteData.projectId) || null : null;
        const customer = quoteData.customer?.id ? customersMap.get(quoteData.customer.id) 
            : (project?.customerId ? customersMap.get(project.customerId) : null);

        return {
            ...quoteData,
            createdAt: toISOStringOrUndefined(quoteData.createdAt),
            project,
            customer,
        } as Quote;
    });
}

export async function getQuotesAdmin(): Promise<Quote[]> {
  try {
    const adminDb = getFirebaseAdminDb();
    const quotesSnapshot = await adminDb.collection('quotes').orderBy('date', 'desc').get();
    
    const quotesData = quotesSnapshot.docs.map(doc => doc.data() as Omit<Quote, 'id'>);
    
    const enrichedQuotes = await enrichQuotesWithRelations(quotesData);

    return enrichedQuotes.map((quote, index) => ({
      ...quote,
      id: quotesSnapshot.docs[index].id,
    }));
  } catch (error) {
    console.error("Error in getQuotesAdmin:", error);
    throw error;
  }
}

export async function getQuoteAdmin(quoteId?: string | null): Promise<Quote | null> {
    if (!quoteId) return null;

    const db = getFirebaseAdminDb();
    const quoteDoc = await db.collection('quotes').doc(quoteId).get();

    if (!quoteDoc.exists) {
        return null;
    }

    const quoteData = quoteDoc.data() as Omit<Quote, 'id'>;
    const [enrichedQuote] = await enrichQuotesWithRelations([quoteData]);
    
    return {
        ...enrichedQuote,
        id: quoteDoc.id,
    };
}
