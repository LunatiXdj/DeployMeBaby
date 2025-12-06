
import { getFirebaseAdminDb } from '@/server/lib/firebaseAdmin';
import type { MaterialOrder } from '@/shared/types';
import { FieldValue } from 'firebase-admin/firestore';

const materialOrderConverter = {
    toFirestore(data: MaterialOrder): FirebaseFirestore.DocumentData {
        return data;
    },
    fromFirestore(snapshot: FirebaseFirestore.QueryDocumentSnapshot): MaterialOrder {
        const data = snapshot.data();
        return {
            ...data,
            id: snapshot.id,
            // Ensure timestamps are converted correctly if needed, though Firestore handles them
        } as MaterialOrder;
    }
};

/**
 * Fetches material orders for a given project.
 */
export async function getMaterialOrdersForProject(projectId: string): Promise<MaterialOrder[]> {
    const db = getFirebaseAdminDb();
    const ordersCollection = db.collection('materialOrders')
                               .where('projectId', '==', projectId)
                               .withConverter(materialOrderConverter);
    
    const snapshot = await ordersCollection.get();
    if (snapshot.empty) {
        return [];
    }
    return snapshot.docs.map(doc => doc.data());
}

/**
 * Creates a new material order in Firestore.
 */
export async function createMaterialOrder(orderData: Omit<MaterialOrder, 'id'>): Promise<MaterialOrder> {
    const db = getFirebaseAdminDb();
    const ordersCollection = db.collection('materialOrders').withConverter(materialOrderConverter);
    
    const newOrderRef = await ordersCollection.add({
        ...orderData,
        createdAt: FieldValue.serverTimestamp(), // Let the server set the creation time
    });

    const newOrderSnapshot = await newOrderRef.get();
    return newOrderSnapshot.data()!;
}
