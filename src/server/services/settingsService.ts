
// cache-busting comment
import { unstable_noStore as noStore } from 'next/cache';
import { getFirebaseAdminDb } from '@/server/lib/firebase';
import type { CompanySettings } from '@/shared/types';

const SETTINGS_COLLECTION = 'settings';
const MAIN_SETTINGS_DOC_ID = 'main';

function getSettingsDocRef() {
    const adminDb = getFirebaseAdminDb();
    return adminDb.collection(SETTINGS_COLLECTION).doc(MAIN_SETTINGS_DOC_ID);
}

export async function getCompanySettings(): Promise<CompanySettings> {
    noStore(); // This will disable caching for this function
    const docRef = getSettingsDocRef();
    const docSnap = await docRef.get();
    if (docSnap.exists) {
        const data = docSnap.data();
        return {
            companyName: data?.companyName || 'PH-Service',
            ownerName: data?.ownerName || 'Phillip Hüting',
            address: data?.address || 'Alte Poststraße 1a, 46459 Rees',
            phone: data?.phone || '02857 959 0 816',
            email: data?.email || 'info@ph-service.de',
            website: data?.website || 'https://ph-service.works',
            taxId: data?.taxId || '',
            vatId: data?.vatId || '',
            bankName: data?.bankName || '',
            iban: data?.iban || '',
            bic: data?.bic || '',
            logoUrl: data?.logoUrl || '',
        };
    }
    return {
        companyName: 'PH-Service',
        ownerName: 'Phillip Hüting',
        address: 'Alte Poststraße 1a, 46459 Rees',
        phone: '0123 456789',
        email: 'info@ph-service.de',
        website: 'https://ph-service.de',
        taxId: '',
        vatId: '',
        bankName: '',
        iban: '',
        bic: '',
        logoUrl: '',
    };
}

export async function saveCompanySettings(data: CompanySettings): Promise<void> {
    const docRef = getSettingsDocRef();
    await docRef.set(data, { merge: true });
}
