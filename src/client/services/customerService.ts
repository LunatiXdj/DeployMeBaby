import { getFirebaseDb } from '@/client/lib/firebase';
import type { Customer, Project, Quote, Invoice, TimeEntry, Employee, ContactLogEntry } from '@/shared/types';

export interface CustomerDetails {
    customer: Customer;
    projects: Project[];
    quotes: Quote[];
    invoices: Invoice[];
    timeEntries: (TimeEntry & { cost: number; employeeName: string; projectName: string })[];
}

async function withFirestore() {
    const db = getFirebaseDb();
    const { collection, getDocs, doc, getDoc, addDoc, setDoc, deleteDoc, query, where, orderBy, writeBatch, limit, QueryDocumentSnapshot, updateDoc, arrayUnion } = await import('firebase/firestore');
    return { db, collection, getDocs, doc, getDoc, addDoc, setDoc, deleteDoc, query, where, orderBy, writeBatch, limit, QueryDocumentSnapshot, updateDoc, arrayUnion };
}

function customerFromDoc(doc: any): Customer {
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
        city: data.city || '',
        zip: data.zip || '',
    };
}

export async function getCustomers(): Promise<Customer[]> {
    const { db, collection, query, orderBy, getDocs } = await withFirestore();
    const customersCollection = collection(db, 'customers');
    const q = query(customersCollection, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    const validDocs = snapshot.docs.filter(doc => doc.exists() && Object.keys(doc.data()).length > 0);

    return validDocs.map(doc => customerFromDoc(doc));
}

export async function getCustomer(id: string): Promise<Customer | null> {
    const { db, doc, getDoc } = await withFirestore();
    const docRef = doc(db, 'customers', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists() && Object.keys(docSnap.data()).length > 0) {
        return customerFromDoc(docSnap);
    }
    return null;
}


export async function saveCustomer(id: string | null, data: Partial<Omit<Customer, 'id' | 'createdAt'>>): Promise<Customer> {
    const { db, collection, doc, setDoc, getDoc, addDoc } = await withFirestore();
    const customersCollection = collection(db, 'customers');
    if (id) {
        const customerRef = doc(customersCollection, id);
        await setDoc(customerRef, data, { merge: true });
        const updatedDoc = await getDoc(customerRef);
        return customerFromDoc(updatedDoc);
    } else {
        const newCustomerData = {
            projectIds: [],
            openBalance: 0,
            dunningLevel: 0,
            dunningLevelReached: false,
            status: 'active',
            contactLog: [],
            ...data,
            createdAt: new Date(),
        }
        const docRef = await addDoc(customersCollection, newCustomerData);
        const newDoc = await getDoc(docRef);
        return customerFromDoc(newDoc);
    }
}

export async function deleteCustomer(id: string): Promise<void> {
    const { db, doc, deleteDoc } = await withFirestore();
    await deleteDoc(doc(db, 'customers', id));
}

export async function addContactLogEntry(customerId: string, entry: Omit<ContactLogEntry, 'id'>): Promise<void> {
    const { db, doc, collection, updateDoc, arrayUnion } = await withFirestore();
    const customerRef = doc(db, 'customers', customerId);
    const newEntryWithId = { ...entry, id: doc(collection(db, 'dummy')).id };
    await updateDoc(customerRef, {
        contactLog: arrayUnion(newEntryWithId)
    });
}

export async function getCustomerDetails(customerId: string): Promise<CustomerDetails | null> {
    const { db, collection, query, where, getDocs } = await withFirestore();
    const customer = await getCustomer(customerId);
    if (!customer) {
        return null;
    }

    const [
        projectsSnapshot,
        quotesSnapshot,
        invoicesSnapshot,
        employeesSnapshot
    ] = await Promise.all([
        getDocs(query(collection(db, 'projects'), where('customerId', '==', customerId))),
        getDocs(query(collection(db, 'quotes'), where('customer.id', '==', customerId))),
        getDocs(query(collection(db, 'invoices'), where('customer.id', '==', customerId))),
        getDocs(collection(db, 'employees'))
    ]);

    const projects = projectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as Omit<Project, 'id'> }) as Project);
    const projectIds = projects.map(p => p.id);

    const quotes = quotesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Quote));
    const invoices = invoicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invoice));
    const employees = employeesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee));
    const employeesMap = new Map(employees.map(e => [e.id, e]));
    const projectsMap = new Map(projects.map(p => [p.id, p]));

    let timeEntriesForCustomer: (TimeEntry & { cost: number; employeeName: string; projectName: string })[] = [];

    if (projectIds.length > 0) {
        const timeEntriesQuery = query(collection(db, 'timeEntries'), where('projectId', 'in', projectIds));
        const timeEntriesSnapshot = await getDocs(timeEntriesQuery);

        timeEntriesForCustomer = timeEntriesSnapshot.docs.map(d => {
            const entryData = d.data() as Omit<TimeEntry, 'id'>;
            const employee = employeesMap.get(entryData.employeeId);
            const project = projectsMap.get(entryData.projectId);
            const cost = 0; // Placeholder
            return {
                id: d.id,
                ...entryData,
                cost,
                employeeName: employee ? `${employee.firstName} ${employee.lastName}` : 'Unbekannt',
                projectName: project ? project.projectName : 'Unbekannt'
            };
        });
    }

    return {
        customer,
        projects,
        quotes,
        invoices,
        timeEntries: timeEntriesForCustomer.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    };
}
