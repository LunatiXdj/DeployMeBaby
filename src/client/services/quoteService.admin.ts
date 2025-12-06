import { adminDb } from '@/server/lib/firebase-admin';
import type { Quote, Customer, Project } from '@/shared/types';
import { getProjectsAdmin } from '@/client/services/projectService.admin';
import { getCustomersAdmin } from '@/client/services/customerService.admin';
import { QueryDocumentSnapshot } from 'firebase-admin/firestore';

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
export async function getQuotesAdmin(): Promise<Quote[]> {
  try {
    const quotesCollection = adminDb.collection('quotes');
    const q = quotesCollection.orderBy('date', 'desc');
    
    // Fetch all data in parallel
    const [quotesSnapshot, projects, customers] = await Promise.all([
      q.get(),
      getProjectsAdmin(),
      getCustomersAdmin()
    ]);

    // Create maps for efficient lookups
    const projectsMap = new Map(projects.map(p => [p.id, p]));
    const customersMap = new Map(customers.map(c => [c.id, c]));

    const quotes = quotesSnapshot.docs.map(doc => quoteFromDoc(doc, projectsMap, customersMap));

    return quotes;
  } catch (error) {
    console.error("Error in getQuotesAdmin:", error);
    throw error;
  }
}
