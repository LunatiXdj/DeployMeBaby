import { getFirebaseAdminDb } from '@/server/lib/firebase';
import { MaterialConsumption } from '@/shared/types';

const getMaterialConsumptionCollection = () => getFirebaseAdminDb().collection('materialConsumptions');

export const getMaterialConsumption = async (projectId: string, billed?: boolean): Promise<MaterialConsumption[]> => {
    const materialConsumptionCollection = getMaterialConsumptionCollection();
    let query: FirebaseFirestore.Query = materialConsumptionCollection.where('projectId', '==', projectId);

    if (typeof billed === 'boolean') {
        query = query.where('isBilled', '==', billed);
    }

    const snapshot = await query.get();
    if (snapshot.empty) {
        return [];
    }

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
    } as MaterialConsumption));
};

export const updateMaterialBilledStatusForProject = async (projectId: string): Promise<void> => {
    console.log(`Updating material consumption billed status for project: ${projectId}`);
    const materialConsumptionCollection = getMaterialConsumptionCollection();
    const snapshot = await materialConsumptionCollection.where('projectId', '==', projectId).where('isBilled', '==', false).get();

    if (snapshot.empty) {
        console.log(`No unbilled material consumption found for project ${projectId}.`);
        return;
    }

    const batch = getFirebaseAdminDb().batch();
    snapshot.docs.forEach(doc => {
        batch.update(doc.ref, { isBilled: true });
    });

    await batch.commit();
    console.log(`Successfully updated ${snapshot.size} documents to billed in project ${projectId}.`);
};

export const updateMaterialConsumptionBilledStatus = async (materialIds: string[], billed: boolean, invoiceId: string | null): Promise<void> => {
    const materialConsumptionCollection = getMaterialConsumptionCollection();
    const batch = getFirebaseAdminDb().batch();
    materialIds.forEach(id => {
        const docRef = materialConsumptionCollection.doc(id);
        batch.update(docRef, { isBilled: billed, invoiceId: invoiceId });
    });
    await batch.commit();
};
