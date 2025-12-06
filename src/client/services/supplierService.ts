
import { Supplier } from '@/shared/types';
import { getFirebaseDb } from '@/client/lib/firebase';

async function withFirestoreHelpers() {
    const db = await getFirebaseDb();
    const mod = await import('firebase/firestore');
    // Pull only the helpers we need from the runtime import
    const { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } = mod as any;
    return { db, collection, getDocs, addDoc, updateDoc, deleteDoc, doc } as const;
}

const mapDocToSupplier = (doc: any): Supplier => ({
    id: doc.id,
    name: doc.data().name,
    contactPerson: doc.data().contactPerson,
    address: doc.data().address,
    phone: doc.data().phone,
    email: doc.data().email,
    website: doc.data().website,
});

export const getSuppliers = async (): Promise<Supplier[]> => {
    const { db, collection, getDocs } = await withFirestoreHelpers();
    const supplierCollection = collection(db, 'suppliers');
    const snapshot = await getDocs(supplierCollection);
    return snapshot.docs.map(mapDocToSupplier);
};

export const saveSupplier = async (supplier: Omit<Supplier, 'id'>, id?: string): Promise<Supplier> => {
    const { db, collection, addDoc, updateDoc, doc } = await withFirestoreHelpers();
    const supplierCollection = collection(db, 'suppliers');
    if (id) {
        const supplierDoc = doc(db, 'suppliers', id);
        await updateDoc(supplierDoc, supplier);
        return { ...supplier, id };
    } else {
        const docRef = await addDoc(supplierCollection, supplier);
        return { ...supplier, id: docRef.id };
    }
};

export const deleteSupplier = async (id: string): Promise<void> => {
    const { db, doc, deleteDoc } = await withFirestoreHelpers();
    const supplierDoc = doc(db, 'suppliers', id);
    await deleteDoc(supplierDoc);
};
