
import { getFirebaseAdminDb } from '@/server/lib/firebaseAdmin';
import type { Employee } from '@/shared/types';
import { collection, getDocs, QueryDocumentSnapshot } from 'firebase-admin/firestore';

function getEmployeesCollection() {
    const db = getFirebaseAdminDb();
    return db.collection('employees');
}

function employeeFromDoc(doc: QueryDocumentSnapshot): Employee {
    const data = doc.data();
    const createdAt = data.createdAt;
    return {
        id: doc.id,
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        address: data.address || '',
        zipCode: data.zipCode || '',
        city: data.city || '',
        birthDate: data.birthDate || '',
        phone: data.phone || '',
        mobile: data.mobile || '',
        hasDriversLicense: data.hasDriversLicense || false,
        licenseClasses: data.licenseClasses || '',
        bankName: data.bankName || '',
        iban: data.iban || '',
        bic: data.bic || '',
        hourlyRate: data.hourlyRate || 0,
        taxId: data.taxId || '',
        socialSecurityNumber: data.socialSecurityNumber || '',
        healthInsuranceNumber: data.healthInsuranceNumber || '',
        photoUrl: data.photoUrl || '',
        contractUrl: data.contractUrl || '',
        documentUrls: data.documentUrls || [],
        createdAt: typeof createdAt === 'string' ? createdAt : createdAt?.toDate().toISOString() || new Date().toISOString(),
        email: data.email || '',
    };
}

export async function getEmployees(): Promise<Employee[]> {
    const snapshot = await getEmployeesCollection().get();
    return snapshot.docs.map(employeeFromDoc);
}
